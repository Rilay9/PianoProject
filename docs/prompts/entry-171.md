### Entry 171 — T58: the record generates its mirrors

**Judgement.** Nothing a learner meets changed: this seam is tooling and the record only; no screen, music or sentence was touched. What changed for the reader of the record:

- A lane's status is written once, in the `## Record` block at the end of its brief. The block holds a header (`lane · closes · entry`, optional `role` and `aliases`), the old index cells and in-flight text copied verbatim, one migrated `state:` line, then one appended line per later event (`- <state> <date>: <words>`, citing its file).
- `tools/docs/record_mirrors.py` regenerates the task index's live table and `in-flight.md`'s lane lines between `<!-- record:begin … -->` and `<!-- record:end -->`, in entry-number order, then by id for lanes with no entry. Prose outside the markers stays authored.
- in-flight lists the 18 open lanes: G1, X3c, Doc-splice-2, G1d, U92, Q81, Q88, L120c, E50, E50a, L120d, G96, U32, U63, T58, U105, X40, L120. The 47 closed lines left it (3 combined: D1 / D1a, D0 / D0a, E0 / E0a / E0b); their words stay in the briefs and the index.
- The index keeps all 107 rows, byte for byte, 94 of them now in entry order. A hidden `record:lanes` comment lists each row's lane · state · entry for the round trip.
- `--check` on a stale mirror writes nothing, exits 1 and prints `stale: <file> (first difference at line N): a mirror is generated; edit the lane's ## Record block and run python tools/docs/record_mirrors.py`. A failure exits 2, writes nothing and prints `record-mirrors: <reason>: <file>:<line>: <message>`.
- After this lands, a record script never edits `tasks/README.md` or `in-flight.md` (a `matrix_edit.py` row edit included): it appends an event line to the lane's block and reruns the generator, or docs-integrity goes red.

**Counts**

- Record blocks: 154 in 153 briefs — 93 live, 59 history (45 pre-T41 header-only, 14 from the live table), 1 scoping (`D4-scoping.md`), 1 handoff (`T34-HANDOFF.md`).
- States on owner blocks: closed 75, landed 4, verdict 4, approved 3, dispatched 4, with-reviewer 3, history 59, question 0.
- Index rows: 107 of 107 byte-identical; 94 reordered. In-flight lines: 65 of 65 byte-identical in their blocks; 18 still listed (14 reordered), 47 moved to a brief and no longer emitted; 0 reworded (`captures-base-reproduction.txt`).
- History from the live table (14): T41, C1, C2, C3, C4, T42, C4a, C4b, C4c, C4d, C6 and T52 (the text says only "done"), Doc-splice (landed; its status only inside E-tail's closed line), F1 ("accepted", no closure word).
- `closes:` set on 30 lanes, each checked against the matrix row's words (`captures-closes-after.txt`). Cleared where only the id matched (task T41 is not row T41, which is about swing): E1, E2, G1, G2, X3, T41, T42, T52, T53, U96 and every pre-T41 T-id (`captures-closes-cleared.txt`).
- Verdict words on state lines compared with the cited response's own verdict line: 35, all agree; 4 skipped where the file has no structural verdict (`captures-verdicts.txt`).

**The item 8 cases, resolved in the sources.** D4-scoping: `role: scoping`, lane D4. The two Doc-splice briefs declare Doc-splice (history) and Doc-splice-2. G86: `aliases: G86 + U69`, closes G86, U69. Q83+Q84: `aliases: Q83 + Q84`, closes Q83, Q84. L120a: a second block in L120's brief. T34-HANDOFF: `role: handoff`. T28's blockquote: no effect, headings are not parsed. T1b's heading reads `T1`; its block declares T1b. Entry 121 is read from `entry-121.md`. Entry 151 was already in `pending-review.md` at the base (the brief's premise had changed); every copy agrees. The 41 five-cell rows are emitted as held. The in-flight prefix shapes do not matter: the text is copied whole.

**State rules** (every state line cites its evidence): "closed" said of the lane; a chain's closure naming it ("the T53 chain closed", "F2's required-change chain closed", "(D3a–D3c)", a combined line reading closed); "P closed on Y's acceptance" makes Y closed; "P's required change closed" makes P closed (X31, U96, X3d). Kept open because no text says closed: G1, G1d, X3c, U92, L120.

**Deviations**

- The grammar is refined (item 4 allows it): `index:`, `in-flight[ [label]]:`, `pointer:` and `state:` lines (with `state: question:`), an `aliases:` header field, and the hidden `record:lanes` comment the round trip reads.
- History blocks that hold index text are still rendered in the index. Item 4 said history is never generated; the reviewer's "text preserved" governs, and dropping them would remove 14 rows.
- `closes:` is never inferred from a shared id; `--migrate` creates `closes: —` and `state: question`, and decides no role.
- stale-record has only its entry leg. A response's `## Verdict` does not say whether it reviewed a brief or an implementation, and the matrix's status cell is prose (`verified` reads `pending` on landed lanes such as G85 and Q83); the scope guard forbids judging prose.
- 10 named contradictions added: `entry-lane-mismatch`, `entry-unrecorded`, `entry-claimed-twice`, `pointer-target-missing`, `auxiliary-without-owner`, `history-with-state`, `open-lane-without-text`, `missing-index-text`, `state-cites-unrendered`, `missing-markers`.
- `test_checks_for_paths.py` (not in the owned list): `test_a_docs_only_change_runs_nothing` asserted that pending-review and in-flight run no checks, which the brief's own rows replace. It becomes `test_a_prose_only_change_runs_nothing` plus `test_a_record_change_runs_the_mirrors_check_and_nothing_else`.
- `checks.json` gains two rows beyond the brief's list: `docs/review/handoffs/**` (a cited handoff must exist) and `.github/workflows/docs-integrity.yml` (it was unmatched, so touching it fell back to the full suites). The fixtures need no row: `tools/content/tests/fixtures/**` already maps to the whole content suite.
- The headers, roles and state lines were seeded once from the builder's reading; `--migrate` then moved the texts. The blocks are the record.
- The base comparison is a one-time script, not a committed test: the base's files exist only in git history, and CI's shallow checkout lacks them.
- The live table held 107 rows and in-flight 65 lane lines (the brief counted 104 and 62): T58, U105 and X40 were added after drafting.

