# ChatGPT, 2026-10-06: compact correction after the owner's pushback (verbatim summary, reference only)

> Folded into `docs/prompts/FABLE.md` §3 (brief headings, generated-content block, brief lint), §4 (choose the source by the learner job) and §5 (musical contract; UNKNOWN; no human gate). It withdraws the human-audition and real-music-first lines of `chatgpt-generator-quality.md` and `chatgpt-packet-compliance.md`.

The reviewer's own account of its two errors:
1. It overread "quality review" as "human judgment". The owner's direction is that subjective human approval is not the quality gate. Use objective musical structure, independent verification, libraries, adversarial tests and explicit contracts. Where something cannot be established objectively, mark that boundary rather than inventing a human oracle.
2. It overcorrected toward real music. Generated material has legitimate packet jobs: controlled acquisition, sight-reading, named patterns and styles, and musical mini-pieces. The requirement is to make it good and trustworthy, not to avoid generation.

Its compact correction, point by point:
1. **Generated content is a first-class teaching source.** Choose by the learner job:
   - generated CONTROL for isolation and variation;
   - generated sight-reading, where unseen material is intrinsic;
   - generated named-pattern or style work, where an exact sourced contract is reliable;
   - generated musical material, where its musical structure can be specified and verified;
   - a real excerpt or full piece, where authentic transfer or integration is better;
   - external material, where that is genuinely best.

   The question is "which source teaches this learner need best?", not "can generated content be avoided?"
2. **No subjective human judgment as the generator gate.** Distinguish three things:
   - the pedagogical contract: the skill, allowed demands, forbidden demands, difficulty envelope;
   - the musical contract: phrase structure; motive, repetition and variation; harmonic skeleton and function; cadence and closure; contour; the accompaniment relationship; voice leading; register and spacing; the stylistic pattern; playable hand distribution;
   - verification, by music21, partitura or musicxml-io, Tonal (where parity proves it suitable), Hypothesis, and bounded constraint solving.

   No library is a pedagogy oracle. An output passes because its required properties are established. If an important property cannot be established, mark it UNKNOWN, then narrow the claim, use a more verifiable strategy or template, or choose another source. Never replace UNKNOWN with human taste.
3. **Short, enforceable rules.** Major curriculum briefs carry three headings:
   - Instructional chain (learner action | content source | tool/mode | scaffold | feedback | evidence | next support removed);
   - Failure route (failure | smallest useful change in teaching strategy);
   - Independence test.

   A cheap brief lint may reject a brief that lacks them. Tiny fixes are exempt.
4. **Generator-consuming briefs add one block:** the job (CONTROL / SIGHT-READING / NAMED-PATTERN / MUSICAL); the demand isolated; what varies; what stays fixed; the musical properties required; the libraries and verifiers used; adversarial and boundary cases; the review denominator; transfer out of generation.
5. **Sight-reading stays the highest-value generator-quality check.** Run a bounded reconciliation: a fixed seed corpus plus Hypothesis and boundary cases, testing explicit phrase properties per level. Where failures recur, improve the construction with the smallest mechanism: motive or template reuse, rhythmic relationship, contour, harmonic skeleton, cadence, or an accompaniment template. No general composition system.
6. **Reconciliation output stays short:** ability/family | requirement | current state | concrete failure | smallest correction | enforcement check. No essay.

Its summary: "Generated ≠ inferior. Verified ≠ merely syntactically valid. Musical quality ≠ subjective human taste." A deliberately mechanical drill (a scale, a habanera cell, a ii-V-i shell) should not be asked to be musical. It should be clean, accurate, playable, appropriately varied and pedagogically efficient.
