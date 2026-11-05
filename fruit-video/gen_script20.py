"""Episode 20: The Snow Day. Writes script_ep20.json in the project folder.

A blizzard shuts Long Island and nothing shuts the nursing home. 2:00 PM at the station: Tomato is thrilled ("Snow day!"), Compliance says healthcare is essential, the CEO calls it a
"weather-related productivity opportunity", hazard pay turns out to be pizza, the day shift cannot leave, the night shift cannot arrive ("Who is working?" "You are."), and the front door opens
onto a wall of snow. 4:30 PM in the lot the plow driver (Turnip) plows the cars in ("I plowed the lot."), Strawberry's car is a hill, and the night nurse (Eggplant) phones in from a ditch
("When will you be here?" "Spring."). 6:12 PM the power fails: a building cutaway goes dark room by room, the code says the generator starts within ten seconds, Binder (the only lit thing) offers help and
Strawberry says yes, the coffee maker is not on a red outlet ("Coffee is not life safety." "It is to me."), and Brenda has a flashlight from 2019 ("It was a good flashlight."). 8:40 PM in the day room
the residents watch the snow by lamplight; Goji finally gets water ("He is hydrated."); the Moon is behind the weather. 10:59 PM nobody is coming for the night shift, so Strawberry gives report to herself,
the night goes by in a time-lapse, and at seven in the morning the Moon says good morning to the three-to-eleven nurse; the plow buries the door again. The end card is a TV closings ticker.

Each line is a spoken beat; each P() is a silent visual beat. Sound cues sit at fixed offsets from the start of their beat. Voices of the existing cast are copied from earlier scripts so everyone sounds as before.
Usage: python3 gen_script20.py [dst]
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gen_script15 import VOICES as V15, L, P  # noqa: E402

VOICES = dict(V15)
for n, keys in ((13, ('brenda',)), (7, ('pear', 'banana', 'goji')), (12, ('moon', 'cran'))):
    sc = json.load(open(f'{HERE}/script_ep{n}.json'))
    for k in keys:
        VOICES[k] = dict(sc['voices'][k])
VOICES['turnip'] = {'name': 'TURNIP, SNOW PLOW', 'voice': 'am_onyx', 'lang': 'en-us', 'speed': 0.9, 'semis': -2, 'color': '#c9a4d6', 'pan': 0.3}
VOICES['wx'] = {'name': 'CHANNEL 12 WEATHER', 'voice': 'am_eric', 'lang': 'en-us', 'speed': 1.06, 'semis': 1, 'color': '#6aa0ff', 'pan': 0.3}
VOICES['egg'] = {'name': 'EGGPLANT, NIGHTS (ON THE PHONE)', 'voice': 'af_jessica', 'lang': 'en-us', 'speed': 1.0, 'semis': -1, 'color': '#8a5aa8', 'pan': 0.2}
for k, (col, pan, lang) in {'brenda': ('#b07ac0', 0.2, 'en-gb'), 'pear': ('#c9d22a', 0.3, 'en-us'), 'banana': ('#ffd23f', -0.3, 'en-us'),
                            'goji': ('#e0463a', 0.1, 'en-us'), 'cran': ('#d10f3c', -0.15, 'en-gb'), 'moon': ('#9fb7ff', 0.0, 'en-us')}.items():
    VOICES[k].setdefault('color', col)
    VOICES[k].setdefault('pan', pan)
    VOICES[k].setdefault('lang', lang)

SCENES = [
    # ------------------------------------------------------------------ 1. the title: a snow globe of the building; the snow settles into the title
    {'id': 'title', 'clock': '', 'label': '', 'head': 0.2, 'tail': 0.1, 'room': 'hall', 'beats': [
        P('logo', 6.4, 0.1, [['theme20', 0, .8, 0], ['globeshake', .9, .5, 0], ['snowsettle', 2.6, .4, 0], ['textding', 5.2, .45, 0]]),
    ]},

    # ------------------------------------------------------------------ 2. the forecast: healthcare does not have snow days; the door opens onto a wall of snow
    {'id': 'forecast', 'clock': '2:00 PM', 'label': 'THE FORECAST', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'wind', 'gain': 0.12}, 'beats': [
        P('open', 1.3, 0.1, [['tvjingle', .2, .4, .3]]),
        L('w1', 'wx', 'Thirty inches by morning. Travel is not advised.', 0.2),
        L('t1', 'tom', 'Snow day!', 0.1, sfx=[['popper', .4, .4, .2]]),
        L('o1', 'onion', 'Per policy, healthcare is essential.', 0.15, sfx=[['sniffle', 2.1, .3, -.3]]),
        L('l1', 'lemon', 'Essential.', 0.2),
        L('ar1', 'arti', 'This is not a snow day. It is a weather-related productivity opportunity.', 0.15, sfx=[['phoneclick', -.25, .35, .2]]),
        L('s1', 'straw', 'Is there hazard pay?', 0.1),
        L('me1', 'melon', 'There is pizza.', 0.25, sfx=[['phoneclick', -.2, .3, .2]]),
        L('s2', 'straw', 'Of course.', 0.2),
        L('m1', 'mango', 'The day shift cannot leave.', 0.1),
        L('l2', 'lemon', 'The night shift cannot arrive.', 0.15),
        L('s3', 'straw', 'Who is working?', 0.1),
        L('o2', 'onion', 'You are.', 0.2, sfx=[['boardflip', .05, .4, 0]]),
        P('door', 2.0, 0.05, [['doorgust', .3, .6, -.3], ['snowdump', .5, .6, -.3]]),
        L('o3', 'onion', 'The entrance is blocked.', 0.1),
        L('t2', 'tom', 'Snow day!', 0.3, sfx=[['popper', .35, .4, .2]]),
        P('end', 1.0, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 3. the parking lot: the plow plows the cars in; the night nurse is in a ditch
    {'id': 'lot', 'clock': '4:30 PM', 'label': 'THE PARKING LOT', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'wind', 'gain': 0.2}, 'beats': [
        P('open', 1.0, 0.1, [['plowengine', .1, .4, .3]]),
        P('plow', 2.0, 0.05, [['plowscrape', .2, .6, .3], ['plowdump', 1.4, .6, .3]]),
        L('tu1', 'turnip', 'I plowed the lot.', 0.15),
        L('m1', 'mango', 'You plowed in the cars.', 0.15),
        L('tu2', 'turnip', 'I plowed the lot.', 0.2, sfx=[['plowengine', .6, .4, .3]]),
        P('leave', 0.9, 0.05, []),
        L('s1', 'straw', 'Where is my car?', 0.1),
        L('l1', 'lemon', 'That one.', 0.1),
        L('s2', 'straw', 'That is a hill.', 0.25),
        P('dig', 2.4, 0.05, [['shovel', .3, .4, -.2], ['shovel', .9, .4, -.2], ['shovel', 1.5, .4, -.2], ['snowdump', 2.0, .5, -.2]]),
        L('t1', 'tom', 'Snowman contest!', 0.1, sfx=[['partywhistle', .15, .4, .2]]),
        L('o1', 'onion', 'It is a fall risk.', 0.1, sfx=[['slip', .9, .5, -.3], ['thud', 1.3, .5, -.3]]),
        L('o2', 'onion', 'Incident report.', 0.3, sfx=[['sniffle', .6, .3, -.3]]),
        P('ring', 0.9, 0.05, [['phonering', 0, .5, .2]]),
        L('e1', 'egg', 'I am stuck.', 0.1),
        L('s3', 'straw', 'Where?', 0.1),
        L('e2', 'egg', 'A ditch.', 0.1),
        L('m2', 'mango', 'Which ditch?', 0.1),
        L('e3', 'egg', 'A ditch.', 0.15),
        L('s4', 'straw', 'When will you be here?', 0.1),
        L('e4', 'egg', 'Spring.', 0.35),
        P('end', 1.2, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 4. the blackout: ten seconds by code; Binder is the only light; coffee is not life safety
    {'id': 'blackout', 'clock': '6:12 PM', 'label': 'THE BLACKOUT', 'head': 0.2, 'tail': 0.4, 'room': 'room', 'amb': {'name': 'hum', 'gain': 0.08}, 'beats': [
        P('lightsout', 2.4, 0.1, [['powerdown', 0, .7, 0], ['relay', .5, .5, -.3], ['relay', .9, .5, .3], ['relay', 1.3, .5, 0]]),
        L('o1', 'onion', 'Per code, the generator starts in ten seconds.', 0.15, sfx=[['flashlight', -.4, .4, -.2], ['sniffle', 3.1, .3, -.3]]),
        L('b1', 'bind', "It looks like you're in the dark. Would you like help?", 0.1, sfx=[['binderpop', -.15, .4, -.1]]),
        L('s1', 'straw', 'Yes.', 0.2),
        L('b2', 'bind', "Great! I'll...", 0.1, sfx=[['lowbattery', .9, .45, -.1]]),
        P('count', 2.6, 0.05, [['stopwatchticks', 0, .4, -.2]]),
        L('l1', 'lemon', 'Ten.', 0.1),
        P('gen', 1.6, 0.05, [['genstart', 0, .7, .3], ['relay', .8, .5, 0]]),
        L('o1b', 'onion', 'Within code.', 0.2, sfx=[['sniffle', .8, .3, -.3]]),
        L('t1', 'tom', 'Candle party!', 0.1, sfx=[['candleclick', .35, .35, .2], ['candleclick', .6, .35, .1], ['candleclick', .85, .35, .3]]),
        L('o3', 'onion', 'Open flames are prohibited.', 0.1),
        L('t2', 'tom', 'They are LED.', 0.1),
        L('o4', 'onion', 'Approved.', 0.25),
        L('m1', 'mango', 'The coffee maker is not on the red outlet.', 0.1),
        L('s2', 'straw', 'What.', 0.15),
        L('o2', 'onion', 'Coffee is not life safety.', 0.15),
        L('s3', 'straw', 'It is to me.', 0.3),
        L('br1', 'brenda', 'I have a flashlight.', 0.2, sfx=[['flashlight', -.25, .4, .2]]),
        L('br2', 'brenda', 'It is from twenty nineteen.', 0.2, sfx=[['clickdead', 1.7, .4, .2], ['clickdead', 2.15, .4, .2]]),
        L('br3', 'brenda', 'It was a good flashlight.', 0.3),
        P('end', 1.2, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 5. the day room: the residents watch the snow; Goji gets water
    {'id': 'dayroom', 'clock': '8:40 PM', 'label': 'THE DAY ROOM', 'head': 0.2, 'tail': 0.5, 'room': 'room', 'amb': {'name': 'wind', 'gain': 0.1}, 'beats': [
        P('open', 2.2, 0.1, []),
        L('pe1', 'pear', 'It is beautiful.', 0.15),
        L('ba1', 'banana', 'It is cold.', 0.15),
        L('cr1', 'cran', 'In nineteen sixty-two we had a hundred inches.', 0.15),
        L('go1', 'goji', 'Is it water?', 0.1),
        L('l1', 'lemon', 'It is snow.', 0.1),
        L('m1', 'mango', 'It is water.', 0.1, sfx=[['cupset', .35, .3, .2]]),
        L('go2', 'goji', 'Water.', 0.2, sfx=[['slurp', -.4, .35, .1]]),
        P('cups', 2.0, 0.05, [['cupset', .2, .3, -.2], ['slurp', .5, .3, -.1], ['cupset', .9, .3, .1], ['slurp', 1.2, .3, .2], ['cupset', 1.5, .3, .3]]),
        L('l2', 'lemon', 'Everyone is hydrated.', 0.25, sfx=[['pentick', 1.3, .3, .3]]),
        P('plowlight', 1.4, 0.05, [['plowdist', .2, .35, .3]]),
        L('mo1', 'moon', 'I cannot see you. Weather.', 0.3),
        P('end', 1.3, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 6. the long night: report to herself; a time-lapse; the Moon says good morning
    {'id': 'night', 'clock': '10:59 PM', 'label': 'THE LONG NIGHT', 'head': 0.2, 'tail': 0.5, 'room': 'hall', 'amb': {'name': 'wind', 'gain': 0.1}, 'beats': [
        P('open', 1.6, 0.1, [['clocktick', .2, .3, 0]]),
        L('s1', 'straw', 'Is the oncoming nurse here?', 0.1),
        P('wait', 1.5, 0.05, [['windgust', .2, .4, 0], ['clocktick', 0, .3, 0]]),
        L('s2', 'straw', 'I am the oncoming nurse.', 0.15, sfx=[['badgepeel', 1.9, .4, 0]]),
        L('s3', 'straw', 'Report. Everyone is alive.', 0.1),
        L('s4', 'straw', 'Any concerns?', 0.1),
        L('s5', 'straw', 'I am tired.', 0.1),
        L('s6', 'straw', 'Noted.', 0.25),
        P('lapse', 8.0, 0.05, [['lapsewhoosh', 0, .7, 0], ['clockspin', .2, .5, 0], ['windswell', 1.0, .4, 0]]),
        L('mo1', 'moon', 'Good morning, three to eleven.', 0.15),
        L('s7', 'straw', 'What time is it?', 0.1),
        L('mo2', 'moon', 'Seven.', 0.15),
        L('s8', 'straw', 'In the morning?', 0.1),
        L('mo3', 'moon', 'Yes.', 0.25),
        L('s9', 'straw', 'Okay.', 0.35),
        P('dawn', 2.0, 0.05, [['plowdist', .3, .35, .3]]),
        L('tu3', 'turnip', 'I plowed the lot.', 0.3),
        L('o5', 'onion', 'The entrance is blocked.', 0.2, sfx=[['sniffle', 1.6, .3, -.3]]),
        L('s10', 'straw', 'Of course.', 0.4),
        P('end', 1.4, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 7. the end card: the TV closings ticker, the night nurse in the ditch with the pizza, the teaser for Episode 21
    {'id': 'end', 'clock': '', 'label': 'THANKS FOR WATCHING', 'head': 0.1, 'tail': 0.3, 'room': 'hall', 'beats': [
        P('card', 7.0, 0.1, [['theme20', 0, .5, 0], ['typing', 1.0, .35, 0], ['stamp', 3.9, .5, 0], ['textding', 5.0, .4, 0]]),
    ]},
]

OUT = {
    'title': 'SHIFT HAPPENS',
    'episode': 'Episode 20: The Snow Day',
    'v2': True,
    'level_lines': True,
    'voices': {k: VOICES[k] for k in ('straw', 'mango', 'lemon', 'onion', 'tom', 'bind', 'arti', 'melon', 'wx', 'turnip', 'egg', 'brenda', 'pear', 'banana', 'cran', 'goji', 'moon') if k in VOICES},
    'scenes': SCENES,
    'music': {'from_': 'forecast', 'to_': 'night', 'mute': []},
    'no_whoosh': ['title', 'end'],
}

if __name__ == '__main__':
    dst = sys.argv[1] if len(sys.argv) > 1 else f'{HERE}/script_ep20.json'
    json.dump(OUT, open(dst, 'w'), indent=1, ensure_ascii=False)
    n_lines = sum(1 for sc in SCENES for b in sc['beats'] if 'who' in b)
    print('wrote', dst, '| scenes', len(SCENES), '| spoken lines', n_lines, '| voices', sorted(OUT['voices']))
