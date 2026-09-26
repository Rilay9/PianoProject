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

**The C5 close (2026-09-26, the reviewer, file-first: the checkpoint, Entry 79, `rungState`, the evidence job, the retirement and S8 tests, both fix-forwards; the C6/C7 commits checked to be documentation only).** C5 closes. C6 may start. L8, L9, S8 and the one-path exit criterion are satisfied: observations → evidence → skill ladder → rung requirements → rung state → progression, with the old item-pass and count path retired rather than operating beside it. The two boundary fixes accepted (`done` judging-rung scoped, the tour's originating rung preserved; the evidence job enumerating the sessions store independently of the catalog). The skill/rung distinction verified in the code: skill evidence is the learner's globally; only run, read, done and measure requirements are judging-rung scoped. Keep L80 at P1 as provenance: generated material must carry enough identity and version to reproduce or refuse historical material; `phraseMatches` must not grow into a substitute. One correction to C6 before it runs: review needs two distinct reasons — skill retention (a skill's evidence not shown recently) and repertoire retention (a learned piece worth keeping playable even when its skills were shown elsewhere); if the calendar is retired, an honest provisional repertoire-retention rule replaces its role and the reason distinguishes the two. The gallery's two contrast findings belong to the later accessibility work. "C5 makes years-long use more feasible because progression is no longer based on consuming a finite number of items."

===== PART 10: THE REVIEWER'S CONTENT AND PEDAGOGY AUDIT (2026-09-26, while C6 ran) =====

**Bottom line.** The current lesson content is not trustworthy enough to ship unchanged as the
teaching voice of the finished app. Good curriculum thinking is mixed with incorrect facts,
dubious technique prescriptions, arbitrary numerical standards, stylistic stereotypes,
unsupported historical claims and confident generalisations that sound authoritative. The
owner's instinct that there was no way to know whether the previously "fixed" content was
correct was justified: the earlier audit asked whether lessons describe the app, its scores
and its curriculum (98 lessons, 323 issues, 236 corrected) and deliberately left theory,
musical judgement, history and unverifiable claims unresolved. The tree now holds 109 lesson
files; 85 substantive findings from that audit are still open (47 musical or pedagogical
judgements, 18 theory issues, 16 unverified claims, 4 historical claims). An independent pass
across every curriculum family, looking for pedagogical absolutes and pseudo-precision, found
the larger pattern.

**The biggest defect: unjustified certainty.** Useful heuristics are upgraded into laws —
"there are exactly two ways", "the only way", "every", "never", "the main reason", "almost
every beginner", "the single most useful", "this is what most music does", "if X happens, Y is
the cause". C-position's one-finger-per-key is right inside the exercise and dangerous as a
fact about piano fingering; curved fingers and a natural hand are legitimate introductions,
but "flat fingers are the main reason beginners cannot voice two notes differently" is an
unjustified causal ranking. The pattern runs through beginner, technique, practice, theory and
style lessons.

**Factual errors.** The early rhythm lesson says quarter, half and whole notes are arranged so
each is "twice the one below it" — backwards as printed. The dotted-note lesson says the
add-half rule applies to every dotted note — false once double dots appear. The anacrusis
lesson says the missing beats of an incomplete opening bar occur at the end — a convention, not
a rule, and the app's own *When the Saints* does not do it. The half-pedal lesson teaches that
holding the damper pedal partway "clears the treble while the bass keeps ringing"; half
pedalling changes the degree to which the dampers engage the strings, partially damping the
sound; selectively sustaining already-held notes is a different function — the learner is given
the wrong mental model of what the foot does.

**Technique needs an expert rewrite**, not copy-editing: the octave rule (1–5 white keys, 1–4
black keys, "in both hands") is too prescriptive; repeated notes "always" with descending
alternating fingers; fast Alberti "requiring" rotation categorically; thumb crossings as "the
only moment worth watching"; fixed fingering "not a suggestion"; difficulty diagnosed from one
symptom. Piano technique involves the fingers, wrist, forearm and arm together, changing with
tempo, loudness, task and anatomy; Wave F rebuilds technique instruction against a defensible
framework rather than making the lessons friendlier.

**Safety** is directionally good (pain awareness early stays) and overconfident: injuries
"almost always" from practising through warnings, fixed warm-up prescriptions, four 20-minute
sessions "superior" to one of 80 — the literature supports taking playing-related problems
seriously (loading, long sessions, recovery, ergonomics, hand size) and emphasises
heterogeneity and limited causal evidence. "Pain means stop and reassess" is useful; "this is
almost always how injuries happen" is not.

**Practice pedagogy** is good in concept (chunking, looping, slow practice, distributed
practice, interleaving, returning to hard material, critical listening, changing method when
stuck) and dogmatic in execution: five perfect repetitions; three clean before a tempo rise;
roughly half speed; 5 % increments; one mistake means go backward; session proportions; review
intervals; three causes for every plateau; "slow practice is the only tempo at which you can be
accurate on purpose". Strategies, not laws. Interleaving: "can improve retention and transfer
even though practice feels less fluent" is defensible; "markedly better retention a week later,
the only timescale that matters" is not.

**Theory** is structurally sound at the base (intervals, scales, key signatures, triads,
inversions, Roman numerals, dominant function, secondary dominants, cadences) and wrong as it
advances: tonicisation versus modulation "differs by length" (establishing a new tonic, often
through cadential confirmation, is central; a tonicisation can span measures); "every minor
seventh takes Dorian … not opinions" teaches chord-scale theory as harmonic fact; the modes
lessons make colour descriptions deterministic ("Mixolydian never pulls home"); 18 theory
claims from the old audit remain open.

**Jazz and blues** need the biggest de-stereotyping: swing "≈ 2:1" as the definition (ratios
vary, including with tempo); blues as three blue notes + dominant sevenths + twelve bars +
shuffle; "all three chords are dominant sevenths and the tension never resolves, which is the
point"; "the blues is mostly space"; "every boogie bass since is a copy"; what "most 1920s
bridges" do; stride definitions; fixed chord-scale assignments. Keep the activities
(call-and-response, space, guide tones, chord symbols, comping, form, blues-scale vocabulary,
walking bass, transcription, trading); rewrite the explanatory prose.

**Classical** has the strongest repertoire integration (concept, then hear or use it in a real
piece) and presents historical-performance conventions as rules: stepwise Baroque notes legato
and leaps detached; particular ornament realisations; upper-note trills; rubato with one hand
strict; the pedalling Romantic music "wants"; fixed melody–accompaniment dynamics. Starting
points, labelled as such; interpretation becomes choice informed by style, score, instrument,
edition and listening.

**Pop, rock, hymn and gospel, Latin, ragtime**: one texture promoted to the essence of a
style (power chords as "almost every heavy piano part"; sus and add9 as "the sound of most pop
piano"; gospel devices generalised; several Latin traditions compressed around clave and
tresillo; categorical ragtime and stride rules) and unsourced historical claims. Wave G includes
style-authenticity review, not only more genre exercises.

**Ear training** has a strong skeleton (recognise → imitate → identify → reproduce → harmonic
hearing → dictation → the ear in improvisation) and sometimes substitutes memory games for
musicianship: Simon is auditory memory, not the universal answer; interval-song mnemonics are
scaffolding, not the endpoint. Long-term: tonal context, scale degree and function, bass
motion, chord function, phrase prediction, singing, transcription, repertoire.

**Improvisation** may be the best-written strand (one note → rhythm → space → call and
response → motifs → pentatonic constraint → blues → guide tones → harmonic improvisation →
reharmonisation → composition), avoiding accuracy percentages; overclaims remain ("nothing can
sound wrong" over a pentatonic collection; deterministic chord-scale language; universal
reharmonisation rules) — refinement, not reconstruction.

**The long-term ceiling.** The authored curriculum ends at Stage 9, some tracks earlier, some
lessons saying nothing is above them. Fine for a course, not for the lifetime model: do not add
Stages 10–50; after the authored foundation, progression becomes open-ended through repertoire
projects, generated technical work, authentic excerpts, reading, ear and transcription, harmony,
improvisation, arranging, accompaniment, composition, performance preparation and retention.
Early on the teacher determines most of what is needed; later it diagnoses weaknesses,
maintains strengths, selects projects, broadens musicianship, challenges interpretation,
preserves repertoire and exposes blind spots. An advanced learner does not "finish piano"; the
nature of the teacher changes.

**The change to the master plan.** Do not interrupt C6. Before Wave F begins, F is redefined:
not "rewrite weird lesson prose" but **pedagogical reconstruction and verification of
learner-facing teaching content**, with twelve acceptance gates: (1) factual correctness —
theory, notation, history, instrument behaviour and app behaviour independently verified; (2)
technical defensibility — technique advice allows legitimate variation and avoids unsupported
biomechanical diagnoses; (3) epistemic honesty — fact, convention, heuristic, interpretive
choice and personal or style preference are written differently; (4) no fake precision —
repetitions, ratios, tempos and percentages need a real pedagogical reason; (5) no unjustified
absolutes — always, never, only, every, exactly, the reason, the fix receive explicit review;
(6) musical authenticity — style lessons teach vocabulary and listening without reducing a
tradition to stereotypes; (7) experience before explanation — hear, play, notice first; name
and explain second; (8) transfer — a lesson uses its concept somewhere other than the drill
that introduced it; (9) individual variation — fingering, anatomy, interpretation and technique
are not falsely standardised; (10) long-horizon compatibility — concepts stay useful as
repertoire advances rather than beginner rules to unlearn; (11) source discipline — historical,
medical, biomechanical and empirical learning claims get real sources when doing factual work;
(12) the teacher test — a competent piano teacher could say the sentence to a student without
adding "well, actually".

**Priorities.** P0/P1 before the content is called authoritative: the half-pedal explanation;
unsafe or over-rigid technique prescriptions; the remaining outright theory errors; misleading
injury and medical certainty; unverified app claims surviving from the old audit; fixed swing
definitions presented as fact; the tonicisation and modulation explanation; chord-scale theory
as universal harmony; any incorrect score or fingering the earlier audit identified. The F
rewrite: practice methodology, beginner fingering language, dynamics and balance
prescriptions, historical-performance rules, stylistic generalisations, interpretation prose,
arbitrary mastery numbers, pseudo-scientific causal claims. Mostly preserve and refine: keyboard
geography, foundational notation, basic scale, triad and key-signature instruction, the
intervallic reading concept, repertoire integration, the ear-training architecture, the
improvisation progression, chord-symbol literacy, transposition, call-and-response, motif
development, sight-reading as genuinely unfamiliar material.

**One permanent design rule for the content pipeline.** A validator proving that a lesson
agrees with the app does not prove that the lesson is true. A theory checker proving that the
notes are legal does not prove that the exercise is pedagogically good. A generator satisfying
its constraints does not prove that its output is musical. Three different verification layers;
the hole through which so much material was "fixed" while the owner stayed unsure whether he
was being taught correctly.

**Scope limitation.** Whether every repertoire file and generated exercise sounds musically
good cannot be certified from a code and text audit; that is the later workbench's and actual
listening's. "Claude should not enter Wave F thinking 'clean up 109 lessons'. It should enter
thinking 're-earn our right to teach every important claim'."

===== PART 11: THE REVIEWER'S GENERATOR AND CURRICULUM-SHAPE AUDIT (2026-09-26, while C6 ran) =====

Diagnostic only; nothing here disturbs C6. **The generator** is far more developed than a
typical one — roughly 56 families in the invariant suite (scales, arpeggios, chords and
inversions, Hanon, chromatic work, rhythm, coordination, interval reading, position shifts,
cadences and accompaniment, pedal, repeated notes, trills, rotation, articulation,
independence, voicing, syncopation, jazz harmony, stride, blues, Latin patterns) — with
unusually good mechanical testing (bar count, key, which hand sounds, register, chord span,
rhythmic content, spelling, printed directions, fingering in some families, MusicXML export,
renderability, and tests that go red when scores are deliberately corrupted). The suite itself
says its checks prove a generated score is valid and matches what its family claims, not that
the music is worth playing; that distinction becomes central to D. Concrete concerns: two
open-voicing shapes ask one hand to strike a 14- or 15-semitone chord and are exempted in the
invariants as an unresolved content decision — a structural validator blesses what a teacher
would question at once; the pedal family's marks have produced collisions and ambiguous
rendering with no semantically correct visual solution yet; several earlier generator bugs
(wrong modal content, a left hand in the wrong register, a wrong stated length, misplaced
printed text, spelling) were found only by looking at rendered music while structural
validation passed. The existing infrastructure can support a serious musical validator; it is
not one.

**The old comprehensiveness review** had already named holes (upper-level sight-reading,
rhythmic independence and polyrhythm, advanced pedalling, transposition, learning by ear,
upper-level improvisation, memorisation, performance practice, practice methodology,
dynamics, articulation, voicing and tone, ornaments, upper jazz, blues, pop harmony, theory,
improvisation); much was built since. The lesson: comprehensiveness answered by adding
another family, rung or track produces a gigantic checklist, not a coherent musician; the
experience-first teacher is the better answer.

**Against an external musicianship framework** (the MTNA essential-skills outcomes:
internalised pulse, literacy, physically efficient technique, audiation, creative work through
improvisation, composition, harmonisation and playing by ear; and its teacher-assessment
expectations of repertoire, technique, theory, keyboard musicianship, ensembles, ear training,
creative work, sight playing and transfer between activities), the app now covers surprisingly
many categories; its weakest area is **integration and transfer**: "you struggled reading
thirds → a controlled thirds exercise → a fresh sight-reading phrase containing thirds → an
easy real excerpt containing thirds → later thirds met naturally in repertoire → verify the
improvement transferred" is qualitatively better teaching than five features all containing
thirds. **Sight-reading's direction is strong** and matches that framework (unfamiliar, easier
material; pulse maintained; pattern and chunk recognition; reading below prepared-repertoire
difficulty; accompaniment, rhythm and chunking contributing; improvisation and ear training
associated with reading); reading should later connect to rhythm, keyboard geography, interval
recognition, audiation, harmony and improvisation, which C0–C4's demand architecture is
positioned for.

**A new requirement for D: three independent validators**, and every generated item passes
all three — (1) structural validity (renders; bars, notation, MusicXML, hands, rhythm right;
largely exists); (2) pedagogical validity (isolates or trains the intended skill; what other
demands it introduced; difficulty appropriate; physical requirement reasonable; useful for
acquisition, practice, transfer or assessment; partly missing); (3) musical validity (would a
competent teacher willingly put it in front of a student: phrase shape, intentional harmony,
purposeful repetition, music rather than randomised legal notes, convincing cadences, accents
and contours, pleasant or interesting enough to repeat; substantially missing) — a family can
pass the first and fail the other two, which is exactly C4d's structurally valid, ugly day-28
phrase. **A fourth gate for technique exercises: physical plausibility** — not whether the
pitches can theoretically be struck but whether the requested movement is appropriate for the
intended learner and objective: simultaneous span, repeated-note fingering, thumb crossings,
register, leaps, velocity, duration and repetition, and whether the exercise's supposed
technical solution is itself defensible; it catches the 15-semitone one-hand voicing.

**Difficulty** still needs major work: the monotonicity tests (two hands not easier than one;
more octaves not easier; minor not easier than its major; faster not easier) are sanity checks,
not a piano difficulty model; E reduces level to a sorting and banding summary and the teacher
thinks in reading demands, rhythmic demands, coordination, physical and technical demands,
harmonic familiarity, musical and interpretive demands and learner-specific familiarity, never
"a 5.2 learner plus a 5.1 piece".

**The curriculum's shape**: by the intermediate stages there are core, classical, blues, jazz,
pop and chords, theory, technique, improvisation, ragtime, Latin, rock, hymns, holiday,
practice, jam — great capabilities, a terrible linear syllabus if the learner feels obliged to
complete all of them. G's model: **Foundation** (reading, rhythm, keyboard fluency, technique,
ear, harmony, creative work); **Projects and interests** (classical repertoire, jazz, blues,
rock and pop, ragtime, Latin, hymns, personally meaningful songs); **teacher-selected
cross-training** (what the learner did not choose but needs). Love rock without becoming a
rock-only pianist; study classical seriously without every Latin and ragtime branch.

