# Operating procedure

How work is decided, done and reported here, for the orchestrating session and for every
agent it briefs. Written 2026-09-25 from an outside audit of this repository's working
method (`audit-2026-09-25-outside.md`) and the owner's endorsement of it. It replaces the
eight-question checklist as the thing to run before reporting; `working-rules.md` keeps
the failure stories the rules came from and is still worth reading once.

The audit's diagnosis, in one line: the harness had become very good at proving the work
was not misreported and not equally good at deciding what the work should be. So this
document puts judgement first and evidence discipline in its service.

---

## 1. The five rules everything else serves

1. **Solve the actual problem, not the literal request.** Restate the goal without the
   requester's words and check the plan against that. Examples in a request are examples.
2. **Understand the existing system before changing it.** Which subsystem owns this, what
   it assumes, who depends on the assumption, whether the request is a local fix or a
   symptom of the model being wrong.
3. **Form and test a causal model rather than patching a symptom.** What is wrong, what
   mechanism produces it, what evidence supports that mechanism, what else could, and what
   minimal test tells them apart. Then fix the mechanism.
4. **Verify the user-visible result, not the implementation.** A learner sees a screen,
   hears music, reads a sentence. Look at that. Green tests and valid XML are not the
   result.
5. **Be precise about evidence without letting verification replace judgement.** State
   what was observed, what was inferred and what is unverified, in one pass, and move on.

## 2. The hierarchy

Four kinds of concern used to be weighed as equals. They are not. When they conflict, the
higher tier wins, and a lower tier never interrupts a higher one.

**Tier 1, product truth.** Does this make the piano app teach better? Is the music
readable at every size, undistorted, with the next music in view? Is the intended skill
actually the one being trained? Is the learner given an appropriate next experience? Does
the screen behave as a person expects? Is the music itself right? The standing product
invariants live here: *eye over spec*, *fill with music not space*, *readability and
look-ahead paramount*, *never teach wrong*, *no internal ids on screen*, `04` §0 R1–R6.

**Tier 2, technical correctness.** Is the logic right, are the state transitions right,
do the data contracts hold, are every field's consumers handled, do the tests pass.

**Tier 3, evidence discipline.** What was observed, what was inferred, what remains
unverified. A claim's scope matches its search. Nothing about music that has not been
heard is verified; say so once and continue.

**Tier 4, process hygiene.** Hooks, commits, agent mechanics, token budget, wording,
report format. Necessary, never the reason a turn is spent.

## 3. Hypotheses are allowed

Uncertainty is not a reason to stop reasoning. The expected shape is:

> The evidence suggests X causes Y. Alternative: Z. The test that distinguishes them is T.
> I will run T, then change the mechanism the result points at.

Not: "I cannot say X causes Y because causality is not established." A named hypothesis
with its test is engineering; a refusal to name one is bookkeeping. `verifying.md` §4
still applies in full: a mechanism that explains the symptom is not yet the cause, and
the measurement that would show it wrong has to be taken before "fixed" is written.

## 4. When to ask the owner, and when not to

Ask only when the unresolved choice changes product behaviour, pedagogy or architecture
in a way that cannot reasonably be inferred from what is already written down. Otherwise
choose a defensible option, say in one line why, and continue. Do not ask about
implementation details; do not silently take a major product or pedagogical decision
either. The owner does no manual work: nothing routes to "needs a musician" or "the owner
decides" that two readers with the notation and the code could decide.

If a request addresses a symptom, say so once and keep building: "I can do that; the
deeper problem is X, and doing only this leaves Y." Then do the requested thing unless
the owner redirects.

## 5. Implemented is not solved

Compiles, renders, validates, passes, generates and displays are all necessary. None is
the goal. Ask, and report separately:

- **Technical:** the XML is valid, the transitions are right, the consumers are handled.
- **Pedagogical:** would a competent piano teacher consider the exercise, excerpt,
  progression, feedback or notation musically sensible? Does the exercise isolate the skill
  it is for, or does it drag in leaps, syncopation or a stretch the learner has not met?
  Does the lesson teach a musical idea, or explain the app?

When the pedagogical question cannot be answered from the code or the notation, mark it
unverified in those words rather than letting a structural test stand in for it. Do not
solve a content problem with more content until sequencing, prerequisites, difficulty,
feedback, transfer and selection have been ruled out as the cause.

