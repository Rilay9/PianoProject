### Entry 179 — G96a — a PDF's Details says what its provenance holds: an estimated level and an imported PDF, never a guessed level or a song

**Base.** 827289d0, origin's head (`git log -1 --format=%h` in the worktree, before any work). G96's one required change under the fast path (`docs/review/responses/48bfc167.md`, *One required change — G99 stays on this seam*, copied as the instruction); G96's brief, Entry 168 and `handoffs/48bfc167.md` still bind. Nothing heard (nothing here sounds). The sheet seen in Chromium at 342 × 740 only; unverified with a screen reader.

## Judgement first

**What a learner reads** (`pictures/g96a/before-` and `after-pdf-details-342x740.png`: `two-systems.pdf` imported through the Library's picker, its row's *Details* opened, the sheet as it first appears; the facts read from the DOM in `runs/G96a/pictures-facts-before.json` and `-after.json`):

- **Before:** *Level ≈ L5.0 · Hands Hands together · Type song · What it trains — · Source Imported by you · Licence user-imported*, then *The app guessed this level from the music itself — change it if it feels wrong.* over two lines, *Your level 5.0 · Re-level*, *Open*.
- **After:** the same sheet with *Type PDF* and *Estimated level — change it if it feels wrong.* on one line. Every other word, control and position is unchanged. The panel is one line shorter, and whole in the viewport with nothing scrolling inside it on both builds.
- **What that means to a learner.** The 5.0 now reads as an estimate to correct if it feels wrong, which is what it is: the default every import with no level gets. The type says *PDF*, as the row's badge *PDF · pages, not notes* already did. The sheet no longer says the app read music it never read.

**Pedagogical verdict.** Nothing taught changes. No lesson, curriculum, score or judgement moves, and the level number, *Re-level* and *Open* are as they were. A false claim is gone from a sheet a learner reads when deciding whether a piece is for them. No file under `content/` or `scores/` is touched, so there is nothing to itemise under §12.

**Technical verdict.** Each statement now follows the row's own provenance (`kind: 'pdf'`), at the one line that produces it. Every other estimated level keeps its sentence, and a guard case holds that. Passing: tsc, lint, the build, the touched unit file, `library.spec.ts`, and the map's other three specs for `LibraryScreen.ts`. The whole unit suite has eight reds, each attributed below, none in a file this seam touches.

**Post-action read-back.** I read back the pictures and the DOM facts, not only the tests. The reviewer's ruling stands as written: the offer, the focus resolver and `getProgress` are untouched. No learner data, evidence, identity or curriculum meaning moves. The adjacent faults below are recorded, not taken on.

## The mechanism and the discriminating test

- **Where the two statements came from.**
  - `LibraryScreen.ts` `showDetail` wrote `['Type', item.type]`, and for any `levelSource === 'estimated'` the one sentence *The app guessed this level from the music itself …*.
  - The catalogue row a PDF import becomes (`importStore.importToCatalogItem`) carries `type: 'song'`, as every import's row does. Where the stored row has no level, it carries `level: 5` with `levelSource: 'estimated'`: "a placeholder rather than a judgement".
- **The app never estimates a PDF's level.**
  - `estimateLevelFor` returns `undefined` unless `row.kind === 'musicxml'` with a string score (`score/estimateImport.ts`). Its callers ask it only of MusicXML (`assignSheet.ts` :325, `importSheet.ts` :438).
  - `addImport` measures no notes of a PDF (*a PDF: the app reads no notes from it*; `03` §4a, a PDF is never handed to the detectors).
  - The assign sheet saves a PDF's level as `judged` (`estimated === undefined`).
  - So a PDF's `estimated` is always the import default, or the number a score folder's manifest supplied (`folderLibrary.ts`). It is never a guess from the music.
- **The fix,** at the same two lines, read from the row's provenance:
  - *Type* reads `PDF` where `item.kind === 'pdf'`, and `item.type` otherwise;
  - the estimated sentence is *Estimated level — change it if it feels wrong.* where `item.kind === 'pdf'`, and unchanged otherwise.
  - `kind` is the discriminator because every PDF row carries it, including one imported before provenance (E0), which has no `provenance.source`.
