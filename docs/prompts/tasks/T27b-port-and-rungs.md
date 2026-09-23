# T27b — The app's half of the difficulty model corrected, and the pieces that sit above their stage moved off their rungs

**Read `docs/prompts/working-rules.md`, `docs/00-invariants.md`, the checklist in
`CLAUDE.md`, `docs/pending-review.md` Entry 53 (§1, §2, §4, "What is unverified",
"Follow-ups") and Entry 51's anchors table ("The anchors: what each stage's graded songs
actually ask") and verdict rule, `tools/content/difficulty.py` (`sounding`, `voice_lines`,
the crossing floor), `app/src/score/difficulty.ts`, `app/tests/unit/difficulty.test.ts`,
and `tools/content/export_levelling_fixture.py` first. Read nothing else whole; grep.**

## Do, in this order, a handoff line after each

1. **Port the two filters** to `app/src/score/difficulty.ts`: a printed chord symbol is not
   a sounding note (whatever OSMD or the score model hands the port for a `<harmony>`
   contributes nothing to span, simultaneity, crossings or note density); two voices on one
   staff are measured as separate lines for leaps and for the crossing floor, split by staff
   as the port's own comment says. State each rule beside the code the way the Python does.
   Regenerate `app/tests/fixtures/levelling.json` with `export_levelling_fixture.py`. Run
   `npx vitest run tests/unit/difficulty.test.ts` before and after and report both; the
   agreement test holds the two ports within 0.2 of a stage and must pass for the right
   reason (a filter ported, not a tolerance widened). A test seen red on a lead-sheet
   fixture and on a two-voice fixture in the TypeScript suite.
2. **`tools/content/import_pdmx.py` hardcodes `level_source="estimated"`** (Entry 53
   follow-up 2, Entry 51 follow-up 2). Make it read the row's own `levelSource` when present
   and fall back to `estimated`; a Python test seen red. Grep every reader of `levelSource`
   in `tools/` and `app/src` and say what each does.
3. **Pieces above their stage leave the rung.** Rule, from Entry 51's method and the model's
   own accepted error: a song option whose level exceeds the maximum level among the judged
   songs at its rung's stage (Entry 51's anchors table; recompute from
   `content/sources/*.json` rows with `levelSource: judged` and the stage files, and show
   the per-stage maxima) by more than 0.7 of a level is harder than anything a person graded
   for that stage, and the model cannot claim otherwise. Such an option is removed from the
   rung's `songOptions` (splice the stage file as text; it stays in the Library and in its
   source row) unless removing it would drop the rung under three song options, in which
   case it stays with the reason on the record. Known case to start from:
   `song.folk.i-give-you-my-heart.pdmx` at 6.73 on `hymns` (stage 3, band 2.6–7.3). List
   every rung checked, every option moved with its level and the stage maximum, and every one
   kept with its reason. Then narrow each touched rung's `levelBand` back to what its
   options span plus the slack it had before T27 widened it (Entry 53 §4 says which 18
   endpoints moved); `validate.py` must pass. Do not touch exercise or drill options.
   A lesson that names a moved piece must stop naming it (grep `content/lessons/` for the
   title and the id); `lessonShape.test.ts` counts options against the prose.
4. **The 168 scores with a voice id on both staves** (Entry 53, unverified): a script in your
   scratch folder that, per score, says whether the voice's notes on the second staff are
   interleaved in time with its notes on the first (a crossing voice) or form a separate
   run (numbering restarted per staff); the counts of each, and whether `difficulty.py`'s
   per-staff measurement is right for the crossing kind. Record the result; change the
   measurement only if a test shows a case where it is wrong, and say so.
5. **`docs/decisions/2026-09-06-p14-pdmx-quarry.md`** prints the old weights table. Leave
   the decision as written and add one dated line under the table saying the weights were
   refitted on 2026-09-22 and that `content/sources/level-model.json` holds the current ones.
6. `cd tools/content && python build.py --offline` (which runs `validate.py`, `rung_audit.py`,
   `ladder_report.py`), the Python test suite the way `docs/08-test-map.md` says to run it,
   then from `app/`: `npx tsc -b --noEmit`, `npm run lint`, `npx vitest run`. No Playwright.

## Rules

- Files: `app/src/score/difficulty.ts`, `app/tests/unit/difficulty.test.ts`,
  `app/tests/fixtures/levelling.json`, `tools/content/import_pdmx.py` and its test,
  `tools/content/export_levelling_fixture.py` only if it must change, `content/curriculum/
  stage-*.json` (splice only, `songOptions` and `levelBand`), `content/lessons/*.md` only
  for a moved piece's mention, `docs/generated/ladder.md` (regenerated), the one decision
  record line, `docs/03` where the model is described, one appended entry in
  `docs/pending-review.md` (Entry 56). Splice JSON as text; never re-serialise; the
  `CLAUDE.md` note on `0.0` versus `0` applies.
- Never name an AI model. Commit nothing. An absence needs two searches; a plural is
  several claims; a measured feature is a proxy and nothing is heard.
- Every item done or a not-done line with the reason. Keep `HANDOFF.md` in your scratch
  folder current after each item; a cap can end you at any moment and the next agent
  continues from that file. Never stop silently.

## Final message

Per item: what changed, the test seen red, counts; the list of moved and kept options with
the stage maxima; the fixture agreement before and after; what is unverified.
