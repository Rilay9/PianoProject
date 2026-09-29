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
- **D4** — **closed** 2026-09-29 (approved with one required change `responses/9193261.md`; D4a approved `5193338.md`). Earlier: D4a's brief **approved with one required change, applied** (`responses/1cbc38a.md`: the snapshot bound to the exact offer instance, pending means no play and no row); **D4a landed** 2026-09-29 (Entry 109, merged 1476d8d, chain green); **approved** (`responses/5193338.md`); D4 **closed**. G1 **dispatched 2026-09-29** (Entry 112, port 4183) on the lanes answer. Nothing heard; unverified as music.
- **E2** — **closed** 2026-09-29: E2a approved (`responses/9571a7b.md`). X3 may consume the material layer; L113 (the rung's own list through the gate) is X1's and blocks X1's completion; the lesson seed site is E46's. Nothing heard.
- **F2** — **approved with one required change** (`responses/b41e19e.md`): F2a (leaps taught at 2.1, accidentals at 3.3, the practice rungs' prerequisites) **dispatched 2026-09-29** (Entry 117, port 4253); the five deferrals accepted temporarily (constrains E22); question 3 no. F2 closes on F2a's review; X1 after F2a and E2a.
- **G1** — brief drafted 2026-09-29 (`G1-encounter-model.md`; the plan's G1 split: the encounter model now, the lifecycle as G1b); at the reviewer's gate (`handoffs/7863bee.md`); brief **approved with one required change, applied** (`responses/7863bee.md`: the durable summary before pruning, the facets by what happened, the visit id, the hearing kinds); dispatches on D4a's landing, port 4183. The owner, 2026-09-29: a usage reset is in hand, so throughput first — lanes open as briefs clear, the measurement recorded as it comes.
- **D5** — the microscope sweep (G55, G56, G60), brief drafted 2026-09-29 (`D5-microscope-sweep.md`); brief **approved with one required change, applied** (`responses/4088dfc.md`: the evaluator's verdict versioned and the version printed); **landed** 2026-09-29 (Entry 110, merged 93ecc1e, chain green); **closed** — approved (`responses/458159e.md`). Nothing heard; every study unverified as music.
- **Q47** — **landed** 2026-09-29 (Entry 113, merged f52679a, the chain green after F2's technique-units table was aligned); handoff `handoffs/8668afb.md`, with the reviewer; the CI run on the push is the proof.
- **E1** — **closed** (approved `responses/8326ff3.md`; E1a accepted `4f7227d.md`). Nothing heard; unverified as music.
- **E0 / E0a / E0b** — **closed**: E0b accepted (`responses/c95ac32.md`).

## Standing rules in force tonight

- The reviewer's ruling of 2026-09-29 on the lanes: four running, no fifth; the three-seam measurement kept (each meter separately; building, waiting, integrating, reviewing and fixing times); near the five-hour limit stop dispatches first, then bring builders to a clean checkpoint (worktree committed, a short handoff: done, running, next command), resume the existing seams after the reset before any new one; D4a before G1, E2 before X3; drafting allowed, dispatch waits for the measurement.
- The reviewer's answer on the lanes (2026-09-29, after midnight): four active builders the cap for now, fix-forwards counting toward it, Q47 in a freed slot; both gates kept; fix-forward briefs and repeated evidence shortened. Applied: E2a (Entry 111, port 4203), G1 (Entry 112, port 4183) and Q47 (Entry 113, port 4213) dispatched beside F2.
- The queue confirmed (`responses/3e526f1.md`, 2026-09-29): F2a stays a separate reviewed seam if the F2 review requires any truth change, and X1 waits for F2a and E2a (or for E2a alone if F2's claims stand); G2 waits for G1 and the G68 reading, not for G1b; X3 behind E2a; the E-tail after F2 releases `validate.py` and the density owner states its rule; the T sweep after Q47 releases `ci.yml`; H1 then H2 last; a free lane is capacity, never architectural readiness.
- **U74** — brief drafted 2026-09-29 (`U74-window-fit.md`, with E30); brief **approved with one required change, applied** (`responses/a1c1fd6.md`: the existing observer is the starting mechanism, four causes told apart, the run-size contract kept); **dispatched 2026-09-29** (Entry 114, port 4233), the fourth lane.
- **X3** — brief drafted 2026-09-29 (`X3-import-experience.md`) on E2's closed layer; brief **approved with one required change, applied** (`responses/ef80e86.md`: the UI opens the sheet, the store mutates; the tempo through a semantic store operation or held; no key control); **dispatched 2026-09-29** (Entry 118, port 4263).
- **E-tail** (Entry 115, port 4243) and **Q-tooling** (Entry 116) — **dispatched 2026-09-29** under the concurrency policy; approved to proceed (`responses/d1562ef.md`: E33 re-cut now, Q65's fallback the full suites).

- From Q24 (Entry 89): a fresh worktree's `npx vitest run` needs `python tools/midi-cleanup/tests/parity_reference.py` first (or `build/midi-parity/` copied from the main checkout), and its content tests fail rather than skip until the build has run with the Joplin edition present. Every brief that runs vitest in a new worktree says so.

- From F1's review: the reviewer treats uncommitted worktree logs as reported, not verified — on each landing, copy the seam's run captures (the exit-code and summary files, not the megabyte logs) into `docs/prompts/runs/<seam>/` beside the entry so the handoff's numbers can be checked.

- One handoff file per seam, named by the implementation commit, and a brief handoff file for each pre-dispatch gate, named by the commit that carries the brief; `current.md` a pointer only; a response is `responses/<same>.md`; verify every finding at the line; only findings acted on; dispositions in the next handoff.
- Verify by what a seam touches; never rerun a builder's full suite on the same tree; CI is the full run.
- PR #1 is the trigger; never merge it; batch docs-only pushes.
- Not tonight: E implementation, X, broader G, F's contested rows; nothing crosses the T53c → D0 gate.
- The watcher on `docs/review/responses/` is a Monitor re-armed every thirty minutes.
