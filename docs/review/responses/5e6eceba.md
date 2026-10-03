# Reviewer response — X3d implementation `5e6eceba`

Implementation HEAD: `5e6eceba` (merged at `d71146cb`). Seam reviewed: **X3d only**. X1 and later seams remain independent.

## Verdict

**APPROVE WITH ONE REQUIRED CHANGE**

For partwise MusicXML, X3d replaces OSMD's conflicting tempo interpretation with one explicit map. The implementation normalizes the printed beat unit and dots, gives `<sound tempo>` precedence at the same position, preserves later changes on the unrolled repeat timeline, and makes the Score label, playback clock, count-in, measurement and import sheet consume the same result. The six required adversaries and the two named bundled pieces exercise the real extraction path.

### BLOCKS NEXT BRIEF — the canonical reader must cover the MusicXML form the import door accepts

`importStore.ts` explicitly accepts either `<score-partwise>` or `<score-timewise>`, and `trimMusicXml.ts` likewise treats both as supported score forms. The new canonical reader explicitly does not read the timewise form: its `PART` traversal finds no `<part>` container around measures in a `score-timewise` document, so `tempoEvents` is empty.

That creates the exact contradiction X3d is meant to remove for a supported import: a timewise file can render through the accepted import path while its written opening tempo and later changes are replaced by the app default in the score model; the import sheet also reports no written tempo because it calls the same empty reader. This is not a rare-tag enhancement. It is an uncovered branch of the door's declared input contract.

Make the one tempo reader handle `score-timewise` with the same event, precedence, opening and position rules, or make the import boundary convert timewise to the canonical partwise representation before any tempo consumer runs. Do not add a second tempo reader or silently reject tempo only. Add a real-path regression proving a timewise opening mark/`<sound tempo>` and a genuine later change produce the same sheet text, label, playback/count-in and map as their equivalent partwise score.

X24 and X29 remain open until this supported-form hole is closed.

## Rule decisions

- **CONSTRAINS NEXT BRIEF — first tempo after rests only:** accept the builder's rule. If no sounding note precedes the first tempo event, copying that event to beat 0 gives the count-in and first sounding note the same stated tempo. Keeping the original event at its written position preserves repeat behavior.
- **CONSTRAINS NEXT BRIEF — first tempo after sounding notes:** keep the brief's rule. Once notes have sounded, the first written tempo is a change at its actual position, not retroactive evidence of the opening tempo. The four corpus examples should remain default-then-change unless their files state an earlier sounding fact.
- **LATER WAVE — `<sound time-only>`:** the recorded omission may remain separate while no accepted corpus case or current brief requires pass-specific tempo.
- **LATER WAVE — Python difficulty parity and the remaining store regex:** X31 and the recorded store follow-up stay with their named owners; neither justifies duplicating the canonical app tempo interpretation.
- **PRUNE/MERGE — OSMD tempo heuristics:** keep them out of learner-facing tempo truth. No consumer should fall back to `CurrentBpm` or tempo-word guesses.

## Verification basis

I read the immutable handoff first, Entry 133, the exact `tempoFromXml.ts`, score-model placement, import-sheet consumer, the named unit/browser tests, map row, corpus/adversary tables, picture metadata and status artifacts at `5e6eceba`. The targeted tempo units, 101 targeted browser cases, typecheck, lint, map tests and app build are recorded green. The full unit record has two unrelated lesson-claim failures, and the offline content build has the disclosed missing-library catalogue failures; neither changes the tempo mechanism. A local rerun was unavailable because dependencies were not present in this execution checkout, so the committed red/green artifacts and direct code inspection are the verification basis.
