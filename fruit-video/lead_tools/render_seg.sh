#!/bin/bash
# usage: render_seg.sh EP [SEG=300]  (env ROOT=/tmp/snapNN for an isolated snapshot)
# Resumable full-quality render: video in segments of SEG frames (each its own ffmpeg encode, CRF 22.5), skipping segments already done, then a lossless concat of the video streams and one mux of build/ep<EP>/audio.m4a.
# Re-run it after a restart: it continues. Output: $SP/ep<EP>out/shift-happens-ep<EP>.mp4 ; status: /tmp/shift_final/ep<EP>/seg_status.txt
EP=${1:-16}; SEG=${2:-300}
ROOT=${ROOT:-/home/user/workblock100/fruit-video}
SP=/tmp/claude-0/-home-user-workblock100/a7ae9cc7-3306-516a-9318-51e578ae52e3/scratchpad
OUTD=$SP/ep${EP}out/seg; mkdir -p $OUTD /tmp/shift_final/ep$EP
ST=/tmp/shift_final/ep$EP/seg_status.txt
log() { echo "$(date -u +%H:%M:%S) UTC  $*" >> $ST; }
cd $ROOT || exit 2
TOTAL=$(python3 -c "import json,math;print(math.ceil(json.load(open('build/ep$EP/timeline.json'))['duration']*30 - 1e-9))")
log "render_seg start: EP $EP total $TOTAL frames, segment $SEG"
nok() { [ -s "$1" ] && [ "$(/usr/bin/ffprobe -v error -select_streams v:0 -show_entries stream=nb_frames -of csv=p=0 "$1" 2>/dev/null)" = "$2" ]; }
for ((a=0; a<TOTAL; a+=SEG)); do
  n=$((TOTAL-a)); [ $n -gt $SEG ] && n=$SEG
  f=$OUTD/s_$(printf %05d $a).mp4
  if nok "$f" $n; then continue; fi
  rm -f "$f" "$f.part.mp4"
  log "segment from $a frames $n"
  FROM=$a FRAMES=$n EP=$EP FMT=image/png CRF=22.5 FFMPEG=/usr/bin/ffmpeg AUDIO=build/ep$EP/audio.m4a WORKERS=4 node render.js video "$f.part.mp4" > $OUTD/log_$a.txt 2>&1
  if nok "$f.part.mp4" $n; then mv "$f.part.mp4" "$f"; else log "segment $a FAILED"; exit 4; fi
done
rm -f $OUTD/v_*.mp4 $OUTD/list.txt
for f in $OUTD/s_*.mp4; do b=$(basename $f); /usr/bin/ffmpeg -y -v error -i $f -an -c:v copy $OUTD/v_$b || { log "strip failed $b"; exit 5; }; echo "file '$OUTD/v_$b'" >> $OUTD/list.txt; done
OUT=$SP/ep${EP}out/shift-happens-ep$EP.mp4
/usr/bin/ffmpeg -y -v error -f concat -safe 0 -i $OUTD/list.txt -c copy $SP/ep${EP}out/video_only.mp4 || { log "concat failed"; exit 6; }
/usr/bin/ffmpeg -y -v error -i $SP/ep${EP}out/video_only.mp4 -i build/ep$EP/audio.m4a -map 0:v:0 -map 1:a:0 -c copy -shortest -movflags +faststart $OUT || { log "mux failed"; exit 7; }
log "mp4 $(/usr/bin/ffprobe -v error -show_entries format=duration,size -of csv=p=0 $OUT) sha256 $(sha256sum $OUT | cut -d' ' -f1)"
log "SEG_RENDER_DONE"
