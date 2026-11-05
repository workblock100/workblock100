#!/usr/bin/env python3
"""usage: scene_info.py <EP> [scene]  -> every scene's start and length, each beat's scene-local start and end, and each spoken line with its scene-local times."""
import json, sys
EP = sys.argv[1]
only = sys.argv[2] if len(sys.argv) > 2 else None
tl = json.load(open(f'/home/user/workblock100/fruit-video/build/ep{EP}/timeline.json'))
for sc in tl['scenes']:
    if only and sc['id'] != only:
        continue
    print(f"== {sc['id']}  start {sc['start']:.3f}  dur {sc['dur']:.3f}  clock {sc.get('clock', '')!r} label {sc.get('label', '')!r}")
    beats = sorted(sc['beats'].items(), key=lambda kv: kv[1]['s'])
    lines = {(l['id']): l for l in tl['lines'] if l['scene'] == sc['id']}
    for bid, b in beats:
        ln = lines.get(bid)
        if ln:
            print(f"   {bid:<8} {b['s']:6.2f} - {b['e']:6.2f}  [{ln['who']}] {ln.get('text', '')}")
        else:
            print(f"   {bid:<8} {b['s']:6.2f} - {b['e']:6.2f}  (pause)")