**Underweighted: audiation** — hearing the notes on the page, connecting eye, ear, mind and
hand, as a first-class longitudinal ability: look at a phrase → imagine it → sing or tap it →
play it; hear a phrase → reproduce it → identify its pattern → find it in notation; look at a
cadence → predict its sound → play it; read silently → find where tension, release and arrival
should fall. **Underweighted: ensemble and collaborative playing** — the app has accompaniment,
backing loops, chord charts, duet-like play and trading fours; playing with others should not
stay implicit: duets with the app; accompaniment where stopping is not allowed; melody over
backing; comping beneath a melody; trading phrases; following a form; recovering after a
mistake; entering after rests; playing from chord symbols; accompanying an external singer or
instrument — valuable precisely because solo practice does not train them.

**The division now**: C makes the teacher's observations, evidence and decisions honest; D
makes generated practice pedagogically and musically trustworthy; E makes the authentic corpus
measurable, searchable and useful as teaching material; F re-earns the right to every important
teaching claim; G turns the capabilities into comprehensive musicianship and personal musical
development rather than a pile of tracks; X and H make the teacher excellent at the piano and
across devices; across all: years, retention, transfer, repertoire memory, changing goals, no
endpoint. The reviewer's next parallel audit, downstream of C6: repertoire and PDMX — whether
the ladder is musically sensible, the estimated levels believable, the corpus clustered by
stage or style, where excerpts beat whole pieces, whether arrangements duplicate or mislead,
and whether there is enough genuinely good music for years, not merely enough rows.

===== PART 12: THE REVIEWER'S REPERTOIRE AND PDMX AUDIT (2026-09-26, while C6 ran; at 5627570) =====

Downstream guidance for E and G, not a request to interrupt C6. The reviewer inspected the T36b
repertoire trace, the P14 quarry record, the PDMX tooling, tests and import path, the stage
files, the C0 vocabulary and excerpt design and the E/G backlog, and counted placements
directly from stages 0–9.

1. **T36b's diagnosis stands and is not redone in E**: the quarry measures a rich feature
   vector that mostly disappears before selection; a scalar can invert a musical ordering
   because tuplets, grace notes and coordination are absent or weak; a whole-piece scalar
   cannot answer whether a 4–8 bar section is appropriate; whole-piece placement by band is not
   a pedagogical assignment. **The corpus-wide problem is larger**: the curriculum makes
   pedagogical claims about PDMX pieces the pipeline has never established from the music.
   `import_pdmx.py::concepts_for()` derives only coarse claims (repertoire, single-line melody,
   folk tune, keys, hand crossing, wide span); it does not establish rootless voicings, a
   montuno, repeated-note fingering or four independent voices. Yet: `jazz.7` (rootless voicings,
   quartal colour, tritone substitution) lists PDMX Jingle Bells jazz, Skating, Avalon, Tiger Rag,
   I Got Rhythm, Fly Me to the Moon; `jazz.8` (9ths, 11ths, 13ths, modulation) three PDMX
   pieces; `jazz.9` (comping, walking, soloing on one tune, while its finder says to avoid
   written-out arrangements) six PDMX files; `latin` (clave, tumbao, montuno) Cielito Lindo,
   Guantanamera, Só Danço Samba, How Insensitive, Tico-Tico, La Cumparsita; `hymns` (four-part
   harmony with walking bass and passing chords) PDMX hymn and pop arrangements whose texture
   the import does not represent; `technique.4` (scales, arpeggios, controlled touch; "avoid
   repertoire pieces") three Lemoine études; `technique.5` (repeated notes with changing
   fingers, 2:1 coordination, dynamics) three Duvernoy; `technique.6` (broken sevenths, wrist
   rotation, voicing) Czerny Op. 299 Nos. 1, 3, 4; `technique.7` (double notes, thirds, sixths,
   octaves) Czerny Op. 299 Nos. 5, 8, 10. Some may be excellent; the data path does not prove
   it. E must not validate them against the rung prose that selected them; the notation
   establishes the opportunities, and physical-technique claims still need human review. **A
   valid file is not automatically a valid teaching assignment** — the repertoire analogue of
   D's rule.
2. **Dependence on PDMX is substantial**: 439 song-option placements across stages 0–9, 326
   unique ids, 236 PDMX placements, 203 unique PDMX items on rungs — more than half of all song
   placements. By stage: 1: 3/28; 2: 20/38; 3: 38/70; 4: 62/114; 5: 36/51; 6: 28/44; 7: 25/44;
   8: 11/24; 9: 13/25. Tracks: classical 49 of 88 unique song options; chords-pop 34/42; jazz
   25/26; hymns-gospel 20/23; latin 11/12; technique 12/12; holiday 22/29. E's demands and needs
   gate is a prerequisite for trusting a large fraction of the curriculum, not cleanup.
3. **"542 PDMX rows" is never a coverage argument.** The quarry itself showed why: 254,077
   archive rows became 37,499 after basic gates; deduplication alone removed 142,078; the
   survivors skewed to fiddle and ethnographic material; of the first 368 machine-valid results,
   90 were single-line references; the easiest band was the most dangerous (70 of 80 candidates
   melody-only lead sheets, 40 unrated or low-view junk, hence the `attested()` floor). Report
   adequacy in usable musical experiences: distinct works, distinct arrangements where the task
   changes, demand coverage, texture, rhythm, key, range and coordination coverage, authentic
   repertoire versus study versus lead sheet versus reference, whole-piece versus excerpt
   opportunities, human-reviewed quality, a strong application of the intended skill. Never a
   target of N pieces per stage.
4. **Replace the three-song floor** (R23): "at least one strong application experience when the
   concept benefits from application" — a whole piece, an authentic excerpt, a technical study,
   a generated study, a creative or harmony task, accompaniment, an ear or transfer task;
   further repertoire is depth and choice, never a validator quota; an evidence-driven selector
   must not be fed three mediocre choices because an old validator demanded three songs.
5. **The needs-versus-taught gate answers two independent questions**: can the learner cope
   with this material, and does it provide the opportunity the rung claims. For every option E
   knows: measured demands of the actual file or arrangement; derived needs; the target role
   (example, guided application, independent application, transfer, repertoire for its own
   sake); which target opportunities are present; important unintended demands; provenance and
   confidence; which claims are human-supplied. The validator refuses an assignment whose target
   opportunity cannot be established. "Contains repeated notes" is measurable; "teaches healthy
   wrist rotation" is not derivable from the notes.
6. **Excerpts matter more, not less** (R5, R7, the C0 design kept: own identity; parent and
   printed range; demands measured on the slice, never inherited; `cutFor` and context; a
   lead-in that can be unjudged; excerpt progress never completes the parent; evidence over the
   excerpt describes those bars). Mine windows for pedagogically meaningful opportunities
   (reading pattern, rhythm, coordination, texture, harmonic event, cadence, accompaniment
   pattern, leaps and range, chord shapes, independence, articulation or ornament where
   detectable) with **musical boundaries**: a slice that begins mid-anacrusis and ends before
   resolution is bad material. Score candidate cuts on pedagogical fit and on musical
   completeness; mining proposes, a reviewer hears the cut in context, sees why, adjusts,
   assigns the role, approves or rejects.
7. **A real transfer ladder** (S9): controlled generated material → generated study →
   authentic excerpt → unfamiliar authentic excerpt → full repertoire; not every skill needs
   every step; C's evidence then tests whether skill evidence transferred.
8. **PDMX is a quarry, never the curriculum**: the archive is opportunistic and skewed; the
   curriculum says what is needed and the corpus answers what authentic material can serve it;
   if nothing strong, use another source, author or generate a study, recommend external
   material, or leave the slot honestly unfilled; never widen a rung or weaken a requirement
   because PDMX lacked the piece (R21 stays useful).
9. **Breadth as musical-language exposure, not genre**: homophonic versus contrapuntal; melody
   and accompaniment; chordal; polyphonic; lead sheet; walking, stride, ostinato, broken-chord
   textures; duple, triple, compound, irregular metre; straight, swing, syncopated; tonal,
   modal, blues, chromatic language; accompaniment versus solo; improvisatory versus notated;
   historical and stylistic languages where provenance supports the label. Genre stays a
   browsing and identity label (the standing rule).
10. **Repertoire for its own sake**: distinguish skill application (needs a target-opportunity
    proof), repertoire development (honest prerequisites and reasons), exploration and
    exposure, and the personal project; this survives into G's "why you're playing this".
11. **Repeated placement is not progression**: 439 placements, 326 unique; Greensleeves chords
    8 placements, the easy Canon 7, Hot Cross Buns 5, Ode to Joy RH 5, the Petzold Minuet 5;
    each placement states why this encounter differs (preview → reading → coordination →
    interpretation → memory → performance → retention, or a new perspective); with C0's role.
12. **PDMX identity work is preserved** (the regression tests over opus and catalogue numbers,
    movements, keys and titles, easy arrangement versus full score, multiple uploads, misleading
    upload titles, deterministic edition choice; never title-string deduplication) and extended
    to the provenance model (R35): composition → arrangement → edition, upload or source →
    normalised score → excerpt; two uploads may be duplicate editions; an easy arrangement and
    the original are not pedagogical duplicates; two excerpts of one score are different
    experiences of one parent.
