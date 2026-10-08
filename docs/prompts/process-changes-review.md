# Review of the process changes of 2026-10-08

Independent review of `docs/prompts/process-changes-2026-10-08.md` and the pieces it names, at
d807781e. The reviewer did not write any of them. Every finding is labelled **measured** (what
was run) or **reading** (what was read). The planted cases are under `build/review/`
(`mk.py` writes the pages t1 to t7, `probe.js` feeds payloads to the hooks); nothing in the repo
was changed except this file.

## 0. Two findings that come before everything else

**A. The new hooks are probably not running in the owner's sessions, and a restart will not change that.**
- Reading: the only session folder under `~/.claude/projects/` is `C--Users-yalir-repos-Piano-Stuff`,
  so sessions start in the parent folder `Piano Stuff`, which is not a git repository. The
  Claude Code settings docs place project settings at `.claude/settings.json` "in the project
  folder". On that reading, for a session started in `Piano Stuff` that is `Piano Stuff/.claude/`,
  and the repo's `PianoProject/.claude/settings.json` is a nested file it does not read. The docs'
  wording is not explicit about nested folders; the measured probe below decides it.
- Reading: `Piano Stuff/.claude/settings.local.json` registers only the older hooks (Stop,
  SubagentStop, diff-growth), by absolute path into `PianoProject/.claude/hooks/`. That is
  presumably why those older hooks fire. `brief-check.js`, `commit-gate.js` and
  `session-selftest.js` are registered only in the repo file.
