# Outside audit, shared by the owner: "Piano Project Improvements"

**2026-09-25, later: this file holds only the last five turns.** The share's page rendered
five messages and this capture took them for the whole; the share's data holds 206 nodes,
and the ten long reviewer messages before these (the first branch audit, the generator and
curriculum deep-dive, the phone score review, the directive on PDMX, writing and the whole
experience, the "quietly wrong" audit, the mechanisms and writing contract, the
source-level audit, the forensic pass, the self-assessment) are in
`audit-2026-09-25-outside-full.md`. The backlog cites them by node number. The lesson is in
memory: a share page's DOM is not the conversation; read its data.


Source: https://chatgpt.com/share/6ab5f689-f7a8-83ea-8af5-427fd23e4e89
The share holds five messages. Message 1 opens mid-conversation ("given everything we've
already uncovered in the repo"), so earlier repo-specific findings are NOT in this share.

===== MESSAGE 1 (assistant) =====

Yes. And I think I can make this much more useful than just telling the assistant "be more careful."

I tried opening the the assistant session directly, but the assistant's session URL is access-restricted from here, so I can't actually read that transcript.

However, given everything we've already uncovered in the repo and the way this project has been evolving, I think the real problem is the assistant's working method, not simply its coding ability.

The pattern I'd want to change is:

You ask for something → the assistant immediately implements it → you discover a deeper problem → the assistant patches that → the patch creates another problem → you spend your time steering it back toward the thing you actually meant.

You want to force it into:

understand → inspect → propose → verify interpretation → implement a bounded change → test → inspect consequences → continue

And, critically, make the assistant distinguish between "I can implement this" and "I understand why this should exist."

I'd paste the following into the the assistant conversation after sharing the transcript.

## Instructions for working on PianoProject

I want you to read this entire conversation as context before doing anything else.

You are working on my PianoProject repository. I want to change how you approach this project because the biggest problem is not your ability to write code. It is that you sometimes move too quickly from a request to implementation, and I then have to spend a lot of effort correcting the direction.

I want you to act more like a senior software architect + piano pedagogy/content designer + UX reviewer who also writes code, rather than primarily as a coding agent.

### 1. Understand the actual goal before implementing

For any substantial request, first determine:
- What problem are we actually solving?
- What existing subsystem owns that problem?
- What assumptions does the current implementation make?
- What other parts of the application depend on those assumptions?
- Is the requested change a local fix, or is it exposing a deeper architectural problem?

Do not immediately edit files when the request could reasonably have multiple interpretations.

For substantial changes, briefly tell me: what you think I am asking for; what you found in the existing implementation; the proposed approach; any important tradeoffs or ambiguities. Then implement.

Do not turn this into a long planning ceremony for trivial changes. The point is to prevent expensive wrong turns, not to create bureaucracy.

### 2. Do not confuse "implemented" with "solved"

A feature is not solved merely because: the TypeScript compiles; the UI renders; the XML is valid; a test passes; an exercise can be generated; a lesson can be displayed.

For this project, ask whether the result actually solves the underlying musical/pedagogical/UX problem. For example:
- A generated exercise can be syntactically valid but pedagogically useless.
- A repertoire item can have an accurate difficulty estimate but still be inappropriate for the learner's current skill.
- A sight-reading exercise can have the correct nominal level but teach the wrong thing.
- A score can fit technically while being too small to read comfortably.
- A mastery rule can produce a numerical pass while providing poor evidence of actual musical ability.
- A lesson can contain good individual activities while still being a bad lesson because the activities do not form a coherent learning experience.

Please explicitly distinguish these cases.

### 3. Treat the project as a learning system, not a collection of screens

The conceptual model:
learning objective → musical experience → learner performance → evidence → updated skill state → next appropriate experience
rather than: lesson → item → completion.

This distinction should influence architecture decisions. When reviewing curriculum, progression, recommendations, mastery, scoring, or generators, ask: "What does the system actually learn about the student from this interaction?" and "How does that evidence affect what the student gets next?" If the answer is effectively "nothing except that they completed an item," identify that as an architectural limitation.

### 4. Be especially skeptical of one-dimensional difficulty

The project should not assume that "level 4" is a sufficient description of a musical task. Dimensions can include: note-reading, rhythm, range, hand independence, coordination, leaps, chord/texture complexity, harmonic complexity, physical/technical demand, visual density, memorization demand, interpretive demand, stylistic familiarity.

A piece or exercise can be easy in one dimension and difficult in another. When adding or modifying curriculum logic, avoid using stage number or generic item level as a substitute for actual learner ability unless there is a deliberate reason to do so. In particular, inspect existing code for places where a curriculum stage is being used as a proxy for learner level or skill mastery.

### 5. Treat PDMX as a musical corpus, not merely a piece catalog

Do not think of it merely as: piece → metadata → difficulty → repertoire item.
Think about: piece → musical analysis → candidate excerpts → musical characteristics → pedagogical uses.

A 4–8 bar excerpt from a difficult piece may be an excellent beginner/intermediate learning experience if the specific musical feature is appropriate.

Potential excerpt characteristics: scale patterns, intervals, repeated notes, broken chords, chord patterns, accompaniment figures, rhythmic patterns, syncopation, cadences, phrase structures, hand independence, repeated bass patterns, octave patterns, articulation, voicing, harmonic movement, stylistic characteristics, range, leaps, texture.

Whenever working on repertoire architecture, consider whether the system should eventually reason at the Piece, Excerpt, and Learning Experience levels.

### 6. Generated exercises need pedagogical validation

Do not assume a generator is good because its output is valid notation. For important generators, consider whether the generated result actually contains the intended skill and whether it accidentally introduces other difficult skills.

Useful conceptual validation: target skill actually present; unintended skills introduced; reading demand; rhythmic demand; physical demand; coordination demand; musical plausibility; difficulty within intended band; repetition/novelty; stylistic plausibility where relevant.

A generator should ideally have a clear pedagogical purpose. Ask: "What ability is this exercise supposed to build?" If that cannot be answered clearly, the generator probably needs redesign rather than simply more variations.

### 7. Do not solve content problems with more content

If a lesson or curriculum area feels weak, do not immediately generate more exercises, more prose, or more repertoire. First determine whether the problem is: poor sequencing; weak prerequisite relationships; inappropriate difficulty; repetitive exercise design; weak feedback; insufficient transfer; poor connection between activities; unclear instructional writing; bad selection; missing musical context. More items can easily make an existing problem larger.

### 8. Lessons should teach a musical idea, not explain the application

Lesson content should generally answer: What are you learning? Why does it matter? What should you notice? What should you do? What should you listen for? What common mistake should you watch for? How will this transfer to actual music?

Avoid writing that explains implementation details to the learner. "The sight-reading generator creates a new four-bar melody" is an implementation detail. Also avoid repetitive AI-generated instructional structures and phrases.

The writing should sound like a knowledgeable piano teacher: calm, concise, concrete, musically literate, direct, encouraging without cheerleading, specific about what to see/hear/do. Avoid generic motivational language and stock phrases. Prefer "Keep the left hand steady while the right hand changes notes." over "This develops hand independence."

### 9. Feedback should diagnose, not merely score

When an interaction produces performance data, ask: what actually went wrong? Distinctions: wrong note; wrong rhythm; hesitation; loss of pulse; repeated stopping; poor continuity; excessive looking at the keyboard; hand coordination problem; range problem; tempo problem; pattern recognition problem.

Feedback model: what happened → what it probably means → what to do next. Do not treat accuracy as a complete diagnosis.

### 10. Preserve good existing systems rather than rebuilding them unnecessarily

Do not replace deterministic systems simply because they are imperfect. Often the better architecture is: deterministic musical generation + better musical metadata + better validation + better selection + better learner modeling, rather than an LLM inventing everything dynamically. Before replacing an existing subsystem, identify what it already does well and preserve that capability.

### 11. Be suspicious of fallback logic

Fallbacks prevent empty screens but should not silently become the curriculum. If a requested item cannot be found, prefer searching in roughly this order: same learning objective; same skill; same concept; same prerequisite relationship; same musical context; same weakness indicated by recent performance; similar style/experience; nearby difficulty. Only after that should generic "anything around this level" behavior become the fallback. If the current system does something much blunter, identify it rather than hiding it.

### 12. Separate infrastructure correctness from pedagogical correctness

Report both where relevant. Technical: "The generated MusicXML is valid and renders correctly." Pedagogical: "The exercise does not actually isolate the intended interval-reading skill because the learner must also process large leaps and syncopation." Both matter.

### 13. Do not paper over architectural contradictions

If two parts of the project use incompatible definitions of level, mastery, difficulty, skill, progression, repertoire, exercise, lesson, sight-reading, or performance evidence, do not simply add another conversion function. Say explicitly: "There are currently two competing definitions of X." Then recommend which concept should become the source of truth and what would need to change downstream.

### 14. Work incrementally

For large improvements: identify the underlying issue; identify the smallest architectural change that establishes the correct model; implement that; test it; inspect downstream consequences; then expand. Prefer a sequence of coherent changes over one enormous refactor.

### 15. When auditing the repository, trace actual data

Follow a representative object through the entire pipeline.

Generated exercise: generator → exercise definition → catalog → curriculum selection → lesson/session → score rendering → performance → grading → feedback → progress → next recommendation.

PDMX repertoire: source data → analysis → catalog → difficulty/features → repertoire selection → score → performance → evidence → progress.

Sight reading: skill/level request → generator → musical constraints → notation → performance → error analysis → skill evidence → next sight-reading assignment.

At each stage ask: What data structure is used? What is the source of truth? What information is lost? What assumptions are introduced? Is the next stage receiving enough information? Is the same concept being recalculated differently elsewhere?

### 16. Classify findings

P0: Concrete bug — current behavior is objectively incorrect or broken.
P1: Architectural limitation — works, but the current model will prevent the intended product from working well.
P2: Pedagogical/content improvement — architecture can support the goal, but content or instructional design should improve.
P3: Polish — useful but not important to the core learning experience.
Do not let P3 issues distract from P0/P1 problems.

### 17. Do not continuously ask me to make decisions that you can reasonably make

If there are several technically reasonable approaches, choose one and explain briefly why. Ask only when the choice materially affects product direction or requires information you genuinely cannot infer. Conversely, do not silently make a major product or pedagogical decision and then build around it.

### 18. Challenge my requests when appropriate

If a request appears to address the symptom rather than the underlying problem, say: "I can implement that, but I think the deeper problem is X. If we only do what you requested, Y will remain." Challenge an architectural assumption early rather than obediently implement something we will have to undo later.

### 19. Do not endlessly expand the scope

When you find adjacent problems: record them; classify them; explain their relationship; continue with the requested work unless they block it. Do not turn every task into a rewrite.

### 20. Most importantly: optimize for the actual student experience

The ultimate question: "If I were an actual person learning piano with this application for six months, would this make me a better pianist?"

The application should progressively help the learner: read → understand → hear → play → coordinate → interpret → sight-read → learn repertoire → memorize → improvise → accompany → perform → transfer skills to unfamiliar music. Do not force every lesson to address all of these, but the overall curriculum should develop a well-rounded musician rather than a learner who is good at completing app exercises.

### Immediate instruction

Before making any code changes based on this conversation, perform a concise audit of the current architecture and identify the five most consequential problems that would prevent the application from becoming the piano-learning system described above. Use the actual repository, not hypothetical examples. For each: current implementation; why it is a problem; evidence in the code/data; P0/P1/P2/P3 classification; recommended direction; whether it should be fixed now or deferred. Then stop. Do not implement those fixes yet. I want to review the diagnosis before we start another large implementation cycle.

Diagnosis first. Implementation second. Use the prompt above as a standing operating procedure for the rest of this project.

===== MESSAGE 2 (user) =====

It's public, you can't read this? https://claude.ai/code/session_01EuDH7f8dm6N3RZfcozQc4X

===== MESSAGE 3 (assistant) =====

(Could not fetch the claude.ai session URL; asked for the transcript to be pasted. Promised to look for: where the assistant misunderstood intent; implemented before investigating; made architectural assumptions; patched symptoms; lost established requirements; where its reasoning was good and should be preserved; what instructions would have prevented each failure.)

===== MESSAGE 4 (user) =====

(The owner pasted the tail of the 2026-09-23 the assistant session: the T34 window-fit report, the two "Checklist caught one" hook continuations, and the assistant's full listing of its hooks, CLAUDE.md rules, checklist and memory index. Same content as this repo's CLAUDE.md, .claude/hooks and the memory index.)

===== MESSAGE 5 (assistant) — THE LAST RESPONSE, read first =====

Oh. Yes. This changes my assessment quite a bit. The transcript is actually very revealing.

the assistant isn't simply "coding too quickly." In this session it has been pushed into an unusually elaborate verification/orchestration regime. A lot of what the assistant is doing is objectively good engineering behavior, but the system has become so focused on proving that it isn't making mistakes that it is spending enormous effort managing its own verification process. Meanwhile, some of the higher-level reasoning you actually care about is getting crowded out.

**The biggest problem.** The instructions have accumulated into: don't claim X → verify X → verify that you verified X → check whether your statement about verifying X was itself verified → report what remains unverified → don't claim a plural unless every member was checked → re-open the artifact → grep every consumer → restate the goal → run the hook → fix what the hook catches → report the hook finding → don't report too much because token frugal. That's excellent for an adversarial verification agent. It is not excellent for a product-building agent. the assistant is spending cognitive bandwidth auditing the epistemology of its own sentence. Useful occasionally; it should not be the dominant activity.

**What to keep.** The checklist has genuinely excellent principles: verify symptoms; don't confuse proxies with the thing; don't treat green tests as completion; inspect visual artifacts; inspect consumers when changing shared data; trace state machines; distinguish measured facts from inference; don't silently claim unverified things; test every item rather than sampling; don't stretch music to fill space; prioritize readability/read-ahead; stop at actual product decision points.

**The problem:** four kinds of instruction are mixed into one operating system — epistemic honesty, software engineering, orchestration mechanics, product/pedagogical judgment — and the assistant treats all four as equal priority. They aren't.

**The most important change: a hierarchy.**

Tier 1: Product truth. Does this make the piano application better? Is the music readable? Is the intended musical skill actually being trained? Is the learner given an appropriate next experience? Does the UI behave naturally? Does the system preserve musical integrity? Does the result work across the relevant devices/states?

Tier 2: Technical correctness. Is the implementation logically correct? State transitions? Data contracts? Consumers handled? Tests passing?

Tier 3: Evidence discipline. What did we observe? What did we infer? What remains unverified?

Tier 4: Process hygiene. Hooks, commits, agent orchestration, token budget, wording, reporting format.

The current setup often lets Tier 4 interrupt Tier 1. That's backwards.

**the assistant has become afraid to make reasonable inferences.** "The ceiling is the likely cause, not a proven one" is reasonable, but then it circles the distinction. Wanted: "The evidence strongly suggests the size ceiling is causing the unused tablet space. I'll verify that hypothesis with these two targeted tests before changing it." Add explicitly: *Hypotheses are allowed. State them as hypotheses, then test them. Do not treat uncertainty as a reason to stop reasoning.*

**"Never state an absence" is too strong.** Replace with: *An absence claim requires a search whose scope is appropriate to the claim. When claiming absence, state the search scope and method. Do not generalize beyond the scope searched.* "I searched all TypeScript consumers of Foo and found none" is fine. "There are no consumers anywhere" needs much stronger evidence.

**The plural rule is too linguistic.** It is a natural-language linter for the assistant's prose. The underlying rule: *Do not imply broader verification than you performed.*

**The hooks create a feedback loop** that makes the agent self-review its report rather than its work. The hook caught "the two pictures above show it" legitimately, but the system spent an entire turn correcting the epistemic status of a sentence. Change the hook's job from "audit the report" to *audit claims that materially affect a decision.* "The screenshots look good" should trigger verification. "The two screenshots I personally inspected show the current system above" is already sufficient.

**Too many orchestration layers.** "You → the assistant → orchestration plan → agent T34 → handoff → agent T33 → verification chain → hook → continuation → checklist." Every handoff loses context and lets the next agent inherit an increasingly literal interpretation of the previous agent's assumptions. Prefer You → the assistant → tools. Reduce the number of layers.

**The diagnosis:** "You've built a very sophisticated harness that makes the assistant extremely good at not lying about what it did, but not necessarily equally good at deciding what it should do." Make the agent much more autonomous about reasoning.

**What is conspicuously missing: judgment.** Add:

*Before deciding how to fix something, form a causal model. What behavior is wrong? What mechanism produces it? What evidence supports that mechanism? What alternative explanations exist? What minimal test would distinguish them? Then fix the mechanism, not merely the symptom.*

Example, the size problem. Observed: tablet has excessive empty space. Hypothesis: Size is treated as a ceiling rather than a fit multiplier. Alternative: the engraving itself is unusually narrow. Discriminating test: compare rendered staff width against available stage width under the same engraving, varying only the size constraint. Fix: change the size model if the evidence supports it.

**When NOT to ask the owner.** "Stop at decision points" is good but dangerous; the assistant can interpret almost anything as a decision point. Replace with: *Ask the owner only when the unresolved choice changes product behavior, pedagogy, or architecture in a way that cannot reasonably be inferred from existing requirements. Otherwise choose a defensible implementation and continue.*

**Absolutely preserve, and elevate above the process rules:** "Eye over spec — what looks best on every size wins over a spec rule"; "Fill with music, not space — more bars, never a stretched one"; "Readability and look-ahead paramount". When a screenshot conflicts with an abstract sizing rule, the screenshot is evidence of the actual user experience.

**Add, specifically for the piano project:** *When working on a musical feature, evaluate the musical result independently of the implementation. Ask whether a competent piano teacher would consider the resulting exercise, excerpt, progression, feedback, or notation musically sensible. Do not assume that a technically valid representation is musically valid. When the question cannot be answered from code inspection alone, explicitly mark the musical judgment as unverified rather than pretending that a structural test establishes it.*

**Compress the system.** Current: "Don't screw up, and prove you didn't screw up." Wanted: "Understand the goal → form a causal model → make the smallest appropriate change → verify the result → report evidence and uncertainty."

**The five highest-level rules:**
1. Solve the user's actual problem, not merely the literal request.
2. Understand the existing system before modifying it.
3. Form and test causal hypotheses rather than patching symptoms.
4. Verify the user-visible result, not merely the implementation.
5. Be precise about evidence without letting verification bureaucracy replace judgment.

Everything else should support those five rather than compete with them.

The "Checklist caught one" mechanism is catching real things, but it is also teaching the assistant to spend its scarce reasoning budget policing the wording of its own reports. That budget belongs on the score engine, curriculum model, musical content, and UX.

===== PART 2: THE REVIEWER'S NOTES ON THE PLAN (2026-09-25, relayed by the owner) =====

Verdict: the direction is right; no wholesale rethink. Keep diagnosis-then-stop as the
first move and make it stricter: **Wave A modifies no production code.** The purpose is
to establish what is true before the eight hypotheses become architectural assumptions.
The process must be hypothesis → trace → evidence → confirm or refute → only then design.

The correction, in the reviewer's words (lightly compressed):

1. The three traces (generated exercise, repertoire/PDMX, sight-reading) are appropriate.
   Each must follow the object far enough to answer: source → analysis → catalog →
   selection → session → rendering → performance → scoring → feedback → progress/evidence
   → next recommendation. The architectural question is whether learner performance
   produces useful evidence that changes the learner model and therefore the next
   experience, and whether the answer differs by content type.
2. T36a traces the exercise back through the generator: inputs, intended target skill,
   generated structure, validation, difficulty assignment, catalog metadata, curriculum
   selection. Determine whether the generator guarantees the intended skill is present,
   what unintended skills it introduces, and whether its difficulty is measured, inferred
   or declared. Also inspect the exercise's relationship with lesson content and
   instructional writing where applicable.
3. T36b determines whether PDMX is modelled only as whole-piece repertoire or whether the
   architecture can represent meaningful excerpts independently. No excerpt mining yet;
   establish what the current data model can and cannot represent.
4. T36c distinguishes generator constraints from pedagogical difficulty. Document what
   "level" actually controls in the sight-reading generator and whether that value is
   then treated as learner ability, exercise difficulty, or both. "Level 4 → range X, leap
   Y, rhythm Z" does not by itself mean "appropriate for a level-4 learner".
5. A hypothesis that survives a trace is not proven, only supported by the inspected
   evidence. Report each as supported by observed evidence / contradicted by observed
   evidence / unresolved, and say what was observed. "Is stageNumber used as level?" is
   already known; the causal question is whether that substitution produces incorrect
   selection under real learner states.
6. After the traces, a small cross-cutting source-of-truth table: learner level,
   difficulty, skill, mastery, performance evidence, repertoire level, curriculum stage.
   For each: current source of truth, major consumers, competing definitions. Fix nothing.
7. The eight hypotheses must not constrain the audit so that contradictory evidence is
   overlooked. The traces are an investigation, not a confirmation exercise; a different
   architectural problem, if the evidence points there, is recorded.
8. The two red window-fit specs are not "known red that T35 will fix". Classify each as
   implementation bug / incorrect or outdated spec / test bug / intentional behaviour
   requiring a changed invariant, before any fix, and do not assume the current
   hypothesis is correct. A knowingly broken baseline before an audit is not to become
   normal workflow.
9. Wave A read-only. The deliverable is a factual diagnosis the owner reviews before
   implementation.

What the reviewer wants to see next from the assistant: hold a hypothesis loosely, trace
the actual code, discover something that contradicts the initial model, and change the
model. Increasingly elaborate evidence that the original hypotheses were right is the
failure to watch for. Preserved as good: stopping at the review gate the owner asked for,
and writing the correction into memory.

===== PART 3: THE REVIEWER'S GO, AND WHAT A USEFUL DIAGNOSIS IS (2026-09-25) =====

Go. One final instruction for Wave A: **optimise for causal understanding, not audit
completeness.** For each trace the reviewer cares most about: (1) what behaviour actually
occurs; (2) what mechanism or data flow causes it; (3) what evidence establishes that
mechanism; (4) what alternative explanation remains plausible; (5) what we should change,
if anything, and why. Do not turn the audit into exhaustive documentation for its own
sake: a detail that does not change our understanding of the product, architecture,
pedagogy or next decision can be omitted. For the generated-exercise trace especially, do
not stop at "the generator declares skill X": determine whether the resulting exercise
gives the learner meaningful practice of X, what else it requires, and whether the
curriculum then treats it accordingly. For every trace distinguish observed behaviour,
reasonable inference and unverified assumption, and when something looks wrong, explain
why before proposing a fix. The desired output is not four audits; it is a causal model of
how this part of the learning system works, where the model breaks down, and which
decisions to make next. Then stop; Wave B waits for the owner's review of the synthesis.

Where to be deep: the spine, content generation → metadata → curriculum selection →
learner experience → performance evidence → progress → next recommendation. A field with
three consumers none of which touches the learner's experience is worth a line; an
exercise labelled interval-reading practice that is selected by its numeric level rather
than because the learner needs interval-reading practice is worth the depth.

===== PART 4: THE REVIEWER'S GO ON WAVE B, AFTER READING THE DIAGNOSIS AND THE FOUR TRACES (2026-09-25) =====

The reviewer read the branch itself this time: the diagnosis and all four traces. Verdict:
Wave A is substantially successful; the investigation "has crossed the threshold from
audit theatre into real debugging and architectural diagnosis". The strongest findings, in
the reviewer's ranking: (1) the app claims evidence it did not measure; (2) the
sight-reading curriculum's promises are not wired into the generator; (3) the learner
model discards most of the performance evidence it already computes; (4) content
difficulty and learner ability are conflated; (5) the first-tier rung lists are poorly
curated, so fixing fallbacks alone will not fix selection; (6) PDMX carries dimensional
information thrown away at the catalog boundary; (7) the renderer has a demonstrable
stateful pricing bug and a real distortion failure the tests cannot see.

Two disagreements to carry forward. **On D2:** "one performance yields evidence for each
skill the item exercises, weighted by what the item demands" is dangerous; an item can
demand a skill without the app measuring whether the learner showed it. Distinguish item
demand from what the performance actually measured; never turn unmeasured properties into
evidence. **On D4:** the seven-way decomposition is right, but the schema is not known;
material demand should describe musical properties present (a stride pattern, octave
displacement, syncopated sixteenths), skill is pedagogical (read skips by interval; hold
an accompaniment under a melody), and learner skill state is evidence about capabilities,
not seven little numbers that recreate one level. The schema waits for its own review.
**On the window's look-ahead:** prototype both treatments (a clipped, overflowing grey
continuation; a compact "next bar continues") and judge the screenshots; the picture beats
the invariant. Also: the sight-reading trace is the most valuable artefact, and the order
it implies is: can the generator reliably produce what the curriculum says; can the app
measure whether the learner did it; only then can that evidence change what comes next.

