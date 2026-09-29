# X3b — X3a finished: the tempo control stays after a statement, seeded from the score's current opening quarter-note tempo, and every later statement goes through the same store operation, so a mistyped tempo has a way back; a regression that states twice and proves the line, the stored `<sound tempo>`, the measurement and provenance, and the Score screen's label all carry the second statement

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/review/responses/564e8e5f.md` in full (the X3a review: X25 closes X3a; X24 is a separate seam, not this one; the store boundary preserved; the later-wave and prune lines); `docs/prompts/entry-122.md` (X3a: the control, `openingTempo`, the swap-or-tempo guard, the words); `app/src/ui/importSheet.ts` at the tempo line and its handler; `app/src/data/importStore.ts` at `stateImportTempo` (read only: it accepts a second statement and retries only while the source bytes are unchanged); `app/src/ui/help.ts` at `IMPORT_TEXT`.

## What is decided

1. **The control stays.** The presentation rule `tempo.whose !== 'yours'` becomes: the control is offered for every MusicXML tempo the store can state, including one that is already the learner's; a PDF gets none. After a successful statement the line redraws as learner-authored ("You stated ♩ = N") and the control remains, seeded from the returned score's opening quarter-note tempo (the first `<sound tempo>`, X3a's `openingTempo`), never from the field's last value.
2. **Every statement through the store.** A second statement calls `stateImportTempo` exactly as the first; the sheet writes no XML, widens no `updateImport`, manufactures no fact (the reviewer's constraint). A refused value keeps the store's words and the field as typed, as X3a built it.
3. **The regression, red first:** state one tempo, then state a second without closing the sheet or re-importing; the line, the stored `<sound tempo>`, the measurement and `facts.tempo` (learner-authored, the second number and time), and the Score screen's tempo label all carry the second statement; the first is nowhere. A unit case for the seeding rule (the control shows the current opening tempo after a statement, not the typed value) and one browser case in `import-experience.spec.ts`.
4. **Not X3b's:** X24 (the file-authored tempo sentence and its beat unit — its own seam next, before any other import-door brief); the Score screen's 70 % practice-tempo legibility at 342 px (U84, a Score-screen contract); the live-region announcement after a statement (U85, the accessibility sweep); one opening-tempo reader for both claims (the prune after X24).

## Verification layers

Unit, red first: the seeding case and the twice-stated case on a store fixture (`importSheet.test.ts`); browser, on port 4343: `import-experience.spec.ts` with the new case, `midi-import.spec.ts` preserved; `specs-exist` before the step. The product look: the tempo line after the first statement (the control present, seeded) and after the second, at 342 × 740, as observations; nothing heard.

## Rules and files

You own `app/src/ui/importSheet.ts` at the tempo line's presentation rule and seeding, `app/src/ui/help.ts` only if a string changes, `app/tests/unit/importSheet.test.ts`, `app/tests/e2e/import-experience.spec.ts`. Not `importStore.ts`, not `LibraryScreen.ts`, not the Score screen, not `docs/04` (a doc row in the entry). A fresh worktree's `npx vitest run` needs `python tools/midi-cleanup/tests/parity_reference.py` and `python tools/content/build.py --offline` first (Q24; copy `app/public/content` from the main checkout if the offline build cannot produce it, and say so). Never name an AI model. Never assert a number measured on this machine. Every change red first; no commits, pushes, stashes or checkouts.

## Sequencing

The X3a review's required change, a narrow fix-forward under X3's contract (788427c), dispatched with a for-information line; its post-build review closes X3a. X3c (X24) follows on the same file after this lands.

## When to deviate

If seeding from the returned score's opening tempo disagrees with `facts.tempo.value` on any fixture, say which and seed from the score (the store writes the score; the line reads it), recording the disagreement.

## Report

Judgement first: the tempo line after a first and a second statement, as observations; then Done / Not done / Follow-ups / Questions / Files; the red lines; the tests table; exit codes; unverified beside what passes.
