#!/usr/bin/env python3
"""usage: atlas.py <EP> [scene] [step=0.25] [from_abs] [to_abs]
The text atlas: every distinct string drawn in the episode (or one scene), cropped from a full-resolution frame at the moment it is most visible, tiled into sheets so that every
letter can be inspected by eye (orientation, centring, spacing, baselines, overlaps, clipping). Each tile is captioned with the scene-local time, the on-screen size in px, the angle
and the string. Sheets: /tmp/shift_sheets/atlas_ep<EP>_<scene|all>_<n>.png (open them with the Read tool). Also prints a one-line summary per sheet.
Strings are found by the text gate's inventory (render.js textinv), so raw ctx.fillText calls are included."""
import json, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = '/home/user/workblock100/fruit-video'
EP = sys.argv[1]
scene = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] not in ('all', '-') else None
step = sys.argv[3] if len(sys.argv) > 3 else '0.25'
tl = json.load(open(f'{ROOT}/build/ep{EP}/timeline.json'))
scenes = {s['id']: s for s in tl['scenes']}
if scene:
    s = scenes[scene]
    a, b = s['start'] + .02, s['start'] + s['dur'] - .02
else:
    a, b = 0, tl['duration']
if len(sys.argv) > 4: a = float(sys.argv[4])
if len(sys.argv) > 5: b = float(sys.argv[5])
invp = f'/tmp/shift_sheets/textinv_ep{EP}_{os.getpid()}.json'
os.makedirs('/tmp/shift_sheets', exist_ok=True)
env = dict(os.environ, EP=str(EP), TEXTINV_OUT=invp)
subprocess.run(['node', 'render.js', 'textinv', step, f'{a:.3f}', f'{b:.3f}'], cwd=ROOT, env=env, check=True, stdout=subprocess.DEVNULL)
inv = json.load(open(invp))
os.remove(invp)
# one frame per distinct time: previews are the expensive part
times = sorted({round(e['best'], 2) for e in inv})
CH = 40
for i in range(0, len(times), 60):
    subprocess.run(['node', 'render.js', 'preview'] + [f'{t:.2f}' for t in times[i:i + 60]], cwd=ROOT, env=dict(env, MB='0'), check=True, stdout=subprocess.DEVNULL)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
except Exception:
    font = ImageFont.load_default()
TW = 520
tiles = []
for e in inv:
    t = round(e['best'], 2)
    path = f'{ROOT}/build/ep{EP}/preview/t_{t:.2f}.png'
    if not os.path.exists(path):
        continue
    im = Image.open(path).convert('RGB')
    x0, y0, x1, y1 = [int(v) for v in e['box']]
    X0, Y0, X1, Y1 = max(0, x0 - CH), max(0, y0 - CH), min(1080, x1 + CH), min(1920, y1 + CH)
    if X1 - X0 < 8 or Y1 - Y0 < 8:
        continue
    crop = im.crop((X0, Y0, X1, Y1))
    sc = min(TW / crop.width, 260 / crop.height, 3.0)
    crop = crop.resize((max(1, int(crop.width * sc)), max(1, int(crop.height * sc))), Image.LANCZOS)
    tile = Image.new('RGB', (TW, crop.height + 46), (24, 24, 30))
    tile.paste(crop, ((TW - crop.width) // 2, 0))
    d = ImageDraw.Draw(tile)
    sid = e['scene']
    lt = t - scenes[sid]['start']
    cut = e['bestVis'] < .999
    d.text((6, crop.height + 4), f"{sid} {lt:5.2f}s  {e['px']:.0f}px  {e['ang']:+.0f}deg  {'HERO ' if e.get('hero') else ''}{'CUT ' if cut else ''}", fill=(255, 220, 90) if not cut else (255, 110, 110), font=font)
    d.text((6, crop.height + 24), e['s'][:62], fill=(235, 235, 240), font=font)
    tiles.append((sid, lt, tile))
os.makedirs('/tmp/shift_sheets', exist_ok=True)
name = scene or 'all'
paths = []
per = 9   # 3 columns x 3 rows
for n in range(0, len(tiles), per):
    chunk = [t for _, _, t in tiles[n:n + per]]
    rows = [chunk[i:i + 3] for i in range(0, len(chunk), 3)]
    heights = [max(t.height for t in r) for r in rows]
    sh = Image.new('RGB', (TW * 3 + 8, sum(heights) + 8 * len(rows)), (12, 12, 16))
    y = 0
    for r, hgt in zip(rows, heights):
        for j, t in enumerate(r):
            sh.paste(t, (j * (TW + 4), y))
        y += hgt + 8
    p = f'/tmp/shift_sheets/atlas_ep{EP}_{name}_{n // per}.png'
    sh.save(p)
    paths.append(p)
print(f'{len(inv)} distinct text runs, {len(tiles)} tiles, {len(paths)} sheets')
print('\n'.join(paths))
