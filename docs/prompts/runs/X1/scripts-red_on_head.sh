#!/usr/bin/env bash
# X1's red lines on the committed code: HEAD's sources swapped in (scripts-swap_head.py), X1's new and revised
# unit tests run against them, the five diaries written from HEAD's composer, then X1's sources restored (each
# sha256 checked) and the diaries written again from X1's. Run from the worktree root.
set -u
root="$(pwd)"
runs="$root/docs/prompts/runs/X1"
backup="${TMPDIR:-/tmp}/x1-head-swap"
TESTS=(
  tests/unit/sessionRun.test.ts tests/unit/sessionAdaptation.test.ts tests/unit/sessionRecheck.test.ts
  tests/unit/sessionRunNeverEvidence.test.ts tests/unit/todaySessionRun.test.ts tests/unit/sessionTransition.test.ts
  tests/unit/sessionClock.test.ts tests/unit/sessionProtocol.test.ts tests/unit/oneGateBoundary.test.ts
  tests/unit/taughtByAncestry.test.ts tests/unit/lessonPagePicksPassTheAdmission.test.ts tests/unit/todayOpensWithItsRung.test.ts
  tests/unit/fallbackOrder.test.ts tests/unit/sightReadingIsNotAPiece.test.ts tests/unit/parallelStrands.test.ts
)
{
  echo "python docs/prompts/runs/X1/scripts-swap_head.py swap $backup"
  python "$runs/scripts-swap_head.py" swap "$backup"
  echo "exit=$?"
} > "$runs/swap-to-head.txt" 2>&1
{
  echo "npx vitest run ${TESTS[*]}   (on HEAD's sources)"
  (cd "$root/app" && npx vitest run "${TESTS[@]}")
  echo "exit=$?"
} > "$runs/red-vitest-head-source.txt" 2>&1
mkdir -p "$runs/diaries-before" "$runs/diaries-after"
{
  echo "C4C_DIARY=diaries-before C6_DIARY=diaries-before npx vitest run tests/unit/firstThirtyDays.test.ts tests/unit/firstThirtyDaysOnTheLadder.test.ts   (on HEAD's sources)"
  (cd "$root/app" && C4C_DIARY="$runs/diaries-before" C6_DIARY="$runs/diaries-before" npx vitest run tests/unit/firstThirtyDays.test.ts tests/unit/firstThirtyDaysOnTheLadder.test.ts)
  echo "exit=$?"
} > "$runs/diaries-before.txt" 2>&1
{
  echo "python docs/prompts/runs/X1/scripts-swap_head.py restore $backup"
  python "$runs/scripts-swap_head.py" restore "$backup"
  echo "exit=$?"
} > "$runs/restore-from-head.txt" 2>&1
{
  echo "C4C_DIARY=diaries-after C6_DIARY=diaries-after npx vitest run tests/unit/firstThirtyDays.test.ts tests/unit/firstThirtyDaysOnTheLadder.test.ts   (on X1's sources)"
  (cd "$root/app" && C4C_DIARY="$runs/diaries-after" C6_DIARY="$runs/diaries-after" npx vitest run tests/unit/firstThirtyDays.test.ts tests/unit/firstThirtyDaysOnTheLadder.test.ts)
  echo "exit=$?"
} > "$runs/diaries-after.txt" 2>&1
tail -2 "$runs/swap-to-head.txt" "$runs/red-vitest-head-source.txt" "$runs/diaries-before.txt" "$runs/restore-from-head.txt" "$runs/diaries-after.txt"