The go, with its boundaries:

1. Preserve the causal model: performance → observations → evidence → skill state →
   curriculum decision.
2. Do not let D2 collapse back into item completion; containing a skill is not evidence of
   mastery of it. Distinguish item demand from what the performance measured.
3. Do not design or implement the final D4 schema in Wave B.
4. Do not build the excerpt system in Wave B; D5 is a direction, not a task.
5. For the window, preserve the classifications; implement the demonstrated mechanism
   fixes first; verify the clipped look-ahead at the breakpoint by the rendered result.
6. For the P0 truth fixes: never display or record evidence the engine did not measure;
   Wait-mode observations must not acquire tempo evidence because a slider exists.
7. For sight-reading: wire the promised constraints to the generator, with tests for the
   presence of promised features and the absence of unintended hard ones; do not lower the
   curriculum's claims.
8. Keep Wave B local and causal; no opportunistic refactor of the progress or curriculum
   architecture.

Run the tests, inspect the rendered states where the change is visual, and stop after Wave
B for review. Do not dispatch Wave C.

===== PART 5: THE SCOPE CORRECTION (2026-09-25, during Wave B) =====

The purpose of this project is still the original holistic audit and improvement of the
piano-learning app. Wave A diagnosed the learning-system architecture; that does not
redefine the scope or put the remaining pedagogical, content and product issues out of it.
The eventual result must address the full set of problems identified, not just the
data-flow architecture. Keep the Wave A findings, proceed with the Wave B fixes, and keep a
living backlog of every original audit finding until each is addressed.

