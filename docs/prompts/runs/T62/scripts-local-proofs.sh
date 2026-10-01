#!/usr/bin/env bash
# T62 local proof: what the real playwright.config.ts resolves to under each environment, read
# through Playwright's own loader (`--list`: no browser, no web server, no port). The HEAD file's
# config is read the same way from a copy beside the real one.
set -u
cd "$(dirname "$0")/../../app"
OUT=../build/t62/config-proof.txt
: > "$OUT"
probe() {
  local label="$1" config="$2"; shift 2
  local line
  line=$(env "$@" npx playwright test -c "$config" --list --add-reporter=./build/t62/print-config.mjs 2>&1 >/dev/null | grep '^PRINT-CONFIG' | sed 's/^PRINT-CONFIG //')
  echo "$label | $line" | tee -a "$OUT"
}
cp ../build/t62/old/playwright.config.ts ./playwright.head-t62.config.ts
for config in playwright.config.ts playwright.head-t62.config.ts; do
  probe "$config CI unset, flag unset" "$config" -u CI -u PIANOPATH_PREBUILT_DIST
  probe "$config CI unset, flag 1    " "$config" -u CI PIANOPATH_PREBUILT_DIST=1
  probe "$config CI 1,     flag unset" "$config" -u PIANOPATH_PREBUILT_DIST CI=1
  probe "$config CI 1,     flag 1    " "$config" CI=1 PIANOPATH_PREBUILT_DIST=1
  probe "$config CI 1,     flag true " "$config" CI=1 PIANOPATH_PREBUILT_DIST=true
done
rm -f ./playwright.head-t62.config.ts
rm -rf ./blob-report
echo done
#!/usr/bin/env bash
# T62 local proof: three real browser shards of a small slice of the default suite, on port 4262,
# serving the prebuilt app/dist (CI=1, PIANOPATH_PREBUILT_DIST=1), each writing its own blob report;
# then the coverage check against the unsharded listing of the same slice, and a mis-sharded pair.
set -u
cd "$(dirname "$0")/../../app"
CFG=build/t62/playwright.t62.config.ts
OUT=../build/t62/real-out
SLICE="app-shell.spec.ts bisect-render.spec.ts content-render.spec.ts"
rm -rf "$OUT"
mkdir -p "$OUT"
PLAYWRIGHT_JSON_OUTPUT_FILE="$PWD/$OUT/list.json" CI=1 npx playwright test -c "$CFG" $SLICE --list --reporter=json > /dev/null 2> "$OUT/list.err"
echo "list exit $?"
for i in 1 2 3; do
  DEBUG=pw:webserver PLAYWRIGHT_BLOB_OUTPUT_DIR="$PWD/$OUT/good/blob-$i" CI=1 PIANOPATH_PREBUILT_DIST=1 \
    npx playwright test -c "$CFG" $SLICE --shard="$i/3" --workers=2 --output="$PWD/$OUT/test-results-$i" > "$OUT/shard-$i.log" 2>&1
  echo "shard $i/3 exit $?"
done
PLAYWRIGHT_BLOB_OUTPUT_DIR="$PWD/$OUT/bad/blob-a" CI=1 PIANOPATH_PREBUILT_DIST=1 \
  npx playwright test -c "$CFG" $SLICE --shard=1/2 --workers=2 > "$OUT/bad-a.log" 2>&1
echo "bad 1/2 exit $?"
PLAYWRIGHT_BLOB_OUTPUT_DIR="$PWD/$OUT/bad/blob-b" CI=1 PIANOPATH_PREBUILT_DIST=1 \
  npx playwright test -c "$CFG" $SLICE --shard=3/3 --workers=2 > "$OUT/bad-b.log" 2>&1
echo "bad 3/3 exit $?"
find "$OUT" -name "*.zip" | sort
#!/usr/bin/env bash
# T62 local proof: the render check's spec, with the environment render_check.py gives it, run
# once serving the prebuilt app/dist (the flag) and once rebuilding it (no flag), both on port 4262,
# on the first LIMIT catalogue items with the manifest ignored; outputs to scratch paths only.
set -u
cd "$(dirname "$0")/../../app"
LIMIT=${LIMIT:-40}
OUT="$PWD/../build/t62/render"
rm -rf "$OUT"
mkdir -p "$OUT"
for mode in prebuilt rebuilt; do
  if [ "$mode" = prebuilt ]; then flag=1; else flag=0; fi
  env CI=1 PIANOPATH_PREBUILT_DIST=$flag DEBUG=pw:webserver \
    CONTENT_RENDER_CHECK=1 CONTENT_DIR="$PWD/public/content" \
    CONTENT_RENDER_REPORT="$OUT/$mode/render-report.json" CONTENT_PREVIEW_DIR="$OUT/$mode/previews" \
    CONTENT_RENDER_MANIFEST="$OUT/$mode/render-manifest.json" CONTENT_RENDER_LIMIT="$LIMIT" CONTENT_RENDER_FULL=1 \
    npx playwright test -c build/t62/playwright.t62.config.ts content-render.spec.ts --reporter=list --workers=1 \
    --output="$OUT/$mode/test-results" > "$OUT/$mode.log" 2>&1
  echo "$mode exit $?"
  grep "Starting WebServer" "$OUT/$mode.log"
done
#!/usr/bin/env bash
# T62 local proof: with the prebuilt flag set and no app/dist, the web server fails loudly rather
# than rebuilding (the worktree's own dist is moved aside and put back).
set -u
cd "$(dirname "$0")/../../app"
mv dist ../build/t62/dist-aside
CI=1 PIANOPATH_PREBUILT_DIST=1 npx playwright test -c build/t62/playwright.t62.config.ts app-shell.spec.ts --workers=1 --reporter=list > ../build/t62/missing-dist.log 2>&1
echo "exit $?"
mv ../build/t62/dist-aside dist
ls dist/index.html
grep -v "^\s*$" ../build/t62/missing-dist.log | head -20
#!/usr/bin/env bash
# T62 scratch: the browserless suite, listed unsharded and run as 3 shards (plus a deliberately
# mis-sharded pair), each shard's blob in its own directory.
set -u
cd "$(dirname "$0")/../../app"
CFG=build/t62/fake/playwright.config.ts
OUT=../build/t62/fake-out
rm -rf "$OUT"
mkdir -p "$OUT"
CI=1 npx playwright test -c "$CFG" --list --reporter=json > "$OUT/list.json" 2> "$OUT/list.err"
echo "list exit $?"
for i in 1 2 3; do
  PLAYWRIGHT_BLOB_OUTPUT_DIR="$OUT/good/blob-$i" CI=1 npx playwright test -c "$CFG" --shard="$i/3" > "$OUT/shard-$i.log" 2>&1
  echo "shard $i/3 exit $?"
done
# Mis-sharded: shard 1 of 2 and shard 2 of 3 (overlapping slices, and shard 3 of 3 never run).
PLAYWRIGHT_BLOB_OUTPUT_DIR="$OUT/bad/blob-a" CI=1 npx playwright test -c "$CFG" --shard=1/2 > "$OUT/bad-a.log" 2>&1
echo "bad a exit $?"
PLAYWRIGHT_BLOB_OUTPUT_DIR="$OUT/bad/blob-b" CI=1 npx playwright test -c "$CFG" --shard=2/3 > "$OUT/bad-b.log" 2>&1
echo "bad b exit $?"
find "$OUT" -name "*.zip" | sort
