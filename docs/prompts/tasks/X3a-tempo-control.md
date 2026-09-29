# X3a — The import sheet's tempo control wired to the learner's stated tempo: the sheet's tempo line gains a control that calls `stateImportTempo` (E48, landed in the E-tail), the row and the sheet then say "tempo yours", the score plays at the stated tempo, and nothing else on the sheet changes

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/review/responses/ef80e86.md` (the X3 brief's review: the UI opens the sheet, the store mutates; the tempo through a semantic store operation or held — question 1); `docs/prompts/entry-118.md` (X3: the sheet, its words table, the tempo control held because the tree had no `stateImportTempo`); `docs/prompts/entry-115.md` at E48 (`stateImportTempo(id, bpm, now, options)`: the tempo written into the first bar, the score measured again, `facts.tempo` authored naming the learner, only the tempo-sensitive untrusted entries cleared, never lost to a launch measurement); `app/src/data/importStore.ts` at `stateImportTempo`; `app/src/ui/importSheet.ts`; `app/src/ui/help.ts` at `IMPORT_TEXT`.

## The goal, in the orchestrator's words

X3 built the sheet on a tree without E48 and held the tempo control, as its brief allowed. E48 landed the same night. The sheet's tempo line says "The file states no tempo, so the app chose ♩ = 100" and offers nothing; a learner who knows the piece's tempo has no way to say it. One control, one store call, the words X3 already wrote for "You stated ♩ = N".

## What is decided

1. **The control.** On the sheet's tempo line, where the tempo is the app's guess or the file's, a number field and a button "Use this tempo" (the words in `IMPORT_TEXT`, X3's table) that calls `stateImportTempo(id, bpm, now)`; the sheet re-reads the row and the line becomes "You stated ♩ = N" with *yours*; the Library row's state reads "tempo yours". A value outside the store's bounds is refused with the store's reason, never clamped by the sheet. No key control (E49 stays).
2. **The store untouched.** `stateImportTempo` as E48 wrote it; the sheet never edits the score's XML.
3. **The score.** Opened after the statement, the piece plays at the stated tempo (the count-in and the tempo label say N); the run's measured demands come from the re-measurement.
4. **Not X3a's:** Question 1 of X3 (whether every import opens the sheet — the reviewer's); the folder's Assign (X20); an Open button on the sheet (X22); any wording beyond the one line; the assign sheet's body.

## Verification layers

- Unit, red first: the sheet's tempo control on a store fixture (a guessed tempo → the control; a stated one → no control; the call's arguments; a refused value shown with the store's reason).
- Browser, on port 4303: `import-experience.spec.ts` gains one case — import the MIDI fixture, state a tempo on the sheet, open the row, the tempo label reads it; `midi-import.spec.ts` preserved.
- The product look: the sheet's tempo line before and after at 342 × 740, as observations; nothing heard.

## Rules and files

You own `app/src/ui/importSheet.ts` at the tempo line, `app/src/ui/help.ts` at the two new strings in `IMPORT_TEXT`, `app/tests/unit/importSheet.test.ts`, `app/tests/e2e/import-experience.spec.ts`. Not `importStore.ts`, not `LibraryScreen.ts`, not `assignSheet.ts`, not `docs/04` (a doc row in the entry). A fresh worktree's `npx vitest run` needs `python tools/midi-cleanup/tests/parity_reference.py` and `python tools/content/build.py --offline` first (Q24). Never name an AI model. Never assert a number measured on this machine. Every change red first; no commits, pushes, stashes or checkouts.

## Sequencing

A narrow fix-forward under X3's accepted contract (788427c): dispatched on X3's landing with a for-information line in X3's handoff; X3's post-build review remains the gate for the sheet.

## When to deviate

If `stateImportTempo`'s signature or bounds differ from E48's entry, follow the code and say so. If the tempo label on the Score screen does not read the stated tempo after the statement, stop and say which reader holds the old value; do not patch the Score screen.

## Report

Judgement first: the sheet's tempo line and the score's tempo label after a statement, as observations; then Done / Not done / Follow-ups / Questions / Files; the red lines; the tests table; exit codes; unverified beside what passes.

**Landed 2026-09-29** (Entry 122; 564e8e5f, merged fadfbe2e); handoff `handoffs/564e8e5f.md`. X24, X25 recorded.

**Approved with one required change 2026-09-29** (`responses/564e8e5f.md`): X3b (`X3b-tempo-restated.md`) keeps the control after a statement; X3c (X24) follows.
