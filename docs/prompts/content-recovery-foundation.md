# Content recovery foundation — the one path forward

This file exists because the content-truth work split across branches and cloud sessions began rediscovering, contradicting and re-solving the same problems. A fresh content job must be able to start from the working branch alone. Do not require another branch or chat transcript to understand what is already known.

## Purpose

The goal is not to modernise the codebase, maximize replacements, or rebuild every musical mechanism. The goal is to reduce how much musical truth this project invents and must trust itself to get right while preserving work that is already correct.

Every change chooses one of five outcomes: **KEEP, NARROW CLAIM, RETIRE, REPLACE, DEFER**. `REPLACE WITH LIBRARY` or `REPLACE WITH DATA` in an audit is a candidate, never an instruction by itself.

The preference order is:

**verified real content -> published data/definition -> established library -> small sourced project rule -> new algorithm only when the previous choices cannot satisfy the requirement.**

A replacement must be demonstrably safer or simpler for the exact use. Existing tested code stays when no concrete defect or meaningful maintenance risk justifies touching it.

## What is already trustworthy enough to carry forward

### Repository records and settled process

- `CLAUDE.md`, first section: reuse before reinvention.
- `docs/prompts/content-mistakes.md`: each item is a known failure mode from this project.
- Backlog, reviewer responses, pending-review records and the existing content-pipeline decisions remain primary evidence for what has already been measured or rejected.
- Existing corpus/import records beat a later casual remeasurement when they conflict, unless the later work identifies the exact old error with evidence.

### CL10a — keep the research and the counterexamples, not its candidate threshold as truth

`chatgpt/cl10a` established the important failure: broad lower-staff activity can misread two-hand scales, Hanon and arpeggios as accompaniment, and one broad accompaniment demand cannot certify named styles. Its research note, adversarial examples and real-score oracle work are useful inputs.

Do **not** treat CL10a's 75% share rule or implementation as established pedagogy. Its own entry calls that threshold an unverified musical judgement and says full corpus/claim measurements are outstanding. It is evidence to compare against, not a foundation to land unchanged.

### CT1/content-truth — preserve these findings

The cloud session on `claude/content-truth` produced a useful census and source search, then also generated speculative plans and some superseded measurements. Carry forward the following corrected findings:

- The reuse census is an **inventory of candidates**, not a migration plan.
- `HS1` in the ALGOMUS/Couturier texture vocabulary means an accompaniment-layer description; it is **not synonymous with Alberti**. A named Alberti claim needs a sourced Alberti-figure check as well.
- Generator and checker may share a sourced verbal definition, but must be independent implementations; a generator never certifies itself.
- ABRSM, RCM and Faber stay as separate source tables before any provenance-preserving crosswalk. They are not one universal level scale.
- Real music is preferred, but a genre/composer/title proves nothing about the target. A teaching claim is admitted at the exact passage only after the notes establish it and the level/physical fit is checked.
- Licences and redistribution scope remain part of admission. Non-commercial or unresolved datasets may be private test oracles only.
- The spelling audit corrected the earlier overclaim that every generator spells correctly merely because music21 appears in its call graph. Hand-written pitch-name paths still need independent checking.
- The census coverage test idea is useful: registered generator families, detectors and drill kinds should not silently appear without a reuse/source decision.
- The later content-suggestions file correctly says to read already committed corpus records first and search the owner's local archive only for remaining gaps. Its candidates are leads, not admissions.
- `measurements-2026-10-03.md` explicitly marks parts of its holdings work superseded by repository records. Do not resurrect its contradicted Joplin/Clementi claims.
- `pending-detect.patch` was intentionally left unapplied. Do not revive it merely because it fixes the known 16 false positives; later texture measurements showed the underlying general-accompaniment question is broader.

### CL17 — preserve the boundary, freeze the migration

`chatgpt/cl17` usefully separates a difficulty/level estimate from curriculum truth: numeric level may sort or describe, but must not by itself decide whether a learner is ready for a piece. The existing demand/eligibility path is the semantic gate.

Its proposed multi-slice schema/UI migration is **not part of content recovery yet**. Keep it design-only until concept measurement, content coverage and the level-source crosswalk are stable. Do not make content recovery wait on rewriting every stored/displayed level field.

### CL12a — separate lane

`chatgpt/cl12a` is about session purpose/fallback semantics, not musical-content truth. Content jobs do not touch its files or silently solve its open purpose question. If content work genuinely requires one of those files, report the dependency and stop that seam.

## What must stop now

- No more giant CT1 session that owns detectors, generators, curriculum, levels, modes, imports and UI at once.
- No standalone "replace all libraries/data rows" wave.
- No new grand generator/content framework.
- No automatic library swap merely because a census row says REPLACE.
- No new musical heuristic because a convenient dataset is missing.
- No re-search of a corpus/source question already answered in repository records unless a concrete contradiction is being tested.
- No content admission by title, composer, genre, family name or generator name.
- No claim deletion that makes difficult music look easier: unknown may restrict, never grant.
- No broad code migration before one vertical slice proves the replacement end to end.

## The vertical-slice rule

Every content job begins with one learner-facing proposition, for example:

> "This option teaches/practises Alberti bass at rung X."

That single job traces the proposition through:

