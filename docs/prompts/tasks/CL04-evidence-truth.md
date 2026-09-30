# CL04 — evidence truth (G70, L70, L73, L79; `convergence-2026-09-30.md`:153–166; the first learning-system cluster, `responses/questions-53670d2a.md` §7 item 2; app only; reviewed before dispatch)

**Read first:** `docs/prompts/operating-procedure.md` §1–§5, §11–§13. The rows: `backlog-2026-09-25.md` G70 :246, L70 :349, L73 :352, L79 :358; their table lines in the convergence file :691, :747, :748, :753; the sources, `docs/pending-review.md`:16462 (L73, adversarial case 6) and :16721 (L79).

## Rows it closes
G70 (in part: deviation 1), L70, L73, L79.

## Rulings that bind it (`questions-53670d2a.md` §3, verbatim)
- **L57:** "A number that changes whether a learner has demonstrated a skill belongs with the definition stamp, not as an invisible magic constant." Here: no threshold moves; L73 changes a rule, so it moves the stamp (item 3). A threshold found to need moving moves with the stamp, never alone.
- **L58:** "A supported read with note names visible does not establish the same independent-reading evidence as a names-off read." Here: no condition relaxes; `reads` is untouched; a twin run meets `runs`, never `reads`.
- **L105:** "Do not put transient recent-miss logic into the eligibility/coping gate." Here: L73's added misses reach `demandReadings`, never `eligibilityCore.ts`.
- **G71:** "A card prompt is not material familiarity merely because sound was emitted." Here: an exposure makes a skill *introduced* and nothing more; it writes no encounter and no familiarity.
- **G80:** "Sometimes, based on relationship and material difference, never merely because the identity differs." Here: a twin is a copy of its book piece, not another context; one run is one item, never two.

## Premises at the lines (HEAD 4f5f9eea)
- **G70.** `app/src/evidence/rungState.ts`:145–165, `carriedExposures`, loops `lesson.concepts` (:156) only. `skillLadders` (:114–135) reads exposures by vocabulary skill id (:129–132); `SkillsScreen.buildConcepts` (:92–121) lists `lesson.concepts` and shows a ladder only for a skill id. `Lesson` (`curriculum/types.ts`:534–) declares no `introduces` (a grep of the file); the built curriculum carries it. Three rungs have one: 1.5 `leap` (stage-1.json:360), 3.1 `accidentals` (stage-3.json:25), blues.5 `walking-bass` (stage-5.json:197). Only `accidentals` is a vocabulary skill with an observable (`vocabulary/skills.json`:188–194). **So one change shows:** a learner carried over with 3.1 and without 3.3 (whose concepts name it) sees Accidentals *introduced* on Skills, where it read *not introduced*. blues.5's walking-bass exposure enters the map and no screen reads it. `ui/assignSheet.ts`:240–243 fills `#assign-concepts` from `lesson.concepts` alone; the text is saved as the import's `concepts` (:273–277), which the Library sheet prints as *What it trains* (`LibraryScreen.ts`:733).
- **L70.** `evidence/measurement.ts`:127–129, `noMeasures`, refuses only `definitions === undefined`; `takeMeasurements` (:210–212) reads nothing else of the version; the `why` list is :103. `OBSERVATION_DEFINITIONS = 1` (`data/db.ts`:115), stamped by the one writer (`ScoreScreen.ts`:3314).
- **L73.** `evidence/evidence.ts`:765–774 filters `steps` by `windowDiscriminates` for any skill with a timing channel; `evidenceFrom` (:529–) walks only those steps and calls a step right only where every channel is (:552), so a step dropped for timing is dropped for pitch. Stated at :300–305 and `docs/05-score-follow-engine.md`:1141–1144; pinned by `evidenceAdversarial.test.ts`:266–280 (case 6). `EVIDENCE_DEFINITIONS = 4` (:176, history :148–175); `readingState.ts`:55 reads the current stamp only; `evidenceJob.needsRecompute` (:73–77) queues the rest.
- **L79.** `rungState.ts`:212–222, `poolOf`, is the rung's option ids; :326 drops a run whose `itemId` is not among them, and a twin's catalog id is not unless the twin is itself a song of the rung. `overlayShelf` (`curriculum/load.ts`:218–244) adds `book.<book>/<piece>` to `paperOptions` and records no twin. Doors: `LessonScreen.ts`:438 opens the twin with `from: current.id`; its paper *Practise* (:430) carries no rung, and `PaperScreen.ts`:397–400 opens the twin with none (the paper route has no rung: `router.ts`:600–613, :699–701, :800–804). `ShelfScreen.ts`:497 passes none: opened from nowhere, no rung (C1). The Score screen judges by `scoreRung ?? scoreFrom` (:3096–3102).

