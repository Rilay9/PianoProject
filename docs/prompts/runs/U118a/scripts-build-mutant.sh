#!/usr/bin/env bash
# U118a: build the dist with an app mutant applied, then undo the mutant in the tree.
# usage: build-mutant.sh <M2|none>
set -u
W="<worktree>"
m="$1"
if [ "$m" != "none" ]; then python "$W/build/u118a/mutate.py" "$m" apply || exit 2; fi
cd "$W/app" || exit 2
npx vite build > "$W/build/u118a-vite-$m.log" 2>&1
code=$?
echo "vite build ($m) exit $code"
if [ "$m" != "none" ]; then python "$W/build/u118a/mutate.py" "$m" undo; fi
exit $code
