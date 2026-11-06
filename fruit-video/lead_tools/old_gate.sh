#!/bin/bash
# runs the text gate over earlier episodes at a coarse step, one at a time, low priority
cd /home/user/workblock100/fruit-video
for EP in 6 7 8 9 10 11 12; do
  TEXTGATE=1 EP=$EP nice -n 12 node render.js audit 0.25 > /tmp/shift_sheets/old_gate/ep$EP.log 2>&1
  echo "ep$EP done: $(tail -1 /tmp/shift_sheets/old_gate/ep$EP.log)" >> /tmp/shift_sheets/old_gate/progress.txt
done
echo ALLDONE >> /tmp/shift_sheets/old_gate/progress.txt
