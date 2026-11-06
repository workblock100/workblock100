#!/usr/bin/env python3
"""abs_sheet.py <out.png> <cols> <abs_secs...> : renders previews (MB=1, as the video captures) at the given absolute times and builds one labelled contact sheet (360x640 cells)."""
import os, subprocess, sys
from PIL import Image, ImageDraw
ROOT = '/home/user/workblock100/fruit-video'
EP = os.environ.get('EP', '14')
out, cols, ts = sys.argv[1], int(sys.argv[2]), [float(x) for x in sys.argv[3:]]
subprocess.run(['node', 'render.js', 'preview'] + [f'{t:.2f}' for t in ts], cwd=ROOT, env=dict(os.environ, EP=EP, MB='1'), check=True, stdout=subprocess.DEVNULL)
rows = (len(ts) + cols - 1) // cols
sheet = Image.new('RGB', (360 * cols, 640 * rows), (16, 16, 16))
for i, t in enumerate(ts):
    im = Image.open(f'{ROOT}/build/ep{EP}/preview/t_{t:.2f}.png').convert('RGB').resize((360, 640))
    d = ImageDraw.Draw(im); d.rectangle([0, 610, 110, 640], fill=(0, 0, 0)); d.text((6, 618), f'{t:.2f}', fill=(255, 255, 0))
    sheet.paste(im, (360 * (i % cols), 640 * (i // cols)))
sheet.save(out); print(out, sheet.size)
