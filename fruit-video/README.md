# SHIFT HAPPENS

Animated fruit soap operas about a nurse's 3-11 shift at Fruit Bowl Rehab & Nursing.
Vertical 1080x1920, 30 fps, voiced, with captions. Made to be texted to a nurse.

| Episode | Watch | Length |
|---|---|---|
| 1: The 3-11 | [`shift-happens.mp4`](shift-happens.mp4) | 2:44 |
| 2: Survey Says | [`shift-happens-ep2.mp4`](shift-happens-ep2.mp4) | 2:22 |
| 3: The Holiday Schedule | [`shift-happens-ep3.mp4`](shift-happens-ep3.mp4) | 2:17 |
| 4: The New Grad | [`shift-happens-ep4.mp4`](shift-happens-ep4.mp4) | 2:09 |
| 5: Full Moon | [`shift-happens-ep5.mp4`](shift-happens-ep5.mp4) | 2:59 |
| 6: Alarm Fatigue | [`shift-happens-ep6.mp4`](shift-happens-ep6.mp4) | 3:04 |
| 7: The Actual Full Moon | [`shift-happens-ep7.mp4`](shift-happens-ep7.mp4) | 2:56 |
| 8: The Double Shift | [`shift-happens-ep8.mp4`](shift-happens-ep8.mp4) | 2:06 |
| 9: The Agency Nurse | [`shift-happens-ep9.mp4`](shift-happens-ep9.mp4) | 2:13 |
| 10: Two Weeks' Notice | [`shift-happens-ep10.mp4`](shift-happens-ep10.mp4) | 2:30 |
| 11: Welcome Back | [`shift-happens-ep11.mp4`](shift-happens-ep11.mp4) | 2:13 |
| 12: The In-Service | [`shift-happens-ep12.mp4`](shift-happens-ep12.mp4) | 2:36 |
| 13: The Float Pool | [`shift-happens-ep13.mp4`](shift-happens-ep13.mp4) | 2:52 |

To play an episode live in the browser, start a local server in this directory and open
`http://localhost:8000/index.html?ep=5` (change `ep` to 1 through 13 for other episodes):

```bash
python3 -m http.server 8000
```

## Episode 2: Survey Says

"Mr. Stateman is in the lobby." The state surveyor (a Starfruit) arrives, and for one afternoon the
building follows every rule: the Administrator (a Melon in a suit) appears with pizza, five agency Kiwis
materialize, hand hygiene hits 47, nobody crushes the ER, and Mr. Banana's fall gets stopped in slow motion.
Then the surveyor leaves, the Kiwis vanish, the pizza goes back, and the survey finds exactly one deficiency:
F-761, Grapefruit in the med fridge.

Episode 2 moves every caption, clock and title into a panel under the picture, so text never sits on the action.

## Episode 3: The Holiday Schedule

October 1st: the holiday schedule goes up, and Strawberry is on every holiday. "It's the rotation."
Cherry put her request in on January 1st at 12:01 AM. The Scheduler (a Fig in a fedora) makes an offer
nobody can refuse. The company thanks its holiday heroes with one pen, to share. Then a montage: at
Thanksgiving Mrs. Cranberry meets the cranberry sauce (cousin Doris); on Christmas the Administrator says
"nice and quiet" and every call light comes on; on New Year's Eve Dr. Apple returns a page from Thanksgiving.
At 12:05 AM, next year's schedule is posted.

## Episode 4: The New Grad

