# Reviewer handoff: the placement classifier and verifier, architecture before any code

**Scoreboard: 1 / 28 MUST abilities shipped. PACKET-TRACE: PARTIAL 96, MISSING 5.** All other work is stopped by the owner; this is the only lane.

Respond in `responses/classifier-architecture.md`. Nothing heard. Read `docs/classifier/README.md` first, then the three yaml files beside it and `docs/classifier/generated/` (written by `tools/classifier/build_matrix.py`). The owner's words are `docs/prompts/inputs-2026-10-07/owner-classifier.md`; FABLE §2 item 7 records the direction.

## What it is

Rules first, then code, as the owner asked: for every place an item can go (110 rungs, 15 tracks, 10 stages, 28 abilities), the rule that would decide it, the characteristic each rule reads, and how each characteristic is measured. It places nothing. The script fails on any rung concept, track, stage or ability missing or extra against its source list, and on any rule naming an undefined characteristic; it found one concept I had missed (`trading-fours`) on its first run.

## Asked

1. **The rule shape.** A rung rule is per requirement slot (its exercise and song options show its concepts at a stated density, inside its band, nothing untaught); a track or ability rule is a characteristic signature; an UNKNOWN never becomes FITS. Say whether this shape can express what the curriculum needs, or what it cannot.
2. **The concept mapping** (`concepts.yaml`, 286 rows) is my reading of each concept name with the rungs that use it (`generated/rungs.md`). Check the rows you doubt; name each wrong row and why. In particular: the 70 concepts marked not item properties (played, activity, drill, app), and the 21 marked ambiguous or duplicate.
3. **The method column** (`characteristics.yaml`): is any characteristic marked `existing` or `library` that is not really measured that way, or any `matcher` a library already does? The library facts were checked against the installed music21 10.5.0 and partitura 1.9.0; nothing else was installed or checked.
4. **The pilot.** I propose choosing the pilot track by measurement: the first track whose items overlap an outside list (a graded set or a published example list). Say whether that is the right criterion, or name a better one.

## What is enforced, and what is not

Nothing here closes a ruling; these are the mechanisms as they stand on HEAD.

| Clause | Implementation | Test | CI path |
| --- | --- | --- | --- |
| Every rung concept, track, stage and ability is covered, none extra | `tools/classifier/build_matrix.py` (`same`) | the script's own exit code (`--check` for staleness) | none: not in CI yet (absent) |
| Every rule names a defined characteristic | `build_matrix.py` (reference loop) | the same | none (absent) |
| An UNKNOWN never becomes FITS | not built: no classifier exists | none | none (absent) |
| Two witnesses agree | not built | none | none (absent) |

## Clause map

No ruling closes in this handoff.
