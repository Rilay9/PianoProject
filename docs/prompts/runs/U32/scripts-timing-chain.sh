#!/usr/bin/env bash
# Item 3's discriminator: the timing probe against each named build in turn, one worker, results copied out.
# Usage: timing-chain.sh <tag> <build-name>:<dist-folder> [<build-name>:<dist-folder> ...]
W="/c/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-ae90e835312da8da3"
tag="$1"; shift
rm -f "$W/build/u32/logs/$tag.chain.exit"
for pair in "$@"; do
  name="${pair%%:*}"; dist="${pair#*:}"
  U32_DIST="$dist" U32_BUILD_NAME="$name" U32_OPENS="${U32_OPENS:-3}" U32_RUNS="${U32_RUNS:-2}" \
    bash "$W/build/u32/run-pw.sh" "timing-$name" playwright.u32-4473.config.ts zz-u32-timing.spec.ts --workers=1
  mkdir -p "$W/build/u32/timing"
  cp "$W/app/test-results/u32-timing/"*.json "$W/build/u32/timing/" 2>/dev/null
done
echo done > "$W/build/u32/logs/$tag.chain.exit"