## 6. The system is a learning system

The model to reason in is *learning objective → musical experience → performance →
evidence → updated skill state → next appropriate experience*, not *lesson → item →
completion*. When touching curriculum, progression, recommendation, mastery, scoring or a
generator, ask what the app learns about the student from the interaction and how that
changes what comes next. If the answer is "only that the item was completed", that is an
architectural limitation and is reported as one, not hidden.

Two corollaries. A stage number or an item level is not a learner's ability; be suspicious
wherever one stands in for the other. Difficulty has dimensions (reading, rhythm, range,
hand independence, leaps, texture, harmony, physical demand, visual density, memory,
interpretation, style), and a piece easy in one can be hard in another.

## 7. Fallbacks and competing definitions

A fallback keeps a screen from being empty; it must not quietly become the curriculum.
When an item cannot be found, the honest search order is: same learning objective, same
skill, same concept, same prerequisite, same musical context, the weakness the last runs
showed, similar style, and only then "anything near this level". If the code does
something blunter, name it.

When two parts of the tree define level, mastery, difficulty, skill, progression,
exercise, lesson, sight-reading or performance evidence differently, do not add a
conversion. Report "there are two definitions of X", recommend which becomes the source of
truth, and what downstream would change.

## 8. Findings are classified

- **P0** a concrete bug: the behaviour is objectively wrong.
- **P1** an architectural limitation: it works, and the model will stop the intended
  product from working well.
- **P2** a pedagogical or content improvement the architecture already supports.
- **P3** polish.

P3 never displaces P0 or P1 in a plan. Adjacent problems found mid-task are recorded,
classified and related to the task, and the task continues unless they block it.

## 9. Work incrementally; trace real data

For anything large: the underlying issue, the smallest architectural change that
establishes the right model, built, tested, its downstream consequences inspected, then
the next step. When auditing, follow one representative object through the whole pipeline
(a generated exercise from generator to next recommendation; a repertoire piece from
source to progress; a sight-reading run from level request to next assignment) and at
each stage ask: what structure, what source of truth, what is lost, what is assumed, is
the next stage given enough, is the same concept recomputed elsewhere. This finds more
than reading files in isolation.

## 10. Preserve what works

The deterministic generators, the levelling model, the catalog, the engine and the
render pipeline are substantial and mostly right. Better metadata, validation, selection
and learner modelling on top of them beats replacing them. Before replacing a subsystem,
write down what it does well.

## 11. Before reporting

Four questions, in tier order. A correction is owed only where the answer would change
what the owner or the next agent does; wording alone never earns a turn.

1. **Product.** Did I look at the result the way a learner meets it (the screen, the
   music, the sentence), and what would a piano teacher say about it? If I did not look or
   cannot judge, that is said in the report's first lines.
2. **Mechanism.** What caused the fault, which test distinguished that cause from the
   alternatives, and did the change act on the mechanism rather than the symptom?
3. **Evidence.** Which claims are observed and which inferred; for every "all", "none" or
   "both", what scope was actually examined and what is unchecked; what has not been heard.
4. **Consumers and record.** Who else reads what changed and what each does with it; the
   spec, test map and record updated in the same change, with the reason.

The technical rules that still bite every week: never assert a number measured on this
machine; never name an AI model anywhere; the specs serve the code; one Playwright suite
at a time on port 4173; `npx tsc -b`, not `tsc --noEmit -p`; commit named paths only, and
agents never commit; before re-serialising JSON compare a round-trip against the raw bytes
and splice text if it differs.

## 12. The report

Judgement first, then Done / Not done / Follow-ups / Questions / Files. Under Done,
technical and pedagogical verdicts stated separately where both apply. What is unverified
sits beside what passes, not at the end. Per fix: the mechanism, the discriminating test,
the before and after measured the same way, and the red line that proves the test.

## 13. What a brief carries

Every brief written here states: the goal in the writer's own words and the owner's, and
which is which; what is decided and what is the agent's judgement; the files owned and the
files not to touch; the hypothesis the writer holds and the test that would refute it, so
the agent inherits a question and not a conclusion; when to deviate from the brief (when
the premise is found wrong, say so and take the better path, recording why); and this
document's §11 and §12 by reference.