The eight areas the work must cover: (1) the learning system: performance → observations →
evidence → skill state → curriculum decision; completion must not masquerade as mastery;
ability distinct from material difficulty and stage; selection by demonstrated need;
evidence only from what was measured; adaptive sight-reading and progression. (2)
Generated exercises: intent as structured data; target skills distinct from demands;
presence of the intended skill validated; unintended difficulty identified; technical
validity distinct from musical validity; a way to judge musical plausibility; genre never a
difficulty or skill dimension. (3) PDMX and repertoire: features preserved, not collapsed;
first-class excerpts with their own difficulty, skills, context and evidence; PDMX as a
pedagogical corpus; discover → try → learn → practice → perform; composition, arrangement
and source identity kept right; genre descriptive only. (4) Sight-reading: promises reach
the generator; constraints distinct from ability; progression toward unfamiliar real
music; musically convincing material; adaptive selection from observed reading needs. (5)
Lesson and teaching content: one concept at a time; concrete things to see, hear, feel and
notice; teacher-like instruction; no software language; teaching separate from success
criteria; no visible templates; no absolute claims; coherent sequencing; exercises and
repertoire that reinforce the concept; the voice of a knowledgeable teacher. (6) Musical
and pedagogical quality: every feature judged as music, independently of the
implementation; unverifiable marked unverified. (7) Repertoire and musical identity: why
this piece; progression; preferences without a filter bubble; stylistic exposure; genre as
an experience, not a tag. (8) Score and practice UX: maximum readable notation; read-ahead;
peripheral next music; no stretching; stable state; portrait and landscape; screenshot-level
verification.

