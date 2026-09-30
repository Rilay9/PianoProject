# T58 — The record generates its mirrors: one run of `tools/docs/record_mirrors.py` regenerates the task index's live table and `in-flight.md`'s lane lines from the briefs, the entries, the backlog rows and the response files, deterministically, failing loudly with a named reason on a duplicate, a missing reference or a contradiction; a check fails wherever the committed mirrors differ (backlog T58, P2, `backlog-2026-09-25.md`:564; the reviewer's Proposal 2, `responses/questions-70656183.md`:23–48; Entry 171 at dispatch, the next free after 170 at drafting; tooling and record only; sent to the reviewer before dispatch; its builder starts only on the reviewer's word (the owner's rule of 2026-09-30: every brief reviewed first))

**Read first:**
- **Procedure.** `docs/prompts/operating-procedure.md` §1–§5, §11 (:192, T58's sentence) and §13.
- **The ruling.** `docs/review/responses/questions-70656183.md`:23–48, quoted in item 1. Proposal 1 (:3–21, already §11 :190) is not this lane's.
- **The row.** `docs/prompts/backlog-2026-09-25.md`:564; its table's header (:505) is `id | problem | evidence | sev | decision | status | wave | verified`.
- **The generator this sits beside.** `tools/docs/split_prompt_views.py`: :50–65 `split_backlog`, the one reader of matrix rows; :68–112 `render`/`on_disk`/`stale_views`, the shape to copy. Its check, `tools/content/tests/test_prompt_views.py`:22–36, runs on every push from `.github/workflows/docs-integrity.yml`:25–26, pinned by `tools/content/tests/test_ci_order.py`:180–193, which also shows `ci.yml`'s paths-ignore: `in-flight.md`, `entry-*.md`, `runs/**`, `pending-review.md` and `docs/review/**` start no CI run, so docs-integrity is the only runner that sees a record push.
- **The mirrors.** `docs/prompts/tasks/README.md`:136–243 (the live table, from T41); `docs/prompts/in-flight.md`:3–62 and the lane lines under "Standing rules" (:63 on, e.g. :68–80).
- **The sources.** Brief first lines: `tasks/U32-…md`:1, `G96-…md`:1, `Q88-…md`:1, `T41-…md`:1. Entries: `docs/pending-review.md`'s `### Entry 171 — <lane> — …` (:31991) or `— <lane>: …` (:32127), `docs/prompts/entry-*.md`, `docs/prompts/runs/<lane>/ENTRY.md`. Verdicts: `responses/9c64a9c1.md`:3–5, `dffa9c34.md`:3–5 (`## Verdict`, then a bold line); a `questions-*.md` holds several lanes' bold verdicts (`questions-71bd6cee.md`:5, :23, :38).
- **The map.** `docs/prompts/checks.json`: the `prompt-views` check; the rows for `split_prompt_views.py`, the backlog and `views/**`; the `docs/**` catch-all and its reason.

## What is decided

1. **The ruling, verbatim** (`responses/questions-70656183.md`:38–48):
   > Conditions:
   >
   > 1. generation must be deterministic and checked by CI/record validation;
   > 2. generated files must fail loudly on duplicate ids, missing referenced task/entry files, or contradictory state;
   > 3. regeneration must preserve prior reviewer/status text rather than reconstructing or shortening it from prose;
   > 4. `current.md` remains only a pointer, never authority;
   > 5. pending-review/history must remain sufficient to reconstruct which implementation HEAD was sent and which response closed it.
   >
   > A brief file receiving only a compact verdict/dispatch line after review is fine; do not copy full reviewer prose into every mirror when the response file is the canonical ruling.
   >
   > This change is workflow-only. Land it as its own procedure/tooling seam with tests for regeneration and record round-trip, not opportunistically inside a product lane.

2. **Authoritative and generated.** Authoritative, human-edited: the briefs (`docs/prompts/tasks/*.md`), the entries (`pending-review.md` and its entry copies), the backlog rows, the response files. Generated: the live table of `tasks/README.md` and the lane lines of `in-flight.md`, each between a begin and an end marker. Prose outside the markers (the README's history above :136, in-flight's non-lane standing rules) stays authored. `docs/review/current.md` stays a pointer and is not generated; `pending-review.md`, the handoffs and the responses are read, never written.

3. **Beside the views, not inside.** `tools/docs/record_mirrors.py`, stdlib only, in the views module's shape (`render()` → {path: text}, `on_disk()`, `stale()`, `main()`, `--check`), importing `split_prompt_views.split_backlog` rather than writing a second matrix reader. Not inside: the views are a failure-free projection that `validate.py` and `matrix_edit.py` import; this is a parser with a failure model over other sources, and a record commit needs no content build. It is not wired into `validate.py`.

4. **The brief's record block.** The one hand-edited status surface per lane, appended at the brief's end under `## Record`, never rewritten (the reviewer's compact verdict/dispatch line):
   - a header line, `lane: <id> · closes: <row ids or —> · entry: <N or —>`, the id as the index writes it (`Q83+Q84`, `Doc-splice-2`), with `· role: history | scoping | handoff` where the file is not a live lane's brief (history: listed in the authored tables above the region, never generated);
   - the migrated text, verbatim (item 7);
   - one line per later event, `- <state> <date>: <words>`, citing its file (`responses/<x>.md`, `handoffs/<x>.md`, a merge sha); state ∈ drafted, with-reviewer, approved, dispatched, landed, verdict, closed, held, superseded. The reviewer's prose stays in the response file; the line carries the verdict word.
   You may refine the grammar; it stays line-based, verbatim-preserving and parseable without judging prose. Say what you changed.

5. **What is generated.** A row per live record block, `| **<lane>** | …cells… |`, the migrated cells verbatim with each later event's words appended after `; `; a line per lane whose last state is not `closed` or `superseded`, `- **<lane>** — <text>`, by the same rule. Order in both: entry number ascending, then lanes with no entry by id. A reorder is not a line change: report rows moved apart from lines changed.

6. **The contract.**
   - Deterministic: the same sources give the same bytes (sorted inputs, no clock, no environment, LF).
   - One run regenerates both files; `--check` writes nothing and exits non-zero naming each stale file.
   - Loud failures, each a named reason with file and line, the run writing nothing: `duplicate-lane` (two record blocks for one id; two entries with one number); `brief-without-record`; `missing-backlog-row` (a `closes:` id not in the matrix); `missing-entry` (an `entry:` number no entry holds once the record says landed or later; "Entry 169 at drafting" is legal before); `missing-file` (a cited brief, response or handoff absent); `entry-without-brief` (an entry naming a lane no block declares; the first entries' lane-less headings are not linked); `entry-copies-disagree` (pending-review, `entry-N.md` and `runs/<lane>/ENTRY.md` differing on number or lane); `stale-record` (a block ending at dispatched or earlier while the entry, a verdict or the backlog row shows the lane landed or closed); `verdict-mismatch` (a line's verdict word against the cited file's `## Verdict` line, where it has one); `hand-line-outside-region` (an `| **<lane>** |` row or `- **<lane>** — ` line outside the markers); `unparsed-record`. Any other contradiction the structured parts show gets its own name; prose is not judged.
   - Dates are carried, never compared: they mix clocks (`in-flight.md`:44–46, E51, E51a, G86: drafted 2026-09-30, landed 2026-09-29).
   - Condition 5: each generated line cites the handoff (the HEAD sent) and the response (what closed it) wherever the sources hold them.

7. **The migration: every word moved, none rewritten.** For each lane in the live table or with a lane line in `in-flight.md`, the row's cells after the lane and the line's text after `- **<lane>** — ` go verbatim into that lane's block, with one state line from the facts the text states (where it does not settle the state: a question). Closed lanes leave in-flight; their text stays in the brief and the index. A combined line (`D1 / D1a` :17, :19, :61) goes whole into its first lane's block, with a pointer line in the others. Every other brief gets a header-only block with its role. It is a subcommand (`--migrate`), idempotent (each move checks its own marker), rerun by the orchestrator on the landing tree because the mirrors stay hand-edited while you build: a mirror text that begins with the block's migrated text replaces it (an extension, nothing lost); any other difference is refused, never overwritten.

8. **Known cases on today's tree**, each resolved in the sources (a record line or a role), never by a special case in code, and listed in the handoff:
   - `D4-scoping.md` and `D4-transfer-aware-selection.md` both head `# D4 — `; two briefs head `# Doc-splice`, the index calling the second `Doc-splice-2`;
   - G86's heading reads `G86 + U69`, Q83+Q84's `Q83 + Q84`;
   - L120a has an index row and Entry 149 but no brief (L120's brief defines it, `tasks/L120-…md`:20);
   - `T34-HANDOFF.md` is no brief; `T28-…md` opens with a blockquote before its heading;
   - Entries 121 and 151 exist only as `entry-121.md` and `runs/Q88/ENTRY.md`, not in `pending-review.md`;
   - the live table's header has four cells (`README.md`:138) and 41 of its 104 rows five: the generator emits the cells a block holds; normalising is a follow-up, not this lane's;
   - of in-flight's 62 `- **<lane>** — ` lines, 37 carry the prefix ``brief drafted <date> (`<file>`): `` exactly, 3 put the colon inside the parenthesis (:26), 22 have other shapes;
   - the pre-T41 briefs (the T1–T34 era, T35–T40, C0a, C0b) sit in the authored history above the region: role `history`.

9. **The check.** `tools/content/tests/test_record_mirrors.py` holds the committed mirrors to `render()` as `test_prompt_views` holds the views; a new step in `docs-integrity.yml` runs it, and `test_ci_order.py`'s docs-integrity assertion (:191–192) names it. `ci.yml`'s content-tests discover picks it up unchanged. A workflow and test-map change: marked for the reviewer before the push.

## Verification layers

**Unit** (stdlib; no content build, no browser):
- **Red first:** each failure reason on a fixture under `tools/content/tests/fixtures/record_mirrors/` (a miniature tasks folder, entries, responses, matrix and mirrors), run before the check exists, then green; the red line quoted.
- **Round-trip:** generate → parse the generated mirrors → the same lane ids, states, entry numbers, cited files and status words as the sources.
- **Committed equals generated:** on your tree after the migration; and on the base: migrate, generate, diff against the base's committed mirrors, every difference one of the counted reworded, moved or reordered lines.
- **Determinism:** two runs byte-identical; inputs shuffled, same bytes.
- **Mutants, each named with its red test:** M1 a status line dropped in rendering; M2 the duplicate check bypassed, a duplicate id passed; M3 the check skipped, the docs-integrity step removed (red: `test_ci_order`); M4 a mirror edited by hand (red: committed-equals-generated).
- Then `python -m unittest discover -s tools/content/tests -t tools/content -p <name>` for `test_record_mirrors.py`, `test_prompt_views.py`, `test_ci_order.py` and `test_checks_for_paths.py`, and `python tools/docs/record_mirrors.py --check`.

## Rules and files

**You own:** `tools/docs/record_mirrors.py`; `test_record_mirrors.py` and its fixtures; the `## Record` blocks appended to the briefs; the marked regions of `tasks/README.md` and `in-flight.md`; one step in `docs-integrity.yml`; the assertion in `test_ci_order.py`; `checks.json`'s rows.

**You do not touch:** a brief's text above its block; `current.md`; `pending-review.md`; handoffs and responses; the backlog; `split_prompt_views.py`; `operating-procedure.md` (propose §11 :192's new words under `## Doc rows`).

**checks.json**, before the `docs/**` catch-all: a check `record-mirrors` in `prompt-views`' shape (`run`: the generator; `ci`: the content-tests discover, the comparison in the test); rows for `tools/docs/record_mirrors.py`, `docs/prompts/tasks/**`, `docs/prompts/in-flight.md`, `docs/prompts/entry-*.md`, `docs/prompts/runs/*/ENTRY.md`, `docs/pending-review.md` and `docs/review/responses/**`, each naming `record-mirrors` and `test_record_mirrors.py`, with a reason; the backlog row gains both; the catch-all's reason stops saying these paths are opened by no script. Whether the fixtures folder needs its own row depends on the reader's match rule (`tools/docs/checks_for_paths.py`): read it and say.

**Harness.** Own worktree from the base sha the orchestrator states; never commit, push, stash or reset; no Playwright, no port.
Temp state under the worktree's `build/`; no log over 300 KB kept; that scratch deleted at the end.

**Deviations** from this brief are recorded with the reason and the line that forced them.

## Report

**Judgement first:** what changed for the reader of the record: where a lane's status is now written, what `in-flight.md` lists and what left it, what the index looks like, what `--check` prints on a stale mirror.

**Then** Done / Not done / Follow-ups / Questions / Files, with:
- counts: index rows and in-flight lines reproduced byte for byte; reworded (each with its reason); moved to a brief and no longer emitted; rows reordered;
- item 8's cases, each with its resolution;
- every failure reason with its fixture and red line; the mutants with their red tests; exit codes;
- deviations; follow-ups (the five-cell rows, anything left); questions (a lane whose state the text did not settle; the grammar, if refined);
- the workflow and `checks.json` changes named for the reviewer before the push;
- `## Doc rows` (§11 :192; `docs/08` if it names the record checks).

## Reviewer's approval and conditions (`responses/questions-bd7d303e.md`)

Approved for dispatch 2026-09-30 with a scope guard. The reviewer's words below govern wherever the brief's earlier text differs: live generated regions strict; historical material preserved or migrated mechanically, never parsed by special-case prose rules; a lane that cannot be migrated without interpretation gets `role: history` outside the live-state contract; no regex over multi-lane `questions-*.md` prose for verdicts the record block did not state; the five earlier conditions stand.

# 1. T58 — the record generates its mirrors

**APPROVE FOR DISPATCH, with a scope guard.**

The payoff is real: the project is now spending too much human/agent effort maintaining mirrors, and the reviewer already accepted generated task-index/in-flight views in principle.

The brief’s architecture is sound: structured `## Record` blocks are the human-edited navigation truth; task index and in-flight are generated views; `current.md` remains only a pointer; handoffs/responses remain immutable evidence.

## Scope guard: do not build a general prose inference engine

T58 must not become a parser that attempts to infer the project’s state from arbitrary historical prose.

Use this boundary:

- **Current/live generated regions:** strict. Duplicate ids, broken refs, contradictory structured states, stale generated bytes and missing current records fail loudly.
- **Historical/pre-structured material:** preserve it as authored history or migrate it mechanically into explicit record blocks. Do not invent special-case semantic parsers for every old sentence shape.
- A response file may be validated against an explicitly recorded verdict/reference where the verdict is structurally available. Do not regex multi-lane `questions-*.md` prose to discover a verdict that the record block did not state.
- The one-time migration may copy existing mirror text verbatim into a record block; after migration, generation reads the structured block rather than repeatedly reverse-engineering the old mirrors.

If an old lane cannot be migrated without interpretation, mark that record block `role: history` with its existing text preserved and keep it outside the live-state failure contract. Do not block the tooling seam on reconstructing ancient orchestration trivia.

All five reviewer conditions still stand, especially preservation of prior reviewer/status words and reconstructability of implementation HEAD -> handoff -> response.

T58 may dispatch.

## Record

lane: T58 · closes: T58 · entry: 171
index: The record generates its mirrors: the task index and in-flight from the briefs, entries, backlog and responses, checked (the reviewer's proposal 2; backlog T58, P2) | tooling | brief drafted 2026-09-30 (`T58-the-record-generates-its-mirrors.md`); with the reviewer before dispatch; Entry 171 |
in-flight: brief drafted 2026-09-30 (`T58-the-record-generates-its-mirrors.md`): the task index and in-flight generated from the briefs' record blocks, the entries, the backlog and the response files by `tools/docs/record_mirrors.py`, deterministic, checked by a test and a docs-integrity step, failing loudly on contradictions, every migrated word kept (the reviewer's proposal 2, `responses/questions-70656183.md`; backlog T58, P2); with the reviewer before dispatch (Entry 171).
state: with-reviewer 2026-09-30: with the reviewer before dispatch (Entry 171)
