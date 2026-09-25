# T37 — The app stops reporting and recording what it did not measure

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13;
`docs/prompts/audit-2026-09-25-outside.md` Part 4 (the reviewer's go and its eight
boundaries; boundaries 1, 2, 6, 7 and 8 govern this task); `docs/prompts/diagnosis-2026-09-25.md`
problem 1, D1 and D2 (the facts at their lines, and what this task must *not* become); the
traces `docs/prompts/traces/2026-09-25-generated-exercise.md` §10–§14 and Q6, and
`2026-09-25-sight-reading.md` whole. Then the code: `app/src/engine/Scoring.ts`
(`buildScore`, `evaluateOutcome`), `app/src/engine/PracticeEngine.ts` (`feedWait`, `feedTempo`,
`buildScore`, the early-note path near 925–940), `app/src/data/progressStore.ts` (`recordRun`,
`reviewQueue`, `RunResult`), `app/src/data/db.ts` (`ProgressRow`, `SessionRow`),
`app/src/ui/screens/ScoreScreen.ts` (`showSummary` 2497–2640, `generateSightReadingFor`
158–170, `findRung` 2225–2231, `fromRung` at 219, the record call near 2476),
`app/src/engine/sightReading.ts` (the level table, `generate`, the triplet writer near
388–393), `app/src/curriculum/session.ts` (the `sightreading` slot near 358–372),
`app/src/ui/screens/TodayScreen.ts` (the daily read near 376–410), `docs/02-curriculum.md`
Part G, `docs/05-score-follow-engine.md` §3a and §8, `docs/04-ui-spec.md` §5 (the summary
sheet) and §2 (the daily read).

## The goal, in the orchestrator's words

A learner reads the summary sheet and the progress record, and everything on them was
measured. Nothing about tempo is claimed by a run that did not measure tempo; nothing is
called mastered before the store's own rule is met; a self-report that says "recorded" is
recorded; a sight-reading rung that promises a key, a metre or skips gets phrases that
contain them, proven by a test, and nothing else hard that the rung has not taught; and
the review calendar counts days where the learner lives.

## The rule this task enforces (the reviewer's boundary 6, verbatim in substance)

**Never display or record evidence the engine did not actually measure.** A Wait-mode run
must not acquire tempo evidence because a tempo slider exists. A Wait run is honest
evidence of knowing the notes and no evidence of pulse; the record and the sheet say which.

## What is decided

1. **Wait mode carries no tempo.** The run's stored observation says tempo was not
   measured (`tempoMeasured: false` or its equivalent on `RunResult` and `SessionRow`; one
   boolean, nothing more of a schema); `evaluateOutcome` cannot grant a pass whose criteria
   include a tempo floor above zero from a run with no tempo, and cannot grant master
   eligibility; the sheet in Wait says the notes' accuracy and, in the app's voice, that
   tempo is not judged in *Wait for me* and a pass needs *Keep tempo*. Do not silently
   lower any rung's floor to make Wait pass. This changes what a learner with a piano
   experiences on every rung in the default mode; the owner and the reviewer chose it.
2. **Mastery is two master-standard runs on different days.** `recordRun` keeps the dates
   of master-eligible runs apart from pass dates and marks *mastered* only on the second
   such day; the sheet heads a first qualifying run "Mastery run 1 of 2" and never
   "Mastered" before the store does.
3. **The Timing line appears only when timing was measured** (`timing.n > 0`, or the
   equivalent); the "Tempo N % of written" line is shown as the setting it is when tempo was
   not measured, or omitted; where the piece's tempo was invented by the converter
   (catalog tag `tempo-defaulted`), the line says "of the suggested tempo", not "of
   written".
4. **The self-report is stored.** *How did it go?* passes its answer into `recordRun`
   (`RunResult.selfReport` exists and has no writer from the Score screen) and the row
   records it as self-assessed, per Part G.
5. **A right note played early is not a wrong note and a miss.** Reproduce the double count
   in a unit test on the engine first (a note more than the window early, then the slot
   closing); then fix it so an early right note is one observation, early, not two faults.
   If the reproduction fails, say so and leave the engine alone.
6. **The run is judged by the rung that opened the screen** when one did (`fromRung`), and
   only by the first rung listing the item when none did. The recorded `lessonId` follows.
   Nothing else about completion changes in this task (boundary 2: cross-rung credit and
   completion are Wave C).
