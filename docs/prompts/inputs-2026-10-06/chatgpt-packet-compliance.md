# ChatGPT, 2026-10-06: packet-compliance reconciliation (verbatim, reference only)

> Kept word for word. `docs/prompts/FABLE.md` §8 governs: it turns this into one bounded traceability table. Its human-audition lines are overridden by FABLE.md §5 (the owner: "I also don't want human judgement").

---

Yes. There are several other explicit packet requirements that we have only partially implemented. The packet is not unclear. The process has been atomizing it into “map,” “generator,” “modes,” “intake,” etc., and then each sub-agent optimizes its slice without proving that the whole packet survived.

The main misses I see after rereading it are:

1. **The learner-model loop is underbuilt.** The packet says learner need → ... → measure what can actually be measured → update learner model. We have spent enormous effort on measurement honesty, but not enough on the final step: what evidence should actually change what the app believes about the learner? The Mode Sheet itself shows that pieces, excerpts, Lab builds and most drills currently do not feed skill evidence, while many Lab/Jam interactions record nothing. That may sometimes be correct, but it must be a deliberate design decision. For every important teaching chain we need: what observable evidence updates which learner state; what merely completes a rung; what stays self-checked; what must never grant skill credit.

2. **Generated sight-reading quality has not received the packet's special treatment.** The packet explicitly calls progressive sight-reading the highest-value generator-quality experiment, specifies the progression dimensions, and says to generate short musical phrases, not merely valid random notes. This is not just another G-row. It deserves a bounded, serious quality pass over the actual current sight-reading generator, using multiple seeds and levels, structural verification plus human audition.

3. **Generator quality needs actual use of the library/tool stack, not only bespoke checkers.** The packet explicitly names music21 for harmony/interval/key/voice-leading, Hypothesis for adversarial/property-based testing and minimized counterexamples, and selective constraint-solving where it eliminates brittle search. Since the packet, the research stack has also gained Partitura as an independent MusicXML witness and recommends differential verification, not trusting one second parser. We also have musicxml-io evidence and Tonal work in the repository. We should deliberately decide per property: reuse library / compare libraries / retain small custom logic. We should not keep hand-writing theory, spelling, harmony, voicing or parser logic where a proven library can do it better.

4. **The packet’s four generated-content jobs need different quality standards.** We blurred these. A scale drill does not need to be a beautiful composition. A named-style drill needs sourced stylistic fidelity. Sight-reading needs phrase-like musicality. A generated mini-piece needs actual musical coherence and audition. The packet explicitly separates controlled exercises from musical mini-pieces and says the latter require musical-quality review beyond mechanical validity.

5. **The source-selection hierarchy itself must be enforced.** For musical mini-pieces, the packet prefers real excerpt → simplified/authored arrangement → curated phrase/harmony/accompaniment template → freer generation last. We have discussed this, but it is not yet an acceptance check. Before building freer generation, Claude should have to say why the first three fail the learner job.

6. **External recommendation is a real content source.** The packet explicitly lists it beside generated exercises, excerpts and full repertoire. We have mostly treated “not in app” as “not usable yet.” For some advanced repertoire, transcription, modern songs, books, listening, or style learning, the best pedagogy may be an honest outside recommendation. That should be allowed instead of forcing mediocre generated/PDMX content into every slot.

7. **The technical score gate must remain narrower than pedagogy.** The packet explicitly separates “is this a sane supported score asset?” from “is this musically good / stylistically right / the right difficulty / useful for teaching?” Our intake discussion has tended to aggregate many checks into one “gate.” We need a crisp separation: technical admission first; musical-role verification second; curriculum placement third. Otherwise another “gate passed” number becomes a false proxy for pedagogical quality.

8. **The cross-track strands need actual longitudinal teaching chains, not merely confirmation that they occur.** The packet specifically demands ongoing sight-reading; recurring transposition; memory through structure/retrieval/multiple starts/recovery; productive ear training; score study; and performance/recovery. We have found and repaired pieces of these, but we have not yet proven their development across stages. “Transposition appears four times” is not enough; its difficulty and independence need to progress. Same for memory and ear.

9. **The representative learner journey is a product acceptance test, not an afterthought.** The packet requires Today to explain what/why, the correct source to be selected, activity to start without hunting, Score/practice to work, the summary to say only what was measured, Today/Plan/Progress to agree, authentic repertoire transfer to work, and Simon/Lab/Jam/Free Play to have distinct honest purposes. We should eventually test that exact chain with a real ability. The Bizet vertical slice is a good candidate for part of it, but it cannot substitute for the later complete learner journey.

10. **“Change strategy after repeated unchanged failure” was explicitly in the packet.** We only just added failure routes after you pushed on this. Those routes need to become real where useful: not a generic adaptive engine, but the lesson/app actually directing the learner from Keep Tempo → Loop/slow → one hand/Rhythm Only → Wait/model when the nature of the failure warrants it.

11. **The track endpoint matters, not merely the set of rungs.** The packet asks what a competent developing pianist should actually be able to do in each domain and specifically gives examples such as jazz integrating one tune across melody, comping, bass, improvisation and arrangement; rock moving toward transcription/reduction/section arrangement; composition being recursive through revision; theory/ear emphasizing production. We should audit later builds against those endpoints rather than congratulating ourselves when individual missing rows are closed.

