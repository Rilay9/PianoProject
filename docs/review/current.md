# Reviewer handoff

HEAD: 8686421 (T52's commit is `8686421`; this handoff's commit follows it)

## What changed since the last handoff (041db99)

- **T52 delivered, Entry 81** (`docs/prompts/entry-81.md`), in three rounds in one tree: (1) the assign sheet's sentence (the reviewer's wording), the owner guide, the two historical comments, and `assignmentIsNotEvidence.test.ts` proving assignment yields no evidence and meets no rung while a run built to 2.2's `runs` predicate (Keep tempo, 90 % at 85 % tempo, opened from 2.2) meets `requirements[1]` alone; (2) the same false claim found in two more learner-facing places — the folder screen's message after Save (which also printed a rung id; now the rung's title, "… is now one of the practice options for <title>") and the Guide's sentence — with the sheet's spec and the pipeline doc corrected; (3) a second false claim the builder inferred and the orchestrator confirmed at the lines: since C6 a passed piece on no rung returns in Today's review as piece retention (`usable` never asks about rungs; `learnedPieces` takes every passed row), so "the plan does not know about it" in the Guide and the owner guide was wrong; proven by a test through the real review path on eight seeds and corrected in five places.
- The review channel is `docs/review/responses/<HEAD>.md` (one new file per handoff; the reviewer's write test showed it creates but cannot overwrite).
- CI runs one job per branch (the newest push cancels the queue).
- F0 dispatched as Entry 82 after T52's chain.

## Decisions made (the orchestrator's, to overrule)

- The folder message's form "… one of the practice options for <title>" instead of the possessive, because rung titles like `Eighth notes and counting "1 and 2 and"` cannot take an apostrophe.
- The second false claim was fixed as part of T52 rather than recorded as a row: same never-teach-wrong fault, minutes of work, same tree.

## Files to inspect, in order

1. `docs/prompts/entry-81.md` — the three rounds, each with before → after, red lines and a tests table.
2. `app/tests/unit/assignmentIsNotEvidence.test.ts` (five cases); `app/src/ui/assignSheet.ts:72`; `app/src/ui/screens/FolderScreen.ts` (the message after Save, the curriculum load before the sheet); `app/src/ui/screens/GuideScreen.ts:238`.
3. `docs/OWNER-GUIDE.md` (the assign paragraph); `docs/04-ui-spec.md` (the sheet's spec, dated T52 note); `docs/03-content-pipeline.md:67`.

## Tests and verification

- The builder's runs, three rounds, unpiped: tsc 0, lint 0, vitest 0 (253 files); the folder e2e revised unrun.
- The orchestrator's chain over `8686421`: content build, validator, content tests, tsc, lint, vitest (5,979 passed, 6 skipped), app build exit 0; `folder.spec.ts` and `guide-shots.spec.ts` 16 passed, 1 skipped. Not run: the whole default configuration (T52 touched no rendering; the last full run was over `f3c4b7e`, green).
- Nothing heard; the sentences were read on the real screens in jsdom by the builder and not on a phone by anyone.

## Questions for the reviewer

1. (Product, for the owner too) Should a piece the learner deliberately left on no rung ("No rung — just put it in my library") return in Today's review at all? The sentences now describe that it does; whether it should belongs to repertoire retention's owner (R19) or Part 21 §D. Recorded in E21.
2. Rungs with no `runs` requirement over songs (1.5, 2.5, 3.6, the practice track, theory.3, improv.3, rock.overview) cannot count an assigned import, and the sheet offers them without saying so — Part 21 §D's workflow, or a smaller change to the sheet now?
3. From the previous handoff, still open: L96 (the review row repeating one item after the exposure fix).

## Dispositions of the reviewer's last response

No response file has landed for the handoff at 041db99 yet; its questions stand above.

## Do not re-review

Parts 12–27, the pre-dispatch review's three briefs (applied), the C6 fix-forward (its chain green over `f3c4b7e`: 791 passed; the gallery only on U62).