Not all of it in Wave B. After B, the plan holds explicit waves for the learning and
evidence architecture, content and generator quality, PDMX, repertoire and excerpts, lesson
curriculum and content, musical identity and style, and a final pedagogical and UX audit;
the grouping may change for dependency, the areas may not disappear. For each area:
diagnose first, then the smallest defensible change, verify, continue. A master backlog
maps every original problem to diagnosed / decision / wave / verified.

The north star: **the audit is not complete when the architecture is correct; it is
complete when the resulting learner experience is substantially better.** An app a
competent piano teacher could look at and say: the material is musically sensible, the
teaching progression makes sense, the feedback is honest, the practice adapts to the
learner, and the interface supports actually learning to play.

===== PART 6: THE REVIEWER'S VERDICT ON WAVE B, AND THE GO FOR C0 (2026-09-25) =====

Wave B is a success. The four fixes are substantially sound; T37's distinction between
measured and unmeasured evidence, the sight-reading promise tests, and T38's outcome-based
distortion checks are the right kind of fixes. Keep the distinction between chain and CI
verification, visual verification, and musical verification: "chain green" is not full
learner-facing verification, and the matrix's "not seen on the owner's device; nothing
heard" is the right wording, not to be downgraded, and not to become a permanent status:
the later wave that can close a verification must close it. The window's design choices
are not settled by "the pictures chose run-off"; that stays provisional.

