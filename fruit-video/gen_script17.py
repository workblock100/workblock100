"""Episode 17: The Module. Writes script_ep17.json in the project folder.

9:15 PM: HR (Tomato) assigns mandatory training, Module 7, "How to Take a Break Safely": four hours of unskippable video, due before clock-out. Binder proctors it (looking away pauses the video; a call
light is on; the progress bar has said 99 percent for an hour). The narrator on the video is Mr. Artichoke on a laggy call, and he explains that the break begins when the shift ends. The quiz has one
answer, Pending, and it is correct. The certificate expires at eleven. Clocking out requires a taken break; the break is pending until you clock out. The clock stays on 10:59.

Cast: Strawberry, Lemon, Mango, Onion, Tomato, Binder, Mr. Artichoke (the video). Same format as gen_script15.py. Usage: python3 gen_script17.py [dst]
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gen_script15 import VOICES, L, P  # noqa: E402

SCENES = [
    # ------------------------------------------------------------------ 1. the title: a learning-management page, Module 7 of 7
    {'id': 'title', 'clock': '', 'label': '', 'head': 0.2, 'tail': 0.1, 'room': 'hall', 'beats': [
        P('logo', 5.8, 0.1, [['theme15', 0, .8, 0], ['click', 1.0, .4, -.15], ['spinner', 1.6, .3, .2], ['click', 2.6, .4, .2], ['textding', 3.8, .45, 0]]),
    ]},

    # ------------------------------------------------------------------ 2. the assignment: four hours of video, due before clock-out
    {'id': 'assign', 'clock': '9:15 PM', 'label': 'THE ASSIGNMENT', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.14}, 'beats': [
        P('open', 0.8, 0.1, [['click', .3, .3, 0]]),
        L('t1', 'tom', 'Mandatory training. Module seven.', 0.15),
        L('m1', 'mango', 'How long?', 0.1),
        L('t2', 'tom', 'Four hours.', 0.15),
        L('l1', 'lemon', 'We have eight hours of residents.', 0.1),
        L('t3', 'tom', 'Efficiency.', 0.15),
        L('b1', 'bind', "It looks like you're learning. Would you like help?", 0.1, sfx=[['binderpop', -.15, .4, -.1]]),
        L('s1', 'straw', 'No.', 0.1),
        L('b2', 'bind', "Great! I'll help.", 0.15, sfx=[['grin', .55, .3, -.1]]),
        L('t4', 'tom', 'Due before you clock out.', 0.15),
        P('end', 0.5, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 3. the video: eyes on the screen, a call light, 99 percent
    {'id': 'video', 'clock': '9:50 PM', 'label': 'THE VIDEO', 'head': 0.2, 'tail': 0.4, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.14}, 'beats': [
        P('open', 0.7, 0.1, [['callconnect', .1, .35, .3]]),
        L('ar1', 'arti', 'Welcome to Break Safety. Your break is important to us.', 0.2),
        L('b1', 'bind', 'Please keep your eyes on the screen.', 0.1),
        L('s1', 'straw', 'A call light is on.', 0.15, sfx=[['textding', .1, .3, .3]]),
        L('b2', 'bind', 'Looking away pauses the video!', 0.1),
        L('ar2', 'arti', 'At the end of your shift, you may take a break.', 0.15, sfx=[['glitch', 1.9, .4, .25]]),
        L('l1', 'lemon', 'The shift ends at eleven.', 0.1),
        L('ar3', 'arti', 'Your break begins at eleven.', 0.15),
        L('s2', 'straw', 'That is not a break.', 0.1),
        L('ar4', 'arti', 'Thank you for your feedback.', 0.15),
        L('b3', 'bind', 'Ninety-nine percent complete!', 0.1),
        L('s3', 'straw', 'It has said that for an hour.', 0.15),
        P('end', 0.5, 0.05, [['sting', .1, .35, 0]]),
    ]},

    # ------------------------------------------------------------------ 4. the quiz: one answer, and it is correct; the clock stays on 10:59
    {'id': 'quiz', 'clock': '10:59 PM', 'label': 'THE QUIZ', 'head': 0.2, 'tail': 0.5, 'room': 'hall', 'amb': {'name': 'hum', 'gain': 0.12}, 'beats': [
        P('open', 0.6, 0.1, [['click', .2, .3, 0]]),
        L('b1', 'bind', 'Question one. When should you take a break?', 0.15),
        L('m1', 'mango', 'A, B, C or D?', 0.1),
        L('b2', 'bind', 'A, pending. B, pending. C, pending. D, all of the above.', 0.2),
        L('s1', 'straw', 'D.', 0.1, sfx=[['click', .15, .35, 0]]),
        L('b3', 'bind', 'Correct! You scored one hundred percent!', 0.1, sfx=[['textding', .1, .4, 0]]),
        L('o1', 'onion', 'The certificate expires at eleven.', 0.15, sfx=[['sniffle', 1.7, .3, -.3]]),
        L('l1', 'lemon', 'So does the shift.', 0.1),
        L('t1', 'tom', 'You must pass to clock out.', 0.1),
        L('s2', 'straw', 'I passed.', 0.1),
        L('o2', 'onion', 'Clock out requires a taken break.', 0.1),
        L('s3', 'straw', 'My break is pending.', 0.1),
        L('t2', 'tom', 'Until you clock out.', 0.25),
        P('end', 2.0, 0.05, [['error', .2, .45, 0], ['pending', .5, .45, 0], ['sting', 1.0, .4, 0]]),
    ]},

    # ------------------------------------------------------------------ 5. the end card
    {'id': 'end', 'clock': '', 'label': 'THANKS FOR WATCHING', 'head': 0.1, 'tail': 0.3, 'room': 'hall', 'beats': [
        P('card', 6.5, 0.1, [['theme15', 0, .5, 0], ['typing', 1.0, .35, 0], ['click', 3.0, .4, 0], ['stamp', 3.9, .5, 0], ['textding', 5.0, .4, 0]]),
    ]},
]

OUT = {
    'title': 'SHIFT HAPPENS',
    'episode': 'Episode 17: The Module',
    'v2': True,
    'level_lines': True,
    'voices': {k: VOICES[k] for k in ('straw', 'mango', 'lemon', 'onion', 'tom', 'arti', 'bind') if k in VOICES},
    'scenes': SCENES,
    'music': {'from_': 'assign', 'to_': 'quiz', 'mute': []},
    'no_whoosh': ['title', 'end'],
}

if __name__ == '__main__':
    dst = sys.argv[1] if len(sys.argv) > 1 else f'{HERE}/script_ep17.json'
    json.dump(OUT, open(dst, 'w'), indent=1, ensure_ascii=False)
    n_lines = sum(1 for sc in SCENES for b in sc['beats'] if 'who' in b)
    print('wrote', dst, '| scenes', len(SCENES), '| spoken lines', n_lines, '| voices', sorted(OUT['voices']))
