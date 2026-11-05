#!/bin/bash
# waits for the Episode 16 segmented render to finish, then runs the Episode 17 one (both resumable: re-launch this after a restart)
until grep -q SEG_RENDER_DONE /tmp/shift_final/ep16/seg_status.txt 2>/dev/null; do sleep 10; done
ROOT=/tmp/snap17 bash /tmp/shift_tools/render_seg.sh 17 300