The six open choices: the tablet look-ahead precedence, the five-line floor, and run-off
versus compact are score UX policies to be resolved through the screenshot and device
audit, not C0. The no-input "0 %" is resolved now: it contradicts the truth rule Wave B
established. A sight-read heard before its first run does not consume the first
independent attempt, and a performance with a demonstration inside it is not treated as
an undemonstrated performance: both are evidence-definition questions that belong in C's
model, but their behavioural decisions do not wait for C0.

AT-15 stays exactly as planned: the existing tests are historical assertions to be
classified, not a contract the new architecture must preserve; Q14–Q17 and U42–U43 are
the worked examples. The methodology to keep: find the mechanism, make the smallest
defensible change, deliberately break the old test, rewrite it around the new invariant,
verify what can be verified, preserve explicitly what remains uncertain. Proceed to C0
after the final CI verdict; no further planning rewrite.

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

===== PART 9: THE REVIEWER'S FULL-TREE SWEEP (2026-09-27) =====

With the repository tool the reviewer enumerated the branch at 422e0cf (about 1,857 tree
entries: 56 UI source files, 26 audio, 24 engine, 17 data, 14 score, 11 curriculum, 10 import,
8 MIDI, 7 PDF, plus the Python content and PDMX toolchain and its tests). The conclusion: the
app is more feature-packed than the discussions credited; the problem is increasingly not
"build more features" but "turn all these features into one coherent teacher". Nothing in the
sweep interrupts C4.5; everything below goes into the later waves.

