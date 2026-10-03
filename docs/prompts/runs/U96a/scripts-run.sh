#!/usr/bin/env bash
# One command, logged: scripts-run.sh <log-name> <dir-relative-to-worktree> <command...>
# The log's first line is the command, its last line exit=<code>. Written to docs/prompts/runs/U96a/<log-name>.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
log="$W/docs/prompts/runs/U96a/$1"; shift
dir="$1"; shift
{
  echo "\$ (cd $dir) $*"
  cd "$W/$dir" && "$@" 2>&1
  code=$?
  echo "exit=$code"
} > "$log" 2>&1
tail -n 1 "$log"