12. **Generated-content review must have explicit denominators.** The packet's trust rules repeatedly reject “all checked” without a denominator and one-sample generalization. A generator cannot be “reviewed” because somebody liked three outputs. For each family/level being certified we need a bounded corpus: seeds/cases chosen in advance, normal + boundary/adversarial cases, how many structurally checked, how many rendered, how many actually auditioned, and what failures recurred.

The reason this keeps happening is not that the packet is too complicated. We allowed its integrated architecture to be decomposed without maintaining traceability back to the packet. The ability map captured curriculum stations. The Mode Sheet captured measurement. The generator addendum captured structural contracts. Intake captured score admission. Each document could look good while no one was required to prove:

> “This entire learner experience satisfies the packet.”

That is the process mistake.

I would stop patching this with one more isolated instruction. Give Claude this as the correction:

---

We have repeatedly lost explicit requirements from the Fable Restart Packet while decomposing the work into the ability map, generator addendum, mode sheet, intake gate and individual build seams.

Do not patch another individual omission.

Create ONE bounded packet-compliance reconciliation before further waves are considered fully specified.

This is not a new curriculum review and not a new planning project.

Read literally:
- "docs/prompts/runs/restart-2026-10-05/Fable_Restart_Packet_2026-10-05_v3.md"
- current "ABILITY-MAP.md"
- current "MODE-SHEET.md"
- current "GENERATOR-ADDENDUM.md"
- current intake specification
- the verification/library research under "docs/prompts/runs/research-for-fable/"
- current lessons/curriculum only where needed to verify a finding.

Use Opus for this reconciliation.

## Required output: packet traceability table

For EVERY operative requirement in the packet, state:

"packet requirement | current artifact implementing it | implementation state | evidence | gap | exact smallest correction | seam/wave affected"

States are only:
- SATISFIED
- PARTIAL
- MISSING
- DEFERRED BY PACKET

Do not call something SATISFIED because a document mentions it.

SATISFIED means the current plan/build process actually makes it happen and has an acceptance test appropriate to the requirement.

## At minimum, explicitly trace these packet requirements

### Teaching architecture
- learner need → musical requirements;
- best content-source choice;
- validation for actual teaching role;
- appropriate presentation/interaction;
- honest measurement;
- learner-model update;
- CONTROL → MODEL/TRANSFER → MUSIC → INDEPENDENCE;
- prerequisite sequence;
- enough practice/revisiting;
- support fading;
- failure strategy;
- realistic transfer;
- independent endpoint.

### Content-source selection
- controlled generated exercise;
- generated musical mini-piece;
- authentic excerpt;
- full repertoire;
- external recommendation;
- primary acquisition and authentic transfer treated as different jobs;
- excerpt allowed to beat whole piece;
- application substrate not required to print the applied technique.

### Generated-content quality
- current generator families enumerated, no stale count;
- controlled drills isolate allowed demands;
- progressive sight-reading treated as the packet's highest-value generator-quality experiment;
- sight-reading uses source-backed progression in key/metre/rhythm/range/hand configuration/position changes/articulation/accidentals/density/polyphony/length;
- generated sight-reading produces short musical phrases, not merely legal random notes;
- named styles use sourced definition → explicit contract → independent checker;
- generated mini-pieces are highest risk;
- preference order:
  1. real excerpt,
  2. simplified/authored arrangement,
  3. curated phrase/harmony/accompaniment templates,
  4. freer generation only when necessary;
- any family promising music receives actual human musical audition/curation;
- generator review has an explicit denominator across seeds/cases;
- a structurally green generator is never automatically called musically good.

### Library/tool reuse

Use the libraries already available where they delete custom brittle logic.

Explicitly evaluate current relevant work against:
- "music21": harmony, intervals, keys, voice-leading, Roman numerals and other symbolic facts where appropriate;
- "partitura": independent MusicXML event witness;
- "musicxml-io": another parser/witness where its semantics are useful;
- "Tonal": theory/chord/key/progression semantics only where parity establishes the behavior we need;
- "Hypothesis": property-based/adversarial testing over generator parameter spaces and minimized counterexamples;
- constraint solving: only where it replaces brittle custom search/voicing/generation logic with a bounded declarative problem.

Do NOT use any library as a pedagogy oracle.

For each custom generator/checker/theory implementation touched by the remediation, ask:

"Can an established library establish this objective fact more reliably?"

If yes, prefer reuse or differential comparison unless there is a concrete reason not to.

Do not rewrite working code merely to use a library.

### Differential verification

Do not rely on:
- generator + its own readback;
- one parser;
- metadata;
- detector agreement.

Choose independent witnesses appropriate to the property.

For important generated/converted MusicXML:
- source/contract is one side;
- generated bytes are the object;
- independent parser(s) establish events;
- structural checker compares events with source contract;
- human notation review covers engraving/playability;
- human audition covers musical quality where the content promises music.

Use multiple parsers only where disagreement would materially matter.

### Learner model / evidence

