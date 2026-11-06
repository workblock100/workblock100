#!/bin/bash
# usage: snapshot_ep.sh N  (N = 15, 16 or 17) -> /tmp/snapN : an isolated copy of the project for the final render of episode N (no build outputs, no mp4, no files of the OTHER new episodes), with the other episodes' blocks stripped from index.html.
N=$1
SRC=/home/user/workblock100/fruit-video
DST=/tmp/snap$N
rm -rf $DST && mkdir -p $DST
EX=()
for o in 15 16 17; do
  [ "$o" = "$N" ] && continue
  # Episode 15's kit files are needed by 16 and 17: only exclude the OTHER episode's own files when it is 16 or 17
  if [ "$o" != "15" ]; then EX+=(--exclude="./ep${o}*" --exclude="./script_ep${o}.json" --exclude="./build_audio${o}.py" --exclude="./build_music${o}.py" --exclude="./gen_script${o}.py"); fi
done
cd $SRC && tar -c --exclude='./build' --exclude='./node_modules' --exclude='*.mp4' "${EX[@]}" -f - . | tar -x -C $DST
mkdir -p $DST/build && cp $SRC/build/timeline.js $SRC/build/audio.m4a $DST/build/ 2>/dev/null
for d in $SRC/build/ep*; do n=$(basename $d); case "$n" in ep15|ep16|ep17|ep1[0-9]_*|ep[0-9]_*) ;; esac
  case "$n" in *_*) continue;; esac
  if [ "$n" = "ep16" ] || [ "$n" = "ep17" ] || [ "$n" = "ep15" ]; then
    [ "$n" != "ep$N" ] && [ "$n" != "ep15" ] && continue
  fi
  [ -f $d/timeline.js ] && { mkdir -p $DST/build/$n; cp $d/timeline.js $DST/build/$n/; }
done
mkdir -p $DST/build/ep$N
for f in timeline.json timeline.js audio.m4a events.json phys_events.json phys_sims.json; do cp $SRC/build/ep$N/$f $DST/build/ep$N/ 2>/dev/null; done
python3 - "$N" <<'PY'
import re, sys
N = sys.argv[1]; p = f'/tmp/snap{N}/index.html'; s = open(p).read()
for o in ('16', '17'):
    if o == N: continue
    s = re.sub(rf'<!-- EP{o} BEGIN -->\n.*?<!-- EP{o} END -->\n', '', s, flags=re.S)
    s = s.replace(f'<script src="build/ep{o}/timeline.js"></script>\n', '')
if N != '15' and False: pass
open(p, 'w').write(s)
print('snapshot', N, 'index.html refs to other new episodes:', [o for o in ('16','17') if o != N and re.search(rf'ep{o}', s)])
PY
du -sh $DST | tail -1
