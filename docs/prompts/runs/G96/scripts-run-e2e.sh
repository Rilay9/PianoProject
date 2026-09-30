#!/usr/bin/env bash
# scripts-run-e2e.sh <log-name> <workers> [--grep <pattern>] <spec paths relative to app/, each optionally :line>
# Checks every named spec file exists and port 4573 is free, then runs them from app/ on G96's port copy
# (app/build/g96/playwright.g96-4573.config.ts, gitignored, not for the commit), which serves the bundle in
# $G96_DIST (default app/dist) with `vite preview` on 4573. G96_PHASE passes through. The log's first line
# is the command, its last line exit=<code>; a log over 2,000 lines keeps its first line and last 2,000.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
log="$W/docs/prompts/runs/G96/$1"; shift
workers="$1"; shift
grep_args=()
if [ "$1" = "--grep" ]; then grep_args=(-g "$2"); shift 2; fi
{
  echo "\$ (cd app) npx playwright test -c build/g96/playwright.g96-4573.config.ts --workers=$workers ${grep_args[*]} $*   [G96_DIST=${G96_DIST:-app/dist} G96_PHASE=${G96_PHASE:-}]"
  missing=0
  for spec in "$@"; do
    file="${spec%%:*}"
    if [ -f "$W/app/$file" ]; then echo "exists: $file"; else echo "MISSING: $file"; missing=1; fi
  done
  if [ "$missing" = 1 ]; then echo "exit=90"; exit 0; fi
  if netstat -ano 2>/dev/null | grep -q ':4573 .*LISTENING'; then echo "port 4573 is in use"; echo "exit=91"; exit 0; fi
  cd "$W/app" && npx playwright test -c build/g96/playwright.g96-4573.config.ts --workers="$workers" "${grep_args[@]}" "$@" 2>&1
  code=$?
  echo "exit=$code"
} > "$log.full" 2>&1
lines=$(wc -l < "$log.full")
if [ "$lines" -gt 2000 ]; then
  { head -n 1 "$log.full"; echo "[trimmed: the first line, then the last 2,000 of $lines lines; the full log was not kept]"; tail -n 2000 "$log.full"; } > "$log"
else
  cp "$log.full" "$log"
fi
rm -f "$log.full"
tail -n 1 "$log"
