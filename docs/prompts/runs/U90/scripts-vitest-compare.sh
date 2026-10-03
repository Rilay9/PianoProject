#!/usr/bin/env bash
# U90's classification of the unit suite's failures: the files that failed in vitest-all.txt, run once
# with style.css as committed (the fix set aside and put back afterwards) and once with the fix, and the
# failing test names compared. Identical lists mean the failures are not the wrap's.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../../../.." && pwd)"
APP="$ROOT/app"
FILES="tests/unit/curriculumIntegrity.test.ts tests/unit/everyOptionOpens.test.ts tests/unit/firstThirtyDaysOnTheLadder.test.ts tests/unit/legacyStorage.test.ts tests/unit/lessonClaims.test.ts tests/unit/lessonClaimsAboutApp.test.ts tests/unit/lessonClaimsAboutMusic.test.ts tests/unit/materialOnTheRecord.test.ts tests/unit/planNoUnobtainableRungs.test.ts"
cp "$APP/src/style.css" "$HERE/style.css.fixed-copy"
# CRLF, as the checkout writes it (core.autocrlf=true): two lessonClaimsAboutApp assertions read LF only
# (Entry 101), so an LF copy would pass one of them and read as a difference the wrap made.
(cd "$ROOT" && git show HEAD:app/src/style.css) | awk '{ printf "%s\r\n", $0 }' > "$APP/src/style.css"
file "$APP/src/style.css"
{ echo "\$ (app/) npx vitest run $FILES   (style.css as committed, CRLF)"; (cd "$APP" && npx vitest run $FILES); echo "exit=$?"; } > "$HERE/vitest-failing-files-committed-css.txt" 2>&1
cp "$HERE/style.css.fixed-copy" "$APP/src/style.css" && rm "$HERE/style.css.fixed-copy"
file "$APP/src/style.css"
{ echo "\$ (app/) npx vitest run $FILES   (style.css with the wrap rule, CRLF)"; (cd "$APP" && npx vitest run $FILES); echo "exit=$?"; } > "$HERE/vitest-failing-files-fixed-css.txt" 2>&1
grep -o "FAIL  tests/unit/.*" "$HERE/vitest-failing-files-committed-css.txt" | sort -u > "$HERE/vitest-failing-names-committed-css.txt"
grep -o "FAIL  tests/unit/.*" "$HERE/vitest-failing-files-fixed-css.txt" | sort -u > "$HERE/vitest-failing-names-fixed-css.txt"
grep -o "FAIL  tests/unit/.*" "$HERE/vitest-all.txt" | sort -u > "$HERE/vitest-failing-names-all.txt"
echo "committed css: $(wc -l < "$HERE/vitest-failing-names-committed-css.txt") failing names; fixed css: $(wc -l < "$HERE/vitest-failing-names-fixed-css.txt"); whole suite: $(wc -l < "$HERE/vitest-failing-names-all.txt")"
if diff -q "$HERE/vitest-failing-names-committed-css.txt" "$HERE/vitest-failing-names-fixed-css.txt" > /dev/null; then echo "committed and fixed: identical failing names"; else echo "committed and fixed DIFFER"; diff "$HERE/vitest-failing-names-committed-css.txt" "$HERE/vitest-failing-names-fixed-css.txt"; fi
if diff -q "$HERE/vitest-failing-names-all.txt" "$HERE/vitest-failing-names-fixed-css.txt" > /dev/null; then echo "whole suite and the files alone: identical failing names"; else echo "whole suite and the files alone DIFFER"; diff "$HERE/vitest-failing-names-all.txt" "$HERE/vitest-failing-names-fixed-css.txt"; fi
tail -n 4 "$HERE/vitest-failing-files-committed-css.txt" "$HERE/vitest-failing-files-fixed-css.txt"
