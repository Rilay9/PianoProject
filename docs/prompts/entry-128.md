### Entry 128 — X3b: the import sheet's tempo control stays after a statement — seeded again from the tempo the returned score opens at, every later statement through `stateImportTempo` — so a slipped tempo (60 typed for 160) is put right on the same sheet; the twice-stated regression reads the line, the stored score, the measurement, the fact and the Score screen's tempo (2026-09-29)

**Judgement.** Nothing was heard. What I looked at, at 342 × 740 on the production build, on X3's fixture `left-hand-first.mid` (four bars, no tempo event), pictures in `docs/prompts/pictures/x3b/`, their texts in `x3b-pictures.json`:

- **After the first statement** (60, a slip for 160): "Tempo · yours — You stated ♩ = 60.", and under it, still there, "♩ =", the field holding 60, and *Use this tempo*, enabled (`sheet-tempo-first-statement-342x740.png`). The control's row is whole at 342 px (`scrollWidth` equal to `clientWidth`, its right edge inside the viewport); it still takes three rows (label, field, button), X3a's Follow-up 3.
- **After the second statement** (160, on the same sheet, not closed, not re-imported): "Tempo · yours — You stated ♩ = 160."; the field holds 160; the button enabled; the refusal line hidden and empty (`sheet-tempo-second-statement-342x740.png`). No 60 anywhere on the line. The conversion's guesses sentence and *Swap the hands* follow as before.
- **Beyond the sheet** (the browser case, not pictured): the stored score opens at `<sound tempo="160"/>` and sounds no `tempo="60"`; the tempo fact is the learner's with 160 in it and not 60; after Save on no rung the Library row reads "measured · tempo yours"; on the Score screen at 100 % the tempo label reads 160 bpm.

