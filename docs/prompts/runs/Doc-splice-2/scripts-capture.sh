#!/usr/bin/env bash
# Doc-splice-2: run one command from a folder and write a capture whose first line is the command
# and whose last line is its exit code.
#   bash docs/prompts/runs/Doc-splice-2/scripts-capture.sh <capture-name> <folder> <command...>
# The capture lands in docs/prompts/runs/Doc-splice-2/<capture-name>.txt; machine paths are left as
# the command printed them.
set -u
export PYTHONIOENCODING=utf-8
here="$(cd "$(dirname "$0")" && pwd)"
name="$1"; shift
folder="$1"; shift
out="$here/$name.txt"
{
  echo "\$ (cwd $folder) $*"
  (cd "$folder" && "$@")
  echo "exit=$?"
} > "$out" 2>&1
tail -n 1 "$out"
