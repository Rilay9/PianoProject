# CQ1 brief: a broad accompaniment result cannot certify a named style

This brief is immutable for the slice. The source of truth is
`docs/prompts/content-queue.md` (CQ1), `content-recovery-foundation.md`, `content-mistakes.md`
and `CLAUDE.md`.

- **Branch:** `claude/cq1`, cut from `34a8676`, the working head.
- **Foreman:** the cloud session.

## Proposition

> A broad `leftHandPattern` / accompaniment result (and the `walkingBass` heuristic, where
> it is the only evidence) must not certify a named style: Alberti, broken-chord, waltz bass,
> oom-pah, stride, boogie, walking bass.

This covers every form a certificate can take: a rung establishment, a teaching statement, a
learner-facing word, a transfer relationship or credit.

## Known evidence (do not rediscover)

- **The named styles share one heuristic.** `tools/content/claims.py:79–86` (`CONCEPT_DEMANDS`)
  maps `alberti`, `alberti-bass`, `broken-chord-accompaniment`, `waltz-bass`,
  `oom-pah-bass`, `boogie-bass` and `stride-bass` onto `texture.left-hand-pattern`, and
  `walking-bass` onto `texture.walking-bass`.
- **The broad flag misreads two-hand exercises.** `leftHandPattern`
  (`app/src/demands/detect.ts:514`) is true on two-hand scales, Hanon and arpeggios. The CT1
  brief's appendix lists 16 golden models; CL10a's checkpoint counts about 256 catalogue
  items.
- **The walking-bass detector has recorded misreads.** E22 records `walkingBass` misreading
  the stride left hand and the clave pulse (`claims.py:89–97`).
- **The flag cannot stand for accompaniment.** CT1's handback (`claude/content-truth`,
  `docs/prompts/runs/CT1/HANDOFF.md` §1) measured the figure matchers against expert Mozart
  texture labels. 430 of 589 expert accompaniment bars carry no figure, so the broad
  heuristic cannot stand for accompaniment either.

## What is unknown, and is this slice's evidence step

1. **Every consumer** of the eight named-concept mappings, and of the two demands' presence.
   Each is classed:
   - **GRANT:** positive authority, meaning a rung claim established, `taughtAt` derived,
     a demand-tier "practises" offer, a transfer relationship, evidence or credit, or
     learner-facing words;
   - **RESTRICT:** an item kept out before the demand is taught.
2. **Whether two-hand scales, Hanon and arpeggios also read as `walkingBass`** on the golden
   models and the built catalogue.

## Allowed

- `tools/content/claims.py` and its report outputs.
- `tools/content/validate.py`, only where it reads these mappings.
- The demand-to-concept wiring in the app, if a GRANT is found there.
- Tests.
- The CQ1 run record.

## Forbidden

- CL12a's files: `app/src/curriculum/session.ts`, `sessionPurpose.ts`,
  `app/src/data/sessionRun.ts`, `app/src/ui/screens/TodayScreen.ts`, `PlanScreen.ts`,
  `app/src/ui/help.ts`. A GRANT found there is reported as a dependency.
- Any detector's rule (`detect.ts`).
- Any new matcher, threshold or heuristic, `pending-detect.patch`, and CL10a's 75% rule.
- Generators and the curriculum order.

## Outcome rule

- Sever only GRANT paths: **NARROW CLAIM**.
- **Keep every RESTRICT path:** unknown may restrict, never grant (content-mistakes 6).
- Content is not deleted from rungs (content-mistakes 7).

## Falsifiers, run before and after

1. **The two-hand models gain no named style.** No golden two-hand scale, Hanon or arpeggio,
   and no catalogue item of those families, establishes any of the eight named concepts, or
   is offered as practising one.
2. **The prerequisite gate is unchanged.** It gives the same keep-out answer for an item whose
   only uncertain demand is the broad one: no item becomes offered earlier.
3. **The loss ledger is exact.** It lists every rung claim and every item-level claim that
   loses positive authority.

## Finish

All three falsifiers hold. No new musical heuristic exists. An independent cloud reviewer
approves. The convergence counts are updated.
