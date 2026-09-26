===== PART 8: THE REVIEWER'S VERDICT ON THE C4 CHECKPOINT (2026-09-26) =====

Three messages the same day. The first read the checkpoint and the diary; the second was a
consolidated set of ten requirements; the third, after the reviewer went to the repository
itself (the checkpoint, the diary, Entries 70–73, the plan and backlog rows, the C3/C4
evidence and reading code and `firstThirtyDays`), revised the second and is the one to act
on. What the reviewer verified in the code: C1 stores rich raw observations (per-step
outcomes, timing deltas, conditions, hands, guide, range, tempo provenance); C2's vocabulary
and one detector path with build validation are real; C3's evidence function requires a
declared skill, a measured channel, the conditions, an actual opportunity and sufficient
precision, and says it establishes evidentiary honesty rather than construct validity; C4
selects from stored evidence, one dimension at a time; the diary runs the generated phrase
through the real engine, computes evidence, stores it in a fake IndexedDB and reads it back
the next day. "Stronger work than we could establish from the summary alone."

**The second message, itemised** (superseded in emphasis by the third and fourth, but the
briefs cite its list): 1. no heuristic like "failed passage containing skips = weak at skips";
attribution to the events and opportunities of a demand, ambiguity preserved; 2. the chain
passage demand → opportunity → observations → valid measurement under conditions →
attributable evidence → skill state → adaptation, presence never evidence, whole-phrase failure
never a diagnosis; 3. adaptation of the supported dimension, the skip case as the adversary;
4. the contract, impossible combinations explicit; 5. keys not ordinal; 6. raw observations and
run conditions retained beside cached evidence and the definitions version, recomputable;
7. adversarial construct-validity tests: accurate steps with inaccurate skips; accurate pitch
with poor rhythm; accurate right hand with poor left or coordination; a difficult passage
performed accurately; an easy one performed poorly; a passage containing a demand with no
valid measurable opportunity; a heard, demonstrated or re-read passage performed perfectly; no
input — evidence and next selection change only where justified; 8. the diary rerun with
several profiles (struggling; uneven with one weakness; rapidly improving; already proficient;
inconsistent) looking for oscillation, plateaus, punishment for trying harder, unrelated
changes — retracted in the third message for the other profiles, which come with C5–C7;
9. the cleanup rows kept and phone-sized output checked; 10. T42 independently, the test not
weakened. The stop's five questions: the dimension identified when the observations allow;
uncertainty admitted when they do not; the next exercise manipulates the justified dimension;
the generator fulfils every requested progression; the trajectories look sensible.

**The central finding, confirmed in the code.** The evidence function identifies opportunity
steps per demand but the stored evidence collapses them to `skill, n, right`; C4's reader
sees sight-reading fail twice and runs `stepDown()`, which backs out the most recently added
dimension. So: learner fails skips → sight-reading evidence falls → the last added dimension
was hands → the left hand is removed. L64 corresponds directly to the implementation.

**One change to the proposed solution.** Not "count right notes per demand" literally: one
event can embody several demands at once (a wrong note at a skip, in the left hand, during
eighths, in a key). Recording it as wrong under each would falsely imply the system knows
which demand caused it. The objective: retain demand-local performance evidence without
pretending it establishes a causal diagnosis where demands overlap. Repeated, selective
patterns (skips fail across several phrases while steps under similar conditions succeed) are
much stronger than one wrong note with four properties.

**The direction, verbatim in substance.** The C1–C4 foundation is sound enough to continue
from; L64 and S25 are repaired before C5–C7:

1. Do L64, but do not equate "wrong at a demand opportunity" with "that demand caused the
   error". Preserve performance attributable to each demand and opportunity, and preserve
   ambiguity where demands overlap. The reader adapts confidently when the evidence isolates a
   dimension or establishes a repeated selective pattern; otherwise it avoids claiming a
   diagnosis it cannot support.
2. The skip case is the adversarial regression: after the repair, the constructed learner who
   repeatedly misreads skips receives an adaptation addressing the skip/interval demand rather
   than losing the left hand because hands was the most recently added dimension. Show why the
   evidence justifies the move.
3. Fix S25 as a generator/curriculum contract, not a special case for 2.5: for every reading
   progression the curriculum can request, verify the generator realises the requested next
   demand at that point while holding unrelated dimensions stable; impossible combinations are
   explicit rather than silently different material or a long plateau.
4. Pull L66 in: the observation-definition version and the evidence-definition version are
   independent; the demand-level evidence change is exactly why cached evidence needs its own
   stamp.
