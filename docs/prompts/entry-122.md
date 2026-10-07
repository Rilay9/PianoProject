### Entry 122 — X3a: the import sheet's tempo line takes the learner's tempo — a number and *Use this tempo* call `stateImportTempo` (E48), the line then says "You stated ♩ = N" (yours) read from the score the store wrote, the Library row says "tempo yours", the Score screen's tempo label reads the stated tempo; a refused tempo is said in the store's words, never clamped (2026-09-29)

**Judgement.** Nothing was heard. What I looked at, at 342 × 740 on the production build (`docs/prompts/pictures/x3a/`, the texts in `x3a-pictures.json`), on X3's fixture `left-hand-first.mid` (four bars, no tempo event):

- **Before.** "Tempo · the app's guess — The file states no tempo, so the app chose ♩ = 100.", and under it "♩ =", a number field holding 100, and *Use this tempo* (`sheet-tempo-before-342x740.png`). The control's row is whole at 342 px (`scrollWidth` equal to `clientWidth`), but it takes three rows: the label, the field at the browser's default width for a number box, the button (Follow-up 3).
- **Refused.** 500 typed: under the button, in the store's words, "A tempo is between 20 and 400 quarter notes a minute; 500 is not."; the field still says 500, the line still says the app's guess (`sheet-tempo-refused-342x740.png`).
- **After.** 60 typed: "Tempo · yours — You stated ♩ = 60."; the control is gone; the conversion's guesses sentence and *Swap the hands* follow as before (`sheet-tempo-after-342x740.png`). After Save on no rung, the Library row's state reads "measured · tempo yours".
- **The Score screen.** At the default practice percentage the bar's label reads "42 bpm" (70 % of 60; below 440 px the bar shows the bpm and not the percentage, `score-tempo-label-default-342x740.png`); at 100 % it reads "60 bpm" (`score-tempo-label-100-342x740.png`). The count-in draws beat numbers, not a tempo; its clock is `prepareSession`'s `model.beatToMs` on the same tempo map the label reads (from the code, not measured). No reader holds the old tempo, so the brief's stop condition did not arise.

A teacher would read "You stated ♩ = 60" as the learner's own mark, as it is. What the learner meets next on the Score screen is "42 bpm" — the practice percentage the screen has always applied, not a wrong tempo, but a learner who has just said 60 may not know why it says 42 (Follow-up 2). Unverified as music: nothing played was listened to.

**The orchestrator's hypothesis, tested.** "`stateImportTempo(id, bpm, now, options)` is enough; the sheet only calls it and re-reads the row." It holds for the call and the re-read: the store writes the score, measures it again and names the learner, and the sheet renders the row it returns. It is refuted at one field: X3's tempo line read the stated number from `facts.tempo.value`, and the store writes no `value` (E48's own test asserts the fact equals `{ kind: 'authored', via: … }`). Without it the line fell back to the file's first `<per-minute>`, which is in the mark's own note and may be a later bar's. The discriminating test, with the control drawn and the line as X3 wrote it (`red-unit-control-without-line.txt`): a cut-time file (a half note = 60) stated as 100 said "You stated ♩ = 50."; a file whose only mark is in bar 2 (♩ = 132) stated as 72 said "You stated ♩ = 132.". The alternative explanation — the store failing to write the tempo — is ruled out by the same run: the stored score opens at the stated tempo (E48's `withOpeningTempo`), and only the line's reading was wrong. The fix acts on the reading: for a tempo that is the learner's, the line reads the score's opening `<sound tempo>`, in quarter notes a minute, where the store writes it and the player reads it (`openingTempo`); `value` is read only where the score sounds no tempo. The store is unchanged; the number lives in one place, the score.

## Done

1. **The control** (`app/src/ui/importSheet.ts`). On the tempo line, while the tempo is the app's guess or the file's: "♩ =" with a number field and *Use this tempo* (`IMPORT_TEXT.tempoField`, `tempoUse`). The field starts at the number the line names (100, or the file's) — my choice: the learner corrects a number, and a press without typing states that number as theirs, which is their act. The press calls `stateImportTempo(id, Number(field), new Date(), { estimate: estimateLevelFor })` and renders the row the store returned: "You stated ♩ = N", *yours*, no control. A tempo outside the store's bounds is sent as typed and refused with the store's `ImportError` sentence; the sheet has no bounds of its own. Where the store returns nothing (no database, the row gone), the sheet says `IMPORT_TEXT.tempoFailed`. No control under a stated tempo, on a PDF, or for the key (E49).
   - *Technical:* 6 unit cases (below), 1 browser case added, 1 browser assertion replaced; `midi-import.spec.ts`, `converted-import.spec.ts` and `finder.spec.ts` green, unedited. *Pedagogical:* the words are X3's "You stated ♩ = N" and two new labels; the line now names the tempo the piece opens at in quarter notes, which is what "♩ =" means (never the half-note mark's number). Unverified as teaching beyond that.
2. **The store untouched.** `git diff` of `importStore.ts` is empty. The sheet writes no score and no row: the stored bytes equal `withOpeningTempo(the imported score, 72)` (unit), and a source scan finds no `withOpeningTempo(`, `.put(` or `updateImport(` in the sheet.
3. **The score.** After the statement, the Score screen's tempo label at 100 % reads 60, not the app's 100 (browser case). The run's demands are the store's re-measurement: the stored row's demands equal a fresh `measureImport` of the stated score (unit).
4. **One change to the score at a time.** *Swap the hands* is disabled while a tempo is being saved, and *Use this tempo* while the hands are being swapped. Why: `correctImportHands` writes the swapped score without `stateImportTempo`'s write-if-unchanged rule, and the swap is computed from bytes read before its store call, so a swap overlapping a statement could save a score without the stated tempo under a fact that names the learner. This is a consequence of adding a second writer to the sheet, so it is X3a's; one line each in the swap handler.

**Deviations from the brief, each with its reason.**

- *The call passes `options.estimate`* (the brief wrote `stateImportTempo(id, bpm, now)`). The level estimate reads the first tempo (`difficulty.features` → `notesPerSecond` from `tempoMap[0].bpm`), so a stated tempo moves an estimated level, and E48 re-estimates only when the caller passes `estimate`, as the swap passes it to `correctImportHands`. The level box follows (`controls.setEstimated`), unless the learner typed a level.
- *Three new strings, not two*: the brief's two (the field's label and the button) and `tempoFailed`, because a control whose store call returns nothing with no reason would otherwise fail silently (`04` §0 R4).
- *The tempo line's reading changed* (the hypothesis's refutation, above), inside "the tempo line" the brief gives me.

