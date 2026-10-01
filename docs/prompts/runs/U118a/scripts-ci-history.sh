#!/usr/bin/env bash
# U118a: the score.run.spec lines in the four green CI runs before 43e450a8.
W="<worktree>"
out="$W/build/u118a/ci-history.txt"
echo "# score.run.spec lines in the four green CI runs before 43e450a8 (gh run view <id> --log, filtered)" > "$out"
for r in 36826916701 36821577931 36813922592 36807990772; do
  sha=$(gh run view "$r" --json headSha --jq '.headSha[0:8]')
  echo "== run $r ($sha)" >> "$out"
  gh run view "$r" --log 2>/dev/null | grep -E "score\.run\.spec\.ts:[0-9]+|Running [0-9]+ tests using" | cut -c40-230 >> "$out"
done
wc -l "$out"