1. **definition/source** — what Alberti actually means;
2. **existing mechanism** — current detector/generator/content and its known behavior;
3. **reuse search** — real content, data, library, reference implementation;
4. **independent check** — source example, expert annotation or separate implementation;
5. **content** — existing verified passage first; generated drill only if it fills a real gap;
6. **rung placement** — source-table context, with disagreements preserved;
7. **task fit** — contains X is not automatically good practice for X;
8. **observation/credit** — the mode can only credit what it actually observes;
9. **learner-facing wording** — no stronger claim than the evidence supports.

Only files needed for that proposition are changed. If the replacement does not beat the existing mechanism on correctness or simplicity, keep the existing mechanism and close the job.

## Sequence

### 0. Carry-forward and containment

Before a cloud content job is launched, its brief is self-contained on the working branch and names the existing evidence it is allowed to rely on. Do not tell a cloud session to read a different branch as its source of truth.

Keep the safety rule throughout: unsupported/unknown claims may restrict automatic offers, but cannot teach, establish a rung claim or earn credit.

### 1. Fix the known named-accompaniment harm, narrowly

First proposition family: Alberti, broken-chord, waltz bass, oom-pah, stride, boogie, walking bass.

- Immediately stop a broad accompaniment flag from certifying a named style.
- Reuse the CL10a counterexamples and the corrected CT1 texture measurements.
- For each named figure, use its published definition and an independent checker over the produced/read score.
- Re-enable a named claim only when its independent cases and real-catalogue report support it.
- General "accompaniment present" is a separate problem. Prefer the published texture vocabulary/descriptor work and validate it against the expert Mozart annotations. If that cannot be made reliable in a small slice, leave the general claim unresolved/restricting rather than invent another rule.

Finish one figure or one tightly coupled set, review it, then continue. Do not rebuild all texture concepts at once.

### 2. Verify notation facts against libraries; replace only where the comparison earns it

For clefs, signatures, note values, ties, tuplets, intervals, metre and similar facts:

- run the current implementation and music21/another authoritative parser over the same catalogue cases;
- itemise disagreements;
- fix the side that is wrong;
- keep a runtime TypeScript rule when it is small, needed live, and proven equivalent;
- replace/delete duplicated code only when doing so is a net reduction in risk.

This is a parity-and-defect lane, not a library-migration contest.

### 3. Do harmony/theory the same way

Use music21/Tonal/DCML/When-in-Rome where they fit, but first measure the exact current operation against the oracle. Replace only the bad or needlessly duplicated path. Pedagogical placement remains a separate question.

### 4. Build the content coverage matrix from what already exists

For each curriculum target/rung, record:

- explain;
- demonstrate;
- isolate;
- practise repeatedly;
- transfer in real music;
- assess;
- progress from.

Each cell names the actual material and one of:

**REAL CONTENT / DERIVED REAL CONTENT / VERIFIED GENERATED DRILL / EXISTING LIBRARY OR DATA / MANUAL-ONLY / UNSOLVED.**

Search order for a hole:

1. already committed and already reviewed content;
2. curated source already fetched by the project;
3. owner's local PDMX archive using the existing quarry/search tools and recorded caveats;
4. other safely usable public/open teaching material;
5. an existing generator/reference implementation;
6. only then a small generated drill whose exact properties are mechanically checkable.

Do not remove a working generated drill merely because real music also exists. Real content supplies transfer; generated drills can remain valuable for controlled isolation and endless variation when their contracts are trustworthy.

### 5. Revalidate generators only as coverage requires them

Do not rewrite 57 families.

For a family that the coverage matrix actually needs:

- preserve it if its musical definition, spelling, physical bounds and task are independently supported;
- replace hand-written subparts with a library/data source only where that is clearly safer;
- use real teaching material for transfer;
- retire the family only when it adds no unique pedagogical value or cannot be made truthful.

`study.py` and any "musical mini-piece" mechanism require especially strong justification because nobody in this process can certify musical quality. Prefer real études unless the generated material is explicitly a constrained drill rather than a claim of good music.

### 6. Levels and curriculum alignment after the concepts/content are stable

Extract RCM, ABRSM and Faber separately, preserve their meanings and provenance, then crosswalk. Never average disagreement into a fake universal level. Reorder curriculum only as an explicit owner decision after the concrete disagreement report.

CL17's larger level-field migration remains separate unless a small content slice actually needs it.

### 7. Modes and credit last

Once the app knows what an item contains and why the task is suitable, test whether the real mode observes the claimed skill. Run the adversarial CT1 cases through the actual record/evidence path. Physical technique, first-sight status, articulation/release, dynamics/pedal and other claims remain limited by the input device and task.

## Review gate after every slice

The reviewer gets:

- exact proposition being fixed;
- old behavior and known learner harm;
- sources/reused assets considered;
- reason for KEEP/NARROW/RETIRE/REPLACE/DEFER;
- independent oracle/counterexamples;
- exact changed files;
- catalogue before/after claim ledger;
- any content gained/lost;
- what remains unknown.

No next content slice starts until that one is reviewed. New discoveries join the relevant future slice; they do not spawn a new project-wide audit.

## Convergence measures

Track these after each accepted slice:

1. unsupported learner-facing/credit-granting claims — down;
2. hand-invented musical mechanisms that the app must trust — down or explicitly justified;
3. curriculum targets with complete trusted teaching/practice/transfer/assessment coverage — up;
4. unresolved musical questions — each eventually sourced, narrowed, manual-only or explicitly unsupported.

Those numbers, not agent confidence or test count, show whether the project is converging.
