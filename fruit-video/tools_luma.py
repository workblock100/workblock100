#!/usr/bin/env python3
"""usage: tools_luma.py <EP> <scene> [step=0.5] [--mp4 FILE]
The legibility gate (new in Episode 20). Renders preview frames exactly as sheet.py does (shutter-sampled, MB=1) every <step> scene-local seconds and prints, per frame, the mean luminance of the picture
(0..1, Rec.709 weights on the sRGB values) and the share of near-black pixels (under 0.08). A frame is FLAGGED when its mean is under 0.20 or more than 45 percent of its pixels are near-black. The deliberate
dark beats of the episode are listed in DARK_OK (scene -> [(from, to), ...] scene-local seconds) and are reported but never flagged. Exit code 1 if anything outside them is flagged.
With --mp4 FILE: reads the frames from a finished video instead (every <step> seconds of the WHOLE episode, labelled with the scene that covers them): no rendering, a few seconds."""
import json, os, subprocess, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
MEAN_MIN, DARK_MAX = 0.20, 0.45
DARK_OK = {20: {'blackout': [(0.0, 12.9)], 'title': [], 'night': []}}      # blackout: the cascade, the dark lines and the count until the generator's ramp (the stopwatch hits 10.0 s at 12.4)


def stats(arr):
    a = arr.astype(np.float32) / 255.0
    y = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    return float(y.mean()), float((y < 0.08).mean())


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    mp4 = None
    if '--mp4' in sys.argv:
        mp4 = sys.argv[sys.argv.index('--mp4') + 1]
        args = [a for a in args if a != mp4]
    EP = int(args[0])
    scene = args[1] if len(args) > 1 else None
    step = float(args[2]) if len(args) > 2 else 0.5
    tl = json.load(open(f'{ROOT}/build/ep{EP}/timeline.json'))
    scs = tl['scenes']
    rows = []
    if mp4:
        import tempfile
        d = tempfile.mkdtemp(prefix='luma_')
        subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vf', f'fps={1 / step},scale=216:384', f'{d}/f_%05d.png'], check=True)
        files = sorted(f for f in os.listdir(d) if f.endswith('.png'))
        for i, f in enumerate(files):
            t = i * step + step / 2
            sc = next((s for s in scs if s['start'] <= t < s['start'] + s['dur']), scs[-1])
            m, dk = stats(np.asarray(Image.open(f'{d}/{f}').convert('RGB')))
            rows.append((sc['id'], t - sc['start'], m, dk))
    else:
        sc = next(s for s in scs if s['id'] == scene)
        lts = [round(.1 + i * step, 3) for i in range(int((sc['dur'] - .1) / step) + 1) if .1 + i * step < sc['dur'] - .02]
        abs_t = [f"{sc['start'] + l:.2f}" for l in lts]
        env = dict(os.environ, EP=str(EP), MB='1')
        subprocess.run(['node', 'render.js', 'preview'] + abs_t, cwd=ROOT, env=env, check=True, stdout=subprocess.DEVNULL)
        for l, a in zip(lts, abs_t):
            im = Image.open(f'{ROOT}/build/ep{EP}/preview/t_{a}.png').convert('RGB').resize((270, 480), Image.BILINEAR)
            m, dk = stats(np.asarray(im))
            rows.append((scene, l, m, dk))
    ok = DARK_OK.get(EP, {})
    bad = 0
    cur = None
    for sid, lt, m, dk in rows:
        exempt = any(a <= lt <= b for a, b in ok.get(sid, []))
        flag = (m < MEAN_MIN or dk > DARK_MAX)
        tag = ('  (dark beat)' if exempt and flag else ('  <== FLAGGED' if flag else ''))
        if flag and not exempt:
            bad += 1
        if sid != cur:
            print(f'-- {sid}')
            cur = sid
        print(f'{sid:9s} {lt:6.2f} s  mean {m:.3f}  dark {dk * 100:5.1f}%{tag}')
    n = len(rows)
    print(f'{n} frames, {bad} flagged outside the allowed dark beats, mean of means {np.mean([r[2] for r in rows]):.3f}')
    sys.exit(1 if bad else 0)


main()
