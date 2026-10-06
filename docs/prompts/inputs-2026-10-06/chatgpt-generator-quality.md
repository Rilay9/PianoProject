# ChatGPT, 2026-10-06: generated content must be musically good (verbatim, reference only)

> Kept word for word. `docs/prompts/FABLE.md` §5 governs. The owner overrides the human-audition requirement below ("I also don't want human judgement"); FABLE.md §5 replaces it with real-music reference measures and states the claim the project may make.

---

No — my previous Claude message still did not fully capture what the packet requires about generated content being good. It captured “correct, controlled, useful, and pedagogically sequenced.” The packet asks for an additional axis: musical quality.

The packet is explicit in several places:

A controlled generated exercise should isolate a narrow skill with exact allowed demands; musical richness can be secondary there.

A generated musical mini-piece must have phrase/harmony/musical coherence and needs musical-quality review beyond mechanical validity.

Progressive sight-reading is called the highest-value generator-quality experiment; it should use source-backed progression constraints and generate short musical phrases, not merely valid random notes.

Named style drills use sourced definition → explicit family contract → independent structural checker.

Musical mini-pieces are explicitly the highest-risk generator job. The packet’s preference order is real excerpt → simplified/authored arrangement → curated phrase/harmony/accompaniment templates → freer generation only if those fail. And crucially: any generator family that promises “music” needs human musical audition/curation.

The current generator addendum only says a generated mini-piece needs a human notation review. That is weaker. You can visually inspect perfectly valid notation and still miss that it sounds stupid.

So I would add the following to the message you give Claude. This is not optional polish; this is needed to actually implement the packet.

Important correction to the previous orchestration instruction:

The restart packet has TWO separate requirements that we have been conflating:

1. generated content must be structurally/pedagogically correct, and
2. generated content that claims to be music must actually be musically good.

A structural checker does not satisfy #2.

"GENERATOR-ADDENDUM.md" currently says a generated mini-piece needs a human notation review. That is insufficient relative to the restart packet, which explicitly requires musical-quality review beyond mechanical validity and says any generator family that promises “music” needs human musical audition/curation.

Correct the plan accordingly.

## A. Classify every curriculum-used generated family by job

Do this from the CURRENT tree, reusing the generator inventory already made. Do not create a new inventory system.

For every generated family/drill actually consumed or proposed by the approved curriculum, classify it:

A — canonical technical drill

Examples:
- scales;
- arpeggios;
- chord/inversion construction;
- isolated rhythm cell;
- exact accompaniment cell.

Quality objective:
clear, correct, readable, physically sensible, maximally useful isolation.

It does NOT need to pretend to be a piece of music.

B — progressive sight-reading

Quality objective:
unseen but genuinely phrase-like music at the intended reading level.

The packet calls this the highest-value generator-quality experiment.

C — named style/pattern drill

Examples:
- habanera;
- tresillo;
- bossa;
- guajeo;
- stride;
- boogie;
- walking bass;
- waltz/oom-pah;
- Alberti;
- broken-chord accompaniment.

Quality objective:
faithful controlled acquisition of a sourced musical pattern.

D — generated musical mini-piece

Quality objective:
an actual small musical experience: coherent phrase, harmony, texture and form under the allowed demands.

This is the highest-risk generator job.

Record which current curriculum consumers use A/B/C/D.

Do NOT redesign families merely because they exist.

## B. Use four separate quality gates

Every generated family used by the curriculum must pass the gates appropriate to its job.

### Gate 1 — pedagogical contract

Does the item isolate the intended learning demand?

Record:
- required demand;
- allowed demands;
- forbidden/untaught demands;
- range;
- metre;
- rhythm;
- hand configuration;
- length;
- key;
- expected repetitions;
- intended learner level.

A generated item that is musically pleasant but teaches the wrong thing fails.

### Gate 2 — structural correctness

Use independent structural checking where appropriate.

Examples:
- correct pitches/spelling;
- durations;
- onset pattern;
- metre;
- key;
- chord roles;
- hand/staff;
- range;
- family-specific contract;
- near-miss fixtures.

Partitura/music21/etc. establish events, not musical quality.

A green checker means:
the generator produced what its contract says.

It does NOT mean:
the result is good music.

### Gate 3 — notation/playability quality

Inspect actual rendered outputs, not only parser events.

Check:
- readable notation;
- sensible beaming;
- sensible enharmonic spelling;
- no gratuitous ledger/register jumps;
- no ugly accidental churn caused by implementation;
- playable hand distribution;
- no collisions/voice artefacts;
- fingering only where defensible;
- no awkward page/measure artifacts;
- phrase boundaries represented sensibly;
- difficulty matches the intended learner.

This is visual/editorial review.

Still not musical approval.

### Gate 4 — musical quality

Required whenever an output claims to be:
- a sight-reading phrase;
- a musical mini-piece;
- a stylistically musical generated example rather than a bare cell;
- any generated item whose value depends on sounding coherent rather than merely being mechanically correct.

This requires actual audition/curation, as the restart packet says.

