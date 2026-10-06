# CI2 — the content job red since the quarry merge and the wave's eighth-note sentences

A fix-forward on two CI reds found by reading the conclusions on 8d833603 (2026-10-06); no brief preceded it, the mechanism was established first and the fix acts on it.

1. **The entry-point test** (`tools/content/tests/test_pdmx.py`, every script under `tools/content/pdmx/` answers `--help` with a usage line) failed on the four research files the outside reviewer's quarry merge brought in at 3680725f. Two are libraries and one is the quarry's own test runner, so they join the test's library exclusions with the reason; `quarry_lanes.py` read its two flags from `sys.argv` by substring, so `--help` ran a whole lane, which on CI crashed for want of the archive and on this machine rewrote `docs/review/pdmx-quarry-2026-10-05/` (observed twice here and once by the second builder). It now parses its flags with argparse and `--help` exits before any stage runs.
2. **The ownership table** (`tools/content/untaught_options.py`, `test_sixteenths_owner`): the wave's W1 counting sentence names eighth notes at 1.1, the root of every rung, so fifteen pairs on eleven rungs became B-mapping (a lesson at or below names the demand that no concept maps). The sentence says 2.2 teaches eighths; the readings for 1.1 and the reworded 1.2 are added to `READ_NOT_TEACHING`, which is the table's own place for a mention read and found not to teach.

Left as it was: the E2E shard 7 red (`session-held-skip.spec.ts`, G90a's three-size read-back), red since before the last green CI run on 2026-10-02; it is not this lane's.

The harness is `operating-procedure.md` §13 and §14. Never name an AI model in any file.

## Record

lane: CI2 · closes: — · entry: 234
index: CI's content job red since the quarry merge: the research scripts under the entry-point test, and the wave's eighth-note sentence at 1.1 read into the ownership table (`CI2-content-job-red-since-the-quarry-merge.md`) | tooling/CI | landed 2026-10-06 (`CI2-content-job-red-since-the-quarry-merge.md`); Entry 234
in-flight: landed 2026-10-06 (`CI2-content-job-red-since-the-quarry-merge.md`): the two content-job reds fixed at their mechanisms; the E2E shard 7 red left and named (Entry 234)
state: landed 2026-10-06: fixed forward in Entry 234's record commit; the E2E shard 7 red predates this session (Entry 234)
