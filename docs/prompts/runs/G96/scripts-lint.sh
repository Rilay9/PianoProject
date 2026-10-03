#!/usr/bin/env bash
# scripts-lint.sh <log-name>: `npm run lint` with no port config inside app/ — the lane's config copy
# (app/build/g96/, gitignored but not in eslint's ignores) is moved to the worktree's build/g96/ for the
# run and put back whatever happened.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
R="$W/docs/prompts/runs/G96/scripts-run.sh"
mkdir -p "$W/build/g96"
moved=0
if [ -d "$W/app/build/g96" ]; then mv "$W/app/build/g96" "$W/build/g96/app-build-aside" && moved=1; fi
rmdir "$W/app/build" 2>/dev/null
bash "$R" "$1" app npm run lint
if [ "$moved" = 1 ]; then mkdir -p "$W/app/build" && mv "$W/build/g96/app-build-aside" "$W/app/build/g96"; fi
echo "config copy back in app/build/g96: $([ -f "$W/app/build/g96/playwright.g96-4573.config.ts" ] && echo yes || echo no)" >> "$W/docs/prompts/runs/G96/$1"
tail -n 2 "$W/docs/prompts/runs/G96/$1"
