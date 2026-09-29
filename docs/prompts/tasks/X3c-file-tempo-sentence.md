# X3c — The import sheet's sentence for a file's own tempo made truthful: the printed mark's beat unit and position read as the file wrote them, one contract for what the line says (the mark's own beat unit, or the opening tempo in quarter notes with the conversion said), and one opening-tempo reader shared with the learner-authored line

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/review/responses/564e8e5f.md` (the X3a review: X24 is its own seam; `fileTempo` takes the first `<per-minute>` and labels it a quarter-note tempo regardless of the mark's `<beat-unit>` or position, so half note = 60 is said as "♩ = 60" even where the score opens at 120 quarter notes a minute, and a later change can be said as the opening tempo; the prune line: one opening-tempo reader for quarter-note claims once X24 lands, a distinct printed-mark reader only if the UI deliberately reports the mark's own beat unit); `docs/prompts/entry-122.md` and `entry-128.md` (X3a and X3b: `openingTempo` reads the first `<sound tempo>` for the learner's tempo); `app/src/ui/importSheet.ts` at `fileTempo` and `openingTempo`; `docs/prompts/entry-115.md` at E32 (the text mark read at the door: the glyph's note, or the metre's beat where the glyph is missing, written as a measure-level `<sound tempo>`).

## What is decided

1. **One contract, chosen and said.** The sentence for a file's own tempo reports the *opening* tempo — the first `<sound tempo>` in the stored score, in quarter notes a minute, the same reader the learner-authored line uses (`openingTempo`) — and, where the file's first printed mark has a beat unit other than a quarter note, says the mark too: "The file says 𝅗𝅥 = 60 (120 quarter notes a minute)". Where the file writes no `<sound tempo>` and the door's E32 reading wrote one from a text mark, the sentence says "The file's mark says … ; the app reads it as …". A later tempo change is never said as the opening tempo. This is the orchestrator's choice between the reviewer's two branches (report the mark, or convert and say so): both, so nothing the page prints is contradicted and nothing the player does is hidden; the reviewer may prefer one.
2. **One reader.** `fileTempo`'s regex over `<per-minute>` goes; the opening quarter-note tempo comes from `openingTempo` for both claims; a small printed-mark reader (`<beat-unit>`, `<beat-unit-dot>`, `<per-minute>` of the first `<metronome>`) exists only to say the mark's own unit beside it. Words in `IMPORT_TEXT`.
3. **Tests, red first:** a half-note mark of 60 (opening 120 quarter notes) says both; a quarter-note mark says one number; a mark only in bar 2 with a `<sound tempo>` of 100 at the opening says 100 as the opening and does not say the bar-2 mark as the opening; a text mark read by E32 says the mark and the app's reading; the learner-authored line unchanged (X3b's twice-stated case preserved).
4. **Not X3c's:** the Score screen's tempo label; the store; the count-in; U84 and U85.

## Verification layers

Unit, red first (`importSheet.test.ts` on constructed stores); browser, on port 4353: `import-experience.spec.ts` and `converted-import.spec.ts` preserved, one new case if a fixture with a non-quarter mark exists (else the unit cases carry it and the entry says so); `specs-exist` before the step. The product look: the tempo line for a half-note-marked fixture at 342 × 740, as an observation; nothing heard.

## Rules and files

You own `app/src/ui/importSheet.ts` at `fileTempo` and the printed-mark reader, `app/src/ui/help.ts` at the sentences, `app/tests/unit/importSheet.test.ts`, `app/tests/e2e/import-experience.spec.ts` if a case is added, a fixture under `app/tests/fixtures/imports/` with its generator script if one is needed (name it in the map's fixtures row — the drift test will ask). Not `importStore.ts`, not the Score screen, not `docs/04` (a doc row). A fresh worktree's `npx vitest run` needs `python tools/midi-cleanup/tests/parity_reference.py` and `python tools/content/build.py --offline` first (Q24; copy `app/public/content` from the main checkout if the offline build cannot produce it, and say so). Never name an AI model. Never assert a number measured on this machine. Every change red first; no commits, pushes, stashes or checkouts.

## Sequencing

After X3b lands (the same file). A narrow truth seam under X3's contract (788427c), dispatched with a for-information line; its post-build review closes X24. No other import-door brief before it (the reviewer's line).

## When to deviate

If the stored score's first `<sound tempo>` and the first printed mark disagree in a fixture the door wrote (E32's reading), say which and report the `<sound tempo>` as what the app plays, the mark as what the page prints.

## Report

Judgement first: the tempo line for a half-note-marked file and for a text-marked one, as observations; then Done / Not done / Follow-ups / Questions / Files; the red lines; the tests table; exit codes; unverified beside what passes.

**Landed 2026-09-29** (Entry 129; b71a55ca, merged 7e50c31c); handoff `handoffs/b71a55ca.md`.

**Approved with one required change 2026-09-29** (`responses/b71a55ca.md`): the sheet's words true; the score model's tempo path must consume one canonical tempo map before another import door opens — X3d (`X3d-one-tempo-map.md`). X26 (the old reader pruned) and X27 (the fractional policy) accepted; X30 (the glyph weight) a later wave.
