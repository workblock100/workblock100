#!/usr/bin/env python3
"""usage: sheet.py <EP> <scene> [step=1.0] [cell_w=300] [cols=4]
Renders one scene exactly as the video capture does (shutter-sampled, MB=1) every <step> seconds into contact sheets of 12 cells (4 x 3) at /tmp/shift_sheets/ep<EP>_<scene>_<n>.png,
each cell labelled with its scene-local time. Prints the sheet paths; look at them with the Read tool."""
import json, os, subprocess, sys
from PIL import Image, ImageDraw
EP, scene = sys.argv[1], sys.argv[2]
step = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
W = int(sys.argv[4]) if len(sys.argv) > 4 else 300
cols = int(sys.argv[5]) if len(sys.argv) > 5 else 4
ROOT = '/home/user/workblock100/fruit-video'
tl = json.load(open(f'{ROOT}/build/ep{EP}/timeline.json'))
sc = next(s for s in tl['scenes'] if s['id'] == scene)
lts = [round(.1 + i * step, 3) for i in range(int((sc['dur'] - .1) / step) + 1) if .1 + i * step < sc['dur'] - .02]
abs_t = [f"{sc['start'] + l:.2f}" for l in lts]
env = dict(os.environ, EP=str(EP), MB='1')
subprocess.run(['node', 'render.js', 'preview'] + abs_t, cwd=ROOT, env=env, check=True, stdout=subprocess.DEVNULL)
Hh = W * 16 // 9
os.makedirs('/tmp/shift_sheets', exist_ok=True)
cells = []
for l, a in zip(lts, abs_t):
    im = Image.open(f'{ROOT}/build/ep{EP}/preview/t_{a}.png').convert('RGB').resize((W, Hh), Image.LANCZOS)
    ImageDraw.Draw(im).text((8, Hh - 14), f'{scene} {l:.1f}s', fill=(255, 255, 0))
    cells.append(im)
out = f'/tmp/shift_sheets/ep{EP}_{scene}'
paths = []
per = cols * 3
for n in range(0, len(cells), per):
    chunk = cells[n:n + per]
    r = (len(chunk) + cols - 1) // cols
    sh = Image.new('RGB', (W * cols, Hh * r), (20, 20, 24))
    for j, im in enumerate(chunk):
        sh.paste(im, ((j % cols) * W, (j // cols) * Hh))
    p = f'{out}_{n // per}.png'
    sh.save(p)
    paths.append(p)
print('\n'.join(paths))
