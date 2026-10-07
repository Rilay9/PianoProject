# Holistic re-review of the remaining work — 2026-10-01

Basis: working branch after the holistic-reassessment correction (`24db2726` when this pass began), `docs/prompts/tasks/README.md`, `docs/prompts/convergence-2026-09-30.md`, `docs/review/path-forward-2026-09-30-addendum.md`, the later task records through Entry 206, and the current reviewer handoff surface. This is a cluster/task-shape review, not a claim that every historical backlog row was independently re-audited against code in this pass.

## Judgement

The remaining roadmap contains real, high-value work, but the 2026-09-30 convergence map is **no longer safe to use as a literal dispatch queue**. It mixes current problems with work already closed by later entries, decisions superseded by later owner/reviewer rulings, and several clusters whose framing preserves an implementation/product decomposition that now needs to be challenged before more code is written.

Do not dispatch a new substantial cluster merely because the September 30 map says BUILD NOW / next. Reconcile the surviving problem against the current tree and the holistic-reassessment doctrine first. This is not a freeze: already-landed/read-back work, narrow correctness fixes with a still-valid mechanism, accessibility defects, and evidence that materially changes a current decision may proceed.

The strongest process correction is that **whole-experience judgement cannot be deferred until final H2**. Final H2 remains the release acceptance walk, but representative end-to-end interaction/screen checks must happen during development whenever a cluster materially changes a learner-facing experience. Reserving the holistic walk until the end is one reason locally correct Score-bar work was able to optimize the wrong product shape for so long.

## Immediate cleanup before the next major dispatch

1. **Refresh the convergence map from the current tree.** The generated task record already shows CL01, CL04, CL05/CL05a/CL05b, CL15, CL23, E54/SG01 and U66/SG02 closed, among many others, while `current.md` / the September 30 forward prose still name some of them as future seams. The next scheduler must be derived from current surviving truths, not those old queue positions.
2. **Remove superseded owner decisions from the queue.** In particular, I3's fixed familiar/exploratory ratio was superseded by the adaptive objective in the path-forward addendum, and I5's personal-vs-strict question was superseded by personal-first with strict/public as a focused delta. Neither should remain an owner blocker.
3. **U122 stays stopped under the correction already written.** It resumes only as a whole landscape Score-chrome design, not a smarter bottom-bar allocator.
4. **Treat this document and `holistic-reassessment.md` as a premise review, not another checklist.** The point is to change direction when the accumulated product evidence says to, not to generate a new ceremony.

## Remaining clusters — disposition after stepping back

### Score / reading surface: combine the product decision before splitting implementation

**U122 + CL07 (responsive reading): REFRAME TOGETHER AT THE DESIGN BOUNDARY.**

U122 decides where landscape navigation/context/status/controls belong. CL07 decides how much room the notation gets, what readable staff size/look-ahead means, and when another row of music earns space. Those are not independent product decisions: moving chrome changes stage height, and changing the reading objective changes how expensive chrome is. Do not choose a top/bottom chrome decomposition and a staff-size/look-ahead threshold in separate conceptual tunnels. Measure candidate whole-screen layouts against notation readability, look-ahead, control reachability and stability together. Once that product model is accepted, implementation can still be split into reviewable seams.

**CL09 (Score-screen truth): WAIT ON THE WHOLE-SCREEN MODEL where the row is surface-dependent.** Sentence/evidence truth that is independent of placement remains real, but corner/status/help wording must not be patched around the current chrome immediately before U122 changes that chrome. Consume the accepted Score-screen structure instead of preserving obsolete surfaces.

**SG12 / U23 (viewport plan as a pure function): PARK unless the accepted Score model actually needs it.** A pure-function refactor is not a learner outcome. Do not build an abstraction merely because it would make the old viewport mechanism neater or easier to test.

### Core learning truth: keep, but solve the truth rather than its bookkeeping

**CL11 (what counts as evidence): KEEP, HIGH VALUE.** This is genuine core architecture. Before implementing its individual decisions, state one evidence contract that distinguishes observation, measured channel, pass/standard, competence, transfer and self-report, then test each surviving row against it. Do not create eight locally compatible exceptions. This cluster should simplify downstream semantics.

**CL10 (detectors and validator): KEEP, WITH AN ANTI-PROXY CONDITION.** Detector/validator work is valuable only where it establishes a musical/material fact the product actually consumes. `DEFERRED_CONCEPT_CLAIMS` becoming empty, row counts, or validator cleanliness are not outcomes by themselves. Unsupported claims may be removed or left explicitly unknown rather than inventing detector machinery to make a table green.

**CL08 (reading strand): RE-CHECK THE SURVIVING LEARNER FAILURES FIRST.** Oscillation, re-introducing an already-shown demand, calling yesterday's material unseen, or asking for untaught demands are real learner problems. Keep fixes for those if they still reproduce on the current C4/C5/L120 tree. Do not preserve “move one authored control at a time” as the goal simply because the current reader is expressed that way; the product goal is selecting an appropriate next reading experience from current skill/demand evidence.

