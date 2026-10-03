# Reviewer handoff — E0a, taught by this rung from the ancestry (closes E0 on ACCEPT)

Implementation HEAD: 5bfe6d2 (E0a's commit on its worktree branch, merged into the branch; `session.ts` at the predicate and the swap sheet's `reached`, three lines in `TodayScreen.ts`, `claims.py` and `family_contracts.py`, D0's rung check and its record, the promise tests and two diary helpers, docs/02 E2, docs/08, the regenerated report)

## What changed

- **The mechanism:** `rungAncestry` computes, once per curriculum object, the core path in stage-and-unit order and, for a track rung, its `prerequisites` followed back plus the core path up to its stage; `taughtAtRung` reads it. The brief's deviation was taken for the core (prerequisites do not describe the walk: 4.6's never reach 3.4, 4.7 names none, 2.3 misses 2.2, Stage 0 has none) and its premise corrected for the tracks (prerequisites alone give jazz.5 → chords-pop.5 → … → 3.2 and would drop 4.5's syncopation for every learner; the app opens a track rung only once the core has reached its stage, `strandsOf`). The learner's reached rungs, already held by the session, are the second reading; Today hands them to the swap sheet.
- **The fault was wider than the finding:** 143 (rung, demand) readings move from taught to untaught, all off the core path — blues.3, hymns, jazz.3 and chords-pop.3 were credited with 3.4's ledger lines and 3.6's moving left hand; every Stage 4 track rung with 4.5's syncopation, triplets and compound time; practice.1–5 with 1.1–1.5. On the shipped catalogue the swap sheets at jazz.5 and jazz.6 do not change (no option there carries a measured walking bass); latin's sheet no longer offers the generated walking bass over ii–V–I to a learner who never reached blues.5.
- **None of the three learners' 90 mornings changed** — cards and sheets byte-identical — because all three walk the core, where the ancestry and the file order agree.
- **The build made path-correct the same way** (`claims.py`: `rung_ancestry`, `first_listings` — an option is read at every rung nothing earlier on that rung's path lists it — and `untaught_on`); D0's rung check reads the same functions and its record moves 71 → 129; the report's notated options with an untaught demand 206 → 253 (syncopation 47 → 102, triplets 5 → 24, ledger lines 18 → 32); the claim counts unchanged.
- **One promise now breaks, named and not settled (L108, P1):** reading row 7 at jazz.8 and theory.9 promises a walking bass (theory.9's lesson says "triplets and a walking bass") that neither path teaches — `demands.json` names blues.5 alone — so the generator now leaves it out of every row-7 phrase there (200 of 200 seeds), and the promise tests assert the absence under `PROMISED_OFF_THE_PATH` so the test goes red if the vocabulary later teaches it there. jazz.6's lesson teaches a walking line the vocabulary does not credit. The builder did not change the vocabulary (the brief's item 3 decided jazz.6 does not teach it).
- Outside the brief's list, each with its reason: `TodayScreen.ts` (the reached set); `family_contracts.py`, `test_measured_demands.py` and the fixture (one reading of "untaught" for the build and D0's check; the old flat `untaught_on` deleted, D0's test its only reader); `sightReadingPromises.test.ts` and `helpers/promises.ts` (they encoded file order at track rungs and went red on row 7).

## As a learner meets it

the swap sheet of latin's syncopated-rhythm row, for a learner placed at latin with no path through blues.5, offers the lesson's own items under "From the same lesson" (shuffle eighths, comping on the off-beats, ties across the bar line, the two son claves, the tumbao, the montuno) and no walking bass over ii–V–I, which the file's order used to put there; nothing on the sheet is wrong for the lesson, and the Today card at latin is the lesson's own rows. Nothing heard.

## Files to inspect, in order

1. `docs/prompts/entry-93.md` — the judgement, the mechanism with the corrected premise, the 143 moves (`taught-moves.txt`), the diaries compared, the report compared, the red lines, exit codes, unverified.
2. `docs/prompts/runs/E0a/` — `red-taught-by-ancestry.txt` (nine of thirteen red on the committed predicate, with the messages naming the demand, the rung and the lesson the file order had credited), `red-claims-committed.txt`, `red-d0-rung-check-old-record.txt`, `red-sight-reading-promises.txt`, `report-compared.txt`, `probe-compared.txt`, the runs, and the orchestrator's chain.
3. `app/src/curriculum/session.ts` — `rungAncestry`, `taughtAtRung`, `swapOptions`'s `reached`; `app/tests/unit/taughtByAncestry.test.ts` (14 cases: the two-track curriculum, the shipped walking bass, ledger lines at blues.3, 2.5's shift at 3.1 not 2.2, the reordered file, the build's ancestry equal to the app's, the swap sheet and warm-up on B.6 with and without the path).
4. `tools/content/claims.py`; `tools/content/tests/fixtures/untaught_on_rung.json` (129); `docs/prompts/rung-claims.md` (regenerated; every rung's ancestry in the JSON).
5. `app/tests/unit/sightReadingPromises.test.ts` (`PROMISED_OFF_THE_PATH`).

## Verification

- The builder in its worktree, unpiped: npm ci 0; parity reference 0; the content build on the committed tree 0 (reports identical) and on E0a's 0; tsc 0; lint 0; the three named unit files 39 passed; full vitest 1 with the two CRLF reds and the row-7 promise E0a itself caused (revised, then 51 passed); the helper's callers 91 passed; the content suite 1 with one transient `test_bar_splits` error (a `FileNotFoundError` in its temp folder; 11 of 11 alone; Kern conversion, not this change — the cause unchecked); app build 0; the Today spec 16 passed; the three diaries byte-identical ×3.
- The orchestrator on the merged checkout, targeted by what the seam touches: tsc 0, the six unit files and the two gate consumer suites 114 passed and one red that reads a build artefact — `taughtByAncestry` › *the build reads the same ancestry*, which opens `build/rung-claims.json`, written on this checkout by E0's build before E0a's `claims.py` (`expected undefined to be defined`); green in the builder's tree after its build, and CI builds before it tests (Q52 records that the message names no step) (exit 1), app build 0, latin's sheet rendered (0). No content build on the orchestrator's side: CI runs the build and the content suites on this tree, and the builder ran both twice.
- Unverified: the evidence job for recipes with moves (inferred from the 200-of-200 hold on row 7's own recipe); jazz.6's lesson read only at its title and the lines naming the walking bass; nothing heard.

## Follow-ups recorded, not fixed here

- **L108 (P1):** the walking bass on the jazz track (question 1).
- **L109 (P1/P2):** the remaining file-order readers (the swap sheet's last resort, the placement's "behind", `anchorFor`) and the curriculum data whose prerequisites do not describe the walk.
- L101 and L103 extended with the path-correct counts.

## Questions for the reviewer

1. **Is the walking bass taught on the jazz track?** jazz.6's lesson teaches a walking line; `taughtAt` names blues.5 alone and holds one rung. If yes, `taughtAt` becomes a list (schema, validator, app type, every reader) and row 7's walking bass returns at jazz.8; theory.9 would still promise what its path never teaches, which is F's sentence or the row's placement. The orchestrator's read: the lesson is the promise the learner reads, so either the vocabulary credits jazz.6 or the lesson's sentence goes — never a phrase that silently drops what its lesson says.
2. Does this close E0?

## Do not re-review

E0's implementation (`responses/f3b75b7.md`); D0, D0a; the D1 and D2 briefs (`7ab175a.md`); every closed seam. D1 and D2 get their own handoffs when they land.
