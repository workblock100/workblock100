#!/usr/bin/env python3
"""usage: tools_flashcheck.py FILE.mp4 [--list]
Photosensitivity check on a finished video, from the frame-average relative luminance (not a full WCAG analysis, which works on regions): decodes every frame at 135 x 240, computes the mean relative
luminance (sRGB linearised, Rec.709 weights) per frame, finds the turning points of that curve with a hysteresis of T (a swing smaller than T is ignored), and reports for T = 0.10, 0.05 and 0.03 the
largest number of opposing changes inside any one-second window (WCAG's general flash threshold is a PAIR of opposing changes of 0.10 or more, at most 3 pairs per second; this reports single changes, which is stricter by a factor of two).
--list prints the time and size of every change at T = 0.10. Exit code 1 if any one-second window holds more than 5 changes at T = 0.10 (that is, more than 2.5 pairs)."""
import subprocess, sys
import numpy as np

path = sys.argv[1]
FPS = 30
p = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', f'fps={FPS},scale=135:240', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE, check=True)
raw = np.frombuffer(p.stdout, dtype=np.uint8).reshape(-1, 240, 135, 3).astype(np.float32) / 255.0
lin = np.where(raw <= 0.04045, raw / 12.92, ((raw + 0.055) / 1.055) ** 2.4)
L = (0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2]).mean(axis=(1, 2))
n = len(L)


def changes(T):
    """turning-point zigzag with hysteresis T: returns [(frame, signed swing)]."""
    out = []
    ext, ext_i, direction = L[0], 0, 0
    for i in range(1, n):
        v = L[i]
        if direction >= 0 and v > ext:
            if direction == 0 or True:
                ext, ext_i = v, i
            if direction == 0 and v - L[0] >= T:
                direction = 1
        elif direction <= 0 and v < ext:
            ext, ext_i = v, i
            if direction == 0 and L[0] - v >= T:
                direction = -1
        if direction == 1 and ext - v >= T:
            out.append((ext_i, ext)); direction = -1; ext, ext_i = v, i
        elif direction == -1 and v - ext >= T:
            out.append((ext_i, ext)); direction = 1; ext, ext_i = v, i
    return out


res = {}
for T in (0.10, 0.05, 0.03):
    pts = changes(T)
    frames = [f for f, _ in pts]
    best = 0
    for i, f in enumerate(frames):
        k = sum(1 for g in frames if f <= g < f + FPS)
        best = max(best, k)
    res[T] = (best, pts)
    print(f'T = {T:.2f}: {len(pts)} turning points, at most {best} opposing changes in any one-second window')
if '--list' in sys.argv:
    pts = res[0.10][1]
    for (f, v), (f2, v2) in zip(pts, pts[1:]):
        print(f'  {f / FPS:8.2f} s  L {v:.3f} -> {f2 / FPS:8.2f} s L {v2:.3f}  swing {abs(v2 - v):.3f}')
print(f'{n} frames, {n / FPS:.2f} s, mean L {L.mean():.3f}, min {L.min():.3f}, max {L.max():.3f}')
sys.exit(1 if res[0.10][0] > 5 else 0)
