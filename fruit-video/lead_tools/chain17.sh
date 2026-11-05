#!/bin/bash
# waits for the Episode 17 audit to finish clean and the Episode 16 render to finish, then renders Episode 17 from its snapshot (unattended)
until grep -q "AUDIT_CLEAN\|AUDIT_HAS_ISSUES" /tmp/shift_final/ep17/finish_status.txt 2>/dev/null; do sleep 10; done
grep -q AUDIT_CLEAN /tmp/shift_final/ep17/finish_status.txt || { echo "ep17 audit not clean" > /tmp/chain17.log; exit 1; }
until grep -q "render CRF .* exit\|RENDER_FAILED" /tmp/shift_final/ep16/finish_status.txt 2>/dev/null; do sleep 10; done
echo "starting ep17 render $(date -u +%H:%M:%S)" > /tmp/chain17.log
ROOT=/tmp/snap17 bash /tmp/shift_tools/finish15.sh render 17 > /tmp/shift_render17_launch.log 2>&1
