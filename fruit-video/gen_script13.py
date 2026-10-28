"""Episode 13: The Float Pool. Writes script_ep13.json in the project folder.

A heist film. Strawberry's break has said "pending" since the merger, so the float pool (the people no schedule can find) plans to steal thirty minutes: the call lights
cannot see a per diem badge, the Administrator can be stalled with slides, and the break room has been locked since the audit. Behind the door: Brenda, who went on break in
twenty nineteen. Nobody covered. Strawberry covers. Then the Moon says the Q word.

Each line is a spoken beat; each P() is a silent visual beat. Sound cues sit at fixed offsets from the start of their beat ("end" = the beat's end). Voices are copied from earlier
scripts so everyone sounds as before; the radio voices are the same voices through the phone filter.
Usage: python3 gen_script13.py /home/user/workblock100/fruit-video/script_ep13.json
"""
import json
import sys

PROJECT = '/home/user/workblock100/fruit-video'
s12 = json.load(open(f'{PROJECT}/script_ep12.json'))
s10 = json.load(open(f'{PROJECT}/script_ep10.json'))
s6 = json.load(open(f'{PROJECT}/script_ep6.json'))
s4 = json.load(open(f'{PROJECT}/script_ep4.json'))
VOICES = dict(s12['voices'])
VOICES['cran'] = s10['voices']['cran']
VOICES['banana'] = s10['voices']['banana']
VOICES['narr'] = s4['voices']['narr']
VOICES['all'] = s6['voices']['all']
VOICES['lemonr'] = dict(VOICES['lemon'], name='CHARGE NURSE LEMON, ON THE RADIO', fx='phone')
VOICES['strawr'] = dict(VOICES['straw'], name='NURSE STRAWBERRY, ON THE RADIO', fx='phone')
VOICES['mangor'] = dict(VOICES['mango'], name='CNA MANGO, ON THE RADIO', fx='phone')
VOICES['brenda'] = {'name': 'BRENDA, RN (ON BREAK)', 'voice': 'bf_alice', 'speed': 0.88, 'semis': -4, 'color': '#8e5a9b', 'pan': 0.1, 'lang': 'en-us'}


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

