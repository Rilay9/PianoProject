### Entry 121 — Doc-splice: the doc rows of Entries 109, 112, 113, 114, 115 and 116 checked against the code at 71ee5f4 and spliced into `docs/03` §4a and §4c, `docs/04` §5 and `docs/08` (40 rows spliced, 10 already present, 2 not this seam's); where the code or the record disagreed with a row's words the spec says what the code does, with the reason beside it, and Q-tooling's CI paragraph now describes the two workflows as they are (2026-09-29)

**Judgement.** Documentation only: nothing here reaches a learner, I looked at no screen, and nothing musical is claimed or heard. The orchestrator's hypothesis was that every row describes the code at HEAD except Q-tooling's views step. **The views step did not turn out to be the exception.** Entry 116's rows already put the regeneration in the validator's last step, and no row puts it in `build.py`. The build does reach it indirectly: `build.py`'s validate step runs `validate.py` (`build.py` 1326), so a local build regenerates the views too. The CI paragraph now says so. **The refutation came from the same entry's CI paragraph instead.** It was written against Q63's first form of the workflow (d5fb235), and ef80e86 and b51579a replaced that form before Q-tooling merged. At 71ee5f4:

- `ci.yml`'s `paths-ignore` lists only the record and the review stream (`docs/review/**`, `docs/prompts/runs/**`, `docs/prompts/pictures/**`, `docs/prompts/entry-*.md`, `docs/pending-review.md`, `docs/prompts/in-flight.md`, `.claude/**`), not all of `docs/`.
- `cancel-in-progress` is `false`: the run in progress completes, and the newest pending push replaces an older one.
- The views are checked on every push by `docs-integrity.yml`, not on the next code push.

The paragraph now reads as the workflows do, and its last parenthesis names the entry, the two replacing commits and this entry.

The other rows whose words the code or the record did not bear out, and how the spec reads there now:

- **G1, `contactNovelty.test.ts`'s gain.** The entry had the line gain that the encounters and pruned runs' summaries are read beside the runs. This file stores runs only (`recordRun`); `contact` reading encounters and summaries is held in `encounterModel.test.ts` ("the store reads the encounters and the summaries for contact") and `encounterRetention.test.ts`. The line says that, with this entry's number.
- **Q47, `test_ci_order.py`.** The entry had "the harness and the parity reference before the unit tests". The test asserts that the harness step exists after the Python requirements (`test_the_converter_harness_runs`), and that the parity reference comes before `npm run test`. It does not assert that the harness comes before the unit tests. The line now reads "the converter harness present, the parity reference before the unit tests".
- **Q47, the pieces row's status.** The entry had "the first CI run unverified until the push". The entry's own amendment at the reviewer's acceptance records the runner's proof on runs 36523543429 and 36525222177, so the status now reads from the amendment. This is a record correction, not a code one. The same row said the writer "fails under CI on a missing recording and on a missing committed fixture". `parity_reference.py` fails on a missing committed fixture everywhere, so the clauses are reordered.
- **U74, "half a second or more later"** (the `docs/04` paragraph and the `docs/08` row). This is a timing taken on the builder's machine (the frame traces in Entry 114's red lines), not a bound the code sets. The code's measurement waits for an idle callback with a 600 ms timeout (`MEASURE_IDLE_TIMEOUT_MS`), which can fire sooner. Both places now read "on idle, after the first paint".
- **Q47, `midiParity.test.ts`.** The entry replaced the whole line. The replacement would have dropped two phrases that are still true at HEAD: the quoted verdict words and "read back off each side's written file". I spliced three edits inside the line instead: the fixture list, the hand-split sentence, and "Skips…" changed to "Fails…". "Skips…" had been false since Q24.

**Checked and correct:** every row names only things that exist at HEAD. `verify_rows.py` checks each row's named functions, fields, files and test cases against the code, and finds 0 missing across 52 rows (`verify-before.txt`, `verify-after.txt`). None had been renamed or removed.

