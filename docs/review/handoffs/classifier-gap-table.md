# Reviewer handoff: the classifier gap-analysis table, to your corrected brief

**Scoreboard: 1 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.** All other work is stopped by the owner; this is the only lane. Supersedes `classifier-architecture.md`.

Respond in `responses/classifier-gap-table.md`. Nothing heard. Your brief is `docs/prompts/inputs-2026-10-07/classifier-review.md`; the table is `docs/classifier/generated/table.md`, its splits `generated/judgment.md`, its source `docs/classifier/characteristics.yaml`, the counts `generated/summary.md`, the folder's `README.md` for the schema.

## What it is

One table, 193 rows, each a characteristic placement needs: the placement question it serves (cope / exercises / material) and the places that read it, the pipeline, one of your five classes, the current code as file:line, EXISTS / PARTLY / MISSING, the gap. EXISTS only where that code has run on real catalogue items (the build's 2,020 measured items). Every JUDGMENT row (7) is split into measurable rows plus a residual. The counts: 54 EXISTS, 53 PARTLY, 86 MISSING; 99 CODE-EXACT, 57 CODE-RULE, 24 CODE-INFERENCE, 6 EXTERNAL, 7 JUDGMENT. No rule has a source; no rung is decidable; the earlier "4 rungs decidable today" is withdrawn.

Your four additions are in: two pipelines (`generated.*` and `integrity.*` rows, provenance levels in the README), every JUDGMENT row split, the constrained agent packet (README), one definition per fact (`onedef: detect.ts` on the rows the app shares).

## Asked

1. **Omissions.** Which characteristics placement needs that the table lacks. The areas you named are all present as `area` values; the thin ones by my reading are coordination (5 rows) and style (3).
2. **The JUDGMENT rows** (`judgment.md`): for each of the seven, can the residual be reduced further; is any split's measurable list wrong.
3. **Class and status.** Any row whose class is too optimistic (CODE-EXACT that is really a rule or an inference), or whose EXISTS you doubt: the code cited is where to look.
4. **The pedagogy rows** (`target.*`, `item.*`, `role.suitability`, `transfer.distance`): these are my reading of your prevalence / distribution / salience / isolation / interaction / continuity / progression / representativeness / transfer-distance list. Say what is missing or misnamed.

## What is enforced, and what is not

Nothing here closes a ruling; these are the mechanisms as they stand on HEAD.

| Clause | Implementation | Test | CI path |
| --- | --- | --- | --- |
| Every rung concept, track, stage and ability covered, none extra | `tools/classifier/build_matrix.py` (`same`) | the script's exit code; `--check` for staleness | none: not in CI (absent) |
| Every row complete and legal; EXISTS needs code; JUDGMENT needs a split that names no JUDGMENT row | `build_matrix.py` (row validation) | the same | none (absent) |
| An UNKNOWN never becomes FITS; two witnesses must agree; the agent packet | not built: no classifier exists | none | none (absent) |

## Clause map

No ruling closes in this handoff.
