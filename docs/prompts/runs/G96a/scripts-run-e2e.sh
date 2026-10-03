#!/usr/bin/env bash
# scripts-run-e2e.sh <log-name> <workers> [--grep <pattern>] <spec paths relative to app/>
# Checks every named spec file exists and port 4591 is free, then runs them from app/ through G96a's port
# copy (app/build/g96a/playwright.g96a-4591.config.ts, ignored, not for the commit), which serves the
# bundle in $G96A_DIST (default dist, relative to app/) with `vite preview` on 4591. G96A_PHASE passes
# through. The log's first line is the command, its last line exit=<code>; a log over 2,000 lines keeps its
# first line and last 2,000 (the full log is not kept).
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
log="$W/docs/prompts/runs/G96a/$1"; shift
workers="$1"; shift
grep_args=()
if [ "$1" = "--grep" ]; then grep_args=(-g "$2"); shift 2; fi
{
  echo "\$ (cd app) npx playwright test -c build/g96a/playwright.g96a-4591.config.ts --workers=$workers ${grep_args[*]} $*   [G96A_DIST=${G96A_DIST:-dist} G96A_PHASE=${G96A_PHASE:-}]"
  missing=0
  for spec in "$@"; do
    file="${spec%%:*}"
    if [ -f "$W/app/$file" ]; then echo "exists: $file"; else echo "MISSING: $file"; missing=1; fi
  done
  if [ "$missing" = 1 ]; then echo "exit=90"; exit 0; fi
  if netstat -ano 2>/dev/null | grep -q ':4591 .*LISTENING'; then echo "port 4591 is in use"; echo "exit=91"; exit 0; fi
  cd "$W/app" && npx playwright test -c build/g96a/playwright.g96a-4591.config.ts --workers="$workers" "${grep_args[@]}" "$@" 2>&1
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
