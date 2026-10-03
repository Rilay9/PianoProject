#!/bin/sh
# G1c: build the app into a folder, with the exit in the log.  Usage: scripts-build_app.sh <log> <outDir|->
# With `-` it is the full `npm run build:app` (icons, tsc -b, vite build into app/dist); otherwise the
# icons and `vite build --outDir <outDir>` (the committed code's build, before any source change).
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
R="$W/docs/prompts/runs/G1c"
LOG="$R/$1"
cd "$W/app" || exit 1
if [ "$2" = "-" ]; then
  npm run build:app > "$LOG" 2>&1
else
  { node scripts/generate-icons.mjs && npx vite build --outDir "$2" --emptyOutDir; } > "$LOG" 2>&1
fi
echo "exit=$?" >> "$LOG"
tail -1 "$LOG"
