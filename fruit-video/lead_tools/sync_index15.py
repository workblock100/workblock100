#!/usr/bin/env python3
"""sync_index15.py : rewrites the Episode 15 block of /home/user/workblock100/fruit-video/index.html (between <!-- EP15 BEGIN --> and <!-- EP15 END -->) so that every ep15 file that EXISTS is loaded, in dependency order,
and adds build/ep15/timeline.js to the timeline block when it exists. Idempotent; safe to run at any time (builders run it after creating a new ep15 file)."""
import glob, os, re
ROOT = '/home/user/workblock100/fruit-video'
p = f'{ROOT}/index.html'
s = open(p).read()
first = ['phys2d.js']
sims = sorted(os.path.basename(f) for f in glob.glob(f'{ROOT}/ep15_*_sim.js'))
kits = ['ep15_sheet.js', 'ep15_art.js', 'ep15_house.js']
scenes = ['ep15_title.js', 'ep15_announce.js', 'ep15_dock.js', 'ep15_model1.js', 'ep15_model2.js', 'ep15_replace.js', 'ep15_close.js']
named = set(first + sims + kits + scenes + ['ep15.js'])
others = sorted(os.path.basename(f) for f in glob.glob(f'{ROOT}/ep15_*.js') if os.path.basename(f) not in named)
order = [f for f in first + sims + kits + others + scenes if os.path.exists(f'{ROOT}/{f}')] + ['ep15.js']
block = '<!-- EP15 BEGIN -->\n' + ''.join(f'<script src="{f}"></script>\n' for f in order) + '<!-- EP15 END -->\n'
if '<!-- EP15 BEGIN -->' in s:
    s = re.sub(r'<!-- EP15 BEGIN -->\n.*?<!-- EP15 END -->\n', lambda m: block, s, flags=re.S)
else:
    s = s.replace('<script src="ep99.js"></script>', block + '<script src="ep99.js"></script>', 1)
tl = '<script src="build/ep15/timeline.js"></script>\n'
if os.path.exists(f'{ROOT}/build/ep15/timeline.js') and tl not in s:
    s = s.replace('<script src="build/ep99/timeline.js"></script>\n', tl + '<script src="build/ep99/timeline.js"></script>\n', 1)
tmp = p + '.tmp'; open(tmp, 'w').write(s); os.replace(tmp, p)
print('index.html: ep15 files loaded:', ', '.join(order))
