# T27 — The difficulty instrument corrected, every estimate re-run, the comparison re-done

**Read `docs/prompts/working-rules.md`, `docs/00-invariants.md`, the checklist in
`CLAUDE.md`, `tools/content/difficulty.py`, `fit_level_model.py`,
`export_levelling_fixture.py`, `tests/test_levels.py`, and `docs/pending-review.md`
Entry 51 in full (the three measurement artefacts with the exact lines, the anchors table,
the verdict rule, the rung-band finding, and its follow-ups) first.**

## Do

1. **Chord symbols are not sounding notes.** `difficulty.features()` walks `<harmony>`
   into the chord counts. Fix it so a printed symbol contributes nothing to span,
   simultaneity, crossings or note density; keep a separate `chordSymbols` feature only if
   the model already has one. Test seen red on a lead-sheet fixture.
2. **Two voices on one staff are not one hand.** Where a staff carries two voices, measure
   span and simultaneity per voice, or per the app's own hand assignment if
   `extractScoreModel` has one; say which and why. Test seen red on the *Black Bottom
   Stomp* bar Entry 51 names.
3. **Ledger ratio and octave placement.** Decide, with evidence from the 164 anchors,
   whether `ledgerRatio` should be measured relative to the piece's own median register
   or left as is; do not change it without the anchor evidence; say the decision.
4. **Refit** the level model on the judged set with the corrected features
   (`fit_level_model.py`), report the fit against the previous one on the same anchors,
   and re-estimate every `levelSource: estimated` item; splice the new levels into
   `content/sources/*.json` only where the change is at least 0.3 of a level (state the
   count), with `levelFrom: model-2026-09-22` or whatever field the row already carries.
5. **Re-run Entry 51's comparison** with the corrected features over every estimated item
   on a rung; list the `above(n≥2)` items now, re-level them with the comparison on the row,
   and check every rung still clears the floor. Never force an item onto a rung; never
   pad.
6. **The rung bands.** Entry 51 says a handful of rungs reach four or five levels above
   their stage. List them with their options' levels; where a band is wide only because
   one option is far above the rest, say so; do not change a band in this task, record
   it for the owner with the list.
7. `build.py --offline`, `validate.py`, `rung_audit.py`, `ladder_report.py`, the Python
   test suite, and `npx vitest run app/tests/unit/lessonClaims*.test.ts app/tests/unit/lessonShape.test.ts`.

## Rules

- Files: `tools/content/difficulty.py`, `fit_level_model.py` and their tests, the model
  parameters file they write, `content/sources/*.json` (splice only), `docs/generated/ladder.md`,
  `docs/03` where the model is described, one appended entry in `docs/pending-review.md`
  (Entry 53). Do not touch `app/` (another agent is there). Splice JSON, never re-serialise.
- Never name an AI model. Commit nothing. An absence needs two searches; a plural is
  several claims; a measured feature is a proxy for difficulty and nothing is heard.
- Every item done or a not-done line with the reason. Keep a handoff file current in your
  scratch folder. Never stop silently.

## Final message

The three artefacts fixed or decided; the fit before and after; items re-estimated and
how many moved; the new above(n≥2) list and what was done; rungs under the floor; the
rung-band list; verification counts; what is unverified.