The project must stop saying “nobody in this process hears music” as a blanket excuse for generated content that claims to be music.

Where musical quality matters, produce something a human can actually listen to.

The reviewer may still inspect notation and structure independently, but musical acceptance must include a real listening decision.

## C. Sight-reading gets its own quality project — but bounded to the actual generator

The packet specifically calls progressive sight-reading the highest-value generator-quality experiment.

Do not treat current sight-reading as good because:
- it stays inside difficulty limits;
- every measure is legal;
- demand detectors pass;
- the learner has never seen it.

Those establish controlled/unseen material, not musicality.

For each current sight-reading level, verify the source-backed progression dimensions:
- keys;
- metre;
- rhythm;
- note range;
- hand configuration;
- position changes;
- articulation;
- accidentals;
- density;
- polyphony/texture;
- length.

Then separately review whether the outputs are short musical phrases rather than valid random notes.

### Sight-reading musical-quality criteria

A useful generated phrase should normally have, appropriate to level:
- perceivable beginning, continuation and ending;
- rhythmic idea with some internal relationship rather than every event independently sampled;
- melodic direction/contour rather than random walk noise;
- some repetition, sequence, response or variation where level permits;
- harmony or implied harmony that makes the melody feel situated;
- phrase-ending behavior appropriate to its tiny scope;
- accompaniment behavior that supports rather than fights the melody;
- sensible register;
- manageable hand movement;
- no gratuitous difficulty irrelevant to the level;
- variety across seeds without destroying coherence.

These are musical-review criteria, NOT hard-code-every-rule requirements.

Do not turn this list into another universal music classifier.

### Review procedure for sight-reading

For every level:
1. generate a fixed review corpus across multiple seeds;
2. include ordinary random seeds and adversarial/boundary seeds;
3. structural checks first;
4. render every retained sample;
5. a human reviews notation;
6. a human auditions a sufficiently broad sample;
7. mark each:
   - GOOD;
   - ACCEPTABLE CONTROL BUT NOT MUSICAL;
   - BAD / REGENERATE;
8. record why;
9. look for recurring generator causes, not one-off cosmetic tweaks;
10. fix generator behavior only when the failure pattern is real;
11. regenerate the same seed corpus and compare before/after.

Do not tune on one favorite seed.

Do not claim the whole level is good from five examples.

Choose an explicit denominator before reviewing.

If quality varies badly by seed, that is a generator defect even if average demand compliance is perfect.

## D. Progressive sight-reading should use musical construction where needed

The packet says “generate short musical phrases, not merely valid random notes.”

Therefore inspect HOW the current sight-reading generator creates material.

If it is mostly selecting locally legal events independently, determine whether that is why phrases feel arbitrary.

Prefer the smallest musical construction that solves observed failures, such as:
- short rhythmic motives;
- melodic motives;
- controlled repetition/variation;
- antecedent/consequent-like short relationships where appropriate;
- phrase templates;
- cadence/end templates;
- accompaniment templates;
- harmonic skeleton first, notes second;
- contour constraints;
- tension/release appropriate to level.

Do not build a general composition AI.

Do not add these mechanisms speculatively.

Add only what the review corpus demonstrates is needed to make the generated reading material musically coherent.

## E. Generated mini-pieces require a much stricter rule

The restart packet's order is:
1. real public-domain excerpt;
2. simplified/authored arrangement of a public-domain tune;
3. curated phrase/harmony/accompaniment templates;
4. freer generated mini-piece only when the first three cannot serve.

Use that order.

Before authorizing a generated mini-piece, record why 1–3 cannot do the curriculum job better.

A generated mini-piece is not preferred merely because it is easy to parameterize.

### Mini-piece acceptance must include

Structure
- coherent phrase grouping;
- plausible beginning/end;
- repetition and contrast;
- harmonic direction;
- cadential or closing behavior;
- coherent accompaniment texture;
- no arbitrary texture switching.

Voice leading / texture
- sensible bass motion;
- sensible spacing;
- no accidental parallel/random voice motion caused by the generator unless stylistically intended;
- melody/accompaniment separation where that is the design;
- playable register and hand distribution.

Musical identity

The result should have something the learner can:
- anticipate;
- remember;
- phrase;
- recognize when it returns.

If every bar is unrelated, it is not a successful mini-piece.

Pedagogical integrity

The musical-quality mechanisms must not secretly introduce untaught demands.

Human audition

Required.

Not “parser says valid.”
Not “notation looks fine.”
Actually listened to and accepted.

## F. Named-style generated material has two acceptance axes

For G13/G14/G15 and future named-style families:

### Axis 1 — stylistic/structural fidelity

Use:
published definition → explicit contract → independent checker → sibling near-miss

This is already largely correct.

### Axis 2 — musical realization

Even when the structural mask is correct, ask:
- Does the voicing make sense?
- Does the harmony support the pattern?
- Does it sit naturally under the hands?
- Does repetition feel like a useful groove rather than a broken loop?
- Does changing chord/key preserve the musical identity?
- Does the transition between chords make sense?
- Is the result something a pianist could reasonably internalize and reuse?

