### Entry 167 — L120d — a leap wholly inside a taught fixed position is coped with by that position's note reading, as a skip is: `interval.leap` carries the two positions `interval.skip` carries (C-position R 60–67, LH-C-position L 48–55), pinned equal in both languages; no line of either predicate changed; `taughtAt` stays 2.1, `copedWithBy` interval reading, the detector the same; the three *Jingle Bells* options stop being refused at 1.2 and on `holiday`; both *When the Saints* options keep their syncopation; the table 218 → 215 options, 453 → 448 pairs; the app's probe 219 → 216; the reviewer's Question 2 recorded, not built (2026-09-30)

Base: origin's head **b93162ae**, which carries L120c (Entry 156, merged afdac758) and L120b (merged 4ccb7927). Worktree only, nothing committed.

**Judgement.** Nothing was looked at on a screen and nothing was heard. Every musical reading here is from the notation (the authored ABC sources and the built catalogue's rows), the lessons' text and the build's facts, and is **unverified as music**. The pedagogical verdict is the reviewer's ruling (`responses/c8680b70.md`, Question 1), unverified as pedagogy beyond it.

- **What a learner now meets differently** (the app's probe: every rung's own options asked of the one gate, the learner the session builds at the rung). Three options the gate stops refusing, each refused before for `interval.leap` alone:
  - **1.2, *Jingle Bells (chorus)*** (`song.holiday.jingle-bells.rh`; `content/scores/authored/jingle-bells-rh.abc`). C major, 4/4, eight bars, the right hand alone, fingered 1 on C to 5 on G throughout (3 on E, 4 on F, 2 on D). Its two leaps are G4 down to C4 in bar 3 (`!3!E !5!G !1!C !2!D`) and D4 up to G4 in bar 8 (`!2!D2 !5!G2`); located 2. Span R 60–67.
  - **`holiday`, the same right-hand chorus**, and **`holiday`, *Jingle Bells (chorus, hands together)*** (`song.holiday.jingle-bells.ht`; `jingle-bells-ht.abc`): the same right hand over a held left hand, C3 (5), F3 (2), G3 (1), whose edition note says it "stays in the C position". The left hand's moves C3–F3, F3–C3, C3–G3, G3–C3 are fourths and fifths; located 6 with the right hand's two. Span R 60–67, L 48–55.
  - **Why each is honest under the five constraints.** (1) Every sounding hand's whole span lies inside its own position (R 60–67; L 48–55), and the fingering keeps each finger on one key. (2) C position is named by 1.1, on 1.2's path and on `holiday`'s; the left hand's by 1.3, on `holiday`'s (its path leaves the core at 1.5). (3) None of the three declares a target skill (`targetSkills` absent), and the route reads no skill state, so no run is interval-reading evidence. (4) Nothing outside a position is admitted: the 15 leap pairs left all lie outside (`after/leaps-in-position.txt`). (5) The rows keep `interval.leap` in `demands`, located as before (`after/catalog-diff.txt`: no row moved but the stamps).
  - **Unchanged for the learner:** *When the Saints* (hands alternating) at 1.4 and `hymns.2`, whose one leap is the right hand's G4 to C4 across bar 3's opening rest, loses its leap refusal and stays refused for `rhythm.syncopation` (bars 3 and 5 open with a rest, located 2), taught at 4.5.
  - **Beyond a rung's own options** (inferred from the code, not measured): the same gate reads swaps, the Library and the demand tier, so any in-position leap row is coped with wherever C position is taught on the learner's path or reached rungs, from 1.1 (right hand) and 1.3 (left).
- **Counts, measured the same way at each run** (the table over the offline build; the probe from `app/.probe`):

  | | L120c's final | base (b93162ae) | after |
  | --- | --- | --- | --- |
  | table: options, pairs | 218, 453 | 218, 453 | 215, 448 |
  | A / B-claim / B-mapping | 3 / 40 / 0 | 3 / 40 / 0 | 3 / 37 / 0 |
  | C-later / C-elsewhere / C-nowhere | 251 / 159 / 0 | 251 / 159 / 0 | 249 / 159 / 0 |
  | `interval.leap` pairs; of them inside a taught position | 20; 5 | 20; 5 (the skip's positions read) | 15; 0 (the leap's own) |
  | app's probe `untaught` | 219 | 219 | 216 |
  | only the probe has | 2.2's reading row | 2.2's reading row | 2.2's reading row |

  The base's probe, its uncoped list and its table are byte-identical to L120c's final (`base-equals-L120c.txt`), and the pin test is green on the base's build.
- **The hypothesis held** (item 7), on the base's numbers, which carry L120c: the five pairs left (1.2 and 1.4 C-later; `holiday` ×2 and `hymns.2` B-claim), the three *Jingle Bells* lines left the table and the probe, both *When the Saints* lines kept `rhythm.syncopation` alone, and no other pair, class or line moved (`after/difference.txt`: 0 appeared, 0 changed; every other demand's count equal; the skip's 5 pairs unchanged). The brief's L120b-based figures (20 → 15, B-claim 42 → 39, C-later 238 → 236, 618 → 613, probe 379 → 376) are replaced by the base's: B-claim 40 → 37, C-later 251 → 249, pairs 453 → 448, options 218 → 215, probe 219 → 216. The same five pairs, the same three lines. D0's record is unchanged (its two leap rows are the cadence family at L 48–65). The catalogue: no row's fields moved but three stamps (`after/catalog-diff.txt`). No refutation.

## Done

1. **The ruling (item 1)** is the contract; the reviewer's eight invariants, each with what shows it:
   - *`interval.leap` remains a measured leap*: (5) in both languages (the detector `leaps`, `located['interval.leap']` above zero on the in-position row); the catalogue diff (no row's `demands` or located counts moved).
   - *`taughtAt` remains 2.1*: (5) in both; `test_taught_at.py`'s `interval.leap` assertions unedited (:163, :199, :387 and the untaught-at-1.4/1.5, taught-from-2.1 case at :275–286); mutant (v) red in both.
   - *`copedWithBy` remains interval reading*: (5) in both.
   - *fixed-position support changes the coping gate only*: no line of `inTaughtPosition`, `in_taught_position`, `evidence.ts`, `ladder.ts`, the detectors or the Learner builds changed; the catalogue, the curriculum and D0's record unchanged.
   - *no interval-reading evidence is awarded*: (3) (TS); mutant (iv) and L120b's `ts-as-supported-state` red.
   - *the whole sounding hand inside its own already-taught position*: (1), (2) and (4)'s hand cases; mutants (iii), (vi), L120b's `right-hand-alone`, `no-hand-equality`, `left-from-1.1` red in both.
   - *material outside the position still refuses*: (4) in both; mutants (ii), (iii), (iv) red.
   - *the bass-clef/hand ambiguity untouched*: no clef-to-hand reading in either language; 1.3's two left-hand arrangements read identically before and after, and the three class-A clef rows stay (A 3 before and after).
2. **The data (item 2).** `demands.json`'s `interval.leap` gains `fixedPositions`, the same two objects as the skip's, spliced as text (the one-line entry opened into the multi-line form the skip's uses; nothing else re-serialised). The note at :25–35 now says both demands carry them, pinned equal. The prose that said "the skip alone" is made true: `demands.schema.json`'s description; `vocabulary.ts`:105–107; `eligibilityCore.ts`:17–18, :48 (Deviation 2), :153–163, :179–180; `claims.py`'s `in_taught_position` and `untaught_on` docstrings; `untaught_options.py`:15–16. Not moved: any `taughtAt`, `copedWithBy`, the detectors, `measurement.span`, `evidence.ts`, `ladder.ts`, the Learner builds. `demands.json` is in the measurement fingerprint, so the after build re-measured every file (the stamp moved on 2013 rows; no measurement moved). The app's own measuring fingerprint (`measuringFingerprint.ts`) also covers `demands.json`, so each stored import is re-measured once on the next launch (a consumer the brief did not name; expected, nothing to change).
3. **The five constraints as adversaries (item 3)**, in `copingQuestion.test.ts` (class 3) and `test_taught_at.py` (`TestALeapInsideATaughtFixedPosition`), each case in the tests table below. Two are the app's alone and say so: (3), since the build reads no evidence; (2)'s reached 1.3, since the build has no reached set; and (4)'s runtime reading row, which the build does not read. The four L120b cases the brief named are revised in the same change, each with its class and old assumption; every other L120b case passes unedited.
4. **Mutants (item 4)**: 25, none survived; the two retired shown equivalent (below).
5. **The table, the probe and the pin (item 5).** Before: the setup build, then the probe and the table on it (`base/`), identical to L120c's final; the pin test green on it; `untaught_options.py --out` on it (`base/untaught-options.txt`). After: the offline build with an absolute `--out`, the probe, the table (`after/`), with `difference.txt` (the table, the tool against its probe), `probe-difference.txt`, `catalog-diff.txt`, `leaps-in-position.txt`, `other-readers.txt`, the four report diffs and `restore.txt`. The pin: `PROBE` is `runs/L120d/after/probe-refusals.txt`, the count 216, `RECORDED_DIFFERENCES` still 2.2's reading row alone, the docstring says which snapshot and how it is re-run. D0's record unchanged; `test_measured_demands` green on it (`checks/d0-record.txt`). The validator's warning, quoted before: "218 rung-own options on 43 rungs are refused `untaught` at their own rung (453 option-demand pairs: A 3, B-claim 40, B-mapping 0, C-later 251, C-elsewhere 159, C-nowhere 0)"; after: "215 rung-own options on 43 rungs are refused `untaught` at their own rung (448 option-demand pairs: A 3, B-claim 37, B-mapping 0, C-later 249, C-elsewhere 159, C-nowhere 0)". **The other readers of `untaught_on`** (`after/other-readers.txt`):
   - the rung-claims report's untaught column (the option's earliest listing): 187 → 185 options; *Jingle Bells* at 1.2 and the hands-together setting on `holiday` leave it, *When the Saints* at 1.4 keeps `rhythm.syncopation`; `docs/prompts/rung-claims.md`'s diff against its snapshot is those three lines (`after/report-rung-claims.md.diff`);
   - `excerpts.py`:891: no excerpt's candidate rungs moved (5 excerpts, 24 pairs);
   - `study.py`:1325: six C-major studies gain `holiday` as a candidate rung (88 → 94 pairs): the three `interval-reading` studies and three `texture-hands-together` ones, each R 60–67, L 48–55 (Question 1).
6. **Question 2 (item 6), recorded and not built.** 1.3's *Hot Cross Buns (left hand)* and *Mary Had a Little Lamb (left hand)* are refused for `pitch.ledger` and `interval.skip` (and eighths for *Hot Cross Buns*) before and after; neither row carries `interval.leap`. The predicate falls because the one bass-clef staff is read as the right hand (span R 48–52 and R 48–55), and right-hand C position is 60–67. No clef-to-hand inference in either language, no special case. The ruling's precedence is a follow-up for a later reading or source seam. The three class-A clef rows (`pitch.ledger` on the two and on *Ode to Joy (left hand)*) stay visible.
7. **The hypothesis (item 7)**: held, above.
8. **Not L120d's (item 8)**: none of it touched.

**Deviations** (§13):

1. **The probe ran on the base too** (the orchestrator's instruction; the brief said the probe is not run twice). The base's probe equals L120c's final, so the before is measured, not inferred.
2. **`eligibilityCore.ts`:48**, `Learner.positionTaught`'s note ("no skip is coped with by one" → "no skip or leap"), outside the brief's line ranges: the same class of prose, in an owned file.
3. **Doc rows applied directly** to `docs/02` and `docs/08` (the orchestrator's instruction), written to stand on today's text: L120b's and L120c's rows are still pending there, so the `docs/02` paragraph names L120b's skip route as the context the leap joins. When L120b's pending paragraph is applied, the two merge.
4. **Browser specs on port 4874** through a config copy under `app/build/l120d/` with an absolute storage-state path (the orchestrator's), not 4477.
5. **Two cases red on the base that the brief lists among guards.** (6) is red on the base by nature (the leap had no positions). (3)'s first assertion, that the three *Jingle Bells* options are among the options the positions admit, is red on the base; its label is "(3)", not "(3, guard)". Every other guard passes on the base (`red-green/red-copingQuestion.txt`).
6. **Mutants.** (i), (ii) and (v) are data mutants: a changed copy of `demands.json` aliased in place of the app's import, and read by a copy of `claims.py` whose `VOCABULARY` points at it; controls through the same harness turn nothing red. (vi) is a code mutant restricted to the leap, so (2) alone shows it (a data change of the concept would also turn (6) red). (iv)'s guard (3) is the app's alone; its Python analogue is caught by the twins of (2), (4) and (5).
7. **The catalogue diff compares every field** (L120b's compared demands, located counts and the established set). Its first run found two more stamps than the brief expected, `provenance.facts.demands.detectors` (the same fingerprint) and `source.fetchedAt` (the read time, as in SOURCES.md's diff); they are set aside and counted.
8. **`docs/generated/ladder.md`** joined the snapshot and restore (the orchestrator named four generated reports); it did not change.

## Not done

- **Anything seen or heard.** No screen was opened; the three options are read from their notation.
- **The committed reports.** The build rewrote `rung-claims.md` (the three untaught lines) and `SOURCES.md` (fetch dates); `inventory.md` and `ladder.md` came out unchanged. All four were restored from the snapshot, each diff kept (`after/report-*.diff`). `test_measured_truth.TestTheReports` is red on `rung-claims.md` until the landing commits the regenerated one, and passes with it in place (`chain-checks-exit.txt`, `reports-with-regenerated`).
- **The one-definition alternative** (item 2): named, not built, as the reviewer settled.
- **Question 2's representation repair**: a later reading or source seam.

## Follow-ups

1. **P1, item 6's clef precedence**, for a later reading or source seam: explicit hand or staff-role metadata may support the left-hand fixed-position predicate; clef alone never supplies hand identity. 1.3's two left-hand arrangements are the cases.
2. **P2, imports carry no `span`** (`importStore.measureImport`), so an import's leaps, like its skips, are never exempted (L120b's follow-up 3).
3. **P2, `excerpt_proposer.untaught`**, the second copy of the coping question, takes neither rule (L120b's follow-up 2).
4. **P3, two `span` descriptions say "a skip"**: `content/catalog.schema.json`:221 and `tools/content/build.py`'s `span_of` docstring (E50a's file, in flight). True, now incomplete; not edited.
5. **P2, the study candidate report** (Question 1).

## Questions

1. **Should a candidate-rungs report leave out a rung the position route alone opens, for an item that targets interval reading?** `study.candidate_rungs` now lists `holiday` for three C-major `interval-reading` studies (targets `interval-reading`, `hands-together`; recipe rung 2.1), whose skips and leaps lie inside C position. The report places nothing, and the gate refuses every study before the coping question until a teaching-use yes (D3a), so no learner meets one there today. But a placement lane reading the report could put an interval-reading study on a rung where note reading copes with every interval in it; its runs would then be read as interval-reading evidence wherever its declared skills are in force, which is constraint 3 at one remove. Not built; my reading is that the candidate report should say which rungs the position route alone opens.
2. **The doc rows** stand on today's text (Deviation 3). Merge them with L120b's pending paragraph when that is applied, or apply L120b's first and fold this in?

## Files

- **Changed:** `content/curriculum/vocabulary/demands.json`, `content/curriculum/vocabulary/demands.schema.json`, `app/src/demands/vocabulary.ts`, `app/src/curriculum/eligibilityCore.ts`, `tools/content/claims.py`, `tools/content/untaught_options.py`, `app/tests/unit/copingQuestion.test.ts`, `tools/content/tests/test_taught_at.py`, `tools/content/tests/test_untaught_options.py`, `docs/02-curriculum.md`, `docs/08-test-map.md`.
- **The run folder `docs/prompts/runs/L120d/`:** this entry; `parity-reference.txt`, `copy.txt`, `content-build-base.txt`, `restore-base.txt`, `base-equals-L120c.txt`; `base/` (`probe-refusals.txt`, `probe-uncoped.txt`, `probe.txt`, `untaught-options.txt`, `untaught-options-run.txt`, `leaps-in-position.txt`); `after/` (the same, with `content-build.txt`, `difference.txt`, `probe-difference.txt`, `catalog-diff.txt`, `other-readers.txt`, `restore.txt`, `report-*.diff`); `red-green/`; `mutants.txt`; `checks-for-paths.txt`, `chain-checks-exit.txt`; `checks/` (the logs under 300 KB); the scripts `scripts-chain-setup.ps1`, `scripts-rerun.ps1`, `scripts-chain-checks.ps1`, `scripts-table-diff.py`, `scripts-catalog-diff.py`, `scripts-leaps-in-position.py`, `scripts-other-readers.py`, `scripts-mutants.py`, `scripts-zzL120dProbe.test.ts`, `scripts-vitest.l120d.config.ts`.
- **Not to commit (restored):** `content/scores/imported/SOURCES.md`, `docs/prompts/inventory.md`, `docs/prompts/rung-claims.md`, `docs/generated/ladder.md`.
- **Gitignored, outside the record:** removed at the end: `app/node_modules`, `app/dist`, `app/.probe/` (the probe and mutant configs, kept here as `scripts-*`), the e2e `test-results`, the `tsbuildinfo` files, the copied caches (`build/cache`, `build/midi-real`, the three cache JSONs, the Kern, MuseTrainer and Mutopia folders), the mutant copies, the two builds' kept catalogues and tables (`build/l120d-base`, `build/l120d-after`), the check logs and the report snapshot. The whole unit suite's full log (over 300 KB) was not kept: `checks/unit-summary.txt` holds its summary and failing names. Kept: `app/public/content` (the after build), `app/build/l120d/` (the e2e config copy and its storage state, not for the commit) and `build/l120d/` (the edit scripts and the detached runs' stdout).

## The red lines

From `red-green/`, each on the base's code and vocabulary with L120d's tests:

- `red-copingQuestion.txt`: 7 failed of 41 — the revised positions case (`[ 'interval.skip' ]` to equal `[ 'interval.skip', 'interval.leap' ]`); (1) at 1.2, at 1.4, on the floor, and (2)'s reached 1.3 (`[ 'interval.leap' ]` to equal `[]` each); (3) ("the three Jingle Bells options are among them: expected [] …"); (6) ("expected undefined to be defined"). Every guard passed.
- `red-test_taught_at.txt`: 3 failed of 50 — `test_1_a_leap_inside_the_taught_positions_is_coped_with` (`['interval.leap'] != []`), `test_6_the_leap_s_positions_are_the_skip_s` ("the leap carries positions"), the revised `test_the_positions_are_recorded_on_the_skip_and_the_leap_…` (`['interval.skip'] != ['interval.skip', 'interval.leap']`).
- `red-test_untaught_options-old-pin.txt`: the after build against the old pin (L120c's probe, 219): 3 failed — the lines ("Items in the first set but not the second": the three *Jingle Bells* lines), the per-demand counts (`interval.leap` 20 against 15), the count (219 != 216).
- Green after: `green-copingQuestion.txt` (41 passed), `green-test_taught_at.txt` (50, OK), `green-test_untaught_options.txt` (23, OK).

## The mutants

`mutants.txt`, `scripts-mutants.py` (L120b's harness; copies under `build/l120d-mutants`, never the source). Controls: the unmutated code copies and the re-serialised unchanged vocabulary through the same aliases, 0 red each. **25 mutants, 0 survived.**

| Mutant | Caught by (examples; every red is in `mutants.txt`) |
| --- | --- |
| (i) the leap's `fixedPositions` removed | TS: the three (1) cases, (2)'s reached 1.3, (3), (6), the revised positions case; Py: `test_1`, `test_6`, the revised positions case |
| (ii) the leap's right high bound 69 | TS: (4) C4 to A4, (6), (5) at 1.5, (3); Py: `test_4`, `test_6` |
| (iii) the bound check skipped for the leap | TS: (4) A4, C5, the left hand at A3, (5) at 1.5, (3); Py: `test_4`, `test_5` |
| (iv) the leap coped with as a supported state once C position is taught | TS: (3), (4) ×5, (2) ×2, (5) at 1.5; Py: `test_2`, `test_4`, `test_5` |
| (v) the leap's `taughtAt` 1.5 | TS: (5) at 1.5, (5) measured leap, (3); Py: `test_5` |
| (vi) the leap's left position read from 1.1 | TS: (2) the left hand at 1.2, (2) the floor's two-hand row; Py: `test_2` |
| L120b's other 13, unchanged | each red again (the new leap cases join the skip's); e.g. `ts-right-hand-alone` 3, `ts-as-supported-state` 17, `ts-only-route` 24, `py-only-route` 6 |
| retired: `ts-extended-to-leaps`, `py-extended-to-leaps` | 0 red each: equivalent mutants once the leap's positions equal the skip's, as (6) pins; not counted |

## Tests

| Test | Class | Old assumption |
| --- | --- | --- |
| `copingQuestion.test.ts`: *the positions are recorded on the skip and the leap, and each is a concept the lessons name* | revise | the positions are the skip's alone |
| `copingQuestion.test.ts`: *(1) at 1.2 a leap with the right hand inside 60–67 is not uncoped, nor the skips beside it* (was L120b's *(2, guard) an interval.leap inside 60–67 at 1.2 stays uncoped*) | revise (inverted, moved to class 3) | a leap inside the position refuses |
| `copingQuestion.test.ts`, class 3: the rows' readings; (1) at 1.4 and the floor; (2) ×5; (3); (4) ×5; (5) ×2; (6) | add | — |
| `copingQuestion.test.ts`: the module note's class 2 "(2) … or any other demand" | revise (prose) | no demand but the skip names positions |
| `test_taught_at.py`: `test_the_positions_are_recorded_on_the_skip_and_the_leap_and_named_by_the_lessons` (renamed) | revise | the positions are the skip's alone |
| `test_taught_at.py`: `test_2_a_skip_that_leaves_the_position…`, its three leap lines removed, inverted into `TestALeapInsideATaughtFixedPosition.test_1` | revise | a leap inside the position refuses |
| `test_taught_at.py`: `TestALeapInsideATaughtFixedPosition` (`test_1`, `test_2`, `test_4`, `test_5`, `test_6`) | add | — |
| `test_untaught_options.py`: `PROBE`, the count, the docstring | revise | L120c's snapshot (219) is the app's reading |
| every other L120b and L120c case | preserve | — |

**Exit codes** (`chain-checks-exit.txt`, the logs in `checks/`, each under 300 KB):

| Step | Exit | Note |
| --- | --- | --- |
| `parity_reference.py` · the copies · `npm ci` | 0 · 1 each (robocopy: copied) · 0 | the fresh-worktree steps; three MAESTRO recordings absent, skipped |
| `build.py --offline --out <abs>`, base (`content-build-base.txt`) | 0 | the validator's warning quoted under Done 5 |
| the base's probe · table (`base/`) · the pin test on the base (`base-equals-L120c.txt`) | 0 · 0 · 0 | identical to L120c's final |
| red runs (`red-green/red-*`) | 1 each | as listed above |
| `build.py --offline --out <abs>`, after (`after/content-build.txt`) | 0 | every file re-measured (`demands.json` in the fingerprint); validation OK |
| the after probe · table | 0 · 0 | 216 · 215 options, 448 pairs |
| green runs (`red-green/green-*`) · D0's record (`checks/d0-record.txt`) | 0 · 0 | 41 · 50 · 23 · 8 tests |
| mutants (`mutants.txt`) | 0 | 25 of 25 killed beyond the controls; the two retired 0 red |
| `checks_for_paths.py` (`checks-for-paths.txt`) | 0 | 12 of 12 paths matched: content-build, content-validate, review-check, content-tests, tsc, lint, unit, build-app, e2e (7 specs) |
| `validate.py --dir <abs> --allow-nc --personal` · `review.py --check` | 0 · 0 | — |
| `unittest discover -s tools/content/tests -t tools/content` (`checks/content-tests.txt`) | 1 | 1,565 tests, 4 skipped; one failure, `TestTheReports` on `rung-claims.md` (the restore protocol) |
| `TestTheReports` with the regenerated reports in place, then restored | 0 | — |
| `npx tsc -b --noEmit` · `npm run lint` | 0 · 0 | — |
| `npx vitest run`, the whole unit suite on the rebuilt content (`checks/unit-summary.txt`) | 1 | 8 failed of 7,358 in 7 files: the recorded `lessonClaimsAboutApp` line-ending pair (blues.3, 4.7; Entry 101) and six others (`expectedNote`, `libraryImportWords`, `materialOnTheRecord`, `observationsFromRun`, `sessionProtocol`, `unmeasuredConceptsSaySo`); other builders' builds and suites were running on this machine at the time |
| the seven files alone (`checks/unit-failures-alone.txt`) | 1 | only the recorded pair; the six pass alone, read as load |
| `npm run build:app` | 0 | — |
| the map's 7 e2e specs, 2 workers, port 4874, config copy under `app/build/l120d/` (`checks/e2e.txt`) | 0 | 73 passed; the spec files asserted present first (0 missing) |
| `test_taught_at.py` · `test_untaught_options.py` after a last docstring reflow in `claims.py` and `untaught_options.py`, no code line changed (`red-green/green-after-docstring-reflow.txt`) | 0 · 0 | 50 · 23 tests |

**Orchestrator's note at the landing (2026-09-29).** L120d's worktree committed by name (4e76c768) and merged (712d6321). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/L120d/map-min.txt`), the content build offline (the reports compared), the validator, the record check, the whole content suite, then the app steps the map names — the whole unit suite on the rebuilt content, the app build, and the specs the map's minimum names where it names any (map-tests 0; map-min 0; content-build 0; content-validate 0; review-check 0; content-tests 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/L120d/orchestrator-exit.txt`). Your ruling on L120b's question 1 (`responses/c8680b70.md`) and your approval of the brief with its eight invariants (`responses/questions-f7acb2c0.md`). Landed in one content chain with the other (merge range ef5e25fc..11fc6978): map, the content build (the regenerated rung-claims.md committed with L120d's record, as its TestTheReports reads it), validate, review, the content suite, the whole unit suite (only the known CRLF pair red), the app build and the map's nine browser specs, 97 passed.

## Doc rows

Applied (Deviation 3):

- **`docs/02-curriculum.md`**, after the E0 gate paragraph (*"E0 extended it (2026-09-27): the one gate"*, ending "…whose path reaches none of them."): a new paragraph, **A skip or a leap inside a taught fixed position (L120b, 2026-09-29; L120d, 2026-09-30)** — the third route beside *supported* and *taught*, the two positions on both demands pinned equal, the whole sounding hand inside its own taught position, material outside refused, the gate only (`taughtAt` 1.5 and 2.1, `copedWithBy`, no evidence), clef never a hand, the three *Jingle Bells* options, the table 218 → 215 (453 → 448).
- **`docs/08-test-map.md`**: a new pieces row after E0b's, **A skip or a leap inside a taught fixed position** (L120b, L120d), with what can go wrong, `copingQuestion.test.ts` classes 2–3, `test_taught_at.py`'s two classes and `test_untaught_options.py`'s pin, status done and pinned by the mutants; a unit-file line for `copingQuestion.test.ts`; `test_taught_at.py`'s line gains the L120b/L120d clause.
- **Not applied, pending as before:** L120b's and L120c's own `docs/02`, `docs/03`, `docs/05` and `docs/08` rows (in `docs/pending-review.md`); `docs/03` gets nothing from L120d beyond them (the fingerprint sentence L120b's row carries already says a `fixedPositions` change re-measures every file).