**Already in the files:**
- D4a's six rows, spliced at D4a's landing (df3fa3b), are consistent with `offerSnapshot.ts`, `help.ts`, `TodayScreen.supersedeOffer`, the router's `offer` and `material.RunFacts`.
- G1's `docs/04` §5, §5f and §6 text and its `docs/01` §4.5 text are present, as G1's builder wrote them.

**One record fault:** the landing notes of Entries 112 and 113 say their `docs/08` rows were spliced in the record commit. At 71ee5f4 neither was in the file (key-phrase search: 0 each).

**Done**

1. **Item 1: each row checked before it was spliced.** For each row, `scripts/verify_rows.py` records how often its key phrase appears in the target file and the code facts it names (file, pattern, first matching line). Before the splice: 52 rows, 0 code facts missing. The contradictions are above. Technical: done. Pedagogical: none claimed; the rows are about tests and tooling, and nothing heard.
2. **Item 2: each splice kept tight.** `git diff --numstat`: `docs/03` 34 lines added and 0 removed; `docs/04` 15 added and 1 removed; `docs/08` 51 added and 10 removed. Every "removed" line is one line changed in place, and each is listed in the table with its reason:
   - `docs/04` 1733, the "One size for the run" phrase (the entry says replace).
   - `docs/08`, lines at HEAD:
     - 216 `lab.spec.ts`: a sentence appended.
     - 290 `score.screen.spec.ts`: a clause inside the existing parenthesis.
     - 332 `backup.test.ts`: a clause appended.
     - 376 `contactNovelty.test.ts`: a clause appended.
     - 407 `help.test.ts`: a clause.
     - 422 `midiParity.test.ts`: three in-line edits.
     - 526 `observationsFromRun.test.ts`: a clause.
     - 664 `test_technique_units.py`: a clause.
     - 683 `parity_reference.py`: an in-line edit.
     - 684 `test_converter.py`: one sentence replaced, as the entry says. The old sentence ("`skipUnless` … the skip message names the files") is false at HEAD: a `setUp` now skips without `CI` and fails with it.

   No line was deleted outright; none reached the `diff-growth` threshold. Each inserted text ends with its seam in parentheses, as the files do.
3. **Item 3: `docs/08` rows placed in the file's existing order**, and every spec or unit file they name exists at HEAD (`verify_rows.py`):
   - Pieces table: G1 after D4a's row, and E-tail after E2a's row (the entry named no position). Q47 after the `convert.py` rows (no position named). U74 after "How many systems the stage holds".
   - The CI paragraph after the four Playwright configurations.
   - The e2e line after `score.window-rule.spec.ts`.
   - The unit and Python lines alphabetically, as the lists run.
4. **Item 4: idempotent.** `splice.py` skips any operation whose key phrase is already present. Run a second time, it reported 34 of 34 "already present" and changed no byte (`splice-rerun.txt`; `git diff --numstat` unchanged).
5. **Item 5: the table** is below.
6. **Item 6: nothing outside this seam's scope.** No row from G1a, Q65a, F2a or X3; `docs/02`, `docs/00`, `docs/prompts/*` (other than this folder) and the code are untouched.
7. **G1's `docs/03` §4a bullet ("An import's identity").** The brief's Read-first line lists G1's targets as `docs/01` §4.5 and `docs/08`, but Entry 112's Doc rows give this `docs/03` §4a bullet too. It falls inside §4a, which this seam owns, and "every row goes where its entry says, once". It is spliced at lines 661–667. If it was meant for another seam, those lines come out by themselves.
8. **Verification layers, all exit 0:**
   - `npx vitest run tests/unit/docsConsistency.test.ts` passed its 3 tests.
   - `python tools/content/build.py --offline` produced `app/public/content` (2090 items, validation OK). This ran after the offline build's inputs were copied from the main checkout, as earlier seams did (`copy-inputs.txt`); `app/public/content` itself was not copied.
   - `python tools/content/validate.py --allow-nc --personal` passed; its views step "regenerated 47 file(s) … 0 had been stale".
   - `checks_for_paths.py` on the three docs and this entry asks for `docsConsistency.test.ts` alone.
   - The build rewrote `content/scores/imported/SOURCES.md`, `docs/prompts/inventory.md` and `docs/prompts/rung-claims.md`. All three were put back from copies taken before the build, and `git diff --quiet` on them returns 0 (`restore-reports.txt`).

