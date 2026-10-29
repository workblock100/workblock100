"""Episode 15: The Merger. Writes script_ep15.json in the project folder.

The day Fruit Bowl is acquired (the origin of "Strawberry's break has said pending since the merger", Episode 13), carried out as operations in a spreadsheet. At 3:00 PM a mandatory all-hands on a
rolling TV: the CEO of Greenleaf Senior Living, Mr. Artichoke (eleven layers; his heart is somewhere inside), shares his screen. Binder, a binder-clip assistant, asks whether anyone would like help
(Strawberry: "No." Binder: "Great! I'll help."), warns that merging keeps only the top-left value ("It is discarded!"), and Clementine says "Sure!". Reality obeys the sheet: a crane stacks Greenleaf
on Fruit Bowl, the staff try to zipper-merge in the corridor, pizza meets salad. The consultants (Onion, Compliance; Tomato, HR) run the model: Insert Row (an Executive Suite; the lobby goes below the
sheet), Remove Duplicates, Fill Down (Strawberry x40), a lookup that fails ("I never am."), Find & Replace (BREAK becomes PENDING). New sign, Ctrl+Z ("Can't undo!"), and Binder's last offer.

Each line is a spoken beat; each P() is a silent visual beat. Sound cues sit at fixed offsets from the start of their beat ("end" = the beat's end). Voices of the existing cast are copied from earlier scripts
so everyone sounds as before. The collisions of the physics scenes (dock, close) are NOT written here: their foley is computed from the simulations (build/ep15/phys_events.json); the big cues below
(dockimpact, banner) are the moments the simulations are authored to hit exactly.
Usage: python3 gen_script15.py /home/user/workblock100/fruit-video/script_ep15.json
"""
import json
import sys

PROJECT = '/home/user/workblock100/fruit-video'
s12 = json.load(open(f'{PROJECT}/script_ep12.json'))
s2 = json.load(open(f'{PROJECT}/script_ep2.json'))
VOICES = dict(s12['voices'])
VOICES['arti'] = {'name': 'MR. ARTICHOKE, CEO', 'voice': 'bm_daniel', 'lang': 'en-gb', 'speed': 0.93, 'semis': -2, 'color': '#8fbf5a', 'pan': 0.22}
VOICES['onion'] = {'name': 'ONION, COMPLIANCE', 'voice': 'af_river', 'lang': 'en-us', 'speed': 0.96, 'semis': 0, 'color': '#e6c27a', 'pan': -0.2}
VOICES['tom'] = {'name': 'TOMATO, HR', 'voice': 'bf_isabella', 'lang': 'en-gb', 'speed': 1.12, 'semis': 1, 'color': '#ff6a4d', 'pan': 0.15}
VOICES['broc'] = {'name': 'BROCCOLI, GREENLEAF', 'voice': 'bm_lewis', 'lang': 'en-gb', 'speed': 0.98, 'semis': -3, 'color': '#5fbf5f', 'pan': 0.25}
VOICES['carrot'] = {'name': 'CARROT, GREENLEAF', 'voice': 'am_liam', 'lang': 'en-us', 'speed': 1.06, 'semis': 0, 'color': '#ff9a3c', 'pan': 0.3}
VOICES['bind'] = {'name': 'BINDER', 'voice': 'af_sarah', 'lang': 'en-us', 'speed': 1.12, 'semis': 2, 'color': '#5b6b82', 'pan': -0.1}
VOICES['chor'] = {'name': 'ALL THE STRAWBERRIES', 'voice': 'af_heart', 'chorus': ['af_heart', 'af_bella', 'af_kore', 'af_nicole', 'af_sky', 'af_nova'], 'lang': 'en-us',
                  'speed': 1.02, 'semis': 0, 'color': '#ff4d6d', 'pan': 0}


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


