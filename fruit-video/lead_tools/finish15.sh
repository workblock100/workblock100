#!/bin/bash
# usage: finish15.sh audit|render [EP=15]
#   audit : strict layout audit of the whole episode (4 shards, 30 fps), verdict in /tmp/shift_final/ep$EP/finish_status.txt
#   render: full-quality render (CRF 22.5, then 23.5, then 24.5 if the file would break GitHub's 100 MiB limit), ffprobe check, verify.py.
# Both run unattended, so they keep going if the lead is stopped by the usage cap. Output: $SP/ep$EP out/shift-happens-ep$EP.mp4
MODE=${1:-render}
EP=${2:-15}
ROOT=${ROOT:-/home/user/workblock100/fruit-video}   # render from an isolated snapshot by exporting ROOT=/tmp/snap<EP>
SP=/tmp/claude-0/-home-user-workblock100/a7ae9cc7-3306-516a-9318-51e578ae52e3/scratchpad
OUTD=$SP/ep${EP}out
FD=/tmp/shift_final/ep$EP
ST=$FD/finish_status.txt
mkdir -p $OUTD $FD
log() { echo "$(date -u +%H:%M:%S) UTC  $*" >> $ST; }
cd $ROOT || exit 2

if [ "$MODE" = audit ]; then
  log "AUDIT start"
  bash /tmp/shift_tools/final_audit.sh $EP > $OUTD/audit_summary.txt 2>&1
  BAD=0
  for i in 0 1 2 3; do
    L=$(grep -E "issue-frames" $FD/audit_$i.txt | tail -1)
    log "audit shard $i: $L"
    case "$L" in "0 issue-frames,"*) ;; *) BAD=1 ;; esac
  done
  if [ $BAD = 0 ]; then log "AUDIT_CLEAN"; else log "AUDIT_HAS_ISSUES (see $FD/audit_*.txt)"; fi
  exit $BAD
fi

if [ "$MODE" = render ]; then
  for f in build/ep$EP/audio.m4a build/ep$EP/timeline.json; do
    [ -s $f ] || { log "RENDER_ABORT missing $f"; exit 2; }
  done
  OUT=$OUTD/shift-happens-ep$EP.mp4
  OK=0
  for CRF in 22.5 23.5 24.5; do
    log "render CRF $CRF start"
    EP=$EP FMT=image/png CRF=$CRF FFMPEG=/usr/bin/ffmpeg AUDIO=build/ep$EP/audio.m4a WORKERS=4 node render.js video $OUT > $OUTD/render_$CRF.log 2>&1
    RC=$?
    SZ=$(stat -c %s $OUT 2>/dev/null || echo 0)
    log "render CRF $CRF exit $RC size $SZ bytes"
    if [ $RC = 0 ] && [ $SZ -gt 1000000 ] && [ $SZ -lt 100000000 ]; then OK=1; break; fi
  done
  if [ $OK = 0 ]; then log "RENDER_FAILED_OR_TOO_BIG"; exit 4; fi
  DUR=$(/usr/bin/ffprobe -v error -show_entries format=duration -of csv=p=0 $OUT 2>/dev/null)
  log "mp4 duration $DUR s, size $(stat -c %s $OUT) bytes, sha256 $(sha256sum $OUT | cut -d' ' -f1)"
  log "verify start"
  python3 /tmp/shift_tools/verify.py $EP $OUT > $OUTD/verify.txt 2>&1
  log "verify exit $?: $(grep -E 'DECODE|I:|Peak:|median|worst|under 30' $OUTD/verify.txt | tr '\n' ' ' | cut -c1-400)"
  log "RENDER_DONE"
  exit 0
fi
echo "usage: finish15.sh audit|render [EP]"; exit 2
