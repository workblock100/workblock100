"""Episode 14: The Survey. Writes script_ep14.json in the project folder.

A nature documentary about the most dangerous animal in long-term care: the State. The colony (the staff of Fruit Bowl Rehab and Nursing) is calm at 3:02 PM when the surveyor,
Mr. Stateman (the Starfruit from Episode 2: "Don't mind me. I'm just going to observe."), is spotted in the lot. The text goes round the building in eleven seconds, the colony
adapts (the shower room fills, every insulin pen is born today), the surveyor picks one nurse to follow (Strawberry, per diem, not on the staffing sheet), the shower room door
is opened, the residents are interviewed without staff ("Give her a break."), and the exit conference ends with a new tag, F-999: the facility failed to cover its staff.
The last word is the surveyor's: "Don't mind me. I'm just going to help."

Each line is a spoken beat; each P() is a silent visual beat. Sound cues sit at fixed offsets from the start of their beat ("end" = the beat's end). Voices are copied from earlier
scripts so everyone sounds as before. The Plinko board in the verdict scene has its peg hits written here as plink cues (pan = the peg's lane, -1 left to +1 right; the n-th plink of a
beat is the n-th row from the top): the picture and the sound both read them.
Usage: python3 gen_script14.py /home/user/workblock100/fruit-video/script_ep14.json
"""
import json
import sys

PROJECT = '/home/user/workblock100/fruit-video'
s12 = json.load(open(f'{PROJECT}/script_ep12.json'))
s10 = json.load(open(f'{PROJECT}/script_ep10.json'))
s7 = json.load(open(f'{PROJECT}/script_ep7.json'))
s2 = json.load(open(f'{PROJECT}/script_ep2.json'))
s4 = json.load(open(f'{PROJECT}/script_ep4.json'))
VOICES = dict(s12['voices'])
VOICES['cran'] = s10['voices']['cran']
VOICES['banana'] = s10['voices']['banana']
VOICES['narr'] = dict(s4['voices']['narr'], speed=1.1)
VOICES['pear'] = s7['voices']['pear']
VOICES['star'] = dict(s2['voices']['star'], name='MR. STATEMAN, STATE SURVEYOR', pan=0.12, speed=1.1)
VOICES['kum'] = {'name': 'TRAINEE KUMQUAT', 'voice': 'bf_lily', 'lang': 'en-gb', 'speed': 1.12, 'semis': 2, 'color': '#ff9a1f', 'pan': -0.24}
VOICES['rall'] = {'name': 'THE RESIDENTS', 'voice': 'am_fenrir', 'chorus': ['am_fenrir', 'am_echo', 'bf_emma', 'am_puck'], 'speed': 0.95, 'semis': 0, 'color': '#c9d22a', 'pan': 0, 'lang': 'en-us'}


def L(id, who, text, gap, say=None, sfx=None):
    b = {'id': id, 'who': who, 'say': say or text, 'text': text, 'gap': gap}
    if sfx:
        b['sfx'] = [list(x) for x in sfx]
    return b


def P(id, pause, gap=0.05, sfx=None):
    b = {'id': id, 'pause': pause, 'gap': gap}
    if sfx:
        b['sfx'] = [list(x) for x in sfx]
    return b


PD = 'Per dee um'   # how the voice says "per diem"

# ---------------------------------------------------------------- the Plinko board (verdict scene)
# 12 slots A..L left to right, slot k has its centre at x = -1 + (2k + 1) / 12. Twelve rows of pegs from the top; the ball touches one peg per row (x = the lane), then drops into the slot.
SLOT = lambda k: round(-1 + (2 * k + 1) / 12, 3)
BALL3_X = [.02, .14, .26, .38, .5, .62, .5, .62, .74, .86, .74, .86]            # the ball that lands in L (immediate jeopardy, widespread)
BALL3_T = [0.00, .17, .34, .50, .66, .82, .98, 1.14, 1.32, 1.52, 1.78, 2.15]   # slowing at the end: the last peg wobbles


def plinks(xs, ts, gain=.34):
    return [['plink', t, gain, x] for t, x in zip(ts, xs)]