**Not done**

1. **G1's two `docs/02` rows** (Part G, the first-reading bullet; Part E2, D4's contact bullet): not spliced, because `docs/02` is F2a's (brief item 6). They are absent at HEAD (key-phrase search: 0 each). Their claims were checked at the code only where they share facts with G1's `docs/08` row: the encounter store, `db.isPhraseRun`, `contact`'s `how`, and the session's offer calling `contactIn` over runs alone (`session.ts` 1213). The rest is unverified at the code.

**Follow-ups** (recorded, not fixed)

1. **P3:** G1's `docs/02` rows still live only in Entry 112, for F2a's landing or the next docs seam.
2. **P3:** `test_ci_order.py`'s two Q63 cases have no words in `docs/08`'s line, and Q63 is not among the six entries:
   - `test_the_run_in_progress_completes_and_the_newest_tree_waits`;
   - `test_record_and_review_pushes_start_no_run_and_nothing_else_is_ignored`, which also holds that `docs-integrity.yml` runs the views' test and none of the app's suites.
3. **P3:** `app/tests/unit/textGlyphs.test.ts` (new in E-tail) has no line in `docs/08`'s unit list, and the `importMeasuredTruth.test.ts` line (415 at HEAD) does not mention E-tail's E32, E40–E42 and E48 cases. E-tail's rows gave neither. `docs/08`'s own rule is that a new file gets its line.
4. **P3:** `docs/08` has two pieces-table rows headed "The chooser's material layer, and the import's store side" (E2), whose texts differ (lines 41–42 at HEAD, 42–43 now). Which is current is unverified.
5. **P3:** the landing notes of Entries 112 and 113 claim `docs/08` splices that were not in the file at 71ee5f4. A key-phrase search at the record commit, like `verify_rows.py`'s, would catch that.

**Questions:** none that changes a decision.

**Files** (worktree `agent-a29a75c00c51127c3`, base 71ee5f4; nothing staged, nothing committed)

- `docs/03-content-pipeline.md`: insertions only. In §4a (561–685): lines 585–588 (E42), 616–628 (E40/E41, then E32/E48's bullet), 657–659 (E33's block fields) and 661–667 (G1's import identity). In §4c (724–808): lines 742–743 (E33/E29, the definition) and 759–763 (E33's dropped texts, E31). X3's import-sheet line is not among them.
- `docs/04-ui-spec.md`, §5: line 1733 changed in place (U74's phrase); lines 1737–1750 inserted (a blank line, then U74's paragraph).
- `docs/08-test-map.md`:
  - Pieces rows at 41 (G1), 45 (E-tail), 86 (Q47) and 121 (U74).
  - The CI paragraph at 149–170.
  - e2e lines 242, 302 and 317.
  - Unit lines 359, 394, 395, 405, 410, 437, 452, 556 and 623.
  - `tools/content/tests/` lines 654, 655, 662, 679, 689, 690 and 701.
  - `tools/midi-cleanup/tests/` lines 720–725.