**Questions for the reviewer**

1. The 14 history lanes: close each with one event line, or keep them as history?
2. Are the state rules acceptable, especially "P's required change closed" read as P closed?
3. Is the hidden `record:lanes` comment acceptable? Visible states would change every row's bytes.
4. Should implementation reviews be recorded as `verdict` events, which would give stale-record a structural verdict leg?

**Tests and mutants**

- `test_record_mirrors` 36 OK; `test_prompt_views` 3 OK; `test_ci_order` 11 OK; `test_checks_for_paths` 29 OK (`captures-run-test_*.txt`). `record_mirrors.py --check`: exit 0, fresh (`captures-check.txt`).
- Red first: each of the 21 reasons' checks disabled in turn; its `EachFailureIsLoud` test went red every time and green again when restored (`captures-mutants.txt`).
- M1 (a status line dropped from the row) and M1b (the same from the in-flight line), caught by `OnTheFixture.test_round_trip_recovers_lanes_states_entries_events_and_cites`.
- M2 (the duplicate check bypassed), caught by `EachFailureIsLoud.test_duplicate_lane_two_blocks`.
- M3 (the docs-integrity step removed), caught by `test_ci_order.TheWorkflowOrder.test_record_and_review_pushes_start_no_run_and_nothing_else_is_ignored`.
- M4 (in-flight edited by hand), caught by `TheCommittedMirrors.test_committed_mirrors_equal_generated`.
- M5 (a row extension read as a rewrite), caught by `TheMigration.test_migrate_takes_an_extension_and_names_its_state_line`. This is a real fault that the landing simulation found and the seam fixed: record scripts append inside a row's last cell, before the closing pipe.
- Landing simulation on the base's hand-kept mirrors, with a T58 approval appended and a new lane added: 2 extended, 1 block created (`closes: —`, `state: question`), `--check` exit 0, second run a no-op, a rewrite refused with exit 2 (`captures-landing-sim.txt`).

**Not run as the map writes it.** The map names `record-mirrors` (run) and the whole content-tests discover, because the `tools/content/tests/fixtures/**` row asks for all of it. Four named files were run instead: the whole discover reads the built catalogue, and a content build would rewrite committed reports other lanes own. CI runs it.

**At the landing.** Take the landing tree's hand-kept mirrors, run `--migrate`, add event lines for each lane it reports extended (T58, U105 and X40 read with-reviewer in their blocks), and record T58's approved, dispatched and landed events — until then `--check` fails `stale-record` on T58, because this entry file exists. Then regenerate and run `--check`.

**Orchestrator's note at the landing (2026-09-29).** T58's worktree committed by name (0ba0d2d1) and merged (dd16f8ba). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/T58/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (test_ci_order 0; test_checks_for_paths 0; test_prompt_views 0; vitest-all 0; `runs/T58/orchestrator-exit.txt`). Your proposal 2 (`responses/questions-70656183.md`) and your approval of the brief with the scope guard (`responses/questions-bd7d303e.md`). A tooling seam: no unit or browser suite of its own (the vitest-all line in orchestrator-exit.txt marks it not run); the docs-integrity tests ran on the merged tree (test_ci_order 11, test_checks_for_paths 29, test_prompt_views 3), and test_record_mirrors (36) with the record-mirrors check after the migration of the landing tree's hand-kept mirrors, their lines appended to orchestrator-exit.txt; the migration added record blocks to the three briefs drafted after T58's base (CL04, E54, U66) and landing events to eight lanes, and refused a citation of a response file not yet in the tree, so a lane's landed line cites its handoff only. The push waits for the reviewer's read-back of docs-integrity.yml's step and the checks map rows.

## Doc rows

- `docs/prompts/operating-procedure.md` §11 (:192), replacing the sentence that begins "The task index (`tasks/README.md`) and `in-flight.md` stay hand-kept mirrors until T58": "The task index's live table and `in-flight.md`'s lane lines are generated by `tools/docs/record_mirrors.py` from the `## Record` block at the end of each brief (T58, Entry 171): a lane's status is written once there, never in the mirrors, which `--check`, `test_record_mirrors` and `docs-integrity.yml` refuse when they differ; a record script appends an event line to the block and reruns the generator; `current.md` stays a pointer."
- `docs/08-test-map.md` (:171), in the docs-integrity sentence: "The reviewer's views are checked on every push by `.github/workflows/docs-integrity.yml` (`test_prompt_views`, …)" becomes "The reviewer's views and the record's mirrors are checked on every push by `.github/workflows/docs-integrity.yml` (`test_prompt_views` and `test_record_mirrors`, …)". The `test_record_mirrors.py` row itself is already in this change.
