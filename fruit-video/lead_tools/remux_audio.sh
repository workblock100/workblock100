#!/bin/bash
# usage: remux_audio.sh <EP>  -> copies the video stream of the rendered MP4 and replaces its audio with the CURRENT build/ep<EP>/audio.m4a (stream copy, -shortest, faststart).
# Input  $SP/ep<EP>out/shift-happens-ep<EP>.mp4 ; output $SP/ep<EP>out/shift-happens-ep<EP>.final.mp4 (then verify.py / publish that one).
EP=${1:-15}
SP=/tmp/claude-0/-home-user-workblock100/a7ae9cc7-3306-516a-9318-51e578ae52e3/scratchpad
IN=$SP/ep${EP}out/shift-happens-ep$EP.mp4
OUT=$SP/ep${EP}out/shift-happens-ep$EP.final.mp4
AUD=/home/user/workblock100/fruit-video/build/ep$EP/audio.m4a
[ -s "$IN" ] && [ -s "$AUD" ] || { echo "missing input"; exit 2; }
/usr/bin/ffmpeg -y -v error -i "$IN" -i "$AUD" -map 0:v:0 -map 1:a:0 -c copy -shortest -movflags +faststart "$OUT" && echo "wrote $OUT" && /usr/bin/ffprobe -v error -show_entries format=duration,size -of csv=p=0 "$OUT"
