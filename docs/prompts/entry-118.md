### Entry 118 — X3: the import experience — an import ends in one sheet that says what the app read and what it guessed, each guess with whose it is; *Swap the hands* saved through the store, the conversion note and the demands following the row (U72); *Where does it belong?* the assign sheet's body with T52's sentence; the Library row's state in words and the placeholder sheet without ids (U75); the rock frame out of its two sentences (E45); the tempo control held (E48), no key control (E49) (2026-09-29)

**Judgement.** Nothing was heard. What I looked at: the sheet, the Library row, the placeholder sheet and the Score screen at 342 × 740 on the production build (`docs/prompts/pictures/x3/`, the texts in `x3-pictures.json`), for a MIDI file I wrote for the case this correction is for — two tracks, the left hand's first (`tests/fixtures/imports/left-hand-first.mid`, four bars of C major, no tempo event).

- **Before the swap.** The sheet opens by itself from the row `addImport` returned. *What the app read*: 4 bars, no sharps or flats, "Checked: all 23 notes the reader found are in the score, and every bar adds up." *What the app guessed*: "Hands · from the file — The file's two tracks were kept as recorded: the first (Left hand) is the upper staff, the second (Right hand) the lower. …"; "Tempo · the app's guess — The file states no tempo, so the app chose ♩ = 100."; the metre, key and grid sentence. *What the notes ask*: "…the bass-staff notes, the ledger-line notes, steps, skips, leaps, …". The score as the Score screen engraves it (`score-before-swap.png`): the bass line on the treble staff under a stack of ledger lines, the tune on the bass staff over another. A teacher would say at once the hands are the wrong way round, and the sheet's own words name it.
- **After *Swap the hands*.** "Hands · yours — You corrected the hands after the conversion, so what the converter decided about them no longer stands: the hands are yours." The notes line loses "the ledger-line notes"; the level estimate moves down (≈ 2.63 to ≈ 2.47). The engraved score (`score-after-swap.png`): the tune in the treble staff, the bass line in the bass staff, no ledger line either side — as an engraver would write it. The tempo line is unchanged, still the app's guess; the Score screen practises at 70 % of it (70 bpm, the default percentage), which is its own existing control.
- **The Library row** (`library-row.png`): "≈ L2.5 · converted from MIDI" and under it "hands corrected · measured · tempo guessed", whole at 342 px.
- **The placeholder sheet** (`placeholder-sheet*.png`): no *Tracks: film-game*, no *What it trains: import-only*; the piece's own `importHint`, "The app reads MusicXML, MXL and MIDI; a PDF opens as pages.", and an *Import a score* button.

