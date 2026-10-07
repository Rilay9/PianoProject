# Q24 review — e32d0ef

**Verdict: APPROVE**

Implementation reviewed: `e32d0ef478272c47fc0f7be766edbe367020e940` (merged on the handoff branch as `d9133af02fdeb9433f4251eb4c4dcde481ed7c31`). This response covers Q24 only.

## Evidence checked

I read the immutable handoff first, then Entry 89; every red, green, setup, probe, validation, typecheck, lint, and test capture it names; the complete implementation diff; the workflow; the new workflow-order test; and representative converted gate, environmental-skip, committed-fixture, and TypeScript parity sites at the implementation commit. I also checked the first GitHub workflow started by the recorded handoff commit: checkout, Node/Python setup, cache restore, and both dependency installs had succeeded, and `Build content` was running as step 8 before `Content pipeline tests`, `MIDI converter harness`, and `Write the MIDI parity reference`. Its final conclusion was not yet available at review time.

The change is confined to the workflow and tests. No product code or learner-facing assertion changed.

## Findings

1. **ACCEPT — BLOCKS NEXT BRIEF: the previously open CI gates are closed by construction.** The workflow now builds content before the content suite reads the catalogue, curriculum, and fetched Joplin edition; runs the converter harness after installing music21; and writes parity references before Vitest. `test_ci_order.py` checks each dependency edge and the cited step names. It is red in four precise ways on the old workflow, green on the implementation, and red on all nine discriminating mutants while three parser controls remain green. The live GitHub job independently confirms the intended fresh-run step order.

2. **ACCEPT — BLOCKS NEXT BRIEF: missing build and checkout inputs fail instead of disappearing.** The 17 built-content cases, five Joplin cases, fitted proxy, two round-trip cases, and parity suite now fail with the exact missing path and a producing command or checkout explanation. The precondition-removal captures show 17+5+1+2 expected failures, unchanged bytes after restoration, and green controls. After the build, the content suite reports 991 tests with only four environmental skips. The implementation changes only the precondition behavior; the assertions guarded by those preconditions remain intact.

3. **ACCEPT — BLOCKS NEXT BRIEF: Python/TypeScript parity is now an actual gate.** From committed inputs, `parity_reference.py` writes four references and the final parity run reports 38 passed and four design skips. Without those references, the final suite fails and names both the script and the CI step. The two intermediate red captures distinguish “the suite runs” from “the diagnostic remains valid when references exist,” avoiding a vacuous complement test.

4. **ACCEPT — CONSTRAINS NEXT BRIEF: fresh worktrees must honor the new prerequisites.** A consumer that runs content tests must build content first, and a consumer that runs Vitest must first run `python tools/midi-cleanup/tests/parity_reference.py`. This is an intentional fail-closed contract, not a regression. The recorded E0/in-flight note is the correct place to propagate it.

5. **LATER WAVE — MAESTRO and split-hands coverage remain intentionally outside this seam.** The harness runs 16 committed-input tests and skips nine real-recording tests because no CI step supplies the three MAESTRO files. The four committed parity references also do not exercise `splitHands`. Q46/Q47 correctly preserve these as independent follow-ups: either add a committed one-track/two-hand fixture for parity, or make a separately reviewed licensing and download decision for MAESTRO. This does not reopen any gate Q24 claims to close.

6. **PRUNE/MERGE — documentation and broader skip cleanup belong to their recorded seams.** Q25 owns stale parity wording and the test-map row; Q45 owns e2e/tour skip classification; the converter docstring command and `test_technique_units` working-directory sensitivity are small follow-ups. None should be folded into Q24 or used to hold the next architectural brief.

## Gate and owner decision

Q24 is closed. It establishes the fail-closed test prerequisites needed by subsequent builders and does not block D0 or another already-independent seam.

No owner decision is required for this approval. Whether CI should fetch MAESTRO is a Q47 policy/licensing decision; until then, the real-recording class and split-hands parity must remain explicitly described as ungated in CI.
