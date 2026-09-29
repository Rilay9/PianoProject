# Reviewer response — F2a `fc91e5a`

Implementation HEAD: `fc91e5a` (merged at `067d49a`). Seam: F2a, Entry 117.

## Verdict

**APPROVE WITH ONE REQUIRED CHANGE**

The central correction is accepted. The core now introduces the leap at 1.5 and teaches it at 2.1, introduces accidentals at 3.1 and teaches them at 3.3, with actual opportunities on the teaching rungs. The hand-reading overrides are gone. The content report, app ancestry, reading controls, generator contract, lessons and derived `taughtAt` values agree.

## Required change

- **BLOCKS NEXT BRIEF — finish F2a with one narrow curriculum-data fix-forward before X1 consumes these claims.**

  1. Give `practice.1` the core prerequisite `1.1`. The measured alternatives establish why: `1.5` suppresses the practice track throughout Stage 1, while no prerequisite preserves a false Stage-0 ancestry. With `1.1`, the track opens from the second Stage-1 rung, the five-finger and Ode material inherit their real preparation, and the steps-and-skips study remains honestly untaught until 1.5. Update D8a to say “from the second rung of Stage 1” and add the named build/app cases. Keep `practice.2`–`practice.5` chained through their preceding practice rung.
  2. Split the beginner reading leap from the existing advanced technique-jump concept, or rewrite the concept identity and every consumer so it has one coherent meaning. At `fc91e5a`, `leaps` now opens at 1.5/2.1, while `concepts.json` still tells the learner to find “leaps of an octave or more” at Grades 5–6 and groups it with advanced jump material. A Stage-2 fourth/fifth and an advanced octave-or-larger jump cannot share one learner-facing concept entry. Prove the Skills entry opened from 2.1 describes the beginner interval skill and the advanced finder remains attached to its own technique concept.

This is one bounded F2a completion seam. It does not reopen the accepted teaching-rung mechanism.

## Other findings

- **CONSTRAINS NEXT BRIEF — the new 3.3 swap tier needs context-aware selection.** The `pitch.chromatic` claim at 3.3 is valid: four of seven options establish notes outside the key. The swap sheet can nevertheless offer blues and chromatic scales for an A-minor raised-seventh lesson because it matches only the broad demand. Record this for the chooser/placement owner: prefer material that teaches the same accidental-reading context, and do not treat any chromatic pitch as pedagogically interchangeable. This does not retract 3.3's teaching claim.
- **CONSTRAINS NEXT BRIEF — excerpt proposals now start leaps at 2.1.** This follows the corrected teaching truth. Keep the revised proposer case; do not restore the 1.5 hand-reading exception.
- **LATER WAVE — track-specific teaching homes.** Holiday and `blues.3` now expose honest path gaps. Resolve them as explicit claim decisions using their measured options, rather than restoring core credit across paths.
- **PRUNE/MERGE — the separate advanced and beginner leap meanings should leave no duplicate “Leaps” learner entry after the required split.**

## Verification basis

I read the immutable handoff first, Entry 117, the original F2 response, the exact `fc91e5a` diff, the four stage/vocabulary/lesson changes, reading controls, the named content and app tests, census and practice-scenario records, diary comparison, pictures list, and landing status. The targeted content checks, validator, typecheck, lint, app build and targeted browser checks report exit 0. The merged broad runs show two already-recorded CRLF-sensitive assertions outside this seam; the affected vocabulary tests pass on rerun. Nothing was heard, and the implementation makes no claim that the changed material was aurally verified.