**The learner path, proven** (the reviewer's post-build check, `responses/ef80e86.md`): import UI (the Library's picker, `import-experience.spec.ts`; the share cache, its second case; the real `LibraryScreen` in jsdom, `libraryImportWords.test.ts`) → the stored row `addImport` returned (`LibraryScreen.takeFiles` → `openImportFor(lastRow)`; `takeSharedFiles().then(({ added }) => openImportFor(last))`) → the import sheet (`#assign-sheet[data-sheet="import"]`) → the hand correction (`importStore.correctImportHands` with the swapped MusicXML; the stored `data` changed, `hands` `authored` via the learner, `demands` via "on the corrected score") → the current provenance (the sheet re-rendered from the returned row; the conversion note's hands sentence derived from it) → the assignment decision (no rung; `lessonIds: []`) → the Library's state (the row's two lines) → explicit play (the row opened, the Score screen engraves the corrected score). **No UI side effect inside the store**: no `src/data` module imports or calls a sheet (a source scan), and `addImport` leaves the document with no sheet. **No evidence from import or assignment alone**: after import, swap, Save on no rung and Not now, the `sessions` store is empty and `progress` has no row for the piece (browser and unit); one run recorded as the Score screen records it is one run.

## Done

1. **The import sheet** (`app/src/ui/importSheet.ts`, new). Opened by the UI callers that hold a row — the picker and drop target, the share path, *Import for this rung*, the row's *Assign* — never by the store. Three sections in order, then *Where does it belong?* with T52's sentence and the assign sheet's body (`assignSheet.appendAssignControls`, reused unchanged). Each guess carries whose it is (`help.whoseFact`: `inferred` → the app's guess; `authored` → from the file, or yours where `via` names the learner, the store's own reading). *Swap the hands* (`swapHands` then `correctImportHands`, the level re-estimated through `estimateLevelFor` and shown unless the learner typed one). Refused, with the reason on the sheet, for one staff, separate parts, or a note with no staff. The sheet keeps the id `assign-sheet` with `data-sheet="import"`: every door, spec and style rule reading that id finds the sheet a learner now meets.
   - *Technical:* 15 unit cases, 2 browser cases, 4 mutants red. *Pedagogical:* the swap keeps each staff's clef, so the case it is for (a file whose first track is the left hand's) comes out as an engraver writes it (seen above); unverified as music beyond that picture.
2. **The conversion note follows the correction (U72)** on both sheets: `assignSheet.conversionHands(note, row)`; the converter's sentence only while its guess stands.
3. **The Library's words (U75 and the state).** An import's detail line says where its notes came from in place of "song" (`help.importSourceWords`); a state line under it (`help.importStateWords`). The placeholder sheet drops *Tracks* and *What it trains*; any sheet names a track by its title only and leaves out an id with none; `importHint` stays the piece's words; *Import a score* beside them (`04` §0 R4).
4. **E45.** `session.ts`: "A song you have not imported yet is not a dead row"; `docs/03` line 72: "the pieces wanted by name (the owner's requests and the *Beautiful* suggestions)".
5. **Never an automatic offer.** No path to Today or a rung's controls; the sheet imports no session, selector, Today, progress or rung-state module (a source scan). Its lead line says the piece is the learner's own and measured, never "approved" or "counts".

## Not done

- **Set the tempo: held, not done.** `importStore.ts` in this tree has no `stateImportTempo` (grep of `app/src`). The reason is written at the control's place in `importSheet.ts`. The words already read a learner's stated tempo as theirs (a constructed row). It needs E48's store operation.
- **No key control** (the reviewer's question 2; E49).
- **The sheet does not open by itself after every import** (the brief's literal "in place of the toast"). It opens where the app guessed: a MIDI file, or a score whose stored provenance says its hands or key were inferred (the command-line converter's MusicXML). It also opens where the import came with a rung in mind (share, *Import for this rung*). A plain MusicXML, MXL or PDF import from the Library files quietly, as `04` §4 has it ("a plain Library import does *not* open it … filing, not answering"), and its row's *Assign* opens the sheet. Why: for a file whose staves, key and signature are its own, the app guessed nothing a learner can correct but the tempo, which is held. And the sheet is modal (`openSheet` makes the screen inert), so opening it after every import would stop library, chart, shelf, doors, wide, pdf, pdf-paper, guide-shots and finder's no-rung case at their next tap. Question 1.
- **No *Open* control on the sheet.** "Try" is the learner opening the row (the reviewer: "explicit play"); the T52 regression holds through that path.
- **The score folder's *Assign*** still opens the plain assign sheet (`FolderScreen.ts`, outside X3's files; U72 reaches it through the shared helper).
- **No red for the browser case on a committed build.** Building the committed tree would mean swapping five source files and moving the new test files out for a build. The same seam's red — the real `LibraryScreen` with the real store opening the bare assign sheet — is the unit red below.

## Follow-ups

1. **P2** — `FolderScreen`'s *Assign* could open the import sheet (`openImportSheetFor` for `openAssignSheetFor`, one line).
2. **P2** — a one-line melody the converter split (E2's picture) needs "one hand plays it all", not a swap; the next correction path beside `correctImportHands`.
3. **P2** — ids elsewhere on the detail sheet: "What it trains" prints concept ids on every row, though the curriculum carries display names. An import's sheet prints "Tracks" nowhere now but "Licence: user-imported" still.
4. **P3** — the conversion guesses sentence prints "on a grid of 1/4 quarter" (the converter's grid string; pre-existing).
5. **P3** — a MIDI file with no tempo event: the MIDI standard's default is 120 per quarter, the app's 100 (OSMD's); the sheet says what the app does. The converter's owner's.
6. **P3** — a score writing its hands as two parts cannot be swapped (refused with the reason).
7. **P3** — `lessonClaimsAboutApp.test.ts` has two checks that search `ScoreScreen.ts` and `style.css` for "\n"-joined text. They fail on a CRLF checkout (`crlf-check.txt`), on files X3 did not touch.

## Questions

1. **Should every Library import open the sheet**, overturning `04` §4's plain-import rule? The change is one condition in `LibraryScreen.takeFiles` (`assign || guessedFor(lastRow)` → `true`) plus a *Not now* in the nine specs named above.

## The words (help.ts `IMPORT_TEXT`; one table for the sheet, the row and `04` §4)

| Where | Words |
| --- | --- |
| Sheet lead | Your own score. The app measures what its notes ask and does not grade the piece; where it belongs is yours to choose. (PDF: Your own PDF. The app shows its pages and reads no notes from it; …) |
| Sections | What the app read · What the app guessed · What the notes ask · Where does it belong? |
| Read | Composer · Length (*N bars*) · Key signature (*one sharp*; with the file's mode, *E minor: one sharp*; never a key named from a signature alone); PDF: A PDF: pages, not notes — the app reads no notes from it. |
| Whose | the app's guess · from the file · yours · not recorded |
| Hands | Split by the shape of the lines, not at a fixed middle C. · The file's own two tracks, kept as recorded: the first is the upper staff. · The file's own staves. · Written by the command-line converter from a MIDI file, which does not say whether it kept the tracks or split one line. · You corrected them, and the notes were measured again on your score. (While this visit's conversion note stands, its own sentence.) |
| Tempo | The file says ♩ = N. · The file states no tempo, so the app chose ♩ = 100. · You stated ♩ = N. |
| Key (estimated only) | Estimated from the notes; the app printed *signature*. · The command-line converter may have estimated it from the notes; the file does not say. |
| Swap | Swap the hands · If the upper staff is really the left hand's, this gives each staff's notes to the other hand. Each staff keeps its clef. · Swapped: the hands are yours now, and the notes were measured again. · refusals: One staff … · separate parts … · a note with no staff … |
| U72 | You corrected the hands after the conversion, so what the converter decided about them no longer stands: the hands are yours. |
| Row | detail line: *read from the file* / *converted from MIDI* in place of "song"; state: hands corrected / hands guessed · measured / not measured yet / could not be measured · tempo guessed / tempo yours |
| Placeholder | `importHint` (else: Import your own copy; the app reads MusicXML, MXL and MIDI.) · The app reads MusicXML, MXL and MIDI; a PDF opens as pages. · [Import a score] |

"Tempo guessed", not the brief's "tempo not stated": the sheet's word for the same fact. With the source first, the four tokens overflowed the state line at 342 px, cut mid-word (`scrollWidth` above `clientWidth`, first pictures run). Split as above, the line is whole (`scrollWidth` equal to `clientWidth`).

## The red lines (`red/`, once)

- `red-committed-code-unit.txt`, the new unit files on the committed code:
  - `importSheet.test.ts`: `Failed to resolve import "../../src/ui/importSheet"` (absence, not discriminating).
  - `libraryImportWords.test.ts`: 8 of 8 red. The placeholder sheet `expected 'Final Masquerade…' not to contain 'import-only'`. A playable row `not to contain 'film-game'`. The picker's MIDI import and the row's *Assign* opening no `[data-sheet="import"]`. No state line. `session.ts` matching `/rock-module/`. `importStateWords is not a function`.
  - A copy of the U72 case against the committed `openAssignSheet`: `expected 'The file's two tracks were kept as re…' to contain 'the hands are yours'`. The copy was written for the run and removed.
- `mutant-*.txt`, `mutants-summary.txt`, each restored with sha256 checked (`scripts/mutants.py`):
  - the note not derived: 2 red;
  - the swap not through the store: 1 red;
  - the Library opening the bare assign sheet: 2 red;
  - an inferred fact said as the file's: 4 red.

## Tests

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `app/tests/unit/importSheet.test.ts` (15) | add | — | the sections from constructed rows (inferred, authored, a stated tempo, a PDF), the held tempo, U72 on both sheets, `swapHands` (exchange, clefs kept, twice = the file, refusals), the swap through the store, no run from the sheet, the store opening nothing |
| `app/tests/unit/libraryImportWords.test.ts` (8) | add | — | the source and state words, the row, the picker's import opening the sheet through the real screen, a plain score filing quietly and its *Assign*, the placeholder sheet and track titles, E45's two sentences |
| `app/tests/e2e/import-experience.spec.ts` (2) | add | — | the learner path above on the production build; the share door |
| `app/tests/fixtures/imports/left-hand-first.mid`, `make-left-hand-first-midi.py` | add (fixture) | — | the left hand's track first, no tempo |
| `midi-import.spec.ts`, `converted-import.spec.ts` | preserve | — | green, unedited |
| `finder.spec.ts`, `library.spec.ts`; `sweeps.spec.ts` (placeholder, no estimate); `doors.spec.ts` (imported row) | preserve | — | green, unedited; run because X3 changes the sheet and rows they assert on |
| `assignmentIsNotEvidence.test.ts` (T52's regression) and the import, folder, Library and words files | preserve | — | green |
| `lessonClaimsAboutApp.test.ts` | preserve | — | 2 red here on line endings alone (Follow-up 7), 282 green |

No test was revised or deleted.

## Exit codes (the last line of each capture, `docs/prompts/runs/X3/`)

| Run | Exit |
| --- | --- |
| `npm ci` (`npm-ci.txt`); the copies (`copy.txt`: kern, musetrainer, `build/cache/convert`, the three caches) | 0; 1 each (robocopy: copied) |
| `parity_reference.py` | 0 (the three real-MIDI inputs absent, skipped) |
| content build offline (`content-build.txt`) | 0; `SOURCES.md`, `inventory.md`, `rung-claims.md` restored byte for byte |
| the fixture script | 0 |
| red on the committed code (`red/red-committed-code-unit.txt`) | 1, as intended |
| the new unit files: `green-1`, `green-2`, `green-3` | 0 each (23 passed) |
| `npx tsc -b`: `tsc-1`, `tsc-2`, `tsc-3`, `tsc-4`, `tsc` final | 2 (a readonly literal in the tests), 0, 0, 0, **0** |
| `npm run lint`: `lint-1`, `lint-2`, `lint` final | 1 (a `let`, four needless casts), 0, **0** (override config removed) |
| the named and import unit files (`vitest-named-final.txt`, 20 files) | 1: 527 passed, 4 skipped, 2 failed (the CRLF pair, `crlf-check.txt`) |
| `scripts/mutants.py` | 0 (harness); 4 mutants, each red |
| `npm run build:app`: `build-app-1`, `-2`, final | 0, 0, **0** |
| Playwright, port 4263, one worker, override inside `app/`: the three import specs (`e2e-import-specs-1`, `-2`, final) | 0 (9 passed) each |
| Playwright, the consumers (`e2e-consumers-1` to `-4`) | 0 each (23; 3; 23; 3 passed) |
| the pictures (`pictures-run-1` to `-4`) | 0, 0, 1 (my test: after a reload the list is by level; *Only mine* added), 0 |

Port 4263 free before and after every run; no build while Playwright ran; one run at a time. The override config and the pictures spec are in `scripts/`.

**Orchestrator's note at the landing (2026-09-29).** X3's worktree committed by name (070a6f7) and merged (6f6fa6e) over F2a, E-tail, U74, Q-tooling and G1. The chain on the merged main checkout (app code only): typecheck, lint, the whole unit suite, the app build, and the import-experience, MIDI and converted import, library, finder, doors and Today specs on the default port (tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the unit suite's two failures are the recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis), which pass on the runner; every other file passed; `runs/X3/orchestrator-exit.txt`). The tempo control was held because the worktree predated the E-tail's `stateImportTempo`; E48 landed the same night, so X3a (`tasks/X3a-tempo-control.md`) wires the control as a narrow fix-forward under X3's contract, dispatched on this landing. Question 1 — whether every Library import opens the sheet, against `04` §4's plain-import rule and nine specs — is the reviewer's; the sheet today opens where the app guessed or a rung was in mind. Three rows recorded: the folder's *Assign* still opening the plain sheet (X20), the tempo control (X21, X3a), no *Open* control on the sheet (X22). The words in the entry's table are unverified as teaching; nothing heard. The doc rows for `docs/04` §4 are in the entry, for the next docs splice.


## Doc rows

**`docs/04` §4** (G1 holds the file):

- In *The assign sheet* bullet, first sentence: "…a sheet opens by itself asking where the piece goes" becomes "…the **import sheet** opens by itself (below), which ends in the assign sheet's body asking where the piece goes".
- *A file that arrived as MIDI is the exception* becomes "*Wherever the app guessed is the exception* (T29; X3): a file that arrived as MIDI from any door, or a score whose stored provenance says its hands or key were inferred (the command-line converter's MusicXML)".
- After *The note lives in memory for the visit* add: "its hands sentence is derived from the row at render (U72): once the learner has corrected the hands it says they are the learner's".
- New bullet, **The import sheet** (X3, 2026-09-29): "Opened by the UI that received the stored row — the picker and drop target, the share path, *Import for this rung*, the row's *Assign* — never by the store. The sheet's heading is the title. *What the app read*: composer, length in bars, key signature as printed (the key named only where the file states its mode), and this visit's self-check. *What the app guessed*: hands, tempo, and the key where estimated, each with whose it is (the app's guess, from the file, yours) as the store holds it. **Swap the hands** exchanges the two staves' notes, keeps each staff's clef, and saves through `correctImportHands`, which measures the corrected score again. The tempo control waits for a store operation (E48); there is no key control (E49). *What the notes ask* is E2's line. *Where does it belong?* is the body below, T52's sentence first. Nothing on it is evidence; the piece is played by opening it."
- In the Library rows: "an import's detail line names where its notes came from (*read from the file*, *converted from MIDI*) in place of the type every import shares, and a state line under it says whose the hands are, whether it is measured, and whether the tempo is the app's guess".
- Placeholder sheet: "no *Tracks* and no *What it trains*; the piece's `importHint`, what the app reads, and *Import a score*; any detail sheet names a track by its title and leaves out an id with none (U75)".

§5 (the Score screen) is unchanged: an import opens there like any piece.

**`docs/08`:**

- New row: "**The import experience** (X3; E21, U72, U75, E45; the brief approved with one required change, `responses/ef80e86.md`): `ui/importSheet.ts` (the sheet, `swapHands`), `assignSheet.conversionHands` and the reused body, `help.whoseFact`, `importSourceWords`, `importStateWords`, `LibraryScreen`'s doors, row and placeholder sheet" | guards: "a guess said as certain; a conversion note describing a decision the learner has undone; the store opening UI; the sheet writing a run or opening an automatic path; an id on the placeholder sheet; a swap that bypasses the store" | tests: "`importSheet.test.ts`, `libraryImportWords.test.ts`, `tests/e2e/import-experience.spec.ts` (added) — red on the committed code; four mutants" | "done (X3, Entry 118); the tempo control held (E48); nothing heard".
- File lines:
  - `importSheet.test.ts`: the import sheet from the stored row, U72 on both sheets, the swap through the store, no run from the sheet, the store opening nothing.
  - `libraryImportWords.test.ts`: the row's source and state words, the Library's picker opening the sheet from the returned row, the placeholder sheet without ids, E45.
  - `import-experience.spec.ts`: the learner path on the production build, and the share door; fixture `left-hand-first.mid`.

## Files

In X3's worktree (`agent-a1a6623478c1a2198`); nothing committed, nothing staged.

- **New:** `app/src/ui/importSheet.ts`; `app/tests/unit/importSheet.test.ts`, `app/tests/unit/libraryImportWords.test.ts`, `app/tests/e2e/import-experience.spec.ts`; `app/tests/fixtures/imports/left-hand-first.mid`, `make-left-hand-first-midi.py`.
- **Changed:** `app/src/ui/assignSheet.ts` (the helpers, the body split out, `setEstimated`); `app/src/ui/help.ts` (`IMPORT_TEXT`, `whoseFact`, `signatureWords`, `importSourceWords`, `importStateWords`); `app/src/ui/screens/LibraryScreen.ts` (the doors, the row, the placeholder sheet); `app/src/curriculum/session.ts` (one comment sentence); `docs/03-content-pipeline.md` (one line).
- **Not changed:** `importStore.ts`, `convert.ts`, `OsmdView.ts`, `DevExcerptView.ts`, `ScoreScreen.ts`, `FolderScreen.ts`, `style.css`, `docs/04`, `docs/08`, `midi-import.spec.ts`, `converted-import.spec.ts`. The three files the content build rewrites were restored.
- **Beside this entry:** `red/`, the captures, `scripts/` (`mutants.py`, `playwright.x3.config.ts`, `x3-pictures.spec.ts`, `crlf-check.cjs`). Pictures: `docs/prompts/pictures/x3/`.

**Unverified, beside what passes.** Nothing was heard. The swap was looked at on one fixture written for it, not on the owner's files. The state line was measured at 342 px only. CI has not run this tree. The full suites were not run, by instruction.
