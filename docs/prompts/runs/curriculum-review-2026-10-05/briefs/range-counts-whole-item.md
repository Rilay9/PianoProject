# Brief: a named `runs` requirement counts a run only when it covered the whole required item (RG1; FABLE §6; 2026-10-06)

**What governs:** `docs/prompts/FABLE.md` §6 (a looped section never certifies the target ability) and the outside reviewer's corrected ruling in `docs/review/responses/6e7475c1.md` §5 (the amended version at HEAD; read it whole). The premise, confirmed by the reviewer at 6e7475c1: `RunHeader.range` is the printed measure range the run covered, the whole piece **or** the loop it was confined to; `ScoreScreen.runHeader` writes `range` whenever the engine supplies `judgedUnder`, including ordinary judged runs, so `range` is not a loop flag; `evidence/rungState.ts`'s `runs` requirement checks item, performance and standard and never reads the range. **Do not implement "any row with `range` is partial"**: it would reject ordinary full runs.

**The seam.** At the point where the Score screen has both the active judged range and the item's full source range, record or derive one fact: whether the run covered the whole required item. `rungState` counts a named `runs` requirement (one with `items`) only when that fact is true, with an explicit legacy policy for rows written before the fact existed, never a guess. Keep it narrow: no generic range-policy redesign, no change to excerpt identity, no new musical judgement, no change to drill or other requirement kinds.

**Why this and not something else.** Today a four-bar loop that meets the pass pair completes a rung whose required item is the whole cut. Alternatives: lesson text alone (the app would still award the credit); treating any ranged row as partial (rejected by the premise above); a hands-and-range evidence model (machinery, FABLE §10). What would reverse it: the Score screen not holding the item's full source range where the run header is written, in which case the builder stops and reports where that fact lives.

**Finish condition:** the seven cases below pass, red first on the unchanged code where a case can be red; `npx tsc -b` and `npx vitest run` green on the changed files, and the full unit suite once.

1. a normal full-item run counts;
2. a passing partial loop does not count toward the whole-item requirement;
3. a partial loop and a later full run count once;
4. a loop whose selected range covers the complete item counts (the evidence covers the required item although Loop was used): an explicit policy, stated in the code and the doc;
5. the left-hand Bizet excerpt counts when its entire cut is covered: the cut is the required item, not the parent;
6. unrelated drill and other requirement behaviour is unchanged;
7. legacy rows (no whole-item fact stored) follow a stated compatibility rule, written beside the code and in the doc, and tested.

## Files owned

- `app/src/ui/screens/ScoreScreen.ts` at `runHeader` (or the smallest place that sees both ranges), and the run-header type where the fact is stored if it is stored (`RunHeader`); the storage version is not bumped unless a stored field is added, and then by the repository's existing migration rule, with the reason.
- `app/src/evidence/rungState.ts` (or wherever the named `runs` requirement is counted; the brief's path is the reviewer's); its unit tests (find the file covering an `items` runs requirement with `grep -rln "items" app/tests/unit/rungState*.test.ts app/tests/unit/*vidence*.test.ts`).
- `docs/05-*.md` where evidence rules are documented: the whole-item fact, the full-range-loop policy and the legacy rule, each with its reason; `docs/08-test-map.md`: the row, the seven cases named.

## Boundaries

Harness: `operating-procedure.md` §14. No Playwright, no content build. No commit, push, stash, checkout or reset; never name an AI model. Stop conditions: the item's full source range is not available where the header is written (report where it is and stop before a wider change); a stored-field addition would need more than the existing migration rule.

Reply in at most eight lines: where the fact is derived or stored and the legacy rule; the seven cases' results verbatim where red; the full unit suite's totals; a draft record entry (where, what, before, after, why) for the orchestrator to number; anything not done, by name.