**CL17 (one level / one analysis): KEEP THE ANALYSIS, REJECT A CANONICAL SCALAR AS THE PRODUCT TRUTH.** The right convergence target is one authoritative multidimensional analysis/provenance object. A scalar level may remain as a derived UI/search projection when useful, with its derivation and uncertainty stated. Do not spend a lane choosing which historical scalar field becomes The Level if the learner/chooser actually needs reading, rhythm, range, texture, physical and other dimensions.

### Session / teaching orchestration: highest risk of building an elaborate teaching operating system before proving the experience

**CL12 (purposes and episodes): REDESIGN BEFORE BUILD.** The useful product truths are simple: every Today item has an honest reason; an unplayed offer can yield; a detour can return to the thing it was helping, with a reason and a stopping condition. A persistent “episode” object and a five-value purpose ontology must earn their existence from those behaviours. Start from the learner flow and introduce persistent machinery only when the flow cannot be represented honestly without it. Do not make the taxonomy the product.

**CL14 (learner direction and return): REDESIGN BEFORE BUILD.** This currently combines goals, interests, calibration after absence, a Plan map, branching/core tracks and composer weighting. Those are several product questions, not one implementation cluster. First decide the learner-facing contract: what the learner explicitly tells the app, what the app infers from evidence, what changes today's plan, and what happens after a long absence. Avoid a general goal/trajectory framework until a smaller representation fails a real case. The old fixed familiarity/exploration ratio is already superseded and must not re-enter this design under another name.

**SG04 / L93: MERGE ITS PRODUCT QUESTION INTO THE SESSION/PLAN REDESIGN.** “What strands Today composes” and how Plan describes them are part of the same learner mental model as CL12/CL14; do not polish header/Plan taxonomy independently and later make the composer fit it.

**SG03 / G90: KEEP AS A NARROW CORRECTNESS SEAM** if it still reproduces: a piece paused after the session is composed should not later be silently offered as if nothing changed. It has a clear learner consequence and does not require a new framework.

### Content, lessons and supply: choose for learner need, not coverage arithmetic

**CL18 (repertoire supply): KEEP, BUT MAKE THE CHOOSER / LEARNER NEED THE DRIVER.** Do not treat “thin rung” or “unbuilt cell” as an obligation to fill a catalogue slot. For a real learner need, choose among generated material, repertoire/PDMX, excerpt, import and external recommendation; validate the candidate; and if nothing is honestly suitable, expose the gap rather than manufacturing fit. Public-domain acquisition is supply, not curriculum truth.

**CL19 (lesson contract): NARROW BEFORE BUILD.** A schema and 109-lesson gate apparatus can become a bureaucracy that proves prose conforms to itself. Preserve the real contract—lessons teach musical ideas briefly, in a sensible order, and do not teach the app—but add schema fields only where runtime/validation genuinely consumes them. Use the existing lesson-coverage record to target high-risk or currently failing lessons first; do not rewrite every lesson merely to make a universal schema complete.

**CL20 (breadth and musicianship): DEFER BROAD IMPLEMENTATION; REDESIGN FROM ADAPTIVE PURPOSE.** The addendum already rejects a fixed familiarity/exploration percentage. The same caution applies to exposure-balance quotas and strand completeness. Breadth, improvisation, accompaniment, ensemble and theory should respond to learner purpose/evidence and available honest material. First establish a few coherent learner journeys; do not encode a grand musicianship allocation model from audit rows alone.

**CL16 (sight-reading v3): REQUIRE A CURRENT LEARNER PROBLEM BEFORE VERSION 3.** “Version 3” is not a product outcome. Keep explicit, observable requirements such as register, ledger-line bounds, duplicate bounds or phrase length when current material demonstrably violates them. Claims such as musical “shape” or a satisfying arrival remain unverified as music unless supported by notation/source evidence; do not turn a distribution test into a proxy for musical quality.

**CL02 (rock/Latin unwinding): KEEP SOURCE/NOTATION CORRECTIONS; DO NOT CLAIM IDIOM FROM MECHANICAL TESTS.** Removing unsourced printed fingering and fixing physically/notation-wrong material is valid. “Sounds like the idiom” cannot become true because a family contract passes. Where no actor can hear it, keep the musical judgement explicitly unresolved or rely on source-backed notation rather than inventing a detector that stands in for style.

**CL13 (rung/item reads): USE TARGETED READS, NOT AN AUDIT COMPLETION RITUAL.** Perform the smallest notation/second-reader read that can change a placement, teaching-use or source decision. Do not complete large item-by-item tables simply because the cluster exists. Heard-basis claims remain unverified in this process.

### Interaction / UI outside the Score surface

**CL22 (UI surfaces and words): KEEP, BUT REVIEW COMPLETE SCREENS/WORKFLOWS RATHER THAN PATCHING STRINGS IN ISOLATION.** Batch related findings by the learner task and judge the 342 px screen as a whole. A string fix that creates another density/navigation problem is not convergence. Surface-specific work should wait for any upstream product model it describes.