## Not done

- **The count-in "says N"**: it prints beat numbers, not a tempo. Its clock follows the stated tempo by the code (the same tempo map), not by a measurement.
- **A stated tempo cannot be stated again** on the sheet: the brief decided "a stated one → no control". Question 1.
- **The browser red is absence** (no control on the committed build), not a discriminating red; the discriminating reds are the unit ones. The committed build ran `vite build` without `tsc -b`, because the new unit file names strings the committed `help.ts` lacks; the bundle is vite's either way.
- **The file's own tempo line is unchanged** (Follow-up 1), by the brief's "nothing else on the sheet changes".
- **`docs/04` not edited**: its row is below.

## Follow-ups

1. **P2 (never teach wrong).** X3's line for a tempo from the file reads the file's first `<per-minute>` (`fileTempo`): a cut-time piece marked half note = 60 is said "The file says ♩ = 60." (it plays 120 quarter notes a minute), and a piece whose only mark is a later bar's is said at that mark. Read at the lines, not shown on a screen. The fix is the same reading as the learner's line (the opening `<sound tempo>`), or the mark's number with its own note. The sheet's owner's.
2. **P3.** Below 440 px the Score screen's label shows the bpm at the practice percentage and not the percentage: after stating 60 the learner reads "42 bpm". The Score screen's (`04` §5); observed here, not changed.
3. **P3.** At 342 px the control takes three rows, because a number box's default width pushes the field onto its own row. A width of a few characters for `#import-tempo-bpm` in `style.css` (not mine) would put "♩ = [100] Use this tempo" on one row, under the line it corrects.
4. **P3.** After a statement nothing is announced to a screen reader: the button goes, the line changes, and the live region (`#import-tempo-said`) leaves with the control. The swap keeps its live line.
5. **P3.** `correctImportHands` writes without the write-if-unchanged rule `stateImportTempo` has. The sheet now keeps its own two writers apart; any other caller that corrects the hands while a tempo is being stated is not. The store's owner's.
6. **P3.** A tempo with a fraction (72.5) is stored as typed (the store rounds to three places) and said rounded to a whole beat ("♩ = 73"), as the file's line rounds.

## Questions

