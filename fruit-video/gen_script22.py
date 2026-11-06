"""Episode 22: The Secret Santa. Writes script_ep22.json in the project folder.

December on the 3-11. 3:15 PM: the Fun Committee (Tomato) runs a Secret Santa with a ten dollar limit; Compliance (Onion) says gifts over five dollars must be reported; the per diem nurse is
not on the list; Binder offers to draw the names and its draw sends every arrow to Strawberry ("Everyone drew Strawberry." "Who did I draw?" "Everyone." "That's a hundred and twenty dollars."). 6:00 PM: no time to shop, so during the med
pass she wraps pudding cups in a blue Chux pad with paper tape and ties on an inflated glove as the bow ("Is that a Chux?" "It's festive."); Mr. Pear wants a balloon ("You can have twelve."; "Balloons are a latex hazard." "They're nitrile.").
7:30 PM: the Administrator is Santa; Compliance screens him for falls ("Every Christmas Eve. Down a chimney.") and puts a gait belt on him; Mrs. Cranberry wants her teeth, which Tomato wrapped
with everything else on the counter; Strawberry tears through the gift pile and finds them; Santa cannot get up from the low chair and goes up in the Hoyer lift. 9:00 PM: the staff exchange: three
candles, the same candle, Brenda's candle from 2019; every gift goes to Strawberry (grip socks: "Yellow. Fall risk."; a mug: "World's okayest nurse."), and hers go to everyone ("Pudding!").
10:55 PM: the residents sing her a carol on the beat, "On the fifth shift of Christmas" ("That's not a carol." "It's a care plan."); the night nurse is on time; the Moon says Merry Christmas.

New machinery the picture and the sound share: soft bodies (cloth that drapes, wraps and tears, tape, ribbons, a gait belt, the Hoyer sling, inflated gloves) from soft2d.js, whose contact and tear
events become foley; a carol whose lines start on the beat of the score (CAROL_GRID below) with a bouncing-ball caption (`capBall` in v2_core.js); match cuts at every scene join.

Each line is a spoken beat; each P() is a silent visual beat. Sound cues sit at fixed offsets from the start of their beat. Voices of the existing cast are copied from earlier scripts so everyone sounds as before.
Usage: python3 gen_script22.py [dst]
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gen_script15 import VOICES as V15, L, P  # noqa: E402

VOICES = dict(V15)
for n, keys in ((13, ('brenda',)), (19, ('pear', 'cran', 'rall', 'moon')), (21, ('egg', 'staff'))):
    sc = json.load(open(f'{HERE}/script_ep{n}.json'))
    for k in keys:
        VOICES[k] = dict(sc['voices'][k])
for k, (col, pan, lang) in {'brenda': ('#b07ac0', 0.2, 'en-gb')}.items():
    VOICES[k].setdefault('color', col)
    VOICES[k].setdefault('pan', pan)
    VOICES[k].setdefault('lang', lang)

# The carol: seven lines, each starting on a downbeat of the score. The grid is the scene-local time of the first downbeat and the bar length; the gap after each carol line is computed from
# the line lengths measured on a trial build (CAROL_LEN, seconds, from build/ep22/timeline.json) so that line k starts exactly at CAROL_T0 + k * CAROL_BAR. Kokoro is deterministic, so the
# lengths do not change between builds of the same text, voice and speed.
CAROL_BPM = 112
CAROL_BAR = 4 * 60 / CAROL_BPM          # 2.142857 s, one bar of 4/4
CAROL_LEN = {'c1': 1.95, 'c2': 1.807, 'c3': 1.546, 'c4': 1.507, 'c5': 1.433, 'c6': 1.478, 'c7': 1.838}   # measured on the trial build of 6 Nov 2026 (line id -> spoken length in seconds)
CAROL_IDS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7']


def carol_line(i, text):
    """Carol line i (0..6): the gap after it is the rest of its bar, so the next line lands on the next downbeat."""
    lid = CAROL_IDS[i]
    n = CAROL_LEN.get(lid)
    gap = round(CAROL_BAR - n, 4) if n is not None else 0.25
    return L(lid, 'rall', text, gap)


SCENES = [
    # ------------------------------------------------------------------ 1. the title: a wrapped gift; the ribbon pulls loose and the paper tears open on the title
    {'id': 'title', 'clock': '', 'label': '', 'head': 0.2, 'tail': 0.1, 'room': 'hall', 'beats': [
        P('logo', 6.4, 0.1, [['theme22', 0, .8, 0], ['ribbonpull', .9, .45, 0], ['paperrip', 1.6, .5, -.15], ['paperrip', 2.1, .5, .15], ['jinglebells', 2.6, .4, 0],
                             ['textding', 5.0, .45, 0]]),
    ]},

    # ------------------------------------------------------------------ 2. the draw: Secret Santa, the per diem nurse is not on the list, Binder draws the names and every arrow points at her
    {'id': 'draw', 'clock': '3:15 PM', 'label': 'THE DRAW', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.1}, 'beats': [
        P('open', 1.2, 0.1, [['jinglebells', .1, .4, 0]]),
        L('t1', 'tom', 'Secret Santa! Ten dollar limit!', 0.15),
        L('o1', 'onion', 'Gifts over five dollars must be reported.', 0.2, sfx=[['sniffle', 1.6, .3, -.3]]),
        L('m1', 'mango', 'Last year I got a candle.', 0.1),
        L('l0', 'lemon', 'We all got a candle.', 0.2),
        L('s1', 'straw', 'Am I on the list?', 0.15),
        L('t2', 'tom', "You're per diem.", 0.25),
        L('b1', 'bind', "It looks like you're drawing names. Would you like help?", 0.1, sfx=[['binderpop', -.15, .4, -.1]]),
        L('t3', 'tom', 'Yes!', 0.15),
        P('draw', 4.0, 0.05, [['shuffle', .1, .4, 0], ['namewhoosh', .8, .35, -.3], ['namewhoosh', 1.1, .35, .3], ['namewhoosh', 1.4, .35, -.2], ['namewhoosh', 1.7, .35, .2],
                              ['ding', 3.2, .45, 0]]),
        L('l1', 'lemon', 'Everyone drew Strawberry.', 0.15),
        L('s2', 'straw', 'Who did I draw?', 0.15),
        L('b2', 'bind', 'Everyone.', 0.25, sfx=[['grin', .5, .3, -.1]]),
        L('o2', 'onion', 'Per policy, that is allowed.', 0.15),
        L('t4', 'tom', 'Ten dollars each!', 0.15),
        L('s3', 'straw', "That's a hundred and twenty dollars.", 0.15),
        L('t5', 'tom', 'Merry Christmas!', 0.3),
        P('end', 1.0, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 3. the wrapping: no time to shop; a pudding cup wrapped in a Chux pad, paper tape, a glove balloon for a bow
    {'id': 'wrap', 'clock': '6:00 PM', 'label': 'THE WRAPPING', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.1}, 'beats': [
        P('open', 1.0, 0.1, []),
        L('m1', 'mango', 'Did you go shopping?', 0.1),
        L('s1', 'straw', 'When?', 0.3),
        P('wrap', 6.0, 0.05, [['chuxrustle', .2, .4, -.1], ['chuxfold', 1.2, .4, .1], ['chuxfold', 1.9, .4, -.1], ['tapepull', 2.6, .4, .2], ['tapepull', 3.2, .4, -.2],
                              ['glovesnap', 4.0, .4, 0], ['gloveinflate', 4.3, .45, 0], ['glovesqueak', 5.4, .35, 0]]),
        L('m2', 'mango', 'Is that a Chux?', 0.1),
        L('s2', 'straw', "It's festive.", 0.2),
        L('m3', 'mango', "What's in it?", 0.1),
        L('s2b', 'straw', 'Pudding. Sugar free.', 0.2),
        L('o1', 'onion', 'Is it labeled?', 0.1),
        L('s3', 'straw', 'Dated, timed, initialed.', 0.2, sfx=[['labelgun', .1, .4, .1]]),
        L('pe1', 'pear', 'Can I have a balloon?', 0.15),
        L('s4', 'straw', 'You can have twelve.', 0.2),
        P('balloons', 2.4, 0.05, [['gloveinflate', .1, .4, -.3], ['gloveinflate', .5, .4, .3], ['glovesqueak', 1.2, .35, 0], ['balloonbonk', 1.8, .35, .2]]),
        L('o2', 'onion', 'Balloons are a latex hazard.', 0.1),
        L('s5', 'straw', "They're nitrile.", 0.3),
        P('end', 1.0, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 4. Santa's visit: a fall screening, a gait belt, the lost teeth in the gift pile, Santa in the Hoyer lift
    {'id': 'santa', 'clock': '7:30 PM', 'label': "SANTA'S VISIT", 'head': 0.2, 'tail': 0.4, 'room': 'room', 'amb': {'name': 'hum', 'gain': 0.1}, 'beats': [
        P('open', 1.2, 0.1, [['sleighbells', .1, .45, 0]]),
        L('me1', 'melon', 'Ho ho ho!', 0.15),
        L('o1', 'onion', 'Santa, have you fallen in the last ninety days?', 0.15),
        L('me2', 'melon', 'Every Christmas Eve. Down a chimney.', 0.2),
        L('o2', 'onion', 'Gait belt.', 0.1),
        P('belt', 1.4, 0.05, [['beltbuckle', .4, .45, 0], ['belttug', .9, .4, 0]]),
        L('cr1', 'cran', 'Santa, I want my teeth.', 0.15),
        L('me3', 'melon', 'Ho ho... what?', 0.1),
        L('t1', 'tom', 'I wrapped everything on the counter.', 0.2),
        P('search', 3.4, 0.05, [['paperrip', .2, .45, -.2], ['paperrip', .8, .45, .2], ['paperrip', 1.4, .45, -.1], ['paperrip', 2.0, .45, .1], ['dentureclack', 2.8, .45, 0]]),
        L('s1', 'straw', 'Found them.', 0.2),
        L('cr2', 'cran', 'Merry Christmas!', 0.3, sfx=[['ding', .3, .35, .2]]),
        L('me4', 'melon', "I can't get up.", 0.1),
        L('l1', 'lemon', 'Get the Hoyer.', 0.1),
        P('hoyer', 2.6, 0.05, [['hoyerroll', .1, .4, -.2], ['slingrustle', .7, .35, 0], ['hoyerlift', 1.2, .45, 0]]),
        L('me5', 'melon', 'This is the best Christmas.', 0.3),
        P('end', 1.0, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 5. the exchange: three candles (the same candle), every gift to Strawberry, hers to everyone
    {'id': 'swap', 'clock': '9:00 PM', 'label': 'THE EXCHANGE', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.1}, 'beats': [
        P('open', 1.0, 0.1, []),
        L('t1', 'tom', 'Everybody open at once!', 0.1),
        P('rip', 2.4, 0.05, [['paperrip', .1, .45, -.3], ['paperrip', .25, .45, .3], ['paperrip', .4, .45, -.1], ['paperrip', .55, .45, .1], ['ribbonzip', .9, .35, 0],
                             ['crinkle', 1.4, .35, 0]]),
        L('l1', 'lemon', 'A candle.', 0.1),
        L('m1', 'mango', 'A candle.', 0.1),
        L('o1', 'onion', 'A candle!', 0.15, sfx=[['sniffle', .8, .3, -.3]]),
        L('t2', 'tom', "It's the same candle.", 0.2),
        L('br1', 'brenda', 'It is my candle. From twenty nineteen.', 0.25),
        L('l2', 'lemon', 'And all of ours go to Strawberry.', 0.1),
        P('pile', 2.2, 0.05, [['giftpile', .2, .5, 0], ['giftthump', 1.2, .45, 0]]),
        L('s1', 'straw', 'Grip socks.', 0.15),
        L('o2', 'onion', 'Yellow. Fall risk.', 0.2),
        L('s2', 'straw', 'A mug.', 0.1),
        L('l3', 'lemon', 'Read it.', 0.1),
        L('s3', 'straw', "World's okayest nurse.", 0.25),
        L('s4', 'straw', 'And these are from me.', 0.1),
        L('st1', 'staff', 'Pudding!', 0.3),
        P('end', 1.0, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 6. the carol: the residents sing her a carol on the beat; the night nurse is on time; the Moon
    {'id': 'carol', 'clock': '10:55 PM', 'label': 'THE CAROL', 'head': 0.2, 'tail': 0.5, 'room': 'room', 'amb': {'name': 'hum', 'gain': 0.08}, 'beats': [
        P('open', 1.0, 0.1, []),
        L('pe1', 'pear', 'Nurse. We made you something.', 0.15),
        L('s1', 'straw', "You didn't have to.", 0.2),
        P('intro', CAROL_BAR, 0.0, [['pitchpipe', .1, .4, 0]]),
        carol_line(0, 'On the fifth shift of Christmas,'),
        carol_line(1, 'my nurse she gave to me:'),
        carol_line(2, 'five pudding cups!'),
        carol_line(3, 'Four warm blankets,'),
        carol_line(4, 'three call bells,'),
        carol_line(5, 'two grippy socks,'),
        carol_line(6, 'and a pill in the applesauce!'),
        L('s2', 'straw', "That's not a carol.", 0.15),
        L('pe2', 'pear', "It's a care plan.", 0.3),
        L('eg1', 'egg', "I'm here! On time!", 0.15, sfx=[['doorchime', -.3, .4, .3]]),
        L('s3', 'straw', 'A Christmas miracle.', 0.25),
        L('mo1', 'moon', 'Merry Christmas, three to eleven.', 0.4),
        P('end', 1.4, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 7. the end card: the Secret Santa assignments (every arrow to Strawberry), the teaser for Episode 23
    {'id': 'end', 'clock': '', 'label': 'THANKS FOR WATCHING', 'head': 0.1, 'tail': 0.3, 'room': 'hall', 'beats': [
        P('card', 7.0, 0.1, [['theme22', 0, .5, 0], ['typing', 1.0, .35, 0], ['stamp', 3.9, .5, 0], ['textding', 5.0, .4, 0]]),
    ]},
]

OUT = {
    'title': 'SHIFT HAPPENS',
    'episode': 'Episode 22: The Secret Santa',
    'v2': True,
    'level_lines': True,
    'voices': {k: VOICES[k] for k in ('straw', 'mango', 'lemon', 'onion', 'tom', 'bind', 'melon', 'brenda', 'pear', 'cran', 'rall', 'staff', 'egg', 'moon') if k in VOICES},
    'scenes': SCENES,
    'music': {'from_': 'draw', 'to_': 'carol', 'mute': []},
    'no_whoosh': ['title', 'end'],
    'carol': {'scene': 'carol', 'bpm': CAROL_BPM, 'bar': CAROL_BAR, 'lines': CAROL_IDS, 'intro': 'intro'},
}

if __name__ == '__main__':
    dst = sys.argv[1] if len(sys.argv) > 1 else f'{HERE}/script_ep22.json'
    json.dump(OUT, open(dst, 'w'), indent=1, ensure_ascii=False)
    n_lines = sum(1 for sc in SCENES for b in sc['beats'] if 'who' in b)
    print('wrote', dst, '| scenes', len(SCENES), '| spoken lines', n_lines, '| voices', sorted(OUT['voices']))
