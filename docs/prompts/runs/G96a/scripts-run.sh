#!/usr/bin/env bash
# scripts-run.sh <log-name> <dir relative to the worktree> <command...>
# Runs one command in that folder and writes docs/prompts/runs/G96a/<log-name>: the command on the first
# line, its output, `exit=<code>` on the last. A log over 2,000 lines keeps its first line and last 2,000
# (the full log is not kept). Prints the last line.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
log="$W/docs/prompts/runs/G96a/$1"; shift
dir="$1"; shift
{
  echo "\$ (cd $dir) $*"
  cd "$W/$dir" && "$@" 2>&1
  echo "exit=$?"
} > "$log.full" 2>&1
lines=$(wc -l < "$log.full")
if [ "$lines" -gt 2000 ]; then
  { head -n 1 "$log.full"; echo "[trimmed: the first line, then the last 2,000 of $lines lines; the full log was not kept]"; tail -n 2000 "$log.full"; } > "$log"
else
  cp "$log.full" "$log"
fi
rm -f "$log.full"
tail -n 1 "$log"
