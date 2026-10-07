#!/usr/bin/env bash
# scripts-run.sh <log-name> <dir relative to the worktree> <command...>
# Runs one command in that folder and writes its output to docs/prompts/runs/G96/<log-name>: the first line
# is the command, the last line exit=<code>. A log over 2,000 lines keeps its first line and its last
# 2,000 (the full log is not kept, and the log says so).
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
log="$W/docs/prompts/runs/G96/$1"; shift
dir="$1"; shift
{
  echo "\$ (cd $dir) $*"
  (cd "$W/$dir" && "$@") 2>&1
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
