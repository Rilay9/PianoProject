===== PART 7: THE REVIEWER'S APPROVAL OF C0, AND ITS NINE DECISIONS (2026-09-26) =====

The reviewer read the vocabulary design, the orchestrator's read of it and the full test
inventory. C0 is approved conceptually; proceed with C1–C4 and stop after C4 for a
learner-facing review before C5–C7. The decisions:

1. Keep the five-part evidence rule and the distinction between material demand, skill,
   observation, evidence and learner ability. An item property can identify an opportunity
   and never itself become evidence of ability.
2. Keep v0 small: the sight-reading reader's roughly fifteen demands and a dozen reading
   skills; add vocabulary only when a real reader needs it and the observable exists; do not
   normalise the 283-concept taxonomy now.
3. Reverse T40's dropping of heard and demonstrated runs: record them with explicit flags
   (`unseen: false`, `demonstrated: true`) and exclude them from the evidence they cannot
   support. Invalid evidence is still a valid observation of practice; minutes, attempts and
   history are kept without contaminating the evidence model.
4. On detectors: independently maintained Python and TypeScript definitions of one musical
   fact are dangerous; the requirement is one authoritative definition, not necessarily one
   implementation. Check the build and runtime implications before committing to
   TypeScript-only; if one implementation serves both cleanly, use it, otherwise a canonical
   representation with mandatory agreement fixtures.
5. Turn the sight-reading key guide off for sight-reading by default and record the
   performance condition; a run that shows the next key is not clean evidence of staff
   reading.
6. Keep the triplet timing finding; do not solve it by tightening the global tolerance. A
   timing skill's measurement must discriminate its target rhythm, and where it cannot it
   returns no evidence rather than false evidence.
7. Treat the test inventory as a rebuild map: renderer-versus-renderer width assertions,
   tests that take expected answers from the app itself, and source-string assertions instead
   of rendered outcomes are addressed in their assigned waves, not preserved for being green.
8. Preserve the 41 proposed missing tests as the target coverage.
9. Keep the C4 stop as a learner-facing review: what the learner experiences, not only
   whether the architecture is internally consistent. The evidence machinery must not become
   an end in itself.

The principle to carry through C–H: the vocabulary system enforces evidentiary honesty; it
cannot prove construct validity. "We measured pitch accuracy" does not prove "we measured
interval reading"; that still needs constructed content, performance conditions, adversarial
tests and eventually human musical review. What the reviewer most wants to see next is C4 on
the actual app.
