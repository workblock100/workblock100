#!/bin/bash
# usage: wip_commit.sh "message"  -> commit and push every changed or new source file in fruit-video that passes a syntax check (never MP4s, never build outputs)
cd /home/user/workblock100/fruit-video || exit 1
MSG=${1:-"WIP checkpoint"}
ADD=()
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    *.js) node --check "$f" 2>/dev/null && ADD+=("$f") || echo "SKIP (syntax error): $f";;
    *.py) python3 -c "import ast,sys;ast.parse(open('$f').read())" 2>/dev/null && ADD+=("$f") || echo "SKIP (syntax error): $f";;
    *.mp4|*.wav|*.png|*.jpg) echo "SKIP (media): $f";;
    build/ep13/events.json|build/ep13/audio.m4a|build/ep14/events.json|build/ep14/audio.m4a|build/ep15/events.json|build/ep15/audio.m4a|build/ep15/phys_events.json|build/ep15/phys_sims.json|build/ep16/audio.m4a|build/ep17/audio.m4a|build/ep16/events.json|build/ep17/events.json|build/ep16/phys_events.json|build/ep17/phys_events.json|build/ep16/phys_sims.json|build/ep17/phys_sims.json|build/ep18/audio.m4a|build/ep18/events.json|build/ep18/phys_events.json|build/ep18/phys_sims.json|build/ep18/door_events.json|build/ep18/timeline.js|build/ep19/audio.m4a|build/ep19/events.json|build/ep19/phys_events.json|build/ep19/phys_sims.json|build/ep19/plate_path.json|build/ep19/timeline.js|build/ep20/audio.m4a|build/ep20/events.json|build/ep20/phys_events.json|build/ep20/phys_sims.json|build/ep20/door_events.json|build/ep20/lapse.json|build/ep20/timeline.js) ADD+=("$f");;
    build/*) ;;
    *) ADD+=("$f");;
  esac
done < <( (git ls-files -m; git ls-files -o --exclude-standard) | sort -u)
if [ ${#ADD[@]} -eq 0 ]; then echo "nothing to commit"; exit 0; fi
git add -- "${ADD[@]}"
git commit -q -m "$MSG

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01BC83bCrpoR74rk7NR2LTbX" && echo "committed ${#ADD[@]} files"
for i in 1 2 3 4; do git push -q -u origin claude/fruit-ai-video-nurse-98w13m 2>&1 && break || sleep $((2**i)); done
git status --short | head -5