Clementine arrives: licensed six days ago, passed her boards at 85 questions, price tag still on her stethoscope.
Orientation is three days of videos, then forty residents ("We don't eat our young. We just give them the heaviest
assignment."). She daydreams of NCLEX Land, where every nurse has one patient and Dr. Apple is already there.
Strawberry teaches her three rules (never say the Q word, always check the baseline, never lend your pen), her first
med pass takes four hours, she says "Sure!" to everyone, and she pages Dr. Apple because the blueberry is blue.
Then night shift calls out, and that is how marmalade is made.

## Episode 5: Full Moon

The Moon takes the night shift personally: every problem gets blamed on him, so he starts keeping score.
Strawberry's break lasts four seconds, Mr. Pear has the only protected break in the building, and CNA Mango
leads a quest for the one blood pressure cuff that works. A runaway laundry cart, a dying computer on wheels,
and a changed Wi-Fi password bring the score to seven. The real cause is staffing; the Moon is not even full
until tomorrow. Night Nurse Dragonfruit arrives rested, and the Sun claims sundowning in the post-credits scene.

## Episode 6: Alarm Fatigue

Thirty-one alarms are going off and four of them matter. Nurse Strawberry can tell them apart by pitch (the chair
alarm is joyful, the IV pump is always the tubing) and CNA Mango has just found the silence button. The overhead page
announces the alarms are forty percent quieter, not fewer. At 6:30 PM the unit goes silent, and then one chirp starts
coming from nowhere: a hunt through the rooms, a laundry cart and a human stack on the ceiling ends with a 9-volt battery
pulled out of a smoke detector. At 7:00 PM the microwave dings and every nurse in the building stampedes to answer it.
At 7:05 the Fire Marshal (a Pomegranate in a very large helmet) arrives to ask who is in charge. The post-credits scene
is a parking lot, a full moon coming up, and the number thirty-three.

Episode 6 is built on a new opt-in renderer (`v2_core.js`, `v2_char.js`) and is the first episode held to a hard layout gate:
true one-point-perspective sets, per-scene lighting and bloom, motion blur, shaded two-bone arms with real hands, and a
score and stereo sound design written for the picture. Episodes 1 to 5 render exactly as before.

## Episode 7: The Actual Full Moon

Episode 6 ended on the number thirty-three and a full moon. At 2:59 PM the Moon is out in the parking lot, in daylight,
and he would like it noted that he has not said anything. CNA Mango has made a Full Moon Bingo card (someone leaves,
someone howls, someone gets peeled) and the middle square says BREAK. The Charge Nurse announces the unit is fully staffed
and writes **Rule one: nobody says the Q word** on the whiteboard, under a sign that counts the hours since anyone did (41).
Mango says it in the first minute. At 5:30 the Activities Director calls bingo, Mr. Pear's taxi arrives early, Mrs. Cranberry
tests her chair alarm on purpose and Mr. Banana peels himself and makes a run for it. At 7:48 PM Mr. Goji in Room 14
announces that he is the wolf: 99.8, no water since lunch, and Dr. Apple, from bed, orders a UA and promises to call back
(the clock beside his bed jumps to 3:00). At 10:31 Strawberry finally says it, out loud, and every square on the card fills
in under eight seconds. The Night Nurse asks how the full moon was. "Quiet." The Moon apologizes. The post-credits card is
a clock and the words The Double Shift.

Episode 7 renders through the same v2 renderer as Episode 6 and passes the same hard layout gate, with new pieces on top:
a bingo card that is a prop, a HUD counter and a full-screen insert, daubed square by square from one timeline; picture-in-picture
phone calls; a ball-wipe transition; a dolly zoom when the word is said; a whiteboard that writes itself; a seven-segment
sign; the Moon as a lit character in a window; and two-line captions that split evenly instead of leaving a lone word.

## Episode 8: The Double Shift

Episode 7 ended on a clock and the words The Double Shift. At 10:52 PM, eight minutes before the end of the 3-11, the Charge
Nurse tells Strawberry to sit down: the night nurse has called out. Dragonfruit, on the phone from under a blanket, explains that
last night was quiet and she is not going back there, which resets the hours-since-the-Q-word sign from a hundred miles away.
Strawberry is now the three to seven ("That is not math." "It is staffing."), a Staffing Notice offers two boxes (I volunteer, I was
told) and a red MANDATORY stamp, and Mango stays too, because of time and a half. At 2:47 AM the hall has forty residents, one nurse
and an overhead page announcing that breaks are available, which means nobody. At 3:34 AM Strawberry gets forty seconds of break, a
personal best, and uses them to daub the one square left on Mango's Episode 7 bingo card: BREAK, the middle, a bingo. At 6:40 AM, in
Room 14, the Moon (also on a double: eclipses are four minutes, on a good one) sets while the sky turns to sunrise. At 7:00 AM
Strawberry tells the day nurse the night was quiet. The sign resets, every call light goes off, and she is back at three. "Yes." The
post-credits card is an ID badge that says TEMP and the words The Agency Nurse.

Episode 8 renders through the same v2 renderer and the same hard layout gate as Episodes 6 and 7, with new pieces on top: a sixteen-hour
sky and clock face for the title (afternoon, sunset, night and dawn on one dial); a whiteboard that rewrites itself and strikes a name
through; a phone call in a picture-in-picture ring; a full-screen mandation form with a stamp and a signature that writes itself; a
RESIDENTS 40 / NURSES 1 counter that slams onto the screen; a break countdown that stops at 0:40 and a PERSONAL BEST badge; the bingo card payoff as a daubed full-screen insert; a Moon that sets
behind the rooftops with a sky that runs from night to gold and light rays that reach the bed; and a sunrise end card.

## Episode 9: The Agency Nurse

Episode 8 ended on a TEMP badge. At 2:58 PM the facility hires its first agency nurse, Persimmon, who is per diem (the pun is the whole
contract). The Administrator (a Melon in a suit) rolls out a red carpet, a gift basket and pizza; Strawberry holds up the one pen she got
and asks about a raise ("We don't have the budget."); Persimmon mentions she makes a hundred and eighteen dollars an hour ("That's a
different budget."). At 3:06 PM orientation is four minutes (the contract is on screen: admissions no, wound care no, helping not included),
the computer on wheels refuses Persimmon's login ("Use mine." "That's against policy." "So is this.") and Lemon deals out the residents:
twelve sleepers to Persimmon, twenty-eight awake to Strawberry ("It's contract math."). A split screen runs the shift: Strawberry sprinting
the hall on top, Persimmon in a spa chair with cucumber slices on her eyes on the bottom, two pay meters rolling in the middle ("That's not in
my contract." "Which part isn't?" "Helping."). At 11:00:00 PM she walks out with the facility's only key ring, the Administrator gives her
five stars, Strawberry chases her through the parking lot and the Moon denies everything. Then a SHIFTGO notification arrives: her own
facility is hiring on SHIFTGO at $118 an hour. "Where do I sign?" "Do it." The post-credits card is an envelope and the words Two Weeks' Notice.

Episode 9 renders through the same v2 renderer and the same hard layout gate as Episodes 6 to 8, with new pieces on top: a staffing-app
map for the title (a car on violet routes, an ETA that counts down, a SURGE 3.4x price card); a red-carpet welcome with a banner, balloons and
confetti; an agency contract and a login screen as full-screen inserts; forty resident cards dealt to two piles that hover over the nurses
who got them (one tidy and asleep, one a leaning heap); a true split screen with rolling-digit pay meters between the panels; a night lobby
and a convertible chase; a rating-stars phone; and a night end card where the Moon watches.

## Episode 10: Two Weeks' Notice

Episode 9 ended on a SHIFTGO job post at a hundred and eighteen dollars an hour. At 2:58 PM Strawberry walks into the Administrator's office
with a letter ("I'm giving you my two weeks' notice." "Is this about the pen?") and the budget finally gets a face: a wall chart that is 97
percent pizza ("You had the budget for pizza." "That's the pizza budget."). The next two weeks are a flip calendar: Lemon's notice-period
policy (no call-outs, no vacation, no sick days: "Then nothing changes."), Staff Appreciation Week with one car-tire-sized donut per nurse
("It's a very large donut."), the same job posted twice at thirty-four and a hundred and eighteen dollars an hour ("Different budget."), and
the replacement, Clementine ("You became marmalade."), who answers "Sure!" to an empty supply closet. The exit interview is one word
("Money.") and a pen that rolls off the desk. The farewell party is a cake missing an R, a collection of four dollars and seventeen cents, a
card everyone signed, and "I love you." "I know." The final paycheck prints out at $4.17 after the cake and the banner ("That's Persimmon's
banner." "We're reusing it."), and in the parking lot a SHIFTGO job card from her own facility makes the Moon say "That was fast."

Episode 10 renders through the same v2 renderer and the same hard layout gate as Episodes 6 to 9, with new pieces on top: a corkboard flyer
title whose fourteen tear-off day tabs peel and fall on the beat; the Administrator's office as a new set (a day look with blinds sun and a
night look with a lamp pool, a budget pie chart, a portrait that swings open on a vault door) that Episode 11 uses again; a resignation
letter that writes itself and a rubber stamp; an exit form with handwriting, an inventory list and a top-down desk; a page-peeling flip
calendar that carries the camera between four locations; a receipt-printing pay stub; a SHIFTGO job card; and an end card where a very large
donut rises over the skyline.

## Episode 11: Welcome Back

Strawberry returns to Fruit Bowl as per diem and gets the red carpet Persimmon got: a banner (WELCOME BACK STRAWBERY, one R short again), a
gift basket, a parking pass, lunch and a pen ("That's my pen." "It was a gift." "To share." "Is there a raise?" "You're per diem. You're in
the other budget." "I know. I'm in it."). Clementine, the new staff nurse in Strawberry's old badge, gets twenty-eight residents to
Strawberry's twelve ("It's contract math."), a lesson in saying "Let me check my contract" without one, and a sticker that reads NURSE
(CONTRACT: NONE). A split screen runs the shift, Clementine sprinting through twenty-eight call lights on top and Strawberry in the spa chair
on the bottom with a new GUILT thermometer next to the pay meter, until the thermometer shatters and she bolts. The invoice is a nine-hour
minimum of helping at two hundred dollars an hour; the Administrator opens his portrait, spins the vault wheel and floods the office with
gold ("Oh. We do have that one." "And the staff budget?" "That's this."), and a moth flies out of a purse. At 10:59 PM overtime would cost
a hundred and seventy-seven dollars an hour, so for once everyone wants her out the door; at 11:00:00 she leaves, tells the Moon the night
was "Quiet.", and the building goes up behind her ("She said the word!" "Not my shift.").

Episode 11 uses the same renderer and gate, with new pieces on top: a punch-clock title; a red-carpet return mirrored from Episode 9; forty
resident cards that build a leaning house of cards in front of Clementine; a true split screen with a shattering GUILT thermometer, a
time-lapse across both panels and a glass-shatter merge; an invoice, a vault with a coin avalanche, god rays and a moth; an LED countdown to
11:00:00; and a parking-lot chaos montage with eight hits keyed to eight sound cues.

## Episode 12: The In-Service

A mandatory in-service that is voluntary for per diem staff. The Administrator's sign-in sheet ("Persimmon is not attending. Agency."), four slides (Dignity First;
answer every call light within two minutes; teamwork, "We are a family." "Are families paid overtime?" "Families are unpaid."; the budget, ninety-seven percent
pizza and ninety-seven percent dignity), a quiz (a resident calls while you are on your break: "You are never on break."; a supervisor asks you to stay late: yes,
yes, or let me check my contract) and the word that has no slide: "No." "There is no slide for no." A fire drill whose muster point is the parking lot
("Residents first. Staff second." "And administration?" "Third." "Pizza last."), where the Moon counts everyone and Persimmon is "on another budget". The Staff
Engagement Awards: Most Reports Filed ("Nobody reads them." "I read every one. The good cuff is behind the Q-word sign."), Newest Hire, and Strawberry
("Per diem. Not required to attend. Attended." "Under protest." "We need you Friday." "No.") ending on "Then it's not in my contract."

Episode 12 was repaired under the text gate (see Layout audit) before it was published: the sign-in sheet had been drawn upside down, several posters, plaques and the
awards banner were sliced by the frame edge, notes overlapped each other and the drill hall used blurred foreground characters. The sign-in sheet is now an upright
table with its own signature column. Its script, timing and audio are unchanged.

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

## The cast

| Fruit | Role | The bit |
|---|---|---|
| Strawberry | Nurse, 3-11 | Survives 40 residents, no breaks, then melts into jam |
| Cherry | Day shift | Cherry-picked the easy assignment, gone at 2:59:59 |
| Lemon | Charge nurse | Sour. Brings the staffing news and the mandatory OT |
| Blueberry | Room 12 | SpO2 87%. Baseline: blue |
| Cranberry | Room 7 | Thinks it's 1962. It's a UTI |
| Prune | Room 3 | Six days, no BM. The prune juice is his cousin Gary |
| Grapefruit | Villain | Natural enemy of the statin |
| Grape, then Raisin | Room 9 | "I had a sip on Tuesday." Deficient fluid volume |
| Banana | Room 4 | Slipped on his own peel. Fall number four |
| Dr. Apple | Attending | An apple a day keeps him away. Calls back at 3 AM |
| Pineapple | Family member | The crown is a "Can I speak to your manager" |
| Coconut | New admit, 10:55 PM | No med list. No paperwork. Just vibes |
| Starfruit | State surveyor (Ep. 2) | "Don't mind me. I'm just going to observe." |
| Melon | The Administrator (Ep. 2, 9, 10, 11, 12, 13) | Leaves the office once a year, with pizza. Has a different budget for agency nurses |
| Kiwis x5 | Agency nurses (Ep. 2) | Appear when the State does. Vanish at 4:45 |
| Nifedipine ER | Capsule (Ep. 2) | Almost crushed. Says thank you |
| Fig | The Scheduler (Ep. 3) | Makes you an offer you can't refuse. Texts "hey :)" at 3 AM |
| Doris | Cranberry sauce (Ep. 3) | Mrs. Cranberry's cousin. She was jellied |
| Clementine | New grad (Ep. 4), the replacement (Ep. 10, 11) | Passed at 85 questions. Says "Sure!" to everyone. Becomes marmalade. Takes twenty-eight residents without a contract |
| Moon | Night-shift narrator (Ep. 5, 7, 12, 13) | Keeps score whenever someone blames him for a problem. Ep. 7: he would like it noted that he has not said anything |
| Sun | Day-shift counterpart (Ep. 5) | Takes credit for a quiet day, then claims sundowning |
| Mango | CNA (Ep. 5) | Knows the legend of the good blood pressure cuff |
| Mr. Pear | Resident (Ep. 5) | Still honors the paid-break clause in his old contract |
| Dragonfruit | Night nurse (Ep. 5) | Arrives rested just in time for the actual full moon |
| Lime | Resident (Ep. 6) | Hears a chirp. It is their own hearing aid |
| Pomegranate | Fire Marshal (Ep. 6) | Arrives at 7:05 with a flashlight, a helmet and a mustache. Asks who is in charge |
| Papaya | Activities Director (Ep. 7) | Calls bingo like a game-show host, in a sun visor, with a microphone she does not need |
| Goji | Resident, Room 14 (Ep. 7) | Is the wolf. Has not had water since lunch. It is a UTI |
| Mr. Lime | Day nurse (Ep. 8; a resident who hears chirps in Ep. 6) | Arrives at 7:00 with a 7-3 mug and asks how the night was |
| Persimmon | Agency nurse, per diem (Ep. 9, 11, 12) | Orientation is four minutes. Helping is not in her contract. Leaves at 11:00:00 with the keys. Welcomes Strawberry to the club |
| Brenda | Prune nurse, the break room (Ep. 13) | Went on break in 2019. Nobody covered. "Nobody ever said that." First one out the door when the call lights ring |

## Layout audit

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

## How it's made

Everything is generated from code, with no stock assets:

- `script.json` and `script_ep2.json` to `script_ep13.json` hold the scenes, dialogue, voices and sound cues. Episode 2's
  "previously on" clips are cut straight from Episode 1's audio and frames.
- `build_audio.py` voices each line with [Kokoro](https://github.com/thewh1teagle/kokoro-onnx) TTS, synthesizes every sound effect and the music bed in numpy, mixes an episode's `audio.wav`, and writes its `timeline.js` with timings and lip-sync envelopes.
  Episodes 6 to 13 use `build_audio6.py`, which adds a stereo mix, a reverb room per scene, ambience, alarm sound design, a written score (`build_music6.py` to `build_music13.py`), footsteps placed from the animation, and lip-sync tracks derived from the recorded voice. Episode 7's own sounds (bingo cage, howl, taxi, sock phone call, the Q word) are in `build_audio7.py`; `build_audio8.py` is a thin wrapper on it for Episode 8, and `build_audio9.py` adds Episode 9's five new sounds (a small crowd cheering, a cash register, a sports car pulling away, tyres, a five-star chime) and a measured loudness trim. `build_audio10.py` adds Episode 10's sounds (door knocks, flyer tabs tearing off, pen scratches, a wooden rubber stamp, a coin pour, confetti, a gear whirr, a tote emptying, a card deal) and an AAC guard that dips a click a few hundredths of a second so the compressed file stays under -1 dBTP; `build_audio11.py` adds Episode 11's (a steel vault door, a gold avalanche, a moth, a punch clock, an LED clock tick and the 11:00:00 bell, a time-lapse, slow motion, a purse clasp).
- `engine.js` draws every character, set and overlay on a canvas, including the panel-layout kit shared by
  Episodes 2 to 5; `ep1.js` to `ep13.js` are the episodes (Episode 8's night scenes are `ep8_hall.js`, `ep8_break.js` and `ep8_dawn.js`; Episode 9's arrival, split-screen shift and exit are `ep9_arrival.js`, `ep9_floor.js` and `ep9_exit.js`, on the kit in `ep9_art.js`; Episode 10 is `ep10_title.js` (title and end card), `ep10_office.js` (office and exit interview), `ep10_days.js`, `ep10_party.js` and `ep10_door.js` (door and parking lot), on the Administrator's office set in `ep10_set.js` and the kit in `ep10_art.js`; Episode 11 is `ep11_title.js` (title and end card), `ep11_arrival.js`, `ep11_orient.js`, `ep11_floor.js`, `ep11_vault.js` and `ep11_exit.js` (exit and parking lot), on the kit in `ep11_art.js`). Episode 5's new art and sets live in
  `ep5_art.js` and `ep5_sets.js`.
  Episodes 6 to 13 draw through an opt-in second renderer (`v2_core.js` lighting, bloom, grade and motion blur; `v2_char.js` shaded characters
  with two-bone arms and real hands) that Episodes 1 to 5 never touch. Episode 7's art, sets and inserts are `ep7_art.js`, `ep7_sets.js` and `ep7_ins.js`.
  `renderAt(t)` is a pure function of time, so the same code drives live playback and frame capture.
- Episode 12 is `ep12_title.js` (title and end card), `ep12_room.js` (the conference room), `ep12_signin.js`, `ep12_slides.js`, `ep12_drill.js` and `ep12_award.js`. Episode 13 is
  `ep13_title.js` (title and police-lineup end card), `ep13_crew.js` (freeze-frame cards), `ep13_open.js`, `ep13_plan.js` (the hologram blueprint), `ep13_hall.js` (the laser hall),
  `ep13_cross.js` and `ep13_vault.js` (the break room) on the kits `ep13_station.js` (`window.S13`: the nurses' station, the hall, the break room door) and `ep13_art.js` (`window.A13`: Brenda).
  `txaudit.js` is the text gate and `ui.js` the text layout kit (above).
- `render.js` drives headless Chromium to capture frames and pipes them to ffmpeg.

```bash
pip install kokoro-onnx soundfile scipy numpy
# model files: kokoro-v1.0.onnx and voices-v1.0.bin from the kokoro-onnx releases page
python3 build_audio.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin
python3 build_audio.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin \
  --script script_ep2.json --out build/ep2 --var TIMELINE_EP2
python3 build_audio.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin \
  --script script_ep3.json --out build/ep3 --var TIMELINE_EP3
python3 build_audio.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin \
  --script script_ep4.json --out build/ep4 --var TIMELINE_EP4
python3 build_audio.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin \
  --script script_ep5.json --out build/ep5 --var TIMELINE_EP5
ffmpeg -y -i build/ep5/audio.wav -c:a aac -b:a 192k build/ep5/audio.m4a   # browser playback
EP=2 node render.js audit 0.05                                        # layout check, every 1/20 s
EP=2 FMT=image/png CRF=27 FFMPEG=/path/to/ffmpeg node render.js video shift-happens-ep2.mp4
EP=2 node render.js preview 12.5 40 88                                # stills in build/ep2/preview
EP=5 node render.js audit 0.05                                        # Episode 5 layout check
EP=5 FMT=image/png CRF=27 node render.js video shift-happens-ep5.mp4
EP=5 node render.js preview 12.5 40 88                                # stills in build/ep5/preview
```

Fonts from Google Fonts: Bangers and Nunito (SIL OFL), Luckiest Guy (Apache 2.0). Licenses are in `fonts/`.


## Episode 6 build and release gate

```bash
pip install kokoro-onnx soundfile scipy numpy
python3 build_audio6.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin   # voices, stereo mix, score, lip-sync -> build/ep6/audio.wav, timeline.js
EP=6 node render.js events                                                  # footsteps from the animation -> build/ep6/events.json (then run build_audio6.py again)
EP=6 node render.js audit 0.0333333333                                      # hard gate: exits non-zero on any layout issue
ffmpeg -y -i build/ep6/audio.wav -c:a aac -b:a 192k build/ep6/audio.m4a     # browser playback and CI
EP=6 FMT=image/png CRF=21 node render.js video shift-happens-ep6.mp4
EP=6 node render.js preview 3.2 55.4 120 150 175                            # stills in build/ep6/preview
```

`script_ep6.json` holds the scenes, lines, voices and sound cues; `build_music6.py` is the score (every instrument is a few
lines of numpy); `ep6.js` has the scenes, `ep6_sets.js` and `ep6_rooms.js` the perspective sets, `ep6_art.js` the new fruit and
props, and `ep6_ins.js` the macro inserts and UI cards.

## Episode 7 build and release gate

```bash
python3 build_audio7.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin   # voices, stereo mix, score, lip-sync -> build/ep7/audio.wav, timeline.js
EP=7 node render.js events 15                                               # footsteps from the animation -> build/ep7/events.json (then run build_audio7.py again)
EP=7 node render.js audit 0.0333333333                                      # hard gate: exits non-zero on any layout issue
ffmpeg -y -i build/ep7/audio.wav -c:a aac -b:a 192k build/ep7/audio.m4a     # browser playback and CI
EP=7 FMT=image/png CRF=21 node render.js video shift-happens-ep7.mp4
EP=7 node render.js preview 3.2 60 110 140 170                              # stills in build/ep7/preview
```

`script_ep7.json` holds the scenes, lines, voices and sound cues; `build_music7.py` is the score and reuses the instruments in
`build_music6.py`; `ep7.js` has the scenes, `ep7_sets.js` the sets (parking lot, station, activity room, Room 14), `ep7_art.js`
the new fruit, props and the bingo card, and `ep7_ins.js` the inserts (balls, cage, thermometer, pitcher, phone, report, clock).

## Episode 8 build and release gate

```bash
python3 build_audio8.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin   # voices, stereo mix, score, lip-sync -> build/ep8/audio.wav, timeline.js
EP=8 node render.js events 15                                               # footsteps from the animation -> build/ep8/events.json (then run build_audio8.py again)
EP=8 node render.js audit 0.0333333333                                      # hard gate: exits non-zero on any layout issue
ffmpeg -y -i build/ep8/audio.wav -c:a aac -b:a 192k build/ep8/audio.m4a     # browser playback and CI
EP=8 FMT=image/png CRF=21 node render.js video shift-happens-ep8.mp4
```

`script_ep8.json` holds the scenes, lines, voices and sound cues; `build_audio8.py` reuses Episode 7's sound effects and beds, and
`build_music8.py` is the score (it reuses the instruments in `build_music6.py` and `build_music7.py`); `ep8.js` has the title, the
station, the 7 AM report and the end card, and `ep8_hall.js`, `ep8_break.js` and `ep8_dawn.js` the three night scenes, all on the
Episode 6 and 7 sets and art kits.

## Episode 9 build and release gate

```bash
python3 build_audio9.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin   # voices, stereo mix, score, lip-sync -> build/ep9/audio.wav, timeline.js
EP=9 node render.js events 15                                               # footsteps from the animation -> build/ep9/events.json (then run build_audio9.py again with --events build/ep9/events.json)
EP=9 node render.js audit 0.0333333333                                      # hard gate: exits non-zero on any layout issue
ffmpeg -y -i build/ep9/audio.wav -c:a aac -b:a 192k build/ep9/audio.m4a     # browser playback and CI
EP=9 FMT=image/png CRF=21 node render.js video shift-happens-ep9.mp4
```

`script_ep9.json` holds the scenes, lines, voices and sound cues (a few lines carry a `say` that differs from their caption `text`, to
make the text-to-speech stress Persimmon and per diem correctly); `build_audio9.py` reuses Episode 7's sound effects and beds and adds its own, and
`build_music9.py` is the score (it reuses the instruments in `build_music6.py` and `build_music7.py`); `ep9.js` has the title, the orientation
and the end card, `ep9_arrival.js`, `ep9_floor.js` and `ep9_exit.js` the other scenes, and `ep9_art.js` the agency nurse, her props and the
SHIFTGO app pieces, all on the Episode 6 and 7 sets and art kits.


## Episode 10 build and release gate

```bash
python3 build_audio10.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin   # voices, stereo mix, score, lip-sync -> build/ep10/audio.wav, timeline.js
EP=10 node render.js events 15                                               # footsteps from the animation -> build/ep10/events.json (then run build_audio10.py again with --events build/ep10/events.json)
EP=10 node render.js audit 0.0333333333                                      # hard gate: exits non-zero on any layout issue
ffmpeg -y -i build/ep10/audio.wav -c:a aac -b:a 192k build/ep10/audio.m4a     # browser playback and CI
EP=10 FMT=image/png CRF=21 node render.js video shift-happens-ep10.mp4
```

`script_ep10.json` holds the scenes, lines, voices and sound cues; `build_audio10.py` reuses the Episode 9, 7 and 6 mixers and adds its own sounds, and
`build_music10.py` is the score (it reuses the instruments in `build_music6.py` to `build_music9.py`); the scene modules and the office set are listed above, all on the Episode 6 and 7 sets and art kits.

## Episode 11 build and release gate

```bash
python3 build_audio11.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin   # voices, stereo mix, score, lip-sync -> build/ep11/audio.wav, timeline.js
EP=11 node render.js events 15                                               # footsteps from the animation -> build/ep11/events.json (then run build_audio11.py again with --events build/ep11/events.json)
EP=11 node render.js audit 0.0333333333                                      # hard gate: exits non-zero on any layout issue
ffmpeg -y -i build/ep11/audio.wav -c:a aac -b:a 192k build/ep11/audio.m4a     # browser playback and CI
EP=11 FMT=image/png CRF=21 node render.js video shift-happens-ep11.mp4
```

`script_ep11.json` holds the scenes, lines, voices and sound cues; `build_audio11.py` and `build_music11.py` are thin additions on the Episode 10 files (they import them, so each pair must stay together);
the scenes reuse Episode 10's office set (`ep10_set.js`) for the vault and Episode 9's lobby, lounge and hall by copy.

## Episode 12 build and release gate

```bash
python3 build_audio12.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin   # voices, stereo mix, score, lip-sync -> build/ep12/audio.wav, timeline.js
EP=12 node render.js events 15                                               # footsteps from the animation -> build/ep12/events.json (then run build_audio12.py again with --events build/ep12/events.json)
EP=12 node render.js audit 0.0333333333                                      # hard gate, text gate included (textGate: true): exits non-zero on any layout or text issue
ffmpeg -y -i build/ep12/audio.wav -c:a aac -b:a 192k build/ep12/audio.m4a     # browser playback and CI
EP=12 FMT=image/png CRF=21 node render.js video shift-happens-ep12.mp4
```

`script_ep12.json` holds the scenes, lines, voices and sound cues; `build_audio12.py` and `build_music12.py` build on the earlier audio and music files (they import them, so the files must stay together).

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
