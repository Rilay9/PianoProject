# The orchestrator's read of the vocabulary design (C0a), 2026-09-26

For the owner and the outside reviewer, beside `design-2026-09-26-vocabulary.md`. The design is
the agent's; this is what I would keep, change and put to you, having read it whole and
checked its decisive claims against the files it cites. Nothing is built.

## What it gets right, and should be kept

- **The five-part rule** (target, channel, conditions, opportunity, attribution) with refusals
  instead of zeros, and the three enforcements: a type that cannot be built from an item
  property, a build gate that refuses a rung requiring evidence no run can measure, and a
  property test over the whole vocabulary so a new skill is covered by being added. This is
  the reviewer's "never turn unmeasured properties into evidence" made mechanical.
- **Demand and skill as different ontologies**, shown on three real items (§2). The Anh. 113
  case is the clearest: the same file is triplet work, ornament work, ledger work or two-voice
  work depending on the rung's choice, and only "both together" gives the honest statement.
- **Weight as a count of measured opportunities**, never a multiplier from demands (§4). This
  replaces the sentence in D2 the reviewer called dangerous.
- **`level` demoted to a derived, versioned sort key**, off learner screens, with every reader
  named and its replacement (§6, seventeen rows).
- **The migration in small steps** (§10), each with its consumers, its obsolete tests classed,
  and a proof that must fail on today's code; sight-reading as the first reader, which is the
  reviewer's own order.
- **Two findings that are new to the matrix**: the key guide defaults on during sight-reading
  (a P1 against the sight-reading trace's own conclusions), and the ±150 ms window that cannot
  tell a played triplet from a rushed one at the rung's tempo (worked as arithmetic in §4).

## What I would change

1. **One detector implementation, not two.** §11 item 12 recommends Python detectors for
   files and TypeScript detectors for runtime phrases and imports, with an agreement test, as
   the level model has. The design itself says this is the one-fact-in-two-places hazard this
   repository keeps paying (the level model's two ports disagreed for a day in Entry 53). The
   build already drives a browser for the render check; it can run the TypeScript detectors
   over every file through Node at build time. One implementation, run in two places, is
   cheaper than two implementations kept in step. Recommendation: one, in TypeScript, on the
   engine's own score model, so that what the build measured is what the app measures.
2. **Record the runs T40 drops, flagged.** §11 item 6 recommends recording a heard sight-read
   as `unseen: false` and a demonstrated performance as `demonstrated: true`, where T40 (and
   Part G) drop them. The design is right and T40 should be reversed on this point in C1: the
   notes were measured, the rule keeps them out of reading and performance evidence, and the
   learner's minutes, attempt and day tick are not lost (the matrix's L45 question answers
   itself). Small change; a test seen red.
3. **The vocabulary's grain is the risk, and v0 must stay small.** The design proposes about
   fifteen demands and a dozen reading skills for the first reader and says the whole
   apparatus is unproven. I would hold it to that: C2 ships v0 for sight-reading only, and no
   skill is added until a reader needs it and its observable exists. A taxonomy of two
   hundred skills that nobody maintains would be the seven-little-numbers failure in a new
   costume.

## What I checked

The decisive claims I read at the cited lines: `includeGraceNotes` defaults to false and has no
caller setting it; the key-guide defaults in `settingsStore.ts` and the pass-through in
`ScoreScreen.ts`; the `sessions` cap's comment reasoning in sessions while counting runs;
`levelConfidence` and `alternativesFor`'s tier 3; the ±150 ms tolerance in `engine/types.ts`.
The triplet arithmetic I re-did: at ♩ = 96 and the rung's 80 %, the rushed second and third
notes fall about 65 and 130 ms early, inside the window. Not checked: the counts over the built
catalog (318 of 514 tags outside the vocabulary), taken from the agent's script.

## The choices that are yours (the design's §11, reduced to the ones that change the product)

| choice | the design's recommendation | mine |
|---|---|---|
| a number on learner screens | none; show demands and the rung; the Library sorts silently | agree; stage it in E when demands exist, keep "≈ L5.2" until then rather than show nothing |
| a person's grade as input | yes, as judgement and calibration; never address or evidence | agree |
| the key guide in sight-reading drills | off; recorded either way | agree; it is the only way the daily read measures reading |
| heard or demonstrated runs | record them flagged | agree; reverse T40's drop in C1 |
| laps as observations | those at or above pass tempo, with their range | agree |
| per-step outcomes and the 2,000-row cap | keep per-step; raise or remove the cap; compact old rows | agree; measure the storage before removing the cap |
| the word "mastered" | keep the stored item value; the screen word changes so "mastered" belongs to skills | agree |
| the ladder's numbers (21 days; two recent attempts) | starting hypotheses | agree, marked as hypotheses in the code |
| skill ids | keep today's concept ids where they read as abilities | agree; less churn for the lessons in F |

## What happens next, if you accept the design with these changes

C1 (observations stored, T40's drops recorded flagged), C2 (vocabulary v0 for sight-reading and
the detector module, one implementation), C3 (the evidence function and its property test),
C4 (sight-reading constraints from the reading skill state: the first reader). Each a bounded
task with the tests it makes obsolete named from C0b's inventory, and a stop after C4 to look
at what a learner now gets, before C5 to C7.
