# Reviewer handoff — U110: rows the window grants never overlap at the frozen size: a slot priced from a zoom the search only tried, and a reshape ladder that ran out on a grant, both fixed in the window plan (Entry 212)

Implementation HEAD: bbbdffb0 (merged at 407d58e1; the entry and this handoff in the record commit at HEAD). Respond in `responses/bbbdffb0.md`. Dispatched at `3461cba9` under the reviewer's ruling (`responses/9e14839e.md` section 3): rows the window plan grants never overlap at the frozen size, never by shrinking below the floor or dropping look-ahead unconditionally; U110 alone owns the overlap fix.; the brief reviewed before dispatch.

## What is asked

One question, in `chainU110/handoff-questions.md`: whether the guard is inside the ruling's narrow fix, given no test pins it.

**What a learner sees.** On a phone held upright (360 x 780), Ode to Joy with both hands now draws two clean rows on every load, at the same size as before; the chord symbols and fingering no longer sit inside the row above. During a run the greyed next bar comes in below as the window turns. At rest under bars 1 and 2 there is no greyed third row, because two rows already fill the stage. Hot Cross Buns and the Nocturne at 360 x 780 keep their look-ahead row.

**Mechanism, as measured.** The brief's refuting test fired: at rest the priced and drawn heights agree, so the hypothesised stale `drawnRowPx` was not the cause. The cause: while the chrome laid out, the stage changed height three times; each change ran an engraving search that tries zooms and then re-engraves at zoom 1, and the re-engraving priced the window with the tried zoom's transform against the piece measured at zoom 1, so rows priced at 170 px instead of 298 and a third row was granted. The correction that followed spent a step of the reshape ladder; whether a load ended clean or overlapped depended on whether the ladder ran out on a correction or a grant. The zoom gate alone removes the mispricing (and clears U113's Twinkle cell at 360 x 780). The brief's own mechanism, a look-ahead row priced from the rows drawn, does occur on Twinkle at 342 x 740 with bars 3 while the chrome lays out (about 85 ms of three rows that do not fit on the committed code): U113's Observation 1.

**Evidence.** 128-load sweep: 6 overlapping before, 0 after, 120 identical, one Nocturne row moved 1 px. The new ink check runs in every window-rule cell: red on the committed renderer and on the guard alone, green on the final. The chain on the merged tree is in the note above.

**Question.** The guard (once the reshape ladder is spent, drop a look-ahead row the rows drawn at this zoom show has no room; measured answers only; it can only remove rows) is kept so the self-referential flip can never end on rows that do not fit. No test pins it: removing it leaves every test green, and the builder found no settled case it decides. Is it inside the ruling's narrow fix, or should it go until a case shows it is needed?

## Files to inspect

`app/src/score/WindowRenderer.ts`; `app/tests/e2e/score.window-rule.spec.ts` (the U110 case and the ink check in every cell); `docs/08-score-render-states.md` (invariant 40, section 4.1), `docs/04-ui-spec.md` section 5, `docs/08-test-map.md`; `docs/prompts/runs/U110/` (the entry, pictures before and after at 360 x 780, pricing logs, the sweep and gallery comparisons, the red logs, the probe scripts).

## Not done, with the reason

See the entry's Not done lines.

## Do not re-review

The ruling's boundaries (no shrink below the floor, look-ahead kept wherever it fits); U122 + CL07's chrome model, which uses this cell as acceptance and does not fix it again.