**SG06 / U62 (contrast): KEEP / DO.** This protects accessibility and has a concrete acceptance condition; it does not need a redesign framework.

**SG10 / T20 (internal id briefly in lesson heading): KEEP / DO if still reproducible.** It is a bounded learner-visible defect.

**SG05 / E8 (last-backup visibility): KEEP AS LOW PRIORITY.** Useful, small, no reason to block teaching work.

**SG08 / U64 (Skills list order): FOLD INTO A WHOLE SKILLS-SCREEN REVIEW**, not another one-row sorting rule. The question is what the learner needs to understand about measured, introduced and unmeasured abilities on that screen.

**SG11 / T23 (Free Play prompts): DEFER until Free Play's whole experience says prompts are missing.** Optional prompt machinery should answer a demonstrated learner need, not a backlog desire for more guidance.

### Process/tooling/testing

**CL06 (outcome tests): KEEP THE IMPORTANT MUTANT-PROVING TESTS, BUT MOST BELONG WITH H1.** A test that currently lets a wrong answer key or stretched score pass green is valuable; fix it when it materially affects confidence. Do not let test-hardening become a primary product lane while learner-facing architecture is unsettled.

**CL24 (H1): KEEP as the final suite-trust pass.** Continue to fix test/harness defects earlier when they block trustworthy development, but save broad reclassification and loaded-suite hardening for the point where product behaviour is materially stable.

**T63 / generated review queue: KEEP SMALL AND MECHANICAL.** Removing hand-maintained scheduler drift is useful process hygiene, but it must not consume a primary product slot. Use explicit response-required metadata; do not infer workflow state from prose.

**SG07 / E1 (one resolved run config): PARK / NO BUILD without a live defect.** The map itself says no live defect is known. Do not refactor merely because a cleaner abstraction could exist.

**SG09 / E46 (seed-finder lesson-site wiring): PARK unless a current learner/editor workflow needs it.** Tool availability is not a product requirement by itself.

### Storage / long-horizon decisions left behind by closed CL23

**L51 / L99: DO NOT INVENT A SECOND COMPACTION/RETENTION POLICY UNTIL REAL STORAGE PRESSURE REQUIRES IT.** CL23 already removed the arbitrary performance reach and folded only evidence proven outside the protected reader window. Its review explicitly refuted the practical byte-budget argument for more semantic folding. A new byte cap, retention tier or witness scheme is a product/storage-policy choice; without measured pressure that affects the learner, park it rather than pre-optimising long-horizon storage.

**E39 (retain original MIDI bytes on imports): DEFER until the concrete repair/reconversion value beats the storage/backup cost.** The fact that a future converter might improve is not by itself enough to duplicate every imported MIDI forever. Decide from an actual migration/reconversion need and measured size/backup consequences.

## H2 must be both rolling and final

Keep **final H2 / CL25** as release acceptance on the personal build plus the focused strict/public delta. But add a non-bureaucratic rolling practice:

- whenever a substantial learner-facing cluster changes a whole screen or flow, inspect a representative end-to-end path as the learner meets it before declaring the local mechanism settled;
- for UI, inspect the complete screen at the important phone/landscape states, not only the element the lane touched;
- for session/progression work, follow a representative learner through Today -> activity -> evidence -> next recommendation/Plan;
- for content selection, follow the need through chooser -> candidate source -> validation -> presentation -> evidence;
- use the smallest representative walk that could reveal a wrong product shape; do not turn this into a fixed cadence or a duplicated final H2.

This is the recurring holistic feedback loop that was missing from the Score-bar chain.

## Suggested next order after this re-review

1. **Finish the T62 working-branch CI read-back**; it is already landed and is evidence, not a new design seam.
2. **Complete the corrected U122 design together with CL07's whole-screen reading objective.** CL09 surface-dependent work waits for that model.
3. **Refresh the convergence map/current scheduler from the current tree**, removing closed lanes and superseded decisions before any new large dispatch.
4. **Run one representative whole-product interaction walk** over the current personal build focused on Today -> Score -> pause/background/return -> completion -> evidence/Plan. Use findings to validate the next priorities, not to generate a cosmetic backlog.
5. Among surviving core architecture, prefer **CL11 evidence truth**, **CL10 detector/claim truth**, and concrete surviving **CL08 reading-choice failures** over broad new product frameworks.
6. Do not dispatch CL12, CL14, CL19, CL20 or CL21 in their September-30 shapes. Redesign/narrow them from the learner experience first.
7. Keep H1 broad hardening and final H2 release acceptance at the end, while using the rolling whole-experience checks above during development.

## Stop condition for this memo

This memo is not a new permanent master plan. Its job is to prevent the September 30 plan from becoming another sacred premise. Once the current-tree reconciliation is written and the next few clusters are re-derived from actual learner/product needs, this document becomes provenance. If later evidence shows one of these dispositions is wrong, change it rather than defending it because it is written here.
