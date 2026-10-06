# SR3: a held run credits no requirement of the rung that judged it; the card shows the held level

- **Brief:** `docs/prompts/runs/curriculum-review-2026-10-05/briefs/sr3-held-runs-credit-and-label.md`.
- **Ruling:** `docs/review/responses/sr2-landing.md` §2 and §3.
- **Base:** origin's head `3b4f74bc`.

Nothing heard; unverified as music.

## What a learner meets

- **At 1.1 and 1.2:** the daily read is still held to the learner's taught set and judged by 1.5 (SR2). Its runs now meet none of 1.5's requirements, then or after the learner reaches 1.5. Rung 1.5 stays *not started* until the learner reads there.
- **Their skill evidence stays the learner's:** the Skills screen's ladders read it as before, and so does every other rung's `skill` requirement. Only 1.5's own requirements, including its interval-reading "familiar", set those runs apart.
- **At 1.5:** an unheld 1.5 read counts exactly as it did before.
- **The card:** at 1.1 the daily card says `L1.1`, not `L1.5`; at 1.2 it says `L1.2`. With no hold it shows the row's own level, as before.

## The brief's premise, found wrong

The brief assumed that a run's stored material "carries a hold whose rung" can be read. It does not.

- The hold's rung is never stored. The route carries it (`?hold=`), and `heldDailyRunRoundTrip.test.ts` says so.
- What the material stores is the hold's *effect*: the held options (`material.recipe`, D4).
- A run is held below its judging rung exactly when those options cannot write a reading demand that the judging rung's phrase of the same row, recipe and seed can. This is the comparison SR2's step 3 already makes (`readingOffer`).
- That comparison needs the catalogue row (its generator params) and the reader's writer (`phraseOptions`). The evidence modules may import neither: `evidenceByDemand.test.ts` bans `curriculum/session`, `readingControls` and the generator from every file in `src/evidence/`, `rungState.ts` included (C4a).

So no new stored field and no `DB_VERSION` change is needed (the stop does not fire). The fact must be made outside `evidence/` and handed in.

## Where the rule lives, and the alternative not taken

- **The credit rule:** `rungState` (`app/src/evidence/rungState.ts`), the one place that decides whether a stored run meets a rung requirement.
  - A run the caller names as held is kept out of its judging rung's pool. That pool is `judgedBy`, which feeds `runs`, `reads`, `done` and `measure`.
  - The judging rung's `skill` requirements read every evidence record except those runs' (`evidenceApart`).
  - The new optional sixth argument is `heldBelowItsRung(row)`. With no predicate, no run is held.
- **The held fact:** `session.heldBelowItsRung(curriculum, items, vocabulary)` (`app/src/curriculum/session.ts`, beside `writtenOptions`).
  - It returns the predicate. A run is held when its stored options cannot write a demand that `phraseOptions(…, { judging })` can.
  - A run with no stored phrase, no `lessonId`, or a row the catalogue no longer has is not held.
