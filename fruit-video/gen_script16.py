"""Episode 16: The Vote. Writes script_ep16.json in the project folder.

6:30 PM, the night after the merger paperwork: the new management holds a mandatory Employee of the Month election. Compliance (Onion) prints the ballots; HR (Tomato) explains that there is one
choice per person; the only candidate is Binder. The ballots go into a clear box (rigid-body ballots; PHYS2D). Forty unassigned Strawberries from the Fill Down of Episode 15 are eligible voters
("Per policy"), so the box floods. The count: Binder 48, Pending 1 (Strawberry's own ballot, the only real one). One real ballot makes the election void, and a void election goes to the
incumbent. The incumbent is Binder. The plaque is engraved; the prize is a day off (Pending).

Cast: Melon, Lemon, Mango, Strawberry, Onion, Tomato, Carrot (engraver), Binder. Mr. Artichoke does not appear (kept cheap): the plaque is signed by "Corporate".
Same format as gen_script15.py. Usage: python3 gen_script16.py [dst]
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gen_script15 import VOICES, L, P  # noqa: E402  (the cast and the beat helpers are shared with Episode 15)

SCENES = [
    # ------------------------------------------------------------------ 1. the title: a poll widget; the radio button chooses itself
    {'id': 'title', 'clock': '', 'label': '', 'head': 0.2, 'tail': 0.1, 'room': 'hall', 'beats': [
        P('logo', 5.8, 0.1, [['theme15', 0, .8, 0], ['click', 1.0, .4, -.15], ['click', 2.2, .4, .2], ['stamp', 2.6, .5, 0], ['textding', 3.8, .45, 0]]),
    ]},

    # ------------------------------------------------------------------ 2. the ballot: one candidate, one choice, forty extra voters
    {'id': 'ballot', 'clock': '6:30 PM', 'label': 'THE BALLOT', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.14}, 'beats': [
        P('open', 0.8, 0.1, [['click', .3, .3, 0]]),
        L('a1', 'melon', 'Tonight we vote. Employee of the month.', 0.2),
        L('l1', 'lemon', 'We have never had one.', 0.1),
        L('a2', 'melon', 'We have never had a vote.', 0.2),
        L('o1', 'onion', 'Compliance has prepared the ballots.', 0.1, sfx=[['sniffle', 1.7, .3, -.3]]),
        L('t1', 'tom', 'One choice per person.', 0.15),
        L('m1', 'mango', 'Who are the candidates?', 0.1),
        L('o2', 'onion', 'Binder.', 0.15),
        L('m2', 'mango', 'Who else?', 0.1),
        L('o3', 'onion', 'Binder is the candidate.', 0.2),
        L('s1', 'straw', "That's one choice.", 0.1),
        L('t2', 'tom', 'Efficiency.', 0.15),
        L('b1', 'bind', "It looks like you're voting. Would you like help?", 0.1, sfx=[['binderpop', -.15, .4, -.1]]),
        L('s2', 'straw', 'No.', 0.1),
        L('b2', 'bind', "Great! I'll help.", 0.2, sfx=[['grin', .55, .3, -.1]]),
        P('cast', 3.6, 0.05, [['click', .3, .35, -.3], ['click', .7, .35, .3], ['click', 1.1, .35, 0], ['fillpop', 1.7, .4, -.4], ['fillpop', 1.9, .4, .4], ['fillpop', 2.1, .4, 0],
                              ['fillpop', 2.25, .4, -.2], ['fillpop', 2.4, .4, .2], ['crowd', 2.6, .4, 0]]),
        P('end', 0.5, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 3. the count: the election is void, and a void election goes to the incumbent
    {'id': 'count', 'clock': '7:30 PM', 'label': 'THE COUNT', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.14}, 'beats': [
        P('open', 0.7, 0.1, [['typing', .1, .3, 0]]),
        L('o1', 'onion', 'Counting.', 0.15),
        L('t1', 'tom', 'Binder, forty-eight.', 0.1),
        L('l1', 'lemon', 'Forty-eight? There are nine of us.', 0.1),
        L('o2', 'onion', 'The other forty are unassigned.', 0.1),
        L('s1', 'straw', 'Those are me.', 0.15),
        L('o3', 'onion', 'Unassigned are eligible. Per policy.', 0.2, sfx=[['sob', 1.6, .3, -.3]]),
        L('t2', 'tom', 'Pending, one.', 0.1),
        L('s2', 'straw', 'That one is mine.', 0.15),
        L('o4', 'onion', 'One real ballot. The election is void.', 0.15, sfx=[['dialog', -.2, .35, 0]]),
        L('t3', 'tom', 'A void election goes to the incumbent.', 0.1),
        L('m1', 'mango', 'Who is the incumbent?', 0.1),
        L('o5', 'onion', 'Binder.', 0.2),
        L('s3', 'straw', 'He was the only candidate.', 0.1),
        L('b1', 'bind', 'Thank you for your support!', 0.2, sfx=[['grin', 1.2, .3, -.1]]),
        P('end', 0.5, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 4. the plaque: the prize is a day off (pending)
    {'id': 'prize', 'clock': '8:10 PM', 'label': 'THE PLAQUE', 'head': 0.2, 'tail': 0.5, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.12}, 'beats': [
        P('open', 0.6, 0.1, [['click', .2, .3, 0]]),
        L('a1', 'melon', 'The plaque. Employee of the month.', 0.1),
        L('ca1', 'carrot', 'Name?', 0.1),
        L('b1', 'bind', 'Binder.', 0.1),
        L('ca2', 'carrot', 'Prize?', 0.1),
        L('b2', 'bind', 'A day off!', 0.1),
        L('l1', 'lemon', 'You do not sleep.', 0.1),
        L('b3', 'bind', 'I love my job!', 0.15),
        L('s1', 'straw', 'When is the day off?', 0.1),
        L('b4', 'bind', 'Pending!', 0.25),
        P('end', 2.0, 0.05, [['stamp', .3, .5, 0], ['pending', .6, .45, 0], ['sting', 1.0, .4, 0]]),
    ]},

    # ------------------------------------------------------------------ 5. the end card: the staff sheet, a new tab
    {'id': 'end', 'clock': '', 'label': 'THANKS FOR WATCHING', 'head': 0.1, 'tail': 0.3, 'room': 'hall', 'beats': [
        P('card', 6.5, 0.1, [['theme15', 0, .5, 0], ['typing', 1.0, .35, 0], ['click', 3.0, .4, 0], ['stamp', 3.9, .5, 0], ['textding', 5.0, .4, 0]]),
    ]},
]

OUT = {
    'title': 'SHIFT HAPPENS',
    'episode': 'Episode 16: The Vote',
    'v2': True,
    'level_lines': True,
    'voices': {k: VOICES[k] for k in ('straw', 'mango', 'lemon', 'melon', 'onion', 'tom', 'carrot', 'bind') if k in VOICES},
    'scenes': SCENES,
    'music': {'from_': 'ballot', 'to_': 'prize', 'mute': []},
    'no_whoosh': ['title', 'end'],
}

if __name__ == '__main__':
    dst = sys.argv[1] if len(sys.argv) > 1 else f'{HERE}/script_ep16.json'
    json.dump(OUT, open(dst, 'w'), indent=1, ensure_ascii=False)
    n_lines = sum(1 for sc in SCENES for b in sc['beats'] if 'who' in b)
    print('wrote', dst, '| scenes', len(SCENES), '| spoken lines', n_lines, '| voices', sorted(OUT['voices']))