SCENES = [
    # ------------------------------------------------------------------ 1. the title: a vault dial turns, locks, and the lettering lands
    {'id': 'title', 'clock': '', 'label': '', 'head': 0.2, 'tail': 0.1, 'room': 'hall', 'beats': [
        P('logo', 4.8, 0.1, [['theme7', 0, .8, 0], ['vaultdial', 0, .55, 0], ['clunk', 2.4, .7, 0], ['textding', 2.5, .45, 0]]),
    ]},

    # ------------------------------------------------------------------ 2. the open: hour four, the schedule, the word heist
    {'id': 'open', 'clock': '7:02 PM', 'label': "THE NURSES' STATION", 'head': 0.2, 'tail': 0.5, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.25}, 'beats': [
        P('open', 1.0, 0.1, [['phonering', .25, .2, .6]]),
        L('n1', 'narr', 'Fruit Bowl Rehab and Nursing. Seven oh two P M. Hour four.', 0.25),
        L('s1', 'straw', "I haven't sat down since three.", 0.2),
        L('l1', 'lemon', 'You have a break.', 0.15),
        L('s2', 'straw', 'Where?', 0.1),
        L('l2', 'lemon', "It's on the schedule.", 0.2),
        P('sched', 1.8, 0.05, [['paperslide', .05, .5, .2], ['tap', .95, .35, 0], ['poofs', 1.05, .25, 0]]),
        L('s3', 'straw', 'It says pending.', 0.2),
        L('m1', 'mango', "It's said pending since the merger.", 0.2),
        L('l3', 'lemon', "So we're not asking for it.", 0.2),
        L('s4', 'straw', "We're taking it.", 0.25),
        L('l4', 'lemon', 'Thirty minutes. Uninterrupted. One chair.', 0.2),
        L('m2', 'mango', "That's not a break. That's a heist.", 0.2),
        L('l5', 'lemon', "Then we'll need a crew.", 0.1),
        P('end', 0.9, 0.05, [['recscratch', .05, .65, 0], ['sting', .3, .4, 0]]),
    ]},

    # ------------------------------------------------------------------ 3. the plan: the blueprint, three obstacles
    {'id': 'plan', 'clock': '7:09 PM', 'label': 'THE BRIEFING', 'head': 0.2, 'tail': 0.5, 'room': 'room', 'amb': {'name': 'hum', 'gain': 0.18}, 'beats': [
        P('open', 0.9, 0.1, [['holoon', .05, .55, 0], ['holoblip', .55, .35, .3]]),
        L('l1', 'lemon', 'This is the facility.', 0.15, sfx=[['holoblip', .25, .35, 0]]),
        L('l2', 'lemon', 'Thirty-two rooms. Two nurses. One called out.', 0.2, sfx=[['pips', .15, .35, 0]]),
        L('l3', 'lemon', 'And this is the vault. The break room.', 0.2, sfx=[['holoblip', .35, .4, 0]]),
        L('m1', 'mango', 'Why is it locked?', 0.15),
        L('l4', 'lemon', 'Policy fourteen point three.', 0.2, sfx=[['cardslam', .2, .35, 0]]),
        L('c1', 'clem', 'Sure!', 0.15),
        L('l5', 'lemon', 'Obstacle one. The call lights.', 0.2, sfx=[['holoblip', .2, .35, 0], ['laserhum', .9, .3, 0]]),
        L('c2', 'clem', "I can't ignore a call light.", 0.15),
        L('l6', 'lemon', 'Nobody can. Except her.', 0.2),
        L('s1', 'straw', 'Per diem.', 0.15, say=PD + '.'),
        L('l7', 'lemon', "Her badge isn't in the system.", 0.25, sfx=[['holoblip', .6, .35, 0]]),
        L('l8', 'lemon', 'Obstacle two. The Administrator.', 0.2, sfx=[['holoblip', .2, .35, 0]]),
        L('m2', 'mango', "I'll talk to him.", 0.15),
        L('l9', 'lemon', 'He loops every fourteen minutes.', 0.15),
        L('m3', 'mango', 'I can hold him for forty.', 0.2),
        L('l10', 'lemon', 'Obstacle three.', 0.1),
        P('q', 1.0, 0.05, [['drone', 0, .4, 0], ['holoblip', .6, .3, 0]]),
        L('l11', 'lemon', 'The Q word.', 0.15),
        L('c3', 'clem', "What's the...", 0.1, say="What's the-"),
        L('a1', 'all', 'Shh!', 0.2),
        L('l12', 'lemon', "Moon. You're on the window.", 0.15),
        L('mo1', 'moon', 'I see everything.', 0.2),
        L('s2', 'straw', "And if we're caught?", 0.15),
        L('l13', 'lemon', 'Then it was a mandatory in-service.', 0.15),
        P('end', 0.8, 0.05, [['holooff', .05, .5, 0], ['sting', .15, .4, 0]]),
    ]},

    # ------------------------------------------------------------------ 4. the crew: six freeze-frame cards
    {'id': 'crew', 'clock': '', 'label': '', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'beats': [
        P('open', 0.7, 0.05, [['recscratch', .05, .5, 0], ['freezesnap', .35, .5, 0]]),
        L('n1', 'narr', 'The Brains.', 0.1, sfx=[['cardslam', .02, .4, 0]]),
        L('l1', 'lemon', 'Eleven years. One plan.', 0.2),
        L('n2', 'narr', 'The Ghost.', 0.1, sfx=[['freezesnap', .0, .5, 0], ['cardslam', .02, .4, 0]]),
        L('s1', 'straw', "I'm per diem.", 0.2, say="I'm per dee um."),
        L('n3', 'narr', 'The Talker.', 0.1, sfx=[['freezesnap', .0, .5, 0], ['cardslam', .02, .4, 0]]),
        L('m1', 'mango', 'I once made a family like the food.', 0.2),
        L('n4', 'narr', 'The Muscle.', 0.1, sfx=[['freezesnap', .0, .5, 0], ['cardslam', .02, .4, 0]]),
        L('c1', 'clem', 'Sure!', 0.2),
        L('n5', 'narr', 'The Distraction.', 0.1, sfx=[['freezesnap', .0, .5, 0], ['cardslam', .02, .4, 0]]),
        L('b1', 'banana', 'Forty-seven.', 0.2),
        L('n6', 'narr', 'The Eye in the Sky.', 0.1, sfx=[['freezesnap', .0, .5, 0], ['cardslam', .02, .4, 0]]),
        L('mo1', 'moon', "I'm literally the moon.", 0.2),
        P('end', 0.4, 0.05, [['whoosh', .05, .5, 0]]),
    ]},

    # ------------------------------------------------------------------ 5. the hall: call lights as lasers, a walk in slow motion
    {'id': 'hall', 'clock': '7:14 PM', 'label': 'THE HALL', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'alarms', 'gain': 0.16}, 'beats': [
        P('open', 1.1, 0.1, [['beep3', .1, .35, 0], ['laserhum', .3, .3, 0]]),
        L('lr1', 'lemonr', "Ghost. You're clear to enter the hall.", 0.15, sfx=[['radioclick', -.05, .3, 0]]),
        L('sr1', 'strawr', 'Copy.', 0.15, sfx=[['radioclick', -.05, .3, 0]]),
        P('lasers', 3.6, 0.05, [['slowmo', 0, .55, 0], ['heartbeat', .2, .55, 0], ['laserpass', .8, .4, -.3], ['laserpass', 1.6, .4, .3], ['laserpass', 2.4, .4, 0]]),
        L('lr2', 'lemonr', "The lights can't see you.", 0.15, sfx=[['radioclick', -.05, .3, 0]]),
        L('sr2', 'strawr', 'Nobody can.', 0.15),
        P('end', 0.8, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 6. the job: a slide show, a locked door, a banana peel
    {'id': 'cross', 'clock': '7:15 PM', 'label': 'THE JOB', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.18}, 'beats': [
        P('open', 0.7, 0.05, [['beep3', .05, .3, 0]]),
        L('lr1', 'lemonr', 'Administrator is on his loop. Mango.', 0.15, sfx=[['radioclick', -.05, .3, 0]]),
        L('m1', 'mango', 'Hi! Do you have a minute?', 0.15),
        L('a1', 'melon', 'I have fourteen.', 0.15),
        L('m2', 'mango', "I'd like to discuss my schedule.", 0.2),
        L('a2', 'melon', 'Fascinating. Slide one.', 0.15),
        P('slide', 0.9, 0.05, [['clack', .05, .5, .2], ['fanwhir', 0, .15, 0]]),
        L('sr1', 'strawr', "Door's locked. Policy fourteen point three.", 0.15, sfx=[['radioclick', -.05, .3, 0]]),
        L('lr2', 'lemonr', 'Staff may not enter.', 0.15, sfx=[['radioclick', -.05, .3, 0]]),
        L('sr2', 'strawr', "I'm not staff.", 0.15, sfx=[['radioclick', -.05, .3, 0]]),
        P('badge', 1.3, 0.05, [['vmbeep', .1, .4, 0], ['clunk', .6, .6, 0], ['clunk', .85, .5, 0]]),
        L('lr3', 'lemonr', "He's heading your way. Banana. Now.", 0.15, sfx=[['radioclick', -.05, .3, 0]]),
        L('b1', 'banana', 'Now?', 0.1),
        L('lr4', 'lemonr', 'Slip.', 0.1, sfx=[['radioclick', -.05, .3, 0]]),
        P('slip', 1.0, 0.05, [['peel', .15, .5, .3], ['boing', .4, .35, -.2]]),
        L('b2', 'banana', 'Forty-eight!', 0.15),
        L('a3', 'melon', "Mr. Banana! I'll get the form.", 0.15),
        L('m3', 'mango', 'Slide two?', 0.1),
        P('end', 0.7, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 7. the break room: Brenda, "go", the Q word, pending
    {'id': 'vault', 'clock': '7:19 PM', 'label': 'THE BREAK ROOM', 'head': 0.2, 'tail': 0.6, 'room': 'break', 'amb': {'name': 'break', 'gain': 0.25}, 'beats': [
        P('open', 2.6, 0.1, [['doorcreak', .1, .6, 0], ['wind', .2, .3, 0], ['drip', 1.9, .3, .4]]),
        L('s1', 'straw', "It's real.", 0.2),
        L('m1', 'mango', 'Is that a sandwich?', 0.2),
        P('find', 1.3, 0.05, [['stab', .1, .55, 0], ['gasp', .2, .4, 0]]),
        L('l1', 'lemon', 'Brenda.', 0.25),
        L('c1', 'clem', "Who's Brenda?", 0.15),
        L('l2', 'lemon', 'She went on break in twenty nineteen.', 0.2),
        L('m2', 'mango', 'She never came back?', 0.15),
        L('l3', 'lemon', 'Nobody covered.', 0.3),
        L('br1', 'brenda', 'Is someone covering?', 0.2),
        P('gasp', 0.8, 0.05, [['gasp', .05, .4, 0]]),
        L('s2', 'straw', "I've got it. Go.", 0.25),
        L('br2', 'brenda', 'Nobody ever said that.', 0.2),
        P('free', 1.8, 0.05, [['bonecreak', .1, .5, 0], ['dust', .3, .3, 0], ['steps', .9, .4, .3]]),
        P('sit', 1.8, 0.05, [['chair', .3, .5, 0], ['harp', .6, .35, 0], ['wrapper', 1.1, .4, 0]]),
        L('s3', 'straw', 'Mm.', 0.3, sfx=[['munch', .05, .5, 0]]),
        L('mo1', 'moon', "All clear. It's quiet out here.", 0.15),
        P('freeze', 1.6, 0.05, [['recscratch', .05, .5, 0], ['callcascade', .3, .6, 0], ['alarm', .4, .35, 0]]),
        L('l4', 'lemon', 'Moon.', 0.1),
        L('mo2', 'moon', 'Sorry.', 0.15),
        L('l5', 'lemon', "We've got it. Sit.", 0.15),
        L('c2', 'clem', 'Sure!', 0.15),
        L('s4', 'straw', 'Pending.', 0.2),
        P('end', 1.4, 0.05, [['sting', .15, .4, 0], ['doorclose', .5, .5, 0]]),
    ]},

    # ------------------------------------------------------------------ 8. the end card
    {'id': 'end', 'clock': '', 'label': 'THANKS FOR WATCHING', 'head': 0.1, 'tail': 0.3, 'room': 'hall', 'beats': [
        P('card', 7.5, 0.1, [['theme7', 0, .5, 0]]),
    ]},
]

OUT = {
    'title': 'SHIFT HAPPENS',
    'episode': 'Episode 13: The Float Pool',
    'v2': True,
    'level_lines': True,
    'voices': {k: VOICES[k] for k in ('straw', 'strawr', 'mango', 'mangor', 'lemon', 'lemonr', 'melon', 'clem', 'moon', 'cran', 'banana', 'narr', 'all', 'brenda') if k in VOICES},
    'scenes': SCENES,
    'music': {'from_': 'open', 'to_': 'vault', 'mute': []},
    'no_whoosh': ['title', 'end'],
}

if __name__ == '__main__':
    dst = sys.argv[1] if len(sys.argv) > 1 else f'{PROJECT}/script_ep13.json'
    json.dump(OUT, open(dst, 'w'), indent=1, ensure_ascii=False)
    n_lines = sum(1 for sc in SCENES for b in sc['beats'] if 'who' in b)
    print('wrote', dst, '| scenes', len(SCENES), '| spoken lines', n_lines, '| voices', sorted(OUT['voices']))