1. **Should a stated tempo be statable again?** Today, once the learner has stated a tempo the control is gone (the brief's rule): a learner who typed 16 meaning 160 has a score that opens at 16 and no way back on the sheet short of deleting and importing again. The change is one condition in `openImportSheet`'s render (`tempo.whose !== 'yours'`) and one assertion in the unit case; `stateImportTempo` already takes a second statement.

## Files

In this worktree; nothing committed, staged or stashed.

- **Changed:** `app/src/ui/importSheet.ts` (the control on the tempo line, `stateTheTempo`, `openingTempo`, the tempo line's reading of a stated tempo, the two writers kept apart, the module note); `app/src/ui/help.ts` (`IMPORT_TEXT.tempoField`, `tempoUse`, `tempoFailed`); `app/tests/unit/importSheet.test.ts`; `app/tests/e2e/import-experience.spec.ts`.
- **Not changed:** `importStore.ts`, `LibraryScreen.ts`, `assignSheet.ts`, `ScoreScreen.ts`, `style.css`, `docs/04`, `midi-import.spec.ts`, `converted-import.spec.ts`, `finder.spec.ts`. `content/scores/imported/SOURCES.md`, `docs/prompts/inventory.md` and `docs/prompts/rung-claims.md`, which the content build rewrote, restored byte for byte (sha256 identical to before the build).
- **Beside this entry** (`docs/prompts/runs/X3a/`): the captures; `scripts-run.sh` (the capture helper); `scripts-playwright.x3a-4303.config.ts` (the port 4303 override, run from `app/` as `playwright.x3a-4303.config.ts` and moved here after the runs); `scripts-x3a-pictures.spec.ts` (the pictures, run from `app/tests/e2e/` and moved here). Pictures: `docs/prompts/pictures/x3a/`.

## The red lines

- `red-unit-committed-sheet.txt` — the new unit cases on the committed sheet: 4 of 4 red, absence ("no control under the app's guess: expected null not to be null"; the field not found).
- `red-unit-control-without-line.txt` — the control built, the tempo line as X3 wrote it: 2 red, **discriminating** — `expected 'Tempo · yours — You stated ♩ = 50.' to contain 'You stated ♩ = 100.'`; `expected 'Tempo · yours — You stated ♩ = 132.' to contain 'You stated ♩ = 72.'`.
- `red-unit-one-change-at-a-time.txt` — before the guard: `Swap open while the tempo is being saved: expected false to be true`; `red-unit-one-change-swap-side.txt` — the tempo side guarded, the swap side not: `Use this tempo open while the hands are being swapped: expected false to be true`.
- `red-e2e-committed-build.txt` — the import-experience spec on the committed build at port 4303: 2 red (case 1 `#import-tempo-use` not found; the new case timed out waiting for `#import-tempo-bpm`), the share case green.

## Tests

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `importSheet.test.ts` › "the tempo control is held: nothing is drawn that would state a tempo the store cannot take" | replace (deleted) | no store operation stated a tempo, so no control | the control and where it is absent (next row) |
| `importSheet.test.ts` › the learner states the tempo (6) | add | — | the control under a guess and the file's tempo, none under a stated tempo or a PDF; the call's arguments and the row re-read ("You stated ♩ = 72", yours, the row's state, the stored bytes the store's, the demands the re-measurement); a refusal in the store's words, not clamped, nothing written; the two writers kept apart; the line in quarter notes against a half-note mark and against a later mark |
| `importSheet.test.ts` › `twoStaves` | revise | — | a mark's note, its sounding tempo and its bar as options; the default bytes unchanged |
| `importSheet.test.ts` › the sheet's source scan | revise (one assertion added) | — | no `withOpeningTempo(` and no `.put(` in the sheet |
| `importSheet.test.ts` › "a tempo the learner stated is theirs" and X3's other cases | preserve | — | green |
| `import-experience.spec.ts` › case 1, "The tempo control is held" | replace (one assertion) | nothing to type a tempo into | the control offered under the app's guess |
| `import-experience.spec.ts` › state the tempo on the sheet | add | — | the line, the stored row, the Library state, the Score screen's label at 100 % |
| `midi-import.spec.ts`, `converted-import.spec.ts`, `finder.spec.ts` (*Import for this rung* opens the import sheet) | preserve | — | green, unedited |

## Exit codes (the last line of each capture, `docs/prompts/runs/X3a/`)

| Run | Exit |
| --- | --- |
| `npm ci` (`npm-ci.txt`); `parity_reference.py` (`parity-reference.txt`) | 0; 0 |
| content build offline (`content-build.txt`) | 1: no MuseTrainer or kern library in the worktree, a partial catalogue, validation failed (121 errors). Its output was removed but the tracked `audio/`, and `app/public/content` copied from the main checkout (`copy-content.txt`, robocopy 1 = copied) |
| red on the committed sheet (`red-unit-committed-sheet.txt`); the control without the line (`red-unit-control-without-line.txt`); the guard, each side (`red-unit-one-change-at-a-time.txt`, `red-unit-one-change-swap-side.txt`) | 1; 1; 1; 1, as intended |
| the sheet's unit file (`green-unit-sheet.txt`, 20 cases) | **0** |
| the committed build for the browser red (`red-build-committed-icons.txt`, `red-build-committed-vite.txt`); the spec on it (`red-e2e-committed-build.txt`) | 0, 0; 1, as intended |
| `npx tsc -b` (`tsc-1.txt`; final `tsc.txt`) | 0; **0** |
| `npm run lint` (`lint-1.txt`: the port override in `app/` is in no tsconfig; final `lint.txt`, the override moved out) | 1; **0** |
| `npm run build:app` (`build-app-1.txt`) | **0** |
| the spec files named, present (`specs-exist-red.txt`, `specs-exist-green.txt`, `specs-exist-pictures.txt`) | 0, 0, 0 |
| Playwright, port 4303, two workers: import-experience, midi-import, converted-import, finder (`e2e-import-specs-1.txt`, 20 cases) | **0** |
| the pictures, one worker (`pictures-run-1.txt`) | 0 |
| the whole unit suite (`vitest-all.txt`) | 1: 291 of 292 files passed; the two failures are `lessonClaimsAboutApp`'s blues.3 and 4.7, the recorded line-ending pair (Entry 101: a literal LF sought in `ScoreScreen.ts` and `style.css`, both CRLF on this checkout; neither file touched here) |

Port 4303 free before each run; no build while Playwright ran; one Playwright run at a time.

**Unverified, beside what passes.** Nothing was heard. The control was looked at on one fixture at 342 × 740 only. The count-in's tempo is the code's reading, not a measurement. The half-note and later-mark cases are unit fixtures, not files a learner brought. CI has not run this tree.

**Orchestrator's note at the landing (2026-09-29).** X3a's worktree committed by name (564e8e5f) and merged (fadfbe2e). The chain on the merged main checkout: the map's test, the map's minimum for the merged files printed (`runs/X3a/map-min.txt`: e2e	app	npx playwright test tests/e2e/app-shell.spec.ts tests/e2e/empty-states.spec.ts tests/e2e/feedback-placement.spec.ts tests/e2e/help-strip.spec.ts tests/e2e/import-experience.spec.ts tests/e2e/landscape.spec.ts tes), typecheck, lint, the whole unit suite, the app build, the spec names checked, the import-experience, MIDI and converted import, library and score specs on the default port (map-tests 1; map-min 0; tsc 0; lint 0; map-tests-rerun 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the map's drift test was red because X3a's new browser case drives the score through `scoreControls.ts` and the helper's row did not name `import-experience.spec.ts` (Q73's rule biting as designed); the name spliced into the row at the landing and the map's tests rerun green (`map-tests-rerun`) — the unit suite's two failures are the recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis), which pass on the runner; every other file passed; `runs/X3a/orchestrator-exit.txt`). The reviewer's constraint held: the store untouched (an empty diff), the row the store returns redrawn. The builder's catch is the right kind: the sheet's tempo line read the file's first `<per-minute>` in the mark's own note value, so a stated 100 on a half-note mark read "♩ = 50"; the stated tempo now reads from the first `<sound tempo>` the store writes; the file's own tempo line still reads the mark's number in its own note value, a never-teach-wrong row (X24, P2). The builder's question is the reviewer's: a stated tempo cannot be stated again (the brief's word), so a mistyped 16 for 160 has no way back short of re-importing (X25). Nothing heard; the pictures at 342 × 740 are the observations.


## Doc rows

**`docs/04` §4** (the import sheet bullet X3's entry wrote; it supersedes that bullet's "The tempo control waits for a store operation (E48)"):

- "**Use this tempo** (X3a): on the tempo line, while the tempo is the app's guess or the file's, "♩ =" and a number starting at the tempo the line names, and *Use this tempo*, which saves through `importStore.stateImportTempo` (E48): the score opens at the stated tempo and is measured again, the tempo fact names the learner, and an estimated level is estimated again. The line then says "You stated ♩ = N" (*yours*), N read from the tempo the stored score opens at, and the Library row's state says *tempo yours*. A tempo outside 20–400 is refused in the store's words and never clamped by the sheet. No control once the tempo is the learner's; the tempo and the hands are changed one at a time."

**`docs/08`:**

- The import experience row (X3): add to the guards "a stated tempo said at the printed mark's number; a tempo clamped by the sheet; a swap saving over a stated tempo", and to the status "the tempo control built (X3a, Entry 122)".
- File lines: `importSheet.test.ts` — add "the learner's tempo through the store: the control, the call, the re-read row, the store's refusal, the two writers one at a time, the line in quarter notes"; `import-experience.spec.ts` — add "the learner's stated tempo, from the sheet to the Score screen's label".
