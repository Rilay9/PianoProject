# T36c — One sight-reading run followed from the level request to the next assignment

**Read-only.** You edit nothing under `app/`, `content/` or `tools/`. Your output is one
file: `docs/prompts/traces/2026-09-25-sight-reading.md`.

**Read first:** `docs/prompts/operating-procedure.md` whole. Then
`docs/prompts/audit-2026-09-25-outside.md` message 1, points 2, 3, 6, 9, 11, 15 and 16.

## The goal, in the orchestrator's words

Sight-reading is the one place the app makes music on the spot for the learner, so it is
where "what the app learns from a run and what it does with it" should be most visible.
Follow one run from the request for a level to the next assignment and report what the
generator was asked, what it produced, how the run was judged, what was kept, and whether
anything the learner did changes the next phrase.

## The objects

Two entries, both followed:
1. **The daily read on Today** (`app/src/ui/screens/TodayScreen.ts` near `dailySeed`,
   `router.navigateScore(..., { seed })`), which ticks the day's read.
2. **A rung's sight-reading drill**: one of the drills on 1.3, 1.4, 2.2, 2.5 or
   `technique.5` with `drill.kind === 'sight-reading'`; name the item id and its `params`.

## The stages, and the six questions at each

Level request → generator options → the level table's constraints (keys, range, rhythm,
hands) → the music (MusicXML) → the Score screen → the engine → grading → the summary →
the progress row (seed, the day's read, streak) → what the session builder offers next.

At each stage: the data structure; the source of truth; what is lost; what is assumed;
whether the next stage gets enough; whether the concept is recomputed elsewhere.

Where to look: `app/src/engine/sightReading.ts` (the level table, `generate`, the
left-hand and chord-tone rules, `dailySeed`), `musicXmlWriter.ts`, `app/src/engine/drills/`
(`fromCatalog.ts`, `factories.ts`, `feedback.ts`, `coaching.ts`, `review.ts`),
`app/src/ui/screens/ScoreScreen.ts` (how a generated phrase opens, "Again" on the
summary), `DrillScreen.ts` where the drill face is, `PracticeEngine.ts`, `Scoring.ts`,
`progressStore.ts` (`RunResult.seed`, `readToday`, `dailyReadStreak`), `session.ts` (the
`sightreading` slot: `concepts.includes('sight-reading') && level <= level`), the rung's
stage JSON and lesson, `docs/05-score-follow-engine.md` §8, `docs/04-ui-spec.md` §2 and
§5c, `docs/02-curriculum.md` Part G's sentence on sight-reading drills.

## Questions the trace must answer explicitly

1. **What is the level, and who chooses it?** Where does the number the generator
   receives come from (the rung's params, the stage, a setting, the learner's history)?
   Does anything the learner has done ever change it? If not, that is the audit's point 3
   made concrete: say so as P1 with the lines. Then the distinction the reviewer asked
   for (`audit-2026-09-25-outside.md` Part 2, point 4): **generator constraints are not
   pedagogical difficulty.** Write what `level` actually controls in the generator (range,
   leap size, rhythm vocabulary, keys, hands, chord-tone targeting) and then say,
   separately, whether anything establishes that a phrase built under level-4 constraints
   is appropriate for a level-4 learner, and whether the same number is afterwards treated
   as the learner's ability, as the exercise's difficulty, or as both, with the lines
   where each reading happens.
2. **What the level table trains.** Write the table as a teacher would read it: at each
   level, what reading skill is new (a key, a range, a rhythm, the left hand, a leap) and
   what a phrase at that level therefore demands. Is the progression sensible? Does any
   level introduce two hard things at once? Generate the notation for two seeds at one
   level in your head from the code (or by reading `generate` carefully) and say what a
   learner meets. Do not run the app.
3. **Error analysis.** After a run, what does the engine know (wrong note, missed step,
   timing delta per note, hot spots by bar)? Is any of it turned into a reading
   diagnosis (an interval consistently misread, a rhythm consistently rushed, hesitation
   at a leap)? What does the learner read on the summary? Quote the strings. Against the
   audit's point 9: what happened → what it probably means → what to do next; which of the
   three does the app say?
4. **Evidence kept.** The fields written after a sight-reading run and their readers. Is
   the seed kept so a failed read can be retried on the same music, as `sightReading.ts`'s
   header promises, and does anything then compare the two attempts?
5. **The next assignment.** How the session builder picks the next sight-reading item;
   whether it is the same drill at the same level for ever; what "Again" does to the
   evidence. Would a teacher accept this as a sight-reading regimen for six months?
6. **The teacher's read.** Is a generated phrase musically plausible (a phrase, a cadence,
   a shape) or a random walk that happens to be diatonic? Which is it at levels 1, 3 and
   6? Say what you could not judge without hearing it, in those words.

## Hypothesis status

The orchestrator's hypotheses H1, H2, H3 and H5 in `plan-2026-09-25.md` touch this
trace. For each one your trace meets, report it as **supported by observed evidence**,
**contradicted by observed evidence**, or **unresolved**, and say what you observed. A
code path consistent with a hypothesis does not confirm it. This is an investigation, not
a confirmation exercise; if the evidence points at a different architectural problem,
that is the finding.

## The source-of-truth rows

For each of these that your trace touches, fill a row: **concept | current source of
truth | major consumers | competing definitions?** — learner level, difficulty, skill,
mastery, performance evidence, repertoire level, curriculum stage. Leave rows you did not
touch blank rather than guessing; the orchestrator merges the three traces' tables.

## Findings

P0 / P1 / P2 / P3 per `operating-procedure.md` §8, each with current implementation and
lines, why it matters to a learner, evidence, recommended direction, local fix versus
model change. Rank your top three. Record adjacent problems without following them.

## Rules

Builder tier only. No edits outside `docs/prompts/traces/`. No browser, no builds. Never
name an AI model. An absence carries the scope of its search, after a second search shaped
differently. Do not imply broader verification than you did. Name hypotheses and their
tests.

## Report

Judgement first: in five lines, what a sight-reading run teaches the app about the
learner today and what it would need to. Then the trace, the six questions, the findings,
what is unverified, files read.