- **The alternative, and the test that told them apart.**
  - Alternative: the sentence is false for every estimated level, so it should be neutral everywhere.
  - Refuted for this seam. Where the app did estimate from the notes, the specific sentence is true: a MusicXML import whose stored level the estimator wrote, marked estimated, which is what the assign sheet saves when the learner keeps the estimate.
  - The guard case (*where the app did estimate from the notes the sentence stays; a PDF level the learner judged says neither*) holds that, and mutant 2 (the neutral sentence everywhere) turns it red.
  - A default level on a MusicXML import is the case `levelSource` alone cannot tell apart from an estimator's. It is Follow-up 1, recorded and not fixed: the reviewer ruled out a redesign of level provenance here.
- **No other place says it.**
  - A grep of *guessed this level* and *from the music itself* over the whole worktree finds, in `app/src`, `LibraryScreen.ts` alone. There are no hits in `content/` or `docs/04`. The other hits are records: the backlog and its view, entries, handoffs, responses, pictures' facts, a trace.
  - The Details' *Type* line is `showDetail`'s alone. `item.type` is printed on two other screens (Follow-up 5).

## Done

1. **Both false statements pinned red first.**
   - **Unit** (`libraryImportWords.test.ts`, a new describe). It goes through the real screen, store and catalogue path: the PDF is imported through the Library's picker and its row's *Details* clicked.
     - *a PDF with no level: the level is estimated, never guessed from the music*, red on the committed code: `expected 'two-systemsCloseLevel≈ L5.0HandsHands…' not to contain 'The app guessed this level'`.
     - *a PDF: its type reads PDF, never song*, red: `expected 'song' to be 'PDF' // Object.is equality`.
     - The guard is green on the committed code: `Tests 2 failed | 1 passed | 8 skipped (11)` (`red-unit-committed.txt`).
   - **Browser** (`library.spec.ts`, *a PDF's Details says an estimated level and PDF, never a guessed level or a song (G96a)*; soft checks, so each statement reports). The before build, `dist-before`, was built from 827289d0 before any edit. Red on all three:
     - `Expected: "PDF"` / `Received: "song"`;
     - `Expected substring: not "The app guessed this level"`;
     - `Expected substring: "Estimated level — change it if it feels wrong."`
     - (`red-e2e-committed.txt`)
2. **The fix,** in `LibraryScreen.ts` `showDetail`: two expressions and their comments. Green:
   - `libraryImportWords.test.ts`, 11 of 11 (`green-unit-file.txt`);
   - the browser case alone (`green-e2e-new.txt`);
   - `library.spec.ts` whole, 17 of 17 at two workers (`e2e-library.txt`).
3. **Mutants** (`scripts-mutants.py`, `mutants.txt`). Each one edits the source, runs the three G96a unit cases, then restores the file, checked byte for byte:
   - 1, the old wording restored on both lines: the two PDF cases red, the guard green;
   - 1a, the old sentence alone: the level case red;
   - 1b, the old type alone: the type case red;
   - 2, the neutral sentence everywhere: the guard red.
   - In the browser, the committed build is mutant 1 (the same two lines), red above. No separate mutant bundle was built.
4. **Pictures** before and after at 342 × 740 (above). `scripts-zz-g96a-pictures.spec.ts` was copied into `app/tests/e2e/` for the two runs and then removed.
5. **The rest of the chain,** as the map prints it for the touched paths (`checks-for-paths.txt`: tsc, lint, the whole unit suite, the app build, and `doors`, `finder`, `library`, `modes-rhythm-only`):
   - `npx tsc -b` exit 0; `npm run lint` exit 0 (Deviation 3); `npm run build:app` exit 0;
   - `doors`, `finder` and `modes-rhythm-only`: 36 of 36 at two workers (`e2e-map-rest.txt`), each file checked to exist first;
   - the whole unit suite: 7,399 passed, 8 failed, 1 skipped, 1 todo (`unit-all.txt`). The eight, each rerun alone or read:
     - the two `lessonClaimsAboutApp` line-ending claims (4.7 and blues.3; the CRLF pair, Entry 101). The file's one `LibraryScreen.ts` claim, the track titles, passed.
     - `firstContactOnTheScore` (2): pass alone (`unit-alone-failures.txt`).
     - `midiParity`, *no reference in <worktree>/build/midi-parity*: the setup's `parity_reference.py` was not run (the content was copied, not built).
     - `taughtByAncestry`, *ENOENT build/rung-claims.json*: the content build was not run.
     - `expectedNote` and `tempoSoundAgainstMark`: timed out at 5 s alone, then passed with `--testTimeout=30000` (`unit-alone-timeouts-30s.txt`, 18 of 18).
     - None of the six files reads `LibraryScreen.ts` except `lessonClaimsAboutApp`, and its failing claims are not that one.
6. **The premise checked at the lines.**
   - The G99 row's `LibraryScreen.ts` :764–774 is :765–775 at the base.
   - `03` §4a says what a PDF row carries (`imported-pdf`; never handed to the detectors). The code agrees.

## Not done

- The map's specs at four workers on 4173: run at two workers on 4591, because 4173 is the main checkout's and the brief names two workers.
- A screen reader, and any size but 342 × 740.
- The non-PDF cases of the same sentence and the other defaults shown as facts (Follow-ups 1–4): outside the fast path's scope, by the reviewer's words.
- `docs/04` and `docs/08` are not edited directly. The rows are below. `docs/04` quotes neither string (grep), so no `04` sentence had to change in the seam.
- The fresh-worktree content build and parity reference: the brief's harness said to copy `app/public/content`, so two unit files that need the build's outputs could not pass here (Done 5).
- **The record block, for the orchestrator.** With `docs/prompts/runs/*` in the diff, the map also prints `record_mirrors.py` and `test_record_mirrors` (`checks-for-paths-with-docs.txt`). `python tools/docs/record_mirrors.py --check` exits 2: *entry-without-brief: docs/prompts/runs/G96a/ENTRY.md:1: Entry 179 names 'G96a', which no record block declares*. `test_record_mirrors` fails its two tree tests on the same line (`record-mirrors-check.txt`, `test-record-mirrors.txt`). With this entry moved aside for a moment, both pass: *fresh*, 36 tests OK. A `## Record` block declaring G96a (entry 179) is the record script's to add. I edit no brief.

## Deviations

1. *Type* reads **PDF**, not *Imported PDF*. The reviewer allowed either. *Source*, two rows below, already says *Imported by you*, so *Imported PDF* would say one fact twice.
2. The Playwright config copy, the before bundle, the pictures and Playwright's output lived under `app/build/g96a/` (ignored), not under the worktree root's `build/`, because a config outside `app/` does not resolve `@playwright/test` (G96's deviation 5). The logs of `npm ci` and the before build and the probe's scratch file went under the root's `build/g96a/`.
   - Port 4591, set in the copy `app/build/g96a/playwright.g96a-4591.config.ts`. It spreads the base config and overrides:
     - `testDir`, absolute;
     - `baseURL`, `http://localhost:4591/PianoProject/`;
     - `use.storageState`, an absolute path to the fixture re-keyed to `http://localhost:4591`;
     - `webServer`: `npx vite preview --port 4591 --strictPort --outDir <G96A_DIST>`, cwd `app/`, no reuse;
     - `outputDir`.
   - `scripts-run-e2e.sh` checks that each spec file exists and that 4591 is free before each run.
3. `npm run lint` was run with `app/build/g96a/` moved out of `app/` for the run and put back. With it inside, eslint read the before bundle and failed on files under `app/build/g96a/` only: the harness, not the tree. That first log was overwritten by the clean run (`lint.txt`).
4. The unit cases reach the sentence source by rendering the real `showDetail` through the Library screen, with no new export. A case on a new pure function could not be red on the committed code except as a missing import. The rows come through the real `addImport` and `importToCatalogItem`, so the `estimated` mark is the store's, not a hand-written fixture.

## Follow-ups

Observations for the checkpoint, attached to G99's cluster: the Library's level and type facts say what the row knows. None is fixed here.

1. **A MusicXML import filed through the Library's picker** (its staves and signature its own, so no sheet opens and nothing estimates it) reads *≈ L5.0* and *The app guessed this level from the music itself — change it if it feels wrong.* That is false in the same way as G99: the 5 is `importToCatalogItem`'s default. Observed through the real screen in jsdom (`scripts-probe-musicxml-no-level.py`, `probe-musicxml-no-level.txt`); not seen in the browser. Telling a default from an estimate needs the catalogue row to carry whether a level was stored, which is a level-provenance change.
2. **The accompaniment lab's build** is stored with `level: 3, levelSource: 'estimated'`, "a placeholder rather than a judgement" (`LabScreen.ts` :318–322). Same sentence, same class. Read in the code.
3. **The Library's *Edit* sheet** saves a typed level without `levelSource: 'judged'` (`showEditor`). A level the learner typed stays marked `≈` and gets the estimated sentence: *Estimated level* on a PDF, *guessed from the music* on MusicXML. The Details' *Re-level* (`levelOverrides`, judged) is the path that marks it. Read in the code.
4. **A PDF's Details says *Hands: Hands together*.** Every import's row carries `hands: 'both'`, and the app reads no hands from a PDF: an unknown shown as a fact, the same class as *Type: song*, which the reviewer did not name. Seen in both pictures.
5. **Other places `item.type` shows.** The Library's type filter *Songs* keeps PDF imports (`matches` reads `item.type`, :157). `item.type` is also printed on Today's swap list (`TodayScreen.ts` :476) and the Skills list (`SkillsScreen.ts` :343). Whether a PDF import reaches either list was not checked.
6. **`importProvenance('pdf')` writes a level fact that never happens.** It records `facts.level` as *inferred, the runtime level estimate* for a PDF, which that estimate never produces. A grep of `app/src` found no reader of `facts.level`, so no screen says it: a data smell, and by the anti-loop rule an observation only.

## Questions

1. **For the reviewer, at the checkpoint.** Follow-ups 1 and 2 are the same false sentence as G99, on MusicXML rows. Should they be one row under G99's cluster, or stay observations? My read: attach them; 3–6 stay observations.

## Files

- `app/src/ui/screens/LibraryScreen.ts`: `showDetail`, the *Type* fact and the estimated sentence, with their comments.
- `app/tests/unit/libraryImportWords.test.ts`: a header line; `updateImport` imported; the G96a describe, three cases.
- `app/tests/e2e/library.spec.ts`: one test.
- `docs/prompts/runs/G96a/`: this entry, the scripts (`scripts-run.sh`, `scripts-run-e2e.sh`, `scripts-mutants.py`, `scripts-zz-g96a-pictures.spec.ts`, `scripts-probe-musicxml-no-level.py`, `scripts-sanitise.py`), the logs and the facts.
- `docs/prompts/pictures/g96a/before-pdf-details-342x740.png`, `after-pdf-details-342x740.png`.

## The tests

| Test | Class | Old assumption |
| --- | --- | --- |
| unit *a PDF with no level: the level is estimated, never guessed from the music* | add | none: no test pinned what a PDF's Details says under its level |
| unit *a PDF: its type reads PDF, never song* | add | none |
| unit *where the app did estimate from the notes the sentence stays; a PDF level the learner judged says neither* | add (a guard on what is kept) | none |
| e2e *a PDF's Details says an estimated level and PDF, never a guessed level or a song (G96a)* | add | none |

No test asserted the old wording: a grep of the two strings and of `['Type'` over `app/tests` found only the new cases. Nothing is replaced.

## Red and green lines

- Red, unit: `AssertionError: expected 'two-systemsCloseLevel≈ L5.0HandsHands…' not to contain 'The app guessed this level'`, and `AssertionError: expected 'song' to be 'PDF' // Object.is equality`.
- Red, browser: `Expected: "PDF"` / `Received: "song"`, then `Expected substring: not "The app guessed this level"`, then `Expected substring: "Estimated level — change it if it feels wrong."`
- Green: `Tests 11 passed (11)`; `1 passed`; `17 passed`; `36 passed`.

## Exit codes

- npm ci: 0.
- The before build: 0.
- `red-unit-committed.txt`: 1, the red.
- `red-e2e-committed.txt`: 1, the red.
- `pictures-before.txt`: 0. `pictures-after.txt`: 0.
- `green-unit-file.txt`: 0.
- `tsc.txt`: 0.
- `lint.txt`: 0, with the harness moved out; 1 with it inside (Deviation 3).
- `build-app.txt`: 0.
- `green-e2e-new.txt`: 0. `e2e-library.txt`: 0. `e2e-map-rest.txt`: 0.
- `mutants.txt`: each mutant 1, the script 0.
- `unit-all.txt`: 1 (the eight above). `unit-alone-failures.txt`: 1 (four of 69: the two environment reds and the two timeouts). `unit-alone-timeouts-30s.txt`: 0.
- `checks-for-paths.txt`: 0. `checks-for-paths-with-docs.txt`: 0.
- `record-mirrors-check.txt`: 2. `test-record-mirrors.txt`: 1. Both are the missing record block (Not done); both are 0 and OK without this entry.
- `probe-musicxml-no-level.txt`: 0.

## Unverified

- A screen reader. Any size but 342 × 740. Any browser but Chromium. Nothing heard.
- A PDF with a folder manifest's level: inferred from `folderLibrary.ts`, not driven. It gets the same sentence, since the discriminator is `kind`.
- CI has not run this tree. The content under `app/public/content` was copied from the main checkout, whose head may differ from 827289d0. This seam reads no content.
- Follow-ups 2 and 3 were read in the code only.

**Orchestrator's note at the landing (2026-09-30).** G96a's worktree committed by name (67fc2523) and merged (2330337c). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/G96a/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 1; e2e-rerun 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner — the targeted specs' failures passed alone (`e2e-rerun`); the note names them; `runs/G96a/orchestrator-exit.txt`). Your one required change on G96 (`responses/48bfc167.md`: G99 on this seam under the fast path, both false statements pinned red first, no redesign of level provenance). The app chain on the merged tree: map, tsc, lint, the unit suite whole (322 files; the two reds are Entry 101's recorded line-ending assertions), the app build, the map's four browser specs (doors, finder, library, modes-rhythm-only): 52 passed and one refused a connection on 4173 mid-run (the R3 case at library.spec.ts:228, net::ERR_CONNECTION_REFUSED), the file green alone in the rerun (e2e-rerun; 4173 held no listener); the second read's caveat A (the sheet's Type only, CatalogItem.type untouched) holds in the built change; the landing clerk found no model name or machine path in the landed files and every cited file present. The rerun script truncated the chain's exit file, restored from the logs. Pushed with the next batch.

## Doc rows

- **`04` §4, the item detail sheet (:1526–1529).** Add: "A PDF's detail sheet reads *Type: PDF*, and under its estimated level *Estimated level — change it if it feels wrong.*: the app reads no notes from a PDF, so it never says the level was guessed from the music. Any other estimated level keeps *The app guessed this level from the music itself — change it if it feels wrong.* (G96a)."
- **`08` :54, the import experience.** Faults: add "a PDF's Details calling its level guessed from the music, or its type *song* (G96a)". Tests: add `tests/e2e/library.spec.ts` (G96a) beside `libraryImportWords.test.ts`.
- **`08` :277, `library.spec.ts`.** Add "a PDF's Details reading *Type: PDF* and an estimated level, never a guessed one (G96a)".
- **`08` :522, `libraryImportWords.test.ts`.** Add "a PDF's Details: an estimated level and *PDF*, never a level guessed from the music or *song*; the guessed sentence kept where the estimator read the notes (G96a)".
