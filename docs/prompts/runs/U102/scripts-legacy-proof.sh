#!/usr/bin/env bash
# The evidence for the legacy readings (Entry 162, "The legacy proofs"): every git log -S / -G bound and
# the per-version tables, in one capture. Read-only git. Run from anywhere; writes legacy-proof-evidence.txt.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
R="$W/docs/prompts/runs/U102"
cd "$W" || exit 1
{
  echo "# HEAD: $(git rev-parse --short HEAD)"
  echo
  echo '## 1. Which code ever wrote a drill:note-flash row'
  echo '$ git log --oneline -S'"'"'mode: `drill:${'"'"' -- app/src      # the drill writer template, added and never changed in count'
  git log --format='%h %ad %s' --date=short -S'mode: `drill:${' -- app/src | cut -c1-100
  echo '$ git log --oneline -S"drill:note-flash" -- app/src      # a literal note-flash mode anywhere, ever'
  git log --format='%h %ad %s' --date=short -S"drill:note-flash" -- app/src | cut -c1-100
  echo '(none above means none)'
  echo "\$ git log --oneline -S\"kind: 'note-flash'\" -- app/src      # construction sites of a note-flash drill"
  git log --format='%h %ad %s' --date=short -S"kind: 'note-flash'" -- app/src | cut -c1-100
  echo "\$ git grep -n \"kind: 'note-flash'\" HEAD -- app/src"
  git grep -n "kind: 'note-flash'" HEAD -- app/src
  echo
  echo '## 2. The session store'"'"'s writers at every commit whose diff changed the string '"'"'sessions'"'"' in app/src'
  bash "$R/scripts-session-writers.sh"
  echo
  echo '## 3. How recordRun stored accuracy, wrongNotes and missed, at every version of progressStore.ts'
  bash "$R/scripts-store-history.sh"
  echo
  echo '## 4. The drill writer at every version of DrillScreen.ts (accuracy | wrongNotes | missed | writers | going-over guards)'
  bash "$R/scripts-writer-history.sh"
  echo "\$ git log --oneline -S\"finishGoingOver\" -- app/src/ui/screens/DrillScreen.ts      # the going-over arrived with its guard"
  git log --format='%h %ad %s' --date=short -S"finishGoingOver" -- app/src/ui/screens/DrillScreen.ts | cut -c1-100
  echo
  echo '## 5. What noteFlashDrill returns and what fromCatalog calls, at every version of the two builders'
  bash "$R/scripts-builder-history.sh"
  echo
  echo '## 6. PromptDrill.ts, every version'
  git log --follow --format='%h %ad %s' --date=short -- app/src/engine/drills/PromptDrill.ts | cut -c1-100
  for sha in $(git log --follow --format='%h' -- app/src/engine/drills/PromptDrill.ts); do
    echo "--- $sha: next() push of an unanswered card, settle guard, result()"
    git show "$sha:app/src/engine/drills/PromptDrill.ts" | grep -n -E 'if \(this\.current && !this\.answeredCurrent\)|if \(!prompt \|\| this\.answeredCurrent\) return|this\.answeredCurrent = true|const answered = this\.answers\.length|const correct = |accuracy: answered > 0'
  done
  echo
  echo '## 7. The backing track'"'"'s result at every version of special.ts'
  bash "$R/scripts-special-history.sh"
  echo "\$ git log --oneline -S\"kind: 'backing-track'\" -- app/src"
  git log --format='%h %ad %s' --date=short -S"kind: 'backing-track'" -- app/src | cut -c1-100
  echo '(none above means none)'
  echo "\$ git grep -n \"'backing-track' as const\" HEAD -- app/src"
  git grep -n "'backing-track' as const" HEAD -- app/src
  echo
  echo '## 8. When a drill row began naming the rung that judged it'
  git log --format='%h %ad %s' --date=short -S"lessonId: rung.id" -- app/src/ui/screens/DrillScreen.ts | cut -c1-100
} > "$R/legacy-proof-evidence.txt" 2>&1
echo "exit=$?" >> "$R/legacy-proof-evidence.txt"
tail -n 1 "$R/legacy-proof-evidence.txt"
