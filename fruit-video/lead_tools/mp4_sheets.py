#!/usr/bin/env python3
"""usage: mp4_sheets.py <EP> <mp4> <outdir> [step=2.0] [cell_w=300]  -> contact sheets of frames cut from the finished MP4 itself, every <step> s of each scene,
12 cells per sheet (4 x 3), each labelled with the scene and its scene-local time. Named M_<scene>_<n>.png."""
import json, os, subprocess, sys
from PIL import Image, ImageDraw
import imageio_ffmpeg
EP, mp4, out = sys.argv[1], sys.argv[2], sys.argv[3]
step = float(sys.argv[4]) if len(sys.argv) > 4 else 2.0
W = int(sys.argv[5]) if len(sys.argv) > 5 else 300
Hh = W * 16 // 9
FF = '/usr/bin/ffmpeg' if os.path.exists('/usr/bin/ffmpeg') else imageio_ffmpeg.get_ffmpeg_exe()
tl = json.load(open(f'/home/user/workblock100/fruit-video/build/ep{EP}/timeline.json'))
os.makedirs(out, exist_ok=True)
tmp = os.path.join(out, '.f'); os.makedirs(tmp, exist_ok=True)
for sc in tl['scenes']:
    lts = [round(.1 + i * step, 2) for i in range(int((sc['dur'] - .1) / step) + 1)]
    lts = [l for l in lts if l < sc['dur'] - .02]
    cells = []
    for k, l in enumerate(lts):
        t = sc['start'] + l
        p = os.path.join(tmp, f'{sc["id"]}_{k}.png')
        subprocess.run([FF, '-y', '-v', 'error', '-ss', f'{t:.3f}', '-i', mp4, '-frames:v', '1', p], check=True)
        im = Image.open(p).convert('RGB').resize((W, Hh), Image.LANCZOS)
        ImageDraw.Draw(im).text((8, Hh - 14), f'{sc["id"]} {l:.1f}s', fill=(255, 255, 0))
        cells.append(im)
    for n in range(0, len(cells), 12):
        chunk = cells[n:n + 12]
        r = (len(chunk) + 3) // 4
        sh = Image.new('RGB', (W * 4, Hh * r), (20, 20, 24))
        for j, im in enumerate(chunk):
            sh.paste(im, ((j % 4) * W, (j // 4) * Hh))
        sh.save(os.path.join(out, f'M_{sc["id"]}_{n // 12:02d}.png'))
print('sheets in', out, sorted(f for f in os.listdir(out) if f.startswith('M_')))
