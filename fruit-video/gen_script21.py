"""Episode 21: The Inspection. Writes script_ep21.json in the project folder.

The State arrives unannounced. 3:02 PM: two surveyors from the Department of Health (Ms. Kale, Mr. Radish) walk in; the news travels down the hall in whispers ("The State is here."), Compliance
(Onion) has the best day of her life, the Administrator calls a Code Survey, Binder offers help and, for once, everyone says yes ("Great! I'll hide everything."). 3:05 PM: a beat-synced
montage turns the building survey-ready (labels, padlocks, thermometers, the coffee maker hidden, Brenda shut in a closet) and forty agency Strawberries appear for one day. 5:30 PM: the med pass
observation in split screen: on the left the perfect med pass the surveyor sees, on the right the same pass on a normal night ("How long does your med pass take?" "Two hours." "And today?" "Six.").
7:10 PM: the surveyor asks for the policy on breaks; the policy closet avalanches; his scanner finds Brenda ("How long have you been on break?" "Since twenty nineteen."). 10:45 PM: the exit
interview: one deficiency, the nurse has not taken a break ("Which nurse?" "The one."); per regulation she takes one, at 10:59; deficiency corrected; the State leaves and everything snaps back;
the night nurse arrives from the ditch ("Spring came early."). The end card is the Statement of Deficiencies.

Each line is a spoken beat; each P() is a silent visual beat. Sound cues sit at fixed offsets from the start of their beat. Voices of the existing cast are copied from earlier scripts so everyone sounds as before.
Usage: python3 gen_script21.py [dst]
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gen_script15 import VOICES as V15, L, P  # noqa: E402

VOICES = dict(V15)
for n, keys in ((13, ('brenda',)), (7, ('pear',)), (20, ('egg',))):
    sc = json.load(open(f'{HERE}/script_ep{n}.json'))
    for k in keys:
        VOICES[k] = dict(sc['voices'][k])
VOICES['egg']['name'] = 'EGGPLANT, NIGHTS'
VOICES['kale'] = {'name': 'MS. KALE, STATE SURVEYOR', 'voice': 'bf_alice', 'lang': 'en-gb', 'speed': 0.98, 'semis': 0, 'color': '#3f8f4a', 'pan': -0.15}
VOICES['radish'] = {'name': 'MR. RADISH, STATE SURVEYOR', 'voice': 'am_echo', 'lang': 'en-us', 'speed': 0.92, 'semis': -2, 'color': '#c2304f', 'pan': 0.2}
VOICES['staff'] = {'name': 'THE WHOLE 3-11', 'voice': 'af_heart', 'chorus': ['af_heart', 'af_bella', 'am_michael', 'af_river', 'bf_isabella'], 'lang': 'en-us',
                   'speed': 1.05, 'semis': 0, 'color': '#ffb703', 'pan': 0}
for k, (col, pan, lang) in {'brenda': ('#b07ac0', 0.2, 'en-gb'), 'pear': ('#c9d22a', 0.3, 'en-us')}.items():
    VOICES[k].setdefault('color', col)
    VOICES[k].setdefault('pan', pan)
    VOICES[k].setdefault('lang', lang)

SCENES = [
    # ------------------------------------------------------------------ 1. the title: a surveyor's clipboard checks the title off and stamps it
    {'id': 'title', 'clock': '', 'label': '', 'head': 0.2, 'tail': 0.1, 'room': 'hall', 'beats': [
        P('logo', 6.4, 0.1, [['theme21', 0, .8, 0], ['penclick', .8, .4, 0], ['checktick', 1.6, .4, -.1], ['checktick', 2.2, .4, 0], ['checktick', 2.8, .4, .1],
                             ['stamp', 3.6, .5, 0], ['textding', 5.2, .45, 0]]),
    ]},

    # ------------------------------------------------------------------ 2. the arrival: the State walks in; a whisper chain; Code Survey; everyone says yes to Binder
    {'id': 'arrive', 'clock': '3:02 PM', 'label': 'THE ARRIVAL', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.12}, 'beats': [
        P('open', 1.4, 0.1, [['doorchime', .2, .5, -.2], ['dramatic', .5, .6, 0]]),
        L('ka1', 'kale', 'Department of Health. This is an unannounced survey.', 0.3),
        L('m1', 'mango', 'The State is here.', 0.1),
        L('l1', 'lemon', 'The State is here.', 0.1),
        L('t1', 'tom', 'The State is here.', 0.1),
        L('o1', 'onion', 'The State is here!', 0.2, sfx=[['sniffle', 1.0, .3, -.3]]),
        L('o2', 'onion', 'This is the best day of my life.', 0.25, sfx=[['sniffle', 1.9, .3, -.3]]),
        L('ra0', 'radish', 'We will start with your staffing sheet.', 0.2),
        L('me1', 'melon', 'Code Survey. Code Survey. All staff to your stations.', 0.2, sfx=[['pachime', -.45, .4, 0]]),
        L('b1', 'bind', "It looks like you're being inspected. Would you like help?", 0.1, sfx=[['binderpop', -.15, .4, -.1]]),
        L('st1', 'staff', 'Yes!', 0.25),
        L('b2', 'bind', "Great! I'll hide everything.", 0.3, sfx=[['grin', .9, .3, -.1]]),
        P('end', 1.0, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 3. survey mode: a beat-synced montage (120 bpm, a shot every two beats), forty agency Strawberries, Brenda hidden
    {'id': 'prep', 'clock': '3:05 PM', 'label': 'SURVEY MODE', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.1}, 'beats': [
        P('open', 0.8, 0.1, []),
        L('t1', 'tom', 'Label everything!', 0.1),
        L('o1', 'onion', 'Date it. Time it. Initial it.', 0.15),
        L('t2', 'tom', 'Should I cancel the Fun Committee?', 0.1),
        L('o1b', 'onion', 'Laminate it.', 0.2),
        P('montage', 12.0, 0.05, [['labelgun', 0.0, .45, -.2], ['padlock', 1.0, .45, .2], ['spray', 2.0, .4, -.1], ['thermobeep', 3.0, .4, .2], ['binderslam', 4.0, .5, 0],
                                   ['mop', 5.0, .4, -.2], ['posterflip', 6.0, .4, .2], ['closetslam', 7.0, .5, .3], ['coffeehide', 8.0, .45, -.2], ['sanitizer', 9.0, .4, .1],
                                   ['crashcart', 10.0, .45, -.1], ['sparkle', 11.0, .45, 0]]),
        L('me1', 'melon', 'Where is our staffing?', 0.1),
        P('agency', 1.2, 0.05, [['poof', .1, .4, -.3], ['poof', .35, .4, 0], ['poof', .6, .4, .3]]),
        L('ch1', 'chor', 'Agency!', 0.15),
        L('s1', 'straw', 'Who are they?', 0.1),
        L('l1', 'lemon', 'Agency. For one day.', 0.2),
        L('br1', 'brenda', 'I have been hiding since twenty nineteen.', 0.2),
        L('o2', 'onion', 'Survey ready.', 0.3, sfx=[['sparkle', .5, .4, 0]]),
        P('end', 1.0, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 4. the observation: split screen, the med pass the State sees and the med pass on a normal night
    {'id': 'medpass', 'clock': '5:30 PM', 'label': 'THE OBSERVATION', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.1}, 'beats': [
        P('open', 1.3, 0.1, [['splitwipe', .3, .45, 0]]),
        L('ka1', 'kale', 'Please proceed as you normally would.', 0.2),
        L('s1', 'straw', 'I always do this.', 0.2),
        P('hygiene', 1.6, 0.05, [['sanitizer', .2, .4, -.4], ['sanitizer', .9, .4, -.4], ['cupclatter', .4, .4, .4]]),
        L('s2', 'straw', 'What is your name and date of birth?', 0.1),
        L('pe1', 'pear', 'The same as yesterday.', 0.2),
        L('ka4', 'kale', 'Do you always lock the cart?', 0.1),
        L('s7', 'straw', 'Always.', 0.2, sfx=[['cartroll', .3, .4, .5]]),
        L('ka5', 'kale', 'And explain every medication?', 0.1),
        L('s8', 'straw', 'Always.', 0.2, sfx=[['cupclatter', .3, .4, .5]]),
        L('ka2', 'kale', 'How long does your med pass take?', 0.1),
        L('s3', 'straw', 'Two hours.', 0.15),
        L('ka3', 'kale', 'And today?', 0.1),
        L('s4', 'straw', 'Six.', 0.25),
        L('pe2', 'pear', 'Who is that?', 0.1),
        L('s5', 'straw', 'The State.', 0.1),
        L('pe3', 'pear', 'Should I behave?', 0.1),
        L('s6', 'straw', 'Please.', 0.15),
        L('pe4', 'pear', 'I always behave.', 0.3),
        P('end', 1.2, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 5. the policy closet: a binder avalanche; the surveyor's scanner finds Brenda
    {'id': 'closet', 'clock': '7:10 PM', 'label': 'THE POLICY CLOSET', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.1}, 'beats': [
        P('open', 1.0, 0.1, []),
        L('ra1', 'radish', 'I would like to see your policy on breaks.', 0.15),
        L('o1', 'onion', 'Of course.', 0.1),
        P('avalanche', 2.6, 0.05, [['closetopen', .1, .45, 0], ['binderavalanche', .3, .7, 0]]),
        L('o2', 'onion', 'Policy seven point four. Revised Tuesday.', 0.15),
        L('ra2', 'radish', 'Impressive.', 0.2),
        P('scan', 2.2, 0.05, [['scanbeep', .2, .35, -.2], ['scanbeep', .7, .35, .2], ['scanlock', 1.4, .45, .3]]),
        L('ra3', 'radish', 'Who is in the closet?', 0.15),
        L('br1', 'brenda', 'Nobody.', 0.2),
        L('ra4', 'radish', 'How long have you been on break?', 0.15),
        L('br2', 'brenda', 'Since twenty nineteen.', 0.2),
        L('ra5', 'radish', 'Noted.', 0.15, sfx=[['penscratch', .5, .35, .2]]),
        L('o3', 'onion', 'Not Brenda.', 0.3, sfx=[['sniffle', .8, .3, -.3]]),
        P('end', 1.2, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 6. the exit interview: one deficiency; the nurse takes her break at 10:59; the State leaves; the night nurse arrives
    {'id': 'exit', 'clock': '10:45 PM', 'label': 'THE EXIT INTERVIEW', 'head': 0.2, 'tail': 0.5, 'room': 'room', 'amb': {'name': 'hum', 'gain': 0.1}, 'beats': [
        P('open', 1.2, 0.1, []),
        L('ka1', 'kale', 'We found one deficiency.', 0.3, sfx=[['gasp', 1.5, .45, 0]]),
        L('me1', 'melon', 'What is it?', 0.1),
        L('ra1', 'radish', 'Your nurse has not taken a break.', 0.25),
        L('s1', 'straw', 'Which nurse?', 0.15),
        L('ra2', 'radish', 'The one.', 0.25),
        L('ka2', 'kale', 'Per regulation, she takes one now.', 0.15),
        L('o1', 'onion', 'Per regulation!', 0.2, sfx=[['sniffle', .9, .3, -.3]]),
        P('clock', 1.2, 0.05, [['clocktick', .2, .35, 0]]),
        L('s2', 'straw', 'Okay.', 0.2),
        P('break', 3.6, 0.05, [['chairsit', .1, .45, 0], ['exhale', .8, .35, 0], ['clocktick', 2.9, .35, 0], ['shiftbell', 3.3, .45, 0]]),
        L('ka3', 'kale', 'Deficiency corrected.', 0.15, sfx=[['stamp', .9, .5, 0]]),
        P('revert', 2.4, 0.05, [['doorclose', .1, .4, -.3], ['poof', .6, .4, 0], ['closetopen', 1.0, .4, .3], ['coffeemaker', 1.5, .4, -.2], ['labelpeel', 1.9, .35, .2]]),
        L('eg1', 'egg', "I'm here!", 0.15, sfx=[['doorchime', -.3, .4, .3]]),
        L('s3', 'straw', 'From the ditch?', 0.1),
        L('eg2', 'egg', 'Spring came early.', 0.25),
        L('s4', 'straw', 'Report. Everyone is alive.', 0.1),
        L('eg3', 'egg', 'Any concerns?', 0.15),
        L('s5', 'straw', 'I took a break.', 0.4),
        P('end', 1.4, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 7. the end card: the Statement of Deficiencies, the teaser for Episode 22
    {'id': 'end', 'clock': '', 'label': 'THANKS FOR WATCHING', 'head': 0.1, 'tail': 0.3, 'room': 'hall', 'beats': [
        P('card', 7.0, 0.1, [['theme21', 0, .5, 0], ['typing', 1.0, .35, 0], ['stamp', 3.9, .5, 0], ['textding', 5.0, .4, 0]]),
    ]},
]

OUT = {
    'title': 'SHIFT HAPPENS',
    'episode': 'Episode 21: The Inspection',
    'v2': True,
    'level_lines': True,
    'voices': {k: VOICES[k] for k in ('straw', 'mango', 'lemon', 'onion', 'tom', 'bind', 'melon', 'kale', 'radish', 'staff', 'chor', 'brenda', 'pear', 'egg') if k in VOICES},
    'scenes': SCENES,
    'music': {'from_': 'arrive', 'to_': 'exit', 'mute': []},
    'no_whoosh': ['title', 'end'],
}

if __name__ == '__main__':
    dst = sys.argv[1] if len(sys.argv) > 1 else f'{HERE}/script_ep21.json'
    json.dump(OUT, open(dst, 'w'), indent=1, ensure_ascii=False)
    n_lines = sum(1 for sc in SCENES for b in sc['beats'] if 'who' in b)
    print('wrote', dst, '| scenes', len(SCENES), '| spoken lines', n_lines, '| voices', sorted(OUT['voices']))