Still standing from the earlier sweep: (2) content delivery will outgrow precache-everything
(core offline: app, soundfont, curriculum, lessons, essential exercises, starter repertoire;
cached or downloaded: PDMX excerpts, larger repertoire, collections, projects, upcoming
material); (3) `ScoreViewportPlan` as a real abstraction: musical and visual facts + viewport +
preference + practice context → a pure plan that OSMD renders, testable without the renderer,
and the basis of portrait karaoke; (4) layout understands musical density, not only geometry,
but renderer density is never pedagogical difficulty; (5) audit every notation surface, not
only the score renderer (OSMD score, drill staff notation, chord charts, PDF, keyboard strips
and ribbons, lesson-embedded notation); (6) a real-hardware truth corpus: the same
performances through the HP-130's MIDI, the phone microphone and perhaps a third route, then
compare the learner-facing conclusions — the diagnostics system already supports MIDI
inspection, mic diagnostics, latency calibration, acoustic loopback, raw captures, render
timing, analysis cost and device reporting; (7) generator separation: musical knowledge →
pedagogical recipe → realiser → structural validator → pedagogical validator →
musical-quality evaluator; (8) generator identity and cache (family + specification + seed +
generator version); (9) the generator microscope; (10) a real-phone threshold for huge
MusicXML first render, with excerpt files, segmentation or preprocessing rather than whole-
score parsing; (11) the laptop deserves a deliberate experience, but separate device
capability from interaction context (at the piano with hands occupied: giant controls,
hands-free lifecycle, minimal tapping, notation priority, continuity; planning and browsing:
repertoire discovery, progress analysis, skill map, lessons, projects), never phone = playing,
laptop = analysis.

