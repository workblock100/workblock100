#!/bin/bash
# usage: final_audit.sh <EP>  -> the strict layout audit of the whole episode at 30 fps in four parts, in parallel; results in /tmp/shift_final/ep<EP>/
EP=$1
cd /home/user/workblock100/fruit-video
OUT=/tmp/shift_final/ep$EP; mkdir -p $OUT; rm -f $OUT/*
DUR=$(python3 -c "import json;print(json.load(open('build/ep$EP/timeline.json'))['duration'])")
python3 - "$DUR" > $OUT/ranges.txt <<'PY'
import sys
d = float(sys.argv[1]); n = 4
for i in range(n):
    fa = lambda x: round(round(x * 30) / 30, 5)          # shard starts snap to the frame grid (k/30), so every sample is a real video frame time
    a = fa(d * i / n); b = fa(d * (i + 1) / n) if i < n - 1 else round(d + .5, 3)
    print(a, b)
PY
i=0
while read A B; do
  (EP=$EP node render.js audit 0.0333333 $A $B > $OUT/audit_$i.txt 2>&1; echo "exit $?" >> $OUT/audit_$i.txt) &
  i=$((i+1))
done < $OUT/ranges.txt
wait
echo FINAL_AUDIT_DONE > $OUT/done.txt
for f in $OUT/audit_*.txt; do echo "== $f"; tail -2 $f | cut -c1-200; done