## Hypotheses and refuting tests
1. **G70:** reading `introduces` in `carriedExposures` is the whole mechanism. Refuted if a carried 3.1 still leaves `accidentals` *not introduced* (then `learnerExposures`, `data/skillsStore.ts`:74–89, or `skillLadders` drops it).
2. **L70:** an unknown `definitions` is read as version 1 because only absence is checked. Refuted if `definitions: 2` already refuses at HEAD.
3. **L73:** the timing filter runs on the step list both channels share. Refuted if case 6's sight-reading already counts step 3 at HEAD (then look at `measuredRun`, :425).
4. **L79:** a twin run judged by the rung is dropped at :326. Refuted if that run fails `meetsStandard` or reaches the store without a `lessonId` from the lesson page's door.

## What to build
1. **G70 — a carried rung's introductions are exposures.** Truth: a carried-over learner gets the exposure each carried rung introduces. Mechanism: `introduces?: string[]` on `Lesson`; `carriedExposures` walks `concepts` then `introduces`, one date per concept. No requirement, evidence or encounter reads it. The assignSheet half is not built (deviation 1).
2. **L70 — refuse an unknown observation version.** Truth: a row written under definitions this build does not know measures nothing on either channel; today it is read as version 1. Mechanism: a known set in `measurement.ts` (today `{1}`; a later version joins it, never replaces it); `noMeasures` refuses a present value outside it, `why: 'unknown-definitions'`, `cites: ['definitions']`; the `why` list and the header (:14–17) say so. No stamp moves: stored rows carry 1 or nothing.
3. **L73 — the timing refusal per channel.** Truth: at a step the window cannot resolve the timing channel measures nothing and the pitch channel still counts: a misread eighth counts against sight-reading (and hand-independence) and against the step's pitch demands; a right one counts right. The rhythm demands whose precision the window missed (the ones `rhythmPrecisionByStep` reads: `copedWithBy` in `TIMING_PRECISION_QUARTERS`) stay absent at that step, as today. Mechanism: keep those steps in the opportunity; tell `evidenceFrom` which steps timing measured; elsewhere leave timing out of `here`, so `right` and `toldAt` read only the channels that measured the step. Unchanged: a skill whose timing measures no step of the run is refused `precision` (the channel rule of :740–744); a timing-only skill is as today. Stamp and docs: see *The stamp*.
4. **L79 — the twin inherits the rung's listing.** Truth: a measured twin run judged by a rung listing the book piece counts toward that rung's `runs` requirements as the book piece; the lesson page's *Counted* line prints `items` through its `titleOf` (`help.ts`:965): check that it names a `book.` id by the piece's title. Mechanism: `overlayShelf` records each listed piece's twin on the rung (a map from paper id to twin id, declared on `Lesson`); `read` counts a run whose `itemId` is the twin of a pooled paper option under that option's id; a twin that is itself pooled counts under its own id only (one run, one item). `reads`, `done` and `measure` are unchanged. The door: the paper route carries an optional `from`, as the chart's does (`router.ts`:143–150); `LessonScreen.ts`:430 passes `current.id`; `PaperScreen` forwards it to `navigateScore(twin, { from })`, and passes none when opened from the Shelf.

