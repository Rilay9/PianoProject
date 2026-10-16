# Working in PianoProject

Read `FABLE.md` first: the current focus (its section 6) and the non-negotiable qualities. It is a guide to intent, not a script that turns every owner example into a rule. The owner's newest explicit instruction wins; `docs/inputs/` holds their actual words, and the branch HEAD holds implementation truth. Older documents are references unless currently applicable.

## Interpret intent, not wording

Turn a request into: the experience or outcome wanted, what is genuinely constrained, what is merely illustrative, and what evidence will show success. A sample conversation, mode list, file format, cadence or activity is not binding unless the owner decided it should be. The opposite extreme is also wrong: "no fixed template" does not forbid reusable structures. Use professional judgment on routine details; ask only about real product tradeoffs.

The owner is learning piano. Never ask them to validate score facts, generators, rhythm, algorithms or technical correctness. Ask about goals, taste, comfort and important choices. Claude establishes correctness; ChatGPT reviews independently when useful. Deliver the result, not process.

## Reuse and selective porting

Before changing a feature, inspect its current implementation and its role for the learner: what works, what is missing, what is deficient. Compare established libraries or other approaches where they could materially help. No reflexive rewrites, no reflexive preservation. Port working learner flows, not an obligatory file-by-file order.

Modes and feature designs are revisable: name, controls, measurement and use may change, merge or retire when that improves the experience. Simon, Lab, duet, reading and tempo modes are precedents, not contracts. Changes to evidence semantics, saved sessions or user-visible expectations need deliberate migration decisions. Don't add a mode because a lesson might hypothetically want one. Use existing content types, storage, importers, renderers, tests and utilities where they fit; extend schema or architecture for an actual consumer, not a hypothetical complete curriculum. New branch work must not break what the owner currently plays.

`docs/app-features.md` describes every mode and tool: what it is for, how it works, what it judges and the content it takes. Read it when planning lessons or preparing content, and update it in the same commit as any change to a mode, its settings or a content format.

## Musical and product truth

Never teach a false note, invented pattern, wrong rhythm, unjustified ability or false mastery claim. Keep separate: published pedagogy; verified score facts at exact measures; generator or detector assertions and their limits; observed performance; learner feedback; teaching judgment.

Don't infer hand from staff, moving bass from repeated notes, scale from broken chord, dynamics from plausibility, or teaching fitness from title, grade or metadata. Read the actual notation where a music claim matters. Test with positive, negative and near-miss cases; verify generated music independently; look up established rules and libraries before inventing thresholds. A claim that cannot be established is marked UNKNOWN, narrowed, or replaced by more verifiable material. A generator never certifies itself.

Curriculum is not bulk data production: build selected material as the learner needs it, with coherent prerequisites, practical teaching, feedback and transfer. A correct score is not necessarily a good lesson.

Read `docs/lesson-design.md` before planning or writing any lesson, and run its checklist on every lesson before the owner sees it: teaching first, the app's modes second, every teaching claim from a source that was opened and read.

## Finish real learner-facing work

Judge a change against the whole journey: find → understand → start → play → accurate, helpful feedback → retry → save → revisit. For visual work inspect the rendered states on phone portrait, landscape and tablet. For timing, input, playback, persistence and progress, test realistic transitions, interruptions and recovery. For feedback and export, check that the exported record carries what the next lesson needs. A green test is not pedagogical, musical or UX quality.

Verify in proportion: focused checks for small local changes, integration and device checks for risky shared ones; distinguish flakes from regressions. Read `docs/tests.md` before writing or running checks, and include it in any reviewer's brief; when a review finds a kind of bug our checks missed, add it there with the fix. Never claim to have run, listened, measured, reviewed, merged, deployed or pushed anything without evidence and a confirmed side effect.

## Before sending any brief

For substantial delegated work, check:
1. **Objective:** Is the learner-facing outcome and approved scope clear? Does the brief mistake an example for a requirement?
2. **Reuse first:** Has it identified the relevant code, prior decision, library or music source before proposing new work?
3. **Boundaries:** Is the task coherent, finite and useful, without a speculative audit or framework?
4. **Source truth:** Does it demand precise evidence for musical, software and learning claims, with UNKNOWN permitted?
5. **Independence:** Are input versions and ownership of concurrently edited files clear when they matter? Is an independent check worth its cost for the risk?
6. **Completion:** Does it specify an observable outcome and appropriate verification, not merely documentation or rows?
7. **Cost:** Is delegation and testing proportionate? No needless agent fan-out or repeated checks; a cheaper model for mechanical work.

`brief-check.js` requires this heading and a `Brief check:` line in the brief. The line is a reminder, not proof; the brief auditor hook is the independent look. No audit theatre beyond that.

## Before reporting any piece of work

For substantive reports, check:
1. **Outcome:** Did the learner-facing purpose improve? What actually exists on the active branch?
2. **Cause:** Was the actual mechanism addressed rather than one symptom? If uncertain, say so.
3. **Evidence:** What was personally inspected or executed, versus read from logs, inferred or not checked? State the real scope; never call a sample exhaustive.
4. **Compatibility:** What consumers, settings, saved data, modes or deployment paths are affected? Do they still work?
5. **Addressee:** Am I asking the owner to verify facts Claude should establish? Am I inventing a decision for them?
6. **Closure:** What concrete change, check and observable outcome establish completion? Are writes, pushes and exports confirmed?
7. **Relevance:** Does this serve the owner's latest approved goal? Did I add redundant systems or expand scope early?
8. **Convergence:** Is the product closer to a dependable experience, or have I spawned another audit cycle?
9. **Intent:** Did I read the owner's words for what they meant in context, or harden a passing remark into a literal rule they never asked for?

The Stop hook runs these after every report and takes one line back: "Checklist: nothing found", or what a question caught and the fix. Nothing more. Correct the report or the work only where a question finds something consequential. Keep observation, inference, judgment and UNKNOWN distinct.

## Operating boundaries

- Inside approved work Claude handles implementation details; the owner decides major scope and product choices. Commit named paths only; subagents never commit or push; the owner's push and release boundaries hold.
- The current focus and the next task come from FABLE section 6 and current evidence, never from a fixed order.
- Don't copy old specifications into this branch as governance. Bring over current, useful contracts when a feature needs them; record and test genuine design changes.
- Preserve the stable deployed experience, provenance and licensing, and private data; check migration and rollback where risk warrants.
- Never claim success from row counts, hashes, parser output, source labels or tests beyond what they assert.

Finish with an evidence-based result and the decisions the owner must make, not a manifesto.