- **Wiring:** `data/rungStates.loadRungStates` loads `allItems()` and passes the predicate. The Skills screen passes it over the items it already loads. These are the only two source callers. A test asserts that each caller passes it.
- **Alternative not taken (where):** computing the comparison inside `rungState` with the catalogue handed in. This was refused because `rungState` would have to import the reader and the controls, which the C4a boundary test forbids. The module would then know how a phrase is written.
- **Alternative not taken (what):** refusing any difference in either direction (a stored phrase that asks *more* than the judging rung's). This was refused for two reasons:
  - a phrase made harder by its options was not made easier by a hold, and the ruling's reason is "the material boundary that made the observation easier/narrower";
  - a run written before a demand was held back later would lose its credit after the fact, which is a broader rewrite the ruling refuses.
  - Unreachable in the app today: the only hold is the learner's rung before 1.3, an ancestor of 1.5.

## The five cases (`app/tests/unit/heldRunsCreditNoRung.test.ts`), red first

The red run was made on this lane's code before `rungState` read the predicate, which is the base's rule. The label case was red with `dailyLevelLabel` returning the row's level, which is the base's label.

1. **Five 1.1-held daily runs meet no 1.5 requirement.**
   - Red: `expected [ [ 'runs', false, 1 ], …(2) ] to deeply equal [ [ 'runs', false, +0 ], …(2) ]` (the premise without the rule: runs 1 of 2, reads 5 of 5 held, interval-reading held).
   - Green: runs 0/2, reads 0/5, skill 0; 1.5 *not started*; 1.1 reads nothing of them.
2. **Their legitimate skill evidence remains.**
   - The stored evidence is unchanged. `skillLadders` reads interval-reading at "familiar" or above.
   - Every rung but 1.5 has the same state with the rule as without it.
   - Red: `expected [] to deeply equal [ '1.5' ]` (nothing moved without the rule).
3. **After the learner reaches 1.5, a genuine unheld read counts normally.**
   - The 1.5 offer carries no hold, and its runs are not held.
   - One read gives reads 1/5 and runs 1/2, the same as without the rule. Five reads meet `reads` 5/5.
   - This case is preserving, not new: it was green on the base.
4. **Old held rows never become retroactive 1.5 credit.**
   - Red: `expected { requirement: { …(5) }, …(4) } to match object { holds: false, have: 4, need: 5 }`, with `have: 9, holds: true` received.
   - Green: five held runs plus four unheld ones give 4/5. 1.5's outcome is identical to the four unheld reads alone, and with all five it is identical to the unheld reads alone.
5. **The card says the held level while held, and the row's level when unheld.**
   - Unit red: `expected 'L1.5' to be 'L1.1'`.
   - Browser (`doors.spec.ts`, SR2's 1.1 case; port 4197, `--workers=2`) red: `Expected substring: "L1.1"  Received string: "Start a run · L1.5 · 4 bars"`; then 1 passed.

The predicate is also swept over every sight-reading row at every rung that lists it, seeds 1-5 (9 rows, 15 row-rung pairs, 75 runs). None is held. The 1.1 and 1.2 holds judged by 1.5 are held, and a run with no material or no judging rung is not.

## The differential (finish item 4)

Every `rungState` call in three fixture files was made twice: once as the fixture makes it, and once with `heldBelowItsRung` over the built catalogue. Every rung's status and requirement readings were then compared. The wrapper was temporary and has been deleted.

| fixture file | calls | max rows | rows with generator material | max judged rows | held rows | rung comparisons | moved |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `rungStateFromEvidence.test.ts` | 55 | 4 | 0 | 4 | 0 | 106 | none |
| `firstThirtyDays.test.ts` | 50 | 29 | 0 | 0 | 0 | 5,500 | none |
| `firstThirtyDaysOnTheLadder.test.ts` | 64 | 119 | 0 | 103 | 0 | 7,040 | none |

**The differential is unchanged by construction.** No fixture row carries a generator `material`, and `firstThirtyDays`' rows name no judging rung, so the predicate is false on every one.

The non-vacuous checks are therefore:
- the 75-run sweep above;
- case 2's comparison: on the held learner, only 1.5 moves.

SR2's research differential was not re-run, because no generation changed.

## Checks

- `tsc -b --noEmit` 0; lint 0 on the touched files.
- The new unit file: 17 of 17.
- The whole unit suite: 7,997 passed, 4 failed. The four reds:
  - `lessonClaimsAboutApp` blues.3, the known CRLF-only red;
  - `taughtByAncestry` and `midiParity`, whose `build/` inputs are absent from the worktree: green with the main checkout's files copied in, then removed;
  - `simonTurnCue`, a timing case: green alone.
- The `doors.spec.ts` case on port 4197, `--workers=2`: red, then green. No source changed after it.

## Open, recorded, not fixed

- **Legacy drift:** a stored run whose phrase was written at its judging rung before a demand was taught *earlier* would now read as held below that rung, and lose its credit. No such change is known. No fixture holds such a row, and no real learner's store was read.
- **The ruling's scope, applied literally:** a held run is set apart from its judging rung's `skill` requirements only. Another rung's `skill` requirement naming the same skill would still read it. Today only 1.5 asks for interval-reading, so the question does not arise in the shipped curriculum.
- **A track-rung hold:** a hold that is not a level-shaped rung id (a track rung's) shows no level on the card rather than the row's. No such hold was observed.
