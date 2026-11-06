"""Episode 18: The Fire Drill. Writes script_ep18.json in the project folder.

8:00 PM, the new management runs a surprise fire drill (announced twenty minutes ahead). Compliance (Onion) reads it from a drill log that was signed on Monday; Binder prints an evacuation map
whose nearest exit is the Executive Suite on the roof ("Fire rises!"). The Fire Marshal (Pomegranate, Episode 6) arrives with a flashlight and asks who is in charge; the extinguisher's tag says
2019 ("It is still passing."), the fire door is propped open by the cart ("The cart has seniority."), and the P.A.S.S. demonstration sends the extinguisher spinning down the hall in a cloud of
foam. CODE RED: the strobes pulse, the horn sounds its temporal-three pattern, and the magnetic fire doors close one after another down the corridor (the alarm gets quieter with every door);
Binder offers to snooze the alarm for ten minutes ("Great! Snoozed!") and the doors stay closed ("Doors are pending!"). Ten minutes later (8:10) the snooze runs out and the horn returns, muffled;
the residents will not leave the day room because the drill's "fire" is the Yule log on the TV ("It is the best part of the day."), so the staff extinguish it with the remote ("Boo."), the
headcount is forty residents plus the forty unassigned Strawberries from Fill Down ("I'm one person."), and the State (Mr. Stateman, Trainee Kumquat) passes the drill because the paperwork is
perfect. The last sound of the night is the smoke detector's low-battery chirp and nobody is maintenance.

Each line is a spoken beat; each P() is a silent visual beat. Sound cues sit at fixed offsets from the start of their beat ("end" = the beat's end). Voices of the existing cast are copied from
earlier scripts so everyone sounds as before (the Marshal and the overhead page keep their Episode 6 voices, the surveyors and the residents their Episode 14 voices).
Usage: python3 gen_script18.py [dst]
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gen_script15 import VOICES as V15, L, P  # noqa: E402

s6 = json.load(open(f'{HERE}/script_ep6.json'))
s14 = json.load(open(f'{HERE}/script_ep14.json'))
VOICES = dict(V15)
for k in ('marshal', 'pa'):
    VOICES[k] = dict(s6['voices'][k])
for k in ('star', 'kum', 'rall', 'cran', 'banana', 'pear'):
    VOICES[k] = dict(s14['voices'][k])
VOICES['marshal'].setdefault('lang', 'en-gb')
VOICES['marshal'].setdefault('color', '#c0392b')
VOICES['marshal'].setdefault('pan', -0.25)
VOICES['pa'].setdefault('lang', 'en-us')
VOICES['pa'].setdefault('color', '#9aa7b5')
VOICES['pa'].setdefault('pan', 0.0)

SCENES = [
    # ------------------------------------------------------------------ 1. the title: an exit sign above a pull station; the lever is pulled, the strobes and the horn start
    {'id': 'title', 'clock': '', 'label': '', 'head': 0.2, 'tail': 0.1, 'room': 'hall', 'beats': [
        P('logo', 6.4, 0.1, [['theme15', 0, .8, 0], ['pullclick', 2.2, .55, 0], ['horn3', 2.3, .5, 0], ['hornstop', 5.25, .4, 0], ['textding', 5.4, .45, 0]]),
    ]},

    # ------------------------------------------------------------------ 2. the notice: a surprise that is announced first; med pass versus drills; Binder prints the map
    {'id': 'notice', 'clock': '7:40 PM', 'label': 'THE NOTICE', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.14}, 'beats': [
        P('open', 1.0, 0.1, [['click', .3, .3, 0]]),
        L('o1', 'onion', "Fire drill at eight o'clock.", 0.15, sfx=[['sniffle', 1.2, .3, -.3]]),
        L('l1', 'lemon', 'I thought drills were a surprise.', 0.1),
        L('o2', 'onion', 'They are. We announce them first.', 0.2),
        L('s1', 'straw', 'I am on med pass.', 0.15),
        L('o3', 'onion', 'Drills do not interrupt med pass.', 0.1),
        L('s2', 'straw', 'Good.', 0.1),
        L('o4', 'onion', 'Med pass does not interrupt drills.', 0.15),
        L('s3', 'straw', 'Which one wins?', 0.15),
        L('o5', 'onion', 'Per policy.', 0.25, sfx=[['sniffle', .9, .3, -.3]]),
        L('t1', 'tom', 'The drill is paid time!', 0.1),
        L('m1', 'mango', 'And the evacuating?', 0.1),
        L('t2', 'tom', 'Efficiency.', 0.25),
        L('b1', 'bind', "It looks like you're preparing for a fire. Would you like help?", 0.1, sfx=[['binderpop', -.15, .4, -.1]]),
        L('s4', 'straw', 'No.', 0.1),
        L('b2', 'bind', "Great! I'll help.", 0.1, sfx=[['grin', .55, .3, -.1]]),
        P('print', 1.7, 0.05, [['printer', 0, .45, .2], ['click', 1.55, .3, .2]]),
        L('b3', 'bind', 'Your nearest exit is the Executive Suite!', 0.1),
        L('l2', 'lemon', 'That is on the roof.', 0.1),
        L('b4', 'bind', 'Fire rises!', 0.3),
        P('end', 1.0, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 3. the marshal: who is in charge; a 2019 tag; a propped door; P.A.S.S.; foam
    {'id': 'marshal', 'clock': '7:55 PM', 'label': 'THE MARSHAL', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.12}, 'beats': [
        P('open', 1.1, 0.1, [['boots', 0, .4, -.3], ['flashclick', .8, .3, -.2]]),
        L('p1', 'marshal', 'Who is in charge?', 0.15),
        L('s1', 'straw', "I'm per diem.", 0.1),
        L('m1', 'mango', "I'm a CNA.", 0.1),
        L('o1', 'onion', "I'm Compliance.", 0.1, sfx=[['sniffle', .8, .3, -.3]]),
        L('b1', 'bind', "I'm in charge!", 0.25, sfx=[['binderpop', -.15, .4, 0]]),
        L('p2', 'marshal', 'Show me the extinguisher.', 0.2),
        P('ext', 0.7, 0.05, [['flashclick', 0, .3, -.2]]),
        L('p3', 'marshal', 'The tag says twenty nineteen.', 0.1),
        L('o2', 'onion', 'It passed.', 0.1),
        L('p4', 'marshal', 'In twenty nineteen.', 0.1),
        L('o3', 'onion', 'It is still passing.', 0.3, sfx=[['sniffle', 1.2, .35, -.3]]),
        L('p5', 'marshal', 'Why is the fire door propped open?', 0.15),
        L('m2', 'mango', 'For the cart.', 0.1),
        L('p6', 'marshal', 'The sign says keep closed.', 0.1),
        L('m3', 'mango', 'The cart has seniority.', 0.3),
        L('p7', 'marshal', 'Demonstrate P.A.S.S.', 0.15, say='Demonstrate pass.'),
        L('l1', 'lemon', 'Pull. Aim. Squeeze. Sweep.', 0.1, sfx=[['pinpull', 0.5, .5, 0]]),
        P('rampage', 3.4, 0.05, [['foamhiss', 0, .8, 0], ['cartrattle', .5, .3, .2], ['foamsplat', 2.6, .5, 0]]),
        L('p8', 'marshal', 'The fire is out.', 0.2),
        L('l2', 'lemon', 'There was no fire.', 0.15),
        L('p9', 'marshal', 'Now there is a slip hazard.', 0.25, sfx=[['stamp', 1.7, .5, 0]]),
        P('end', 0.8, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 4. code red: strobes, the temporal-three horn, the doors close one by one, Binder snoozes the alarm
    {'id': 'alarm', 'clock': '8:00 PM', 'label': 'CODE RED', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'beats': [
        P('open', 1.3, 0.05, [['pachime', 0, .5, 0], ['horn3', .7, .65, 0]]),
        L('pa1', 'pa', 'Code Red. Code Red. Unit B.', 0.1),
        L('l1', 'lemon', 'Race! Rescue!', 0.05, say='Race! Rescue!'),
        L('s1', 'straw', "Rescue. Alarm. Contain. Eight o'clock meds.", 0.15),
        L('m1', 'mango', 'The doors are closing!', 0.05),
        P('cascade', 3.4, 0.05, []),
        P('bonk', 0.9, 0.05, [['doorbonk', .1, .7, .2]]),
        L('o1', 'onion', 'Doors close on alarm. Per policy.', 0.15, sfx=[['sniffle', 1.5, .3, -.3]]),
        L('b1', 'bind', "It looks like there's an alarm. Would you like to snooze it?", 0.1, sfx=[['binderpop', -.15, .4, 0]]),
        L('s2', 'straw', 'No.', 0.1),
        L('b2', 'bind', 'Great! Snoozed for ten minutes!', 0.05, sfx=[['click', 1.5, .4, 0], ['hornstop', 1.55, .5, 0], ['grin', 1.7, .3, 0]]),
        P('quiet', 1.5, 0.05, []),
        L('p1', 'marshal', 'That is not how an alarm works.', 0.2),
        L('b3', 'bind', 'Doors are pending!', 0.25),
        L('l2', 'lemon', 'Which side of the door am I on?', 0.1),
        L('m2', 'mango', 'The wrong one.', 0.3),
        P('end', 1.0, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 5. the evacuation: the Yule log, the remote, the headcount and the forty Strawberries
    {'id': 'evac', 'clock': '8:10 PM', 'label': 'THE EVACUATION', 'head': 0.2, 'tail': 0.4, 'room': 'room', 'amb': {'name': 'hum', 'gain': 0.1}, 'beats': [
        P('open', 1.3, 0.1, [['pachime', 0, .4, 0], ['horn3', .3, .5, 0], ['yulecrackle', .1, .3, 0]]),
        L('l1', 'lemon', 'Everyone up! We are evacuating!', 0.1),
        L('r1', 'rall', 'We are watching the fire.', 0.1),
        L('l2', 'lemon', 'That is a video of a fire.', 0.1),
        L('c1', 'banana', 'It is the best part of the day.', 0.25),
        L('s1', 'straw', 'Then we extinguish it.', 0.15),
        P('remote', 0.9, 0.05, [['click', .2, .4, .2], ['tvoff', .35, .6, 0]]),
        L('r2', 'rall', 'Boo.', 0.15),
        P('line', 3.0, 0.05, [['wheelchair', 0, .35, .2], ['cartrattle', .6, .3, -.2]]),
        L('l3', 'lemon', 'Headcount.', 0.1),
        L('m1', 'mango', 'Thirty-eight. Thirty-nine. Forty.', 0.1),
        L('l4', 'lemon', 'Forty. Good.', 0.2),
        L('ch1', 'chor', "I'm one person.", 0.15),
        L('l5', 'lemon', 'Eighty.', 0.15),
        L('t1', 'tom', 'Forty are unassigned.', 0.1),
        L('l6', 'lemon', 'They are in my hallway.', 0.1),
        L('t2', 'tom', 'Unassigned.', 0.3),
        P('end', 1.0, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 6. the all clear: the State passes the paperwork; the smoke detector chirps; nobody is maintenance
    {'id': 'clear', 'clock': '8:25 PM', 'label': 'ALL CLEAR', 'head': 0.2, 'tail': 0.5, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.12}, 'beats': [
        P('open', 1.0, 0.1, [['click', .25, .35, 0], ['hornstop', .3, .5, 0]]),
        L('st1', 'star', "Don't mind me. I'm just going to observe.", 0.15),
        L('st2', 'star', 'I will need the drill log.', 0.1),
        L('o1', 'onion', 'Signed Monday.', 0.1, sfx=[['clipboard', -.3, .4, -.2]]),
        L('st3', 'star', 'Monday.', 0.1),
        L('o2', 'onion', 'We are very efficient.', 0.25, sfx=[['sniffle', 1.2, .3, -.3]]),
        L('st4', 'star', 'Evacuation time?', 0.1),
        L('o3', 'onion', 'Zero minutes.', 0.1),
        L('l1', 'lemon', 'It took twenty.', 0.1),
        L('o4', 'onion', 'Zero is the target.', 0.25),
        L('st5', 'star', 'Pass.', 0.15, sfx=[['stamp', .1, .55, 0]]),
        L('s1', 'straw', 'Pass?', 0.1),
        L('st6', 'star', 'The paperwork is perfect.', 0.3),
        P('chirp', 1.2, 0.05, [['chirp', .25, .55, .3]]),
        L('k1', 'kum', 'What is that sound?', 0.1),
        L('l2', 'lemon', 'Low battery.', 0.1),
        L('k2', 'kum', 'Who changes it?', 0.1),
        L('o5', 'onion', 'Maintenance.', 0.1, sfx=[['chirp', 1.4, .5, .3]]),
        L('s2', 'straw', 'Who is maintenance?', 0.15),
        L('t1', 'tom', 'Per diem.', 0.15),
        L('s3', 'straw', 'No.', 0.1),
        L('b1', 'bind', "Great! I'll help.", 0.1, sfx=[['binderpop', -.4, .4, 0], ['grin', .55, .3, 0]]),
        P('end', 1.8, 0.05, [['chirp', .5, .55, .3], ['sting', 1.0, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 7. the end card: the drill log, a chirping smoke detector, the teaser for Episode 19
    {'id': 'end', 'clock': '', 'label': 'THANKS FOR WATCHING', 'head': 0.1, 'tail': 0.3, 'room': 'hall', 'beats': [
        P('card', 7.0, 0.1, [['theme15', 0, .5, 0], ['typing', 1.0, .35, 0], ['chirp', 2.1, .5, .3], ['stamp', 3.9, .5, 0], ['chirp', 4.6, .5, .3], ['textding', 5.0, .4, 0], ['chirp', 7.0, .5, .3]]),
    ]},
]

OUT = {
    'title': 'SHIFT HAPPENS',
    'episode': 'Episode 18: The Fire Drill',
    'v2': True,
    'level_lines': True,
    'voices': {k: VOICES[k] for k in ('straw', 'mango', 'lemon', 'onion', 'tom', 'bind', 'marshal', 'pa', 'star', 'kum', 'rall', 'banana', 'chor') if k in VOICES},
    'scenes': SCENES,
    'music': {'from_': 'notice', 'to_': 'clear', 'mute': []},
    'no_whoosh': ['title', 'end'],
}

if __name__ == '__main__':
    dst = sys.argv[1] if len(sys.argv) > 1 else f'{HERE}/script_ep18.json'
    json.dump(OUT, open(dst, 'w'), indent=1, ensure_ascii=False)
    n_lines = sum(1 for sc in SCENES for b in sc['beats'] if 'who' in b)
    print('wrote', dst, '| scenes', len(SCENES), '| spoken lines', n_lines, '| voices', sorted(OUT['voices']))