- Measured: in this session (a subagent of the owner's session), `echo "probe: git commit
  docs/classifier/rules/area-ZZ.md"` ran and was not blocked. A live commit gate would have
  blocked it (it matches `git … commit` plus a rules path, and the checker fails on a missing
  file; `probe.js` shows the same script returns exit 2 on such input). So the commit gate is not
  live here. The brief hook is registered in the same file; I did not probe it.
- So the document's "not yet live until the session restarts" is wrong on this reading. The
  owner's report that the brief hook "did not fire" when it was added mid-session fits a
  location fault better than a timing fault. The hooks docs also say that "Direct edits to hooks
  in settings files are normally picked up automatically by the file watcher".
- The session self-test cannot catch this: it is registered in the same unread file, and it
  checks the repo's `settings.json`, not the files the session actually loads.

**B. The acceptance gate passes the case it was built for.**
- Measured: `check_rules.py` exits 0 on `**Reuse:** custom (survey: nothing found)` for
  `harmony.roman` (t1), where the survey row says "candidate: AugmentedNet, AnalysisGNN; music21
  `romanNumeralFromChord`".
- Cause: the "nothing found" test searches the whole survey section that mentions the id. Survey
  section 10 has many rows, and several of them say "nothing found". So a custom detector passes
  for every candidate id in a multi-row section: harmony, texture, form and others. That is M1
  again. The planted case reported as blocked in section 2 of the process document must have
  used a section with no "nothing found" row (section 1, key).

---

## 1. Brief templates (`docs/prompts/briefs/rules-{writer,checker,apply}.md`)

1. **Mistake served.** M1: writer item 1 tells the agent to use the survey's recommendation.
   M2: checker items 1 and 2 tell the checker to open what each reuse line cites and the evidence
   behind it. M3: apply item 2 says re-run in the same step, never call it fixed without a
   re-run. On the evidence these address the observed failures directly: the chunk-1 briefs
   named only repo files, and the checkers were not asked about tools.
2. **Too broad.** No. They are three short blocks, used only for rules work.
3. **Too narrow.**
   - (a) The binding block constrains only itself. Text outside the block can still narrow it.
     Measured: a brief with the full writer block plus "Reuse only what is in the repo; do not
     search online" outside it passes the hook.
   - (b) There are templates only for Phase 2. The same narrowing can come back in a Phase 3
     agent-instructions brief ("use only the coded facts, no online research"; measured: it
     passes the hook) or in a Phase 5 build brief (a builder hand-writes key detection although
     the reuse line names AugmentedNet). Those phases have not started, so a template now would be
     speculative. Write each phase's template when the phase starts.
   - (c) The survey is now the single point where M1 can come back. A rule may go custom wherever
     the survey says "nothing found". The survey surveyed up to three candidates per id, installed
     or ran nothing, and says so. The checker template never asks whether the survey missed a
     tool.
4. **Self-attestation.** Each template carries a `Brief check: {…}` line. That line is M7's
   mechanism (see section 2).
5. **Works.** As text, yes. Enforcement comes from the hook (section 2) and the gate (sections 3
   and 4).
6. **Missing.** The checker's item 2 covers only claims written on a `**Validated:**` line. A
   free-text claim ("validated on 40 scores; all passed") reaches neither the checker nor the
   gate (t4, measured on the gate). One clause fixes it (M8, small cost): "every claim of
   validation or a result, on a `**Validated:**` line or not".

## 2. Brief hook (`.claude/hooks/brief-check.js`)

The hook does two jobs: (i) it prints the checklist unless the brief has a "Brief check:" line;
(ii) for rules briefs, it compares the binding block with the templates.

1. **Mistake served.**
   - (i) targets M5, M6 and M10 through the CLAUDE.md questions.
   - (ii) targets M1 and M2 by stopping a narrowed binding block.
2. **Too broad.**
   - (i) blocks every Agent and every SendMessage that lacks the line, including one-line course
     corrections. Measured: `{message: "stop after the first file"}` returns exit 2 and prints
     the 16 questions.
   - Hooks run inside subagents too (hooks docs), so a background subagent's SendMessage to
     `main` is blocked the same way.
   - The cost is one round trip per brief that lacks the line. That is small, but it buys
     little; see 4.
3. **Too narrow.** (ii) triggers only on the literal string `docs/classifier/rules/area-` with
   forward slashes. Measured, these pass with no binding block:
   - a rules brief that says "its rules page" without the path;
   - a brief whose path uses backslashes;
   - a Phase 3 instructions brief.
4. **Self-attestation.** (i) is pure self-attestation, and it causes M7. A brief that already
   carries the line exits 0 without the questions ever being printed (measured: `Brief check:
   nothing found\ndo x` returns 0). So once the orchestrator knows the rule, the checklist never
   appears and only the claim remains. That is exactly M7 as the owner described it. (ii) is a
   real, independent check, but only of the block's text.
5. **Works.** (ii) works for its exact trigger (measured). It fails closed when the template
   folder is missing and open when the payload is unreadable. It is probably not live
   (finding A).
6. **Change.**
   - Drop (i)'s line requirement if P1 is adopted: P1 is the independent run of the checklist the
     owner asked for ("each brief should be run by the full checklist", quoted in the hook).
   - If P1 is not adopted, block the first send of each distinct brief and print the questions
     every time, with no line to write. This keeps the owner's ask and removes the line that can
     be forged.
   - Broaden (ii)'s trigger to `rules[\\/]area-` or "rules for area", and normalise backslashes.
     Cost: a few characters.

## 3. Acceptance gate (`tools/classifier/check_rules.py`)

1. **Mistake served.** M1 (a reuse line that must match the survey), M3 and M8 (a validation
   claim must name evidence that exists). The target is right: it checks work where it is
   accepted, not by reminder.
2. **Too broad.**
   - Measured: any id with no survey row fails ("the tools survey has no section listing"). Simple
     reads from chunk 1 such as `hands.per-bar-range`, `pitch.black-key-share` and
     `pitch.inventory` have no survey row (measured by grep: 0 hits each). A legitimate area-1B
     rework with `**Reuse:** music21 (direct read)` can never pass, except by adding paperwork rows
     to the survey.
   - A commit of a one-line correction to the chunk-1 pages is also blocked (measured on
     area-1B.md). That may be intended for pages due for rework, but the owner should know it.
4. **Self-attestation.** None. It is a script.
5. **Works.** Measured bypasses, all exit 0:
   - t1: custom where a tool exists (finding B).
   - t3: `**Reuse:** a (anything)`. The tool name is tested as a substring of the whole section,
     so any common letters pass.
   - t2: `evidence: CLAUDE.md`. Any existing file counts as evidence.
   - t6: `evidence: docs`. A directory counts.
   - t4: a free-text validation claim, and a section whose heading has no dotted id. Both are
     skipped silently.
   - t2: `**Reuse:** music21 (… then a hand-written modulation detector)` for `key.change`. This
     cannot be settled by a script, because music21's floating-key analysis is a listed
     candidate. It is the checker's job (template item 1), and the gate's docstring says so.
   - Fails closed when the survey is missing. It crashes, and so blocks, on a page that does not
     exist (a deletion; see section 4).
6. **Change** (all small, inside the script):
   - Read the id's own status row (`` | `id` | status | what serves it | ``) instead of the whole
     section.
   - Allow "custom" only where that row's status starts with "nothing found".
   - Require the named tool to appear, as a whole word of three or more characters, in that row's
     "what serves it" cell.
   - Require evidence to be a file under `docs/classifier/evidence/`.
   - For an id with no survey row, accept `**Reuse:** music21|partitura (direct read)` and leave
     the judgement to the checker.

   Each closes a measured bypass of M1 or M8. Cost: about 15 lines.

## 4. Commit gate (`.claude/hooks/commit-gate.js`)

1. **Mistake served.** It is how the gate in section 3 gets enforced. It serves M1, M3 and M8.
2. **Too broad.** Measured false blocks:
   - `git log --oneline -- docs/classifier/rules/area-1B.md | grep commit`, a read-only command,
     is blocked because the regex is `git` … `commit` anywhere on the line.
   - A commit that deletes a rules page is blocked, because the checker crashes on the missing
     file.
3. **Too narrow.** Measured bypasses, exit 0:
   - `git add <page>` in one call and then a bare `git commit -m …` in the next. The page is never
     named in the commit command, and this is the ordinary way to commit.
   - A PowerShell path with backslashes.
4. **Self-attestation.** None.
5. **Works.**
   - Only when the page path is written in the same command. It runs on the working file, not the
     staged content.
   - It fails open on unreadable input. A timed-out command hook does not block the tool call
     (hooks docs).
   - It is not live in this session (finding A, measured).
6. **Change.**
   - On a real `git … commit` (anchored to the start of a command, after `;`, `&&` or `|`, or
     with `-C`), take the pages from `git diff --cached --name-only --diff-filter=d`, plus any
     pathspecs named.
   - Normalise backslashes.
   - Optionally add `"if": "Bash(git *)"` so node is not spawned on every Bash call.

   Closes the measured bypass for M1, M3 and M8. Cost: about 10 lines.

## 5. Brief checklist (CLAUDE.md "Before sending any brief")

1. **Mistake served.** Each question maps to an observed mistake:
   - Q1: M1.
   - Q2: M5.
   - Q3: M6 and M4 ("no fixed number of passes").
   - Q4: M10.
   - Q5: M3.
   - Q6: the owner's earlier "inputs settled" rule.
   - Q7: M4.
   - Q8: tokens.

   None is invented.
2. **Too broad.** The hook prints the eight reporting questions as well, so 16 questions per
   brief, and several do not apply to a brief (Q1 "Product", for example). The owner asked for
   "the full checklist", so I leave this as is.
4. **Self-attestation.** Entirely self-attested. The process document says so itself, and M7
   shows it fails.
6. **Keep the text.** Its use is as the auditor's criteria in P1, not as something the
   orchestrator certifies about its own brief.

## 6. Session self-test (`.claude/hooks/session-selftest.js`)

1. **Mistake served.** None of M1 to M10 directly. It guards the precondition for every hook
   control (a hook that silently does not run), which the owner asked for: "There should be
   another hook for that".
3. **Too narrow.**
   - It reads the repo's `settings.json`, not the files the session loads (finding A).
   - It tests the behaviour of the brief hook and the stop hook, but not the commit gate or
     `check_rules.py`.
4. **Self-attestation.** In effect, yes. It reports what a file says, not what is live.
5. **Works.** It is registered only in the unread file, so it does not run (reading; finding A).
6. **Change.**
   - Register every hook where the session reads it: `Piano Stuff/.claude/settings.local.json`,
     by absolute path, as the older hooks already are. Or start sessions in `PianoProject`.
   - Make the self-test read `$CLAUDE_PROJECT_DIR/.claude/settings.json` and
     `settings.local.json`.
   - Add one commit-gate probe and one `check_rules.py` probe (t1 must fail once section 3's fix
     is in).

   Cost: a few lines. Without this, every other control is decoration.

## 7. Stop checklist (`.claude/hooks/stop-checklist.js`, pre-existing; read for context)

1. **Mistake served.** M8. The process document says it caught several cases, though only after
   the report had been shown.
2. **Too broad.** It costs one extra turn on every substantive turn. The owner has kept it.
4. **Self-attestation.** Yes. The owner's own diagnosis, in commit 0d92ea11: "the fault was not
   running it, not the wording".
5. **Works.**
   - On SubagentStop it reads `transcript_path`, which is the main session's transcript. The
     subagent's own transcript is `agent_transcript_path`, and its last message is
     `last_assistant_message` (hooks docs, reading). So subagents are judged on the parent's last
     turn. Cost to fix: one line.
   - Its text tells the model to reply "Checklist: nothing found.", while CLAUDE.md Q7 says "Do
     not use a one-line 'nothing found' exit without checking actual state". This is a
     contradiction for the owner to settle. I make no wording change, because of M9.

## 8. FABLE Phase 2 text (survey first, pilot, validation inside the area, stop at about a quarter failing)

1. **Mistake served.** M1 (survey first), M10 (pilot), M3 (validation inside the area; stop
   instead of another correction pass).
4. **Self-attestation.** Yes. Nothing enforces the pilot or the quarter.
6. **M4 risk.** The commit c13b6ca4 says "the owner's go", but the only saved owner's words for
   2026-10-08 (`inputs-2026-10-08/owner-rules-plan.md`, 9 lines) contain neither "pilot" nor
   "quarter" (measured by grep). If "about a quarter" is the orchestrator's figure, it is M4's
   kind: an invented hard rule under the owner's name. Cheapest fix: save the owner's words for
   that go, or label the figure as the orchestrator's choice. Cost: one line.

## 9. P1: brief auditor (agent hook, PreToolUse on Agent and SendMessage)

1. **Mistake served.** It is the only proposal that replaces self-attestation with an independent
   reading for M5, M6 and M7, and the only one that can catch narrowing outside the binding block
   (section 1, 3a) and briefs for other phases (1, 3b). It does not cover M10: it sees one brief,
   not how many go out at once. It does not cover M4 when the invented rule sits in FABLE,
   because the auditor would read FABLE as the truth.
2. **Too broad.**
   - One agent run per brief and per SendMessage. Reading CLAUDE.md, FABLE, the lessons and the
     templates is roughly 20k to 35k input tokens a run (estimate, not measured).
   - On SendMessage this burdens short corrections.
   - Agent hooks default to the "background" model. Left unset, that is a weak judge; set
     `model` explicitly, never Fable.
3. **Too narrow.** See 1.
4. **Self-attestation.** No. It is a separate run, but it shares the orchestrator's sources and
   blind spot. To earn its cost, it must check against the owner's words: the session's
   `transcript_path` (it is in the hook input) and `inputs-<date>/`. It must not take the
   orchestrator's paraphrase in FABLE as the truth.
5. **Works (reading, hooks docs).**
   - Agent hooks are "experimental and may change".
   - They take up to 50 turns and default to 60 seconds; on `ok: false` the reason goes back to
     Claude.
   - The docs do not say what a timeout of an agent hook does on PreToolUse. A timed-out command
     hook does not block. Treat it as failing open until tested.
6. **Change before building.**
   - Agent calls only; leave SendMessage to the command hook.
   - Five concrete questions, each `ok: false` only with a quoted brief line and the owner
     sentence or later-step item it conflicts with:
     - which owner sentence names this step;
     - which later-step work it does;
     - which source is unbounded;
     - which input is still changing;
     - which binding rule it narrows.
   - Test it on the real past briefs, taken verbatim from the transcripts. They are not in the
     repo: grep finds "reuse what exists" only in the process document. It must block the chunk-1
     rules brief, the 1b drafter brief and the assignment brief, pass the current templates and a
     plain Explore lookup, and the timeout case must be tested.
   - If it passes, drop the "Brief check:" line (section 2).

## 10. P2: rules-commit auditor (agent hook on a rules-page commit)

1. **Mistake served.** It aims at M1, M2 and M8, but the checker template already requires the
   same reading for every rule (items 1 and 2), not a sample. As proposed, it duplicates the
   checker.
2. **Too broad.** As proposed it runs on every Bash call unless an `if` filter is used. It
   inherits the commit gate's staging bypass.
3. **Too narrow / the real gap.** Nothing independent looks at what the apply changed after the
   checker read the page. That gap is M3: the key fix broke 29 items and was called applied.
4. **Self-attestation.** No.
6. **Change.**
   - Narrow it to the sections the apply changed since the checker's `rows.md`.
   - Open their evidence files and confirm each correction was re-run on the cases that failed.
   - Run it on rules-page commits only (`if`, plus the staged-file test).

   Cost: one agent run per area commit, about 12 in Phase 2. It serves M3. Otherwise, drop it.

## 11. Coverage of M1 to M10

| | Covered by | Independent? | Gap |
| --- | --- | --- | --- |
| M1 | templates, gate, commit gate | yes, after the fixes | gate bypass t1 and t3 (fix in section 3); narrowing outside the block (P1); the survey's own misses (open, see 1, 3c) |
| M2 | checker template item 1 | the checker is independent | none beyond the survey's misses |
| M3 | apply template item 2, FABLE stop rule | no | nothing checks the apply's re-run (P2 narrowed) |
| M4 | CLAUDE.md Q3 and Q7 | no | the quarter figure's provenance (section 8) |
| M5, M6 | CLAUDE.md Q2 and Q3 | no | P1 |
| M7 | nothing; the brief hook causes it | | P1, then drop the line |
| M8 | stop checklist; gate's evidence-exists check | partly | evidence-is-a-file fix; free-text claims (section 1, 6) |
| M9 | nothing | | low cost of recurrence (two small reverted commits). No control proposed: the fault is reading the owner, which no hook can judge |
| M10 | FABLE pilot, CLAUDE.md Q4 | no | optional add below |

## 12. Ranked recommendations

1. **Change: make the hooks run.** Register brief-check, commit-gate and session-selftest in
   `Piano Stuff/.claude/settings.local.json` by absolute path, or start sessions in
   `PianoProject`. Point the self-test at the files actually loaded, and add a commit-gate probe.
   - Serves: every item, since nothing built works otherwise (M1, M3, M8 first).
   - Cost: a few lines.
   - Verify by re-running the `echo "probe: git commit …area-ZZ.md"` probe; it must be blocked.
2. **Change `check_rules.py`:** check the id's own row; custom only on that row's "nothing found";
   tool as a whole word in that row; evidence is a file under `docs/classifier/evidence/`; direct
   reads allowed for ids with no row.
   - Serves: M1 and M8 (measured bypasses t1, t2, t3, t6), and removes the false block on simple
     reads.
   - Cost: about 15 lines. Re-run t1 to t7 after the change.
3. **Change `commit-gate.js`:** staged files instead of named paths; anchored commit detection;
   backslashes; skip deleted pages.
   - Serves: M1, M3 and M8 (measured staging bypass); removes two measured false blocks.
   - Cost: about 10 lines.
4. **Change, then build P1:** Agent calls only, explicit model, the owner's words from the
   transcript and inputs as ground truth, quoted-line blocks only, accepted only after it blocks
   the real past briefs and passes legitimate ones, timeout behaviour tested. When it is live,
   **drop** the "Brief check:" line requirement and the template line.
   - Serves: M5, M6 and M7, plus M1 narrowing outside the block.
   - Cost: one agent run per brief.
5. **Change the brief hook's rules trigger:** both slashes and "rules for area".
   - Serves: M1.
   - Cost: trivial.
6. **Change, then build P2 only as an apply auditor** (the sections changed since the checker),
   or drop it.
   - Serves: M3.
   - Cost: about 12 agent runs over Phase 2.
7. **Change: provenance of FABLE's "about a quarter" stop.** Save the owner's words, or label it
   as the orchestrator's choice.
   - Serves: M4.
   - Cost: one line.
8. **Change: one clause in checker item 2,** "every claim of validation or a result, on a
   `**Validated:**` line or not".
   - Serves: M8.
   - Cost: one line in the binding block.
9. **Change: `stop-checklist.js` on SubagentStop** reads `agent_transcript_path` or
   `last_assistant_message`.
   - Serves: M8 for subagents.
   - Cost: one line. Flag the "nothing found" contradiction to the owner; no wording change.
10. **Add (optional): a pilot lock in the brief hook.** Block a second rules-writer brief for
    another area of the same chunk until the first area's
    `docs/classifier/audits/rules-<area>/applied.md` exists in the main checkout, using a
    per-session state file as diff-growth does.
    - Serves: M10, the costliest mistake (three areas plus a full validation round).
    - Cost: about 15 lines.
    - False block: a parallel run the owner has approved. The bypass is deleting the state file,
      a deliberate act.
11. **Keep:** the three templates and their binding blocks; the CLAUDE.md brief questions (as
    P1's criteria); the stop checklist; diff-growth (not part of this change).
12. **Not proposed:** a Stop-time auditor (cost on every turn, as the process document says);
    a Phase 3 or Phase 5 template before those phases start; a control for M9.
