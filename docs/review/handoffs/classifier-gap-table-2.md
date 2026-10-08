# Reviewer handoff: the gap table with evidence and decision separated, and the coordination pass

**Scoreboard: 1 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.** All other work is stopped by the owner; this is the only lane.

Respond in `responses/classifier-gap-table-2.md`. Nothing heard. Your ruling is transcribed in `responses/classifier-gap-table.md` with four REVIEW-OPEN lines; this handoff answers the first three and leaves the fourth open. The table is `docs/classifier/generated/table.md`, the counts `generated/summary.md`, the splits `generated/judgment.md`, the schema `docs/classifier/README.md`.

## What changed

- **CGT-evidence-decision-split.** `cls` is gone. Every row carries `evidence` (EXACT, INFERRED, EXTERNAL), `decision` (DIRECT, SOURCED_RULE, CALIBRATED_MODEL, JUDGMENT) and, where derived, `from` (its chain). The script rejects a CALIBRATED_MODEL row without `from`, a SOURCED_RULE row without `src`, and a circular chain. The four rows you named are now EXACT evidence with a SOURCED_RULE (`item.progression`) or CALIBRATED_MODEL (`difficulty.coordination`, `difficulty.expressive`, `technique.endurance`) decision; the same correction was applied to every difficulty component, the pedagogy rows (concentration, salience, interaction, continuity, transfer distance, role suitability), `technique.five-finger`, `technique.position-shift`, `technique.playability`, the integrity rows with a threshold, and `scale.collection`. Rows that derive from an inferred key or inferred chords now say INFERRED evidence (harmony progression, applied chords, cadence, bass behaviour, melody-to-chord relation, the twelve-bar and turnaround forms). The summary's cross-table shows the result: the DIRECT column alone is settled by the observations.
- **CGT-coordination-pass.** Eight rows added under `coordination`: synchrony share, rhythmic independence, unequal rates, articulation conflict, dynamic balance, register overlap, pedal with hands, sustain-vs-move; with `texture.motion`, `texture.alternating-hands`, `texture.polyrhythm`, `texture.hand-independence`, `coordination.interaction` and `difficulty.coordination` the area now holds every relationship in your list. `difficulty.coordination` reads the new DIRECT rows through `from`.
- **CGT-judgment-not-ceiling.** Stated in `judgment.md`'s head, the README and the summary; the research list has a new section for rows built on INFERRED evidence, each to say what the item gets when that input is UNKNOWN.
- **CGT-no-extractors-yet.** Nothing built. Stays open until you say so.

## Asked

1. Any row whose `decision` is still too optimistic: a DIRECT that hides a rule, or a SOURCED_RULE that is really a model.
2. Whether the coordination area now covers your list, and what is still missing.
3. Whether the research list's new section 4 (rules over INFERRED inputs) is the right place for the "may retain ambiguity" rows, or they need a field of their own.

## What is enforced, and what is not

Nothing here closes a ruling; these are the mechanisms as they stand on HEAD.

| Clause | Implementation | Test | CI path |
| --- | --- | --- | --- |
| Every row has evidence and decision; CALIBRATED_MODEL has `from`; SOURCED_RULE has `src`; no circular chain | `tools/classifier/build_matrix.py` (row validation, `reaches`) | the script's exit code; `--check` for staleness | none: not in CI (absent) |
| Coverage against the curriculum, both ways | `build_matrix.py` (`same`) | the same | none (absent) |
| An UNKNOWN never becomes FITS; the agent packet | not built: no classifier exists | none | none (absent) |

## Clause map

No ruling closes in this handoff.
