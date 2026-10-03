#!/bin/sh
# G87: the first offline build (content-build.log) had no mutopia edition — G1c's setup, adapted here,
# copies kern and musetrainer only — so `song.ragtime.joplin-pine-apple-rag.mutopia` was built as a
# placeholder and the inventory counted one more item unmeasured than HEAD's. This copies the edition
# folder from the main checkout (read only, without .git) and runs the offline build again.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
M="$(cd "$W/../../.." && pwd)"
R="$W/docs/prompts/runs/G87"
cd "$W" || exit 1
{
  d=content/scores/imported/mutopia
  mkdir -p "$W/$d"
  (cd "$M/$d" && tar --exclude=.git -cf - .) | (cd "$W/$d" && tar -xf -); echo "tar $d exit=$?"
} > "$R/copy-mutopia.txt" 2>&1
python tools/content/build.py --offline > "$R/content-build-2.log" 2>&1; echo "exit=$?" >> "$R/content-build-2.log"
echo done > "$R/setup-mutopia-done.txt"
