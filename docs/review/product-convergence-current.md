# Current product-convergence scheduler

Authoritative from 2026-10-03. This replaces the earlier Score-first ordering.

The governing boundary is `docs/prompts/charter.md` plus `docs/prompts/runs/disposition.md`. The old content queue, CT1/CL10a direction, September-30 convergence statuses and historical audit rows are evidence only. They do not dispatch work.

The project is now in **product finish, content first**. The purpose is not to perfect an ontology or every detector. The purpose is to make sure the learner is taught with good, truthful, appropriately chosen material.

## Active blocker cap

There is no obligation to fill ten slots. Keep the active list as small as the learner product permits. A new item enters only if it changes what the learner is taught, offered, credited, told or able to do; corrupts saved state; blocks trustworthy release verification; or lets PianoProject stop owning a responsibility it should delegate/curate.

At every substantial step, re-run the charter/reuse gate before implementation:

1. Should PianoProject own this responsibility at all?
2. Is the fact defined by a standard or published source?
3. Is there maintained library/data/reference implementation that already supplies it?
4. What are that tool/source's known issues for this exact use?
5. Can an independent mechanism verify the result?
6. What custom code or future work would adoption delete?
7. If it deletes nothing, why not keep the current mechanism?
8. Is this objective/mechanical, or a musical/pedagogical judgement that must be curated or left unknown?

A library does not earn adoption merely by existing. Reuse must reduce responsibility or materially improve independent verification.

### Blocker 1 — content quality and trusted teaching material

This is the active frontier.

Do not restart CT1, CQ2+, a detector audit, a corpus sweep or a 109-rung bureaucracy. Instead, finish the actual teaching-content pipeline in three bounded paths and fix concrete defects encountered there.

#### 1A. Controlled generated practice

Take representative current learner needs that actually use generated material and follow the complete path:

`learner need → exercise family/contract → generation → independent musical/structural verification → presentation → measured outcome`.

For each selected family, first ask whether existing standards/libraries can replace or independently verify parts of the custom mechanism. Reuse the existing CT1 reuse census rather than starting another census. Current candidate tools include music21 for standard symbolic facts, Hypothesis/property-based generation for adversarial/round-trip checks, and a constraint solver such as OR-Tools only where it actually deletes bespoke combinatorial search. Do not introduce any of them unless the exact family demonstrates the simplification/parity win.

A generator never certifies itself. The acceptable authority shape remains:

`sourced definition → generator contract → independent checker`.

Mechanical checks may establish notation, range, rhythm, intervals, playability constraints and the named structural property. They do not establish musical beauty or pedagogical quality. Where musical quality matters, compare against real teaching material or curate it explicitly rather than inventing a quality classifier.

**Finish condition for 1A:** representative generated exercises are structurally correct, independently checkable, playable, and suitable for the stated controlled purpose without relying on a broad fuzzy detector for authority. Any generator family not exercised by a current learner need does not become work merely because an old audit mentions it.

#### 1B. Real music and repertoire transfer

Take representative learner needs that should transfer into real music and follow:

`learner need → source search → candidate piece/passage → actual score inspection → exact passage-level teaching-use record → presentation in the app`.

Research first. Use reputable published curricula/methods (for example ABRSM/RCM/Faber) as provenance-preserving evidence inputs, not as an automatic crosswalk. Use the project's existing corpus/repertoire sources as candidate pools. Metadata may nominate candidates but never approve them.

Where useful, evaluate established symbolic-analysis/search tools for candidate retrieval or independent verification, but keep fuzzy feature extraction advisory only. A real excerpt is admitted because the exact score/passages were inspected and curated for the teaching use, not because a classifier or title/genre tag said so.

External recommendations are valid content when the best pedagogical material is not bundled/renderable. They do not have to be forced into the measurable-score pipeline.

**Finish condition for 1B:** at least the representative transfer needs used in the learner journey have strong real-music material with provenance and exact passage/piece purpose, and there is a repeatable source-selection method that does not require a universal score-understanding detector.

#### 1C. Learner-facing lesson/content truth

Use the existing lesson-audit findings as evidence, not as a checkbox queue.

Prioritize only statements the learner currently reaches in the representative curriculum/content paths:

