#!/usr/bin/env bash
# U118a: run the given specs on port 5341 from the config copy; log to build/u118a-<label>.log.
# usage: run-spec.sh <label> <spec...>   (WORKERS env sets workers, default 4)
set -u
W="<worktree>"
label="$1"; shift
cd "$W/app" || exit 2
U118A_WORKERS="${WORKERS:-4}" npx playwright test -c build/u118a/playwright.u118a-5341.config.ts "$@" > "$W/build/u118a-$label.log" 2>&1
code=$?
echo "$label playwright exit $code"
echo "$label playwright exit $code" >> "$W/build/u118a-$label.log"
exit $code
