# Reviewer handoff — F2a: the core's teaching truth and the practice track's ancestry (Entry 117)

Implementation HEAD: fc91e5a (merged at 067d49a; the entry and this handoff in the record commit at HEAD). Respond in `responses/fc91e5a.md`. Your required change on F2 (`responses/b41e19e.md`), dispatched as a fix-forward with the for-information handoff `handoffs/f6b5fa4.md` (no objection).

## What is asked

Whether the required change landed as you set it, and one decision that is yours:

1. **`practice.1`'s core prerequisite (Question 1 in the entry).** Measured in a session build: with 1.5 as the prerequisite the practice row disappears for every Stage 1 learner; with 1.1 it disappears for a learner at 1.1 only; with none, the floor reads as untaught at `practice.1` and the five-finger and Ode rows stay. D8a says the track runs "from Stage 1". The builder recommends 1.1 with D8a reading "from the second rung of Stage 1"; the one-line change is in the entry. Which?
2. **Part 1 as landed:** the leap introduced at 1.5 and taught at 2.1 (6 of 10 checked options establish it), the note outside the key introduced at 3.1 and taught at 3.3; no option added; the generator's table and `docs/05` aligned at the landing (the brief had withheld app code; the same fact in a third place — recorded in the orchestrator's note).
3. **The consequences:** 8 of 110 diary mornings changed; at 3.3 a new "notes outside the key" swap tier offers blues and chromatic scales for an A minor lesson, which the builder flags as unverified as teaching. A claim decision or a placement row? And one the landing chain found: the excerpt proposer's gate now refuses a right-hand window with leaps judged at 1.5 (the leap is introduced there and taught at 2.1), where before F2a it passed — the proposer's test case carried the old truth and was revised at the landing; excerpts with leaps are proposed from 2.1.

## Files to inspect

`docs/prompts/entry-117.md` (the judgement's pictures under `pictures/f2a/`; the census; the diaries' eight mornings; Question 1's measurement); `content/curriculum/stage-1.json`, `stage-2.json`, `stage-3.json` at the four rungs and the practice rungs; `content/curriculum/vocabulary/demands.json`; `content/lessons/1.5.md`, `2.1.md`, `3.1.md` at one sentence each; `app/src/engine/readingControls.ts` at `UNREALISABLE_AT`; `tools/content/tests/test_taught_at.py`; `app/tests/unit/taughtByAncestry.test.ts`.

## Not done, with the reason

`practice.1`'s core prerequisite and `practice.3`–`.5`'s core rungs (Question 1, yours); the five deferred every-bar claims (E22) and the eighty proposals (L112) stay where F2 left them.

## Do not re-review

F2 (`responses/b41e19e.md`); the F2a brief (no objection recorded); every closed seam.
