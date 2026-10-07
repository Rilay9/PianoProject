### Entry (draft) — SR3: a held run credits no requirement of the rung that judged it; the daily card shows the held level

**What a learner meets.**
- **At 1.1 and 1.2:** the daily read is still the steps-only phrase held to the learner's taught set and judged by 1.5 (SR2). Its runs now meet none of 1.5's requirements, then or once the learner reaches 1.5. Five clean held reads used to meet 1.5's reads (5/5), its interval-reading "familiar" and one of its two exercise runs; they now leave 1.5 *not started*.
- **The evidence stays the learner's:** the Skills screen's ladders and every other rung's `skill` requirements read it as before.
- **At 1.5:** an unheld read counts as it always did.
- **The card:** says `L1.1` (at 1.2, `L1.2`) over the held phrase, not `L1.5`.

No picture was taken; the browser case asserts the text. Nothing heard; unverified as music. Scoreboard 0/28.

**What changed, where / what / before / after / why.** Why, throughout: the reviewer's ruling on SR2 (`responses/sr2-landing.md` §2-§3; Entry 258 OPEN 1 and 2).
- **`app/src/evidence/rungState.ts`: the one place the credit rule lives.**
  - What: `rungState` takes an optional sixth argument, `heldBelowItsRung(row)`. A run it names is kept out of its judging rung's pool (`runs`, `reads`, `done`, `measure`), and that rung's `skill` requirements read every evidence record but those runs' (`evidenceApart`).
  - Before: every run with a `lessonId` was pooled for its judging rung.
  - After: with no predicate, nothing changes. The module note gains the rule.
- **`app/src/curriculum/session.ts`: `heldBelowItsRung(curriculum, items, vocabulary)`, new, beside `writtenOptions`; the offer logic is untouched.**
  - What: a run is held when its stored options (`material`) cannot write a reading demand that `phraseOptions(…, { judging })` writes for the same row, recipe and seed. This is SR2's step-3 comparison, read for credit.
  - A run with no stored phrase, no `lessonId`, or a row the catalogue lacks is not held.
  - A phrase that asks more than the judging rung's, and nothing less, is not held.
- **Outside the brief's owned files, with the reason:** `app/src/data/rungStates.ts` (`loadRungStates` loads `allItems()` and passes the predicate) and `app/src/ui/screens/SkillsScreen.ts` (passes it over the items it loads).
  - Why: the brief's premise was that the stored material carries the hold's rung. It does not: the route carries the rung, and the material carries only its effect (the held options).
  - Reading that effect needs the catalogue row and the reader's writer. `evidenceByDemand.test.ts` bans both from every `src/evidence/` file (C4a).
  - So the fact is made outside `evidence/` and handed in by both source callers. No stored field and no `DB_VERSION` change.
- **`app/src/ui/screens/TodayScreen.ts`: `dailyLevelLabel`.**
  - Before: the meta line always printed the row's level.
  - After: the hold's level while the offer carries a hold; the row's level otherwise. A non-level-shaped (track) hold says no level.
- **Tests.**
  - New: `app/tests/unit/heldRunsCreditNoRung.test.ts`:
    - the premise;
    - the five cases through Today's offer, `phraseOptions`, the engine and `rungState`;
    - every sight-reading row at every rung listing it, seeds 1-5 (75 runs): not held;
    - every source caller of `rungState` passes the predicate.
  - Revised: `app/tests/e2e/doors.spec.ts` (SR2's 1.1 case asserts `L1.1` and not `L1.5`).
- **Docs:** `docs/08-test-map.md` (SR2's row extended; one file line); `docs/prompts/runs/SR3/README.md`.

**Checks (in the lane).**
- `tsc -b --noEmit` 0; lint 0.
- The new file: 17 of 17.
- Red first:
  - case 1: `expected [ [ 'runs', false, 1 ], …(2) ] to deeply equal [ [ 'runs', false, +0 ], …(2) ]`;
  - case 2: `expected [] to deeply equal [ '1.5' ]`;
  - case 4: `have: 9, holds: true` received for `{ holds: false, have: 4, need: 5 }`;
  - case 5: `expected 'L1.5' to be 'L1.1'`;
  - the caller check: `data\rungStates.ts … to match /heldBelowItsRung\(/`;
  - case 3 is preserving and was green on the base.
- The browser case on port 4197, `--workers=2`: red `Expected substring: "L1.1"  Received string: "Start a run · L1.5 · 4 bars"`, then 1 passed.
- The differential: every `rungState` call in `rungStateFromEvidence`, `firstThirtyDays` and `firstThirtyDaysOnTheLadder` (169 calls, 12,646 rung comparisons) was made with and without the predicate, and nothing moved.
  - This is unchanged by construction: no fixture row carries generator `material`.
  - The non-vacuous checks are the 75-run sweep and case 2 (on the held learner, only 1.5 moves).
- SR2's research differential was not re-run (no generation change).
- The whole unit suite: 7,997 passed, 4 failed (8,003; 1 skipped, 1 todo). The four reds:
  - `lessonClaimsAboutApp` blues.3, the known CRLF-only red;
  - `taughtByAncestry` (no `build/rung-claims.json` in the worktree) and `midiParity` (no `build/midi-parity` reference), both harness inputs absent: green with the main checkout's two files copied in for the re-run, then removed;
  - `simonTurnCue` (a timing case): green alone.
- The browser case ran before the unit suite. No source changed after it.

**Open.**
- **Legacy drift:** a run written at its judging rung before a demand was taught earlier would now read as held. None is known, and no real store was read.
- **The rule applied literally:** a held run is set apart only from its judging rung's `skill` requirements. Only 1.5 asks for interval-reading, so no other rung reads it today.
- **SR2's step 3 duplicates the comparison:** it writes `heldBelowItsRung`'s comparison inline (`readingOffer`, offer logic, not touched). Recorded, not unified.
