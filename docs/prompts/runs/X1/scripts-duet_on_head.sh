#!/usr/bin/env bash
# Is modes-duet's "a rung whose duet names an exercise" red on the committed code too? HEAD's sources swapped in
# (scripts-swap_head.py), built with vite alone into dist-head (tsc -b would read X1's tests, which name modules
# HEAD does not have), X1's sources restored (sha256 checked), then the one spec run against dist-head on port
# 4373, and dist-head removed. Run from the worktree root.
set -u
root="$(pwd)"
runs="$root/docs/prompts/runs/X1"
backup="${TMPDIR:-/tmp}/x1-head-swap-duet-2"
{
  echo "python docs/prompts/runs/X1/scripts-swap_head.py swap <scratch>/x1-head-swap-duet-2"
  python "$runs/scripts-swap_head.py" swap "$backup"; echo "exit=$?"
  echo "npx vite build --outDir dist-head   (HEAD's sources)"
  (cd "$root/app" && npx vite build --outDir dist-head > "$runs/build-app-head.txt" 2>&1); echo "exit=$?"
  echo "python docs/prompts/runs/X1/scripts-swap_head.py restore <scratch>/x1-head-swap-duet-2"
  python "$runs/scripts-swap_head.py" restore "$backup"; echo "exit=$?"
} > "$runs/duet-on-head-swap-2.txt" 2>&1
{
  echo "npx playwright test --config playwright.x1-4373-head.config.ts --workers=2 --repeat-each=3 tests/e2e/modes-duet.spec.ts   (HEAD's app, dist-head)"
  cp "$runs/scripts-playwright.x1-4373-head.config.ts" "$root/app/playwright.x1-4373-head.config.ts"
  (cd "$root/app" && npx playwright test --config playwright.x1-4373-head.config.ts --workers=2 --repeat-each=3 tests/e2e/modes-duet.spec.ts)
  code=$?
  rm -f "$root/app/playwright.x1-4373-head.config.ts"
  rm -rf "$root/app/dist-head" "$root/app/test-results-x1-head"
  echo "exit=$code"
} > "$runs/e2e-duet-head-app-x3.txt" 2>&1
tail -n 4 "$runs/duet-on-head-swap-2.txt"
tail -n 4 "$runs/e2e-duet-head-app-x3.txt"
