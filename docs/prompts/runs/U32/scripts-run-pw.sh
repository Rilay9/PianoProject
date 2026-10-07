#!/usr/bin/env bash
# Runs one Playwright invocation from app/ through a U32 config copy, detached-safe.
# Usage: run-pw.sh <log-name> <config-file-under-app/build/u32> [playwright args...]
# Env: U32_DIST (the build folder served), passed through.
W="/c/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-ae90e835312da8da3"
L="$W/build/u32/logs"
mkdir -p "$L"
name="$1"; shift
config="$1"; shift
rm -f "$L/$name.exit"
cd "$W/app" || exit 1
echo "U32_DIST=${U32_DIST:-dist} config=$config args=$*" > "$L/$name.log"
npx playwright test --config "build/u32/$config" "$@" >> "$L/$name.log" 2>&1
code=$?
echo "exit=$code" >> "$L/$name.log"
echo "$code" > "$L/$name.exit"
