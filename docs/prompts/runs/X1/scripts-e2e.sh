#!/usr/bin/env bash
# X1's browser runs: port 4373 through app/playwright.x1-4373.config.ts (a copy of app/playwright.config.ts with
# the port and output folder changed, kept here as scripts-playwright.x1-4373.config.ts and copied into app/ only
# for the run, since eslint refuses a config outside the project), two workers at most, and every spec named
# checked to exist before the step (a path that resolves to no file is dropped silently by Playwright).
# Usage (from the worktree root): bash docs/prompts/runs/X1/scripts-e2e.sh <log-name> <spec> [<spec>...]
set -u
root="$(pwd)"
log="$root/docs/prompts/runs/X1/$1.txt"
shift
{
  echo "specs-exist check: $*"
  missing=0
  for spec in "$@"; do
    if [ -f "app/$spec" ]; then echo "  exists: $spec"; else echo "  MISSING: $spec"; missing=1; fi
  done
  if [ "$missing" -ne 0 ]; then echo "exit=2"; exit 2; fi
  cp "$root/docs/prompts/runs/X1/scripts-playwright.x1-4373.config.ts" "$root/app/playwright.x1-4373.config.ts"
  echo "npx playwright test --config playwright.x1-4373.config.ts --workers=2 $*"
  (cd "$root/app" && npx playwright test --config playwright.x1-4373.config.ts --workers=2 "$@")
  code=$?
  rm -f "$root/app/playwright.x1-4373.config.ts"
  echo "exit=$code"
} > "$log" 2>&1
tail -4 "$log"
