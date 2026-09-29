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
- **F2a** — **approved with one required change** 2026-09-29 (`responses/fc91e5a.md`; Entry 117): the teaching-rung mechanism accepted; **F2b** dispatched (Entry 123, port 4323): `practice.1` on 1.1 and D8a's sentence; the beginner's reading leap split from the advanced technique jump. L114 (the 3.3 swap tier's context) and L115 (holiday and blues.3 as claim decisions) recorded. X1's brief after F2b and G2.
- **G1** — **approved with one required change** 2026-09-29 (`responses/b48342f.md`; Entry 112): the core encounter model accepted; **G1a** — **closed** 2026-09-29 (`responses/5b14b7a.md`, APPROVE; G2 released; G73, G74 recorded); landed (Entry 119, merged 7002ee5, chain green); handoff `handoffs/5b14b7a.md`, with the reviewer; G2 dispatches on its acceptance (G2's brief approved with its fact path); G72 recorded (the context's `firstContact` name).
- **G1b** — brief drafted 2026-09-29 (`G1b-repertoire-lifecycle.md`: the `projects` store, eight learner-set states, never inferred from a run, `ProgressRow.status` untouched, Stage 9 as projects); with the reviewer before dispatch (three questions); dispatches after G1a and X3 land.
- **G2** — brief approved with one required change, applied (`responses/a96395d.md`: the complete nonrecursive fact path); the G1a review's constraints added; **dispatched 2026-09-29** (Entry 126, port 4293) on G1a's acceptance. X1's brief after F2b lands and G2 is accepted.
- **D5** — the microscope sweep (G55, G56, G60), brief drafted 2026-09-29 (`D5-microscope-sweep.md`); brief **approved with one required change, applied** (`responses/4088dfc.md`: the evaluator's verdict versioned and the version printed); **landed** 2026-09-29 (Entry 110, merged 93ecc1e, chain green); **closed** — approved (`responses/458159e.md`). Nothing heard; every study unverified as music.
- **Q47** — **closed** 2026-09-29 (`responses/8668afb.md`, APPROVE; Entry 113 amended with the runner proof: the cold-cache path on the run at ca06e94, the restored cache on the run at 05c9e01). Q46 closed with it. `ci.yml` released to the T sweep.
- **E1** — **closed** (approved `responses/8326ff3.md`; E1a accepted `4f7227d.md`). Nothing heard; unverified as music.
- **E0 / E0a / E0b** — **closed**: E0b accepted (`responses/c95ac32.md`).

## Standing rules in force tonight

- The reviewer's ruling of 2026-09-29 on the lanes: four running, no fifth; the three-seam measurement kept (each meter separately; building, waiting, integrating, reviewing and fixing times); near the five-hour limit stop dispatches first, then bring builders to a clean checkpoint (worktree committed, a short handoff: done, running, next command), resume the existing seams after the reset before any new one; D4a before G1, E2 before X3; drafting allowed, dispatch waits for the measurement.
- The reviewer's answer on the lanes (2026-09-29, after midnight): four active builders the cap for now, fix-forwards counting toward it, Q47 in a freed slot; both gates kept; fix-forward briefs and repeated evidence shortened. Applied: E2a (Entry 111, port 4203), G1 (Entry 112, port 4183) and Q47 (Entry 113, port 4213) dispatched beside F2.
- The queue confirmed (`responses/3e526f1.md`, 2026-09-29): F2a stays a separate reviewed seam if the F2 review requires any truth change, and X1 waits for F2a and E2a (or for E2a alone if F2's claims stand); G2 waits for G1 and the G68 reading, not for G1b; X3 behind E2a; the E-tail after F2 releases `validate.py` and the density owner states its rule; the T sweep after Q47 releases `ci.yml`; H1 then H2 last; a free lane is capacity, never architectural readiness.
- **U74** — **closed** 2026-09-29 (`responses/9c9cf86.md`, APPROVE; Entry 114). E30 unchanged; U77 and U78 are its inputs when it is deliberately reopened; docs/04 §5 states the code's rule.
- **X3** — **closed** 2026-09-29 (`responses/070a6f7.md`, APPROVE; Entry 118): the conditional opening rule kept (a plain import files, the sheet opens where the app guessed or a rung was in mind); X3a constrained to E48's operation; the grid sentence (U81), the folder's door (X20) and the one-hand correction (X23) later waves. **X3a** dispatched (Entry 122, port 4303).
- **U80** — dispatched 2026-09-29 (Entry 125, port 4313): the side panel's arrival — `side-panel-prose.spec.ts`'s sweep red on the runner (05c9e01) and locally; the decision marked, the panel before the fit where its column moves the stage; a regression repair under the Score screen's contracts.
- **E-tail** — **closed** 2026-09-29 (`responses/f972756.md`, APPROVE; Entry 115). E51 is the next excerpt-approval repair (before any renewed approval); E50 a converter seam that need not block X3; no automatic carry-over for the three byte-identical cuts. **Doc-splice** — **landed** 2026-09-29 (Entry 121, merged a1b6f44c): 40 rows spliced, 10 already present, none refuted; Q-tooling's CI paragraph rewritten to the workflows as they are; two record faults corrected (Entries 112 and 113 had claimed their docs/08 rows spliced; a machine timing in U74's rows). G1's two docs/02 rows and the rows of the seams landing tonight (X3, G1a, Q65a, F2a, E-tail's later ones) go to the next docs seam. 
- **Q65a** — **approved with one required change** 2026-09-29 (`responses/3c661d4.md`; Entry 120): the universal paths keep the whole suite, the unit suite stays whole; **Q65b** — **closed** 2026-09-29 (`responses/b690be15.md`, APPROVE; Q65 and Q-tooling closed; the map is the landing chain's minimum from here; Q74 recorded); landed (Entry 124, merged 9505e1f2, chain green; handoff `handoffs/b690be15.md`, with the reviewer; the fixtures row completed, Q72 and Q73 recorded); dispatched: the two frame helpers bounded by the union of their importers' sets with a drift test; Q69–Q71 later waves. The map advisory until Q65b lands.

- From Q24 (Entry 89): a fresh worktree's `npx vitest run` needs `python tools/midi-cleanup/tests/parity_reference.py` first (or `build/midi-parity/` copied from the main checkout), and its content tests fail rather than skip until the build has run with the Joplin edition present. Every brief that runs vitest in a new worktree says so.

- From F1's review: the reviewer treats uncommitted worktree logs as reported, not verified — on each landing, copy the seam's run captures (the exit-code and summary files, not the megabyte logs) into `docs/prompts/runs/<seam>/` beside the entry so the handoff's numbers can be checked.

- One handoff file per seam, named by the implementation commit, and a brief handoff file for each pre-dispatch gate, named by the commit that carries the brief; `current.md` a pointer only; a response is `responses/<same>.md`; verify every finding at the line; only findings acted on; dispositions in the next handoff.
- Verify by what a seam touches; never rerun a builder's full suite on the same tree; CI is the full run.
- PR #1 is the trigger; never merge it; batch docs-only pushes.
- Not tonight: E implementation, X, broader G, F's contested rows; nothing crosses the T53c → D0 gate.
- The watcher on `docs/review/responses/` is a Monitor re-armed every thirty minutes.
