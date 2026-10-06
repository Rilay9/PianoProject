# DF1 — two live defects in what already ships: chord fingering on the ABC route, blues root spelling

The brief is `docs/prompts/runs/curriculum-review-2026-10-05/briefs/defects-abc-fingering-blues-spelling.md` (its decision rationale at its head; verified at HEAD b0588b4f before dispatch, 2026-10-06). The restart packet of 2026-10-05 named both defects; the orchestrator reproduced one file of each before the brief was written, and the lane measured all 33 authored ABC files before editing.

The harness is `operating-procedure.md` §13 and §14. Never name an AI model in any file.

## Record

lane: DF1 · closes: — · entry: 236
index: Chord-member fingerings reach the shipped score on the ABC route (236 marks on 7 of 33 files were dropped) and the twelve-bar blues roots are spelled by interval (`DF1-abc-chord-fingering-and-blues-spelling.md`) | content | landed 2026-10-06 (`DF1-abc-chord-fingering-and-blues-spelling.md`); Entry 236
in-flight: landed 2026-10-06 (`DF1-abc-chord-fingering-and-blues-spelling.md`): the converter reads a chord member by member and the export writes each finger on its note; the blues roots as P1, P4, P5; six shipped blues files byte-identical (Entry 236)
state: landed 2026-10-06: in Entry 236's record commit, with the second builder's landing (Entry 236)