- objectively false theory/history statements → correct from authoritative sources;
- standard/mechanical facts → delegate/verify through source/library where useful;
- unverified assertions → source them, weaken them, or remove them if the product does not need the claim;
- musical/pedagogical JUDGEMENT → curate explicitly or leave unknown; AI does not silently decide it.

Do not schedule the old 87-box lesson audit as one batch. A bounded source-backed cleanup of objective learner-facing errors is encouraged when it is cheap and directly improves material the learner will encounter.

**Finish condition for 1C:** the representative learner path contains no known false or unsupported authoritative teaching statement, and unresolved judgements are honestly curated/unknown rather than AI-inferred.

### Blocker 2 — representative learner journey with the improved content

After Blocker 1 is materially sound, run one deliberately small whole-product journey from the current tree:

1. Today explains what to do and why;
2. the selected material is the right source for the need: generated controlled drill, verified real excerpt, full repertoire, or external recommendation;
3. the learner can start the activity without hunting;
4. Score/practice is usable enough to perform the content;
5. the summary says only what was actually measured and gives a sensible next action;
6. Today/Plan/Progress agree about what happened;
7. one real-repertoire transfer path works end to end;
8. Simon, Lab/Jam and Free Play communicate their distinct purpose without granting evidence they did not observe.

This is not another audit matrix. Use representative cases only. If a concrete learner-visible failure appears, it may become an active blocker and must displace lower-value work rather than spawn a new wave.

### Blocker 3 — Score finish only where it still blocks the teaching loop

The broad three-device Score redesign has already consumed substantial work. Do not resume a sophisticated Score/UX programme merely because historical rows remain.

Park U122d/U35/U9 and other Score follow-ups unless one of them currently prevents the representative content journey from being readable, playable, truthful or stable. If a P0/P1 Score defect reproduces during Blocker 2, fix that narrow causal defect under the charter. Do not create a new viewport architecture, density classifier, control framework or broad Score audit.

A final physical-device check may still cover arm's-length readability, actual Android background/audio behaviour and physical MIDI reconnect, but this does not justify more cloud-side UI architecture beforehand.

### Blocker 4 — release hardening

Run existing H1/H2 release checks after content and the representative journey are materially stable. Fix test/load/flakiness issues only where they prevent trustworthy product verification. Do not turn suite cleanup into a product programme.

## Explicitly parked/deleted now

- CL12a remains parked; do not port its purpose ontology merely to preserve it.
- CQ1 is closed; CQ2+ universal named-figure detector work stays deleted.
- CL10a is stopped.
- CL17's broad migration remains frozen.
- No detector-perfection campaign.
- No universal accompaniment detector project.
- No mass corpus semantic labelling.
- No automatic ABRSM/RCM/Faber crosswalk.
- No mass generator rewrite.
- No replace-everything-with-music21/Tonal/partitura migration.
- No lesson-audit checkbox marathon.
- No broad Score redesign unless the representative teaching journey proves a live blocker.

## What does not become a blocker by itself

The following are not dispatch reasons without a current learner consequence:

- an old backlog row saying `pending`;
- a drafted brief;
- a validator/report table not consumed by the learner;
- a cleaner abstraction;
- an unaudited hypothesis;
- a corpus cell that is thin;
- a detector that could be more accurate but has no authoritative learner-facing consumer;
- a library/source that could replace code without demonstrated parity, independent-verification value or net simplification.

## Dispatch rule

Before any substantial implementation, state in ordinary product language:

1. what the learner currently needs or experiences that is wrong/unfinished;
2. the evidence/source establishing that need or defect;
3. the reuse/ownership answer for this exact step;
4. the smallest change that improves the teaching material without creating new authority or architecture;
5. the observable finish condition.

If these cannot be written from current evidence, do not dispatch.

## End state

The project is finished when the learner receives trustworthy, useful material chosen for a real need; generated drills are independently verifiable; real music is curated at the passage/piece level with provenance; lesson statements are truthful; the representative teaching journey is coherent; the practice surface is usable enough to deliver that material; release verification is trustworthy; and no known active blocker changes what the learner is taught, offered, credited, told or able to do.

Do not search for another programme of work after that. Ship the product and let real use generate the next evidence.
