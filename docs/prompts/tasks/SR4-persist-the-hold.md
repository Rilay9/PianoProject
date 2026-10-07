# SR4 — the hold is stored on the run when the app knows it; credit reads the stored fact

The brief is `docs/prompts/runs/curriculum-review-2026-10-05/briefs/sr4-persist-the-hold.md`, the reviewer's required change on SR3 (`docs/review/responses/sr3-lb1-landing.md` §3): the stored phrase is evidence of what was generated, not of why, so the held fact is written on the run header at play time (`opened.hold`) and the credit exclusion of Entry 262 reads it; legacy rows with no hold are never guessed; `material` stays the phrase's identity; no `DB_VERSION` change (every row path copies the whole row, verified). An adversary that moves a demand in the vocabulary flips Entry 262's inference and leaves the stored fact alone. Nothing heard.

The harness is `operating-procedure.md` §13 and §14. Never name an AI model in any file.

## Record

lane: SR4 · closes: — · entry: 264
index: The hold stored on the run header at play time (`opened.hold`, decided by `storedHold` when the phrase is written) and read by `rungState` for credit; the inference `heldBelowItsRung` deleted; legacy rows never reclassified; the vocabulary-move adversary red on Entry 262's code; the round trip through the store, the evidence job, compaction, backup and restore verified (`SR4-persist-the-hold.md`) | app | landed 2026-10-06 (`SR4-persist-the-hold.md`); Entry 264
in-flight: landed 2026-10-06 (`SR4-persist-the-hold.md`): SR3 closed by the reviewer's own words once this lands; the artefact review follows (Entry 264)
state: landed 2026-10-06: in Entry 264's record commit (Entry 264)
