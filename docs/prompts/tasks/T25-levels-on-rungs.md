# T25 — Every estimated level on a rung measured against what its stage already asks

**Read `docs/prompts/working-rules.md`, `docs/00-invariants.md`, the checklist in
`CLAUDE.md`, `tools/content/difficulty.py`, `docs/generated/ladder.md`, and
`docs/pending-review.md` Entry 48 item 5 (the method: measured features against the
songs a person graded, per track) first.**

## Why

A piece a learner cannot play, offered on a rung that says they can, is a usability
failure they cannot tell from their own failure. Levels on quarried items are the model's
estimates. Entry 48 checked eight pieces; nobody has checked the rest.

## Do

1. **Count first**: every item on any rung (from the stage files) with
   `levelSource: estimated`, per track and stage; say the number.
2. **Anchors**: the items with `levelSource: judged` (164 songs at the last count) grouped
   by stage of the rung they sit on; for each stage, the range of each measured feature
   `difficulty.py` uses (notes per second at the written tempo, span, hand independence,
   accidentals, and whatever else it measures) across the judged items.
3. **For every estimated item on a rung**, one per tool call: its measured features against
   its stage's judged range and its rung's `levelBand`. Verdict: **inside** (fine),
   **above** (harder than anything judged at that stage: a learner will fail it), or
   **below** (easier: harmless, note it). Evidence line per item.
4. **Act on "above"**: if the item is above its stage on more than one feature, set its
   `level` to what the comparison says with `levelSource: judged` and the comparison on
   the row (splice `content/sources/*.json`), then check the rung still clears the floor
   of three (`00` D21); if it does not, say so and do not pad. Never move an item to a
   rung it does not fit; never force one to stay.
5. `build.py --offline`, `validate.py`, `rung_audit.py`, `ladder_report.py` once at the
   end; `npx vitest run app/tests/unit/lessonClaims*.test.ts app/tests/unit/lessonShape.test.ts`.

## Rules

- Files: `content/sources/*.json` (splice only), `content/curriculum/stage-*.json` (splice,
  only a `levelBand` that the re-levelled items now fall outside), `docs/generated/ladder.md`,
  one appended entry in `docs/pending-review.md` (Entry 51) with the count, the anchor
  ranges per stage, every "above" item with its comparison and what was done, the
  "below" list, what is unverified. Do not edit `app/` (another agent is there).
- Never name an AI model. Commit nothing. An absence needs two searches; a plural is
  several claims; nothing is heard — a measured feature is a proxy for difficulty, and
  the entry says so.
- Every estimated item on a rung gets a verdict line. Never stop silently.

## Final message

The count; anchors per stage in one table; "above" items and what was done; rungs that
fell under the floor; verification counts; what is unverified.
