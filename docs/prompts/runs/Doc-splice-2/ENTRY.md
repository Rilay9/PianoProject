### Entry 140 — Doc-splice-2 — the doc rows of Entries 118–139 checked against the code at 407c135a and spliced once into `docs/01`, `02`, `03`, `04`, `05` and `08`: the dispatch's eleven entries and the ten earlier ones whose rows no spec held yet, in their combined, superseding form; where a row and the code differed the spec says what the code does, and Q77's sentence in `docs/03` is narrowed (2026-09-29)

**Judgement.** Documentation only. Nothing here reaches a learner. I looked at no screen and heard nothing, and no sentence below judges music. Every row was read against the code at HEAD before it went in:
- `scripts-verify_rows.py` checks 131 rows against 233 code facts (files, functions, fields, test cases, strings) and finds none missing (`verify-before.txt`, `verify-after.txt`).
- Where a sentence's truth needed more than a name, I read the lines themselves; they are cited in the table.

**The premise did not hold, and I changed the scope.** The dispatch named eleven entries as "every row since G2". It assumed every earlier row was already in a spec. It was not. A seam-tag search of the six specs at HEAD found none of the doc rows of these entries:
- 118 (X3), 119 (G1a) and 120 (Q65a), which landed before Entry 121 but were not among its six;
- 122 (X3a), 123 (F2b), 124 (Q65b), 125 (U80), 127 (U82), 128 (X3b) and 129 (X3c);
- G1's two `docs/02` rows, which Entry 121 left "for the next docs seam".

The reviewer's procedure (`questions-400e69c8.md` §3) is "collect all accumulated doc rows since the last splice". Four of the eleven entries' rows could not be spliced truthfully without the earlier ones, and one earlier row corrects another:
- X3d's `docs/04` row replaces words inside X3c's tempo-line bullet. X3e's rows extend X3d's. Neither the bullet, nor X3's import-sheet bullet, nor the import-experience row in `docs/08` was in any spec.
- F2c's rows edit F2b's clauses.
- U90's `plan.spec.ts` line says "the F2b case", a case the file's line did not name.
- G1a's rows (one of the ten) correct G1's `docs/02` row.

So this is the one splice the reviewer ruled, over everything since Entry 121's scope: 21 entries' rows and G1's pair, 94 splice operations.

The rows beyond the dispatch's list are marked **(+)** in the table, and Question 1 asks whether to keep them. Two targets are outside the brief's list of owned files:
- `docs/01` §4.5: G1a's sentence and G1b's store row. Both entries name that section, and no seam held it.
- `docs/02` Part G and E2: G1's pair, with G1a's correction.

Each is a line range below, so it comes out by itself if it was meant for another seam.

**Where the code at HEAD contradicted a row, the spec now says what the code does.** These are observations, not a behaviour change:

- **G2, `docs/05` §9b's `countsTowardsMovingDown` sentence.** The row said "where any fact is unknown the attempt counts".
  - The code spares more than that. `sparesFailure` spares a failed first-contact attempt whose demands carry one no establishing record carried, even where a skill dimension is unknown: `transferReading` returns `unknown` with `newDemands` from the dimension loop (`transferPolicy.ts` 212–215, 227–228).
  - The spec now reads "**an unknown fact spares nothing**", which is the policy module's own rule ("Unknown facts are never guessed into either verdict").
  - The same over-broad sentence stands in `ladder.ts`'s comments (lines 22 and 91). That is code, so it is not this seam's to edit (Follow-up 1).
- **X1, `docs/04` §2, the transfer paragraph.** The row replaces "Only once it is kept.", but no such sentence is in the file.
  - The U73 clause went in after the sentence that says Today keeps the offer: "It opens only once it is kept: a write that fails opens nothing, and Today says *This offer could not be kept on this phone…*".
  - The code shows exactly this at `TodayScreen.ts` 348–357 and 658.
- **X1, the claim table's new jam row.**
  - The row's label was "none of its rung's options chord-and-feel".
  - The code prints the plain line, *From {rung}*, whenever the item picked is not chord-and-feel: "the rung has none, or Shuffle reached past them" (`session.ts` 1452–1456, `help.ts` 1421).
  - The label now says that.
