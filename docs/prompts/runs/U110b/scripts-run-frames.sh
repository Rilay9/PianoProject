#!/bin/bash
# run-frames.sh <tag> <dist-or-empty> <targets>: the frames probe on one build, lock-aware, output in build/u110b/frames-<tag>.out
tag="$1"; dist="$2"; targets="$3"
export U110B_PROBES=1
export U110B_TAG="$tag"
export U110B_TARGETS="$targets"
export U110B_SHOTS=build/u110b/shots
if [ -n "$dist" ]; then export U110B_DIST="$dist"; fi
cd "$(dirname "$0")/../.."
bash build/u110b/pw.sh npx playwright test --config build/u110b/playwright.u110b-5473.config.ts u110b-frames > "build/u110b/frames-$tag.out" 2>&1
echo "exit $?" >> "build/u110b/frames-$tag.out"