13. **Tempo provenance stays explicit** (R11; 176 rows defaulted at T36b): written tempo if
    present; the converter's default if supplied; source and confidence; whether tempo-sensitive
    demands are trustworthy; a practice tempo may be prescribed without calling a percentage
    "of written tempo".
14. **Human review is two decisions**: source and score review (usable, faithful,
    instrumentation, notation and rendering, identity, transcription errors) and teaching-use
    review (good for the claimed role, opportunity present, demands appropriate, cut sensible, a
    teacher would assign it); one `keep` bit never implies both.
15. **"Complete enough for years"** is a longer-horizon audit: worthwhile material across
    beginner, early intermediate, intermediate, late intermediate and advanced and across the
    major experiences; look for cliffs, not empty stages (forty pieces at one level with one
    texture; six advanced jazz uploads; hundreds of folk melodies; showpieces without the bridge
    from intermediate literature; a rock learner with a folder of arrangements but no route to
    musicianship); the question: could the app keep making worthwhile assignments after six
    months, a year, three years, with repertoire retained and interests changing; no terminal
    stage.
16. **Fourteen acceptance tests for E** (into Q8): an option cannot claim a target opportunity
    its measured content does not establish unless it carries an explicit human judgement with
    provenance; needs-versus-taught is checked against the actual arrangement, not title or
    genre; an excerpt's demands are recomputed on its slice and differ when the slice differs;
    whole Anh. 113 is refused for the Stage-3 role while its designed excerpt is accepted; genre
    and tags satisfy no requirement; defaulted tempo cannot masquerade as written; a repeated
    placement requires a role and reason per placement; composition, arrangement, edition,
    source and excerpt identity survive the build; a source-level keep validates no assignment;
    the inventory reports unique works, arrangements and demand coverage; a musically valid but
    pedagogically wrong option is rejected; a whole piece too demanding beside a coherent excerpt
    that fits proves excerpts are not truncated files; technique claims separate measurable
    notation from human claims about execution; output labels measured, inferred and
    authored or human-reviewed properties.
17. **Priority unchanged**: C6, C7; D; E; F; G; X and H. The correction to preserve for E: not
    "how do we maximise PDMX" but "what musical experience does the learner need, and which
    source or excerpt can honestly provide it".