SCENES = [
    # ------------------------------------------------------------------ 1. the title: three cells are merged and centred
    {'id': 'title', 'clock': '', 'label': '', 'head': 0.2, 'tail': 0.1, 'room': 'hall', 'beats': [
        P('logo', 6.2, 0.1, [['theme15', 0, .8, 0], ['click', .95, .4, -.15], ['click', 1.9, .4, .2], ['merge', 2.1, .6, 0], ['textding', 3.8, .45, 0]]),
    ]},

    # ------------------------------------------------------------------ 2. the all-hands: a rolling TV, a CEO with eleven layers, a helpful assistant
    {'id': 'announce', 'clock': '3:00 PM', 'label': 'THE ANNOUNCEMENT', 'head': 0.2, 'tail': 0.4, 'room': 'room', 'amb': {'name': 'hum', 'gain': 0.12}, 'beats': [
        P('open', 0.8, 0.1, [['callconnect', .2, .4, .3]]),
        L('a1', 'melon', 'Team. Big news. Fruit Bowl is merging.', 0.2),
        L('l1', 'lemon', 'With who?', 0.1),
        L('a2', 'melon', 'Greenleaf Senior Living.', 0.2),
        L('ar1', 'arti', 'We value our people. At our core.', 0.2, sfx=[['peel', 1.5, .4, .25], ['heartbeat', 2.1, .3, .25]]),
        L('s1', 'straw', 'What changes?', 0.1),
        L('ar2', 'arti', 'Nothing. Nothing changes.', 0.1, sfx=[['glitch', 1.55, .45, .25]]),
        L('m1', 'mango', "You're frozen.", 0.1),
        P('stuck', 0.7, 0.1, [['spinner', .05, .25, .25]]),
        L('b1', 'bind', "It looks like you're merging two facilities. Would you like help?", 0.15, sfx=[['binderpop', -.15, .4, -.1]]),
        L('s2', 'straw', 'No.', 0.1),
        L('b2', 'bind', "Great! I'll help.", 0.2, sfx=[['grin', .55, .3, -.1]]),
        L('l2', 'lemon', 'Which one is the top left?', 0.1, sfx=[['dialog', -.6, .4, 0]]),
        L('b3', 'bind', 'Greenleaf!', 0.1),
        L('m2', 'mango', 'What happens to the other value?', 0.1),
        L('b4', 'bind', 'It is discarded!', 0.15),
        L('c1', 'clem', 'Sure!', 0.1, sfx=[['click', .35, .4, .2]]),
        P('end', 1.6, 0.05, [['merge', .05, .7, 0], ['whoosh', .5, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 3. the merge: a crane stacks Greenleaf on Fruit Bowl; the zipper merge; salad meets pizza
    {'id': 'dock', 'clock': '3:20 PM', 'label': 'THE MERGE', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'day', 'gain': 0.15}, 'beats': [
        P('open', 1.0, 0.1, [['cranemotor', 0, .35, 0]]),
        L('b1', 'bind', 'Merging cells!', 0.1),
        P('lower', 4.0, 0.05, [['cranemotor', 0, .4, 0], ['cablecreak', 1.2, .35, .1], ['dockimpact', 3.6, .9, 0]]),
        P('settle', 2.8, 0.05, [['groan', .1, .45, 0], ['cablewhip', .3, .35, -.2]]),
        L('a1', 'melon', 'Welcome to the family!', 0.15),
        L('br1', 'broc', 'We brought salad.', 0.1),
        L('a2', 'melon', 'We brought pizza.', 0.1),
        L('br2', 'broc', 'Pizza is not a vegetable.', 0.1),
        L('t1', 'tom', 'It is if you count the sauce.', 0.15),
        L('l0', 'lemon', 'Are you a fruit or a vegetable?', 0.1),
        L('t1b', 'tom', 'Pending.', 0.2),
        L('l1', 'lemon', 'One at a time. Zipper merge.', 0.15),
        L('m1', 'mango', 'After you.', 0.05),
        L('ca1', 'carrot', 'No, after you.', 0.05),
        L('m2', 'mango', 'After you.', 0.05),
        L('ca2', 'carrot', 'No, after you.', 0.05),
        P('bonk', 0.8, 0.05, [['bonk', .1, .55, .1], ['stars', .15, .3, .1]]),
        L('l2', 'lemon', "That's a merge.", 0.2),
        L('o1', 'onion', 'Compliance has arrived.', 0.15, sfx=[['sniffle', 1.4, .3, -.3]]),
        L('o2', 'onion', "I'm not crying. You are.", 0.15, sfx=[['sob', 1.5, .3, -.3]]),
        P('end', 0.6, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 4. the model, part one: Insert Row and Remove Duplicates
    {'id': 'model1', 'clock': '3:45 PM', 'label': 'THE MODEL', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.14}, 'beats': [
        P('open', 0.7, 0.1, [['keyboard', .1, .35, -.2]]),
        L('o1', 'onion', 'We will now optimize.', 0.1, sfx=[['sniffle', 1.2, .3, -.3]]),
        L('t1', 'tom', 'Row one. The Executive Suite.', 0.15),
        L('b1', 'bind', 'Inserting row!', 0.05),
        P('insert', 4.5, 0.05, [['insertrow', .1, .5, 0], ['cranemotor', .3, .35, 0], ['rumble', 1.2, .5, 0], ['sink', 1.8, .6, 0], ['thud', 3.6, .5, 0]]),
        L('m1', 'mango', 'Where did the lobby go?', 0.1),
        L('t2', 'tom', 'Below the sheet.', 0.15),
        L('s1', 'straw', 'How do residents come in?', 0.1),
        L('t3', 'tom', 'Through the window.', 0.25),
        L('o2', 'onion', 'Next. Remove duplicates.', 0.1, sfx=[['click', .5, .35, -.1]]),
        L('b2', 'bind', 'Twelve duplicate values found and removed!', 0.05),
        P('vanish', 2.6, 0.05, [['poof', .1, .45, -.4], ['poof', .5, .45, .3], ['poof', .9, .4, -.2], ['poof', 1.3, .4, .4], ['poof', 1.7, .4, 0], ['dialog', 2.2, .35, 0]]),
        L('b3', 'bind', 'Four plus four equals five. That is synergy!', 0.1),
        L('m2', 'mango', 'Four plus four is eight.', 0.1),
        L('t4a', 'tom', 'Not anymore.', 0.2),
        L('l1', 'lemon', 'There were two of us.', 0.1),
        L('t4', 'tom', 'Now there is one.', 0.1),
        L('l2', 'lemon', 'Which one?', 0.1),
        L('t5', 'tom', 'The one with seniority.', 0.2),
        P('end', 0.5, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 5. the model, part two: Fill Down (Strawberry x40) and a lookup that fails
    {'id': 'model2', 'clock': '4:20 PM', 'label': 'THE FILL', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.14}, 'beats': [
        P('open', 0.7, 0.1),
        L('t1', 'tom', 'We need coverage for forty residents.', 0.1),
        L('o1', 'onion', 'Per policy, one nurse.', 0.1, sfx=[['sniffle', 1.1, .3, -.3]]),
        L('t2', 'tom', 'Efficiency.', 0.15),
        L('b1', 'bind', "I'll help! Fill down!", 0.05),
        P('clones', 4.5, 0.05, [['click', .1, .35, 0], ['fillpop', .7, .4, -.5], ['fillpop', 1.0, .4, -.3], ['fillpop', 1.3, .4, -.1], ['fillpop', 1.55, .4, .1], ['fillpop', 1.8, .4, .3],
                                  ['fillpop', 2.0, .4, .5], ['fillpop', 2.2, .4, -.4], ['fillpop', 2.35, .4, -.2], ['fillpop', 2.5, .4, 0], ['fillpop', 2.65, .4, .2], ['fillpop', 2.8, .4, .4],
                                  ['fillpop', 2.95, .4, -.3], ['fillpop', 3.1, .4, .1], ['fillpop', 3.25, .4, .3], ['fillpop', 3.4, .4, -.1], ['crowd', 3.6, .4, 0]]),
        L('s1', 'straw', "I'm one person.", 0.1),
        L('ch1', 'chor', "I'm one person.", 0.15),
        L('t3', 'tom', 'Forty nurses!', 0.1),
        L('ch2', 'chor', "I'm tired.", 0.2),
        L('b2', 'bind', 'Looking up Strawberry.', 0.05),
        P('lookup', 1.3, 0.05, [['typing', .1, .35, 0], ['error', 1.0, .5, 0]]),
        L('b3', 'bind', 'Not found!', 0.1),
        L('s2', 'straw', 'I never am.', 0.2),
        L('o2', 'onion', 'Then who are they?', 0.1),
        L('b4', 'bind', 'Unassigned!', 0.15),
        P('end', 0.6, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 6. find and replace: BREAK becomes PENDING
    {'id': 'replace', 'clock': '5:05 PM', 'label': 'FIND AND REPLACE', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.14}, 'beats': [
        P('open', 0.6, 0.1),
        L('o1', 'onion', 'Policy conflict.', 0.1, sfx=[['sniffle', .8, .3, -.3]]),
        L('t1', 'tom', 'Fruit Bowl: a thirty-minute break.', 0.1),
        L('t2', 'tom', 'Greenleaf: breaks as needed.', 0.15),
        L('o2', 'onion', 'Compliance will decide.', 0.15, sfx=[['sob', 1.2, .3, -.3]]),
        L('b1', 'bind', "I'll help! Find: break. Replace with: pending.", 0.1, sfx=[['typing', .9, .35, 0], ['typing', 2.4, .35, 0]]),
        L('s1', 'straw', "Don't.", 0.1),
        L('b2', 'bind', 'Replace all!', 0.05, sfx=[['click', .5, .4, 0]]),
        P('replace', 4.5, 0.05, [['flip', .15, .4, -.3], ['flip', .55, .4, .2], ['flip', 1.0, .4, -.1], ['flip', 1.5, .4, .3], ['flip', 2.0, .4, 0], ['flip', 2.5, .4, -.2], ['counter', .2, .45, 0], ['dialog', 3.8, .4, 0]]),
        L('b3', 'bind', 'Two hundred fourteen replacements!', 0.2),
        L('m1', 'mango', 'My break?', 0.05),
        L('b4', 'bind', 'Pending!', 0.1),
        L('l1', 'lemon', 'Mine?', 0.05),
        L('b5', 'bind', 'Pending!', 0.1),
        L('s2', 'straw', 'How long is pending?', 0.05),
        L('b6', 'bind', 'Pending!', 0.25),
        P('end', 0.6, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 7. the closing: the new sign, undo, and one last offer of help
    {'id': 'close', 'clock': '6:00 PM', 'label': 'THE CLOSING', 'head': 0.2, 'tail': 0.5, 'room': 'hall', 'amb': {'name': 'day', 'gain': 0.12}, 'beats': [
        P('open', 1.6, 0.1, [['banner', .1, .45, 0]]),
        L('l1', 'lemon', 'Are we a salad now?', 0.1),
        L('t1', 'tom', "We're a salad.", 0.1),
        L('m1', 'mango', "Who's the dressing?", 0.1),
        L('o1', 'onion', 'Corporate.', 0.1, sfx=[['sob', .5, .3, -.3]]),
        L('b1', 'bind', 'Better together. Tossed!', 0.2),
        L('a1', 'melon', 'Pizza is still in the budget.', 0.15),
        L('o2', 'onion', 'Per policy, pizza is a vegetable.', 0.1),
        L('t2', 'tom', 'Counted.', 0.2),
        L('ar1', 'arti', 'We value our people. Somewhere in here.', 0.2, sfx=[['heartbeat', 1.6, .3, .25]]),
        P('undo', 2.0, 0.05, [['key', .2, .4, 0], ['key', .4, .4, 0], ['error', 1.2, .5, 0]]),
        L('b2', 'bind', "Can't undo!", 0.1),
        L('s1', 'straw', 'Of course.', 0.25),
        L('b3', 'bind', "It looks like you're trying to take a break. Would you like help?", 0.15),
        L('s2', 'straw', 'No.', 0.1),
        L('b4', 'bind', "Great! I'll help.", 0.2, sfx=[['grin', .55, .3, -.1]]),
        P('end', 2.2, 0.05, [['pending', .1, .5, 0], ['sting', .5, .4, 0]]),
    ]},

    # ------------------------------------------------------------------ 8. the end card: Save As, and the next sheet
    {'id': 'end', 'clock': '', 'label': 'THANKS FOR WATCHING', 'head': 0.1, 'tail': 0.3, 'room': 'hall', 'beats': [
        P('card', 7.5, 0.1, [['theme15', 0, .5, 0], ['typing', 1.0, .35, 0], ['click', 3.0, .4, 0], ['stamp', 3.9, .5, 0], ['textding', 5.4, .4, 0]]),
    ]},
]

OUT = {
    'title': 'SHIFT HAPPENS',
    'episode': 'Episode 15: The Merger',
    'v2': True,
    'level_lines': True,
    'voices': {k: VOICES[k] for k in ('straw', 'mango', 'lemon', 'melon', 'clem', 'arti', 'onion', 'tom', 'broc', 'carrot', 'bind', 'chor') if k in VOICES},
    'scenes': SCENES,
    'music': {'from_': 'announce', 'to_': 'close', 'mute': []},
    'no_whoosh': ['title', 'end'],
}

if __name__ == '__main__':
    dst = sys.argv[1] if len(sys.argv) > 1 else f'{PROJECT}/script_ep15.json'
    json.dump(OUT, open(dst, 'w'), indent=1, ensure_ascii=False)
    n_lines = sum(1 for sc in SCENES for b in sc['beats'] if 'who' in b)
    print('wrote', dst, '| scenes', len(SCENES), '| spoken lines', n_lines, '| voices', sorted(OUT['voices']))
