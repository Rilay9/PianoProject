# Process changes after 2026-10-08 (for review before they are finished)

The owner, 2026-10-08: implement the changes "that'll stop you being an idiot", reviewed first
by a separate agent told about the mistakes, so that the review neither over-generalises nor
narrows too much.

## 1. The mistakes these changes target (this session, with evidence)

| # | Mistake | Where it shows |
| --- | --- | --- |
| M1 | Rules briefs said "reuse what exists" and listed only the repo's own files, narrowing CLAUDE.md's library-first rule; the agents hand-wrote detectors for key, key change, hand assignment, melody location, format and spelling, which then failed on real scores (34 of 68 rules validated) | `docs/classifier/audits/rules-1*/validation.md`; `docs/classifier/rules/lessons-chunk1.md` item 10 |
| M2 | Checkers were briefed to test musical correctness only, so none asked whether an external tool was searched for | `docs/classifier/audits/rules-1*/rows.md` |
| M3 | A correction pass made some rules worse (the key-change fix removed Bach and Mozart modulations; the key fix broke 29 items) and was not re-run before being called applied | `docs/classifier/audits/rules-1B/validation.md` |
| M4 | A rule the orchestrator invented (two clean passes) ran as a hard loop; the owner had only said "I guess" | FABLE section 3 history |
| M5 | A brief did a later step's work (abilities assigned inside the characteristics list; assignment started before the code-or-agent marking) | FABLE 1b and assignment paragraphs |
| M6 | A brief sent agents to whole library catalogues (open-ended, hundreds of irrelevant features) | 1b drafter brief, corrected by message |
| M7 | Briefs carried a "Brief check:" line claiming the checklist was run when it was not | the owner, 2026-10-08 |
| M8 | Figures from agents' reports were stated as facts without saying they were the agent's (several caught only by the stop checklist after the report) | session transcript |
| M9 | Hook wording was changed twice on a misreading of the owner, then reverted | commits 8f597289, 0d92ea11 |
| M10 | Three areas were run in parallel on a flawed brief, then a full validation round on top, before any pilot | Phase 2 chunk 1 |

## 2. Already built (commit be8ce1a6), not yet live until the session restarts

- **Brief templates** `docs/prompts/briefs/rules-{writer,checker,apply}.md`, each with a binding block (reuse first with a `**Reuse:**` line per rule; run, not asserted, with `**Validated:** ... evidence: <file>`; pattern is not style; thresholds sourced, validated or open; run the gate before reporting). The brief hook (`.claude/hooks/brief-check.js`) blocks any brief that names a rules page (`docs/classifier/rules/area-*`) unless it carries one template's binding block word for word. Targets M1, M2, M3.
- **Acceptance gate** `tools/classifier/check_rules.py`: per characteristic, a reuse line; a named tool must appear in the survey's section for that id; "custom" only where the survey says nothing found; every validation claim names an evidence file that exists. Targets M1, M3, M8.
- **Commit gate** `.claude/hooks/commit-gate.js` (PreToolUse on Bash and PowerShell): a commit naming a rules page runs the gate and is blocked on failure.
- **Brief checklist** in CLAUDE.md ("Before sending any brief", eight questions), printed by the brief hook with the reporting questions. Targets M5, M6, M10 (but is self-attested; see M7).
- **Session self-test** `.claude/hooks/session-selftest.js` (SessionStart): checks the hooks are registered and behave.
- **FABLE Phase 2**: survey first; reuse line per rule; pilot one area before the rest; validation inside the area; stop for the owner if more than about a quarter of an area's rules still fail after its apply.
- Tested on planted cases: no search, irrelevant tool, unrun validation, custom where a tool exists, a narrowed binding block: all blocked; a correct page and a non-rules brief: passed.

## 3. Proposed, not built

- **P1. Brief auditor (agent hook, PreToolUse on Agent and SendMessage).** A separate subagent with Read/Grep reads FABLE's current step, CLAUDE.md's brief section, the lessons file and the templates, then judges the brief: is this the step the owner named (in the owner's words), or a later step's work; does it narrow or drop a binding rule; is it bounded with an end; are its inputs fixed; does it build on unchecked work. It blocks with the reason. Targets M4, M5, M6, M7, M10 by an independent judgement instead of self-attestation. Cost: one small agent run per brief. Agent hooks are documented as experimental.
- **P2. Rules-commit auditor (agent hook, PreToolUse on Bash, only when a rules page is committed).** Opens the cited tool's survey section and the evidence files for a sample of rules and judges whether they address the characteristic (the irrelevant-citation case the script cannot settle). Targets M1, M2, M8.
- **Not proposed:** an agent auditor on every Stop (cost on every turn); more checklist text (self-attested, M7).

## 4. Known limits

The gate checks that evidence exists and points the right way, not that research was good.
An auditor is still a model and can share the writer's blind spot. Each control is kept only if
it blocks the planted bad cases and does not block legitimate work.
