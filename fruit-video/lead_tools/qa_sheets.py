#!/usr/bin/env python3
"""qa_sheets.py <scene> [step=1.0] [per_sheet=12] : renders previews of a scene every `step` s (MB=1, as the video captures) and builds labelled contact sheets in /tmp/shift_tools/qa14/<scene>_<n>.png (4 columns, 360x640 tiles)."""
import json, os, subprocess, sys
from PIL import Image, ImageDraw
ROOT = '/home/user/workblock100/fruit-video'
EP = os.environ.get('EP', '14')
scene = sys.argv[1]; step = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0; per = int(sys.argv[3]) if len(sys.argv) > 3 else 12
tl = json.load(open(f'{ROOT}/build/ep{EP}/timeline.json'))
sc = next(s for s in tl['scenes'] if s['id'] == scene)
lts = []; t = 0.15
while t < sc['dur'] - 0.05: lts.append(round(t, 2)); t += step
abs_ = [round(sc['start'] + x, 2) for x in lts]
subprocess.run(['node', 'render.js', 'preview'] + [f'{a:.2f}' for a in abs_], cwd=ROOT, env=dict(os.environ, EP=EP, MB='1'), check=True, stdout=subprocess.DEVNULL)
os.makedirs(f'/tmp/shift_tools/qa{EP}', exist_ok=True)
for n in range(0, len(abs_), per):
    chunk = list(zip(lts, abs_))[n:n + per]
    cols = 4; rows = (len(chunk) + cols - 1) // cols
    sheet = Image.new('RGB', (360 * cols, 640 * rows), (16, 16, 16))
    for i, (lt, a) in enumerate(chunk):
        im = Image.open(f'{ROOT}/build/ep{EP}/preview/t_{a:.2f}.png').convert('RGB').resize((360, 640))
        d = ImageDraw.Draw(im); d.rectangle([0, 600, 120, 640], fill=(0, 0, 0)); d.text((6, 608), f'{scene} {lt:.2f}s', fill=(255, 255, 0))
        sheet.paste(im, (360 * (i % cols), 640 * (i // cols)))
    p = f'/tmp/shift_tools/qa{EP}/{scene}_{n // per}.png'; sheet.save(p); print(p, sheet.size)
