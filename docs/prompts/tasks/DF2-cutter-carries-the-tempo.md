# DF2 — a one-hand cut carries the printed tempo; the one-staff hand mismatch traced

The brief is `docs/prompts/runs/curriculum-review-2026-10-05/briefs/cutter-carries-the-tempo.md`; found by the latin.4 probe (Entry 241). The Bizet left-hand cut shipped at the converter's default 96 against the printed ♩ = 60 because `convert.normalise` drops the silent treble staff after the cut and the mark with it. Fixed at the mechanism, red first; the held approval row re-merged. The hand mismatch (a one-staff score reads as the right hand) is traced to `extractScoreModel`'s staff-number rule, pinned by CL15, and needs a reviewer ruling before a fix.

The harness is `operating-procedure.md` §13 and §14. Never name an AI model in any file.

## Record

lane: DF2 · closes: — · entry: 243
index: A one-hand cut carries the source range's tempo marks from the dropped staff, a cut with none keeps the default and the `tempo-defaulted` tag; the Bizet left-hand cut in the catalogue at 60; the one-staff hand mismatch traced to CL15's rule, for a ruling (`DF2-cutter-carries-the-tempo.md`) | content | landed 2026-10-06 (`DF2-cutter-carries-the-tempo.md`); Entry 243
in-flight: landed 2026-10-06 (`DF2-cutter-carries-the-tempo.md`): eight tests red first; the five older cuts byte-identical; the hand fix waits on the reviewer (Entry 243)
state: landed 2026-10-06: in Entry 243's record commit (Entry 243)