## The stamp (L57)
No threshold moves. L73 moves `EVIDENCE_DEFINITIONS` from 4 to 5, with a history bullet in its style: evidence stored under 4 is never read under 5 (`readingState.ts`:55) and waits for `runEvidenceJob`. Correct :300–305, `docs/05`:1141–1144, and :1182, which still says 3. G70, L70 and L79 change no stored evidence and move no stamp; `DB_VERSION` stays. `TIMING_PRECISION_QUARTERS` and `DEFAULT_PRECISION_QUARTERS` are L57 thresholds held as code constants: a follow-up, not moved (the vocabulary files are L120d's).

## Acceptance, by layer, red first on the committed code
**Unit**, each seen red at HEAD with its line quoted:
- **G70**, `skillsReadTheLadder.test.ts`: a lesson mirroring blues.5 (stage-5.json:188–199) carried puts `walking-bass` in the map with the carried date. A lesson mirroring 3.1 carried, with another lesson naming `accidentals` in its concepts: `skillLadders` reads *introduced* and `buildConcepts` shows it. The carried rung stays unmet in `rungState`. Keep :61–70.
- **L70**, `evidenceOnlyMeasured.test.ts`: `definitions` 2, 0 or 1.5 gives both channels `unknown-definitions`, and `evidenceFor` refuses `not-measured:pitch`/`timing` citing `definitions`. 1 is unchanged; absent is still `no-measures`.
- **L73**, `evidenceAdversarial.test.ts` case 6 (replace its pitch-half premise): sight-reading's `n` counts step 3; its `interval.skip` lists step 3 as wrong; both rhythm demands are still absent; subdivision is still `precision`. Add a right-pitched eighth counted right, and a phrase with no resolvable step still refusing sight-reading `precision`. Preserve `feedbackFromMeasurements.test.ts`'s triplets case (:357).
- **L79**, `rungStateFromEvidence.test.ts`: through `overlayShelf`, a rung lists `book.b/p`, whose twin `import.t` is not a song. A measured `import.t` run judged by the rung meets a songs `runs` requirement, with `items` `['book.b/p']`. Judged by no rung or another rung, it meets nothing. A twin that is also a song is one item. A paper (self-report) run meets nothing. `shelf.test.ts`: the overlay carries the twin. `paperScreenTwin.test.ts`: with `from` the button calls `navigateScore(twin, { from })`; without it, no rung. `router.test.ts`: `#/paper/b/p?from=3.1` round-trips; without `from` nothing changes.

**Browser:** none added. No screen's drawing code changes; Skills and the lesson page render the readings pinned above.

**Chain:** the targeted files, then `npx vitest run` (the two CRLF `lessonClaimsAboutApp` claims may fail locally: name them if they are the only red); `npx tsc -b`; `npm run lint`; `npm run build:app`; `python tools/docs/checks_for_paths.py <every touched path>`.

## Mutants (one per row)
- **G70:** `carriedExposures` back to `concepts` only → the 3.1 case.
- **L70:** the check back to `=== undefined` → the `definitions: 2` case.
- **L73:** timing's slot left `undefined` in `here` at an unresolvable step → the right-pitched-eighth case.
- **L79:** the twin counted under both ids → the one-item case.

## Deviations
1. **G70's assignSheet half is not built: a question to the reviewer.** `introduces` is "a measurable concept the lesson introduces while no piece on the rung practises it yet" (`docs/02-curriculum.md`:942–943). Defaulting it into an import's concepts writes it into that piece's *What it trains* (`LibraryScreen.ts`:733), a teaching claim the definition denies. It is built only on the reviewer's word.
2. **L79 reaches past the convergence's file list**, to `curriculum/types.ts`, `curriculum/load.ts`, `router.ts` and `LessonScreen.ts`, because the paper route carries no rung. `router.ts` makes the map name the whole default Playwright configuration; that run is the landing chain's.
3. **L73's red case is in `evidenceAdversarial.test.ts`**, where case 6 lives, not in `feedbackFromMeasurements.test.ts`, which the convergence table names.

## Handoff
`docs/prompts/runs/CL04/ENTRY.md`, starting `### Entry 175 — CL04` (N from the orchestrator). **Judgement first:**
- per row, what a learner now meets differently, and which layer observed it;
- the counts: tests added, replaced, preserved; exit codes;
- deviations; questions;
- the map's e2e line, **not run**, as the map prints it.

**Then:**
- per fix: the mechanism, the discriminating test, its red line;
- the tests table (class, old assumption);
- what is unverified, beside what passes;
- `## Doc rows`: `docs/05` as above, `docs/08-test-map.md` for the changed tests, `docs/02`:942–946 if exposure is described there.

State the technical and pedagogical verdicts apart. The pedagogical one is observations only, with "unverified as music" in those words.

**`docs/prompts/checks.json`:** no rows. No spec is added; T58 owns the file, so a new spec's row would be proposed in the handoff, never written.

## Harness and lanes
- **Harness.** Own worktree from origin's head at dispatch (4f5f9eea at drafting), set up as G86a's *Fresh-worktree setup*. It never commits, pushes, stashes, resets or checks out, and never writes in the main checkout. No Playwright: there is no screen case. If one proves needed, use a config copy under `app/build/cl04/` on port 5073 with an absolute `storageState`, never port 4173. Temp files go under the worktree's `build/`; no log over 300 KB. At the end, delete `app/dist`, `app/test-results`, the copied caches and the config copy; `app/node_modules` stays until the orchestrator removes the worktree, so a rework or a question needs no reinstall. Never name an AI model; never assert a number measured on this machine. Every item is done or gets an explicit not-done line; a premise here found wrong is said, and the better path taken.
- **Not yours:**
  - L120d: `eligibilityCore.ts`, `session.ts`, the stage and vocabulary files, the refusal table;
  - U105: `ScoreScreen.ts`, `help.ts`. L70's new `why` would reach `notJudgedLines`' timing line only for a row this build did not write, never the sheet of a run it just stamped: recorded, not edited;
  - U32: `WindowRenderer.ts`;
  - T58: the record tooling, `checks.json`;
  - E50: `convert.py`, `build.py`, `material.ts`.

  No row needs one of these files, so none is deferred.

## Record

lane: CL04 · closes: G70, L70, L73, L79 · entry: 175
index: Evidence truth: carried exposures read `introduces`, unknown observation versions refused, a misread eighth still counted by pitch, a shelf twin's run credited (backlog G70, L70, L73, L79; CL04) | app | brief drafted 2026-09-30 (`CL04-evidence-truth.md`); with the reviewer before dispatch; Entry 175
in-flight: brief drafted 2026-09-30 (`CL04-evidence-truth.md`): four evidence-truth corrections at the learner-evidence boundary (G70, L70, L73, L79; the convergence map's CL04, tier 1; the reviewer's queue item 2); with the reviewer before dispatch (Entry 175).
state: with-reviewer 2026-09-30: with the reviewer before dispatch (the morning bundle)
- approved 2026-09-30: APPROVE FOR DISPATCH, G70's assign-sheet half NO (`introduces` never written onto an imported piece's *What it trains*); the L79 file widening justified by the route truth (`responses/questions-eebafb5e.md`)
- dispatched 2026-09-30: dispatched at 26a913fe, building (Entry 175); G70's assign-sheet half stays unbuilt as approved