SCENES = [
    # ------------------------------------------------------------------ 1. the title: a documentary dawn over the building
    {'id': 'title', 'clock': '', 'label': '', 'head': 0.2, 'tail': 0.1, 'room': 'hall', 'beats': [
        P('logo', 4.8, 0.1, [['birds', 0, .3, 0], ['theme7', 0, .8, 0], ['textding', 2.5, .45, 0]]),
    ]},

    # ------------------------------------------------------------------ 2. the colony: the dollhouse, the visitor, the alarm call
    {'id': 'colony', 'clock': '3:02 PM', 'label': 'THE COLONY', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'day', 'gain': 0.2}, 'beats': [
        P('open', 1.1, 0.1, [['birds', 0, .25, 0]]),
        L('n1', 'narr', 'Fruit Bowl Rehab and Nursing. Three oh two P M.', 0.2),
        L('n2', 'narr', 'Forty residents. Four staff. One shower room. Do not open it.', 0.25, sfx=[['creak', 2.93, .3, .6]]),
        L('n3', 'narr', 'Once a year, without warning, the State arrives.', 0.25, sfx=[['car', .9, .3, -.4], ['carclose', 2.6, .4, -.4]]),
        L('m1', 'mango', 'The State is in the lot.', 0.15),
        L('l1', 'lemon', 'Everyone act normal.', 0.15),
        L('s1', 'straw', "What's normal?", 0.1),
        L('l2', 'lemon', "What we do when someone's watching.", 0.25),
        L('n4', 'narr', 'The alarm call travels faster than the visitor.', 0.1,
          sfx=[['buzz', .55, .35, -.5], ['buzz', .95, .3, .5], ['buzz', 1.3, .3, -.2], ['buzz', 1.65, .3, .35], ['buzz', 2.0, .3, 0]]),
        P('meer', 1.3, 0.05, [['squeak', .1, .4, -.5], ['squeak', .1, .4, -.15], ['squeak', .12, .4, .2], ['squeak', .14, .4, .5], ['stab', .15, .35, 0]]),
        L('n5', 'narr', 'Eleven seconds. The colony adapts.', 0.15),
        P('end', 0.6, 0.05, [['sting', .1, .4, 0]]),
    ]},

    # ------------------------------------------------------------------ 3. the adaptation: behaviors observed in the colony
    {'id': 'adapt', 'clock': '3:04 PM', 'label': 'THE ADAPTATION', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.15}, 'beats': [
        P('open', 0.4, 0.1),
        L('n2', 'narr', 'Concealment. The shower room now holds the second floor.', 0.15),
        L('m1', 'mango', 'Does it close?', 0.1),
        L('c1', 'clem', 'Sure!', 0.1),
        P('pop', 0.7, 0.05, [['crash', .1, .45, .3], ['clatter', .15, .35, .3]]),
        L('l1', 'lemon', 'It closes.', 0.25),
        L('n3', 'narr', 'Charting. Three weeks, in nine minutes.', 0.15, sfx=[['typing', .4, .4, -.3], ['stamp', .8, .4, -.2], ['stamp', 1.35, .4, 0], ['stamp', 1.9, .4, .2]]),
        L('n4', 'narr', 'Every insulin pen is born today.', 0.1),
        P('cam', 1.4, 0.05, [['shutter', .1, .4, 0], ['scribble', .3, .35, 0], ['shutter', 1.0, .4, 0]]),
        L('n5', 'narr', 'Call lights are answered in nine seconds. Staffing has not changed. Position has.', 0.2),
        L('n6', 'narr', 'The Administrator performs his display.', 0.1),
        L('a1', 'melon', 'We love surveys!', 0.2, sfx=[['pizzabox', -.2, .4, .3], ['sparkle', .1, .3, 0]]),
        P('end', 0.5, 0.05),
    ]},

    # ------------------------------------------------------------------ 4. the entrance conference: the binder, the binoculars, the subject
    {'id': 'arrive', 'clock': '3:09 PM', 'label': 'THE ENTRANCE CONFERENCE', 'head': 0.2, 'tail': 0.4, 'room': 'lobby', 'amb': {'name': 'lobby', 'gain': 0.2}, 'beats': [
        P('open', 1.0, 0.1, [['slidedoor', .1, .5, 0]]),
        L('st1', 'star', "Good afternoon. Don't mind me. I'm just going to observe.", 0.2),
        L('st2', 'star', "I'll need your staffing sheet.", 0.15),
        L('a1', 'melon', "It's in the binder.", 0.1, sfx=[['thud', .7, .6, .3]]),
        L('k1', 'kum', "Is there anything that isn't in the binder?", 0.15),
        L('a2', 'melon', 'The staff.', 0.25),
        L('st3', 'star', 'Noted.', 0.2),
        L('n1', 'narr', 'He selects a subject: the one nobody briefed.', 0.15),
        P('scan', 0.9, 0.05, [['slowwhoosh', 0, .3, 0], ['click', .8, .4, 0]]),
        L('st4', 'star', 'You.', 0.1),
        L('s1', 'straw', 'Strawberry. Per diem.', 0.15, say='Strawberry. ' + PD + '.'),
        L('st5', 'star', 'You are not on the sheet.', 0.1),
        L('s2', 'straw', 'I never am.', 0.15),
        L('st6', 'star', 'Perfect.', 0.2),
        P('end', 0.6, 0.05, [['sting', .1, .4, 0]]),
    ]},

    # ------------------------------------------------------------------ 5. the tracer: one nurse, followed everywhere (a run through the dollhouse)
    {'id': 'tracer', 'clock': '3:15 PM', 'label': 'THE TRACER', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.15}, 'beats': [
        P('open', 0.6, 0.1),
        L('n1', 'narr', 'The tracer. The subject is followed everywhere.', 0.15),
        L('st1', 'star', 'Carry on as you normally would.', 0.15),
        L('s1', 'straw', 'Run.', 0.1),
        P('run', 3.6, 0.05, [['whoosh', 0, .4, 0], ['scramble', .1, .35, 0], ['ding1', 1.1, .25, -.3], ['ding1', 2.1, .25, .3], ['ding1', 2.9, .25, 0]]),
        L('k1', 'kum', 'Everything is perfect.', 0.1),
        L('st2', 'star', 'It is suspicious.', 0.2),
        L('st3', 'star', 'This pen has no open date.', 0.1),
        L('s2', 'straw', "It's day one.", 0.1),
        L('st4', 'star', 'The label says June.', 0.1),
        L('s3', 'straw', "It's a long day.", 0.2),
        P('slip', 1.0, 0.05, [['peel', .15, .5, .3], ['boing', .4, .35, -.2]]),
        L('b1', 'banana', 'Forty-nine!', 0.1),
        L('st5', 'star', 'That is a fall.', 0.1),
        L('s4', 'straw', 'That is a hobby.', 0.2),
        L('st6', 'star', 'What is behind this door?', 0.1),
        L('s5', 'straw', 'Showers.', 0.1),
        L('st7', 'star', 'Open it.', 0.15),
        P('end', 0.4, 0.05),
    ]},

    # ------------------------------------------------------------------ 6. the shower room
    {'id': 'closet', 'clock': '3:21 PM', 'label': 'THE SHOWER ROOM', 'head': 0.2, 'tail': 0.4, 'room': 'break', 'beats': [
        P('open', 0.6, 0.1, [['creak', .1, .4, 0]]),
        L('s1', 'straw', 'Stand back.', 0.1),
        P('slide', 2.6, 0.05, [['slowmo', 0, .5, 0], ['rumble', .1, .5, 0], ['crash', .5, .55, -.2], ['clatter', .9, .45, .2], ['crash', 1.5, .45, .3], ['clatter', 1.9, .4, -.3]]),
        L('n1', 'narr', 'Concealment is not a strategy.', 0.2),
        L('k1', 'kum', 'Is the Christmas tree a tag?', 0.15),
        L('st1', 'star', 'It is a tag.', 0.2),
        P('end', 0.4, 0.05),
    ]},

    # ------------------------------------------------------------------ 7. the residents, without staff
    {'id': 'voices', 'clock': '3:40 PM', 'label': 'THE RESIDENTS', 'head': 0.2, 'tail': 0.4, 'room': 'room', 'amb': {'name': 'hum', 'gain': 0.12}, 'beats': [
        P('open', 0.7, 0.1),
        L('st1', 'star', "I'd like to speak with the residents. Alone.", 0.15),
        L('st2', 'star', 'Do the staff treat you with dignity?', 0.15),
        L('cr1', 'cran', "The girl with the badge sits with me. She says it's nineteen sixty-two. So it is.", 0.2),
        L('pr1', 'pear', "She never takes her break. It's in my contract. I checked.", 0.15),
        L('b1', 'banana', 'She catches me.', 0.1),
        L('b2', 'banana', 'Not the first forty-seven.', 0.2),
        L('st3', 'star', 'Anything you would like the State to know?', 0.2),
        L('ra1', 'rall', 'Give her a break.', 0.3),
        L('n2', 'narr', 'The State is not known to be moved.', 0.1),
        L('st4', 'star', 'Noted.', 0.15),
        P('end', 0.5, 0.05),
    ]},

    # ------------------------------------------------------------------ 8. the exit conference: findings, a Plinko board, and one new tag
    {'id': 'verdict', 'clock': '4:48 PM', 'label': 'THE EXIT CONFERENCE', 'head': 0.2, 'tail': 0.5, 'room': 'room', 'amb': {'name': 'hum', 'gain': 0.12}, 'beats': [
        P('open', 0.8, 0.1, [['drumroll', 0, .3, 0]]),
        L('st1', 'star', 'F seven sixty-one. An insulin pen without an open date.', 0.15, sfx=[['stamp', 3.0, .5, -.5]]),
        L('a1', 'melon', "That's the same tag as last time.", 0.1),
        L('st2', 'star', 'It is the same pen.', 0.2),
        L('st3', 'star', 'F seven twenty-five. Sufficient nursing staff.', 0.1, sfx=[['drumroll', 1.0, .3, 0]]),
        P('ball', 2.3, 0.05, plinks(BALL3_X, BALL3_T)),
        L('a2', 'melon', 'We had five nurses.', 0.1),
        L('st4', 'star', 'You had one.', 0.1, sfx=[['plinkland', .05, .6, SLOT(11)]]),
        P('jeopardy', 1.1, 0.05, [['siren', .1, .4, 0], ['klaxon', .2, .3, 0], ['thud', .5, .5, .3]]),
        L('st5', 'star', 'However. F nine nine nine. The facility failed to cover its staff.', 0.15, sfx=[['stamp', 3.0, .6, 0]]),
        L('a3', 'melon', 'That is not a real tag.', 0.1),
        L('st6', 'star', 'It is now.', 0.2),
        L('st7', 'star', 'Thirty minutes. Seated. Mandatory.', 0.15),
        L('s1', 'straw', 'Can I sit?', 0.1),
        L('st8', 'star', 'It is mandatory.', 0.15),
        P('sit', 1.8, 0.05, [['sit', .2, .4, -.3], ['sit', .5, .4, .3], ['sit', .8, .4, -.1], ['sit', 1.1, .4, .2], ['chair', 1.4, .3, 0]]),
        P('ring', 0.9, 0.05, [['ding1', .1, .6, 0]]),
        L('st9', 'star', "Don't mind me. I'm just going to help.", 0.2),
        P('end', 0.7, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 9. the end card
    {'id': 'end', 'clock': '', 'label': 'THANKS FOR WATCHING', 'head': 0.1, 'tail': 0.3, 'room': 'hall', 'beats': [
        P('card', 7.5, 0.1, [['theme7', 0, .5, 0], ['stamp', 2.34, .5, 0]]),
    ]},
]

OUT = {
    'title': 'SHIFT HAPPENS',
    'episode': 'Episode 14: The Survey',
    'v2': True,
    'level_lines': True,
    'voices': {k: VOICES[k] for k in ('straw', 'mango', 'lemon', 'melon', 'clem', 'cran', 'banana', 'pear', 'narr', 'star', 'kum', 'rall') if k in VOICES},
    'scenes': SCENES,
    'music': {'from_': 'colony', 'to_': 'verdict', 'mute': []},
    'no_whoosh': ['title', 'end'],
}

if __name__ == '__main__':
    dst = sys.argv[1] if len(sys.argv) > 1 else f'{PROJECT}/script_ep14.json'
    json.dump(OUT, open(dst, 'w'), indent=1, ensure_ascii=False)
    n_lines = sum(1 for sc in SCENES for b in sc['beats'] if 'who' in b)
    print('wrote', dst, '| scenes', len(SCENES), '| spoken lines', n_lines, '| voices', sorted(OUT['voices']))
