===== PART 13: THE REVIEWER'S UNFINISHED CURRICULUM AUDIT — FOUR C6/C7 FINDINGS AND NINE CONSTRAINTS (2026-09-26, C6 in the tree) =====

The reviewer's curriculum audit is **not complete**. Its structural enumeration is (109 lessons,
prerequisites, requirement kinds, track and stage placement, the recommendation path); the
holistic synthesis is not (what the curriculum teaches → what a years-long teacher must teach →
missing, weak and overrepresented domains → progression topology → learner-profile stress tests
→ which wave owns each correction → the requirements to inherit). Nothing here is the final
curriculum specification; a consolidated packet with coverage gaps, progression issues,
learner-profile stress tests and explicit D/E/F/G/X/H ownership is to come. The reviewer's
framing: a lot of the infrastructure is strong; the better evidence architecture is now exposing
the old curriculum assumptions, which is when they should be found — before later waves turn them
into polished product behaviour. The instruction: record these as constraints on what C6 may
safely assume and give the broader repairs explicit ownership; do not stop or restart C6 unless
one conflicts with an abstraction it is cementing.

**The four findings sent first, with the orchestrator's verification at the lines:**

1. **The curriculum is not one global ability ladder** (61428). Verified: `core` units exist in
   Stages 0–4 only (4, 5, 5, 6, 6 units) and none from Stage 5 on; `docs/02-curriculum.md` line
   9 says tracks run in parallel from Stage 3 and the learner picks which to advance. → L85.
2. **Stage 9 is not rungs to pass** (73105). `stage-9.json`: "One piece at a time, for as long as
   it takes. Nothing here is a rung to pass; they are pieces to live with." Yet its seven units
   carry nine ordinary `runs` requirements that can be marked met — the semantic contradiction.
   → L86.
3. **The parallel-strand problem, the most important** (85241). `nextRecommended`
   (`session.ts:236`) walks every stage in order and returns one first-unmet position although
   the curriculum says tracks run in parallel; C6 must not let that single position make one
   track monopolise technique, new and repertoire, or serialise core, classical, theory-ear and
   practice. Verified; sent to the C6 builder mid-task on 2026-09-26 with 1 and 2. → L84.
4. **Long-horizon evidence, for C7** (39564). The ladder derives competence by replaying raw
   rows, and old rows can be pruned. Verified: `pruneSessions` trims the store at `MAX_SESSIONS`
   (the 25,000-row last resort) with `PRUNE_SLACK`, per-step detail is compacted after
   `OBSERVATION_WINDOW_DAYS`, and the C5 recompute job walks the store (`evidenceJob.ts` →
   `walkSessions`). → L87; the C7 brief.

**The nine constraints, recorded now so they are not lost because most are downstream of C6:**

1. **C5 made requirement evaluation honest; it did not make the requirements sufficient.**
   Verified over the 109 lessons: 173 `runs`, 19 `unjudged`, 3 `done`, 6 `skill`, 2 `reads`;
   every `skill` and `reads` requirement is in core; outside core, none. The plumbing answers
   "did the learner meet the requirement that was written" while most specialist rungs define
   learning as completing listed items at threshold, not as competence demonstrated, transferred
   and retained. "Now evidence-based" never means the predicates are finished; the curriculum
   reconstruction revisits what constitutes evidence of learning for each domain. → L88.
2. **Not one global ability ladder** (as above): `stageNumber`, the highest rung or the furthest
   track is never the canonical representation of ability; the learner is multidimensional —
   reading, rhythm, technique, ear and audiation, harmony, coordination, repertoire,
   improvisation develop unevenly. → L85 strengthened.
3. **Tracks are strands, not courses to complete.** The breadth (core, classical, chords-pop,
   theory-ear, technique, practice, jazz, blues-boogie, improv-compose, ragtime, latin,
   rock-metal, hymns-gospel, jam, holiday) is valuable, but the product must not become fifteen
   parallel mini-courses with completion pressure. The composition distinguishes foundational
   musicianship that keeps developing; the learner's interests and projects; diagnosed
   weaknesses; retention and transfer; the repertoire life; deliberate breadth and exposure —
   and composes an education from them rather than marching through every track. → L89.
4. **Prerequisites describe readiness, not curriculum history.** The graph is mechanically clean
   (no missing ids, no forward edges — the reviewer's finding, not re-verified here), but most
   dependencies are rung ids; a cross-track dependency (jazz on chords-pop) is sensible for the
   skills taught there, yet completing that stylistic rung must not be the only way to show
   readiness. Translate important rung prerequisites into skill and demand readiness where
   possible; keep a rung dependency only when the experience itself is prerequisite. → L90.
5. **Practice methodology is longitudinal coaching, not a Stage-1 course.** The practice track
   says it runs alongside everything, yet its lessons live in Stage 1 (verified: the only
   `practice` unit is Stage 1's); a serial walker treats "how to practice" as boxes to complete.
   Chunking, slow practice, distributed work, interleaving, diagnosis, listening, planning,
   performance preparation are revisited differently as the pianist develops. → L91.
6. **Open-ended work needs semantics distinct from finite rungs.** Stage 9's sentence becomes a
   product and data distinction: projects and repertoire carry lifecycle states (choosing,
   learning, polishing, performing, maintaining, refreshing, pausing or retiring, returning),
   never only not-started, in progress, met. → L86 strengthened; G with R17–R20.
7. **Long-term development cannot terminate at the authored ladder** — never by adding Stages
   10–50. The authored curriculum is the foundation and guided intermediate development; beyond
   it the teacher becomes project- and repertoire-driven while still diagnosing and developing
   reading, rhythm, technique, ear, theory and harmony, accompaniment, improvisation,
   interpretation, memorisation where useful, performance, repertoire, creative work, weak areas
   and breadth. The learner model survives breaks, forgetting, relearning, changing interests,
   retained repertoire and years of history without resetting an advanced learner to beginner
   work. → L92, with R43.
8. **Raw evidence retention needs a years-long design** (as above): a durable evidence checkpoint
   or summary, while recent contrary evidence and `notShownRecently` still represent current
   readiness; "mastered" never becomes an irreversible boolean to solve storage. → L87
   strengthened.
9. **The teacher selects experiences, not curriculum coordinates**: learner state + curriculum
   intent + retention and transfer + repertoire life + goals and interests + breadth → the kind
   of experience needed → the material → observe → update evidence → the next experience. The
   stage and rung structure is useful authored curriculum and never the ontology of the pianist.
   Already the plan's first rule since the strategy review (experience before item, L26); the
   last sentence is added to it.
