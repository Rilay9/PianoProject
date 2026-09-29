#!/usr/bin/env bash
# X3d's red-first swap (not a git operation: no checkout, stash or reset). `aside` copies this seam's changed
# source files to the scratchpad with their sha256, then writes the committed text of each (`git show HEAD:`)
# in their place and moves the new module away, so the new tests run against the committed sources; `back`
# restores the copies and checks every sha256 against the one taken before. The tests stay as written.
# Usage, from anywhere: bash scripts-swap.sh aside|back
set -euo pipefail
ROOT="/c/Users/yalir/repos/Piano Stuff/PianoProject/.claude/worktrees/agent-a6cb245891137756b"
KEEP="/c/Users/yalir/AppData/Local/Temp/claude/C--Users-yalir-repos-Piano-Stuff/9b647b56-e651-4563-9f4f-ce3e1e36a4a2/scratchpad/x3d/mine"
CHANGED=(
  app/src/data/evidenceJob.ts
  app/src/data/importStore.ts
  app/src/score/OsmdView.ts
  app/src/score/estimateImport.ts
  app/src/score/extractScoreModel.ts
  app/src/ui/importSheet.ts
)
NEW=app/src/score/tempoFromXml.ts
cd "$ROOT"
case "${1:-}" in
  aside)
    mkdir -p "$KEEP"
    : > "$KEEP/sha256.txt"
    for f in "${CHANGED[@]}" "$NEW"; do
      mkdir -p "$KEEP/$(dirname "$f")"
      cp "$f" "$KEEP/$f"
      sha256sum "$f" >> "$KEEP/sha256.txt"
    done
    for f in "${CHANGED[@]}"; do git show "HEAD:$f" > "$f"; done
    rm "$NEW"
    echo "aside: ${#CHANGED[@]} files at HEAD's text, $NEW moved away"
    git status --short app/src
    ;;
  back)
    for f in "${CHANGED[@]}" "$NEW"; do cp "$KEEP/$f" "$f"; done
    sha256sum -c "$KEEP/sha256.txt"
    ;;
  *)
    echo "usage: scripts-swap.sh aside|back" >&2
    exit 2
    ;;
esac
