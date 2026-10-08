# FABLE.md: the objective and how work runs (rewritten 2026-10-08 from the owner's plan)

**Read this first, every session.** The owner's newest word wins; when it changes the plan, edit this file the same day and save the owner's words under `docs/prompts/inputs-<date>/`. Only the owner's actual words are attributed to the owner.

The previous contract (ability chains, the shipped-ability scoreboard, the order of work before 2026-10-08) is archived whole at `docs/prompts/archive/FABLE-2026-10-07.md`, reference only; its section 3 still defines the chain records `tools/content/check_chains.py` checks. The convergence charter is retired (`docs/prompts/archive/charter-2026-10-03.md`; the owner, 2026-10-08: "discard the charter if necessary").

## 1. The objective (edited-for-spelling excerpts of the owner's 2026-10-08 words; exact original wording in `inputs-2026-10-08/owner-rules-plan.md`)

> "Right now we need to figure out EXACTLY and comprehensively what the rules should be for EVERY characteristic and ability that we'll be using for placement and verification. This'd be actual counts, detections, library stuff, etc for the rules for code, and for gaps for agents it'd be instructions that'd be used for it to determine based on the other coded stuff, research online, and its own reading of the music xml. We need this full breakdown and before that, a full list of all the necessary abilities and characteristics (found by syllabus and other research), to be perfect before anything else, as we'll be building the rules and prompts from the list of rules and gaps, and the code from the rules and prompts."

> "We can always change the curriculum, as its designed around the characteristics and rules (and gaps filled by agents) so we don't need to worry about exact placement yet."

## 2. The phases, in order

Each phase finishes, by the rule in section 3, before the next starts.

1. **1a. Abilities.** The full list of musical abilities the curriculum needs, found by research: published graded syllabi (ABRSM, RCM, Trinity), method-book progressions for the levels below Grade 1, and published sources for the jazz, popular, Latin and other styles the curriculum teaches. Each ability carries its source; where sources disagree, the disagreement is kept, not averaged. The 28 abilities in `docs/prompts/runs/curriculum-review-2026-10-05/ABILITY-MAP.md` and the 15 tracks are inputs, not limits. Scope: abilities away from the keyboard are out (the owner, 2026-10-08: "Don't worry about away from the keyboard stuff"); decided by what a learner needs to progress (the owner, 2026-10-08: "use common sense for what someone who wants to learn the piano would need or want to include to progress"): knowing what is in the music one plays (keys, chords, cadences, form, style) is in, as recognition at the piano; clapping, tapping and singing back are in; written theory exercises, other clefs, transposing-instrument writing and writing music out on paper are out. This list is iterated to the same standard as the rest (the owner: "do another for researching abilities in the first place so we know where all the gaps are. That has to be perfect too").
2. **1b. Characteristics.** The full list of characteristics needed to tell whether an item serves each ability, each with its source.
3. **2. Rules for code.** For every characteristic and ability that code establishes: the input, the library call, the exact algorithm (counts, detections, thresholds, each threshold with its source or its validation on real scores), the output and its provenance, when it answers UNKNOWN, real positive and negative example scores. For each ability: which characteristics it reads and how they combine.
4. **3. Instructions for agents.** For every gap code cannot settle: the agent's full instruction: the coded facts it receives, what it researches online and where, what it reads in the MusicXML itself, the exact question, the answer format (UNKNOWN allowed), and how its answer is reviewed (the owner: "Agents with their answers reviewed").
5. **4. Checks on the rules and instructions** against real scores and counterexamples.
6. **5. Build:** code from the rules, prompts from the instructions; then the curriculum is designed around what they establish.

**Inputs already made, not discarded, each to be checked against the phases above:** `docs/classifier/` (the characteristics table, the concept map, the rules pages for 44 characteristics and their code, the route plan version 1 (`gap-plan.md`), the iteration-1 audits). **Parked work:** `docs/prompts/parked/README.md`.

## 3. When a list or a rule set is done

- Each check is done by independent agents that did not write what they check, fresh for each pass (the owner: "Use independent agents for each iteration, and I'll use chatgpt for a review after").
- Checkers judge by common sense for what a learner needs to progress at the piano (the owner, 2026-10-08), not by an exam's or a source's categories, and do not reopen decisions already recorded here (scope, the owner's rulings); a disagreement with one is a finding with its reason, never a silent change.
- A check gives every row a recorded verdict, and challenges it with real scores, counterexamples, published definitions and missing items; agreeing with the table is not a check.
- Two consecutive independent passes without a material finding are a provisional review stopping signal, **not proof of completeness or correctness**. The owner tentatively accepted this bar ("I guess") and reviews with ChatGPT afterward; do not represent it as a firm perfection guarantee. **Phase 1a (abilities) ends when pass 2's findings are applied, with no further pass; then the owner's ChatGPT review** (the owner, 2026-10-08: "Just finish up"; each pass had read new sources, so the passes did not converge).

## 4. How work runs

- **Nothing moves to a new step without the owner's say-so** (the owner, 2026-10-08: "Dont jump from things to another without my say so unless I say so and we have a clear plan and protocol for you to do (like while I'm sleeping)"). Unattended work happens only under a plan and protocol the owner has approved for it.
- **Nothing is trusted unchecked:** a builder's or checker's report, a premise in a brief, a count, a test result and a library's claimed behaviour are verified before they are stated as fact; each claim is labelled as measured (by what) or as a reading.
- **Inputs final before dispatch:** a check or build starts only when nothing running will change what it reads.
- **Agents:** never Fable agents (the owner). Otherwise the cheapest capable method: existing results and scripts first, then an agent of the strength the task needs.
- **Tokens:** careful with tokens, never at the cost of quality.
- **Libraries before custom code**, for every musical fact (music21, partitura and others); custom code only where no library serves, with the reason.