Missed before seeing the tree: (12) MIDI import is a potentially major product feature — the
browser-side transcription reads arbitrary MIDI, keeps two-track hands, splits one-track
performances, merges ambiguous tracks, estimates key, respells, chooses quantisation grids per
bar, detects and de-swings swing, handles repeated notes, slices into writable rhythms, fills
rests, writes MusicXML, reads it back, verifies nothing was lost, checks bar durations and
reports what could not be represented; the workflow "bring me music I care about → convert
and analyse → what is usable → sections into a project, excerpt or plan", with transcription
uncertainty visible and provenance and confidence carried, never silently canonical; (13) a
substantial harmony and improvisation teacher already exists (chord identification, charts,
live matching, backing loops, bass, drums, comping, swing, modes, chord-scale, extended
chords, Roman numerals, transposition, ear tunes, dictation, trading fours, generated calls);
build no new harmony feature — integrate into one strand: hear tonic and dominant → recognise
chords → play symbols → I/IV/V → transpose → charts → scales over chords → comping →
constrained improvisation → call and response → trading fours → repertoire and jam; (14)
trading fours is underused; its result rightly is not evidence today; later an improvisation
evidence grammar (form, entry, phrase length, continuity, chord-tone targeting, scale fit,
motif reuse, register, response), never "72 % improvisation accuracy"; (15) the backing loop
is infrastructure, not the finished accompaniment experience: pedagogical backing (clear,
exposes harmony and rhythm) is a different audio design from musically satisfying backing;
(16) chord charts need the hands-busy audit too; the audit spans Score, Chord Chart, Drills,
Jam and trading, PDF, Free Play; (17) ear training as a progression (hear → imitate →
identify → sing or anticipate → find on the keyboard → recognise in repertoire → use in
improvisation), not games of growing length; (18) the chord-dictation silence threshold
(about 120 ms, helped by expected-next-chord membership) is a measurement, not a construct —
segmentation carries confidence in the eventual evidence audit; (19) the hand split should be
user-correctable, the correction saved and reflected in rendering, demands, difficulty and
assignments; (20) imported-score difficulty (the TypeScript port with parity tests) must not
resurrect "Level 4, therefore appropriate": estimated level plus measured demands; (21) PDF
system detection (ink profile, staff lines, systems, barline reasoning, user correction
persisted) makes "Follow my PDF" viable: system navigation, automatic progression, timer,
bookmarks, goals, never pretending to know the notes; (22) no full OMR until the non-OMR PDF
experience is excellent; (23) diagnostics become a guided setup ("Play these notes. Good. I can
hear your piano. Now I'll measure the delay. Done."), the technical screen kept for
troubleshooting; (24) `devicePreview.ts` exists: H extends it into a device-matrix harness
(342 × 740, ~412 × 915, both orientations, tablet, laptop, short laptop, browser chrome and
keyboard) rather than another simulator; (25) the test infrastructure is richer than credited
(four Playwright configurations, an on-demand full render workflow): extend, do not invent;
(26) the content toolchain (archive search, PDMX quarry, shortlist and review, fingering and
Hanon extraction, Kern, MuseTrainer, ABC, authoring, checks, difficulty fitting, render
validation, licensing, rung audits, ladder reports, truncation scans, video checks, notation
analysis, demand extraction) becomes one developer-facing workbench; (27) E evolves the
existing `tools/content/pdmx/` package into the excerpt workbench, not a new pipeline; (28)
content provenance universal (where from; transformations; measured, inferred or supplied;
analyser and generator versions) as an E-level invariant; (29) an external recommendation as
its own object type, distinct from playable catalog content; (30) a content-source decision
policy: choose the kind of experience first (controlled drill, generated exercise, generated
study, sight-reading phrase, PDMX excerpt, full repertoire, ear drill, chord chart, jam or
trading, PDF project, external recommendation), then the content; (31) evidence grammars
differ by experience (sight-reading; technique; ear; harmony; improvisation; repertoire; PDF
and external) and one learner model consumes all without pretending they are measured alike;
(32) feature-packed means composable experiences with a reason, not a menu of 37 modes; (33)
hands-busy as a cross-cutting interaction context (playing / between attempts / browsing)
governing auto-start, count-in, cues, control visibility, accidental taps, continuation,
notation changes, feedback timing and settings lock; (34) audio cues as the hands-free
channel; (35) voice control not yet; (36) MIDI gestures as commands, opt-in, outside judged
windows, never letting musical input become UI input by accident; (37) free play feeding the
teacher descriptively, never a score, much later; (38) keep the parity tests, demote the
scalar level's authority; (39) documentation supersession hygiene (current / superseded /
historical); (40) decompose the giant modules only when H or X works the area, along
conceptual boundaries; (41) help as contextual support in three kinds (operate; what the
musical thing means; why the teacher assigned this); (42) setup ends by proving the practice
loop; (43) accessibility audited in the playing state; (44) performance budgets per device
class, the owner's phone primary; (45) don't build everything now — record the requirements in
their waves.

The 17 consolidated additions and the overarching sentence — *the finished teacher chooses an
experience before it chooses an item; features are teaching tools, not destinations* — are
mapped row by row in `sweep-2026-09-27-mapping.md`. The reviewer can now read the exact
reviewer packet, enumerate the branch and inspect the implementation and tests directly.

