# Review response — Q47 pre-dispatch brief

Brief HEAD: `f52ebde`  
Seam: Q47 and Q46, pre-dispatch only  
Verdict: **APPROVE WITH ONE REQUIRED CHANGE**

## Required change — BLOCKS NEXT BRIEF

Make the three-recording extraction verifiable from the published MAESTRO v3.0.0 archive before dispatch. The brief names the local aliases expected by `test_converter.py`, but it does not identify the corresponding archive members or a rule for matching them. `build/midi-real/SOURCE.md` is local and absent from the reviewed commit, so a builder following only this brief could select a different performance of the same work, silently mislabel a file, or restore a cache that lacks one intended file.

Amend the brief to require an explicit mapping from each archive member (or a unique match against the archive's published metadata) to each of the three local aliases. Verify the archive SHA256 before extraction, reject zero or multiple matches and missing/empty MIDI files, and record the source member names, aliases, dataset version, archive checksum, licence URL and citation in `SOURCE.md`. Validate the same three files and `SOURCE.md` after a cache hit. A cache restore is not proof that the required inputs exist. The publisher gives the MIDI-only v3.0.0 SHA256 as `70470ee253295c8d2c71e6d9d4a815189e35c89624b76d22fce5a019d5dde12c` (https://magenta.withgoogle.com/datasets/maestro).

## Decisions and other findings

- **CONSTRAINS NEXT BRIEF — licence:** The publisher offers MAESTRO under CC BY-NC-SA 4.0 and requests the paper citation and dataset version (https://magenta.withgoogle.com/datasets/maestro). Using the MIDI files as test inputs for this personal, noncommercial project, without bundling them into the app, is consistent with that stated licence purpose. The brief should not call them categorically “not redistributable”; the licence permits sharing subject to its terms. Keep the licence notice, URL, attribution and version with the cached files; do not commit or upload the archive or test MIDI as app artifacts. This is a reading of the published terms, not a determination about every possible use of the project.
- **CONSTRAINS NEXT BRIEF — CI failure rule:** Approve a developer skip and a CI failure when the real files are absent. Q24's own rule is that a CI-provided input is a gate. The parity-reference script must also fail under CI when any of the three required real inputs is missing, even if it wrote committed-fixture references; its present `return 0 if written else 1` would otherwise conceal a partial fetch.
- **CONSTRAINS NEXT BRIEF — split parity:** Approve the deterministic committed one-track fixture. The current four CI references have no `handSplit`, so the split case skips four times; the new fixture should assert a non-null split in the reference writer and actually run the matching Vitest case, even without MAESTRO.
- **CONSTRAINS NEXT BRIEF — path:** Approve resolving `build/catalog.generated.json` from `test_technique_units.py`'s file rather than the process working directory.
- **LATER WAVE — documentation:** Put the dataset licence and citation decision in `docs/00`'s licence notes as well as `SOURCE.md` and the workflow comment, with a pointer to this test-only use. That makes the policy discoverable beside the project's existing public-build licence rules. It need not hold dispatch once the required mapping and cache validation are specified.

## Basis and scope

This is a brief review; no Q47 implementation exists at `f52ebde`. I read the exact handoff and brief, the current workflow's harness and parity steps, the real-recording skip and reason, the reference writer's missing-file behavior, the parity skip, the technique-units path, Q46/Q47's matrix rows, Entry 89 and the test-map record. I checked the publisher's v3.0.0 download, SHA256, licence and citation instructions directly. The required change addresses a gap in the proposed verification mechanism; it is not a finding that the unbuilt code already misidentifies recordings. Dispatch still waits for the recorded lane measurement and file ownership boundary.
