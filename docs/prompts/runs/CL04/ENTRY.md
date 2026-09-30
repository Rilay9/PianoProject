### Entry 175 — CL04 — evidence truth: introduced is not encountered, an unknown version is refused, a timing gap keeps the pitch, a twin run counts once

Base: origin's head **26a913fe** (`git log -1 --format=%h` in the worktree, before anything else). The brief's premises were drafted at 4f5f9eea; between the two, none of CL04's files moved except `ScoreScreen.ts` and `help.ts` (not CL04's), and every premise line was re-read at 26a913fe (the evidence filter sits at `evidence.ts`:765–774, `evidenceFrom` at :529, `EVIDENCE_DEFINITIONS` at :176, as the brief says). Worktree only; nothing committed, pushed, stashed, reset or checked out. Brief `tasks/CL04-evidence-truth.md`; approval `responses/questions-eebafb5e.md` § *CL04 brief — evidence truth* (G70's assign-sheet half **NO**).

## Judgement

**Technical verdict.** All four rows are built at the mechanism the brief named, each hypothesis tested and not refuted, each discriminating test red on the committed code and green after, each row's mutant caught (six mutants in all, two of them extra). The unit suite is green but for three failures that are this machine's (two CRLF claims, one option the offline build could not fetch); `tsc -b`, lint and the app build 0; `shelf.spec` and `today.spec` 38 of 38 on a port of my own. One deviation carries a real consequence and goes to the reviewer: at a step the window cannot time, the rhythm demands are kept in `otherDemands` (counted by none), not dropped from the record, because without them the overlap reads a skip misread only on eighths as a skip **pattern** (mutant L73-overlap: `selectivity: 'pattern'`, `alone 2 of 2`) — the reviewer's Part 8 ambiguity lost.

**Pedagogical verdict — observations only, unverified as music.** Nothing was heard; no one in this process hears. Two screens were looked at: the Skills screen at 342 × 740 before and after (pictures below). The rest is read from the code, the tests and the notation of the constructed phrases.

**What a learner meets differently, per row, and the layer that observed it:**

- **G70.** A learner carried over from before C5 with 3.1 and without 3.3 opens Skills (`#/plan/skills`, Stage 3): the *Accidentals* row's state badge read **"not shown yet"** (`data-state="not-introduced"`) and now reads **"introduced"** (`data-state="introduced"`). *Key signatures*, which 3.1 names in its `concepts`, read "introduced" before and after. Observed in the browser (`pictures/before-…`, `pictures/after-…`, each with its facts JSON) and in the unit layer (`skillsReadTheLadder`). A carried blues.5 puts the walking bass, and a carried 1.5 the leap, in the exposure map; no screen reads either (neither is a vocabulary skill: `texture.walking-bass` is a demand, the leap `interval.leap`). Progress's "skills that moved" leaves out *not introduced ↔ introduced* (`skillMoves`), and the lesson page says both states as "not shown yet" (`ladderWords`), so neither changes. No requirement, encounter, familiarity or competence reads an exposure: the carried 3.1 stays *carried* and *not started*, 3.3's `accidentals: familiar` requirement unheld (unit). Observation: 3.1's lesson introduces sharps and flats and 3.3 teaches accidentals (`docs/02` F2a); "introduced" is what the page did.
- **L70.** Nothing, today: the one writer stamps `definitions: 1` (`OBSERVATION_DEFINITIONS`), which this build knows; a row with no block is `no-measures` as before. A row carrying another version — none exists; it could arrive only in a backup from a later build — was read as version 1 and is now refused on both channels (`not-measured:pitch` / `:timing`, citing `definitions`, detail `unknown-definitions`). Unit only.
- **L73.** A learner who, on two days, misreads both eighth notes of 2.2's phrase at its full tempo (72 bpm, where the ±150 ms window cannot tell an even eighth from a swung one) was told next morning **"Now with both hands — 6 of 6 right and in time yesterday"** and moved on: both hands, the bass staff added over two misread notes a day. Now: **"Another like it — not sure yet what went wrong"**, the same recipe, nothing moved (`readerAdversarial` case 6, run on the committed `evidence.ts` and on the change). Sight-reading counts the eighths by their pitch: 6 of 8, where it counted 6 of 6; the eighth-note rhythm demands stay uncounted; the step and the skip each went wrong only beside an eighth, so nothing is singled out. A right-pitched eighth there counts right. A `reads` requirement (90 % right and in time) can no longer be met by a read that dropped its misread eighths. Unit only; the Today card's words were not looked at on the glass for this learner (`today.spec`'s own learners, at tempos the window resolves, are unchanged and green).
- **L79.** A book piece registered on a rung with a score twin (the Shelf's `itemId`): the lesson page's *Practise* now opens `#/paper/<book>/<piece>?from=<rung>`, and the paper screen's *Practise with the score* opens the twin with that rung, so the Score screen judges the run by the rung's pass pair (not the Settings pair), its Back returns to the rung's page and its side panel shows the rung's lesson (the Score screen's existing `from` behaviour). A measured run there meets the rung's songs requirement **as the book piece**, once; the lesson page's *What the app counts* line reads "(counted: *Study No. 3*)" — the piece's title from the shelf; without the change to the page's titles it would have printed `book.method-book/study-no-3` (mutant L79-title). The rung's badge on Plan and Today's next rung follow the rung state. From the Shelf the twin still opens with no rung and counts for none; the lesson page's *With the score* already carried the rung and its run now counts too. Unit and jsdom layers; not looked at in a browser.

**Counts.** Tests added 19, replaced 1 (case 6's first case in `evidenceAdversarial`), revised 1 (case 6 in `readerAdversarial`), preserved: every other case in the ten touched files, among them `feedbackFromMeasurements`' triplets case and `skillsReadTheLadder`'s carried case (the brief's :61–70); one e2e fixture regenerated (the stamp only). Of the 20 added or replaced cases, 13 red on the committed code and 7 guards green on it by design. Exit codes: below.

**Deviations** (details under *Deviations*): (1) the rhythm demands at an untimed step land in `otherDemands`; (2) `readerAdversarial` case 6 revised and `reader-learners.json` regenerated, neither named by the brief; (3) the lesson page's titles read the shelf; (4) two e2e specs run though the brief adds none; (5) the Skills pictures; (6) the paper screen reads its rung from the route, so `AppShell.ts` is untouched.

**Questions:** one, below (an early note at an untimed step). **The map's e2e line, not run:** `e2e	app	npx playwright test --workers=4` (the landing chain's).

## The mechanism and the discriminating test, per row

**G70 — a carried rung's introductions are exposures.** *Hypothesis:* reading `introduces` in `carriedExposures` is the whole mechanism; refuted if a carried 3.1 still left `accidentals` *not introduced* (then `learnerExposures` or `skillLadders` drops it). *Mechanism:* `Lesson.introduces?: string[]` (`curriculum/types.ts`:545, the built curriculum already carries it); `carriedExposures` walks `concepts` then `introduces`, one date per concept (`rungState.ts`:164). *Discriminating test:* `skillsReadTheLadder` › *3.1 carried and 3.3 not* — the exposure map, `skillLadders` and `buildConcepts` read *introduced*; the rung state unmet. *Red on the committed code:* `AssertionError: expected undefined to deeply equal [ '2026-09-27T08:00:00.000Z' ]` (both the blues.5 and the 3.1 case). Green after, so `learnerExposures` and `skillLadders` pass the exposure through: not refuted. The assign sheet is not touched (the reviewer's NO).

**L70 — refuse an unknown observation version.** *Hypothesis:* an unknown `definitions` is read as version 1 because only absence is checked; refuted if `definitions: 2` already refused. *Mechanism:* `KNOWN_OBSERVATION_DEFINITIONS = new Set([1])` (`measurement.ts`:136; a later version joins, never replaces); `noMeasures` refuses a present value outside it, `why: 'unknown-definitions'`, `cites: ['definitions']` (:145); the `why` list (:107) and the header (:18–21) say so. No stamp moves. *Discriminating test:* `evidenceOnlyMeasured` › *… never read as version 1 (L70)* — 2, 0 and 1.5 refused on both channels and by `evidenceFor`; 1 measured; absent `no-measures`; and › *the one writer's stamp is a version this build knows*. *Red:* `AssertionError: definitions 2: expected { channel: 'pitch', …(3) } to deeply equal { channel: 'pitch', …(2) }` (a measurement map where a refusal belonged): not refuted.

**L73 — the timing refusal per channel.** *Hypothesis:* the timing filter runs on the step list both channels share; refuted if case 6's sight-reading already counted step 3. *Mechanism:* the precision step (`evidence.ts`:804–818) no longer narrows the opportunity; it computes the steps the window resolves (`resolved`) and refuses `precision` only when there are none (the channel rule); `evidenceFrom` takes them (`TimedSteps`, :484) and, at a step outside them, leaves timing out of `here` (:586–587), so `right`, `unattributed` and `toldAt` read only the channels that measured the step; the rhythm demands there (those `rhythmPrecisionByStep` reads, `rhythmDemands`, :475) are counted by none and kept in `otherDemands` (:601, Deviation 1). A timing-only skill reads exactly as before (its `here` is empty at an untimed step). *Discriminating tests:* `evidenceAdversarial` case 6: a misread eighth — sight-reading `{ n: 8, right: 7 }`, `interval.skip` steps `[1, 3, 5]`, wrong `[3]`, both rhythm demands absent from `byDemand`, subdivision `precision`; a right-pitched eighth `{ n: 8, right: 8 }`; eighths throughout still `precision`; two reads alike, the skip below and `ambiguous`. *Red:* `AssertionError: expected { kind: 'measured', …(8) } to match object { n: 8, right: 7 }` (received `n: 6, right: 6`), the same for `{ n: 8, right: 8 }`, and for the readings `below: false`, `alone.of: 0`: not refuted. The eighths-throughout case is green on the committed code by design (it guards the unchanged rule).

**L79 — the twin inherits the rung's listing.** *Hypothesis:* a twin run judged by the rung is dropped at the pool check (`rungState.ts`:326); refuted if that run failed `meetsStandard` or reached the store without a `lessonId` from the lesson page's door. *Mechanism:* `overlayShelf` records each listed piece's twin, `Lesson.paperTwins` (`load.ts`:226–257; `types.ts`:601); `read` counts a run whose `itemId` is the twin of a pooled paper option under that option's id (`twinsOf`, `rungState.ts`:239; :349–356); a twin that is itself pooled counts under its own id alone; `reads`, `done` and `measure` unchanged. The door: `Route.paperFrom` parsed from the one `from=` parser, written into the hash, compared in `setRoute` (`router.ts`:195, :623, :711, :819, :1053); the lesson page's *Practise* passes `current.id` (`LessonScreen.ts`:433); the paper screen reads `router.route.paperFrom` and forwards it to `navigateScore(twin, { from })`, passing none from the Shelf (`PaperScreen.ts`:135, :408–411). The Score screen already records `lessonId` from `from` (`ScoreScreen.ts`:3766). *Discriminating tests:* `rungStateFromEvidence` › *a shelf twin's run counts as the book piece the rung lists (L79)* (five cases), `shelf` › *carries each listed piece's twin*, `paperScreenTwin` (with and without `from`), `router` (round trip; two routes), `lessonPageReadsTheEvidence` › *the Counted line names the piece by its title* (with the door). *Red:* `expected { requirement: { …(3) }, …(4) } to match object { holds: true, have: 1, …(1) }`; `expected undefined to deeply equal { 'book.x/p': 'import.t' }`; `expected "vi.fn()" to be called with arguments: [ 'import.alive', { from: '3.1' } ]`; `expected { tab: 'library', paper: { …(2) } } to deeply equal { tab: 'library', …(2) }`; `expected 'One song from this page … (not yet)' to contain 'counted: Study No. 3'`. The run meets the standard (tempo 100 %, accuracy 1): not refuted.

## Done

1. **G70** — item 1, as above. The assign-sheet half is not built (the reviewer's NO; `ui/assignSheet.ts` untouched).
2. **L70** — item 2, as above.
3. **L73** — item 3, as above, with the stamp: `EVIDENCE_DEFINITIONS` 4 → 5 with a history bullet in its style (`evidence.ts`:179–190); :300–305 corrected (now :317–325), the module header's precision and attribution paragraphs and the `right`/`otherDemands` field notes with it. Evidence stored under 4 is never read under 5 (`readingState.ts`:55) and is queued for `runEvidenceJob` (`evidenceJob.needsRecompute`): until the job has run on a learner's phone, their rows under 4 contribute nothing, as at every stamp move. No threshold moved; `DB_VERSION` stays 9.
4. **L79** — item 4, as above. The *Counted* line's titles: the premise asked to check that a `book.` id prints as the piece's title; it did not (the page's `titleOf` read the catalog alone, where a book piece is not), so the page now falls back to the shelf's title (Deviation 3).
5. **Verification layers.** Unit, red first, each red line quoted above; the chain: the targeted files, the whole suite, `tsc -b`, lint, `build:app`, `checks_for_paths.py` over every touched path.
6. **Mutants** — one per row, all caught, and two extra (below).

## Not done

- **G70's assign-sheet half** — not built, on the reviewer's NO.
- **The whole default Playwright suite** — not run; the landing chain's (the map's e2e line above).
- **`docs/05`, `docs/08`, `docs/02`, `docs/04`** — not edited; `## Doc rows`.
- **`TIMING_PRECISION_QUARTERS` and `DEFAULT_PRECISION_QUARTERS`** stay code constants (the brief: an L57 follow-up, not moved).
- **The brief's `## Record` block** — not written: its event line is the orchestrator's record script's (T58). Until it is appended, `record_mirrors.py --check` and `test_record_mirrors` refuse the tree with one failure: this entry exists and the record still ends at *approved*. The landing's record commit clears it.

## Deviations

1. **The rhythm demands at an untimed step land in `otherDemands`, not nowhere.** The brief: they "stay absent at that step, as today". Absent from the counts they are (`byDemand` holds neither eighth demand; the brief's assertions pass). But dropping them from the record too would make the overlap say that nothing but the pitch demand sat on a misread eighth: over two reads misreading the eighth-note skip of case 6's phrase, `demandReadings` then singles out the skip as a **pattern** (`mutant-L73-overlap.txt`: `alone: { wrong: 2, of: 2 }`, `selectivity: 'pattern'`), though the same learner's quarter-note skips were right — the reader would take skips out of the next phrase. `otherDemands` already means "the vocabulary demands the skill does not count, located on its counted steps"; its note that an every-step skill never has any is the one line that changed. Entailed by the reviewer's Part 8 (keep the ambiguity: a demand of another skill on the same notes is another account of the same miss). **Consumers of `otherDemands`:** `overlapOf` and `demandReadings.stepsOf` (the purpose); G2's `attemptDemands` and `transfer.playedDemands`, which now list an eighth demand located on a fast run's counted steps — "the demands located in the notation a run played", as their notes say, where before a step the window could not time carried none of its demands at all. For the reviewer to confirm.
2. **`readerAdversarial` case 6 revised and `tests/e2e/fixtures/reader-learners.json` regenerated.** Case 6 asserted the old model word for word ("sight-reading judges pitch and time as one outcome, so the two misread eighths are outside its count … proficient"); it is the selection half of the brief's case 6 and is revised with the class *revise* and its old assumption. The fixture test holds the e2e learners to the real path's rows; regenerated with `C4C_WRITE_E2E_ROWS=1`: 7 lines, each `evidenceDefinitions` 4 → 5, nothing else (the learners read at tempos the window resolves).
3. **The lesson page's titles read the shelf** (`LessonScreen.ts`:793–795): the premise's check failed at the line; one fallback, inside the file the approval allowed.
4. **Browser specs run** though the brief adds none: `shelf.spec` (the paper route) and `today.spec` (the regenerated fixture's learners), at two workers on port 5073 through `app/build/cl04/playwright.cl04-5073.config.ts`, a copy of `app/playwright.config.ts` with the port, the base URL, a storage state whose origin is `http://localhost:5073` (an absolute path to `app/build/cl04/storageState.5073.json`), its own output folder, and a web server that previews the already-built `dist` (`vite preview --port 5073 --strictPort`, nothing built during a run). 38 of 38.
5. **Pictures** of the Skills screen, before and after, though the brief asks for none: the one screen G70 changes. The before is the committed `carriedExposures` line restored in the tree, the app rebuilt, pictured, the line put back and the app rebuilt (`build-app.txt` is the final build).
6. **The paper screen reads its rung from the route** (`router.route.paperFrom`, as `ChordChartScreen` reads `chartFrom`), so `AppShell.ts` is untouched; `paperScreenTwin`'s router stub gains a `route`.
7. **Two assertions beyond the brief's list**: a concept both named and introduced is one exposure, one date (G70); a twin run under the rung's 90 % meets nothing (L79). Guards, green on the committed code.

## Follow-ups (classified; none fixed here)

- **"Right and in time" now covers steps timed by nobody** (observation, attaches to CL04/U105). The `reads` requirement's sentence ("… % right and in time", `help.ts`) and the reader's counts ("6 of 8 right and in time yesterday") now include steps whose pitch alone was judged. A small overclaim in words; `help.ts` is U105's.
- **The paper screen's Back says "← Shelf" when a rung's page opened it** (observation, P3 navigation): `paperFrom` now makes a Back to the rung possible; not asked.
- **A book piece's twin changed on the Shelf**: runs of the old twin stop counting for the piece, since the overlay holds the current twin only (observation).
- **The two MAESTRO references** `parity_reference.py` skipped (missing files) and the one mutopia file the offline build could not fetch — environment, not this seam.

## Questions

1. **An early note at a step the window cannot time.** The brief rules that timing measures nothing there, so an `e` (the right key, struck outside the ±150 ms window) at such a step now counts **right** for sight-reading, by its pitch; before, the step was not counted at all. A window too wide to confirm a rhythm can still refute it: a note outside even that window was early. Should an `e` at an untimed step count against a skill that is timed as well as pitched? Built as the brief says. For the reviewer (evidence meaning); one line to change either way (`evidence.ts`:587).

## Files

- `app/src/evidence/evidence.ts` — L73 and the stamp (`EVIDENCE_DEFINITIONS` 5, the history bullet, :300–305's paragraph, the header's precision and attribution, `DemandCount.right`, `MeasuredEvidence.right` and `otherDemands` notes; `rhythmDemands`, `TimedSteps`, `evidenceFrom`'s `timed`, the precision step).
- `app/src/evidence/measurement.ts` — L70 (`KNOWN_OBSERVATION_DEFINITIONS`, `noMeasures`, the `why` list, the header).
- `app/src/evidence/rungState.ts` — G70 (`carriedExposures`) and L79 (`twinsOf`, `read`'s `runs`, the module note).
- `app/src/curriculum/types.ts` — `Lesson.introduces`, `Lesson.paperTwins`.
- `app/src/curriculum/load.ts` — `overlayShelf` records the twins.
- `app/src/router.ts` — `Route.paperFrom`, its parse, hash, `navigatePaper`'s option, `setRoute`'s comparison.
- `app/src/ui/screens/PaperScreen.ts` — forwards the rung to the twin.
- `app/src/ui/screens/LessonScreen.ts` — *Practise* passes the rung; `titleOf` falls back to the shelf.
- Tests: `evidenceAdversarial`, `evidenceOnlyMeasured`, `skillsReadTheLadder`, `rungStateFromEvidence`, `shelf`, `paperScreenTwin`, `router`, `lessonPageReadsTheEvidence`, `readerAdversarial` (all `app/tests/unit/…test.ts`); `taughtByAncestry.test.ts` (one comment, :469, made false by G70: "the app's `Lesson` type does not name it" → names it since CL04 for the carried exposures alone); `app/tests/e2e/fixtures/reader-learners.json` (the stamp).
- Run files: `docs/prompts/runs/CL04/` (this entry, the logs below, `scripts-*`, `pictures/`).

## The itemised content changes

**None.** No lesson sentence, curriculum entry, vocabulary entry, score, edition note or catalogue fact changed: the diff over `content/` and `scores/` is empty; `docs/prompts/inventory.md` and `docs/prompts/rung-claims.md`, which the setup build rewrote (below), were restored. The learner-visible changes are behaviour, listed per row in the judgement; the one the brief named — 3.1's accidentals for a carried-over learner — is the Skills badge "not shown yet" → "introduced" on the *Accidentals* row, nothing else on that screen.

## Tests table

| test | class | old assumption | what it holds now |
|---|---|---|---|
| `evidenceAdversarial` case 6 › a misread eighth at the phrase's full tempo | replace | at an untimeable step pitch and time are one outcome, so the eighths drop out of sight-reading (its pitch half only said interval-reading counted them) | sight-reading 7 of 8 with step 3 wrong; the skip's step 3 wrong; rhythm demands absent from the counts, present in `otherDemands`; subdivision `precision` |
| `evidenceAdversarial` case 6 › a right-pitched eighth is counted right | add | — | 8 of 8; `interval.step` holds step 2 |
| `evidenceAdversarial` case 6 › eighths throughout still `precision` | add (guard) | — | sight-reading and subdivision refused `precision`; interval-reading 7 |
| `evidenceAdversarial` case 6 › two reads alike | add | — | the skip below, `ambiguous`, alone 0 of 2, rival `rhythm.eighths` 4 of 4 where absent; nothing named |
| `evidenceOnlyMeasured` › unknown definitions (L70) | add | — | 2, 0, 1.5 refused on both channels and by `evidenceFor`; 1 measured; absent `no-measures` |
| `evidenceOnlyMeasured` › the writer's stamp is known | add | — | `KNOWN_OBSERVATION_DEFINITIONS` holds `OBSERVATION_DEFINITIONS` |
| `skillsReadTheLadder` › blues.5 carried | add | — | walking bass in the map, the carried date |
| `skillsReadTheLadder` › 3.1 carried and 3.3 not | add | — | accidentals introduced on the ladder and the list; 3.1 carried, not started; 3.3's skill requirement unheld |
| `skillsReadTheLadder` › one exposure, one date | add (guard) | — | a concept named and introduced gets one date |
| `rungStateFromEvidence` › L79 (five cases) | add (1 red, 4 guards) | — | twin judged by the rung meets songs as `book.b/p`; no rung or another rung: nothing; a pooled twin is one item; 80 % meets nothing; the paper run meets nothing |
| `shelf` › the overlay carries the twin | add | — | `paperTwins` for a twinned piece, none without |
| `paperScreenTwin` › with `from` / from the Shelf | add (1 red, 1 guard) | — | `navigateScore(twin, { from })`; `navigateScore(twin)` |
| `router` › paper `from` round trip; two routes | add | — | `#/paper/book.b/p?from=3.1`; without it unchanged; a bad `from` dropped |
| `lessonPageReadsTheEvidence` › the Counted line names the piece | add | — | "counted: Study No. 3", no `book.` id; *Practise* carries the rung |
| `readerAdversarial` case 6 | revise | sight-reading judges pitch and time as one outcome, so two misread eighths are outside its count and the learner is proficient | two reads against the recipe, nothing singled out: `unsure`, the same recipe, nothing moved, no demand named |
| `readerMovesTheDemand` › the e2e learners' fixture | preserve (fixture regenerated) | — | `reader-learners.json` equals the real path's rows under stamp 5 |
| `feedbackFromMeasurements` › triplets (:357), `skillsReadTheLadder` carried case, every other case in the touched files | preserve | — | green |

## Red and green lines

- Red on the committed code: `red-unit-committed.txt` — 8 files, **13 failed, 137 passed** (the 13 new or replaced cases; the lines quoted per row above). `red-readerAdversarial-case6-committed-evidence.txt` — the revised case 6 on the committed `evidence.ts` (swapped in and restored): `AssertionError: Now with both hands — 6 of 6 right and in time yesterday: expected 'forward' to be 'unsure'`.
- Green: `green-unit-targeted.txt` — the eight files with `feedbackFromMeasurements` and `taughtByAncestry`, **192 passed**; `rerun-4.txt` — `readerAdversarial`, `readerMovesTheDemand`, `expectedNote`, `tempoSoundAgainstMark`, **39 passed**.
- The whole suite: `vitest-all-1-summary.txt` (before case 6 was revised and the fixture regenerated): 7 failed — `readerAdversarial` case 6 (the old model), the fixture, `expectedNote` and `tempoSoundAgainstMark` (5000 ms timeouts under the suite's load; both pass alone, `rerun-4.txt`), and the three below. `vitest-all-2-summary.txt` (the final tree): **3 failed, 7468 passed**, 5 skipped, 1 todo — `lessonClaimsAboutApp` › *blues.3 … Rhythm only is not one of them* and › *4.7: blind hides the score …* (the worktree's CRLF checkout, Entry 101's and Entry 84's diagnosis), and `everyOptionOpens` › *offers nothing a learner cannot open* naming `song.ragtime.joplin-pine-apple-rag.mutopia`, the one item the offline build could not fetch (its own warning in `content-build-base.txt`: "the edition's .ly file was not fetched").

## Mutants

`mutants.txt`, each applied alone, its test run, the file restored (`scripts-mutants.py`):

| row | mutant | test | result |
|---|---|---|---|
| G70 | `carriedExposures` back to `concepts` only | `skillsReadTheLadder` › 3.1 carried | caught: `expected undefined to deeply equal [ '2026-09-27T08:00:00.000Z' ]` |
| L70 | the check back to `=== undefined` | `evidenceOnlyMeasured` › L70 | caught: `definitions 2: expected { channel: 'pitch', …(3) } …` |
| L73 | timing's slot left `undefined` in `here` at an unresolvable step | `evidenceAdversarial` › a right-pitched eighth | caught: `expected { kind: 'measured', …(9) } to match object { n: 8, right: 8 }` |
| L79 | the twin counted under both ids | `rungStateFromEvidence` › one item | caught: `have: 2, holds: true` for `have: 1, holds: false` |
| L73 (extra, Deviation 1) | the rhythm demands at an untimed step dropped, not kept in `otherDemands` | `evidenceAdversarial` › two reads alike | caught: `alone.wrong 2`, `selectivity: 'pattern'` |
| L79 (extra) | the lesson page's titles from the catalog alone | `lessonPageReadsTheEvidence` › the Counted line | caught: `(counted: book.method-book/study-no-3)` |

## Exit codes

| step | exit | file |
|---|---|---|
| `git log -1 --format=%h` | 0 (26a913fe) | — |
| `npm ci` (app) | 0 | `npm-ci.txt` |
| `python tools/midi-cleanup/tests/parity_reference.py` | 0 (two MAESTRO files skipped, missing) | `parity.txt` |
| `python tools/content/build.py --offline` (base, before any edit; `content/scores/imported/{kern,musetrainer}` and `build/cache` copied from the main checkout) | 0 | `content-build-base.txt` |
| the setup build rewrote `docs/prompts/inventory.md` and `docs/prompts/rung-claims.md` (two options unmeasured: the unfetched mutopia file) — restored from snapshots taken before it, equal to HEAD; `SOURCES.md` unchanged | — | — |
| new tests on the committed code | 1 (13 red) | `red-unit-committed.txt` |
| targeted files after | 0 | `green-unit-targeted.txt` |
| `npx tsc -b` | 0 | — (empty output) |
| `npm run lint` | 1, then 0 (one unnecessary `as Observed` in my test, removed) | `lint.txt` |
| `npx vitest run` (1) | 1 (7) | `vitest-all-1-summary.txt` |
| `C4C_WRITE_E2E_ROWS=1 npx vitest run readerMovesTheDemand -t …` | 0 | `fixture-write.txt` |
| the four re-run | 0 | `rerun-4.txt` |
| revised case 6 on the committed `evidence.ts` | 1 (red, as it should) | `red-readerAdversarial-case6-committed-evidence.txt` |
| mutants | 6 caught | `mutants.txt`, `mutant-*.txt` |
| `npm run build:app` | 0 | `build-app.txt` |
| `python tools/docs/checks_for_paths.py <19 paths>` | 0 | `checks-for-paths.txt` |
| `npx playwright test --config app/build/cl04/playwright.cl04-5073.config.ts shelf.spec today.spec --workers=2` | 0 (38 passed) | `e2e-targeted.txt` |
| the Skills pictures, before and after (port 5073, one worker) | 0 each | `pictures/` |
| `npx vitest run` (2, the final tree) | 1 (3: two CRLF, one unfetched file) | `vitest-all-2-summary.txt` |
| `python tools/docs/checks_for_paths.py` over the run folder's paths | 0 (names `record-mirrors` and `test_record_mirrors`) | — |
| `python tools/docs/record_mirrors.py --check` | 2: `stale-record: docs/prompts/tasks/CL04-evidence-truth.md:92: CL04's record ends at approved, and Entry 175 (docs/prompts/runs/CL04/ENTRY.md:1) shows it landed` | `record-mirrors.txt` |
| `python -m unittest … -p test_record_mirrors.py` | 1 (the same one failure, in its two tree cases) | `test-record-mirrors.txt` |

The full suite logs were over 300 KB and were not kept; their failures and totals are. Every kept file has this machine's paths replaced by `<worktree>` or `<home>`.

## Unverified, beside what passes

- **Heard: nothing.** Every musical reading (the constructed phrases' steps, skips and eighths; what a tempo lets the window time) is from the notation and the code, **unverified as music**.
- **On a device: nothing.** The Skills pictures are desktop Chromium at 342 × 740, light, one learner; not the owner's phone, not dark, not sideways, not 115 % text.
- **L73's reader line on the glass**: the new Today reason for case 6's learner was read from `readingReason`, not seen on a card.
- **L79 in a browser**: the lesson page → paper → twin path and the *Counted* line are observed in jsdom (the real screens, a fake IndexedDB), not in a browser.
- **The evidence job's recompute** of rows under 4 on a real phone was not run; its path is the one every stamp move takes (`evidenceJobRecomputes` green).
- **G70's pedagogy** beyond the reviewer's ruling (an introduction is an exposure) is unverified; nothing here says a carried learner can read accidentals.

## Post-action gate

The intent was four evidence truths at one boundary; each is read back at its destination — the Skills badge on the glass, the rung state, the refusal, the reader's next offer — not only in the function. No ruling contradicted: the assign sheet untouched (NO), no threshold moved (L57), `reads` untouched (L58), the added misses reach `demandReadings` and nothing reaches `eligibilityCore.ts` (L105), an exposure writes no encounter or familiarity (G71), one twin run is one item (G80). Side effects outside the boundary: the stamp's recompute wait on the phone, the overlap's new entries (Deviation 1, to confirm), the "right and in time" words (a follow-up). No new work opened beyond one question and four observations. VERIFIED: the unit, jsdom and two-spec browser layers named above and the Skills pictures. NOT YET VERIFIED: the landing chain's full Playwright run, a device, anything heard.

## Doc rows

- **`docs/05-score-follow-engine.md`** (not applied; the landing's):
  - :1091–1095, the channel part: after "nothing on a row with no measures block (…, L52)" add "; nothing on a row written under observation definitions this build does not know (`KNOWN_OBSERVATION_DEFINITIONS`, today `{1}`: refused on both channels, `unknown-definitions`, never read as version 1; CL04, L70)".
  - :1104–1111, the precision part: replace "a timing skill counts only the steps where the run's window is narrower … None left, and it is refused." with "the timing channel measures only the steps where the run's window is narrower than the error the skill is about, at the tempo the run kept there (…); at the other steps it measures nothing and the pitch channel still counts, so a misread note there counts against a skill timed as well as pitched and a right one counts right, while the rhythm demands located there are counted by none (CL04, L73). No step resolvable, and the skill is refused." (the table of precisions and the Anh. 113 example unchanged).
  - :1113–1114: "`right` those right on every channel" → "`right` those right on every channel that measured the step".
  - :1135–1137: "For a skill with a demand list, `otherDemands` names the demands it does not count, located on its counted steps" → "… does not count, located on its counted steps — and for a skill read over every step, the rhythm demands at a step its window could not time (L73)".
  - :1141–1144: replace "and a timing step the window cannot resolve is out of the skill's steps and so out of every demand's (at 100 % of a phrase written at 72 bpm the eighths drop out of sight-reading's counts, as the precision rule above already said)" with "and at a step the window cannot resolve the rhythm demands are counted by none and listed in `otherDemands`, while the step's pitch demands are told by pitch (at 100 % of a phrase written at 72 bpm a misread eighth counts against sight-reading and its interval, and the eighth sits beside it in the overlap; CL04, L73)".
  - :1182: "`EVIDENCE_DEFINITIONS` (3)" → "(5)", and after version 2's sentence add "version 3 counts playing together only where the hands are coordinated (C4d), version 4 reads 3/8 as simple triple (L120b), version 5 refuses timing per channel at a step the window cannot resolve (CL04, L73)"; "rows under either" → "rows under any earlier version".
- **`docs/08-test-map.md`**:
  - :61 (the reader row), its last cell: "a demand misread where the window cannot time it drops out of sight-reading's count (C3/C4a)" → "… dropped out of sight-reading's count (C3/C4a; closed in CL04, L73: the misread eighth counts by pitch, `readerAdversarial` case 6 revised)".
  - :66 (one path from evidence to rung state): add "a shelf twin's run counts as the book piece its rung lists, once (CL04, L79: `rungStateFromEvidence`, `shelf`, `paperScreenTwin`, `router`, `lessonPageReadsTheEvidence`)".
  - :67 (one skill state): add "a carried rung's `introduces` is an exposure (CL04, G70: `skillsReadTheLadder`)".
  - :469 `evidenceAdversarial.test.ts`: add "; case 6 per channel since CL04 (a misread eighth counts by pitch, a right one right, eighths throughout still `precision`, two reads leave the skip `ambiguous` with the eighth in the overlap)".
  - :473 `evidenceOnlyMeasured.test.ts`: add "; a row under an unknown observation version refused on both channels, the writer's stamp known (CL04, L70)".
  - :516 `lessonPageReadsTheEvidence.test.ts`: add "; a book piece counted through its twin named by its title, and *Practise* carrying the rung (CL04, L79)".
  - :540 `paperScreenTwin.test.ts`: add "; the twin opened with the rung that opened the screen, and with none from the Shelf (CL04, L79)".
  - :576 `readerAdversarial.test.ts`: add "; case 6 revised in CL04: two days of misread eighths at full tempo are two reads against the recipe, nothing moves".
  - :590 `router.test.ts`: add "; the paper route's `from=` (CL04)".
  - :596 `rungStateFromEvidence.test.ts`: add "; a shelf twin's run as the book piece, once, only from the rung (CL04, L79)".
  - :633 `shelf.test.ts`: add "; the overlay carries each piece's twin (CL04)".
  - :651 `skillsReadTheLadder.test.ts`: add "; a carried rung's `introduces` exposures, blues.5's and 3.1's (CL04, G70)".
- **`docs/02-curriculum.md`** :962–968 (the `introduces` bullet): after "and never a requirement met (the evidence gate reads `targetSkills`)" add "; for a learner carried over from before C5 it is an exposure, as the rung's concepts are — *introduced* on the ladder, never an encounter, familiarity or requirement (CL04, G70) — and it is never written into an imported piece's *What it trains* (the reviewer's ruling, `responses/questions-eebafb5e.md`)".
- **`docs/04-ui-spec.md`** §5d (after the self-report bullet): "*Practise with the score* opens the twin judged by the rung whose page opened the paper screen (`#/paper/<book>/<piece>?from=<rung>`), so its run counts for the book piece that rung lists; from the Shelf it opens with no rung (CL04, L79)."
- **`docs/prompts/checks.json`**: no rows (the brief; T58's). No spec added.