**The strategy review (2026-09-27, before C4.5's packet).** The reviewer read the mapping, the
post-B plan and rules, the new and strengthened rows, and Part 9. Verdict: the incorporation
is strong and substantially faithful; none of the 45 observations dropped; the five
qualifications accepted (E14 gated on demonstrated pressure; hardware capture batched around
the owner; audio cues that discriminate themselves from piano and metronome; MIDI commands
opt-in and never accidental; Free Play observation opt-in, visible, later); M7 as the gate is
correct. Four corrections, all applied: (1) C5 does not own L67 or L68 — it remains the
focused retirement of the old progression semantics via L8/L9/S8; improvisation evidence and
chord-dictation confidence come with their experiences; (2) R33/R34 split — E owns import
truth (conversion reliability, uncertainty, provenance, correctable hands, measured demands,
a trustworthy content object), X owns the learner workflow (bring me music I care about, the
correction UX, usable sections into projects and practice); E is never the whole import
product wave; (3) E14's gate made measurable — during E measure install and precache bytes,
install and update cost, storage behaviour on the target phone and the projected
excerpt-corpus size, then keep or trigger; (4) one balancing rule on experience-first —
selection responds to evidence, curriculum intent, retention and transfer, learner goals and
well-rounded exposure (L26), not merely remediation of the weakest measured skill. Otherwise
the placements and weighting stand: do not reopen C0–C4; do not interrupt C4.5; no duplicate
harmony, PDMX or test infrastructure; the scalar level demoted, not deleted; provenance an E
invariant; hands-busy a cross-cutting X concept; M7's freeze retained. The strategy
incorporation is reviewed; the C4.5 implementation packet remains a separate review.

**The C4.5 review (2026-09-27, against 4921646, file-first).** The reviewer read the checkpoint
and both diaries, then the named unit and e2e tests and the evidence, demand-reading,
reader-control, generator-contract and `readingOffer` code. Verdict: the architectural repair
is successful enough to keep; do not redesign C0–C4.5. The original failure is genuinely
repaired: demand-local evidence preserves overlap without asserting cause; selective
contrasting observations identify a relevant demand; ambiguous observations stay ambiguous;
the reader adapts the supported demand rather than backing out the last-added dimension; the
tests drive generated phrases through the real engine and evidence path. The thirty-day
trajectory is materially better; the later 3.1 density and "Now with a leap" are later
curriculum and generator-quality questions, not reasons to reopen the evidence repair. Do the
bounded follow-up before C5; both P1s are real: (1) S29 — extend the contract from single
control moves to composed recipes the live reader can reach (not the Cartesian product):
recipes reachable by legal reader transitions, representative accumulated combinations at
every served rung; every promised demand detector-confirmed, untaught demands absent,
impossible or unreliable combinations explicit to the reader rather than silently generated
differently; (2) L72 — the hands-together opportunity must mean meaningful two-hand
coordination (onset or left-hand change), not every right-hand event over a sustained note,
with regressions that distinguish sustained accompaniment from genuine coordination and keep
legitimate two-hand evidence. On L76: yes in principle to a discriminating read — ten days of
"not sure yet" is honest but pedagogically passive — but not in this repair: it is a distinct
diagnostic-probe experience, not remediation (persistent ambiguity → deliberately isolate one
competing demand while holding the established ones → ordinary observations and evidence →
adapt only if the probe discriminates; the learner-facing line must not claim the diagnosis
beforehand); record and design now, implement after C5 unless S29's work makes it essentially
free. C5 remains next after S29/L72. One packet defect reported: `docs/pending-review.md`
appeared empty to the reviewer's tool at 4921646 — the file is intact (16,481 lines, about
1.7 MB, larger than the tool fetches); Entries 74–77 are copied into
`docs/prompts/entries-74-77.md` for the packet. The verdict is provisional until the chain and
CI on 4921646 finish; any failure is reviewed as a fix, not overridden by this review. After
S29/L72: rerun the skip learner, the two-hand skip learner, the ambiguity adversary and the
composed-recipe contract; if green with the chain and CI, proceed to C5.

**The reviewer approved 3c6c098** as the correct response to the C4.5 review: S29 and L72 as
C4d before C5 with the distinctions kept (reachable composed recipes, not the Cartesian
product; coordination, not sustain); L76 designed without inventing its threshold; the record
file authoritative with the companion copy; L73–L75 rightly C5's. No further direction: let
the verification finish, then C4d does exactly S29, L72 and the four reruns, then a review
before C5. The chain over 4921646 finished green on all twenty-three steps after this.

**The reviewer approved C4d** (file-first at d31be56, and abc277a checked to hold only the dormant C5 brief): verifications 1 and 4 hold; S29 and L72 accepted as substantive repairs of the demonstrated mechanisms; S30 to D; the composed walk to be described as representative, not exhaustive. C5 may start with one clarification, applied to its brief: keep skill evidence separate from rung and item credit — evidence observed on 2.2 informs the learner's skills everywhere; satisfaction of a rung's requirement is what is scoped to the judging rung; the old item credit across rungs disappears. "This is the point where the project moves from the adaptive reader reasons honestly to the whole curriculum uses that evidence as its authoritative progression model."

**The C5 review (2026-09-26, at d06d7b7, file-first).** Not released to C6/C7 yet. L9 and S8 are
closed to the reviewer's satisfaction; the one-path progression architecture is accepted
(`rungState` is genuinely the derivation, generated reading acquires no piece semantics, the old
count and pass machinery is deleted, the cross-listing tests are substantive: every
multiply-listed exercise and song in the built curriculum, the Petzold case, the two-ear-drill
1.5 regression, the two thirty-day trajectories on the real derivation, carry-over stored apart
and never making a rung met, carried concepts as exposures weaker than measured learning). The
carry-over decisions stand. Two findings first: (1) `done` is not judging-rung scoped — `runs`,
`reads` and `measure` read the rows judged by the rung, `done` searches the learner's whole
history and accepts any row with `missed === 0`; used at 0.1, 0.3 and 0.4, uniquely listed today,
so no present exploit, but it contradicts C5's invariant; prefer scoping it and add an
adversarial test, or make the exception explicit; (2) the production evidence job cannot reach
its "item gone" exclusion, because it enumerates sessions from the current catalog's items; a
historical row whose item is gone is never enumerated; fix the enumeration and report path with
a test through `runEvidenceJob`. Keep the `phraseMatches` limitation live and prominent with the
generator-version work: a regenerated phrase differing only where the learner supplied no early
note can match and be recomputed. After the two fixes, rerun the focused C5 tests and the
relevant chain and report; then C5 closes and C6/C7 start.