5. Keep the evidentiary restraint of Entry 72 and `evidence.ts` ("right and in time under
   these conditions", never "can read intervals") while making the evidence finer-grained.
6. Keep the raw observations as the audit source (C1 does); do not replace them with the new
   demand aggregates.
7. Fix T42 independently: no-input or unjudged performance must not advance the tempo ladder.
8. Keep U50, U51, U52, S24 and L65 in their existing destinations unless the repair requires
   touching them; real findings, but this is a focused foundation repair, not a UX pass.

After L64/L66 and the generator rhythm-contract repair, rerun the same thirty-day adversarial
learner and stop briefly again, showing that: repeated skip-specific failure changes the
relevant reading demand rather than an unrelated dimension; ambiguous mixed-demand failure
does not produce a falsely specific diagnosis; the proficient 2.5 learner no longer plateaus
because the generator cannot supply the taught next rhythm; the evidence and reason wording
still says only what was established. If that holds, continue with C5–C7 as planned,
including the additional learner trajectories already scheduled there (`firstThirtyDays` says
"the other two learners and the other slots come with C5–C7").

**Do not lose the larger master backlog.** C0–C4 validate the learner and evidence
foundation; they do not replace the later generated-content, repertoire and PDMX, lessons,
musical-quality, personalisation, hands-on-piano and device-interaction, score-UX and broader
experience work. The owner: one episode already saw the architectural work become synonymous
with the whole audit. Going forward the reviewer reads the artifacts and the implementation
first, not the narrative summary.

**The fourth message, after a broader sweep of the branch** (plan and backlog, Entries
70–73, the C0 design, measurement and evidence, `readingState`, the session's adaptation,
the generator, the persistence shape, `firstThirtyDays`). Do not restart or redesign C0–C4;
the code enforces the boundaries (measurements from stored observations, evidence needing
channel, conditions and opportunity, reading state derived, C4 consuming it). Make a small
**C4.5 foundation repair** first, not L64 literally plus a patch for S25:

1. L64 with overlap and ambiguity preserved; a specific diagnosis only where the pattern
   discriminates the dimension; otherwise the adaptation and its reason stay nonspecific. The
   skip learner is the main regression. Add an **ambiguity adversary**: errors on events that
   are skips and eighths at once, then contrasting evidence (skips in quarters succeed, steps
   in eighths succeed), to prove the system distinguishes a demand when the observations
   allow it and refuses to pretend when they do not.
2. L66 now: independent observation-definition and evidence-definition stamps; L64 changes
   evidence semantics without changing the observation schema, which is why one stamp cannot
   serve both.
3. S25 as an invariant across the reading curriculum: every adaptive move the curriculum can
   legally request is realisable by the generator, the result contains the requested demand,
   untaught demands are absent, and impossible combinations are explicit — so the plateau
   cannot resurface for 6/8, syncopation, ties, triplets or key signatures.
4. **Demand truth independent of C4's six dimensions.** Hands, range, rhythm, key, metre and
   syncopation are the controls available to today's reader, not the ontology of musical
   difficulty. Evidence attaches to musical demands; the recommendation maps supported demand
   evidence to an available generator intervention; D can later unbundle the generator without
   redesigning the evidence.
5. **C5 must close L8, L9 and S8** rather than add evidence-based requirements beside the old
   completion semantics: a pass must not credit every rung that lists an item; rung completion
   is derived from the evidence its requirements name; generated sight-reading must not inherit
   piece, mastery or calendar semantics. One authoritative path from evidence to rung state.
   "The biggest danger now is prematurely declaring the foundation finished while remnants of
   the old item/pass/mastery model still make decisions alongside it."
6. Keep C3's restraint. 7. Raw observations stay the audit source. 8. One-in-four easy reading
   stays an explicit policy or hypothesis, not a foundational truth. 9. T42 independently.
10. No D musical-quality work now (random-walk phrases, harmony, style, tie and leap faults);
    S25 comes forward only because it blocks the adaptive strand's own progression.

After C4.5, rerun the thirty-day skip learner and the ambiguity case, and stop briefly to
verify: selective skip failure changes a relevant demand, not an unrelated dimension;
overlapping demands produce no unjustifiably specific diagnosis; the proficient 2.5 learner
receives the next taught rhythmic demand; every legal adaptive reading move is generatable
and detector-confirmed; reason text claims only what the evidence establishes; old
item-completion semantics cannot contradict the evidence-derived rung state (the orchestrator
reads this last one as C5's exit criterion, to be reported at the C4.5 stop as not yet, by
design, and confirmed with the reviewer). Then C5–C7, with the trajectories already planned
there. The master backlog stays intact: D, E, F, G, X and H own the rest.

**The fifth message (the sequencing, confirmed).** The verification "old item-completion
semantics cannot contradict evidence-derived rung state" belongs at C5, not C4.5; requiring it
at the C4.5 stop would force part of C5 forward. At the C4.5 stop, report it as not yet
verified by design, with C5 owning it. C4.5 verifies what it owns: demand-local evidence with
ambiguity preserved; selective, discriminating attribution where justified; independent
evidence-definitions versioning; the curriculum–generator contract; demand truth independent
of generator controls; the repaired reader on the skip and mixed-demand adversaries. C5's exit
criterion: L8, L9 and S8 actually closed, one authoritative evidence-to-rung-state path, the
old completion semantics retired rather than left operating in parallel. The decomposition
endorsed: C4a = what the evidence supports; C4b = can the content system produce what
adaptation asks for; C4c = use both to choose what comes next; C5 = retire the old progression
semantics. Proceed. At the C4.5 report the reviewer goes to the files and tests first.
