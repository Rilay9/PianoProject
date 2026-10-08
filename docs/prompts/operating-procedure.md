# Operating procedure

How work is done and reported here, for the orchestrating session and every agent it briefs. Swept on 2026-10-08 to the common-sense rules only (the owner: keep "process checks about not trusting things blindly and not being stupid with token usage"); the previous text, with its reviewer rulings and the old plan's process, is archived at `docs/prompts/archive/operating-procedure-2026-10-07.md`. The objective and the order of work are `FABLE.md`'s, not this file's.

## 1. The five rules

1. **Solve the owner's actual objective, not a substituted goal.** Identify the newest instruction and its scope. Restating it in your own words must not change it. Examples are not necessarily exhaustive.
2. **Understand the existing system before changing it:** what owns it, what it assumes, who depends on the assumption.
3. **Form and test a causal model rather than patching a symptom:** the mechanism, the alternative, the minimal test that tells them apart; then fix the mechanism.
4. **Verify the real result, not the implementation:** the score, the screen, the sentence. Green tests and valid XML are not the result.
5. **Be precise about evidence without letting verification replace judgement:** what was observed, what was inferred, what is unverified, said once.

## 2. Hypotheses are allowed

"The evidence suggests X causes Y; alternative Z; test T tells them apart; I will run T." A mechanism that explains a symptom is not yet its cause until the test is run.

## 3. Implemented is not solved

Report the technical result and the musical one separately. Where a musical question cannot be answered from the code or the notation, mark it *unverified as music*: nobody in this process hears music.

## 4. Difficulty has dimensions

Reading, rhythm, range, hand independence, leaps, texture, harmony, physical demand, visual density, memory, interpretation, style. A piece easy in one can be hard in another; a level or stage number is not a learner's ability.

## 5. Competing definitions

When two parts of the tree define the same thing differently (level, difficulty, a skill, a pattern), do not add a conversion: report the two definitions and recommend which is the source of truth.

## 6. Trace real data

Follow one real object through the whole pipeline and ask at each stage what is lost or assumed; this finds more than reading files in isolation.

## 7. Preserve what works

Before replacing a subsystem, write down what it does well.

## 8. Libraries before custom code

Use a standard, a published source or an established library (music21, partitura and others) before writing custom code; hand-build only where a search shows nothing serves, and say what was searched (CLAUDE.md, *Reuse before reinvention*).

## 9. Nothing trusted unchecked

- A builder's or checker's report, a brief's premise, a count, a test result or a library's claimed behaviour is verified at the source before it is stated as fact.
- A builder's own tests prove intent, not correctness; judge by real items from both sides of the line, corpus counts, the field's definitions.
- A sample stays a sample; it is never generalised without its denominator.
- A change to what a learner is taught (lesson text, a curriculum entry, a score's bytes, a catalogue fact) is listed item by item, where, before, after, why, so a reviewer can check each.
- Before a check or build starts, nothing running will change what it reads.

## 10. Tokens and actors

Careful with tokens, never at the cost of quality. Use scripts for mechanical counts and shape checks and appropriately capable agents for research, drafting and independent checking; never Fable agents. Do not duplicate expensive work just for reassurance, but independently validate consequential claims. Match verification to risk: docs-only diff/integrity; narrow logic targeted tests and score adversaries; learner-facing flows relevant E2E; broad/shared/release changes broader suites. Batch expensive tests when safe.

## 10A. Objective-locked change gate

Before proposing a new task, deliverable, dependency or completion criterion: identify the owner's current objective; state the demonstrated deficiency and evidence; check whether existing abilities, characteristics, rules, agents and downstream derivations already cover it; choose the smallest correction. If no consequential deficiency remains, add nothing. Do not turn derived prerequisites, teaching uses, exclusions, placement or verification into new foundational workstreams.

## 11. Before reporting

The seven questions are `CLAUDE.md`'s *Before reporting any piece of work*, the one copy the stop hook reads.

## 12. The report

What was done, what was not, what is unverified beside what passes, and what needs the owner. Per fix: the mechanism, the discriminating test, the before and after measured the same way. Each claim labelled measured (by what) or a reading; no overall quality verdicts.

## 13. What a brief carries

Only the fields the task needs: the goal in the owner's words and the writer's, and which is which; what is decided and what is the agent's judgement; the files it may change; for a build or a fix, the hypothesis and the test that would refute it; for research, the sources and what counts as covered; when to deviate (a premise found wrong is said, and the better path taken); every assigned item done or an explicit not-done line.

## 14. The builder's harness

A builder works in its own worktree cut from origin's head (push what it needs first). It never commits, pushes, stashes, resets or checks out, and never writes in the main checkout or another worktree. Gitignored inputs it needs (the built content under `app/public/content`, `content/scores/imported/*`) are copied in from the main checkout. Temp files go under the worktree's `build/`; `app/node_modules` stays. Browser tests run on the lane's own port, never two heavy runs at once.