7. **Sight-reading receives what the curriculum promises.** `generateSightReadingFor`
   passes `fifths`, `timeSig` and `bpm` from `drill.params`; the nine sight-reading rows in
   `content/catalog.static.json` get the params their rungs promise, read from the rung's
   concepts and lesson (4.5 promises 6/8, triplets and syncopation; 1.5 promises steps
   *and skips*; 5 and 6 promise keys; 2.2 promises eighths; read the rest); where the
   generator cannot produce a promised feature at that level (level 1 is stepwise, so 1.5's
   "skips" needs a level-1 option or a different level), change the generator or the
   params, never the promise. Then a test per row that generates several seeds and asserts
   the promised features are present and the unintended hard ones absent (a rung before
   2.2 gets no eighths; a rung before 4.5 gets no syncopation or triplets; a phrase's range
   stays inside the rung's position where the rung says so). The triplet-bracket fault at
   levels 6–7 is fixed. Do not solve any of this by lowering the claims (boundary 7).
8. **"First attempt" is per phrase, not per screen visit**: reopening the day's read with
   the same seed is not a new first attempt; the seed is kept on the session row so a
   retry on the same music can be told from a new phrase.
9. **The review queue compares day keys** (or parses `YYYY-MM-DD` as a local date), with a
   test under two time zones.
10. **Stage 1 sessions get their sight-reading row**: the slot's filter admits the rung's
    own drill (a learner on 1.5 gets `sight-reading-1`), without admitting a Stage 3 drill to
    Stage 1. The smallest rule that does both; say which.

## What is the agent's judgement

The words on the sheet (in the app's voice: calm, concrete, a teacher's sentence; add them
to `help.ts` or wherever the sheet's strings live, and to `04` §5). The exact shape of the
one boolean. The order of the ten items; a sensible order is 1–3 (Scoring, the store, the
sheet), 4, 6, 9, then 7–8, then 5, then 10. Where the reproduction in 5 or a test in 7
shows the trace was wrong about a mechanism, say so and act on what you measured.

## Hypotheses you inherit as questions

- That `deltas` is written only in the Tempo path (`PracticeEngine.ts:964`, `:991`): confirm
  by reading `feedWait`, and confirm the sheet's Timing line is reachable in Wait before
  writing the test that proves the fix red.
- That `sightReading.ts` already honours `fifths` and `timeSig` when given (the trace says
  its tests cover both): confirm with one generated phrase each before wiring.
- That a level-1 phrase cannot contain a skip: confirm in the level table, then decide
  whether 1.5 gets a level-1 skips option or its own level, and say why.

## Rules and files

You own: `app/src/engine/Scoring.ts`, `app/src/engine/PracticeEngine.ts`,
`app/src/engine/sightReading.ts`, `app/src/data/progressStore.ts`, `app/src/data/db.ts` (a
field, no version bump unless a store changes shape), `app/src/curriculum/session.ts` (the
sight-reading slot only), `app/src/ui/screens/ScoreScreen.ts`, `app/src/ui/help.ts`,
`app/src/ui/screens/TodayScreen.ts` (the daily read only), `content/catalog.static.json`
(the nine sight-reading rows only), `app/tests/unit/**`, the e2e specs that read the summary
sheet or open a sight-reading drill (`score.*.spec.ts` that assert sheet strings, `modes-*`,
`lesson-flow`, `first-day`), `docs/02` Part G (one dated note), `docs/04` §5 and §2,
`docs/05` §3a and §8, `docs/08-test-map.md`, and a new entry in `docs/pending-review.md`
(next free number after the tail). **Not** `app/src/score/WindowRenderer.ts`,
`slots.ts` or `ScoreSession.ts` (the window task owns them; it has finished before you start,
so the tree you see is the one to build on). Never `git add -A`; no commits, no push, no
stash. Never name an AI model. Never assert a number measured on this machine in a test.

The content build: after editing the nine rows run `python tools/content/build.py` (see
`tools/content/README.md`) so `app/public/content` carries them; the five-finger re-level
task has already rebuilt before you start, so build once, after your edits. Before
re-serialising `catalog.static.json` compare a round-trip against the raw bytes and splice
text if it differs (CLAUDE.md, the JSON hazard).

Playwright: you are the only user of port 4173 while you run; one config at a time; stop
the preview server before `npm run build:app`; never build during a run; unpiped runs.
Every fix ships with a test seen red without it; say so with the line.

## When to deviate

If a decided item, once measured, would make the app say something false in a new way
(for instance, a Wait sheet that reads as a failure when the notes were right), change the
words, not the rule, and say so. If two items conflict in the code, the rule in §"The rule
this task enforces" wins. If an item cannot be finished, leave it with an explicit not-done
line and the reason; do not stop silently. Keep the change local (boundary 8): no
refactor of the progress or curriculum modules beyond the fields named.

## Report

Judgement first: does the sheet and the record now say only what was measured, and what
would a teacher say the Wait sheet now tells a learner. Then Done / Not done / Follow-ups /
Questions / Files; per item the mechanism, the discriminating test, the red line, and
before and after; the pedagogical verdict on the sight-reading phrases apart from the
technical one (what a rung's phrases now contain, seed by seed for two seeds per rung, and
what could not be judged without hearing). Unverified beside what passes. Append the same
as the entry.
