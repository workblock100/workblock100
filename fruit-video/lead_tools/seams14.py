#!/usr/bin/env python3
"""seams14.py : renders the last frame of each scene and the first frame of the next (MB=1) and builds /tmp/shift_tools/qa{EP}/seams.png (rows of: last | first)."""
import json, math, os, subprocess
from PIL import Image, ImageDraw
ROOT = '/home/user/workblock100/fruit-video'
EP = os.environ.get('EP', '14')
tl = json.load(open(f'{ROOT}/build/ep{EP}/timeline.json'))
sc = tl['scenes']
pairs = []
for i in range(1, len(sc)):
    s = sc[i]['start']; f1 = math.ceil(s * 30 - 1e-6); f0 = f1 - 1
    t0 = round(f0 / 30, 2); t1 = round(f1 / 30, 2)
    if t0 >= s: t0 = round(t0 - .01, 2)
    if t1 < s: t1 = round(t1 + .01, 2)
    pairs.append((sc[i - 1]['id'], sc[i]['id'], t0, t1))
abs_ = sorted({t for p in pairs for t in p[2:]})
subprocess.run(['node', 'render.js', 'preview'] + [f'{a:.2f}' for a in abs_], cwd=ROOT, env=dict(os.environ, EP=EP, MB='1'), check=True, stdout=subprocess.DEVNULL)
cols = 4; rows = (len(pairs) * 2 + cols - 1) // cols
sheet = Image.new('RGB', (360 * cols, 640 * rows), (16, 16, 16))
k = 0
for a, b, t0, t1 in pairs:
    for lab, t in ((f'{a} end {t0:.2f}', t0), (f'{b} start {t1:.2f}', t1)):
        im = Image.open(f'{ROOT}/build/ep{EP}/preview/t_{t:.2f}.png').convert('RGB').resize((360, 640))
        d = ImageDraw.Draw(im); d.rectangle([0, 610, 190, 640], fill=(0, 0, 0)); d.text((6, 618), lab, fill=(255, 255, 0))
        sheet.paste(im, (360 * (k % cols), 640 * (k // cols))); k += 1
os.makedirs(f'/tmp/shift_tools/qa{EP}', exist_ok=True)
sheet.save(f'/tmp/shift_tools/qa{EP}/seams.png'); print(f'/tmp/shift_tools/qa{EP}/seams.png', sheet.size, pairs)
