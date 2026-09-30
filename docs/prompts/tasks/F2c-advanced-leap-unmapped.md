# F2c — F2b finished: the advanced `leaps` concept no longer credited by the fourth-or-wider detector — its mapping to `interval.leap` removed, the two advanced rungs' leap claim explicitly unmeasured until a detector proves octave-or-more material, the false `sharedBy` relationship gone, the census and reports regenerated, and a regression that a primer fourth never satisfies a claim attributed to `blues.7` or `ragtime.9`

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/review/responses/ddba53e9.md` in full (the F2b review: the required change and its acceptance; the prune line — the two leap identities stay distinct; the later waves L116 and L118); `docs/prompts/entry-123.md` (F2b: question 1's measurement; the `sharedBy` change in the candidate-rungs report; the `claims.py` line); `tools/content/claims.py` at `CONCEPT_DEMANDS` (`leap` and `leaps` both → `interval.leap`) and `status_of`; `tools/content/tests/test_measured_truth.py`, `test_taught_at.py`, `test_study.py` (reads `docs/prompts/runs/D3/candidate-rungs.md`); `docs/02-curriculum.md` Part C at blues.7 and ragtime.9.

## What is decided

1. **The mapping.** `claims.CONCEPT_DEMANDS` keeps `"leap": "interval.leap"` and loses `"leaps": "interval.leap"`. The advanced concept maps to no demand: its claim on `blues.7` and `ragtime.9` reads as *unmeasured* in the rung-claims report and the inventory (the report's existing word for a claim no detector proves), never as established by a fourth. No new detector in this seam (the reviewer's line: until one proves octave-or-more material, the claim is explicitly unmeasured).
2. **The consequences regenerated.** The census before and after (only the two advanced rungs' leap rows move: from established-by-fourths to unmeasured; every other count unchanged — state the relationship in the entry); the rung-claims report, the inventory, D0's record and the excerpt candidate-rungs report regenerated; the candidate report's seven leap lines at blues.7 and ragtime.9 lose their `sharedBy` relationship (it was the false one); the five diaries rerun and compared (no morning should change: the two rungs are Stage 7 and 9).
3. **The regression, red first:** a primer fourth (a 2.1 study or the menuet's opening) satisfies no claim attributed to `blues.7` or `ragtime.9` (`test_measured_truth` on the built report; `test_study` on the candidate report); the beginner `leap` claim at 2.1 still reads established (unchanged); `taughtAt` for `interval.leap` stays `["2.1"]`.
4. **`docs/02` Part C** at blues.7 and ragtime.9: one clause each saying the octave-or-more leap is a claim no detector measures yet.
5. **Not F2c's:** an octave-or-more detector (a D row for the detectors' owner; record it); L116's ten pairs; L118's beginner material; any option or concept change.

## Verification layers

Build-time, red first: the regression cases red on the committed data; the content build offline, the validator, the record check, `test_measured_truth`, `test_taught_at`, `test_study`, `test_validate_claims`; the diaries compared. Unit: `taughtByAncestry`, `sightReadingPromises`. No browser run unless a Skills case reads the advanced entry's claim (then `plan.spec.ts` on port 4373 with a `specs-exist` check). The product look: the rung-claims report's two rows before and after, as text observations.

## Rules and files

You own `tools/content/claims.py` at the one mapping, the tests named, the regenerated reports and records, `docs/02` Part C at the two rungs, `docs/prompts/runs/D3/candidate-rungs.md` if the build rewrites it (say so). Not the stage files, not the lessons, not the vocabulary, not `validate.py`, not any app code. JSON spliced as text. A fresh worktree's content build needs the kern, musetrainer and cache inputs copied from the main checkout's `build/` as F2b did (say what you copied); `npx vitest run` needs `python tools/midi-cleanup/tests/parity_reference.py` first (Q24). Never name an AI model. Never assert a number measured on this machine. Every change red first; no commits, pushes, stashes or checkouts.

## Sequencing

The F2b review's required change, a narrow claim correction under F2's contract (788427c), dispatched with a for-information line; its post-build review closes F2 and releases X1 (with G2's acceptance).

## When to deviate

If removing the mapping makes the validator refuse blues.7 or ragtime.9 (a concept with no measurable demand where the rung's claim needs one), say which check and stop: the reviewer chose explicit unmeasured over a false credit, and a validator rule that forbids it is the next question, not something to route around.

## Report

Judgement first: the two rungs' rows in the rung-claims report before and after, and what a learner at blues.7 is told about the leap (the Skills entry, unchanged), as observations; then Done / Not done / Follow-ups / Questions / Files; the census; the red lines; the tests table; exit codes; unverified beside what passes.

**Landed 2026-09-29** (Entry 130; 267cac32, merged fb89e790); handoff `handoffs/267cac32.md`. L119 recorded.

**Accepted 2026-09-29** (`responses/267cac32.md`, APPROVE). F2 closed; the two concepts' claim boundaries independent; L119 a later wave; historical candidate reports stay historical.

## Record

lane: F2c · closes: — · entry: 130
index: F2b finished: the advanced `leaps` unmapped from the fourth-or-wider detector, the two advanced rungs' leap claim explicitly unmeasured, the false `sharedBy` gone, the census and reports regenerated, a regression that a primer fourth satisfies no advanced claim (`F2c-advanced-leap-unmapped.md`) | F2b (Entry 123); `responses/ddba53e9.md` | `claims.py` at one mapping, the tests, the reports, docs/02 Part C at two rungs | **done 2026-09-29**, Entry 130; merged fb89e790; handoff `handoffs/267cac32.md`; L119 recorded; closes F2 on its review; **accepted 2026-09-29** (`responses/267cac32.md`, APPROVE); F2 closed |
state: closed 2026-09-29: accepted (`responses/267cac32.md`, APPROVE); F2 closed
