#!/usr/bin/env bash
# The committed bundle, for the before pictures, built after the change was written: the seven changed source
# files are set aside under build/u102/changed/ (sha256 recorded), the committed bytes are written in their
# place from HEAD, `npm run build:app` runs, its dist is moved to build/u102/dist-committed, and the changed
# files are put back and their sha256 compared. No git state is touched (no checkout, stash or reset).
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
R="$W/docs/prompts/runs/U102/scripts-run.sh"
C="$W/build/u102/changed"
files="app/src/data/db.ts app/src/data/progressStore.ts app/src/data/sessionRun.ts app/src/evidence/rungState.ts app/src/ui/help.ts app/src/ui/screens/DrillScreen.ts app/src/ui/screens/ProgressScreen.ts"
cd "$W" || exit 1
rm -rf "$C" "$W/build/u102/dist-committed"
mkdir -p "$C"
for f in $files; do
  mkdir -p "$C/$(dirname "$f")"
  cp "$f" "$C/$f"
done
( cd "$C" && sha256sum $files ) > "$W/build/u102/changed.sha256"
for f in $files; do git show "HEAD:$f" > "$f"; done
echo "committed bytes in place:"; git diff --stat -- $files | tail -1
bash "$R" build-app-committed.txt app npm run build:app
mv "$W/app/dist" "$W/build/u102/dist-committed"
for f in $files; do cp "$C/$f" "$f"; done
echo "restored; sha256 against the set-aside copies:"
sha256sum -c "$W/build/u102/changed.sha256" --quiet && echo "all seven identical"