A teacher would read the line after each statement as the learner's own mark, and the control under it as the way to change that mark, which is what it now is: the reviewer's defect was that a learner-authored tempo became the last word. One wording observation, not changed: after a statement the button still says *Use this tempo* beside the number already in use, so a press without typing restates the same tempo (harmless: the same score, measured again, the fact's date moved; Follow-up 2). Unverified as music: nothing played was listened to.

**The orchestrator's hypothesis, tested.** "The store's second statement leaves the returned row's opening `<sound tempo>` equal to the second number and its `facts.tempo` learner-authored with the second time, so seeding the control from the returned score is enough." It holds. The discriminating run (`red-unit-rule-without-seeding.txt`): with only the presentation rule changed (the control offered under a stated tempo) and no seeding change, the twice-stated case was **green** in every place it reads — the line ("You stated ♩ = 160.", no 72), the stored score (the imported score with `withOpeningTempo(…, 160)`, its only `<sound tempo>` 160, no `tempo="72"` anywhere in the row), the measurement (equal to a fresh `measureImport` of the stored score), the fact (`authored`, the learner, "160 quarter notes a minute, 2026-09-29", neither 72 nor the first day), and the tempo the Score screen's label is computed from (the OSMD score model's first tempo, 160). The alternative — the store keeping a trace of the first statement somewhere the line does not read — would have turned one of those red; none did, and the browser case read the same places plus the Library row and the Score screen's label itself. Only the seeding case was red there, and on the characters typed, not on a stale number: `expected '72.5' to be '73'`.

**What the measurement place can and cannot show on this fixture.** A throwaway check (`check-measurement-72-160.txt`, the test file deleted after the run) found the store's measurement of `left-hand-first.mid` identical at 72 and at 160: the detectors read note values, not seconds, and the tempo-sensitive list (`opportunity-density.json`: the eighth, sixteenth, shorter-than-quarter and triplet rhythms) governs trust, not detection. So "the measurement carries the second statement" is shown as "the stored measurement is the store's measurement of the score that opens at 160"; it cannot, on this fixture, tell the first statement from the second. The score bytes, the fact, the line and the player's tempo are what tell them apart, and each does.

**The brief's deviation check.** Seeding from the returned score's opening tempo against `facts.tempo.value`: the store writes no `value` (its fact carries the number in `via`), so no store-stated row can disagree. The one fixture with a `value` (X3's "a tempo the learner stated is theirs", `value: '72'`, the score sounding 72) agrees. Where the seed and the fact differ is rounding only: 72.5 stated, the score opens at 72.5 and the fact says 72.5, the line and the seeded field say 73 (`openingTempo` rounds to the whole beat, as X3a's line does; Follow-up 3). I seeded from the score, as the brief says.

**The reviewer's example, checked at the store.** The review's case, "a mistyped `16` in place of `160` leaves the imported score opening at 16 BPM", does not happen: `stateImportTempo` refuses anything below 20 (`STATED_TEMPO_RANGE`), in its words. The defect is real for every slip inside 20–400 — 60 for 160, 72 for 92 — so the browser case states 60 and then 160. From the code, not run as a separate case.

## Done

1. **The control stays** (`app/src/ui/importSheet.ts`, the render's tempo block). The rule `tempo.whose !== 'yours'` is gone: the control is offered on the tempo line of every MusicXML score — the app's guess, the file's, or one the learner already stated — which is every score `stateImportTempo` can state (it returns nothing for a PDF, and a PDF has no tempo line). A PDF still gets none. After a successful statement the line redraws from the returned row ("You stated ♩ = N", *yours*) and the control remains, on the line.
   - *Technical:* the unit case for where the control is (revised: present under the learner's tempo, seeded 72), the re-read case (revised: the control still there), the browser case (revised). *Pedagogical:* a learner who has said a tempo can say it again; no new words.
2. **The seeding rule.** After a successful statement the sheet clears the field and redraws, and the redraw's one rule seeds it: the number the line names, which for a stated tempo is the tempo the stored score opens at (`openingTempo`, the first `<sound tempo>`) — never the characters typed. A refusal does not redraw, so the field keeps what was typed and the store's sentence stands, as X3a built it; a swap redraws without clearing, so a number being typed survives it.
   - *Technical:* the seeding unit case (discriminating red before the change, green after). *Pedagogical:* the field and the line say the same number; a fraction is shown to the whole beat (Follow-up 3).
3. **Every statement through the store.** The second statement calls `stateImportTempo(id, Number(field), new Date(), { estimate })` exactly as the first (the twice-stated case reads the second call's arguments, the second day included). The sheet writes no score and no row: `git diff` of `importStore.ts` is empty, and the sheet's source scan still finds no `withOpeningTempo(`, `.put(` or `updateImport(`. No `updateImport` widened, no fact manufactured in the sheet.
4. **The regression, red first.** Unit: "stated twice without closing the sheet" (72 on one day, 160 the next, on one open sheet: the line, the call, the stored score, the whole row, the measurement, the fact with the second number and day, the player's opening tempo, the Library state words) and "after a statement the field starts at the tempo the stored score opens at…" (72.5 stated → the line and the field say 73; then 500 refused in the store's words, the field 500, the line and the score as they were). Browser: `import-experience.spec.ts`'s tempo case now states 60 and then 160 and reads the line, the field, the stored score, the fact, the Library row and the Score screen's label at 100 %. `midi-import.spec.ts`, `converted-import.spec.ts` and `finder.spec.ts` green, unedited.
5. **Not X3b's, untouched.** `fileTempo` and the file-authored tempo sentence (X24); the Score screen's 70 % legibility at 342 px (U84); the announcement after a statement (U85: after the second statement the live line is hidden and empty, `x3b-pictures.json`); one opening-tempo reader (the prune after X24).

**Deviations from the brief, each with its reason.**

- *Port 4347, not 4343.* A vendor service on this machine (`AcerCCAgent.exe`) listens on `0.0.0.0:4343` and `[::]:4343`, and another lane's preview held 4333 (`port-4343-held.txt`, before any browser run). A preview on 4343 would have been refused or answered by the wrong process. 4347 was free (only TIME_WAIT between runs), is outside the lanes' 43x3 pattern, and is never 4173. The override is `scripts-playwright.x3b-4347.config.ts`.
- *No `npm ci`: a junction.* `npm ci` failed with ENOSPC — C: had 0 bytes free (`npm-ci.txt`). I removed its partial install and pointed `app/node_modules` at the main checkout's install by a junction, after checking that the two `package.json` and `package-lock.json` files are sha256-identical (`node-modules-junction.txt`). The junction was removed at the end, link only, the target intact (`node-modules-junction-removed.txt`), so no later cleanup of this worktree can reach into the main checkout.
- *Vitest through an override config.* Through the junction, Vite refused a `?raw` import from outside the worktree ("Denied ID …/opensheetmusicdisplay/package.json?raw", `unit-junction-denied.txt`, 12 unrelated reds). `scripts-vitest.x3b.config.ts` is `app/vitest.config.ts`'s include and environment plus `server.fs.allow` naming the worktree and the junction's target; every unit run named here went through it.
- *The browser case revised, not added.* X3a's tempo case asserted the control gone after a statement (`toHaveCount(0)`), the model being replaced; it became the twice-stated case rather than living beside a second case that imports and engraves the same file again.
- *The content build* could not produce the catalogue offline (no MuseTrainer or kern library in the worktree, a partial catalogue, validation 121 errors, `content-build.txt`); its partial output was removed but the tracked `audio/`, and `app/public/content` copied from the main checkout (`copy-content.txt`, robocopy 1 = copied). The two tracked files it rewrote (`docs/prompts/inventory.md`, `docs/prompts/rung-claims.md`) were restored from copies taken before the build, sha256 identical.

## Not done

- **`help.ts`'s comment on `IMPORT_TEXT.tempoField`** still says the control is "on the tempo line while it is the app's guess or the file's". Not edited: `help.ts` was mine only if a string changed, and none does. Follow-up 1.
- **The browser red is absence** (the control not found after the first statement on the committed build), not a discriminating red; the discriminating reds are the unit seeding case and the mutant (below).
- **The time of the second statement** is checked at the unit layer (a fixed clock, two days); the browser case checks the number, not the day.
- **The Score screen after the second statement** was not pictured, and its label at the default practice percentage was not looked at (U84 is that screen's).
- **CI has not run this tree.**
- **`docs/04` and `docs/08` not edited**: the rows are under *Doc rows*.

## Follow-ups

1. **P3.** `app/src/ui/help.ts`, the doc comment above `IMPORT_TEXT.tempoField`, "on the tempo line while it is the app's guess or the file's (X3a; E48)", is now false: the control is on every MusicXML tempo line. One line; X24 edits the same table.
2. **P3.** After a statement *Use this tempo* stays enabled beside the tempo already in use; a press without typing restates it (the store writes the same score, measures it again and moves the fact's date). Harmless and truthful; a label or a disabled state while the field equals the opening tempo would be a product choice, not made here.
3. **P3.** A fractional statement (72.5) is written as stated, said to the whole beat (73, X3a's Follow-up 6) and now also seeded at 73, so a press without typing turns 72.5 into 73. The field's `step="1"` already expects whole beats.
4. **P3.** X3a's Follow-up 3 stands and now matters longer: the three-row control stays on the sheet after statements. A width for `#import-tempo-bpm` in `style.css` (not mine).

## Questions

None. The one product choice inside the brief — seed from the score, not the typed characters — the brief made.

## Files

In this worktree; nothing committed, staged or stashed.

- **Changed:** `app/src/ui/importSheet.ts` (the presentation rule, the seeding after a statement, three comments); `app/tests/unit/importSheet.test.ts` (the header note, two cases revised, two added, two helpers); `app/tests/e2e/import-experience.spec.ts` (the header note, the tempo case revised into the twice-stated case).
- **Not changed:** `importStore.ts`, `help.ts`, `LibraryScreen.ts`, `ScoreScreen.ts`, `assignSheet.ts`, `style.css`, `docs/04`, `docs/08`, `midi-import.spec.ts`, `converted-import.spec.ts`, `finder.spec.ts`; `content/scores/imported/SOURCES.md`, `docs/prompts/inventory.md`, `docs/prompts/rung-claims.md` byte for byte.
- **Beside this entry** (`docs/prompts/runs/X3b/`): the captures; `scripts-run.sh` (the capture helper); `scripts-vitest.x3b.config.ts` (the unit override); `scripts-playwright.x3b-4347.config.ts` (the port override, run from `app/` as `playwright.x3b-4347.config.ts` and moved here after the runs); `scripts-x3b-pictures.spec.ts` (the pictures, run from `app/tests/e2e/` and moved here). Pictures: `docs/prompts/pictures/x3b/`.

## The red lines

- `red-unit-committed-sheet.txt` — the new and revised unit cases on the committed sheet: 4 of 22 red, absence — `no control under the learner’s own tempo: expected null not to be null`; `expected null not to be null` (the re-read case); `TypeError: Cannot set properties of null (setting 'value')` (the twice-stated case, at the second statement); `Cannot read properties of null (reading 'value')` (the seeding case).
- `red-unit-rule-without-seeding.txt` — the rule changed, no seeding: 1 red, **discriminating** — `expected '72.5' to be '73'`; the twice-stated case green (the hypothesis, above).
- `mutant-unit-second-row-not-reread.txt` — a mutant sheet that keeps the first statement's row once the tempo is the learner's: the twice-stated case red, `expected 'Tempo · yours — You stated ♩ = 72.' to contain 'You stated ♩ = 160.'`. Reverted by hand before the browser red; for that red the committed sheet was built in its place and the sheet put back afterwards, its sha256 equal to the one taken before the swap.
- `red-e2e-committed-build.txt` — the revised browser case on a build of the committed sheet, port 4347: `expect(locator).toBeEnabled() failed … element(s) not found` at `#import-tempo-use` after the first statement; the other two cases green.

## Tests

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `importSheet.test.ts` › "the app’s guess, the file’s tempo and the learner’s own offer a number field…; a PDF offers none" | revise (was "…a stated tempo and a PDF offer none") | a stated tempo takes no control | the control under a stated tempo, on the line, seeded from the score (72); none on a PDF |
| `importSheet.test.ts` › "Use this tempo calls stateImportTempo…, the control still there…" | revise (one assertion replaced) | the control leaves after a statement | the control stays |
| `importSheet.test.ts` › "stated twice without closing the sheet…" | add | — | the second statement everywhere, the first nowhere: line, call, stored score, whole row, measurement, fact (number and day), the player's opening tempo |
| `importSheet.test.ts` › "after a statement the field starts at the tempo the stored score opens at…" | add | — | seeded from the score, not the typed characters; a refused restatement keeps the store's words and the field as typed |
| `importSheet.test.ts` › X3a's other tempo cases, X3's cases, the source scan | preserve | — | green |
| `import-experience.spec.ts` › "state the tempo on the sheet, then state it again…" | replace (was "state the tempo on the sheet…", which asserted `#import-tempo-use` count 0) | a stated tempo is final | 60 then 160 on one sheet: the line, the field, the stored score, the fact, the Library row, the Score screen's label at 100 % |
| `import-experience.spec.ts` › case 1 and the share case | preserve | — | green |
| `midi-import.spec.ts`, `converted-import.spec.ts`, `finder.spec.ts` | preserve | — | green, unedited |

## Exit codes (the last line of each capture, `docs/prompts/runs/X3b/`)

| Run | Exit |
| --- | --- |
| `npm ci` (`npm-ci.txt`) | 1: ENOSPC, 0 bytes free on C: |
| the junction (`node-modules-junction.txt`); its removal (`node-modules-junction-removed.txt`) | 0; 0 |
| `parity_reference.py` (`parity-reference.txt`) | 0 |
| content build offline (`content-build.txt`) | 1: no MuseTrainer or kern library, a partial catalogue, validation 121 errors; content copied (`copy-content.txt`, robocopy 1 = copied) |
| the unit file through the junction without the override (`unit-junction-denied.txt`) | 1: "Denied ID", harness, not the sheet |
| red on the committed sheet (`red-unit-committed-sheet.txt`); the rule without seeding (`red-unit-rule-without-seeding.txt`); the mutant (`mutant-unit-second-row-not-reread.txt`) | 1; 1; 1, as intended |
| the measurement at 72 and 160 (`check-measurement-72-160.txt`) | 0: identical |
| the sheet's unit file (`green-unit-sheet.txt`, 22 cases) | **0** |
| the committed build for the browser red (`red-build-committed.txt`); the spec on it (`red-e2e-committed-build.txt`) | 0; 1, as intended |
| port 4343's holder (`port-4343-held.txt`) | 0 (a record) |
| `npx tsc -b` (`tsc.txt`) | **0** |
| `npm run build:app` (`build-app.txt`) | **0** |
| the spec files named, present (`specs-exist-red.txt`, `specs-exist-green.txt`, `specs-exist-pictures.txt`) | 0, 0, 0 |
| Playwright, port 4347, two workers: import-experience, midi-import, converted-import, finder (`e2e-import-specs.txt`, 20 cases) | **0** |
| the pictures, one worker (`pictures-run.txt`) | 0 |
| `npm run lint` (`lint.txt`, the overrides moved out of `app/` first) | **0** |
| the whole unit suite (`vitest-all.txt`) | 1: 287 of 292 files passed; 7 failures — the recorded line-ending pair in `lessonClaimsAboutApp` (blues.3, 4.7; Entry 101) and five 5-second timeouts in `expectedNote`, `lessonClaims`, `materialOnTheRecord`, `unmeasuredConceptsSaySo` (two) |
| those four timed-out files alone (`vitest-timeouts-alone.txt`, 28 cases) | **0**: suite load, not a fault |

Port 4347 free before each run (TIME_WAIT only); no build while Playwright ran; one Playwright run at a time.

**Unverified, beside what passes.** Nothing was heard. The tempo line was looked at on one fixture at 342 × 740 only. On this fixture the measurement is the same at either tempo, so it cannot by itself show which statement is stored. The second statement's day is a unit-layer check. The Score screen's label was read at 100 % only. The reviewer's 16 is refused by the store — from the code, not run. CI has not run this tree.

**Orchestrator's note at the landing (2026-09-29).** X3b's worktree committed by name (f9d36867) and merged (dafd2ed6). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/X3b/map-min.txt`: e2e	app	npx playwright test tests/e2e/app-shell.spec.ts tests/e2e/empty-states.spec.ts tests/e2e/feedback-placement.spec.ts tests/e2e/import-experience.spec.ts tests/e2e/landscape.spec.ts tests/e2e/wi), typecheck, lint, the whole unit suite, the app build, the spec names checked, the import and library specs on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/X3b/orchestrator-exit.txt`). The reviewer's required change as ruled: the control on every MusicXML tempo line, seeded from the score the store returns, every statement through the store (its diff empty). The builder's two findings: the review's "16 for 160" cannot happen (the store refuses below 20), so the regression states 60 then 160; and on the fixture the measurement is identical at both tempos, so that place cannot tell the statements apart — the score's bytes, the fact, the line and the player's tempo do. Two deviations for the record: the port moved to 4347 because a vendor service holds 4343 on this machine, and `app/node_modules` was linked to the main checkout's install while the disk was full (the link removed after). One row: the doc comment above `IMPORT_TEXT.tempoField` is now false and X3c edits that table (X26). Nothing heard; the two pictures at 342 × 740 are the observations.


## Doc rows

Neither X3's nor X3a's row is in `docs/04` or `docs/08` at 8f6930ea (searched both for "Use this tempo", "stateImportTempo", "What the app guessed" and "X3": none). These rows supersede the X3a rows in Entry 122 where they differ.

**`docs/04` §4** (the import sheet bullet; replaces X3a's "Use this tempo" bullet):

- "**Use this tempo** (X3a, X3b): on the tempo line of every MusicXML import — the app's guess, the file's, or one the learner already stated — "♩ =" and a number, and *Use this tempo*, which saves through `importStore.stateImportTempo` (E48): the score opens at the stated tempo and is measured again, the tempo fact names the learner, and an estimated level is estimated again. The line then says "You stated ♩ = N" (*yours*), N read from the tempo the stored score opens at, and the Library row's state says *tempo yours*. The control stays after a statement, its number starting again at the tempo the score now opens at, so a slip is put right on the sheet and every later statement goes through the same store operation. A tempo outside 20–400 is refused in the store's words and never clamped by the sheet; the field keeps what was typed. No control on a PDF; the tempo and the hands are changed one at a time."

**`docs/08`:**

- The import experience row (X3): add to the guards "a stated tempo that cannot be stated again; the field seeded from the characters typed rather than the stored score", and to the status "the control kept after a statement (X3b, Entry 128)".
- File lines: `importSheet.test.ts` — add "a stated tempo stated again: the control under the learner's tempo, the seeding rule, the twice-stated case (the second statement in the line, the score, the row, the measurement, the fact and the player's tempo; the first nowhere)"; `import-experience.spec.ts` — replace X3a's line with "the learner's tempo stated and stated again, from the sheet to the Score screen's label".
