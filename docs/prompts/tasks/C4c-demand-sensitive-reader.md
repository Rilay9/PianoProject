# C4c — The demand-sensitive reader, and the skip learner run again

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/prompts/audit-2026-09-25-outside.md` Part 8 (the reviewer's third message: points 1, 2, 3, 5 and 8, and the four things the second stop must show); `docs/prompts/checkpoint-2026-09-26-reading.md` §2 and §4 (what a teacher would not do); `docs/prompts/checkpoint-2026-09-26-diary.md` (the thirty days you rerun); `docs/pending-review.md` Entry 73 (C4: `readingOffer`, the six dimensions and their options, `stepDown` backing out the last added dimension — the mechanism of the fault — `EASY_AFTER`, the reason words, `firstThirtyDays` and `helpers/reader.ts`), Entry 75 (C4a: `byDemand`, `overlap`, `demandReadings` with `isolated`, `pattern`, `ambiguous`, the evidence stamp), Entry 76 (C4b: each demand's `dimension` and `option`, `unrealisable`, `unrealisableAt`, the new options), Entry 74 (T42); the matrix rows L64, S25, U52, S14, S24. Code: `app/src/curriculum/session.ts` (`readingOffer` and its dimension table, near lines 540–720), `app/src/ui/screens/TodayScreen.ts` (the daily-read card and the reading row's reason), `app/src/ui/help.ts` (the reason words), `app/src/evidence/readingState.ts` (read), `app/src/engine/sightReading.ts` (read: the options C4b added), `app/tests/unit/{sightReadingFromReadingState,recommendRespondsToEvidence,firstThirtyDays}.test.ts`, `helpers/reader.ts`, `app/tests/e2e/today.spec.ts`, `docs/04-ui-spec.md` §2, `docs/05-score-follow-engine.md` §8.

## The goal, in the orchestrator's words

The reader stops backing out whatever it added last. It moves the dimension the evidence points at when the evidence isolates a demand or shows a repeated selective pattern; when the evidence is ambiguous it says it is not sure and does not pretend; it steps up to the next demand the rung has taught, which C4b guarantees the generator can write; and it never calls a different key a harder one. Then the same thirty-day learner is run again and read as a teacher, and the second stop answers the reviewer's four questions with evidence.

## What is decided

1. **A step down targets the demand's dimension.** After two bad reads, `readingOffer` reads `demandReadings` (C4a): if one demand of the failing skill is `isolated` or `pattern`, the next recipe changes that demand's dimension only (skips off for a skip pattern; eighths off for a rhythm pattern; the left hand only when the hands-together demand itself patterns), holding every other dimension, and the line says why in the app's words with the evidence's numbers ("skips went wrong on two days — this one moves by step"). If every demand fell together (`ambiguous`), no dimension is blamed: the recipe is held, the next read is the easy one, and the line says the app is not sure yet what went wrong. The last-added dimension is no longer the default target.
2. **A step up targets the next taught demand.** After proficiency over two days, the next recipe turns on the first demand, in the taught-at order for the learner's rung, whose reading is not yet proficient and whose option C4b declares realisable there; where `unrealisableAt` says no for every candidate, the line says the next step waits for a later lesson, as today, and names nothing false.
3. **A key change is a different key.** Moving `fifths` is never described as "now" or as harder; the words say what the new key asks ("a key signature to read: G major, one sharp"), and the easy read back to C is "an easy one" as today. No key is ranked above another anywhere in the reader.
4. **The easy band and the rung floor** stay as C4 built them; the day-one behaviour (the rung's own row) stays.
5. **The rerun.** The same constructed learner and calendar as `firstThirtyDays` (2.2 for days 1–10, 2.5 for 11–20, 3.1 for 21–30; every skip misread on days 3–6), through the real code, written to `docs/prompts/checkpoint-2026-09-27-diary.md` in the same shape as the first diary. Two more constructed cases as tests, not diaries: a learner who on one day gets one note wrong under four demands (no false diagnosis; the line admits uncertainty), and the skip learner with both hands (the left hand is kept while skips are addressed, unless the hands-together demand itself patterns — assert which).
6. **The four demonstrations** of the second stop, each as a test and a diary line: repeated skip-specific failure changes the interval dimension, not hands; ambiguous mixed failure produces no specific diagnosis; the 2.5 learner reaches ties or dotted quarters instead of waiting; every reason line says only what was established (a test walks every line the diary produced against the evidence it cites).

## The tests

- **Add** `readerMovesTheDemand.test.ts` (items 1–3: the skip learner's day 7 offer, the ambiguous learner's, the two-hand skip learner's, the key words), the four demonstrations in `firstThirtyDays.test.ts` (class: revise, old assumption: a step down backs out the last added dimension; the diary's days 6, 14–19 and 24 change), `recommendRespondsToEvidence` (the reading part gains the demand cases). Red first on the committed code: the skip learner's day-6 offer is "right hand only" (quote the line), day 14 is "waits for a later lesson".
- **Revise** `sightReadingFromReadingState.test.ts` where it asserted the last-added rule (old assumption named).
- **Preserve** `sightReadingPromises` and `generatorContract` (C4b), `evidenceByDemand` and `demandReadings` (C4a), `sightReadingSlot`'s floor cases, `readingState`.

## What is the agent's judgement

The reason words (in `help.ts`, printed in `04` §2); the order of candidates for a step up when several demands are taught and unread; how a `pattern` on a demand whose dimension is already at its floor is handled (hold and say so).

## Hypotheses you inherit as questions

- That C4a's `pattern` appears by the second bad day on the constructed skip learner (C4a's test says so on five reads; the diary has two bad reads before the move is due — check, and if the pattern needs a third read, the reader holds one more day and the diary shows it).
- That C4b's options compose with C4's dimension table without a second table (the demand's `dimension` and `option` should let you delete C4's hand-written map; if not, say why).

## Rules and files

You own `app/src/curriculum/session.ts` (the reader), `app/src/ui/screens/TodayScreen.ts` (the daily-read card's reason and the reading row's), `app/src/ui/help.ts` (the reason words), the tests named and `helpers/reader.ts`, `docs/prompts/checkpoint-2026-09-27-diary.md` (new), `docs/04` §2, `docs/05` §8, `docs/08-test-map.md`. Not the evidence module (C4a; a gap is a report item), not the generator or the vocabulary (C4b; a gap is a report item), not the sheet, not the other slots. You are alone in the tree and the only browser user. Playwright from `app/`: one config at a time, port 4173, two workers, unpiped, waiting on `data-settled`; stop the preview server before `npm run build:app`; never build during a run. Look at the skip learner's Today card on the glass on day 7 (the moved recipe and its line) and on the ambiguous learner's day, at 342 × 740, and keep the pictures. U51 (the cut reason on the session card) stays where it is unless your words need the room; if they do, wrap the session card's reason as C4 wrapped the daily card's and say so. No commits, no push, no stash, never `git add`. Never name an AI model. Never assert a number measured on this machine. Every change with a test seen red first; every touched test classified. Your entry goes to your scratch folder as `ENTRY.md`, headed "### Entry 77 — C4c: …".

## When to deviate

If the evidence on the constructed skip learner never isolates or patterns skips (C4a's facts do not support the move), do not lower C4a's thresholds from here: hold the recipe, let the line say the app is not sure, and make that the first line of your report — it is the second stop's most important finding. If a step up C4b declares realisable produces a phrase whose detector does not find the demand, report it as C4b's contract broken, with the seed.

## Report

Judgement first: the thirty days again, read as a teacher — days 3–7, 11–20 and 22–25 against the first diary — and the four demonstrations answered with the evidence each rests on. Then Done / Not done / Follow-ups / Questions / Files; the red lines; the tests table; exit codes from unpiped runs (`tsc -b`, lint, vitest, `build:app`, `today`, `doors`, `first-day`, `lesson-flow`); unverified beside what passes.
