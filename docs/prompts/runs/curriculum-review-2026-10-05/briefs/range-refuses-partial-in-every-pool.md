# Brief: a new run with `wholeItem: false` never counts toward any `runs` requirement (RG1a; FABLE §6; 2026-10-06)

**What governs:** `docs/prompts/FABLE.md` §6 and the outside reviewer's required change in `docs/review/responses/bb6289f2.md` §1 (the chat review at 9f20ebfe; read that section whole). Entry 239 (RG1) refuses a run with `wholeItem === false` only for a `runs` requirement with `items`; its own case 6 shows an unnamed `from: songs` pool still counts such a run. That shape is live: 61 rungs in `content/curriculum/stage-*.json` carry an unnamed `from: songs` runs requirement (3.1 among them; counted by the orchestrator on 2026-10-06), so a passing partial loop of any song on them can still complete the rung.

**The fix, as ruled.** For every `runs` requirement, named or unnamed, a **new row with `wholeItem === false`** is refused. `undefined` keeps the accepted compatibility rule (legacy rows, drill and paper rows count as before). No change to the by-step derivation in `ScoreScreen.runHeader` or `db.coversWholeItem`, to excerpt identity, to hands, or to any other requirement kind.

**Finish condition:** the mirror of Entry 239's case 6 in `app/tests/unit/rungStateFromEvidence.test.ts`: an unnamed-song partial loop does not count; an unnamed-song full run does; a legacy unnamed-pool row with no `wholeItem` counts as before; the seven RG1 cases still pass; the case that is red on the unchanged code (the unnamed partial loop) is run red first and said so. `npx tsc -b` and `npx vitest run` on the changed files green; the full unit suite once. `docs/05-score-follow-engine.md` §9a and the `docs/08-test-map.md` row extended by one sentence each with the reason.

## Files owned

`app/src/evidence/rungState.ts` (the `runs` case, where `coveredWholeItem` is applied), `app/tests/unit/rungStateFromEvidence.test.ts`, `docs/05-score-follow-engine.md` §9a, `docs/08-test-map.md` (the RG1 row). Nothing else; the A7c.1 record is the Bizet builder's.

Harness: `operating-procedure.md` §14. No Playwright, no content build; no commit, push, stash, checkout or reset; never name an AI model. Stop condition: the refusal cannot be applied uniformly without touching another requirement kind (report where and stop).

Reply in at most six lines: the line changed; the new cases' results verbatim where red first; the full unit suite's totals; a draft record entry (where, what, before, after, why); anything not done, by name.