For a bare isolated rhythmic cell, structural fidelity may be enough.

For a pattern presented as accompaniment/groove/music, human musical review is required.

Do not let “the onset checker passed” certify “this is good bossa” or “this is a good guajeo.”

## G. Generated technical drills should not be over-musicalized

Do not make every scale/arpeggio/fingering/rhythm exercise into a cute song.

The packet explicitly distinguishes controlled generated exercise from generated musical mini-piece.

For a technical CONTROL item, success can simply mean:
- exact target;
- no irrelevant demands;
- clear notation;
- appropriate repetition;
- sensible register/fingering;
- variation that supports learning.

Precision is more important than musical richness there.

This protects the generator project from turning into a composition project.

## H. Human review needs an actual lightweight workflow

We do not need an elaborate approval platform.

For every generator family that promises music:
1. generate a bounded fixed corpus;
2. render the notation;
3. render/play back audio or MIDI in the normal app path;
4. save enough information to reproduce the seed;
5. have a human audition the sample;
6. record simple findings:
   - seed;
   - level/family;
   - GOOD / ACCEPTABLE / BAD;
   - one-line reason;
7. fix repeated causes;
8. rerun the same corpus.

The owner can be one of the human listeners.

ChatGPT can independently inspect exported MusicXML/notation and structural evidence.

Do not claim ChatGPT's symbolic review substitutes for the packet's human musical audition.

If useful, send ChatGPT the XML and the human listening notes so the reviewer can distinguish:
- structural problem;
- notation problem;
- musical-quality problem;
- subjective preference.

## I. Build a quality corpus, not a universal quality detector

Do NOT respond to this requirement by inventing:
- a “musicality score”;
- a universal phrase detector;
- an ML aesthetic classifier;
- a generic all-family quality framework.

The packet explicitly warns against making libraries/detectors pedagogy oracles.

Use automated checks to reject objective structural faults.

Use review corpora and human judgment for musical quality.

Automate only recurring objective failures discovered by the corpus.

## J. Add generator quality to the Opus reconciliation

The bounded Opus pass requested previously must now also find:

J. generated material used as MUSIC/MODEL where a real excerpt or curated template should be preferred;
K. sight-reading levels that are constraint-correct but not demonstrably phrase-like;
L. generated families claiming musical/style quality with no actual human audition;
M. mini-piece-like output with only structural/parser approval;
N. families where seed variation can produce materially different quality but only one/few seeds were reviewed;
O. generator controls that introduce unrelated difficulty;
P. generator outputs whose accompaniment/harmony/voice leading undermines the skill being taught;
Q. places where a generated CONTROL should remain deliberately mechanical rather than being judged as music.

For each:
"ability/family | consumer | generated job A/B/C/D | existing evidence | missing quality evidence | smallest correction"

No new infrastructure proposal unless an observed failure requires it.

## K. Change the build brief template for generator-consuming seams

Whenever a seam creates, changes or newly relies on generated content, the brief must state:

Generator job
A / B / C / D.

Pedagogical contract
What is isolated; allowed/forbidden demands.

Structural contract
What an automated checker can prove.

Musical-quality requirement
- none beyond clarity for canonical technical drill;
- phrase quality for sight-reading;
- groove/realization quality for named style;
- full musical-quality review for mini-piece.

Review corpus
Seeds/cases and denominator.

Human review
Who/what was actually auditioned.

Transfer
Where generated CONTROL ends and real/realistic music begins.

Regression
What fixed seeds prove the quality fix did not destroy the pedagogical contract.

A generated family is not approved merely because its unit tests pass.

## L. Amend the definition of curriculum remediation complete

Add:

13. Every generated item used for CONTROL is structurally correct and isolates the intended demand.
14. Every generated sight-reading family used by the curriculum has been shown, on an explicit review corpus, to produce short musically coherent phrases rather than merely legal note sequences.
15. Every named-style generator has a sourced structural contract and reviewed musical realization appropriate to its claimed role.
16. Every generated mini-piece has passed actual human musical audition/curation, not merely notation or parser checks.
17. Generated content is replaced by real excerpts/authored/template material wherever those do the musical job better.

Do not call generator quality complete from green structural tests alone.

So the correction is significant:

The generator checker answers “is this the thing we specified?”
The pedagogy review answers “is it useful for learning?”
The musical-quality review answers “is this actually decent music?”

We had the first two increasingly well covered. We had not made the third one operational enough.

The biggest concrete place this matters is sight-reading. The packet does not merely want increasing difficulty settings. It explicitly wants the generator to produce musical phrases. That means I would have Opus inspect the current sight-reading construction and produce a fixed review corpus, and I would want actual listening to a representative set before we call that generator-quality work complete.

And for generated mini-pieces, the packet is even stricter: prefer real/authored/template material, and if we genuinely need free generation, somebody must actually listen to it. That requirement should survive all the way into Claude’s build/acceptance process.
