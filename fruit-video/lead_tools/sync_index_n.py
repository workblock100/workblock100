#!/usr/bin/env python3
"""sync_index_n.py N : rewrites the Episode N block of fruit-video/index.html (between <!-- EPN BEGIN --> and <!-- EPN END -->, placed after the Episode 15 block so the Episode 15 kits are loaded first)
so that every ep<N>_*.js file that EXISTS is loaded (DOM-free sims first, then other files, ep<N>.js last), and adds build/ep<N>/timeline.js to the timeline block when it exists. Idempotent. Use for N = 16, 17."""
import glob, os, re, sys
N = sys.argv[1]
ROOT = '/home/user/workblock100/fruit-video'
p = f'{ROOT}/index.html'
s = open(p).read()
sims = sorted(os.path.basename(f) for f in glob.glob(f'{ROOT}/ep{N}_*_sim.js'))
others = sorted(os.path.basename(f) for f in glob.glob(f'{ROOT}/ep{N}_*.js') if os.path.basename(f) not in sims)
kits = [f'ep{N}_{k}.js' for k in ('fx', 'props', 'art', 'food') if f'ep{N}_{k}.js' in others]      # kit files (effects, props, art) load before the scene files
others = [f for f in others if f not in kits]
order = sims + kits + others + [f'ep{N}.js']
block = f'<!-- EP{N} BEGIN -->\n' + ''.join(f'<script src="{f}"></script>\n' for f in order) + f'<!-- EP{N} END -->\n'
if f'<!-- EP{N} BEGIN -->' in s:
    s = re.sub(rf'<!-- EP{N} BEGIN -->\n.*?<!-- EP{N} END -->\n', lambda m: block, s, flags=re.S)
else:
    s = s.replace('<script src="ep99.js"></script>', block + '<script src="ep99.js"></script>', 1)
tl = f'<script src="build/ep{N}/timeline.js"></script>\n'
if os.path.exists(f'{ROOT}/build/ep{N}/timeline.js') and tl not in s:
    s = s.replace('<script src="build/ep99/timeline.js"></script>\n', tl + '<script src="build/ep99/timeline.js"></script>\n', 1)
tmp = p + '.tmp'; open(tmp, 'w').write(s); os.replace(tmp, p)
print(f'index.html: ep{N} files loaded:', ', '.join(order))
