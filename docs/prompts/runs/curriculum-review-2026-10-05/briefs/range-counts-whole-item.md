# Brief: a ranged or looped run never satisfies an item-level `runs` requirement (RG1; FABLE §6; 2026-10-06)

**What governs:** `docs/prompts/FABLE.md` §6 (a looped section never certifies the target ability) and the outside reviewer's ruling in `docs/review/responses/6e7475c1.md` §5, which is the specification: for an item-level `runs` requirement (one with `items`), a score row with a `range` (a loop or a section) does not count as a run of the whole named item; an unranged row does (storage defines `range === undefined` as the whole item). Partial-range observations and their evidence are preserved; they simply cannot satisfy the whole-item requirement. This is an evidence-honesty fix for every rung whose requirement names a piece or an excerpt, not a Bizet-specific exception.

**Why this and not something else.** Today `rungState.ts` counts a qualifying row by item id and standard alone and never reads `row.range`, so a looped lap of four bars that meets the pass pair completes a rung whose model is the whole cut. Alternatives: the lesson text saying "the counted run is the whole item" (rejected as the fix: the app would still award the credit); a new hands-and-range-aware evidence model (rejected: machinery, FABLE §10). What would reverse it: a stored row shape where `range` means something other than a partial range, in which case the builder stops and reports the shape.

**Finish condition:** the five tests the reviewer names pass, red first on the unchanged code where the case can be red: an unranged full run counts; a qualifying partial loop does not; a partial loop plus a later full run counts once; the left-hand excerpt counts when played unranged, because the excerpt file is itself the complete required item; unrelated drill requirements keep their current behaviour. `npx tsc -b` and `npx vitest run` green on the changed files; the full unit suite once.

## Files owned

- `app/src/curriculum/rungState.ts`: the `items` filter (near line 250) and `meetsStandard`, or the smallest place where a qualifying row is counted; read `row.range` there.
- `app/tests/unit/rungStateFromEvidence.test.ts` (or the unit file that already covers an `items` runs requirement; find it with `grep -rn "items" app/tests/unit/rungState*.test.ts`): the five cases, as named.
- `docs/05-*.md` where the evidence rules are documented, one sentence with the reason; `docs/08-test-map.md`: the rung-state row, the five cases named.

## Boundaries

Harness: `operating-procedure.md` §14. No Playwright; no content build. No change to storage, to the Score screen, to drill requirements or to any other requirement kind. No commit, push, stash, checkout or reset; never name an AI model. Stop conditions: `range` is not the field that marks a partial run in stored rows (report the shape); the `items` filter is not where counting happens (report where it is and stop before a wider change).

Reply in at most eight lines: the line where the count changed; the five test results verbatim where red; the full unit suite's totals; a draft record entry (where, what, before, after, why) for the orchestrator to number; anything not done, by name.
