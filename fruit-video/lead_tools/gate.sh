#!/bin/bash
# usage: gate.sh <EP> [step=0.1] [shards=4]   the full-episode audit (text gate included when the episode has textGate, or TEXTGATE=1), in parallel shards
# prints the merged, grouped issue list and a summary; exit 1 when any issue is found
EP=${1:?episode}; STEP=${2:-0.1}; SH=${3:-4}
cd /home/user/workblock100/fruit-video
DUR=$(python3 - <<PY
import json
tl=json.load(open('build/ep$EP/timeline.json')); print(tl['duration'])
PY
)
OUT=/tmp/shift_sheets/gate_ep$EP; mkdir -p $OUT; rm -f $OUT/shard*.log
for i in $(seq 0 $((SH-1))); do
  A=$(python3 -c "print(round($DUR*$i/$SH,3))"); B=$(python3 -c "print(round($DUR*($i+1)/$SH,3))")
  ( EP=$EP node render.js audit $STEP $A $B > $OUT/shard$i.log 2>&1 ) &
done
wait
cat $OUT/shard*.log | grep -v "issue-frames" | sort -t's' -k1,1n > $OUT/merged.log
TOT=$(cat $OUT/shard*.log | grep "issue-frames" | awk '{s+=$1} END {print s}')
FR=$(cat $OUT/shard*.log | grep "issue-frames" | sed 's/.*distinct issues, //' | awk '{s+=$1} END {print s}')
echo "issue-frames: $TOT   frames checked: $FR   distinct lines: $(wc -l < $OUT/merged.log)   (log: $OUT/merged.log)"
[ "$TOT" = "0" ]
