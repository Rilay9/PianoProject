#!/usr/bin/env bash
# U118a: build one variant of the three lanes' files and run the probe on it.
# usage: variant-run.sh <variant> <label> [env assignments for the probe...]
# variant: base | preU118 | preU119
# The working tree's files are restored to base afterwards.
set -u
W="<worktree>"
V="$W/build/u118a/variants"
variant="$1"; label="$2"; shift 2
restore() {
  cp "$V/ScoreScreen.base.ts" "$W/app/src/ui/screens/ScoreScreen.ts"
  cp "$V/WindowRenderer.base.ts" "$W/app/src/score/WindowRenderer.ts"
  cp "$V/style.base.css" "$W/app/src/style.css"
}
restore
case "$variant" in
  base) ;;
  preU118)
    cp "$V/ScoreScreen.preU118.ts" "$W/app/src/ui/screens/ScoreScreen.ts"
    cp "$V/WindowRenderer.preU118.ts" "$W/app/src/score/WindowRenderer.ts" ;;
  preU119)
    cp "$V/style.preU119.css" "$W/app/src/style.css" ;;
  *) echo "unknown variant $variant"; exit 2 ;;
esac
cd "$W/app" || exit 2
if [ "${SKIP_BUILD:-0}" != "1" ]; then
  npx vite build > "$W/build/u118a-vite-$variant.log" 2>&1 || { echo "vite build failed"; restore; exit 3; }
fi
restore
env U118A_TESTDIR=build/u118a/probe "$@" npx playwright test -c build/u118a/playwright.u118a-5341.config.ts > "$W/build/u118a-run-$label.log" 2>&1
echo "playwright exit $?"
