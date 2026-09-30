# Reviewer correction — briefs at `fc9f1a8b`

This file corrects only the brief rulings in `docs/review/responses/questions-fc9f1a8b.md`. The four landed-seam responses (`cbdfe6f0`, `0ef15f3f`, `65ae9d5f`, `88df748b`) stand unchanged.

The correction incorporates the owner’s in-review clarification that the Zenodo PDMX archive (`PDMX.csv` / `mxl.tar.gz`) is available on the build machine through the path the PDMX tooling already names. E57’s PDMX count is therefore builder-owned and is not blocked on the owner.

## E57 — APPROVE WITH ONE REQUIRED CHANGE

The seam is correct to fix the converter mechanism rather than patch the three known kern rows, and the amended PDMX step is now in the right lane: count the raw PDMX inputs on the build machine, re-convert the affected rows, and carry every moved identity through the reviewed-repair relation.

**Required change: make the changed converter boundary domain-complete before dispatch.**

Two facts in the current brief are too narrow:

1. `normalise()` is not reached only by kern, PDMX and MuseTrainer. `import_mutopia.py` also calls `cached_convert(...)` without a `tempo_bpm` override, so Mutopia is exposed to the same `elif existing_tempo:` branch. Inventory every current batch caller that can reach this branch with no override, including Mutopia, and count/re-prove every actually affected shipped row. The local PDMX archive is part of that inventory, not a deferred owner step.
2. “Same position” alone is not sufficient to define a duplicate. Two different authored tempo marks can legitimately stand at the same musical position. The converter may collapse only **semantically duplicate co-located marks**: same musical position and the same effective quarter-BPM tempo (allowing only the representation noise already established by the source/parser). A co-located conflicting tempo must survive for the reader/evidence layer to interpret; do not delete it merely because its offset matches the first mark.

Pin both sides red first: the existing two-voice/same-tempo fixtures remain one mark, while two distinct-position marks survive, and add a same-position/different-tempo guard so the narrower dedup rule cannot regress into “first mark wins at this offset.”

Every shipped identity moved by this converter correction, whichever source family produced it, gets the same reviewed-repair continuity treatment and §12 content itemisation. No reader, lesson or importer-regex change belongs in E57.

With that single boundary correction to the brief, **APPROVE FOR DISPATCH**. The archive clarification itself needs no further reviewer round-trip.

## E59 — required change from the original response is widened to the actual branch boundary

The original response was right that E59 cannot be scoped to PDMX merely because the 169 PDMX rows were the newly discovered population. The correction is slightly broader than that response stated.

`convert.py`’s no-tempo `else:` is a shared conversion branch. The brief already establishes 169 PDMX, 60 kern and 6 MuseTrainer rows that went through equivalent default-tempo behavior, and `import_mutopia.py` is another no-override `cached_convert(...)` caller. Therefore the pre-build inventory must cover **every shipped output that actually takes this branch**, including Mutopia and any other current no-override batch caller, rather than stopping after the three source families X40 happened to inspect.

For every row the inventory proves uses the branch:

- preserve the default/suggested-tempo provenance and playback bpm;
- stop encoding the default as an authored printed metronome statement;
- account for the exact-byte identity consequence and use the reviewed-repair relation where identity moves;
- itemise the moved content under §12.

Do not manufacture a move for a family the fresh inventory proves does not take the branch. Do not merge E57 back into E59.

The existing **APPROVE WITH ONE REQUIRED CHANGE** verdict stands with this domain-complete scope replacing the narrower source-family list.

## X42 — required change stands; define agreement as serialization-equivalent, not X40’s evidence threshold

The original response correctly caught a category mistake in the brief: `R = 1.1` was X40’s anomaly/reporting threshold, not the semantic definition of two tempo statements agreeing. Reusing it in the reader would allow musically different values to be treated as the same statement.

One refinement: do not turn the reviewer’s illustrative `0.001` into another unexplained product constant. The contract should be **serialization-equivalent after beat-unit normalization**. Derive the numeric tolerance from the actual writer/parser noise the corpus demonstrates, and pin the boundary in tests. At minimum:

- Satie’s `76.0002` must agree with the printed 76;
- the known near-integer export noise such as `79.9998` versus 80 must remain representation-equivalent where the same shape is exercised;
- a genuinely different nearby value must not agree merely because it fell under X40’s 1.1 ratio threshold (the proposed 95 versus 100 guard is sufficient to kill that old rule).

The builder should report the chosen machine tolerance and the maximum observed serialization delta that justifies it. It must remain orders of magnitude below a musically meaningful tempo difference; it is an XML-number equivalence tolerance, not a musical tolerance.

Then re-run the corpus census and require the real behavior change to remain the already identified Maple Leaf positions and Satie opening. The rest of X42’s brief, including Brahms HD5, X34 and X41 boundaries, stands.

So X42 remains **APPROVE WITH ONE REQUIRED CHANGE**, with the semantic rule above replacing both `R = 1.1` and an arbitrary hard-coded reviewer epsilon.

## U113 — APPROVE WITH ONE REQUIRED CHANGE

The evidence/question lane is otherwise the right product process: measure the real renderer, present Rules A/B/C as consequences rather than recommendations, change no chooser, and leave the actual rule to the owner.

**Required change: the counterfactual must preserve the same user request.**

The current brief proposes asking for one fewer bar through `setBarsPerWindow`. That changes the requested count itself. Above 100% Size, the chooser’s baseline is the requested window’s own 100% fit, so “7 asked” is not necessarily the same counterfactual as “8 asked, but compare the 7-shown candidate.” The evidence handed to the owner must not silently change the premise it is comparing.

Use one of these two equivalent-safe shapes:

1. Preferably expose/read the alternate `shown` candidate from the same pricing pass while keeping `barsAsked` fixed, including its staff size and look-ahead consequence; or
2. if the lane intentionally limits the decision table to **Size = 100%**, state and pin that setting explicitly and prove in the probe that changing the requested count by one produces the same candidate geometry as the same-asked alternate before using `setBarsPerWindow` as the counterfactual.

Record the other settings that affect the chooser so all 24 cells are reproducible. Do not add a comfort threshold or select A/B/C in this lane.

With that evidence correction, **APPROVE FOR DISPATCH**.

## Administrative next-push edits

The stated §14 citation / parseable record-line updates are workflow bookkeeping and do not alter these product/implementation rulings. They may ride the next push without another semantic pre-review, provided they do not change the briefs’ scope or decisions above.
