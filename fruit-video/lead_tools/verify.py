#!/usr/bin/env python3
"""usage: verify.py <EP> <mp4> [step_s=2.0]  -> decode check, stream check, loudness, and frame match: frames cut from the MP4 against the renderer's own frames at the same times.
Prints the median and worst PSNR and the frames under 30 dB. The renderer frames come from `render.js preview` with MB=1 (the same shutter-sampled path as the video capture)."""
import json, os, subprocess, sys
import numpy as np
from PIL import Image
import imageio_ffmpeg
FF = '/usr/bin/ffmpeg' if os.path.exists('/usr/bin/ffmpeg') else imageio_ffmpeg.get_ffmpeg_exe()
EP, mp4 = sys.argv[1], sys.argv[2]
step = float(sys.argv[3]) if len(sys.argv) > 3 else 2.0
ROOT = '/home/user/workblock100/fruit-video'
tl = json.load(open(f'{ROOT}/build/ep{EP}/timeline.json'))
dur = tl['duration']
times = [round(t, 2) for t in np.arange(0.5, dur - 0.5, step)]
work = f'/tmp/shift_verify/ep{EP}'
os.makedirs(work, exist_ok=True)
for f in os.listdir(work):
    os.remove(os.path.join(work, f))
print('== decode'); r = subprocess.run([FF, '-v', 'error', '-i', mp4, '-f', 'null', '-'], capture_output=True, text=True)
print('DECODE_OK' if r.returncode == 0 and not r.stderr.strip() else 'DECODE_ERRORS: ' + r.stderr[:300])
print('== streams')
r = subprocess.run([FF, '-hide_banner', '-i', mp4], capture_output=True, text=True)
print('\n'.join(l.strip()[:160] for l in r.stderr.splitlines() if 'Duration' in l or 'Stream' in l))
print('== loudness')
r = subprocess.run([FF, '-hide_banner', '-nostats', '-i', mp4, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True)
print('\n'.join(l.strip() for l in r.stderr.splitlines() if l.strip().startswith(('I:', 'LRA:', 'Peak:'))))
print('== frames vs renderer:', len(times), 'times')
subprocess.run(['node', 'render.js', 'preview'] + [f'{t:.2f}' for t in times], cwd=ROOT, env=dict(os.environ, EP=EP, MB='1'), check=True, stdout=subprocess.DEVNULL)
def psnr(a, b):
    m = np.mean((a - b) ** 2)
    return 99.0 if m == 0 else 10 * np.log10(255 ** 2 / m)
rows = []
for t in times:
    mp4_png = f'{work}/m_{t:.2f}.png'
    subprocess.run([FF, '-y', '-v', 'error', '-ss', f'{max(0, t - 0.02):.3f}', '-i', mp4, '-frames:v', '1', mp4_png], check=True)
    m = np.asarray(Image.open(mp4_png).convert('RGB').resize((540, 960))).astype(float)
    ref = np.asarray(Image.open(f'{ROOT}/build/ep{EP}/preview/t_{t:.2f}.png').convert('RGB').resize((540, 960))).astype(float)
    rows.append((psnr(m, ref), t))
rows.sort()
vals = [p for p, _ in rows]
print(f'median {np.median(vals):.1f} dB, worst {vals[0]:.1f} dB at {rows[0][1]:.2f} s')
print('under 30 dB:', [f'{t:.2f}' for p, t in rows if p < 30] or 'none')