For every major ability:
- what observation can update skill/rung state?
- what mode records it?
- what support conditions matter?
- what evidence is lost today?
- what remains self-checked?
- can the learner receive green credit before performing the target behavior?

Find cases where Lab/Jam/Free Play/excerpts/pieces are central to teaching but current evidence architecture means progress can go green without the transfer/independence behavior ever occurring.

Do NOT automatically make every musical activity count.
Correct outcome may be honest self-check or a changed requirement.

### Cross-track development

Explicitly verify longitudinal teaching, not mere appearance, for:
- continuing sight-reading;
- recurring transposition;
- memory = structure + retrieval + multiple starts + transitions + cold starts + recovery;
- ear training that includes production;
- score study before playing;
- no-stopping performance and recovery.

For each, state whether current progression is genuinely developmental across stages.

### Track endpoints

Check that remediation is moving toward the packet's actual domain endpoints, not merely closing individual findings.

Examples the packet specifically demands checking:
- jazz: one tune used through melody/comping/bass/improv/solo arrangement;
- rock/metal: transcription → reduction → choose what to omit → section/density/register arrangement → personal project;
- improvisation/composition: phrase → melody → motif → form → harmony → reharmony → revision/listening → finished notation;
- theory/ear: production, not recognition only;
- Latin: distinct styles, not generic Latin groove;
- memory/performance/practice endpoints as stated in the packet.

### Technical intake versus pedagogy

Keep separate:
1. archive/candidate;
2. technically sane playable asset;
3. musically/pedagogically verified content;
4. curriculum placement.

Technical intake must not certify:
- quality;
- style;
- difficulty;
- arrangement quality;
- lesson fit.

Do not let one "intake passed" metric hide those boundaries.

### Representative learner journey

Preserve the packet's later acceptance test:
- Today explains what and why;
- correct content source selected;
- activity starts without hunting;
- Score/practice usable;
- summary says only what was measured;
- Today/Plan/Progress agree;
- authentic-repertoire transfer works end to end;
- Simon, Lab, Jam and Free Play each demonstrate a distinct honest purpose.

Do not declare curriculum/product remediation complete before this representative journey is actually run.

### Generator quality reconciliation in particular

For every generator family actually consumed by current or approved curriculum work, identify its job:

A. canonical technical drill
B. progressive sight-reading
C. named style/pattern
D. musical mini-piece

Then state:

"family | curriculum consumers | job | pedagogical contract | structural verifier | library/oracle used | review corpus denominator | notation review | human audition required? | current musical-quality evidence | gap"

Do not review unused generator families merely because they exist.

### Sight-reading gets a real quality pass

The packet explicitly calls this the highest-value generator-quality experiment.

Design a bounded corpus per active sight-reading level.

The review must distinguish:
- pedagogical constraint compliance;
- notation/playability;
- musical phrase quality.

Use fixed reproducible seeds plus boundary/adversarial cases.

Use Hypothesis where useful to explore the legal parameter space and shrink structural counterexamples.

Use music21/Partitura/musicxml-io where appropriate to independently inspect objective score properties.

Then HUMAN-AUDITION a declared sample.

The question is not merely:
"Are these valid?"

It is:
"Are these good short sight-reading phrases a learner should spend time playing?"

If not, identify recurring construction failures and propose the smallest musical-generation correction:
- motif/rhythm templates;
- contour;
- phrase/cadence templates;
- harmonic skeleton;
- accompaniment templates;
  or another bounded mechanism demonstrated by the failures.

No generic composition engine.

### Completion correction

The remediation cannot be called complete merely because:
- every station has something;
- every source gate is closed;
- every score is admitted;
- every generator contract passes;
- every test is green.

It also requires:
- coherent teaching chains;
- correct use of app tools;
- useful feedback;
- response to failure;
- controlled variation;
- support fading;
- authentic transfer;
- independence;
- honest evidence/learner-model updates;
- generated sight-reading that is actually musically good;
- actual musical curation for any generator output that promises music;
- the representative end-to-end learner journey.

### Important scope rule

This is a reconciliation, not an excuse to stop the current builders or create a new infrastructure program.

Do not interrupt already-running work.

Do not build anything from the reconciliation until its findings are independently reviewed.

Push the traceability document and hand it to ChatGPT for review.

ChatGPT's review question is:

Does this traceability pass faithfully preserve every operative requirement of the restart packet, and do its proposed corrections close real gaps rather than create new process machinery?

---

That is what I think we should have done much earlier.

And on the library point: yes, we have been underusing them. Not by replacing musical judgment with libraries—that would violate the packet—but by failing to use them aggressively enough for the objective parts they are excellent at.

For example, a generated accompaniment could use a sourced template for the musical idea, music21/Tonal for harmony semantics, a constraint solver if a voicing problem genuinely benefits from one, Partitura/musicxml-io as independent witnesses of the generated score, and Hypothesis to hammer the generator across key/metre/range combinations and give us tiny reproducible failures. Then a human still answers the question the libraries cannot: “Is this actually worth learning and playing?”

That combination—libraries for objective correctness and search, humans for musical/pedagogical judgment—is much closer to what the packet was asking for.
