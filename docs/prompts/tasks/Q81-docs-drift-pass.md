# Q81 — The doc drift the second splice found and left: six lines corrected at the code, each with its reason beside it (Doc-splice-2's follow-ups 1–7 less the map pattern, which is the reviewer's; P3, docs work under 788427c)

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/prompts/entry-140.md` (Doc-splice-2: the seven follow-ups, each with what the splice saw); the backlog row Q81 (`docs/prompts/backlog-2026-09-25.md`); `app/src/evidence/ladder.ts` at the two comments (about lines 20–24 and 89–93: *Where a fact is unknown the attempt counts … its dimensions spare nothing, a demand no establishing record carried still does*) against the policy as G2a landed it (`docs/prompts/entry-132.md`, G2a, and `docs/review/responses/337a0324.md`: the protection rule as built); `app/src/data/db.ts` at `DB_VERSION` (9) and `docs/01-architecture.md` at *`DB_VERSION` is 8* (about 268) and its upgrade paragraph; `docs/08-test-map.md` at the file lines (about 460–480: two identical `taughtByAncestry.test.ts` lines at about 471 and 473; no line for `tools/content/tests/test_import_mutopia.py`, `test_public_tie_option.py` or `app/tests/unit/test_skill_transfer`-equivalent — check each file's real path and what it tests by reading it); `docs/04-ui-spec.md` at §4's *the one import where the app decided things on his behalf* (about 1535) and §2's sentence about the ladder's v0 state keeping C7's words (find it; the splice quoted it as *the ladder's v0 state keeps C7's words*); `app/src/curriculum/load.ts` or wherever the import sheet now decides nothing (X3's contract: the sheet says what the file says); `docs/prompts/tasks/Doc-splice-2026-09-29-2.md` (how a splice checks a line at the code).

## The goal, in the orchestrator's words

Six lines in the canonical docs and two comments in the code say something the code no longer does. Each is small; together they are the drift the next reader trips on. This pass corrects each at the code — reads the code first, then writes the sentence the code makes true, with the reason beside it — and touches nothing else.

## What is decided

1. **`ladder.ts`'s two comments** say what the protection policy does on an unknown fact, in the words the policy's own tests use (read `app/tests/unit/` for the G2a cases: what happens to a demand with no establishing record, and to an unknown dimension). If the comment is right and the splice misread it, say so and leave it, with the reason in the entry.
2. **`docs/01`**: *`DB_VERSION` is 9*, and the upgrade paragraph names the version-9 store (`projects`, G1b) in the same shape as the earlier upgrades.
3. **`docs/08`**: one `taughtByAncestry.test.ts` line, not two; a file line for each test file the map lacks, written from what the file actually tests (its docstring and its case names), in the section's existing shape and order.
4. **`docs/04` §4**: the import sentence says what the sheet now does (since X3: the sheet reads the file's tempo, metre and key and decides nothing for the learner — verify at the sheet's code, `app/src/ui/importSheet.ts`, before writing).
5. **`docs/04` §2**: the ladder's v0 sentence says what the state names are today (read `app/src/evidence/ladder.ts`'s `LADDER_STATES` and the help words).
6. **Not Q81's**: the map pattern for `docs/03` (`docs/prompts/checks.json`'s pattern does not name `libraryImportWords.test.ts`, which reads `docs/03`) — a test-map change, which goes to the reviewer before any push; record it in the entry as left for the reviewer, with the line the pattern would need. No other doc line, however tempting; a further drift you meet is a follow-up line, not an edit.

## Verification layers

- For each corrected line, the code line that makes it true, quoted in the entry (path and line).
- `npx vitest run tests/unit/docsConsistency.test.ts tests/unit/help.test.ts tests/unit/labHelp.test.ts tests/unit/progressHistoryLines.test.ts tests/unit/sightReadingFromReadingState.test.ts tests/unit/libraryImportWords.test.ts` (the unit files that read the docs); `python -m unittest tools.content.tests.test_named_by_what_they_are tools.content.tests.test_prompt_views`; `npx tsc -b` (a comment change cannot break it, but the chain runs it); the map: `python tools/docs/checks_for_paths.py <changed paths>` and what it names.
- No browser; no build; nothing on any port.

## Rules and files

You own `docs/01-architecture.md`, `docs/04-ui-spec.md`, `docs/08-test-map.md` at the lines named, `app/src/evidence/ladder.ts` at the two comments only. Not the map file, not any other source, not the backlog (the orchestrator records). Never name an AI model. No commits, pushes, stashes or checkouts. A fresh worktree's `npx vitest run` needs `python tools/midi-cleanup/tests/parity_reference.py` and `python tools/content/build.py --offline` first (Q24); if the offline build cannot produce `app/public/content`, copy that folder from `C:\Users\yalir\repos\Piano Stuff\PianoProject\app\public\content` and say so; `npm ci` in `app/`. Four other builders work on `SkillsScreen.ts`/`style.css`, `difficulty.py`, `import_kern.py`/`import_musetrainer.py`/`validate.py`, and `session.ts`/`TodayScreen.ts`; touch none of them.

## Sequencing

Docs work under 788427c: no handoff of its own; the reviewer sees it through `docs/08` and the entry. Dispatched now, for information.

## Report

Judgement first: which lines were wrong and what a reader would have believed; then Done / Not done / Follow-ups / Questions / Files; the code lines quoted; the tests table; exit codes. Entry 146; every run file under `docs/prompts/runs/Q81/`; the entry as `docs/prompts/runs/Q81/ENTRY.md`, starting `### Entry 146 — Q81`.

**Landed 2026-09-29** (Entry 146; 4d9365eb, merged fbc66d37). Docs work under 788427c, no handoff of its own; the map pattern with the reviewer; Q87 records the drift it found and left.
