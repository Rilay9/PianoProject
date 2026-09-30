#!/usr/bin/env bash
# CL01 mutants: each applied alone, the CL01 rows run, the lesson restored and compared.
W="$(cd "$(dirname "$0")/../../../.." && pwd)"  # kept in docs/prompts/runs/CL01; it ran from build/CL01 (../..)
OUT="$W/build/CL01/mutants"
mkdir -p "$OUT"
cp "$W/content/lessons/improv.3.md" "$OUT/improv.3.md.kept"
cp "$W/content/lessons/ragtime.9.md" "$OUT/ragtime.9.md.kept"
for m in M1 M1b M2 M2b; do
  log="$OUT/mutant-$m.txt"
  {
    echo "\$ python build/CL01/mutate.py $m"
    python "$W/docs/prompts/runs/CL01/scripts-mutate.py" "$m"
    echo "\$ npx vitest run tests/unit/lessonClaimsAboutMusic.test.ts -t CL01"
    (cd "$W/app" && npx vitest run tests/unit/lessonClaimsAboutMusic.test.ts -t CL01 2>&1)
    echo "exit=$?"
  } > "$log" 2>&1
  cp "$OUT/improv.3.md.kept" "$W/content/lessons/improv.3.md"
  cp "$OUT/ragtime.9.md.kept" "$W/content/lessons/ragtime.9.md"
  cmp "$OUT/improv.3.md.kept" "$W/content/lessons/improv.3.md" && cmp "$OUT/ragtime.9.md.kept" "$W/content/lessons/ragtime.9.md" && echo "$m restored" >> "$log"
  echo "$m: $(grep -c 'AssertionError' "$log") assertion failures; $(grep -E '^ +Tests ' "$log"); $(tail -2 "$log" | tr '\n' ' ')"
done
