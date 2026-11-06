#!/bin/bash
# usage: audit_scene.sh <EP> <scene id> [step=0.0333333]  -> the hard layout gate over one scene (exit non-zero on any issue), every frame at 30 fps by default
EP=$1; SC=$2; STEP=${3:-0.0333333}
cd /home/user/workblock100/fruit-video
read FROM TO < <(python3 - <<PY
import json
tl = json.load(open('build/ep$EP/timeline.json')); s = next(x for x in tl['scenes'] if x['id'] == '$SC')
print(round(s['start'] + .001, 3), round(s['start'] + s['dur'] - .001, 3))
PY
)
EP=$EP node render.js audit $STEP $FROM $TO
