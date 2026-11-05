#!/usr/bin/env python3
"""cues.py <ep> [scene]: every beat of a scene with its scene-local start/end, the spoken line, and the sound cues landing in it (scene-local seconds, from script_ep<ep>.json + build/ep<ep>/timeline.json)."""
import json, sys
ROOT = '/home/user/workblock100/fruit-video'
ep = sys.argv[1]; only = sys.argv[2] if len(sys.argv) > 2 else None
script = json.load(open(f'{ROOT}/script_ep{ep}.json'))
tl = json.load(open(f'{ROOT}/build/ep{ep}/timeline.json'))
sc_script = {s['id']: s for s in script['scenes']}
for sc in tl['scenes']:
    if only and sc['id'] != only: continue
    print(f"== {sc['id']}  start {sc['start']:.3f}  dur {sc['dur']:.3f}  clock {sc.get('clock')!r} label {sc.get('label')!r}")
    lines = {l['id']: l for l in tl['lines'] if l['scene'] == sc['id']}
    for b in sc_script[sc['id']]['beats']:
        be = sc['beats'][b['id']]
        txt = ''
        if b['id'] in lines: txt = f"[{lines[b['id']]['who']}] {lines[b['id']].get('text', '')}"
        elif 'pause' in b: txt = '(pause)'
        print(f"  {b['id']:9s} {be['s']:7.3f} - {be['e']:7.3f}  {txt}")
        for c in b.get('sfx', []):
            off = c[1]
            t = be['e'] if off == 'end' else be['s'] + off
            print(f"      cue {c[0]:10s} at {t:7.3f}  (gain {c[2]}, pan {c[3]})")