- **X1, `docs/04` §5, the repurposed line.** The row quoted *You heard this one earlier today…*. `SESSION_TEXT.repurposed` says *played*, *saw* or *heard*, by how the piece was met. The sentence now says so.
- **G1a, `docs/04` §5, "a consumer of general contact — the transfer offer, the session, the lifecycle — reads `firstContact`".**
  - At HEAD only the transfer policy reads the attempt's `firstContact`.
  - The session reads the encounter history (`session.contactOf`, X1's recheck), and so does the project sheet (`encounterStore.familiarity`). None reads `unseen` for contact.
  - The sentence names each reader. The session runner's `scoreOutcome` reads `unseen` only for a phrase's run (`sessionRun.ts` 498), which is G1a's phrase condition, not general contact.
- **G1b, `docs/04` §6, the Projects block's empty state.**
  - The row had "with none of either: *No projects yet…* and *Pick a piece*".
  - In the code the sentence shows whenever there is no project, and *Pick a piece* shows only when there is no passed song either (`ProgressScreen.ts` 441–447).
- **Q65a, the `test_checks_for_paths.py` line.** The row names `docs/prompts/runs/Q65a/scripts/mutants.py`. The file is `runs/Q65a/scripts-mutants.py`.
- **U82, `docs/04` §5.** "about half a second later" was a timing from the builder's machine. It now reads "on idle, after the first paint", the rule Entry 121 wrote for U74's same sentence.
- **Q75, the new `docs/08` row's status.** The row said the runner's strict validation was unverified until the Pages run on the record commit was read. The entry's own later note records that run succeeding: 36559774503, on 248c6138. The status says so.
- **X3, the import-sheet bullet's placement.** It says *Where does it belong?* is "the body below". The bullet now sits after the assign sheet's bullet, so it says "(above)".

**Where a later seam superseded an earlier row, the combined text went in once:**

- **Import sheet, `docs/04` §4.** The bullets read in this order: X3's import-sheet bullet, then X3b's *Use this tempo* in place of X3a's, then X3c's tempo line. X3's "The tempo control waits for a store operation (E48)" is gone, because X3a built the control.
- **X3c's tempo line, with X3d's corrections:**
  - "its first bar's `<sound tempo>`" becomes the one reader's opening tempo;
  - X3d's sentence for a mark with no `<sound tempo>` is added;
  - "the first bar's printed mark" becomes "the printed mark at the opening", after X3d's opening rule and `importSheet.ts`'s own note;
  - "The line says what the file states, not what the player does" becomes "…which since X3d is what the Score screen plays".
- **`docs/05` §1 (X3d, X3e).** X3e's version of X3d's paragraph went in once.
- **`docs/08`, the X3 row.** Its guards gain X3a's, X3b's and X3c's. Its status drops "the tempo control held (E48)" (X3a built it) and X3c's "the player's metronome reading recorded" (X3d made it one reader).
- **`docs/08`, the F2 row and the test lines (F2b, F2c).** F2b's clause is spliced with F2c's "only `leap` read as `interval.leap`", and F2b's "(the leap among them)" carries F2c's replacement. F2b's two `docs/03` clauses are not spliced, since F2c withdrew them. The two existing sentences in `docs/03` are true at `claims.py` 58–82: `leaps` maps to no demand, and the left-hand pattern is one detector for seven concepts.
- **G1's `docs/02` rows.**
  - Part G says `firstContact`, never `unseen`, per G1a.
  - E2's "the session's offer still calls `contactIn` over the runs alone" becomes G2's fact: the offer reads the same contact through `session.contactOf` (`session.ts` 251–253; Today loads it at `TodayScreen.ts` 1102–1108).
- **G2 with G2a.** The `docs/05` ladder paragraph and the `docs/08` row and lines carry G2a's insertions inside G2's text.
- **G1b with G1c.** The G1b row carries G1c's gains.
- **Q65a's CI paragraph and its `score-fit-paths.spec.ts` line** were already in the file in Entry 121's corrected form, so they are listed as already present.

**Q77.** `docs/03`'s "They differ in four fields — `file`, `importHint`, `tags` and `source.checksum` — and in nothing else, which is checked" is narrowed. The flavours now differ as follows:
- in the rows the strict build does not bundle, each a placeholder;
- in what a missing file makes of those rows:
  - `demands` and `measurement` are unmeasured (`build.py` 643–666);
  - the provenance's demands fact says so (`build.py` 920–921);
  - no excerpt is cut from such a parent.

The reason is beside the sentence. The one check found, `test_pdmx.py` 619–623, holds a PDMX placeholder's file, hint and tag, not that nothing else differs. The search covered `tools/content/tests`, `validate.py` and `build.py`, for a comparison of the two flavours.

**Done**

1. **Item 1, each row checked before it was spliced.**
   - `scripts-verify_rows.py` records, for every row, how often its key phrase appears in its target, and each code fact with the line that matches.
   - Before the splice: every new row's key phrase appears 0 times; 7 phrases were already present; 0 code facts were missing.
   - After: every key phrase appears once, and 0 code facts are missing.
   - The contradictions and supersessions are above; the lines read are in the table.
   - Technical: done. Pedagogical: nothing claimed and nothing heard. The rows' own "unverified as music" and "unverified as pedagogy" are kept where the entries wrote them.
2. **Item 2, each splice tight.** `git diff --numstat` gives these insertions and removals:

   | File | Added | Removed |
   | --- | --- | --- |
   | `docs/01` | 9 | 4 |
   | `docs/02` | 20 | 1 |
   | `docs/03` | 9 | 2 |
   | `docs/04` | 216 | 21 |
   | `docs/05` | 57 | 5 |
   | `docs/08` | 73 | 21 |

   Every removed line is a line changed in place: a sentence a row explicitly replaces, or a line extended by an appended clause. Each is named in the table. None comes near the `diff-growth` threshold. Each inserted text carries its seam in parentheses, as the files do. Wrapping follows each file's width, and the one-line table rows and file lines stay one line.
3. **Item 3, `docs/08` rows in the file's order.** Every spec, unit, helper and content-test file the rows name exists at HEAD (`verify-after.txt`). The placement:
   - **The pieces table:**
     - G1a, G1b, G2 and X1 follow G1 in that order (G1a and G1b say "after G1's"; G2 "after D4a's and G1's"; X1 "after G2's").
     - Q75 follows F2, and Q76 follows Q75.
     - X3 follows E-tail, and X3d's tempo map follows X3.
     - U80 follows U74, whose tests cell gains U82's clause.
   - **The minimum paragraph** comes after the CI paragraph.
   - **The e2e, unit and content-test lines** are placed alphabetically, as the lists run.
4. **Item 4, Q77.** Done, above. The reason sits in the sentence.
5. **Item 5, idempotent.**
   - `scripts-splice.py` skips any operation whose key phrase is already in its file, read across the file's wrapping.
   - A second run reported 94 of 94 already present and wrote nothing (`splice-rerun.txt`).
   - One row was missed in the first pass: G1a's `observationsFromRun.test.ts` line, caught by the verifier. It went in by a second pass (`splice-second-pass.txt`), and the rerun then found all 94 present.
6. **Item 6, the table.** Below.
7. **Item 7, nothing outside the seam.**
   - The code, `docs/00` and `docs/prompts/*` are untouched; the only change under `docs/prompts/` is this folder.
   - `docs/prompts/checks.json` already carries Q76's map row; it is listed in the table as already present.
   - The two exceptions, `docs/01` and `docs/02`'s G1 pair, are named in the judgement.

**Not done**

1. **G1b's proposed `docs/00` invariant ("One truth per layer").** The entry leaves it "for the reviewer to place", and `docs/00` is not this seam's.
2. **The backlog rows of Q75 (a new row), Q76 (a status) and G1c (G83 and G84).** They belong in `docs/prompts/backlog-2026-09-25.md`, which is read-only here and is the record commit's.
3. **F2b's two `docs/03` clauses.** F2c withdrew them.
4. **Lines for new test files the rows did not give.** No row gives a `docs/08` line for these:
   - `test_import_mutopia.py` and `test_public_tie_option.py` (Q76);
   - `test_skill_transfer.py` (G2).

   Their rows name them only in a table cell. Writing their lines would be spec text no row names (brief item 7). Follow-up 3.

**Follow-ups** (recorded, not fixed)

1. **P3:** `app/src/evidence/ladder.ts`'s comments (lines 22 and 91) say "where a fact is unknown the attempt counts". `sparesFailure` spares a first-contact failure with a known new demand even where a dimension is unknown. `transferPolicy.ts`'s own note states the narrower rule. This is a comment in code; no behaviour question is raised.
2. **P3:** `docs/01` §4.5 still says "**`DB_VERSION` is 8.**"; the code is 9 since G1b (`db.ts` 70). No row names that sentence. The spliced `projects` row says version 9.
3. **P3:** Three new content-test files have no line in `docs/08`'s file list: `test_import_mutopia.py`, `test_public_tie_option.py` and `test_skill_transfer.py`. `docs/08`'s own rule is that a new file gets its line.
4. **P3:** `docs/08` has two `taughtByAncestry.test.ts` lines (the old 441 and 443; 471 and 473 now). The later one lacks F2's clause. F2b's clause went on the fuller line.
5. **P3:** `docs/prompts/checks.json`'s `docs/03` pattern names only `docsConsistency.test.ts`. But `libraryImportWords.test.ts` (line 232) reads `docs/03` with `readFileSync`. I ran it anyway: it passes. It is a hole in the map.
6. **P3:** `docs/04` §4, under X3's new lead "Wherever the app guessed is the exception", still goes on "That is the one import where the app decided things…". That sentence was written when MIDI was the only case. No row names it.
7. **P3:** `docs/04` §2's transfer paragraph still says "The ladder's v0 state keeps C7's words". The ladder's transfer is G2's policy now. Whether "v0" there meant the vocabulary or the rule is unverified. No row names it.

**Questions**

1. **Scope.** I spliced the rows of Entries 118–120, 122–125 and 127–129, and G1's `docs/02` pair, beside the eleven named. I did so because the reviewer's procedure is "since the last splice" and four of the eleven depend on them. Keep them, or strip them? The **(+)** rows in the table are each a line range.
2. **`docs/01`**, which the brief did not list: keep G1a's sentence and G1b's store row there?

**Files** (worktree `agent-a7b23ea4fd3a7fee2`, base 407c135a; nothing staged, nothing committed)

- `docs/01-architecture.md`: line 266 (G1b's store row), lines 318–325 (G1a's sentence, in place of G1's).
- `docs/02-curriculum.md`: lines 636–640 (X1, D8a), 1092–1097 (G1's contact bullet, with G2's fact), 1316–1324 (G1's Part G, with G1a's corrections).
- `docs/03-content-pipeline.md`: lines 253–261 (Q77).
- `docs/04-ui-spec.md`: every range is in the table. In file order: 65–66, 241, 264–265, 333–334, 350–351, 384–409, 640–641, 767–770, 854–863, 869–876, 892–900, 911–914, 943–946, 1499–1504, 1519–1521, 1523–1524, 1532–1534, 1546–1547, 1571–1610, 1872–1884, 1895–1897, 2276–2280, 2403–2416, 2480–2489, 2492–2497, 2515–2528, 2891–2894, 3555–3562, 3578–3581, 3852–3854.
- `docs/05-score-follow-engine.md`: lines 22–49 (X3d with X3e), 1077–1083 (G1b), 1236–1241 (G2 with G2a, the transfer clause), 1248–1263 (G2 with G2a, `countsTowardsMovingDown` and the attempt's facts).
- `docs/08-test-map.md`:
  - Pieces table: lines 32–34, 44–47, 52–53, 129–130.
  - The minimum paragraph: lines 181–197.
  - The e2e list: lines 265, 309, 312, 347, 352, 357.
  - The unit list: lines 388, 423, 439, 458, 468, 471, 500, 511, 548, 556, 561–563, 574–575, 587, 593–594, 603–609, 639, 650, 654, 660–662, 666, 674, 677.
  - `tools/content/tests/`: lines 706, 734, 750, 762, 765.
- `docs/prompts/runs/Doc-splice-2/`: this entry and the captures. The scripts:
  - `scripts-verify_rows.py`: each row's key phrase and code facts;
  - `scripts-splice.py`: the 94 operations, idempotent;
  - `scripts-docrows.py`: prints an entry's Doc rows;
  - `scripts-capture.sh`: the capture wrapper;
  - `scripts-restore_reports.py`: the build's three reports put back;
  - `scripts-sanitise.py`: the machine paths.
- Left in the worktree, gitignored, not for commit: `app/node_modules` (from `npm ci`), `build/` (the parity reference and the offline build), and `app/public/content` (copied from the main checkout).

### The table (brief item 6): every row

(+) marks a row beyond the dispatch's eleven entries (Question 1). "Code" names what was read at HEAD. The line numbers are the file as written.

| Row | Entry | Target | Result | Where, the code read, and the reason where not verbatim |
| --- | --- | --- | --- | --- |
| 120-a (+) | 120 Q65a | `docs/08` run section, the CI paragraph | already present | lines 159–179 (Entry 121's corrected form: concurrency, the ignore list, `docs-integrity.yml`); code: `ci.yml` 36 `cancel-in-progress: false` |
| 120-b (+) | 120 Q65a, with 124-a | `docs/08`, "The minimum for a landing" | spliced, verbatim | 181–197, after the CI paragraph; Q65b's two sentences inside it where 124 says; code: `checks.json`'s `about` and its twelve whole-suite patterns, `test_checks_for_paths.py` 130, 364 |
| 120-c (+) | 120 Q65a | `docs/08` e2e, `score-fit-paths.spec.ts` | already present | line 330 (U74's words, Entry 121) |
| 120-d (+) | 120 Q65a, with 124-b, 124-c | `docs/08`, `test_checks_for_paths.py` | spliced, appended | 706; the entry replaced the line, but its first half is the line as it stands, so the "Since Q65a…" half is appended; sub-bullets flattened (one line a file); the mutants' path corrected to `runs/Q65a/scripts-mutants.py`; code: `TheMinimumSemantics`, `MOUNTS`, `frame_importers` 166–208 |
| 124-a/b/c (+) | 124 Q65b | as 120-b and 120-d | spliced, inside Q65a's text | as the entry says |
| 118-a (+) | 118 X3 | `docs/04` §4, the assign sheet's first sentence | spliced, replaced as the entry says | 1523–1524; code: `LibraryScreen.ts` 358–372 |
| 118-b (+) | 118 X3 | `docs/04` §4, the MIDI exception | spliced, replaced | 1532–1534; code: `LibraryScreen.ts` 375–379 `guessedFor` |
| 118-c (+) | 118 X3 | `docs/04` §4, the conversion note | spliced | 1546–1547, as a sentence after "not about the score" (the entry said "after *The note lives in memory…*"); code: `help.ts` `conversionHandsYours` |
| 118-d (+) | 118 X3 | `docs/04` §4, the import sheet bullet | spliced, two changes | 1571–1581, after the assign sheet's bullet. "The tempo control waits for a store operation (E48)" becomes "The tempo line and its control are the next two bullets (X3a–X3d)": X3a built it. "the body below" becomes "the assign sheet's body (above)". Code: `importSheet.ts` 1–40, `openImportSheet`, `swapHands` |
| 118-e (+) | 118 X3 | `docs/04` §4, the Library rows | spliced | 1499–1501, in the Imports bullet (the words for the Library row); code: `help.ts` 2017–2045 |
| 118-f (+) | 118 X3 | `docs/04` §4, the placeholder sheet | spliced | 1519–1521, in the item-detail bullet; code: `LibraryScreen.ts` 653–715 |
| 118-g (+) | 118 X3, with 122-b, 128-b, 129-b | `docs/08` pieces, the import experience | spliced, combined | 52, after E-tail (no position named). The guards gain X3a's, X3b's and X3c's. The status gains X3a's, X3b's and X3c's, and drops "the tempo control held (E48)" (X3a) and X3c's "the player's metronome reading recorded" (X3d) |
| 118-h (+) | 118 X3, with 122-c, 128-d, 129-c, 133-j | `docs/08` unit, `importSheet.test.ts` | spliced, one line | 468; each seam's clause in landing order |
| 118-i (+) | 118 X3 | `docs/08` unit, `libraryImportWords.test.ts` | spliced | 511 |
| 118-j (+) | 118 X3, with 128-c, 133-k | `docs/08` e2e, `import-experience.spec.ts` | spliced | 265; X3b's clause in place of X3a's, as X3b says |
| 119-a (+) | 119 G1a | `docs/04` §5, G1's paragraph | spliced, replaced as the entry says | 2480–2489; code: `db.ts` 165–197, `ScoreScreen.ts` 3372–3475 |
| 119-b (+) | 119 G1a | `docs/04` §5, the paragraph's end | spliced, one sentence corrected | 2492–2497. "A consumer of general contact — the transfer offer, the session, the lifecycle — reads `firstContact`" becomes each reader as the code has it (judgement) |
| 119-c (+) | 119 G1a | `docs/04` §6, *Not first sight* | spliced, replaced | 3578–3581; code: `ProgressScreen.ts` 176 |
| 119-d (+) | 119 G1a | `docs/08` pieces, the first-contact fact | spliced | 44, after G1's; its "red on 76c9ade's source (15 of 63)" and mutant count are the entry's, not re-run; "CI not run" dropped (CI has run on later trees) |
| 119-e (+) | 119 G1a | `docs/08` unit, `firstContactOnTheScore.test.ts` | spliced | 439 |
| 119-f (+) | 119 G1a | `docs/08` unit, `encounterModel.test.ts` | spliced | 423 |
| 119-g (+) | 119 G1a | `docs/08` unit, `observationsFromRun.test.ts` | spliced, in-line | 594; the replacement kept "and on a piece since G1, `demonstrated`" after a semicolon (second pass) |
| 119-h (+) | 119 G1a | `docs/08` unit, `evidenceJobRecomputes.test.ts` | spliced | 458 |
| 119-i (+) | 119 G1a | `docs/01` §4.5 | spliced, replaced | 318–325 (outside the brief's files; judgement). "No `DB_VERSION`:" reads "G1a spends no `DB_VERSION`:", since the version is 9 now |
| 119-j (+) | 119 G1a | `docs/02` Part G, G1's row | spliced inside 112-a | as below |
| 112-a (+) | 112 G1, with 119-j | `docs/02` Part G, the first-reading bullet | spliced, placed after the *New phrase* sentence | 1316–1324. Between "(C1, below);" and "…which is." the insertion would have cut "which is" off from its "first reading", so the entry's "on any visit since G1 —" reads "A phrase heard on any visit since G1 is not a first reading either —". G1a's two corrections are in it. Code: `db.ts` 165–197 |
| 112-b (+) | 112 G1, with G2 | `docs/02` E2, the contact bullet | spliced, the last sentence superseded | 1092–1097. "The session's offer still calls `contactIn` over the runs alone" becomes G2's `session.contactOf` over `BuildInput.contact` (`session.ts` 232–253). Code: `progressStore.ts` 608–668 |
| 122-a (+) | 122 X3a | `docs/04` §4, *Use this tempo* | superseded | by 128-a, as X3b's entry says |
| 122-b/c/d (+) | 122 X3a | `docs/08`, the X3 row, `importSheet.test.ts`, `import-experience.spec.ts` | spliced in 118-g and 118-h; superseded in 118-j | as X3b says |
| 125-a (+) | 125 U80 | `docs/04` §5, after U74's paragraph | spliced, verbatim | 1872–1884; code: `ScoreScreen.ts` 195–202, 770–803, 2979–2983 |
| 125-b (+) | 125 U80 | `docs/04` §7a | spliced | 3852–3854 |
| 125-c (+) | 125 U80 | `docs/08` pieces | spliced | 130, after U74's row (no position named) |
| 125-d (+) | 125 U80 | `docs/08` e2e, `side-panel-prose.spec.ts` | spliced | 357; code: the spec's lines 73–82 |
| 125-e (+) | 125 U80 | `docs/08` unit, `scoreSidePanelDecision.test.ts` | spliced | 593 |
| 128-a (+) | 128 X3b | `docs/04` §4, *Use this tempo* | spliced, verbatim | 1582–1591; code: `importStore.ts` 857 `STATED_TEMPO_RANGE`, `help.ts` `tempoYours` |
| 128-b/c/d (+) | 128 X3b | `docs/08` | spliced in 118-g, 118-h, 118-j | — |
| 123-a (+) | 123 F2b, with 130-a | `docs/08`, the F2 row's status | spliced, F2c's word in F2b's clause | 32. F2a's proposed wording is not in the file (and Entry 117 has no Doc rows), so only F2b's clause is appended. Code: `claims.py` 58–82, `stage-1.json` `practice.1` `prerequisites: ["1.1"]` |
| 123-b (+) | 123 F2b, with 130-b | `docs/08`, `test_taught_at.py` | spliced | 762 |
| 123-c (+) | 123 F2b, with 130-c, 136-d | `docs/08`, `test_measured_truth.py` | spliced, F2c's replacement applied | 734 |
| 123-d (+) | 123 F2b | `docs/08`, `taughtByAncestry.test.ts` | spliced | 471 (the fuller of the two lines; Follow-up 4); code: the test's 587–622 |
| 123-e (+) | 123 F2b | `docs/08` e2e, `plan.spec.ts` | spliced | 309; code: the spec's 248–324 |
| 123-f/g (+) | 123 F2b | `docs/03`, two clauses | not spliced | withdrawn by F2c (Entry 130); the sentences that stay are true at `claims.py` |
| 127-a (+) | 127 U82 | `docs/04` §5, *Two things this settles* | spliced, one phrase changed | 2276–2280: "about half a second later" becomes "on idle, after the first paint" (a timing from the builder's machine; Entry 121's rule); code: `score.slide.spec.ts` 15, 92–100 |
| 127-b (+) | 127 U82 | `docs/08` e2e, `score.slide.spec.ts` | spliced, replaced as the entry says | 347 |
| 127-c (+) | 127 U82 | `docs/08` unit, `windowRendererStage.test.ts` | spliced | 674; code: the test's 513 |
| 127-d (+) | 127 U82 | `docs/08`, U74's row, tests cell | spliced | 129 |
| 126-a | 126 G2, with 132-a | `docs/05` §9b, the ladder's transfer clause | spliced, replaced | 1236–1241; code: `ladder.ts` 11, `transferPolicy.ts` 155–229 |
| 126-b | 126 G2, with 132-b | `docs/05` §9b, `countsTowardsMovingDown` | spliced, one clause corrected | 1248–1254. "where any fact is unknown the attempt counts" becomes "an unknown fact spares nothing" (judgement; `transferPolicy.ts` 212–215, 227–228) |
| 126-c | 126 G2 | `docs/05` §9b, the attempt's facts | spliced, verbatim | 1254–1263, in the same paragraph; code: `progressStore.ts` 285–345, `evidence.ts` 675–705, `ladder.ts` 131–137 |
| 126-d | 126 G2, with 132-e, 132-f | `docs/08` pieces | spliced | 46; G2a's insertions where 132 says |
| 126-e | 126 G2, with 132-g | `docs/08` unit, `transferPolicy.test.ts` | spliced | 666 |
| 126-f | 126 G2 | `docs/08` unit, `transferFactsOnTheAttempt.test.ts` | spliced | 661 |
| 126-g | 126 G2, with 132-h | `docs/08`, `masteryLadder.test.ts` | spliced, revised as the entry says | 575 |
| 126-h | 126 G2 | `docs/08`, `materialOnTheRecord.test.ts` | spliced | 574 |
| 126-i | 126 G2 | `docs/08`, `transferOffer.test.ts` | spliced | 662 |
| 129-a (+) | 129 X3c, with 133-e, 133-f | `docs/04` §4, the tempo line | spliced, combined | 1592–1610; four changes named in the judgement; code: `help.ts` 1905–1959, `importSheet.ts` 16–22 |
| 129-b/c (+) | 129 X3c | `docs/08` | spliced in 118-g, 118-h | the status clause about the player dropped (X3d) |
| 130-a/b/c | 130 F2c | `docs/08` | spliced with 123 | as above; code: `claims.py` 64–69 |
| 130-d | 130 F2c | `docs/08`, `test_study.py` | spliced | 750 |
| 130-e | 130 F2c | `docs/03`, F2b's clauses withdrawn | not spliced (as the entry says) | the standing sentences at 865 and 887 are true |
| 131-a | 131 Q75 | `docs/08` pieces, after F2 | spliced, the status corrected | 33. The status is taken from the entry's later note (Pages run 36559774503 on 248c6138, success). Code: `validate.py` `concept_claim_findings`, "0 unmeasured on this build"; the test's classes have 8 and 4 cases, counted |
| 131-b | 131 Q75 | `docs/08`, `test_validate_claims.py` | spliced | 765 |
| 131-c | 131 Q75 | `docs/03` §3a | already present | lines 401–424 (in Q75's change) |
| 131-d | 131 Q75 | backlog, a new row | not spliced | `docs/prompts/*`, read-only here (item 7); the record commit's |
| Q77 | Q75 review | `docs/03`, the flavours sentence | narrowed | 253–261; the reason beside it (judgement) |
| 132-a/b | 132 G2a | `docs/05` §9b | spliced, inside G2's text | as above; code: `transferPolicy.ts` 140–148, 193–194 |
| 132-c | 132 G2a | `docs/04` §3a, *shown on different material* | spliced, replaced | 911–914 |
| 132-d | 132 G2a | `docs/04` §3a, after the words table | spliced, verbatim | 943–946; no file under `app/src/ui` imports `transferReading` or `transferScope` (searched) |
| 132-e..h | 132 G2a | `docs/08` | spliced with 126 | as above |
| 135-a | 135 U90 | `docs/04` §3a, after §0 | spliced, one clause changed | 892–900: "on CI's runner, under a face wider than Segoe UI (Verdana)" becomes "on CI's runner, and here under a face wider than Segoe UI (Verdana)" — the runner's own face is unknown (U90's entry; `style.css` 3688–3699) |
| 135-b | 135 U90 | `docs/04` §0 R2 | spliced | 65–66 |
| 135-c | 135 U90 | `docs/08`, `plan.spec.ts` | spliced | 309, after F2b's clause, which names "the F2b case"; code: the spec's 254–324 |
| 133-a | 133 X3d | `docs/05` §1 | superseded | by X3e's combined paragraph (137-a) |
| 133-d | 133 X3d | `docs/04` §5, the tempo label | spliced | 1895–1897; code: `ScoreScreen.ts` 1967–1972, `row-row-row-your-boat.abc` `Q:3/8=54` |
| 133-e/f | 133 X3d | `docs/04` §4, X3c's tempo line | spliced inside 129-a | the mark-alone sentence is X3c's *behaviour* (entry 133's test table), not a sentence of X3c's row, so X3d's sentence is added |
| 133-g | 133 X3d, with 137-c | `docs/08` pieces, the tempo map | spliced | 53, after X3's row. The entry gave no first cell, so it names the reader and its consumers (from its own `docs/05` row) |
| 133-h/i | 133 X3d | `docs/08` unit, `tempoFromXml`, `scoreModelTempo` | spliced | 650, 587 |
| 133-j/k | 133 X3d | `docs/08`, `importSheet.test.ts`, `import-experience.spec.ts` | spliced in 118-h, 118-j | — |
| 133-l | 133 X3d | `docs/08`, `lessonClaimsAboutApp.test.ts` | spliced | 500 |
| 137-a | 137 X3e | `docs/05` §1, the combined paragraph | spliced, verbatim | 22–49, inside item 5 (*Timing*); code: `tempoFromXml.ts` 1–60, `extractScoreModel.ts` 144, `OsmdView.ts` 225, `evidence.ts` 314, `difficulty.ts` 277. The corpus counts are Entry 133's, attributed, not re-run |
| 137-b | 137 X3e | `docs/04` §4, the import door | spliced, verbatim | 1502–1504; code: `importStore.ts` 757–758, 819–820 |
| 137-c/d/e | 137 X3e | `docs/08` | spliced | 53, 654, 677 |
| 134-a/b/c | 134 X1 | `docs/04` §2, "Start session" | spliced, replaced as the entry says | 384–409; code: `sessionRun.ts` 39, 119–124, 535; `eligibility.ts` 209; `taughtByAncestry.test.ts` 587–647 (1.2's new row and practice row) |
| 134-d | 134 X1 | `docs/04` §2, the claim table's jam row | spliced, label corrected | 333 (judgement) |
| 134-e | 134 X1 | `docs/04` §2, the transfer offer's row | spliced, replaced | 334; code: `help.ts` 1155–1165 `cardLine`, 1424 |
| 134-f | 134 X1 | `docs/04` §2, the fixed pieces | spliced | 350–351 |
| 134-g | 134 X1 | `docs/04` §2, the jam bullet | spliced | 264–265; code: `session.ts` 1440–1468 |
| 134-h | 134 X1 | `docs/04` §2, the transfer paragraph | spliced at another anchor | 241 ("Only once it is kept." is absent; judgement) |
| 134-i | 134 X1 | `docs/04` §5, the summary bullet | spliced, one phrase corrected | 2515–2528; *played* or *saw* added (judgement); code: `help.ts` `SESSION_TEXT` |
| 134-j | 134 X1 | `docs/04` §5c | spliced | 2891–2894, at the result sheet bullet's end |
| 134-k | 134 X1 | `docs/04` §3e | spliced | 767–770, at D3c's bullet's end; code: `DrillScreen.ts` 227–240, `LessonScreen.ts` 887–900 |
| 134-l | 134 X1 | `docs/02` D8a | spliced | 636–640, after the first paragraph as the entry says; code: `session.ts` 1199–1215 |
| 134-m | 134 X1 | `docs/08` pieces | spliced, verbatim | 47, after G2's |
| 134-n/o | 134 X1 | `docs/08` e2e and unit, nine lines | spliced | 352; 603–609; 660 |
| 134-p | 134 X1 | `docs/04` U57's row | already present | line 559 (edited in place by X1) |
| 136-a/b | 136 Q76 | `docs/02` (2.4's songs, the D5 note, Part F), `docs/03` (§2's `[MUTO]` row and paragraph, `[MIDI]`, §3 4a) | already present | in Q76's change (key phrases: `docs/02` 560 and 1224; `docs/03` 73, 95, 177) |
| 136-c | 136 Q76 | `docs/08` pieces | spliced | 34, after Q75's; "(added: …)" put in the file's form; the test counts 12 and 9 match the files |
| 136-d/e | 136 Q76 | `docs/08`, `test_measured_truth.py`, `lessonClaimsAboutApp.test.ts` | spliced | 734, 500 |
| 136-f | 136 Q76 | `checks.json`'s map | already present | the `midi_to_musicxml.py` pattern names the build, the validator and `test_import_mutopia.py`; `docs/08` has no line for it |
| 136-g | 136 Q76 | backlog | not spliced | `docs/prompts/*` |
| 138-a | 138 G1b | `docs/04` §3f, after the lock line | spliced, verbatim | 869–876; code: `LessonScreen.ts` 201–208, `help.ts` `stageNine` |
| 138-b | 138 G1b | `docs/04` §5, after the summary's actions | spliced, verbatim | 2403–2416, inside the summary bullet; code: `help.ts` 609–686, `projectStore.ts` 282 |
| 138-c | 138 G1b | `docs/04` §6, after Skills | spliced, one sentence corrected | 3555–3562 (judgement); code: `ProgressScreen.ts` 274, 426–456 |
| 138-d | 138 G1b | `docs/05` §9b, after its opening | spliced, verbatim | 1077–1083 |
| 138-e | 138 G1b | `docs/01` §4.5, after `contacts` | spliced, as a table row | 266: the store list is a table; the entry wrote a bullet ("indexed `byItem`" from `db.ts` 1220–1221); outside the brief's files (judgement) |
| 138-f | 138 G1b, with 139-c | `docs/08` pieces | spliced | 45; G1c's four gains where 139 says |
| 138-g..n | 138 G1b | `docs/08` e2e and unit lines, `backup`, `encounterModel` | spliced | 312; 556, 561–563, 639; 388, 423 |
| 138-o | 138 G1b | `docs/00`, the proposed invariant | not spliced | the reviewer's to place; `docs/00` is not this seam's |
| 139-a | 139 G1c | `docs/04` §3, the stage list bullet | spliced, replaced | 640–641 |
| 139-b | 139 G1c | `docs/04` §3f, after *Plan.* | spliced, verbatim | 854–863; code: `PlanScreen.ts` 131–137, 329, 347–365 |
| 139-c..f | 139 G1c | `docs/08` | spliced | 45, 548, 309, 561 |
| 139-g | 139 G1c | backlog G83, G84 | not spliced | `docs/prompts/*` |

### Exit codes (each capture's first line is the command, its last `exit=`)

| Capture | Exit | What it said |
| --- | --- | --- |
| `verify-before.txt` | 0 | 131 rows; 0 code facts missing. Key phrases: 0 for every row to splice, 1 for the seven already present (120-a, 120-c, 130-e, 131-c, 136-a, 136-b, 136-f) |
| `splice.txt` | 0 | 93 operations, each anchor found once, all spliced |
| `splice-second-pass.txt` | 0 | the one row the first pass lacked (119-g) spliced; the other 93 already present |
| `splice-rerun.txt` | 0 | 94 of 94 already present; nothing written |
| `verify-after.txt` | 0 | 131 rows; every key phrase once; 0 code facts missing |
| `checks-for-paths.txt` | 0 | for the six docs and this entry: the five unit files that read `docs/04`, and `test_named_by_what_they_are.py` for `docs/02` |
| `npm-ci.txt` | 0 | `app/node_modules` was missing; installed |
| `parity-reference.txt` | 0 | five reference files written; the three MAESTRO recordings skipped as not fetched here |
| `content-build.txt` | 1 | the offline build in this worktree fails validation on a partial catalogue: variants, alternatives and sections naming rows the offline import did not write, and `ladder.md` stale. X3c, X3d and X3e recorded the same |
| `restore-reports.txt` | 0 | `docs/prompts/inventory.md` and `rung-claims.md`, which that build rewrote, put back byte for byte from copies taken before it; `SOURCES.md` unchanged |
| `copy-content.txt` | 1 (robocopy: files copied, no failures) | `app/public/content` copied from the main checkout, as the brief allows. That build's commit was not checked from here |
| `content-validate.txt` | 0 | validation OK on the copied content, 2092 catalogue items. The warnings are the five stale-by-cut-version excerpts and the claim deferrals. The views were regenerated, 0 of them stale, and no tracked file changed (`git status`) |
| `vitest-docs-readers.txt` | 0 | 6 files, 52 tests: `docsConsistency`, `help`, `labHelp`, `progressHistoryLines`, `sightReadingFromReadingState`, and `libraryImportWords`, which reads `docs/03` although the map does not name it. A first run before the content was copied, overwritten by this one, failed to load `sightReadingFromReadingState` for want of `curriculum.json`, and passed the other 34 tests |
| `content-test-named.txt` | 0 | `test_named_by_what_they_are.py`, 4 tests (reads `docs/02`) |
| `content-tests-docs.txt` | 0 | `test_prompt_views`, `test_checks_for_paths` and `test_named_by_what_they_are`: 34 tests OK |
| `diff-numstat.txt`, `diff-stat.txt` | 0 | 6 files, 384 insertions, 54 deletions, each deletion a line changed in place |

The captures' machine paths are replaced by `<worktree>`, `<main checkout>`, `<scratchpad>` and `<home>` (`scripts-sanitise.py`).

**Unverified** (beside what passes):
- Numbers the entries carry from their own runs: mutant counts, red counts, Entry 133's corpus counts ("179 of 2,011"), G1a's "15 of 63". They are attributed as the entries wrote them and not re-run.
- Behaviour is checked against the code as read, not by running the app. This seam has no browser layer.
- Every "unverified as music" and "unverified as pedagogy" the rows carry stays unverified.
- Whether the reviewer wants the earlier entries' rows here (Question 1).
- CI has not run this tree.
