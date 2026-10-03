# The content queue: one reviewed vertical slice at a time

The old project-wide CT1 session is stopped. This queue is the only content-recovery sequence.

Read first, on this branch:

1. `CLAUDE.md`, especially **Reuse before reinvention**;
2. `docs/prompts/content-recovery-foundation.md`;
3. `docs/prompts/content-mistakes.md`;
4. the exact backlog/reviewer records named by the job.

A cloud job must not depend on a different branch or a chat transcript for facts it needs. If useful evidence exists only on another branch, the orchestrator first copies the vetted evidence onto the working branch or restates it in the job. **Do not tell the cloud agent to rediscover it.**

## Rules for every job

- One learner-facing proposition or tightly coupled concept family per job.
- Start from the current implementation and existing repository evidence; do not assume replacement is required.
- Search for reusable assets/data/libraries only for the gap that remains.
- Choose exactly one outcome for each touched mechanism: **KEEP / NARROW CLAIM / RETIRE / REPLACE / DEFER**.
- A census `REPLACE` label is only a candidate. Replacement must be safer or simpler for the exact use.
- Prefer verified real content for teaching/transfer, but keep a trustworthy generated drill when it uniquely provides controlled isolation or variation.
- No genre/title/family name proves a musical concept. Verify the exact notes/passage.
- Generator and checker are independent implementations of a sourced definition.
- Unknown may restrict automatic offers; it never grants teaching, a rung claim or credit.
- No grand framework, project-wide migration or unrelated cleanup.
- Leave CL12a's files alone (`chatgpt/cl12a`): `app/src/curriculum/session.ts`, `sessionPurpose.ts`, `app/src/data/sessionRun.ts`, `app/src/ui/screens/TodayScreen.ts`, `PlanScreen.ts`, `app/src/ui/help.ts`. Report a dependency instead of crossing the seam.
- Each job lives on its own `claude/cq<N>` branch cut from the current working head, never merges itself, and stops for outside review before the next job begins.

Each entry must report: proposition, old learner-facing risk, reused evidence, candidate alternatives searched, chosen outcome and reason, independent oracle/counterexamples, changed files, catalogue before/after claim ledger, content gained/lost, and remaining unknowns.

## CQ1 — named accompaniment claims: stop the known wrong certification

Scope only: Alberti, broken-chord, waltz bass, oom-pah, stride, boogie, walking bass, and the broad accompaniment claim only where required by those names.

Use the already-recorded CL10a research/counterexamples and the corrected CT1 findings summarized in `content-recovery-foundation.md`. Do **not** land CL10a's 75% threshold as truth and do **not** apply `pending-detect.patch` merely because it fixes the 16 known false positives.

For each named figure:

1. write/cite the published definition;
2. test the current mechanism against source examples and known near-misses;
3. use/review the existing candidate matcher only if its implementation follows that definition;
4. independently read the resulting score/passage;
5. run a catalogue claim diff;
6. enable the named claim only where the evidence supports it.

A broad `leftHandPattern`/accompaniment flag must never certify a named figure.

General accompaniment presence is separate. Prefer the published texture vocabulary/descriptors and validate them against the expert Mozart texture annotations. If a small reliable solution is not established, leave general accompaniment unresolved/restricting rather than inventing another heuristic.

**Finish:** known scale/Hanon/arpeggio false positives grant no named accompaniment claim; every surviving named claim has a source-defined matcher plus independent evidence; every changed catalogue claim is itemised. Review before CQ2.

## CQ2 — notation facts: parity before replacement

Scope: clef/signature/accidentals, note values, ties, tuplets, intervals, ledger lines, metre and other mechanically defined notation facts.

Run the existing implementation and an authoritative library/parser over the same catalogue cases. Itemise disagreements. Fix whichever side is wrong. Keep a small runtime TypeScript rule when it is needed live and proven equivalent; replace/delete duplicated code only when doing so measurably reduces risk.

This is **not** a "replace everything with music21" job.

**Finish:** disagreements are classified and resolved or explicitly deferred; no learner-facing claim changes without an itemised diff. Review before CQ3.

## CQ3 — harmony/theory facts: oracle first

Scope one coherent group at a time: chord spelling/quality/inversion, Roman numerals, cadences/progressions, etc.

Use music21/Tonal/DCML/When-in-Rome where semantically appropriate, but measure the current operation against the oracle before swapping it. A library solving chord mechanics does not settle pedagogical placement.

**Finish:** exact operations are either kept, narrowed, retired, replaced or deferred with measured reasons. Review before content coverage work.

## CQ4 — content coverage matrix from existing material

Build the first complete matrix from the curriculum as it actually exists. For every target/rung record:

- explain;
- demonstrate;
- isolate;
- practise repeatedly;
- transfer in real music;
- assess;
- progress from.

Each cell names the actual material and one of:

**REAL CONTENT / DERIVED REAL CONTENT / VERIFIED GENERATED DRILL / EXISTING LIBRARY OR DATA / MANUAL-ONLY / UNSOLVED.**

Do not add content merely to fill the table. This job diagnoses holes.

Search order for a genuine hole:

1. already committed/reviewed material;
2. curated sources already fetched by the project;
3. the owner's local PDMX archive through the existing quarry/search path and its recorded caveats;
4. other safely usable public/open teaching material;
5. existing open-source exercise/generator implementations;
6. only then a constrained generated drill whose exact properties can be checked.

The content suggestions from `claude/content-truth` are leads only; repository corpus records win where those later measurements contradicted them.

**Finish:** complete coverage/gap report, with no new musical mechanism. Review before any gap-filling build.

## CQ5+ — fill one real coverage gap at a time

Take gaps from CQ4 in learner-risk/order priority. One gap per reviewed slice.

For a generator family, do not rewrite all families. Preserve it if its definition, spelling, physical bounds and task fit are independently supported. Replace a hand-built subpart only when a source/library/data path is clearly safer. Retire only when the family adds no unique pedagogical value or cannot be made truthful.

Real pieces/excerpts are preferred for musical transfer. Generated exercises remain appropriate for controlled isolation and variation when their contracts are checkable. `study.py` or any mechanism claiming to make "musical" mini-pieces needs especially strong justification; nobody in this process can certify musical quality, so real études are the default substitute.

## After coverage is stable — level/curriculum alignment

Only then extract RCM, ABRSM and Faber separately and build a provenance-preserving crosswalk. Never average disagreement into one fake level. Curriculum reorders are owner decisions from a concrete disagreement report.

CL17's useful settled boundary survives: scalar difficulty is not curriculum truth and cannot by itself admit/refuse material. Its broad schema/UI migration remains frozen unless a separately reviewed need justifies it.

## Last — modes and evidence

Once content truth and task suitability are known, run CT1's adversarial cases through the real mode/record/evidence path. Credit only what the input and task actually observe. Physical technique, first-sight status, articulation/release, dynamics/pedal and similar properties retain their observation limitations.

## Convergence

After every accepted slice record four numbers:

1. unsupported learner-facing or credit-granting claims — must trend down;
2. hand-invented musical mechanisms the app must trust — down or explicitly justified;
3. curriculum targets with complete trusted teaching/practice/transfer/assessment coverage — up;
4. unresolved musical questions — each ultimately sourced, narrowed, manual-only or explicitly unsupported.

Those numbers, not test count or agent confidence, decide whether this recovery is working.