- `docs/prompts/runs/Doc-splice/`:
  - This entry.
  - The captures.
  - `scripts/`: `verify_rows.py` (each row against the doc and the code), `splice.py` (the splices, idempotent), `amend_ci_paragraph.py` (one amendment to the CI paragraph after the first splice: docs-integrity.yml's own `cancel-in-progress: true`), `capture.py`, `copy_inputs.py` and `restore_reports.py`.
- Left in the worktree, gitignored, not for commit: `app/node_modules`, `content/scores/imported/kern` and `musetrainer`, `build/`, and the generated `app/public/content`.

### The table (brief item 5): every row

| Row | Entry | Target | Result | Where, and the reason where not verbatim |
| --- | --- | --- | --- | --- |
| 109-a | 109 D4a | `docs/04` §2, the transfer offer's bullet | already present | line 239 (spliced at D4a's landing); checked at code: `offerSnapshot.ts`'s key and seven refusals, `help.ts`'s two lines, `supersedeOffer`, the route's `offer` |
| 109-b | 109 | `docs/08` pieces table, after D4's row | already present | line 40; `RunFacts` union and `loadOffer` checked |
| 109-c | 109 | `docs/08` unit list, `offerSnapshot.test.ts` | already present | file exists |
| 109-d | 109 | `docs/08` unit list, `todayOfferSnapshot.test.ts` | already present | file exists |
| 109-e | 109 | `docs/08` unit list, `transferOfferOnTheRun.test.ts` | already present | file exists |
| 109-f | 109 | `docs/08` e2e `transfer-offer.spec.ts`, "Since D4a…" | already present | the `todayCard` hook exists |
| 112-a | 112 G1 | `docs/02` Part G, the first-reading bullet | not spliced | `docs/02` is F2a's (brief item 6); absent at HEAD |
| 112-b | 112 | `docs/02` Part E2, the contact bullet | not spliced | as above |
| 112-c | 112 | `docs/03` §4a, a bullet after `excerpt` | spliced, verbatim | lines 661–667; the brief's Read-first line did not list it, the entry's Doc rows do (Done 7) |
| 112-d | 112 | `docs/08` pieces table, after D4a's row | spliced, verbatim | line 41; every named function, store and test checked; "the session's offer reads runs only" still true (`session.ts` 1213) |
| 112-e | 112 | `docs/08` unit list, `encounterModel.test.ts` | spliced, verbatim | line 394, after `el.test.ts` |
| 112-f | 112 | `docs/08` unit list, `encounterRetention.test.ts` | spliced, verbatim | line 395 |
| 112-g | 112 | `docs/08` unit list, `firstContactOnTheScore.test.ts` | spliced, verbatim | line 410, after `fallbackOrder.test.ts` |
| 112-h | 112 | `docs/08` `contactNovelty.test.ts` line | spliced, corrected | line 405: this file's rows are runs; the encounters and summaries `contact` reads are held in `encounterModel`/`encounterRetention`, and the line says so |
| 112-i | 112 | `docs/08` `observationsFromRun.test.ts` line | spliced, verbatim | line 556 |
| 112-j | 112 | `docs/08` `backup.test.ts` line | spliced | line 359; the seam as "(G1)", the file's format, where the entry wrote ", G1" |
| 112-k | 112 | `docs/08` `help.test.ts` line | spliced, verbatim | line 437, after "C3's *Not judged* sentences" (the entry named no place in the line) |
| 112-l | 112 | `docs/08` e2e `lab.spec.ts` line | spliced, verbatim | line 242, at its end |
| 112-m | 112 | `docs/04` §5, what the screen writes | already present | edited by G1's builder (b48342f) |
| 112-n | 112 | `docs/04` §5f, the seen-before sentence | already present | as above |
| 112-o | 112 | `docs/04` §6, the history line | already present | as above |
| 112-p | 112 | `docs/01` §4.5, the two stores and version 8 | already present | as above |
| 113-a | 113 Q47 | `docs/08` pieces table | spliced, two changes | line 86, after the `convert.py` rows (no position named). The writer's failures reordered: the missing fixture fails everywhere, not only under CI. The status is taken from the entry's own amendment (the runner's proof), not "the first CI run unverified until the push" |
| 113-b | 113 | `docs/08` `midiParity.test.ts` line | spliced as three in-line edits | line 452; the entry replaced the line. The quoted verdict words and "read back off each side's written file", true at HEAD, are kept; "Skips…", false since Q24, becomes the entry's "Fails naming…" |
| 113-c | 113 | `docs/08` `test_ci_order.py` line | spliced, merged with 116-c, corrected | line 655: "the converter harness present, the parity reference before the unit tests" (the test does not order the harness before the unit tests) |
| 113-d | 113 | `docs/08` `test_technique_units.py` line | spliced | line 701; the entry's text added to the old clause rather than replacing it (same words) |
| 113-e | 113 | `docs/08` `parity_reference.py` line | spliced as an in-line edit | line 721; "the option the app passes" kept; the old two-fixture list, incomplete at HEAD, replaced by the entry's words |
| 113-f | 113 | `docs/08` `test_converter.py`, the sentence on the real recordings | spliced (replace, as the entry says) | line 722; the old sentence is false at HEAD |
| 113-g | 113 | `docs/08` midi-cleanup list, `fetch_maestro.py` | spliced, verbatim | line 720, before `parity_reference.py`; "(Q47)" added |
| 113-h | 113 | `docs/08` midi-cleanup list, `test_fetch_maestro.py` | spliced, verbatim | line 723; "(Q47)" added |
| 113-i | 113 | `docs/08` midi-cleanup list, `test_parity_reference.py` | spliced, verbatim | line 724; "(Q47)" added |
| 113-j | 113 | `docs/08` midi-cleanup list, `fixtures/` | spliced, verbatim | line 725; "(Q46)" added |
| 114-a | 114 U74 | `docs/04` §5, "One size for the run" | spliced (replace, as the entry says) | line 1733; "; U74" added inside the parenthesis |
| 114-b | 114 | `docs/04` §5, a paragraph after it | spliced, one phrase changed | lines 1738–1750: "on idle half a second or more later" becomes "on idle, after the first paint" (a timing from the builder's machine; the code's bound is an idle callback with a 600 ms timeout that can fire sooner); wrapped to the file's width |
| 114-c | 114 | `docs/08` pieces table, after "How many systems…" | spliced, one phrase changed | line 121, the same change ("re-planned on idle after the first paint") |
| 114-d | 114 | `docs/08` e2e, after `score.window-rule.spec.ts` | spliced, verbatim | line 302 |
| 114-e | 114 | `docs/08` unit list, `windowRendererStage.test.ts` | spliced, verbatim | line 623, after `wavEncode.test.ts` |
| 114-f | 114 | `docs/08` `score.screen.spec.ts` line | spliced | line 317, inside the existing parenthesis after "never on a shape that then changes" rather than as a second parenthesis beside it |
| 115-a | 115 E-tail | `docs/03` §4a, `facts.measuredUnder` | spliced, verbatim | lines 616–621, the bullet's last sentences |
| 115-b | 115 | `docs/03` §4a, an import's tempo | spliced | lines 622–628, its own bullet under a bold label taken from the entry's words |
| 115-c | 115 | `docs/03` §4a, converters (E42) | spliced | lines 585–588, in the `converter` bullet; the last parenthesis written as a clause ending "(E42)" |
| 115-d | 115 | `docs/03` §4a, the `excerpt` block | spliced | lines 657–659, as a sentence ("… are in the block too (E33)") |
| 115-e | 115 | `docs/03` §4c, the cut and the definition | spliced | the definition 742–743, the cut 759–761, each as a sentence at its bullet's end |
| 115-f | 115 | `docs/03` "the render step or §4c" (E31) | spliced in §4c | lines 761–763, because the brief keeps `docs/03` inside §4a and §4c; "in a cut and in every other score it loads" added, which is true at `OsmdView.load`, so the placement does not read as excerpt-only |
| 115-g | 115 | `docs/08` pieces table | spliced as a table row | line 45, after E2a's row (no position named); the entry's words, with "guards:" dropped because the column header says it |
| 116-a | 116 Q-tooling | `docs/08` "How to run the pieces", after the four configs | spliced, corrected | lines 150–170: the ignore list, the concurrency rule and where the views are checked as `ci.yml` and `docs-integrity.yml` read at 71ee5f4, and the views step as the code does it; the reason in the paragraph |
| 116-b | 116 | `docs/08` `test_checks_for_paths.py` | spliced | line 654; " — " for ":" (the file's format); "(Q-tooling)" added |
| 116-c | 116 | `docs/08` `test_ci_order.py` | spliced, merged into 113-c's line | line 655: "Since Q-tooling, CI also runs every check the path map names; the state gallery is the one pinned exception" |
| 116-d | 116 | `docs/08` `test_evidence_manifest.py` | spliced, flattened | line 662; the entry's sub-bullets made one line (the list is one line a file) |
| 116-e | 116 | `docs/08` `test_matrix_edit.py` | spliced | line 679; separator; "(Q-tooling)" added |
| 116-f | 116 | `docs/08` `test_prompt_views.py` | spliced | line 689; "(the reviewer's request, 2026-09-26; the line Q-tooling's)", because the test predates Q-tooling |
| 116-g | 116 | `docs/08` `test_prompt_views_refresh.py` | spliced | line 690; separator; "(Q-tooling)" added |

### Exit codes (captures in this folder; first line the command, last line `exit=`)

| Capture | Exit | What it said |
| --- | --- | --- |
| `verify-before.txt` | 0 | 52 rows; 0 code facts missing; key phrases 1 for the 10 present rows, 0 for the rest. The first run stopped on a syntax error in the script itself (a quote inside a raw string); that capture was overwritten by the rerun |
| `splice.txt` | 0 | 34 operations, every anchor found once, three files written |
| `verify-after-first-keys.txt` | 0 | three rows' key phrases in the verifier did not match the final wording (112-j, 114-a, 114-f: the verifier's keys, not the splices); aligned |
| `amend-ci-paragraph.txt` | 0 | the CI paragraph rewritten (21 lines for 21) with docs-integrity's own cancellation |
| `verify-after.txt` | 0 | 52 rows; every key phrase once except the two `docs/02` rows (0); 0 code facts missing |
| `splice-rerun.txt` | 0 | 34 of 34 already present |
| `npm-ci.txt` | 0 | installed |
| `vitest-docsConsistency.txt` | 0 | 1 file, 3 tests passed |
| `copy-inputs.txt` | 0 | kern, musetrainer, `build/cache/convert` and the three caches copied from the main checkout |
| `content-build.txt` | 0 | offline build; validation OK, 2090 catalogue items |
| `restore-reports.txt` | 0 | the three rewritten reports back to their bytes at 71ee5f4; `git diff --quiet` 0 |
| `content-validate.txt` | 0 | content validation OK; five "stale by cut version" warnings, as in Entry 115; views regenerated, 0 stale |
| `checks-for-paths.txt` | 0 | the three docs and this entry: `docsConsistency.test.ts` only |
| `diff-stat.txt`, `diff-numstat.txt` | 0 | 3 files, 100 insertions, 11 deletions (the 11 lines changed in place) |
| `diff-docs03-hunks.txt` | 0 | the `docs/03` hunks (taken before the CI amendment, which touched only `docs/08`) |

**Unverified** (beside what passes):
- G1's `docs/02` rows beyond the facts they share with its `docs/08` row.
- Whether the four new pieces rows' "what can go wrong" lists match each test's assertions one for one. I checked that the files and named cases exist, not every assertion.
- Every behavioural sentence in the rows is checked against the code as read, not by running the app.
- CI has not run this tree. `docs/08` and `docs/04` are not in `paths-ignore`, so the push starts a full run.

**Orchestrator's note at the landing (2026-09-29).** Doc-splice's worktree committed by name (bdc988d) and merged (a1b6f44c). The chain on the merged main checkout (docs only): the documents-against-the-code unit file, the validator with its views step, the record check (docs-consistency 0; content-validate 0; review-check 0; `runs/Doc-splice/orchestrator-exit.txt`). Two of the builder's findings are the orchestrator's faults, corrected in the record: the landing notes of Entries 112 and 113 said their `docs/08` rows were spliced in the record commit, and they were not (amended below and in those entries); and U74's doc rows carried a timing from the builder's machine ("half a second or more"), which the spec now states as the rule (on idle, after the first paint). Q-tooling's CI paragraph, written against the workflow's first form, now describes the workflows as they are. G1's two `docs/02` rows stay unspliced (F2a's file, then F2b's): a follow-up for the next docs seam. Nothing musical; nothing heard.

