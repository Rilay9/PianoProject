# In flight (rewritten at each change; the orchestrator's own working state, 2026-09-27 early morning)

## Running now, each in an isolated worktree under `.claude/worktrees/` (gitignored)

| Seam | Entry | What it owns | On landing |
|---|---|---|---|
| T53c | 86 | **accepted** (`responses/df71a0b.md`); the T53 chain closed | — |
| H0 | 87 | **closed**, approved by the reviewer (`responses/a008ba5.md`, unprompted); U66 recorded for X | — |
| F1 | 88 | **accepted** by the reviewer (`responses/a94baee.md`, unprompted through PR #1) | — |

## Waiting

- **D3** — **closed** 2026-09-28 (approved `responses/ee70b43.md`; D3a `c8717be.md`, D3b `4478793.md`, D3c `e85c162.md` accepted). Unheard; unverified as music.

- **D2a** — **closed**, accepted (`responses/b118750.md`).

- **D1 / D1a** — **closed**: D1a accepted (`responses/8a13eb1.md`); version 2 live; D3's brief released. **D2** (Entry 95) — **closed**, approved (`responses/7e148e0.md`). **U67** (Hear it after a reload) — **closed**, approved (`responses/deb0b4f.md`).

- **D0 / D0a** — **closed**: D0a accepted (`responses/3b9c37d.md`); B7 kept (G53), the arpeggios' notation to G52.
- **Q24** — **closed**, approved by the reviewer (`responses/e32d0ef.md`, unprompted); the MAESTRO download decided yes for testing by the owner on 2026-09-28 (Q47; licence re-read and quoted in the row; one small H seam with Q46).
- **D4** — **approved with one required change** (`responses/9193261.md`): D4a's brief **approved with one required change, applied** (`responses/1cbc38a.md`: the snapshot bound to the exact offer instance, pending means no play and no row); **D4a dispatched 2026-09-29** (Entry 109, port 4183); D4 closes on D4a's review. Nothing heard; unverified as music.
- **E2** — **landed** 2026-09-29 (Entry 107, merged 6cf08b2, chain green); handoff `handoffs/2532022.md`, **approved with one required change** (`responses/2532022.md`): E2a (the one gate, D4's contact bound, the seed concepts in the build) at the gate (`handoffs/1b09a1f.md`), E2's lane on approval; E0's untrusted-tempo verdict kept. Nothing heard; unverified as music.
- **F2** — brief approved with one required change, applied (`responses/12af708.md`); F2 **dispatched 2026-09-29** (Entry 108, port 4193) on D4's merged tree; its docs/08 rows go in its entry for the orchestrator to splice, so its files stay disjoint from E2's. X1 drafted while they build.
- **G1** — brief drafted 2026-09-29 (`G1-encounter-model.md`; the plan's G1 split: the encounter model now, the lifecycle as G1b); at the reviewer's gate (`handoffs/7863bee.md`); brief **approved with one required change, applied** (`responses/7863bee.md`: the durable summary before pruning, the facets by what happened, the visit id, the hearing kinds); dispatches on D4a's landing, port 4183. The owner, 2026-09-29: a usage reset is in hand, so throughput first — lanes open as briefs clear, the measurement recorded as it comes.
- **D5** — the microscope sweep (G55, G56, G60), brief drafted 2026-09-29 (`D5-microscope-sweep.md`); brief **approved with one required change, applied** (`responses/4088dfc.md`: the evaluator's verdict versioned and the version printed); **dispatched 2026-09-29** (Entry 110, port 4223), the fourth lane.
- **Q47** — brief drafted 2026-09-29 (`Q47-real-midi-in-ci.md`, with Q46); brief **approved with one required change, applied** (`responses/f52ebde.md`); dispatch waits for the lanes' measurement.
- **E1** — **closed** (approved `responses/8326ff3.md`; E1a accepted `4f7227d.md`). Nothing heard; unverified as music.
- **E0 / E0a / E0b** — **closed**: E0b accepted (`responses/c95ac32.md`).

## Standing rules in force tonight

- The reviewer's ruling of 2026-09-29 on the lanes: four running, no fifth; the three-seam measurement kept (each meter separately; building, waiting, integrating, reviewing and fixing times); near the five-hour limit stop dispatches first, then bring builders to a clean checkpoint (worktree committed, a short handoff: done, running, next command), resume the existing seams after the reset before any new one; D4a before G1, E2 before X3; drafting allowed, dispatch waits for the measurement.

- From Q24 (Entry 89): a fresh worktree's `npx vitest run` needs `python tools/midi-cleanup/tests/parity_reference.py` first (or `build/midi-parity/` copied from the main checkout), and its content tests fail rather than skip until the build has run with the Joplin edition present. Every brief that runs vitest in a new worktree says so.

- From F1's review: the reviewer treats uncommitted worktree logs as reported, not verified — on each landing, copy the seam's run captures (the exit-code and summary files, not the megabyte logs) into `docs/prompts/runs/<seam>/` beside the entry so the handoff's numbers can be checked.

- One handoff file per seam, named by the implementation commit, and a brief handoff file for each pre-dispatch gate, named by the commit that carries the brief; `current.md` a pointer only; a response is `responses/<same>.md`; verify every finding at the line; only findings acted on; dispositions in the next handoff.
- Verify by what a seam touches; never rerun a builder's full suite on the same tree; CI is the full run.
- PR #1 is the trigger; never merge it; batch docs-only pushes.
- Not tonight: E implementation, X, broader G, F's contested rows; nothing crosses the T53c → D0 gate.
- The watcher on `docs/review/responses/` is a Monitor re-armed every thirty minutes.
