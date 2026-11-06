"""Episode 19: The Potluck. Writes script_ep19.json in the project folder.

The week of Thanksgiving, the first potluck since the merger. 3:15 PM: HR's Fun Committee (Tomato) says the potluck is mandatory fun and everyone is bringing rolls (eleven baskets); Compliance wants
an allergen label on every dish ("Contains: bread."); Binder runs Remove Duplicates on the table and eleven baskets become one ("Rolls: one!"). 5:00 PM in the kitchen (Dietary, Chef Cabbage): one turkey,
six textures (sliced, chopped, minced, pureed, molded into a beige turkey), coffee thickened to nectar, honey, pudding ("It is texture modified."); Pineapple brings her father a whole pecan pie, he is on a puree,
so the pie goes in the blender ("Pie smoothie." "It is beige."). 7:45 PM Mango makes Strawberry a plate and it travels through the building hand to hand in one continuous shot, each person adding a label, a
sticker or a thermometer; Strawberry is on med pass. 8:00 PM in the break room the food has been out two hours and Compliance discards all of it, the plate included ("Per policy."); Brenda, who went on break in
2019, has a sandwich ("It was a good year."). 10:40 PM the residents' last round: what are you thankful for ("Water." "It is a UTI."), and Strawberry sits for ten seconds ("A chair.") until a call light rings.

Each line is a spoken beat; each P() is a silent visual beat. Sound cues sit at fixed offsets from the start of their beat. Voices of the existing cast are copied from earlier scripts so everyone sounds as before.
Usage: python3 gen_script19.py [dst]
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gen_script15 import VOICES as V15, L, P  # noqa: E402

VOICES = dict(V15)
for n, keys in ((13, ('brenda',)), (3, ('pine',)), (7, ('pear', 'banana', 'goji')), (12, ('moon', 'cran')), (14, ('rall',))):
    sc = json.load(open(f'{HERE}/script_ep{n}.json'))
    for k in keys:
        VOICES[k] = dict(sc['voices'][k])
VOICES['chef'] = {'name': 'CHEF CABBAGE, DIETARY', 'voice': 'bm_fable', 'lang': 'en-gb', 'speed': 0.92, 'semis': -3, 'color': '#9ccf6a', 'pan': -0.2}
for k, (col, pan, lang) in {'brenda': ('#b07ac0', 0.2, 'en-gb'), 'pine': ('#e8b923', 0.25, 'en-us'), 'pear': ('#c9d22a', 0.3, 'en-us'), 'banana': ('#ffd23f', -0.3, 'en-us'),
                            'goji': ('#e0463a', 0.1, 'en-us'), 'cran': ('#d10f3c', -0.15, 'en-gb'), 'moon': ('#9fb7ff', 0.0, 'en-us')}.items():
    VOICES[k].setdefault('color', col)
    VOICES[k].setdefault('pan', pan)
    VOICES[k].setdefault('lang', lang)

SCENES = [
    # ------------------------------------------------------------------ 1. the title: a slow cooker on KEEP WARM, the steam writes the title
    {'id': 'title', 'clock': '', 'label': '', 'head': 0.2, 'tail': 0.1, 'room': 'hall', 'beats': [
        P('logo', 6.4, 0.1, [['theme15', 0, .8, 0], ['lidrattle', 1.0, .45, 0], ['steam', 1.6, .4, 0], ['lidrattle', 3.0, .45, 0], ['textding', 5.2, .45, 0]]),
    ]},

    # ------------------------------------------------------------------ 2. the sign-up: mandatory fun, eleven baskets of rolls, Remove Duplicates
    {'id': 'signup', 'clock': '3:15 PM', 'label': 'THE SIGN-UP', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.14}, 'beats': [
        P('open', 0.9, 0.1, [['click', .3, .3, 0]]),
        L('t1', 'tom', 'Potluck! Mandatory fun!', 0.15),
        L('m1', 'mango', 'What do I bring?', 0.1),
        L('t2', 'tom', 'Rolls.', 0.1, sfx=[['basket', .55, .35, -.3]]),
        L('l1', 'lemon', 'What do I bring?', 0.1),
        L('t3', 'tom', 'Rolls.', 0.1, sfx=[['basket', .55, .35, .1]]),
        L('s1', 'straw', 'What do I bring?', 0.1),
        L('t4', 'tom', 'Rolls.', 0.2, sfx=[['basket', .55, .35, .3]]),
        P('table', 1.5, 0.05, [['basket', 0, .3, -.3], ['basket', .15, .3, .2], ['basket', .3, .3, -.1], ['basket', .45, .3, .3], ['basket', .6, .3, 0], ['basket', .75, .3, -.2], ['basket', .9, .3, .2], ['basket', 1.05, .3, 0]]),
        L('o1', 'onion', 'Every dish needs an allergen label.', 0.15, sfx=[['sniffle', 1.9, .3, -.3]]),
        L('m2', 'mango', 'It is rolls.', 0.1),
        L('o2', 'onion', 'Contains: bread.', 0.25, sfx=[['sniffle', .9, .3, -.3]]),
        L('b1', 'bind', "It looks like you're planning a potluck. Would you like help?", 0.1, sfx=[['binderpop', -.15, .4, -.1]]),
        L('s2', 'straw', 'No.', 0.1),
        L('b2', 'bind', "Great! I'll help.", 0.1, sfx=[['grin', .55, .3, -.1]]),
        P('dedupe', 2.0, 0.05, [['dedupe', 0, .5, 0], ['poof', .3, .35, -.3], ['poof', .5, .35, .2], ['poof', .7, .35, -.1], ['poof', .9, .35, .3], ['poof', 1.1, .35, 0], ['poof', 1.3, .35, -.2]]),
        L('b3', 'bind', 'Rolls: one!', 0.1),
        L('l2', 'lemon', 'That is not a potluck.', 0.15),
        L('t5', 'tom', 'Efficiency.', 0.3),
        P('end', 1.0, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 3. the kitchen: one turkey, six textures; thickened coffee; a pie goes in the blender
    {'id': 'kitchen', 'clock': '5:00 PM', 'label': 'THE KITCHEN', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.1}, 'beats': [
        P('open', 1.1, 0.1, [['clatter', .2, .35, -.3], ['clatter', .7, .3, .3]]),
        L('c1', 'chef', 'Thanksgiving. Forty residents. Six diets.', 0.15),
        L('m1', 'mango', 'How many turkeys?', 0.1),
        L('c2', 'chef', 'One turkey. Six textures.', 0.2),
        P('carve', 3.4, 0.05, [['carve', .2, .5, -.2], ['chop', 1.0, .4, 0], ['blender', 1.6, .6, .2], ['moldpress', 3.0, .5, 0]]),
        L('s1', 'straw', 'Is that turkey?', 0.1),
        L('c3', 'chef', 'It is a beige turkey.', 0.2),
        P('pour', 0.9, 0.05, [['pourcoffee', 0, .4, .2]]),
        L('c4', 'chef', 'Nectar. Honey. Pudding.', 0.1, sfx=[['glop', .3, .5, .2], ['glop', .9, .5, .2], ['glop', 1.5, .5, .2]]),
        L('s2', 'straw', 'It was coffee.', 0.1),
        L('c5', 'chef', 'It is texture modified.', 0.25),
        L('p1', 'pine', 'I brought my father a pie.', 0.1, sfx=[['doorbell', -.4, .35, -.3]]),
        L('s3', 'straw', 'He is on a puree.', 0.1),
        L('p2', 'pine', 'It is Thanksgiving.', 0.1),
        L('s4', 'straw', 'Then the pie is on a puree.', 0.15),
        P('smoothie', 2.4, 0.05, [['blender', 0, .6, .2], ['moldpress', 1.9, .5, 0]]),
        L('c6', 'chef', 'Pie smoothie.', 0.1),
        L('p3', 'pine', 'Can I speak to your manager?', 0.1),
        L('c7', 'chef', 'I am the manager.', 0.1),
        L('p4', 'pine', 'Is it good?', 0.1),
        L('c8', 'chef', 'It is beige.', 0.3),
        P('end', 1.0, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 4. the plate: one continuous shot, a plate passed hand to hand through the building
    {'id': 'plate', 'clock': '7:45 PM', 'label': 'THE PLATE', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.12}, 'beats': [
        P('open', 1.0, 0.1, [['plateclink', .3, .3, 0]]),
        L('m1', 'mango', 'I made you a plate.', 0.1),
        P('walk1', 1.7, 0.05, []),
        L('l1', 'lemon', 'I will hold it.', 0.1, sfx=[['peel', .9, .3, -.2]]),
        P('walk2', 1.4, 0.05, []),
        L('t1', 'tom', 'Fun Committee!', 0.1, sfx=[['peel', .9, .3, .1]]),
        P('walk3', 1.3, 0.05, []),
        L('o1', 'onion', 'It is seventy-eight degrees.', 0.1, sfx=[['probebeep', 1.4, .4, -.2], ['sniffle', 2.0, .3, -.3]]),
        P('walk4', 1.3, 0.05, []),
        L('pe1', 'pear', 'Is that turkey?', 0.1),
        L('m3', 'mango', 'It is beige.', 0.15),
        P('walk5', 1.2, 0.05, []),
        L('b1', 'bind', "I'll help!", 0.1, sfx=[['binderpop', -.15, .4, 0]]),
        P('walk6', 1.5, 0.05, [['callchime', .3, .4, .3]]),
        L('s1', 'straw', 'I am on med pass.', 0.1),
        L('m2', 'mango', 'It is your break.', 0.1),
        L('s2', 'straw', 'What time is it?', 0.2),
        P('end', 1.2, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 5. the break room: two hours is two hours; Brenda has a sandwich
    {'id': 'breakroom', 'clock': '8:00 PM', 'label': 'THE BREAK ROOM', 'head': 0.2, 'tail': 0.4, 'room': 'room', 'amb': {'name': 'hum', 'gain': 0.1}, 'beats': [
        P('open', 1.2, 0.1, [['mwbeep', .1, .35, -.3], ['mwbeep', .45, .35, -.3], ['mwbeep', .8, .35, -.3]]),
        L('q1', 'lemon', 'Who is next for the microwave?', 0.1),
        L('q2', 'mango', 'Ninety seconds each.', 0.1),
        L('q3', 'lemon', 'There are eleven of us.', 0.15),
        L('q4', 'tom', 'It is bonding!', 0.2),
        L('o1', 'onion', 'The food has been out two hours.', 0.15, sfx=[['sniffle', 1.8, .3, -.3]]),
        L('t1', 'tom', 'It is a party!', 0.1),
        L('o2', 'onion', 'Per policy, it is discarded.', 0.2),
        L('s1', 'straw', 'I have not eaten.', 0.15),
        P('timer', 1.0, 0.05, [['timerding', .3, .6, 0]]),
        P('sweep', 1.8, 0.05, [['bagsweep', .1, .6, 0], ['bin', .9, .5, .3], ['bin', 1.25, .4, .3]]),
        L('s2', 'straw', 'That was my break.', 0.25),
        L('br1', 'brenda', 'I have a sandwich.', 0.2),
        L('m1', 'mango', 'Brenda?', 0.1),
        L('l1', 'lemon', 'Where did you come from?', 0.1),
        L('br2', 'brenda', 'I have been here since twenty nineteen.', 0.2),
        L('s3', 'straw', 'Is it good?', 0.1),
        L('br3', 'brenda', 'It was a good year.', 0.3),
        P('end', 1.0, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 6. the last round: what are you thankful for; a chair; a call light
    {'id': 'thanks', 'clock': '10:40 PM', 'label': 'THE LAST ROUND', 'head': 0.2, 'tail': 0.5, 'room': 'room', 'amb': {'name': 'hum', 'gain': 0.1}, 'beats': [
        P('open', 1.0, 0.1, []),
        L('pe1', 'pear', 'I am thankful for my daughter.', 0.15),
        L('ba1', 'banana', 'I am thankful for not falling.', 0.15),
        L('cr1', 'cran', 'I am thankful for nineteen sixty-two.', 0.15),
        L('go1', 'goji', 'I am thankful for water.', 0.1),
        L('l1', 'lemon', 'It is a UTI.', 0.25),
        L('r1', 'rall', 'Strawberry?', 0.15),
        L('s0', 'straw', 'I am on med pass.', 0.15),
        L('r2', 'rall', 'Sit.', 0.2),
        P('beat', 1.1, 0.05, []),
        L('s1', 'straw', 'A chair.', 0.15),
        P('sit', 1.6, 0.05, [['chairsit', .1, .45, 0]]),
        P('call', 0.9, 0.05, [['callchime', .1, .5, .3]]),
        L('s2', 'straw', 'Okay.', 0.3),
        L('mo1', 'moon', 'Happy Thanksgiving, three to eleven.', 0.3),
        P('end', 1.4, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 7. the end card: the sign-up sheet with the results, the teaser for Episode 20
    {'id': 'end', 'clock': '', 'label': 'THANKS FOR WATCHING', 'head': 0.1, 'tail': 0.3, 'room': 'hall', 'beats': [
        P('card', 7.0, 0.1, [['theme15', 0, .5, 0], ['typing', 1.0, .35, 0], ['stamp', 3.9, .5, 0], ['textding', 5.0, .4, 0]]),
    ]},
]

OUT = {
    'title': 'SHIFT HAPPENS',
    'episode': 'Episode 19: The Potluck',
    'v2': True,
    'level_lines': True,
    'voices': {k: VOICES[k] for k in ('straw', 'mango', 'lemon', 'onion', 'tom', 'bind', 'chef', 'pine', 'brenda', 'pear', 'banana', 'cran', 'goji', 'rall', 'moon') if k in VOICES},
    'scenes': SCENES,
    'music': {'from_': 'signup', 'to_': 'thanks', 'mute': []},
    'no_whoosh': ['title', 'end'],
}

if __name__ == '__main__':
    dst = sys.argv[1] if len(sys.argv) > 1 else f'{HERE}/script_ep19.json'
    json.dump(OUT, open(dst, 'w'), indent=1, ensure_ascii=False)
    n_lines = sum(1 for sc in SCENES for b in sc['beats'] if 'who' in b)
    print('wrote', dst, '| scenes', len(SCENES), '| spoken lines', n_lines, '| voices', sorted(OUT['voices']))
