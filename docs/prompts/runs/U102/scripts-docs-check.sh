#!/usr/bin/env bash
# After the doc rows were applied: set up again (npm ci and the offline content build, the four generated docs
# snapshotted and restored; logs under build/u102/), then the unit files that read the docs, lessonClaimsAboutApp
# among them, logged to docs-tests.txt. Writes build/u102/docs.exit when done.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"
R="$W/docs/prompts/runs/U102/scripts-run.sh"
S="$W/build/u102/snap"
cd "$W" || exit 1
rm -f build/u102/docs.exit
gen="docs/prompts/inventory.md docs/prompts/rung-claims.md content/scores/imported/SOURCES.md docs/generated/ladder.md"
for f in $gen; do mkdir -p "$S/$(dirname "$f")"; cp "$f" "$S/$f"; done
( cd app && npm ci --no-audit --no-fund ) > build/u102/npm-ci-2.log 2>&1; echo "exit=$?" >> build/u102/npm-ci-2.log
python tools/content/build.py --offline > build/u102/content-build-2.log 2>&1; echo "exit=$?" >> build/u102/content-build-2.log
for f in $gen; do cp "$S/$f" "$f"; done
bash "$R" docs-tests.txt app npx vitest run tests/unit/docsConsistency.test.ts tests/unit/help.test.ts tests/unit/labHelp.test.ts tests/unit/progressHistoryLines.test.ts tests/unit/sightReadingFromReadingState.test.ts tests/unit/lessonClaimsAboutApp.test.ts tests/unit/unansweredSetOnTheRecord.test.ts
echo done > build/u102/docs.exit
