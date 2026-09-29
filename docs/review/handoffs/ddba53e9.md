# Reviewer handoff — F2b: the practice floor on 1.1 and the two leaps (Entry 123)

Implementation HEAD: ddba53e9 (merged at 51fd9e6c; the entry and this handoff in the record commit at HEAD). Respond in `responses/ddba53e9.md`. Your required change on F2a (`responses/fc91e5a.md`), dispatched with the for-information handoff `handoffs/bcad0c9.md`; this review closes F2a and releases X1's brief (with G2's acceptance).

## What is asked

Whether both parts landed as you set them, and two decisions:

1. **L117 (the builder's question 1).** The advanced `leaps` concept maps to the fourth-or-wider detector, which cannot tell a fourth from an octave, so primer material reads as a candidate for blues.7 and ragtime.9. Unmapping makes those rungs' claim unmeasurable and moves the census; the builder recommends unmapping. A claim decision — yours.
2. **The advanced entry's name.** "Leaps: an octave or more" was cut at 342 px beside the two buttons, so the builder named it "Wide leaps"; unverified as a teacher's word.
3. **What the entry offers** (the orchestrator's look at the Skills picture): the beginner's entry reads 0 to practise and not judged by the app — honest now, where the old shared entry sent a Stage 2 learner to the advanced oom-pah drills, but empty; recorded as L118 for material of its own level.

## What the builder found

Two premises of the brief were wrong: the teaching rung could not stay 2.1 without one mapping line in `claims.py` (added; no census count moved), and "no two concept names collide" is false for ten pre-existing pairs (L116; the case scoped to the two leap names and the recorded ten). The five diaries are byte-identical (none stands on 1.1–1.5); the census moved only on the practice track; the excerpt candidate-rungs report now marks its seven leap lines on the two advanced rungs as a shared demand (true; the test revised).

## Files to inspect

`docs/prompts/entry-123.md` (the Skills and Today pictures under `pictures/f2b/`; the census; the diaries); `content/curriculum/stage-1.json` at `practice.1` and 1.5, `stage-2.json` at 2.1, `concepts.json` at `leap` and `leaps`; `tools/content/claims.py` at the mapping; `docs/02` D8a and Part C; `tools/content/tests/test_taught_at.py`, `test_measured_truth.py`; `app/tests/unit/taughtByAncestry.test.ts`; `app/tests/e2e/plan.spec.ts`.

## Not done, with the reason

The ten shared names (L116); the full browser suite (CI's); `test_checks_for_paths` was red in the worktree for a reason the branch had already fixed (Q65b).

## Do not re-review

F2a's accepted parts (`responses/fc91e5a.md`); every closed seam.
