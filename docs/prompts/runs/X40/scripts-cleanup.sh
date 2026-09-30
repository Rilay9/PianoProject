#!/usr/bin/env bash
# X40's cleanup: the installed modules, the copied clones and caches, the builds' outputs and the lane's temp state,
# every path inside the worktree; each line says what it did. The tracked app/public/content/audio stays.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
OUT="$W/docs/prompts/runs/X40/cleanup.txt"
: > "$OUT"
for p in app/node_modules app/dist app/test-results test-results build/cache build/x40 \
         content/scores/imported/kern content/scores/imported/musetrainer \
         app/public/content/catalog.json app/public/content/catalog.schema.json app/public/content/curriculum.json \
         app/public/content/curriculum.schema.json app/public/content/lessons app/public/content/level-model.json \
         app/public/content/scores app/public/content/tips app/public/dev; do
  if [ -e "$W/$p" ]; then rm -rf "$W/$p" && echo "deleted $p" >> "$OUT"; else echo "absent $p" >> "$OUT"; fi
done
for f in "$W"/build/*; do
  [ -e "$f" ] || continue
  rm -rf "$f" && echo "deleted build/$(basename "$f")" >> "$OUT"
done
cat "$OUT"