Already covered by a standing rule or row, for the reviewer's question: genre never
difficulty, skill or style (G11, I7, held by rule since 2026-09-25); the converter's defaulted
tempo (R11, T37 built the flag; the reader is E's); the excerpt design (C0a §8; R5, R7); the
three-song floor (R23); the identity tests (R15's decision preserves them); PDMX as quarry not
syllabus (R6, R8, R25, M7's freeze).

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

===== PART 14: THE REVIEWER'S CURRICULUM, PROGRESSION AND MULTI-YEAR TEACHER AUDIT — THE SYNTHESIS (2026-09-26, against 3b39a6c) =====

The synthesis Part 13 waited for. Scope: all 109 lesson objects across Stages 0–9 and every
track, every prerequisite edge, every requirement kind, stage and track ordering, the default
active tracks, the estimated-day structure, `nextRecommended`, session anchoring, C5's rung and
skill state, placement and set-aside, and the existing plan and matrix rows; stress-tested
conceptually against seven materially different learner histories. Not a lesson sample. The
earlier content audit (Part 10) remains the claim-and-prose audit and Part 12 the
repertoire-source audit; this one asks whether the curriculum plus the learner model behaves
like a coherent piano teacher over months and years. The answer: most of the necessary
capabilities exist, the curriculum topology and predicates are transitional, and the finished
teacher cannot be a smarter executor of the existing rung graph. Part 13's messages stay valid;
this packet incorporates them. Instruction: record and reconcile, do not restart C6; a finding
that conflicts with an abstraction C6 or C7 is cementing is addressed now, the rest gets
explicit later-wave ownership; prefer consolidation over duplicate rows.

1. **Coverage is no longer the main problem.** The curriculum names notation and reading,
   rhythm and metre, keyboard geography, scales, arpeggios and chords, technique,
   sight-reading, ear, theory and harmony, transposition, accompaniment, chord charts,
   improvisation, composition, memorisation, interpretation, performance, several stylistic
   languages, ensemble-like work and repertoire. Future gaps are not answered by another track
   or family (M12 confirmed). The weaknesses: what counts as evidence of competence per
   domain; how parallel domains compose into one education; transfer between controlled work
   and real music; lifecycle behaviour over months and years; goals, projects and interests
   changing what matters today.
2. **C5 made the mechanism truthful, not the predicates complete** (Part 13 constraint 1; the
   counts verified there). The reconstruction audits every rung's requirements by "what
   ability does this rung claim changed, and what observation could establish that" — the
   curriculum counterpart of L24's grammars. Never a mechanical `runs` → `skill` replacement:
   some experiences legitimately have completion or application requirements; the predicate
   must match the claim. → L88 strengthened.
3. **The stage number is not a global piano level.** Core (27 lessons counted from the stage files) ends after Stage 4;
   Stages 5–9 are parallel strands; Stage 7 jazz is not a Stage 7 pianist, Stage 8 theory is not
   Stage 8 reading; finishing a specialist ladder advances no global number. `stageNumber` may
   remain a curriculum address and never returns through another door as the learner model,
   which is multidimensional competence plus repertoire and project history. → L85.
4. **The curriculum says parallel; `nextRecommended` serialises.** With fresh defaults core,
   classical, chords-pop, theory-ear, technique and practice are active, so file order can
   decide what the learner studies: a Stage-3 specialist unit can sit ahead of core 4.1;
   Stage-1 practice lessons behave as a block; C6 could anchor several slots on whichever
   position won. C6 need not build X's composer but preserves a strand-aware boundary, with a
   discriminating test: core, classical, theory-ear and practice all unmet, and file order
   alone cannot let one strand monopolise the session. Sent to the C6 builder. → L84.
5. **Prerequisites are clean but historical** (Part 13 constraint 4): readiness depends on
   demonstrated skills and demands; rung history is required only when the experience itself is
   prerequisite; E, G and F translate progressively. → L90.
6. **Practice methodology is longitudinal** (Part 13 constraint 5): a beginner's "chunk this
   measure" and an advanced player's practice strategy for a hard transition are one competence
   at two depths; F and X convert it into contextual coaching selected when the learner's
   behaviour or problem makes it relevant; the existing lessons introduce, never exhaust. → L91.
7. **Stage 9's prose and data contradict** (Part 13): finite instructional rung versus
   open-ended project becomes a real model distinction in G; a project has milestones and
   evidence without one terminal met. → L86.
8. **The repertoire and project lifecycle is a central long-term state machine**: discover →
   preview → try → save → learn → practise → polish → perform or record → maintain → refresh or
   relearn → pause or retire → return; not every piece needs every state; **refresh and relearn
   is added**: a piece learned two years ago and forgotten is neither new nor merely due for
   review — it has history, prior evidence, interpretation decisions and familiarity that shape
   relearning; this also resolves Stage 9. → R19 strengthened, R47 new.
9. **Long breaks need a re-entry policy**, not modelled anywhere in the plan: after six months
   the app must not assume old mastery is fluent, erase old achievement, restart at beginner
   material, or schedule an avalanche of overdue reviews; old history stays known, current
   fluency is uncertain, a small diagnostic sample across the important domains refreshes the
   readiness estimate, and targeted reacquisition follows only where needed; historical
   achievement and current readiness are related, not identical; the test: a proficient
   intermediate disappears for six months and returns. → I21 new (G, X).
10. **Placement and set-aside create latent curriculum debt.** `nextRecommended` returns to
    rungs behind placement and rungs marked "I already know this" once nothing ahead remains —
    honest as evidence, questionable for an experienced learner who should never be told to
    complete "Right hand C position". Distinguish unverified; bypassed by placement or profile;
    readiness actually depends on verifying this; evidence suggests a weakness worth revisiting.
    Placement defines where diagnostic sampling begins, never an eternal debt ledger; no
    fabricated evidence — later evidence in real music or diagnostics establishes the skills
    naturally; a long-horizon test. → L93 new (G, X; C5's set-aside kept, its return retired).
11. **Goals are a principle, not an object.** L22 balances goals but nothing models them: learn
    this piece; prepare it for a date; accompany a singer in three weeks; improve sight-reading;
    play from charts; return after years; build classical technique; improvise; practise N days a
    week; finish or record a composition. A goal has type, target or project, priority, optional
    deadline, status, the learner's reason, and can change or pause; a deadline legitimately
    alters Today's balance without falsifying skill evidence ("recital in 10 days" raises
    performance simulation, continuity, recovery and target-piece work and lowers exploratory
    breadth). → I20 new (G, X).
12. **Evidence grammars follow experience type** (L24, central): sight-reading (pitch, timing,
    continuity under first contact); technique (control, evenness, physical plausibility,
    range, tempo, consistency across repetitions); ear (recognition or reproduction without a
    visual answer, uncertainty where segmentation is heuristic); harmony (recognition,
    construction, transposition, use in context); improvisation (form, entry, continuity,
    constraint adherence, harmonic fit, motif and response — never accuracy %); memory
    (continue, restart, reconstruct without the score, arbitrary starts, structural memory);
    performance (continuity, recovery, interpretive goals, one take); repertoire learning
    (section state, problems, integration, performance and retention history); composition and
    arranging (constraints, intent, a finished artefact or process, never note matching). One
    learner model consumes all and never pretends they were measured alike. → L24 strengthened.
13. **Audiation longitudinal, not a quiz track** (I18, P1): hear → imitate; hear → find on the
    keyboard; see → imagine → sing or tap → play; hear → identify pattern or function; see
    harmony → predict → play; hear a phrase → reproduce → notate; recognise the function in
    repertoire; use what was heard in improvisation and accompaniment; connecting reading, ear,
    harmony and creative work. → I18 strengthened.
14. **Memory the same** (I12): score visible → partial prompts → a phrase from memory →
    arbitrary start → structural cue → no score → return after time; optional and contextual
    where stylistically appropriate, never every piece; memorising a piece and developing memory
    strategies are different goals. → I12 strengthened.
15. **Performance is an experience, not a harder tempo run** (X7, X8): no stopping, the full
    span, recovery, continuity, one take, optional recording, a pre-performance routine,
    reflection, no red-note coaching while playing; mock performances and deadline preparation
    in time; the "performance-mode" concept labels establish none of this. → X7, X8
    strengthened.
16. **Ensemble musicianship explicit** (I19): enter after rests, hold tempo while the
    accompaniment continues, recover without stopping, melody over accompaniment, accompany a
    melody or singer, comp beneath a part, follow a form, chord-chart playing, trading, call and
    response, duet-like playing; feeding continuity, rhythmic stability, listening and harmonic
    evidence where legitimately measurable. → I19 strengthened.
17. **Integration and transfer is the largest quality opportunity** (I17): a problem in real
    music → isolate → controlled practice → a fresh generated study → unfamiliar reading →
    an authentic excerpt → reintegrate the piece → verify transfer and retention later; not every
    step for every weakness; features stop being destinations — the single largest difference
    between feature-packed and a good teacher. → I17 strengthened.
18. **Breadth without fifteen courses** (M9, L26, R46): Foundation (reading, rhythm, keyboard
    fluency, technique, ear and audiation, harmony, creative work); Projects and interests;
    teacher-selected cross-training; no completion of every style; no preference bubble;
    exposure tracked by musical language and demands. → M9 confirmed, L26 strengthened.
19. **Musicality is not a checkbox** (M10): not a family completed after technique; expression,
    phrasing, listening, voicing, articulation, tone and style become how real music is learned
    and performed: execute → notice → shape → compare → justify → transfer that listening. → M10
    strengthened.
20. **Skill state and repertoire state stay separate, permanently** (C6's correction): knowing
    a piece's skills is not remembering the piece; forgetting a piece loses no skill; a skill
    mastered in several contexts leaves no old project performance-ready. → L94 (rule).
21. **Raw evidence is not the only permanent memory** (L87): the checkpoint preserves what
    ability was demonstrated, the standard and context, transfer and retention evidence, when,
    and the evidence-definition version; never an irreversible boolean; test beyond the pruning
    boundary. → L87 strengthened.
22. **Ten stress trajectories** for the H, G and X suite, each judged on the reason the teacher
    gives, not only the recommendation: A true beginner (foundation coherent, interests enrich,
    no overwhelm from every default track); B returning intermediate placed near Stage 3 (no
    Stage 0–1 debt; foundations diagnosed only when relevant); C uneven musician, strong ear and
    chords, weak reading (reading targeted, harmony not redone, never "beginner"); D classically
    trained transfer learner, weak charts, improvisation and ear; E style specialist, a year of
    rock and pop (identity supported, reading, ear, technique, harmony and unfamiliar language
    maintained); F long-break returner, six months or two years (calibrate and refresh); G
    deadline learner, a performance in two or three weeks (priorities change, performance
    simulation and recovery, essential cross-training only); H advanced multi-year learner, the
    ladder exhausted (projects, repertoire, reading, transcription, technique, interpretation,
    accompaniment, improvisation, composition, retention, blind spots; no "course complete"); I
    repertoire return, a piece from 18 months ago (prior learning recognised, a section
    diagnosis, refresh); J changing identity, classical for a year then jazz and accompaniment
    (history kept, projects and cross-training reshaped, no reset). → Q40.
23. **Wave ownership**: C6 and C7 preserve strand-aware boundaries, cement no global-rung
    semantics, keep long-term skill truth preservable; D trustworthy generated drills and
    studies; E measured authentic content and readiness and opportunity gates; F what the
    teacher says and what each instructional experience teaches, practice methodology contextual;
    G the primary owner of curriculum topology after the foundation, identity, goals, the project
    and repertoire lifecycle with refresh and relearn, re-entry after breaks, breadth, audiation,
    style authenticity, long-horizon musicianship; X session composition, experience-specific
    workflows and evidence integration, performance, memory, ensemble, contextual practice
    coaching, hands-busy interaction, goals on Today, causal feedback; H the trajectory suite over
    the finished product plus device, hardware and hearing audits. No new giant wave.
24. **Nine rows created or strengthened**, consolidated where a row existed: re-entry (I21);
    refresh and relearn (R47); the goal object (I20); placement and bypass semantics (L93);
    finite rung versus project (L86); the evidence checkpoint (L87); the requirement-quality
    audit over the 109 lessons (L88); the parallel-strand invariant with its test (L84); the
    trajectory suite (Q40).
25. **Not to fix**, preserved as strengths: C0's distinction between demand, target skill,
    evidence and curriculum address; global skill evidence against rung-scoped requirement
    satisfaction; self-report apart from measured evidence; placement fabricating no passes;
    transfer and retention as real concepts; PDMX as quarry; generated reading constrained by
    what is taught; the stylistic and creative breadth; the experience-first north star;
    explicit uncertainty over fake diagnosis. The problem is not too few piano features: the
    old authored curriculum is a large collection of rungs and the new evidence architecture can
    now support something better; the later waves turn the collection into a teacher.

**Bottom line**, the finished mental model: persistent learner history + current readiness +
curriculum intent + retention and transfer needs + active repertoire and projects + goals and
deadlines + musical identity + well-rounded exposure → the needed experience → suitable material
→ what to attend to → observe only what can honestly be measured → interpret it with that
experience's grammar → update skill and project history → the next experience. The authored rung
graph is one source of curriculum intent; it is not the pianist.

**Where this leaves the audits**: the reviewer judges a further curriculum audit not the best
next use of time — three directions (teaching claims, repertoire and PDMX, curriculum topology)
are converging. The next independent audit moves to the generated and sight-reading output, the
admitted blind spot: enumerate every family, generate representative and adversarial seed sets,
inspect distributions and actual notation, and separate structural, pedagogical, physical and
musical-quality failures. It prepares D (with Part 11 and G35–G40) while C6 and C7 finish.

**The reviewer's verification of the record (2026-09-26, at 162b4ea).** Incorporation approved:
no numbered Part-12, 13 or 14 finding dropped, materially weakened or changed in meaning; the
nine destinations and the consolidations confirmed (the reviewer notes they were "new rows or
explicit strengthenings", since L84, L86, L87 and L88 came from Part 13); the wave division
confirmed, with L90 and L91's moves consistent with it; the C6 addendum the right boundary when
sent; the six existing-rule claims confirmed as coverage, which means the concepts are
strengthened and tested in E and G, not reinvented. Two changes: (1) the C6 builder receives one
narrow L93 boundary — a rung bypassed by placement or profile, or set aside, is not new unmet
work merely because later work in the strand is exhausted; no placement diagnostics, no
fabricated evidence, but the new selector must not cement a backward walk through bypassed rungs
as debt, and records the boundary as not done if the architecture cannot avoid it — sent
2026-09-26; (2) L88 is owned by F and G, with D contributing the generated families' target-skill
and demand contracts; D does not own the general 109-rung requirement audit. On verification: the
prerequisite-graph claim (no missing ids, no forward edges) came from a complete enumeration of
the 109-lesson graph, not a sample, as did every structural claim in Parts 13–14 (every lesson,
requirement kind, stage and track placement and prerequisite edge); the learner-profile stress
tests are conceptual tests, not repository measurements, and stay described so. C7 item 5's
shape stays the builder's provided the implementation proves seven invariants (written into the
brief): pruning cannot erase established evidence; enough provenance survives (skill or demand,
conditions and standard, transfer and retention context, time, evidence-definition version);
recent contrary evidence still changes current competence; `notShownRecently` still means current
uncertainty; historical mastery is never an irreversible boolean; backup, restore and later
evidence-version work preserve or refuse the historical claim honestly; the prune-boundary test
exercises the actual persistence path, not a helper.

===== PART 15: THE REVIEWER'S GENERATED-CONTENT AND SIGHT-READING AUDIT (first notes 2026-09-26; completed the same day against a72b15b) =====

**First notes**, sent while the audit ran (the stale numbers among them are retired by the completed packet below):

- From the repository's own sight-reading trace (`docs/prompts/traces/2026-09-25-sight-reading.md`,
  counts over seeds 1–500 per level, on the generator as it was at Wave A): at level 2, 74 % of
  phrases had a quarter-or-longer event beginning off the beat; levels 3–4, 98–100 % — syncopation
  written below the rung that teaches it (S26 strengthened; S26 had the levels 3–4 half of this);
  the tie-closing pass can create intervals beyond the intended leap cap (S26); levels 6–7
  produced malformed triplet-rest notation in 87–89 % of sampled phrases (S2, built by T37 after
  the trace — the audit re-checks on the current generator before D inherits the number); phrases
  frequently finish without a convincing rhythmic arrival (S7, G9).
- Musical coherence is not decorative polish after the "real" reading constraints: pianists
  read intervals such as octaves as visual patterns and fluent reading proceeds through larger
  units; tonal structure affects sight-reading performance and pianists visually process harmonic
  predictability in notation. Generated material without phrase structure is not appropriate
  reading material (G9, S7: coherence is a requirement of the family, with a reader's read).
- The distinction being worked out for D: a legitimate canonical drill (a Hanon pattern being
  repetitive is not a defect) against material that promises to behave like music (a generated
  sight-reading phrase with no phrase structure is a defect). The family classification will say
  which promise each family makes.

**The completed packet.** A corpus-wide structural audit of the generated-content system: all
56 generator families in `test_generator_invariants.py` enumerated; the invariant architecture and
family promises inspected; the traces, the vocabulary design, the curriculum integration and the
matrix cross-checked; the runtime sight-reading generator, its seven levels, nine shipped rows,
promise tests and the historical 500-seed trace inspected; representative and adversarial musical
behaviour reviewed where notation or code establishes it. Not a claim that a human heard every
generated score: the space is unbounded, and heard validation stays a D and H human-review
requirement. The verdict: the generator is not fundamentally bad and is not thrown away; its
structural testing is unusually strong; structural correctness, musical usefulness, physical
plausibility and pedagogical role are still conflated, and D separates them with the abstractions
C0 already designed rather than another redesign.

1. **Stale findings retired — D starts from the current tree.** The triplet-rest figures (87 %,
   89 %) are historical reproduction evidence for S2, fixed by T37, whose promise test generates
   levels 6 and 7 repeatedly, checks every rest inside a triplet carries its tuplet and checks
   that triplet rests were met. The off-beat percentages at levels 2–4 (74 %, 98 %, 100 %) predate
   T37's `metricPlacement` for levels 1–4 and its promise tests on the absence of syncopation
   below 4.5: historical, not a D defect (S26's evidence relabelled; its tie-closing leap stays
   open). The 36-item 3.8-second broken-seventh failure is repaired (the family repeats its
   sixteenth figure to clear the five-second floor); no open row, none reopened. The black-key
   arpeggio and seventh fingering defects have dedicated tests and the policy prints no fingering
   on unverified shapes (G30's sweep stays; the old defects are not carried).
2. **The 56-family invariant suite is preserved** (bar count, key and signature, hand presence
   and silence, register, chord span, spelling, rhythm, printed directions, fingering where
   appropriate, MusicXML and export properties, family promises; the mutation census proving
   checks go red). It admits its boundary — a structural promise proves neither good music nor
   good teaching material — and D extends it, never replaces it (G22, G40).
3. **C0's architecture is used, not reinvented** (G14, G23): musical knowledge → pedagogical
   recipe → realiser → structural validator → pedagogical validator → musical-quality evaluator;
   `role?: canonical | variable | transfer` (G25); the interval-reading worked example is the
   family-contract pattern to generalise across the 56 families.
4. **Every family has an explicit pedagogical contract** (G1, G3, G4, G17, G8): primary target
   skill; legitimate secondary target skills; prerequisites and assumed demands; required
   opportunities with a minimum useful density; forbidden and unintended demands; physical
   constraints where applicable; role; whether it promises a drill or pattern or music-like
   material; what measurement could support evidence; what the app does not measure. The build
   measures the generated MusicXML with the canonical detectors, never trusting parameters or
   titles: `maxInterval: 3` is a constraint to verify, not evidence of an opportunity.
5. **Four distinct gates**, each applied as the promise requires (G23): structural validity
   (the suite); pedagogical validity (enough opportunity for the target skill, no unprepared
   demands, an appropriate combination, useful for its role — acquisition, practice, transfer,
   assessment); physical plausibility (simultaneous span, fingering, repeated-note solution,
   thumb crossings, register, leaps, velocity and tempo, duration and endurance, a defensible
   physical solution); musical validity only to the degree the family promises music — a scale,
   Hanon figure or chord drill is not a miniature composition; a sight-reading phrase, study,
   groove, accompaniment or style exercise is judged as music. Useful repetition is never
   penalised; random legal notes are never accepted as music.
6. **Open voicings, the concrete physical failure** (G38): the quartal shape asks one hand for
   C4–F4–B♭4–E♭5, 15 semitones; add9 reaches 14; the suite exempts them because the tables
   define the voicings and a pianist would split them. The exemption is not a waiver: D resolves
   the teaching intent — redistribute between hands, a narrower physically appropriate
   arrangement, or an advanced large-hand voicing declared with its physical prerequisite and
   alternatives. A structural exemption never means pedagogically acceptable.
7. **Canonical, variable and transfer become data** (G25): canonical teaches the model; variable
   changes the realisation and keeps the constraints; transfer changes surface and context enough
   to establish generalisation; never inferred from different ids or seeds. The worked example's
   admission — fixed C-position material cannot establish transfer to other positions — is the
   normal honesty. Not every family provides all three; a scale generator supplies canonical and
   variable practice while an unfamiliar passage or excerpt supplies transfer; no family is
   contorted into fake transfer to fill a schema.
8. **Family variety is not progression** (G18, G26): the round-robin in `add_technique_units.py`
   solved a catalogue problem; the learner eventually meets an intentional sequence — canonical
   model → isolated controlled practice → variable practice → combination → changed key, position
   or context → transfer material → authentic excerpt → later retention and transfer check — driven
   by target skill, demands and role, never another quota.
9. **Sight-reading is different**: since T37 and C4 key, metre, hands and tempo reach the
   generator; promises can be required or excluded; untaught demands are excluded; phrases are
   checked by the same demand vocabulary; one dimension moves at a time; seeds reproduce; phrases
   stay unseen; triplet rests and beaming have regressions — all preserved. Its remaining problem
   is musical phrase quality, not validity (S7, S18, G9): legal rhythmic cells plus a constrained
   melodic walk, chord-tone snapping at 5–7 useful but not phrase structure. S7 covers:
   convincing beginnings; rhythmic arrival; phrase ending; contour; local repetition and
   variation; a motif or recognisable cell where appropriate; tension and release; cadence or
   plausible closure; excessive oscillation; excessive arbitrary repetition; rest placement and
   breathing; the balance of predictability and novelty. The qualitative finding stays (phrases
   that stop rather than arrive); the pre-T37 percentages do not.
10. **Readable music, not random difficulty** (S7, G9): readers use patterns, interval shapes,
    rhythmic grouping, tonal expectation and harmonic structure, so a coherent phrase can be
    better reading material than a random one with the same nominal demands; D rejects the
    assumption that unpredictability is better practice — the goal is unseen, not structureless.
    **And not over-composed**: one four-bar template with one cadence teaches the generator; D
    builds a grammar and distribution of plausible phrase behaviours, tested across seeds, never
    one golden template.
11. **Constraint satisfaction apart from candidate quality** (G20): hard constraints first
    (required demand present, forbidden absent, taught material only, range, metre, key, physical);
    then valid candidates scored for soft qualities (phrase shape, arrival, contour, repetition
    and variation, density, rest quality, harmonic agreement, awkwardness, pattern degeneracy);
    chosen deterministically from the seed; soft preferences never brittle invariants.
12. **Distribution tests, not only example tests** (G22): over large deterministic seed sets,
    report and bound key, metre, interval, rhythmic-event, rest-density, repeated-note,
    contour-diversity, phrase-ending, opportunity-density, accidental, range, hand-pattern,
    rejection-rate, candidate-score and near-duplicate distributions; a family can pass every
    single-file invariant with a terrible distribution.
13. **Minimum opportunity density** (G3): presence (at least one), useful practice density,
    overconcentration (motor looping that stops testing reading or transfer); thresholds
    family-specific, never one universal percentage.
14. **The generated study is the missing middle** (G19, G16): 8–16 bars combining one target
    skill with known supporting demands, built on the same recipe, realiser and validator
    architecture with a stronger musical promise than a drill; never a generic random-melody
    machine; where phrase grammar and candidate scoring earn their complexity.
15. **Interval reading stays a priority family** (G7, G10): canonical interval shape → multiple
    starting notes → other positions and registers → other keys → fingering support reduced →
    an unfamiliar generated phrase → an authentic excerpt → natural occurrence in repertoire; a
    new seed in the same C-position family is never transfer; rung 3.4's material must create
    the away-from-middle-C opportunity.
16. **Technique assessment says what was measured** (G8): a structurally perfect five-finger
    pattern can be played unevenly; if only pitch and timing are measured, tone, evenness and
    ease are not claimed; every family carries an assessment declaration — what can be judged,
    from which input, at what precision, what stays unjudged.
17. **Style generators need narrower claims** (G11, T42–T45; no new rows): generated objects
    are named by what they are — a I–V–vi–IV loop, a i–♭VII–♭VI–♭VII vamp, son clave, a tumbao
    pattern, a ii–V–I progression, a root–fifth–octave texture — and F and G own where, how
    often and in which traditions they occur; no genre theory in a title, docstring or catalogue
    fact. **Groove and style families** (clave, tumbao, montuno, Latin groove, boogie, stride,
    comping, walking bass, secondary rag, modal vamp, riff, ostinato) make a stronger promise
    than a scale and are reviewed for it: idiomatic enough to teach under this name, the rhythmic
    relationship right, the hands making musical sense, the register plausible, the groove
    surviving repetition, a vocabulary fragment not presented as the whole style; where code
    cannot establish idiom, marked for human hearing (G32, G29).
18. **Human review, made efficient** (G28, G29, E16): the workbench shows per candidate the
    rendered notation, audio, family, seed and version, target skill, role, measured demands,
    required and forbidden constraints, physical flags, musical-quality metrics, curriculum
    destinations, GOOD / BAD / FIX with reason and category; humans concentrate on physical
    defensibility, musical shape, stylistic authenticity and usefulness; the LLM triages and is
    never the final judge.
19. **Identity includes the pedagogical specification** (G21): family + recipe + seed +
    generator version; a changed recipe never lets an old seed mean different music while the
    learner's history treats it as the same encounter.
20. **Difficulty stays multidimensional** (G2, G26): never a smarter single number; demands of
    reading, rhythm, coordination, physical, harmonic, interpretive and assessment kinds;
    `levelEstimate` a sorting summary as C0 specifies; selection on demands and readiness.
21. **`generate_exercises.py` is not split for size** (G13): split where it creates clear
    ownership of musical facts, family recipes, realisation, validators and contracts.
22. **The implementation order**: preserve the census; one authoritative family-contract table;
    populate `targetSkills` and `role`; measure generated demands with the canonical detectors;
    required and forbidden demand checks and useful-density checks; the physical gate with
    `open_voicing` first; classify every family drill versus music-like; musical-quality
    evaluation only where promised; the sight-reading phrase grammar and selection under S7 and
    G9; large-seed distribution tests; the microscope with notation and audio; the generated-study
    middle only after the validators are trusted; canonical → variable → transfer into curriculum
    and session selection; the complete family review recording heard against inspected. Never
    begin by adding families.
23. **Twenty acceptance tests** → Q41.
24. **Not rebuilt**: the census; mutation testing; the fingering tests; the sight-reading promise
    and absence tests; reproducible seeds; the demand vocabulary; C0's contract design; the three
    roles; the skill, demand, evidence and address distinction; the reader's one dimension at a
    time; honest refusal of impossible combinations.
25. **Bottom line**: a mechanically well-tested content factory not yet made into a
    pedagogically typed and musically reviewed teaching system. D's job: say exactly what each
    family is for → prove the output provides that opportunity without unintended demands → prove
    the physical request is defensible → apply musical standards proportional to the promise →
    state what the app can measure → connect the material into canonical, variable and transfer
    experiences → use human ears where notation and code cannot settle it. Sight-reading is the
    strongest test case: structurally honest now, its next layer is readable phrases.

**The reviewer's next audit**: the teaching experience around exercises and practice — from
"the teacher noticed a problem" → the appropriate exercise → controls, mode, tempo, hands →
attempt → feedback → retry or change → return to music; whether the C and D architecture becomes
a piano teacher rather than a sophisticated content selector (X's ground).

===== PART 16: THE REVIEWER'S TEACHING-LOOP AUDIT — FROM A NOTICED PROBLEM TO THE RETURN TO MUSIC (2026-09-26, against 29e3914) =====

The path traced: recommendation or originating musical problem → why this activity → the
Score, Drill, Lab or Jam, chord-chart, PDF or paper experience → hands-on-piano setup → run →
measurements → summary → Again, slower, faster, weak-bar loop, Done → the stored observation →
the later recommendation; with the different evidence capabilities of Score, Drill, Lab and Jam,
chord chart, PDF and Free Play compared rather than assumed alike. The question: can the app
behave like a teacher who notices a problem, forms a cautious hypothesis, prescribes a useful
intervention, watches the result, changes course when necessary, and returns the learner to the
music to see whether it worked? Today, not yet. The verdict: the toolbox is already strong
(Wait, Keep tempo, hands focus, Duet, Rhythm only, sections, loops, the weak-bar loop, slower
and faster, the tempo ladder, metronome, Hear it, the one-bar preview, Blind, Performance,
keyboard guidance, generated exercises, drills, Lab and Jam, charts, PDF, sight-reading,
repertoire, backing tracks) and the engine already records enough (per-step outcomes, wrong
pitches, misses, early notes, per-measure hot spots, timing deltas, pitch and timing apart,
hands, loop, mode, input, technique measures, provenance, what was and was not judged) — C1–C5
made that consumable. The deficiency is orchestration: tools the learner chooses, not
interventions with a reason and an exit criterion. Most ingredients exist in L19, L32–L34, L76,
L91, X5, X14–X18 and I17; one abstraction is missing.

1. **L19 becomes a causal coaching pipeline with an explicit epistemic boundary.** The app may
   say "bars 12–13 had three misses and two late entries" when measured, and "the transition
   into bar 13 may be the problem" as a hypothesis; never "your left hand is weak" or "you don't
   understand the rhythm" without a discriminating observation. The grammar: what happened →
   what it might mean → what we will try → what result would distinguish the hypothesis; under
   ambiguity, "I'm not sure whether the leap or the rhythm is causing this; let's hold the rhythm
   simple and test the leap" — better teaching than confident misdiagnosis. → L19.
2. **L76's probe is a general principle**: persistent ambiguous difficulty → isolate one
   plausible demand holding the others stable → observe → update only if the probe discriminates
   → otherwise preserve uncertainty; telling pitch-reading from rhythm, one hand from
   coordination, note acquisition from tempo, a leap from its neighbours, decoding from
   fingering, rhythm from synchronisation, memory from motor execution. Probes only when the
   distinction would change the intervention and ordinary evidence stays ambiguous, never after
   every mistake. **When diagnosing, change one important thing** (the practice twin of C4's
   reader): not tempo, a hand, the span, the key, the rhythm and guidance at once, or the
   learner improves and the teacher learns nothing; remediation after diagnosis may combine
   tools freely. → L76.
3. **The missing abstraction: the practice episode** — a transient teaching object, not a
   hierarchy, carrying the originating item or project; the passage, section or bars if known;
   the triggering observation; candidate explanations; confidence or ambiguity; the practice
   intent; the selected intervention; the changed settings and why; the exit criterion; the
   attempts; the result; the reintegration target; the reintegration result. Example: origin
   Nocturne bars 11–13; observed a repeated late or missed left-hand entry at bar 12;
   hypothesis a transition or leap, not yet established; intervention bars 11–12 left hand at
   60 % until three clean entries; then both hands, same span; then bars 9–14 in context; result
   stable in context, still unstable, or inconclusive. The schema is the builder's; the concept
   is necessary — without it the app remembers runs and skills and forgets why this run
   happened. Usually short-lived: most episodes close after a few attempts; enough history is
   kept to answer what strategies helped this piece before, whether this problem recurs,
   whether isolated success transferred back, whether the learner is repeatedly stuck on one
   demand; the live state stays light. → X19 (new).
4. **Practice intent above modes** (X5): learn the notes, solve the rhythm, coordinate the
   hands, fix a transition, build tempo, build continuity, shape dynamics and articulation,
   memorise, test memory, prepare a performance, sight-read, listen and analyse; the teacher
   translates "I keep breaking at the left-hand leap" into loop, left hand, 50 %, ladder off;
   the learner may override. **Every intervention has an exit criterion** drawn from the
   intervention, the skill and the learner's state — three clean starts into the transition,
   two clean loops without slowing, the rhythm right twice before restoring pitch, each hand
   once then together, the phrase twice without stopping, one random start per section, the
   whole piece once without restart — examples, never one global "three times". **The smallest
   useful change**: ±10 % is a manual control, never the universal adaptation; an intervention
   may need a small or large tempo cut, Wait, rhythm-only, no metronome, hands apart, a shorter
   span at the same tempo, or one isolated demand with everything else unchanged. → X5.
5. **Isolated success is not the end** — the most important requirement: play → notice →
   diagnose or probe → isolate → practise → combine → reintegrate → later transfer and
   retention; a clean exercise does not solve the repertoire problem, a clean left-hand loop
   does not establish both hands, a clean slow passage does not establish continuity in
   context. **Reintegration in stages**: problem bar → bar plus entry → phrase → surrounding
   section → full piece → later cold return; the section metadata, loops and history become
   teaching tools. **A failure path**: easier version, a different probe, a different strategy,
   a prerequisite exercise, generated targeted material, an easier authentic excerpt,
   explanation or demonstration, defer and return — repeated failure of one prescription is
   information about the prescription. **A too-easy path**: restore context, raise one demand,
   move to transfer, mark the intervention unnecessary, continue the project; no forced quota,
   especially for returning and uneven learners. → L34, I17.
6. **"Loop the weak bars" overclaims its prescription.** Verified at `ScoreScreen.ts:3538`:
   the action takes the hot spot with the most damage and loops that printed bar plus the
   next. The extra bar is often good teaching, but the evidence did not say why it is needed:
   isolating the damaged bar, practising the entry into it, and practising the exit after it
   are three interventions. Keep the button; the coaching layer chooses the span by the current
   hypothesis or calls it a generic "bar plus connection"; transition trouble is never inferred
   from aggregate bar damage. **Again, Slower −10 %, Faster +10 %, Loop, Done are mechanics,
   not coaching**: preserved as manual controls; a teacher-selected intervention says why ("the
   notes were mostly right, but the beat broke in bars 8–9; same notes, one step slower, to test
   continuity"; "clean twice at this tempo; one step faster"). → L34, X5.
7. **Hands-separate is prescribed, not ritualised**: F reviews the prose that starts almost
   every piece hands apart; X uses it when one hand does not know its material, coordination
   obscures a secure hand, the accompaniment needs automation, or fingering needs stabilising;
   when both hands are secure apart and fail together, more hands-apart is the wrong
   prescription. **Strategy is contextual** (L33, L91): chunking when the span is too large,
   slow practice when execution is unstable, rhythm-only for timing, hands apart for isolation,
   overlap and next-note practice at boundaries, backward chaining for endings and connections,
   random starts for memory, mental practice for memory and audiation, recording for
   performance and listening, interleaving when several skills are stable; F owns correctness
   and wording, X when and how it appears, G its revisiting across years. → L33, L91.
8. **Different experiences, different exit evidence** (X14): Score, measured pitch, timing and
   continuity where available; technique, only what the input measures — tone and ease are
   not inferred from pitch accuracy; ear, recognition or reproduction under no-visual
   conditions; improvisation and Jam, form, continuity and constraint adherence where
   measurable plus reflection, never note accuracy; PDF and paper, practice time, page or system
   progress, the learner's report, microphone or MIDI evidence only where genuinely connected,
   never notes it could not observe; Lab judges nothing today and can still be an intervention
   whose completion is practice or reflection; Free Play, optional descriptive observation,
   never compulsory grading. The episode orchestrates without making the grammars identical.
   **Self-report** (Rough, OK, Clean) is evidence of experience, never proof of competence:
   did it feel easier, was it comfortable, did the strategy help, ready to try it in context —
   never rhythm, tone, technique or notes; used without laundering into mastery (the standing
   rule since C5). → X14, L19.
9. **Repertoire is the origin and destination of many episodes**: real musical problem →
   targeted practice → return to real music; exercises are never destinations because they are
   easier to score; thirds in a piece → original passage → controlled thirds exercise → variable
   phrase → original passage → later fresh excerpt; the reason line keeps the relationship
   ("this is here because bars 18–20 of the piece were giving you trouble", never "practise
   thirds"). **D and E connect here**: a generated exercise is selected from an episode's need
   (target demand, readiness, role, physical envelope, controlled variables) rather than browsed
   among 1,183 items; E's excerpts bridge controlled drill → authentic short context → the
   learner's own repertoire; complementary roles, not competing catalogues. → I17, X19.
10. **Hands-busy: the between-attempts state strengthened** (X15): playing — no prose changes,
    no surprise controls, no intrusive diagnosis; between attempts — one concise result and one
    recommended next action, hands on the piano; browsing — full explanation, alternatives,
    history and settings; no paragraph of pedagogy while the learner is poised to replay a loop.
    **Hands-free is not fully automatic** (X16, X17): automatic continuation for loops,
    prescribed attempts, immediate reintegration, call and response, accompaniment, with
    predictable stop points — ready cue → attempt → completion cue → short result → the next
    attempt when the prescription calls for it, with an obvious stop; non-verbal cues before
    voice; MIDI gestures optional, only outside judged windows, opt-in, learnable, impossible to
    trigger through normal playing — a low A in the piece never means "repeat". → X15–X17.
11. **The coaching layer is surface-independent**: never a giant ScoreScreen conditional; an
    episode may move repertoire Score → generated exercise → Drill → Lab → original Score, or PDF
    → a rhythm intervention → PDF, or chart → chord drill → chart with backing; each surface
    reports what it knows; the episode owns purpose and sequence. **Two scales**: L32's session
    composition ("what do we work on today and why do these belong together") and the episode
    ("what are we doing about this problem right now") are not collapsed; a session holds
    several episodes plus sight-reading, maintenance, creative work or an easy fluency
    experience. → X19, L32.
12. **Progress eventually remembers strategies, not only scores**: this transition responded
    to overlap practice; this piece loses continuity in the development; left-hand-only helped
    and failed on reintegration; random starts repaired memory; tempo was restored after slow
    work; this skill transferred to a fresh excerpt — historical context for coaching, never
    deterministic rules about the learner. → X19, G.
13. **Twenty-five acceptance tests** → Q42.
14. **Wave ownership**: D trustworthy intervention material and contracts; E excerpts and
    measured opportunities; F correct practice-method teaching and wording; G long-horizon
    strategy, projects, lifecycle, transfer and retention; X the primary owner of the episode,
    causal coaching, intent, orchestration, reintegration and the between-attempt flow; H
    real-device and learner-trajectory proof that it feels like practising at a piano rather
    than operating software.
15. **Bottom line**: not more practice features — the loop: notice honestly → a cautious
    hypothesis → discriminate if necessary → the smallest useful intervention → tell the learner
    why → practise with a clear criterion → adapt if it fails or is too easy → restore musical
    context → verify the fix survived → later check transfer and retention. The glue is the
    transient episode that remembers why the learner left the music and takes them back.
    Without it the product is an excellent adaptive exercise selector.

**The reviewer's next audit**: ear training, audiation, harmony, improvisation, accompaniment
and creative musicianship as one connected longitudinal strand (I18 and its neighbours) — whether
it develops a musician over years or stays a collection of good modes.

===== PART 17: THE REVIEWER'S MUSICIANSHIP AUDIT — EAR, AUDIATION, HARMONY, IMPROVISATION, ENSEMBLE, ARRANGING, COMPOSITION AS ONE LONGITUDINAL SYSTEM (2026-09-26, against 29e3914 with the D0 draft) =====

0. **A correction to the D0 draft, made before dispatch.** The draft called
   `tools/content/demands.py` the build-side twin of `app/src/demands/detect.ts` and asked the
   agent to diff the two over the 56 families. That is not C2's architecture: the script's own
   header says the definitions are the TypeScript detectors, that it runs score files through
   `app/tests/unit/demandsOfFiles.test.ts` under Vitest and reads back the ids, that a second
   implementation would be the level model's two ports again, and that nothing in the build
   calls it yet; `docs/03-content-pipeline.md` says a demand has one definition and it is the
   app's; the C2 entry says one implementation. Verified at the lines. The parity hypothesis is
   deleted; the useful test is a bridge regression — generated outputs through the script return
   exactly the ids the detectors produce — and then the canonical path across every family. A
   literal reading of the draft could have created or normalised two implementations and undone
   one of C2's strongest decisions. Otherwise the reviewer reads D0 as very good: the contract as
   data, drill apart from music, the three roles, the physical gate apart, a new seed never
   transfer, musical evaluation left to the later briefs.

1. **Verdict.** The app holds far more musicianship machinery than its learner-facing structure
   shows: interval, major and minor, chord-quality, seventh-quality, cadence and progression
   hearing; melodic and harmonic dictation; ear-tune reconstruction; Simon; rhythm dictation;
   chord and inversion construction; Roman numerals; secondary dominants; modes; chord-scale
   drills; extended chords; transposition; accompaniment patterns; charts; backing loops; blues;
   comping; walking bass; form tracking; call and response; trading fours; improvisation;
   listen-back; arranging; reharmonisation; composition; Free Play; duet and accompaniment. Not
   another pile of features: the deficiency is integration. The app teaches nouns — interval,
   cadence, numeral, scale, chord, mode, progression, transposition, motif, form — and a musician
   needs them as representations and uses of one heard relationship: hear it → anticipate it →
   sing or tap it → find it → identify it → see it → play it → transpose it → accompany it →
   improvise with it → recognise it in repertoire → create with it. Confirms I17, I18, I19,
   T21, T22, L24, M10 and the G and X plan.
2. **The curriculum's long arc is preserved**: theory-ear from intervals and I–IV–V through
   cadences and inversions, sevenths, progressions and modes, Roman numerals and harmonic
   dictation, secondary dominants, modulation, whole-form hearing and transcription;
   improvisation from a small note set through call and response, blues, changes, modes and
   guide tones, colour, reharmonisation, composition; chords-pop toward accompaniment,
   transposition and arranging; jazz toward comping, walking bass, hearing changes, extended
   harmony; jam toward form-following and trading. The strands advance beside one another
   instead of converging.
3. **I17 is the central musicianship invariant**: important musical knowledge eventually
   appears in multiple modalities and real musical contexts; a concept is never "learned"
   because its isolated drill passed. The V–I example: hear tension and resolution → sing the
   resolution → find the bass movement → identify V → I → construct it in several keys → read it
   → predict its sound → accompany a melody containing it → recognise it in unfamiliar
   repertoire → improvise into the resolution → transpose it → use it in an arrangement; not
   every concept traverses twelve steps. I17 with L24, no subsystem.
4. **Audiation is a real longitudinal ability** (I18, T22, M10): sound ↔ internal hearing ↔
   notation ↔ keyboard ↔ function; hear → imitate, sing, find; see → imagine, sing or tap, play
   after imagining; hear → identify pattern or function, locate it in notation; see a cadence →
   predict its sound; see a phrase → anticipate arrival, tension and release; hear → reproduce,
   notate; recognise a function in repertoire; use the heard relationship in accompaniment and
   improvisation; living in reading, repertoire, harmony, improvisation, accompaniment and
   composition, not only Theory & Ear.
5. **Auditory memory apart from ear musicianship** (T22, L24): Simon exercises sequence memory
   and a longer chain establishes no tonal hearing, scale-degree function, interval recognition
   in context, harmonic hearing, anticipation, transcription or playing by ear; literal echo
   tests reproduction, not tonal understanding. Ear-experience roles, named honestly: auditory
   memory; echo and reproduction; tonal-pattern hearing; interval hearing; scale-degree and
   function hearing; harmonic hearing; prediction and audiation; dictation and transcription;
   playing by ear; transfer into repertoire; creative use. Never ten permanent learner scores
   because ten roles are named.
6. **`earTuneDrill` shows why** (T22, I18, D's contracts): a diatonic random walk with the last
   note forced to tonic, whose comment (`app/src/engine/drills/harmony.ts:256`) calls it the
   shape of every folk melody the ear knows — not a defensible generalisation; random diatonic
   reconstruction can test short-term pitch memory without teaching function, phrase, motif,
   expectation, cadence, scale-degree hearing or chunking. Not made prettier: D and G decide
   what an ear-tune item is for — memory said as memory; tonal audiation generated from a tonal
   phrase grammar with scale-degree function and phrase structure; transcription preparation
   from increasingly authentic phrases and then real excerpts.
7. **Ear training progresses toward authentic music** (T22, I17, E, G): controlled tones and
   patterns → short tonal phrases → familiar tune fragments → unfamiliar coherent phrases →
   authentic excerpts → the learner's repertoire → external music and other musicians; never
   "eight random bars, but longer"; at height the challenge is real phrase structure, harmony,
   bass motion, inner voices, form, repetition and variation, modulation, texture, extracting
   information from actual music; E's excerpts serve ear training too.
8. **Playing it back and writing it down differ** (L24, T22, F): theory 9 asks to hear eight
   bars three times and write them down, while the machinery is MIDI reproduction; reproduce by
   ear, identify function, play bass and chords, notate rhythm, notate melody, a lead-sheet
   reduction, a full transcription are distinct; "dictation" is never awarded because MIDI notes
   matched; without notation entry the app says it can check the played reconstruction and
   writing it down is an external task, a self-report or a project milestone.
9. **Harmony moves label → sound → function → use** (T21, I17): what is it called, what does
   it sound like, where does it go, build it, recognise it in another key, transpose it, voice
   it, use it under a melody, hear it in repertoire, improvise through it; Roman numerals unify
   the tasks across keys; drills are not flash cards with MIDI answers.
10. **Chord-scale work stays a constrained exercise, never harmonic truth** (F0, T21, L24):
    `chordScaleDrill` can prescribe Ionian over a maj7 and mark Lydian wrong because the table
    chose one scale — its own comment knows it; the honest contract is "practise this specified
    mapping", never "find the scale that fits"; later, context, alternatives, chord and guide
    tones, tension choices; one mapping table is never universal harmony.
11. **Extended-chord construction is not voicing** (T21, G38, L24): the drills require every
    chord tone, useful as "spell the complete theoretical chord", not "voice this idiomatically";
    spell → hear quality → identify function → choose essential tones → voice physically →
    voice-lead → comp in context; connects to D0's physical contract.
12. **Harmonic dictation's segmentation is uncertain evidence** (L68, kept): the 120 ms chord
    boundary and the next-expected-chord heuristic are measurement machinery, confounded by
    rolled chords, slow attacks and expressive timing; record segmentation confidence and never
    read an uncertain split as certain failure. No new row.
13. **Improvisation develops constraints, listening and intention, not correctness** (L67):
    the strong ideas kept — few notes, rhythm and silence, call and response, motif and
    variation, guide tones, changes, reharmonisation, listen-back, trading — become a clearer
    progression of creative constraints: pulse and form, phrase entry, phrase length, silence,
    rhythmic continuity, motif reuse and development, register, chord- and guide-tone targeting
    where relevant, tension and release, response to a call, recovery after losing the form;
    never "improvisation accuracy 82 %". **Objective apart from interpretive** (L67, L24):
    measurable — entered in own bars, stayed in form, stopped in the partner's bars, rhythmic
    continuity, range, a repeated motif detected, chord-tone incidence where harmony is known;
    not machine-judged — interesting, expressive, tasteful, phrasing, space, style; reflection
    and listen-back for those, never fake objective scores.
14. **Listen-back is pedagogically central** (L67, M10, X, G): "listen once without playing;
    pick one phrase you would keep and one place the line lost direction", then "another chorus
    keeping the phrase and changing only the weak area" — play → listen → reflect → revise,
    not play → score; for improvisation, arrangement and composition.
15. **Ensemble musicianship gets an explicit progression** (I19, X14, X15) on machinery that
    exists (Duet, backing tracks, accompaniment, charts, the form tracker, trading, call and
    response, walking bass, comping): entering after rests, keeping time while another part
    continues, not stopping after an error, recovering the form, listening while playing,
    balancing, accompanying rather than dominating, following symbols and a form, cueing and
    counting in, trading, responding, adapting register and texture to leave space — ensemble
    musicianship even when the other musician is software. **Role awareness** (I19, L22, X5):
    play the melody, accompany it, comp behind a solo, supply bass or omit it, fill or leave
    space, play from a chart, a complete solo texture — the teacher says which role the learner
    occupies, in "why you're playing this" and the intent. **Trading fours trains listening**
    (L67, I19): turn boundary → stay in form → a short coherent phrase → deliberate silence →
    reuse something from the call → vary and respond → a conversation through a chorus;
    motif-response detection not required before it is reliable.
16. **Arrangement is a bridge discipline** (R20, I17): melody, bass, chords, voicing, texture,
    rhythm, register, form, transposition, ear and style combine; one tune moves melody only →
    melody and roots → block chords → an accompaniment pattern → chord-symbol realisation →
    reharmonisation → intro and ending → an alternate texture → transposition → improvisation; a
    transfer environment, not another track.
17. **Composition is meaningful and operationally external** (I20, L86, R18): `improv.9` asks
    for a finished two-to-three-minute piece written down and heard; the only tool is Free Play,
    which keeps no recording; no artefact is owned by the app. No notation editor for that: the
    boundary is explicit and a project can be an external artefact while the app tracks title,
    goal, milestone, form or constraint, next task, reflection, an imported score, MIDI or PDF
    when available, a performance or recording, completed or paused — projects represent
    externally authored creative artefacts, not only repertoire. **Process, not pass or fail**
    (L24, L86, I20): choose a form, make an A idea, create contrast, choose harmony, make a bass
    or accompaniment, revise texture, write an ending, make a readable artefact, perform and
    listen, revise, finish — some known from an imported artefact, others learner-reported;
    never an accuracy rubric.
18. **Free Play stays free** (T23, I15): optional descriptive observation and optional prompts
    — only three notes; a question and an answer; the second phrase starting the same and
    ending differently; a melody over this progression; three voicings of a chord; play then
    sing it back; sing then find it; transpose your idea — and always "just play".
19. **Theory explanation follows experience** (F, M10, T21): hear or play → notice → name →
    explain → use elsewhere, for tonic and dominant, cadence, inversion, mode, secondary
    dominant, modulation, phrase and form, syncopation, harmonic rhythm; F's
    experience-before-explanation gate applied to musicianship.
20. **Lesson statements for F's epistemic audit** (F, F0; no new architecture): perfect
    intervals "simplest, therefore hollow"; the bass note "most of the answer" in dictation; the
    bass "tells you the chord"; a picked-out triad "should" be read as three chords; random
    diatonic tonic-ending material as every familiar folk melody; almost every memorable Western
    melody a repeated motif with small changes; most weak solos weak rhythmically; bands always
    speed up; an arranging trick "the oldest"; almost all short music one repeated-varied phrase
    structure — heuristics at best, never universal facts without support.
21. **The learner model is not a theory checklist** (C0's distinction kept): no hundred tiny
    permanent skills ("hears V7/vi in second inversion"); the model reasons at meaningful
    abilities — ear and audiation, harmonic function, chord construction, transposition,
    accompaniment, improvisation, form, ensemble continuity — plus observed demands; fine-grained
    task data stays evidence and context.
22. **The musicianship topology, an audit model not a database**: Hear (pulse, melody, bass,
    harmony, function, form); Imagine (audiation, prediction, silent reading, singing and
    tapping); Understand (intervals, scale degree, chords, function, form, notation); Find and
    reproduce (keyboard, playing by ear, dictation, transposition); Participate (accompaniment,
    charts, ensemble, continuity, form, listening while playing); Create (improvise, vary,
    reharmonise, arrange, compose); Transfer (authentic repertoire, unfamiliar music, personal
    projects, other musicians). Ear, Theory, Improv, Jazz, Chords, Jam and Composition are never
    seven courses to finish (L89). **Integration chains** are examples of I17, not tracks:
    melody (hear → sing → find the first note → reproduce → identify contour → find it on the
    page → transpose → vary → recognise in repertoire); harmony (hear a cadence → sing the bass
    → identify function → build → voice-lead → transpose → accompany → recognise → improvise →
    arrange); rhythm (hear and tap → count → notate → play on one pitch → coordinate → maintain
    against accompaniment → use the groove in repertoire); form (hear sections → mark form →
    follow a chart → recover → trade → memorise by form → improvise or arrange by form).
23. **Long-horizon behaviour** (I16, I17, I18, L92): musicianship grows less quiz-like —
    identify this interval → sing the bass under this phrase → what function did you hear →
    find it → play the progression in another key → accompany this melody → improvise over it
    → where does the same move occur in your repertoire → use it deliberately in an arrangement;
    the existing machinery stays useful without Stages 10–50.
24. **Twenty-four acceptance tests** → Q43 (a Q row per wave's acceptance set is the pattern
    since Q8, Q41 and Q42; these are G's, with X's workflows).
25. **Row reconciliation**: T21, T22, T23, L24, L67, L68, I15, I16, I17 (central), I18, I19,
    I20, L86, L89, L92, R18, R20, M10, F and F0, X — no new musicianship feature row.
26. **Wave ownership**: D honest contracts for generated ear, harmony and style material,
    coherent tonal phrase generation where generation fits, memory material told from
    audiation material; E authentic excerpts for ear, harmony, form and transfer; F correct
    claims, no universals or fake causal certainty, experience before explanation, honest words
    for what each exercise teaches; G the longitudinal musicianship topology, audiation,
    integration and transfer, ensemble, improvisation development, arranging and composition
    projects, long-horizon continuation; X the workflows (hear → answer → retry → transfer),
    accompaniment, jam and trading, listen-back and reflection, hands-busy creative work; H walks
    the finished system as musicians, listening, and checks the experiences feel connected.
27. **Bottom line**: the danger is a pianist who passed an interval drill, a cadence drill, a
    Roman-numeral drill, a chord-scale drill, a dictation drill, an improv rung and a jam rung
    without one connected ability; the teacher keeps asking — can you hear it, imagine it before
    it sounds, find it, name what matters, play it in another key, recognise it in real music,
    use it playing with someone, make something of your own with it. The reviewer's reading of
    the direction: no "ear training 2.0", no improvisation module, no composition editor — the
    connective tissue over the machinery already present.

===== PART 18: THE SESSION IS COMPOSED BUT NOT RUN — THE BOUNDARY BETWEEN C6 AND X (2026-09-26, the reviewer's learner-experience audit in progress, against c1fc7ef) =====

Not a C6 defect and not a reason to delay or widen C6; it defines what X builds around C6's
composition. Verified at the line after C6's commit: `TodayScreen.ts:520`, "Start session" does
`slots.find((slot) => slot.item)` and opens the first populated activity; there is no session
cursor, no active-session id or state, no slot-completed state for today's composed lesson, no
next-activity handoff, no persisted "where I am in today's lesson", no cross-surface
continuation, no reason carried from the finished activity into the next; after a Score
activity, Done follows that screen's normal return and the learner is back on Today navigating
the card. Three scales stay distinct: **L32, the composed session** (why these experiences
belong together today — controlled eighth-note reading → a real excerpt with the same demand →
repertoire → a creative or easy finish); **X19, the practice episode** (what the teacher is doing
about one problem inside or across them); and **the missing execution layer within L32 and X9**
— start session → activity 1 → a concise result → "Next: activity 2, because …" → activity 2 →
… → session finish and reflection. Without it C6 composes a coherent lesson in data that the
learner experiences as several independent app launches, losing exactly the relation L32 is
meant to create: a teacher does not hand over five activities and disappear between them ("Good,
the rhythm held there; now the same pattern in a short piece"; "still unstable, so we're not
moving on"; "easier than expected — skip the second drill and try it in the piece").

**The X requirement**: lightweight execution state, apart from competence evidence and apart
from X19 — today's composed session identity and version; the ordered activities; the current
one; attempted, completed and skipped; why each is here; any adaptation made after an activity;
elapsed and remaining time; whether an X19 episode detoured and where to resume; whether the
learner ended the session on purpose. Session completion is never competence evidence. **The
transition** at the piano: "Rhythm held this time. Next: Minuet excerpt, 4 min — the same
eighth-note pattern, now in real music. [Start] [Skip or change]"; the learner never has to hit
Done, rediscover Today, inspect five rows, remember which was done, infer the next, or work out
why it follows; X15 and X16 later make it lighter with cues and auto-continuation.
**Adaptation**: the runner does not execute the original card blindly — easy success skips
redundant acquisition and moves to transfer; failure opens an X19 episode, then resumes; a long
session keeps the highest-priority project and repertoire work and trims filler; fatigue or
frustration switches to easier fluency or creative work; a diagnostic result can change a later
slot — but never an invisible rebuild after every run; material changes are understood.
**Resume**, two problems: U31 never loses an active run after an interruption; L32 and X9 never
lose where the learner was in today's lesson — after activity 3 of 5, "Continue today's session
· 18 of 30 min · next: …", never as if the session had not started. **Guided versus
exploratory**: the doors (Metronome, Free play, Sight-read, Simon, Accompaniment lab) stay;
X9's rule made explicit — guided practice never requires knowing the doors or the information
architecture, and exploratory access never competes with the teacher's next action; the toolbox
is not the problem, assembling one's own lesson from it is. **Fifteen acceptance cases** →
Q42 extended. **Reconciliation**: L32 from "compose coherent activities" to "compose and execute
a coherent lesson"; X9; X15 between activities as well as between attempts; X16; U31 with
score-run persistence kept distinct; X19 cited only for detours and return, never merged with
session execution. No new row. **Bottom line**: C6 answers what today's lesson contains, X19
what we do about this problem, and L32 with X9 how the learner moves through the lesson without
becoming its session manager.

The reviewer continues with the phone-at-the-piano lifecycle (opening with both hands needed,
starting, switching, interruptions, stopping early, recovering after errors, visual attention
demanded by controls and feedback), then turns to the artefact-first C6 review when its packet
arrives.

===== PART 19: THE CROSS-SURFACE INTERRUPTION LIFECYCLE (2026-09-26, the reviewer's phone-at-the-piano audit; onto X15, X16 and E10, not a new item) =====

The reviewer now sends build-ready packets — problem, code and surfaces, required behaviour,
acceptance tests, place in the plan — and interrupts only for a decision.

**Verified at the lines**: `ScoreScreen.ts` handles `visibilitychange` (three references) and
`scoreMidRunSettings.test.ts`, `score.screen.spec.ts` and `score.states.spec.ts` forge
`visibilityState`; `ChordChartScreen.ts`, `LabScreen.ts`, `PdfScreen.ts` and `DrillScreen.ts`
have no visibility handling at all. Chord Chart and Lab clean up on route disposal but do not
suspend when the document is hidden; PDF's timed follow leaves its timeout and metronome to
browser behaviour while hidden; Drill has extensive route-disposal cleanup, with each drill's
timers and playback independent.

**Required**: one practice-surface lifecycle contract used by Score, Chord Chart, Drill, Lab
(Jam, trading), PDF follow and any future orchestrated activity, distinguishing playing,
suspended or interrupted, between attempts, completed, and disposed. On
`document.visibilityState === 'hidden'` an active activity stops or suspends scheduled
progression and any sound that should not continue unattended. Returning visible never
processes a timer or animation-frame backlog, silently skips material, counts hidden wall-clock
time as practice, or pretends an uninterrupted performance; the screen enters a deterministic
resumable state. Route disposal stays terminal and releases listeners, audio and resources.
**PDF**: Timed and Loop follow never advance while hidden and return at a later system; the
timeout is cancelled or disarmed on hide and restored at the same system on visible with an
explicit restart or resume, or the shared lifecycle's defined resume; the metronome follows the
same state. **Chord Chart and Lab**: hiding stops or suspends metronome, accompaniment,
scheduled piano and drum events and form progression; returning never increments chorus, pass
or bar from elapsed hidden time; enough state is kept to resume predictably rather than
treating backgrounding as navigation. **Drill**: every count-in, Simon and listen playback,
delayed feedback, pause, dictation ticker and metronome audited against the contract; a hidden
phone never finishes a prompt, advances a card, scores hidden time or returns halfway through
playback. Not scattered `visibilitychange` handlers when a shared primitive can own the
transition. **Not "pause buttons everywhere"**: lifecycle correctness first; X16's cues and
hands-free continuation then run on a reliable shared state machine.

**Acceptance tests**: forge `visibilityState` and `visibilitychange` as the Score tests do;
for every active surface prove that hiding freezes progression, no scheduled beat, page, card
or pass occurs while hidden, visible returns to the same musical position, hidden duration
does not contaminate measured duration or timing, no stale callback fires after resume, and
stop or back after an interruption still disposes everything; one integration test covers
visible → hidden → visible → hidden → visible, since duplicate listeners and timers are the
obvious regression.

**Into the orchestration work**: L32 owns the session's ordered activities and current
position; X19 owns an episode and its reason; X15 owns the interaction and lifecycle state of
the active activity; backgrounding loses neither the session cursor nor the episode context,
and on return the learner is in the same activity or intervention, never on a Today that
recomputed a recommendation.

===== PART 20: THE SESSION AS AN OBJECT — FOUR ORCHESTRATION REQUIREMENTS UNDER L32, X14–X16, U31, E10 AND X12 (2026-09-26, the reviewer's audit at c1fc7ef; no competing subsystem) =====

Verified at the lines after C6: `TodayScreen.ts:325` still replaces a swapped slot in the
mounted screen's own array (`slots[slotIndex] = { ...rest, item: choice, reason:
swapChoiceWords(option.tier) }`) and nothing persists the chosen session; once the first
activity opens, that Today is gone and a return or reload rebuilds through `buildSession()`
against the new learner state. `PracticeEngine.elapsedMs` subtracts idle time and is tested;
`DrillScreen.ts` computes duration as `Date.now() - startedAtMs` in four places.

1. **Start session snapshots a real session**, not the first current slot. The prescribed
   session can change underneath the learner after activity 1 changes evidence, and a manual
   swap can disappear. On Start the app materialises a session instance: id, date and template;
   ordered activity instances; the exact item identity of each; generated seed, recipe or
   excerpt identity where applicable; slot, purpose and the readable reason; the opening rung or
   context; learner substitutions; the cursor; activity state (not started, active, completed,
   skipped); enough to resume after navigation, reload or kill. The remaining session is never
   recomputed after every completed activity — new evidence belongs to the next session unless
   an explicit intervention or episode changes this one for a stated reason; replanning is an
   explicit action, never a side effect of remounting Today. Tests: swap slot 2, Start, finish
   slot 1, slot 2 is still the substitute; change evidence during slot 1 so `buildSession()`
   would differ and the running session does not mutate; reload between slots and resume at the
   cursor; kill and reopen during an activity and be offered the active session; a genuinely new
   session uses the new state. L32 with U31 and E10; X19 stays a detour that reintegrates, never
   the day's session.
2. **Activity completion apart from competence evidence.** Score and many drills measure; some
   drills record completion with accuracy unmeasured; Lab records nothing; Free Play records
   nothing; PDF has follow behaviour and no practice history (X12). A session must know that
   five minutes of accompaniment, PDF systems 12–18 or three minutes of improvisation fulfilled
   the activity without manufacturing accuracy, passes, misses or skill evidence. Two independent
   products per activity: the activity outcome (started; completed, skipped or interrupted;
   active practice duration; passage or range where known; reflection or report if asked;
   activity-specific facts) and learning evidence (only what the experience measured).
   Completion advances the cursor without asserting competence; X14's per-surface exit evidence
   made mechanical enough for L32's orchestrator. Tests: a Lab activity completes and advances
   with no accuracy or mastery evidence; PDF records time and system progress and optional
   self-report, no note correctness; Free Play satisfies an assigned creative activity without a
   percentage; a measured Score activity emits both; skipping advances only by the session's
   skip policy and never masquerades as completion or mastery.
3. **U31 widens to the hierarchy**: composed session (L32) → teaching episode (X19, optional) →
   active activity or run (X15, X14). After a kill or reload the app answers which session, which
   activity, whether it was part of an episode, why, where to return when it finishes, which
   earlier activities are complete. Identity and safe resumable state are persisted, not every
   millisecond of engine state: a partly played judged attempt may restart cleanly; the session
   and episode context survives; per activity it is defined whether an interrupted attempt is
   resumable, restartable or discardable; an interrupted partial attempt is never recorded as
   completed.
4. **Duration truth outside Score**: hidden time is not practice time is Score's invariant with
   a unit test; the other activities have no shared active-practice clock, which matters once
   X12 records PDF practice, L32 allocates by minutes and X14 lets unjudged activities satisfy
   session work. Never raw `Date.now() - startedAt` for an orchestrated activity that was hidden
   or suspended. A shared active-time primitive on X15's lifecycle — ready → active → suspended →
   active → completed — where only active intervals count; count-ins under one documented policy;
   background, app-switch and phone-call time never count; a stopped activity freezes; restart
   against resume explicit. A fake-clock test over representative Score, Drill, PDF and Lab
   activities: play 20 s, hide for 5 min, resume 10 s → about 30 s of practice, not 330 s.

**Not overbuilt**: no universal `recordRun()` forcing every experience into Score's evidence
model — the grammars differ (L24); what is missing is the small common orchestration protocol
above them. U30 (safe areas, system UI, keyboard, app switching, calls, Bluetooth and MIDI
reconnect, the device matrix) and U56 (playing-state accessibility) are correctly scheduled;
the interruption finding strengthens U30's acceptance matrix and X15's contract rather than
adding rows. Without these, L32 could be built as a smarter `buildSession()` plus a Next button
and claim composed sessions with no stable session to compose.

===== THE C6 REVIEW (2026-09-26, artefact-first against a5d3d24) =====

**Verdict: approved, with one policy correction before C7.** The mechanisms are real: Today no
longer fills slots from level windows; the rung → skill → demand → prerequisite → exposure ladder
exists; parallel strands are `strandsOf`, not one serial position; `readerPosition` anchors
sight-reading to the spine; review separates skill retention from repertoire retention; the
1-3-7-21 calendar is gone; swap alternatives carry semantic tiers; generated sight-reading stays
apart from repertoire; the red evidence exercises the replaced mechanisms. The closures are
accepted with the packet's qualifications: L35 is not globally closed while its two build-side
Stage-N rules remain; X1 stays partial.

1. **Retention: keep passed and mastered.** A pass is evidence the learner learned enough of the
   piece for it to be worth preserving; requiring mastery would make retention artificially
   late. Interim: when G builds the repertoire lifecycle, `ProgressRow.status` stops serving as
   the definition of repertoire state — learning, practising, performable, maintaining,
   refreshing, paused or retired are the abstraction (R19).
2. **The 14-day window stands as a hypothesis**; C7 is not blocked by it. Eventually cadence is
   contextual — a barely learned piece, a polished performance piece, an easy maintained piece
   and one being retired do not share one recurrence policy.
3. **Change the exposure precedence before C7.** Verified at the lines: the review slot returns
   `exposure(ctx, 'kinds', true)` right after retention (`session.ts:1132`) and the repertoire
   slot `exposure(ctx, 'tracks', true)` right after the demand-ready piece (`:1171`), before the
   second pass's ladder sees the slot; the declared hierarchy and the implementation disagree,
   and it matters now because the semantic tiers are starved of shipped metadata while the
   seven-day heuristic always fires. Required: review — due skill or piece retention → rung,
   skill, demand, prerequisite where applicable → exposure; repertoire — demand-ready piece → a
   semantic repertoire candidate → exposure; a due retention need may outrank ordinary work
   (forgetting, maintenance), generic breadth may not; a reserved breadth share, if the product
   wants one, is L32's composed-session policy, never a selector pre-pass on `EXPOSURE_DAYS`;
   adversarial tests with both candidates present (the semantic one wins) and with exposure the
   only candidate (it wins). Sent to the C6 builder as a fix-forward in the same tree.
4. **No target-skills filler task before C7.** The "fires on nothing shipped" state is the
   cleaner architecture: D0 populates target skills through family contracts and E populates
   demands through measurement; stamping guesses now would encode them right before the wave
   whose job is to establish the facts; C6's constructed tests prove the consumers work once
   trustworthy producers exist.
5. **Parts 18–20 constrain C7** without blocking it. C7 must not make Today recomputation
   equivalent to an active session; assume `buildSession()` output can always be regenerated;
   make evidence records the only definition of activity completion; make an active run the
   top-level resumable object; bake raw wall-clock duration into new evidence semantics; make
   session slot identity depend solely on item id; treat a changed learner state after activity
   1 as permission to rewrite activities 2–5. The hierarchy stays persisted session snapshot →
   optional teaching episode → activity or run; C7 improves long-horizon evidence underneath it.
6. **The truncated reason line is P2, X's, not P3.** The pictures show the decisive clause lost
   on the primary 342 px target ("Keeping this piece playable —…", "Next lesson — this one waits
   f…"); C6 exists to say why, and hiding half the reason undermines it; X solves it in the Today
   redesign, likely two compact lines rather than rewriting every reason around an ellipsis.
   → U63. **L93 stays P1**: the header and Plan can still describe a different serial rung from
   the strands composing Today, and that must not survive into learner-facing X work.

After the exposure-precedence change and its tests, C7 may start. The reviewer then resumes the
independent audit at onboarding, self-explanation and MIDI import.

===== PART 21: IMPORT TRUTH AND LEARNER GUIDANCE (2026-09-26, the reviewer's audit addendum; onto existing rows) =====

A. **Stale C5 language in the import path** — verified: `assignSheet.ts:72` tells the learner
   "Assigning it to a rung makes it one of that rung's song options — it counts towards
   finishing the rung…" and `docs/OWNER-GUIDE.md:402` repeats it. After C5 that is misleading;
   the implementation is better than the prose (`overlayImports()` puts the piece into
   `songOptions`, and `rungState` counts a qualifying measured run of it judged for that rung
   toward a `runs` requirement); assignment is neither progress nor evidence. The wording
   becomes "…one of that rung's practice options; the app can then suggest it there and use
   measured practice on it toward that rung's requirements"; the historical comments in
   `load.ts:151` and `importOverlay.test.ts:5` ("cannot count for a rung", "could not complete a
   rung") are kept only where they unambiguously mean qualifying practice; a regression proves
   assignment alone yields no evidence and meets no rung, and a qualifying run can. → E21, T52
   (a small task after the C6 fix-forward, before C7; never-teach-wrong in app copy).
B. **The MIDI importer is not another file picker** — E with R34, R35 and X. The assign sheet
   already exposes that time signature, key and quantisation grid are converter guesses before
   the learner accepts, and keeps note and timing claims apart; that epistemic distinction is
   kept. R34: where the importer admits the hand split is inferred, the learner corrects it and
   the correction becomes source truth for rendering, measured demands, difficulty, assignment,
   recommendation and later practice, never a visual override. R35 covers the importer: enough
   provenance to answer "from MIDI; these properties from events; these inferred by converter
   version X; these corrected by the learner" — inferred, measured and user-supplied never
   flattened. Recommendation of an imported score under E uses measured demands and the learner
   model, never "estimated Level 4, therefore a Level-4 learner's piece"; level stays a sort
   signal. Acceptance case → Q8: import a one-track MIDI whose automatic split is wrong; observe
   the conversion and provenance; correct the split; reload; the notation changes; recompute
   demands; difficulty and recommendation inputs see the corrected truth; assign it; assignment
   gives no evidence; perform it; only measured demands and results enter evidence.
C. **A focused guidance audit in X, not a resurrected manual** (X18). The setup tour stays: it
   is resumable, skippable, writes the real Settings values, previews actual score geometry,
   lets the learner prove MIDI at once, and has microphone fallback and calibration. The missing
   question is what happens after setup at a first encounter or a confusion. The model:
   first-use cue → contextual explanation at the point of need → learn by doing → concise
   reminder → deeper reference only on request. Per major surface (Today and the session, Score,
   Lesson, the Drill families, Chord Chart, Lab, Jam and trading, Library and import, PDF, Free
   Play, Plan and Skills, Settings diagnostics), five questions: can a person tell what this is;
   what to do now; what the app will observe or judge, if anything; how to stop without damaging
   progress; and, later, is the answer available locally without leaving practice. Prefer
   one-line contextual teaching, first-use affordances, empty-state guidance, tiny "?"
   explanations; no persistent tutorial prose beside the piano once understood; during playing
   X15 wins (stable notation, no prose mutation, no popups). Two states tested for the major
   surfaces: the novice's first encounter and the returning learner who dismissed the
   explanation, the second materially quieter. → X18, Q42.
D. **Importing is a workflow, not a success toast**: bring music in → understand what the app
   inferred → correct it → decide where and why it belongs → preview or try it → save or assign
   → the app surfaces it intelligently later → practice produces appropriate evidence. A parse is
   not the outcome; the learner finishes an import knowing what to do with the music next. It
   connects to E's source chooser: imported music is a legitimate source beside generated
   material, PDMX excerpts, bundled repertoire and external recommendations, chosen because its
   measured demands match, never only because the learner attached it to a rung. Not built now;
   the contracts are recorded so C7 and interim work cement nothing E must undo. → E21, L22.

The reviewer's next passes: the contextual-help implementation (`help.ts`, the Guide, lesson and
tool entry points, first-use state) against the progressive-disclosure contract; the importer's
post-conversion workflow; the broader content-source selection path.

