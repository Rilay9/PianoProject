# SR2: the daily read held to the learner's taught set, and 3/4 split from compound metre

Drafted 2026-10-06 at HEAD `9728c7b6` on `claude/piano-teaching-app-bo19td`. The worktree is cut from origin's head at dispatch; the orchestrator writes that sha here before dispatch: `<dispatch sha>`. Lane name: **SR2**.

This brief carries no `ability:` line. It is a progression-truth correction to the sight-reading rows and the vocabulary, not a learner-facing ability chain, so the chain checker's brief lint skips it and the instructional-chain, failure-route and independence-test headings do not apply.

Binding:
- `docs/prompts/FABLE.md`: §5 (generated-content quality; "not heard"), §6 (evidence: never pretend), §7 (one library per property), §10 (a narrow seam whose design was already reviewed).
- `docs/prompts/operating-procedure.md`: §10b (the rationale below), §11 and §12 (the report), §13 (one materially different approach written beside each decision the builder takes), §14 (the harness, cited once under *Harness*).

**The specification is the reviewer's ruling, `docs/review/responses/sr1-sightreading-quality.md` §1, §2, §3, §4 and §6, which is SETTLED.** Read it whole before anything else. The findings behind it are Entry 251 in `docs/pending-review.md` and the handoff `docs/review/handoffs/sr1-sightreading-quality.md`. The research lane's drafts (`docs/prompts/runs/sightreading-quality/drafts/correction.diff` and `drafts/sightReadingProgression.test.ts.txt`) are evidence of what went red and why. They are **not** the change to apply.

Status labels:
- **VERIFIED**: the writer read it at the cited lines at `9728c7b6`; the builder re-checks before relying on it.
- **CLAIM**: a premise the builder verifies at the lines before acting.
- **HYPOTHESIS**: expected, with the test that refutes it.
- **OPEN**: measured and reported, not decided here.
- **SETTLED**: decided here; deviate only under *When to deviate*.
- **OUT OF SCOPE**.

---

## Decision rationale (operating-procedure §10b)

The design is the reviewer's ruling. This brief adds no product rule beyond it. It names the mechanism's constraints, the blast radius and the evidence. Both defects are learner-facing.

- **Learner problem.**
  1. **The daily read.** A learner on rungs 0.1 to 1.2 opens Today and is handed a sight-reading phrase that asks for things their path has not taught. At 0.1 to 0.4 the phrase has steps, which 1.1 teaches. At 1.1 and 1.2 it has skips, which 1.5 teaches. Today reaches the learner every session, so this is the most-met reading defect in the app (ruling §2).
  2. **3/4.** Lesson 1.4 teaches 3/4 and the dotted half (`content/lessons/1.4.md:23`). The app's own contract treats every non-4/4 metre as untaught until 4.5. As a result no reading row ever writes 3/4, and nothing holds 3/4 back from a learner before 1.4. The curriculum states one fact in two contradictory places (ruling §1).
- **Solution classes considered.**
  - *For the daily read:*
    1. **Chosen: the generation hold becomes the learner's taught set, and the judging rung stays.** The rung that opens the phrase, judges the run and is stored as `opened.rung` stays `rungForSlot`'s (1.5 for the unanchored row). The phrase is held to what the learner's own rung has taught. Where no valid phrase exists under that set, there is no daily read yet.
    2. *Route the daily read to the learner's rung, so that it is both judged and held there.* Refused. The ruling keeps the judging rung for route and evidence semantics. Also, `rungForSlot` returns a rung only where that rung lists the item, and no rung before 1.3 lists a reading row, so the run would be judged by no rung. That is an evidence change nobody ruled.
    3. *Carry the hold as recipe moves (`skips: false` in the route's recipe).* Refused. The recipe is stored on the run and read back as the learner's working recipe (`readingOffer`, `lastWorking`). A 1.5 learner would inherit `skips: false` as if the reader had chosen it.
    4. *Choose another row for the unanchored learner (`-1-left`).* Refused. It writes the bass clef, which 1.3 teaches; held at 1.1 it collapses to `-1`'s right-hand shape anyway. At 0.x no row avoids steps (`interval.step` has no `off`, and every phrase moves by step).
    5. *No daily read at all before the first anchored rung (1.3).* Refused. At 1.1 and 1.2 a valid phrase made only of steps exists, and the ruling withholds the read only "if no valid phrase can be generated".
    6. *A lesson sentence telling the learner skips come later.* Refused. The phrase would still ask something untaught.
    7. *No change.* Refused by the ruling.
  - *For 3/4:*
    1. **Chosen: a new vocabulary demand meaning exactly 3/4, taught at 1.4, with its own detector, control and coper.** The generator's hold follows it. The contract tests read it rather than hard-coding "before 4.5 means 4/4".
    2. *A broad `metre.triple`.* Refused. The ruling (§1) asks for an id whose scope is 3/4. 3/8 is simple triple too (`detect.ts`'s own `isCompound` note), and 1.4 does not teach it.
    3. *Hard-code "3/4 allowed from 1.4" in `promises.ts`.* Refused. That is a second copy of the truth, which the ruling forbids.
    4. *Move 3/4's teaching later.* Refused. The lesson is right; the sources place 3/4 at ABRSM Grade 1 (`LEVEL-SPEC.md`, Metre).
    5. *Widen `metre.compound`.* Refused. Its 4.5 boundary stays (ruling §1).
- **Why the chosen paths beat the others.** Each corrects the one fact in the one place the ruling names. The daily-read change touches only the unanchored daily read: the session slot never offers an unanchored phrase (`session.ts:1786`), and every anchored hold is already checked by `generatorContract`. The 3/4 change follows the existing pattern of `metre.compound`: a demand, a detector, a control and a coper.
- **What would reverse it.**
  - Under the learner's taught set, the valid-phrase space is empty at a rung where the prediction says a phrase exists (1.1, 1.2).
  - The new detector disagrees with an independent reader on a catalogue file.
  - The probe moves a line that is not the new demand's.
  - The research differential moves an item outside the declared population.
  - A contract can pass only by weakening a bound.

  Each of these is a stop (below).
- **Real problem or proxy.** Both are real.
  - The daily read's notation stops asking for untaught demands. That is exactly the learner-facing leak the corpus found (12 property-7 failures, 8 of them this one).
  - The vocabulary states what 1.4 teaches, and the hold acts on it.

  What stays a proxy:
  - The vocabulary does not name everything a beginner meets. Half and whole notes (taught at 1.2) and the treble clef and quarter notes (1.1) have no demand, so the hold cannot see them. This is recorded, not fixed.
  - "3/4 taught, never written" closes only if the `-2-right` change survives its predeclared contracts (finish item 8).
- **Remaining uncertainty.**
  - Whether `-2-right` with 3/4 keeps its distribution bounds (H8).
  - Whether a held-down daily run judged at 1.5 counts toward 1.5's `reads` requirement (OPEN 1).
  - How the probe moves on the catalogue's 3/4 pieces (H2).
  - Every phrase: *not heard*, unverified as music.

## Goal

- **The reviewer's words.**
  - "the generation hold must be the learner's actual reached/taught set at that moment"
  - "Add a vocabulary demand for the thing actually taught at 1.4 and let the generator hold follow that demand. Keep compound metre's taught-at boundary at 4.5."
  - "Repin only the rows intentionally changed."
- **The writer's words.** A learner sees a daily phrase only when one can be written from what they have been taught, and it contains nothing else. 3/4 is one vocabulary fact taught at 1.4: held out before 1.4, writable after it, and checked by the contract tests from that one place. Nothing outside the declared population moves.

## Premises the brief rests on

All are CLAIMs, verified by the writer at `9728c7b6`. The builder re-checks each one at the lines before relying on it.

### The daily read

- **P1.** `openDailyRead` opens the phrase with `rung = rungForSlot(curriculum, dailyTarget, dailyOffer.lessonId)` (`app/src/ui/screens/TodayScreen.ts:1019-1031`; the call is at :1023).
  - `rungForSlot` (`:1462-1469`) returns the offered-from rung where that rung lists the item. Otherwise it returns the one rung listing the item.
  - For an unanchored offer (`lessonId` undefined) of `drill.reading.sight-reading-1`, that rung is **1.5**. 1.5 is the only rung listing it (`content/curriculum/stage-1.json`).
- **P2.** `readingOffer` (`app/src/curriculum/session.ts:2615`) takes its row from `anchorFor` (`:2368-2387`).
  - Before any rung that lists a reading row, `anchorFor` returns the easiest row with `anchored: false` (`:2385`).
  - That row is `-1`: catalogue level 1.5, against `-1-left`'s 1.6.
  - The rungs listing reading rows, in order: 1.3 and 1.4 (`-1-left`); 1.5 (`-1`); 2.2 and 2.5 (`-2-right`); 3.4 and classical.3 (`-2`); 4.5 (`-3`); 4.6 (`-3`, `-4`); and later rungs. So a core learner at 0.1, 0.2, 0.3, 0.4, 1.1 or 1.2 is unanchored.
- **P3.** Today calls `readingOffer` with `purpose: 'daily'` (`TodayScreen.ts:1274-1289`). The session's reading slot calls it with `purpose: 'slot'` and drops any unanchored offer (`session.ts:1773-1793`; the check is at :1786). These are the only two callers in `app/src`.
- **P4.** The Score screen holds a generated phrase by `judgingRungId()` (`ScoreScreen.ts:3557-3559`: `todayRung ?? fromRung`). It does this through `taughtAtRung` (`:5410-5416`) and `generateSightReadingFor` (`:288-297`, which calls `readingOptions`). It stores the same rung as the run's `opened.rung` (`:3839-3844`).
- **P5.** `readingOptions` (`session.ts:2220-2235`) holds the row with `heldToRung` and then lays the recipe's own moves over the hold. The reader offers an `on` move only for a demand the learner's rung has taught (`readingMoves`, `:2525-2551`).
- **P6.** `heldToRung` (`app/src/engine/readingControls.ts:447-454`) switches off every untaught demand whose control `mayWrite`s. `interval.step` has no `off` (`:249-258`: "A phrase that never moves by step is not one the generator writes"). Its `mayWrite` is always true.
- **P7.** Inside `readingOffer`, the reader's own options are held to `anchor.lessonId`'s taught set (`:2695-2701`), which is undefined, and so not held, for an unanchored row.
  - Step 3 ("the rung that holds the row has moved on") reads the last run's `opened.rung` (`:2719-2726`).
  - A learner with no reads returns at `:2689`, before any hold is computed.
- **P8.** The evidence job writes a stored run's phrase again from `row.opened?.rung ?? row.lessonId` (`app/src/data/evidenceJob.ts:84-115`; the line is :99). Its candidates are: held to that rung, unheld, and without the recipe.
  - Every sight-reading run since D4 also stores `material`: `phraseMaterial` (`app/src/curriculum/material.ts:293-303`), which is the complete options minus seed and version.
  - `opened` is `{ tab, rung?, tour?, slot }` (`app/src/data/db.ts:176`).
- **P9.** The one function that builds a learner's taught set is `taughtForLearner` (`session.ts:2199-2208`). L120b calls it the place "every place that builds a learner's taught set from a rung builds it". It returns `taught` from `taughtAtRung(curriculum, rung, vocabulary, reached)` (`:2142-2151`: the rung's ancestry plus each reached rung's), together with `positionTaught`.
  - **This is the source of truth for the hold.** The hold uses its `taught` half only: `heldToRung` reads demands, and the ruling names the taught set.
  - `positionTaught` is the coping question's reading of fixed positions. It would re-admit a skip inside C position at 1.1, which is the very leak the ruling names. It is OUT OF SCOPE for the hold, and the reply records that this was considered.
  - Today holds the learner's rung (`learnerRung = position?.lesson.id`, `:1269`) and the session's `reached` (`learnerReached`, `:1225`).
- **P10.** Rung concepts:
  - 0.1 to 0.4: posture, keyboard geography, how the app works, placement.
  - 1.1: `['C-position', 'quarter-notes', 'treble-clef', '4/4', 'steps']`.
  - 1.2: half and whole notes, rests.
  - 1.4: `['grand-staff', 'alternating-hands', '3/4', 'anacrusis']` (`stage-1.json:277`).
  - Vocabulary: `interval.step` is taught at 1.1; `interval.skip` at 1.5.
- **P11.** The research corpus's `BC_learner_0.1_d1-4` and `BC_learner_1.1_d1-4` (`docs/prompts/runs/sightreading-quality/MANIFEST.json`) are the 8 KNOWN-DEFECT items of this defect: `heldAt: "1.5"`, `anchored: false`. The research export copies `rungForSlot` rather than calling it (`app/tests/research/srExport.research.ts:74`, used at :132).
- **P12.** e2e specs open Today as a fresh learner and expect the daily card and the *Sight-read* door:
  - `tests/e2e/lab.spec.ts:274-520` ("Today's sight-read");
  - `doors.spec.ts:131-145`;
  - `today.spec.ts:446` (the `restore` helper waits for `#today-daily [data-daily]` before placing a learner).

  Without a daily offer the card is empty and the door is not drawn (`TodayScreen.ts:1034-1039`, `:1127-1137`).
- **P13.** `content/lessons/0.3.md:61-62` says "*Today* offers a short sight-reading phrase each day, new every morning". It sits under "The rest of the toolbox, for later" (`:51`).

### 3/4

- **P14.** `untaughtChecks` adds `every('4/4 only (before 4.5)', … ['metre.compound'])` when `metre.compound` is untaught, or, with no `taught` given, when the rung comes before `'4.5'` in the file's order (`app/tests/unit/helpers/promises.ts:305-327`; the check is at :323-325). `generatorContract`, `composedContract` and `sightReadingPromises` read it.
- **P15.** The demand schema (`content/curriculum/vocabulary/demands.schema.json`):
  - requires `id`, `display`, `dimension` (the closed list includes `metre`), `detector`, `copedWithBy` and `taughtAt`;
  - the id pattern is `^[a-z]+[.][a-z0-9-]+$`; the detector pattern is `^[a-z][A-Za-z]+$`.

  `app/tests/unit/vocabulary.test.ts:93-98` requires `copedWithBy` to be a skill whose `opportunity` includes the demand. `validate.py`'s `taught_at_findings` (`tools/content/validate.py:1460-1522`) requires each listed rung's concepts to name the demand, through `claims.concepts_naming` (`tools/content/claims.py:152-167`). That counts a skill whose opportunity is the demand alone as naming it.
- **P16.** No existing skill's opportunity can take a 3/4 demand honestly. `6/8`'s is `metre.compound` ("two beats of three eighths"). A concept `3/4` exists (`content/curriculum/concepts.json:28`) and 1.4 names it.
- **P17.** `vocabulary.test.ts:42-45` caps skills at 17 and demands at 21, "as the reviewer asked", revised once by CD1 on the reviewer's approval. Both counts are at the cap today (17 skills, 21 demands).
- **P18.** `READING_CONTROLS` must name exactly the vocabulary's demands (`generatorContract.test.ts:177-191`). `metre.compound`'s control:

  ```ts
  on: always({ timeSig: 6/8 })
  off: always({ timeSig: 4/4 })
  mayWrite: (o) => shapeOf(o).compoundAny
  ```

  (`readingControls.ts:348-353`).
- **P19.** `DEMAND_WORDS` holds the reader's learner-facing words per demand. `metre.compound` reads `{ name: 'the bars in 6/8', on: 'in 6/8', off: 'in 4/4' }` (`app/src/ui/help.ts:1053-1066`).
- **P20.** `docs/05-score-follow-engine.md` holds the control table (the `metre.compound` row is at :826) and the `UNREALISABLE_AT` table (from about :876). One fact, three places.
- **P21.** `compoundMetre` (`app/src/demands/detect.ts:474-486`) reads `timeSigMap`, which is where a 3/4 detector belongs. `measuredDemands` (`:653-656`) is what the content build writes for every bundled file, so a new detector's demand lands on every measured catalogue item. The coping question then asks it, which moves the untaught-options probe (`tools/content/tests/test_untaught_options.py`: the snapshot `docs/prompts/runs/LP1/probe-refusals.txt`, 297 lines; the re-run recipe is in its docstring).
- **P22.** The reading rows' params (`content/catalog.static.json`):
  - `-1` and `-1-left`: `"4/4"`;
  - `-2-right`: `"4/4"`, eighths, skips;
  - `-2`: `"4/4"`;
  - `-3`: `["6/8","4/4"]`;
  - `-4` to `-7`: `"4/4"`.

  `sightReadingUnchanged.test.ts` pins them through `ROWS_BEFORE` plus `CHANGED_ON_PURPOSE` (`:93`, `:161-168`). Its goldens hash `ROWS_BEFORE`'s copies, not the catalogue.
- **P23.** `sightReadingDistribution`'s `-2-right` bounds are `arrives 0.9, unitsOne 0.9, oscillatingAtMost 0.22, eventsPerBarAtLeast 3.78` (`:473`). `eventsPerBar` is events divided by bars (`:270`), with no metre normalisation. The configs read the authored rows (`:83`).

## SETTLED here

**S1. The daily read.**
- The unanchored daily offer carries a generation hold. The hold is the learner's taught set (P9's `taught`, from the learner's rung, the position Today already passes). It is used for the phrase, for the reader's own options inside `readingOffer` (P7) and for the Score screen's writer.
- The judging rung is unchanged: the route's `rung`, `opened.rung` and the run's criteria stay `rungForSlot`'s.
- **No valid phrase** means: after `heldToRung` under the learner's set, some demand that is untaught and not `notAsked` still has `mayWrite` true. In that case `readingOffer` returns `null` for the daily read, and Today shows no card and no door. This is the existing no-offer path (`04` §0 R4, "no furniture").
- Rejected alternative: generate the day's phrase and measure it with the detectors. It loses because the card would come and go with the seed. Today would also need to run OSMD and the detectors to draw a card. And `mayWrite` is the predicate `heldToRung` and the contract test already rest on.
- Anchored offers, the slot, the rung page, Library opens and every other reader do not change.

**S2. The demand.**

```json
{ "id": "metre.three-four",
  "display": "Three-four time",
  "dimension": "metre",
  "detector": "threeFour",
  "copedWithBy": "3/4",
  "taughtAt": ["1.4"] }
```

- The scope is **exactly 3/4**. 3/8, 3/2, 6/8, 9/8 and 12/8 are not it. A `taughtAtNote` states this scope in one sentence and cites `1.4.md:23` and the ruling §1.
- Rejected id `metre.simple-triple`: it would cover 3/8. `metre.3-4` is valid under the pattern; `three-four` is chosen because it reads as words beside `metre.compound`.
- Not `notAsked`: holding it out before 1.4 is the point.

**S3. The coper: a new skill `3/4`.**
- Its opportunity is `["metre.three-four"]` alone, so `concepts_naming` names it at 1.4 through the concept 1.4 already lists. Neither `CONCEPT_DEMANDS` nor any lesson changes.
- Precedent: `tie` and `dotted-quarter` were added only because "the taught-at table needs a coper for" them (`skills.json` `_comment`).
- No item declares it in `targetSkills`. Under `SHIPPED_SKILL_ACTIVATION` no run earns it.
- Its `observable`, `standards`, `precision` and `transfer` are the builder's judgement (§13: write one alternative beside it). The constraint: never claim an observable the engine does not measure (FABLE §6). Declaring `unobserved` with a reason, as `habanera-and-tresillo` does, is acceptable.

**S4. The vocabulary caps.**
- `vocabulary.test.ts` caps go to 18 skills and 22 demands, with a revision line citing the ruling §1. This is the CD1 pattern: the reviewer's ruling adds the demand, and a demand needs a coper.
- Any other cap change is a stop.

**S5. The control.**

```ts
'metre.three-four': {
  option: 'timeSig',
  on: always({ timeSig: 3/4 }),
  off: always({ timeSig: 4/4 }),
  mayWrite: (o) => metres include exactly 3/4,
}
```

- `brings` is as the contract test measures it, declared only if measured.
- Rejected alternative: `off` removes only 3/4 from a list. It loses because the reader's words ("in 4/4") would then sometimes be false. `metre.compound`'s `off` sets the precedent.

**S6. The words.**

```ts
'metre.three-four': { name: 'the bars in 3/4', on: 'in 3/4', off: 'in 4/4' }
```

This goes in `DEMAND_WORDS`. `docs/05` gains the matching control-table row.

**S7. The promise check.** "4/4 only (before 4.5)" becomes a metre check read from the vocabulary:
- Where `metre.compound` is untaught, every bar is 4/4, or 3/4 where `metre.three-four` is taught.
- The fallback with no `taught` reads both demands' `taughtAt` from the vocabulary, never the strings `'4.5'` or `'1.4'`.
- The new demand's own "no metre.three-four before 1.4" check comes from the existing loop.
- 2/4, 2/2 and 3/8 stay held out before 4.5, as today.

**S8. The declared changed population, fixed before any run.**
- **(a)** The unanchored daily offer at 0.1-1.2:
  - 0.1-0.4 get no offer;
  - 1.1-1.2 get `-1` held to their set, which predicts `skips: false`.
- **(b)** Every phrase whose options asked for 3/4 at a hold where `metre.three-four` is untaught, now held to 4/4.
- **(c)** The reader's moves for the new demand wherever it is taught (its `on` and `off`, through `readingMoves` and every reachable composed recipe).
- **(d)** `-2-right`'s `timeSig` becomes `["4/4","3/4"]`, kept only if finish item 8 passes.
- **(e)** The coping question's new `untaught` lines for measured 3/4 items at rungs whose path lacks 1.4.
- **(f)** The run-round-trip consumers of (a): the evidence job and the reader's step 3.

Nothing else moves. `-2` (3.4), `-3`, `-4` and every other row's params are unchanged (ruling §3). The key signature at 3.4 stays the named PARTIAL gap: "taught at 3.1, not yet written by a core reading row".

## Generated content

- **Job:** SIGHT-READING (FABLE §4). The rows already exist. This lane changes what the daily read is held to and lets one row write a taught metre.
- **The learner demand isolated:** reading an unseen phrase that holds only what the learner has been taught. At 1.1-1.2 that means steps in C position, in 4/4. On `-2-right` from 2.2 it adds 3/4.
- **What varies, what stays fixed:**
  - The seed varies, as before.
  - Fixed: every row's level, length, range, key and promises.
  - The only new variation is `-2-right`'s metre list (if it survives).
  - The daily phrase at 1.1-1.2 loses skips. That is the hold, not a new variation.
- **Musical properties required, each with how it is established:**
  - The research lane's P1-P6 (key, metre, length, bar sums, range, interval cap) and P7 (nothing untaught at the learner's rung). Established by `check_corpus.py` over partitura events, with musicxml-io as the second reader (the frozen 374-item corpus, H4), and by the app's detectors in the unit cases.
  - Phrase shape: the existing distribution bounds, unchanged (H8).
  - Every musical quality beyond these: **UNKNOWN**; *not heard*.
- **Libraries and verifiers, one per property (FABLE §7):**
  - demands: the app's detectors (`detect.ts`) and the research detectors over partitura, compared on the corpus (H4);
  - the new detector's 3/4 presence: partitura's time signatures on every built catalogue file (H7). Two parsers of the same bytes, sharing no code;
  - the hold's coverage: exhaustive enumeration over the rungs before 1.3 and the fixed seeds. The space is small, so Hypothesis is not needed.
- **Adversarial and boundary cases:**
  - a learner at 0.1 (empty space) and at 1.1 (steps only);
  - `-1-left` asked 3/4 at 1.3 (held to 4/4) and at 1.4 (written);
  - 3/8, 6/8, 3/2, 2/4 and 4/4 against the detector;
  - a 4/4 piece with one 3/4 bar (located there only);
  - `heldToRung` applied twice equals once on every case above (the known single-pass finding, checked here only for the new control).
- **Review denominator:** the frozen `MANIFEST.json` (374 items) plus the unit cases' seeds, named in the reply.
- **Transfer out of generation:** unchanged. The reading rows serve their rungs; real pieces carry transfer.

## Hypotheses the builder inherits, with their refuting tests

- **H1. The daily read holds to the learner's taught set.**
  - **Prediction.** For a fresh core learner at 1.1 and at 1.2, the phrase the daily read writes contains no vocabulary demand outside `taughtForLearner(…).taught`. "The phrase the daily read writes" means: the offer, then the hold as Today carries it, then the function the Score screen writes with, then the generator, then the app's detectors. It is checked over the BC seeds and seeds 1-30. For 0.1-0.4, `readingOffer` returns `null` for `purpose: 'daily'`. In both cases the route's judging rung is still 1.5.
  - **Red first on the base.** Before any source edit, the same assertion is run on the base's path: the route Today builds today, held at `rungForSlot`'s 1.5. It must find a skip at 1.1 in at least one seed, and an offer with steps at 0.1. The builder records the seed and the bar.
  - **The case must read the phrase through the same function the Score screen calls, not a copy.**
  - **Refuted by:** any untaught demand after the change; a 1.1 or 1.2 learner with no offer; or a judging rung other than 1.5.
- **H2. The new demand is untaught exactly where the probe says, and no reading row writes it before 1.4.**
  - **Prediction, written first.** Before running the probe, a script under `build/SR2/` lists every (rung, measured item) pair where:
    - the item's built file has a 3/4 bar (read with partitura); and
    - the rung's taught set, as the probe's learner reads it, lacks `metre.three-four`.
  - The probe's new or changed lines must equal that list. Each one adds only `metre.three-four` to that line's untaught demands.
  - No reading row writes 3/4 before 1.4: `-1-left` at 1.3 is 4/4, and the unanchored `-1` is 4/4.
  - **Refuted by:** a probe line that changes in any other way, or a list mismatch. Either is a stop.
- **H3. The generator writes 3/4 only where the hold permits.**
  - **Prediction.** Over every core rung, its reader's row, the unanchored daily row at 0.1-1.2, every move `readingMoves` offers there and seeds 1-30, a 3/4 bar appears only where `metre.three-four` is taught.
  - `-1-left` given `timeSig: 3/4` and held at 1.3 writes 4/4.
  - Where the row lists 3/4 and it is taught (`-2-right` at 2.2 and 2.5, if item 8 stands), at least one seed in 30 writes 3/4.
  - Recipe moves stand over the hold by design (P5). The test therefore drives moves through `readingMoves`, which offers `on` only for taught demands, and never through hand-made recipes.
  - **Refuted by:** any 3/4 bar where untaught.
- **H4. The fixed research corpus moves only inside S8's population.**
  - **The base run first, in a copy under `build/SR2/base/`, before any edit.** Run the lane's export (`app/tests/research/`, as its config says) and then `check_corpus.py`. The result must reproduce `checks-run1.csv` in `docs/prompts/runs/sightreading-quality/`; any difference is listed, and an unexplained one is a stop.
  - **Then, before the after-run,** write `build/SR2/declared-population.txt`: the MANIFEST ids whose resolved options S8 predicts will change, computed by a script from each item's build spec.
    - The prediction: 8 BC items (0.1 gives no offer; 1.1 gives `skips: false`).
    - The 4 `A_3-4-gap_1-left_at_1.3_*` items, if their `params` pass through the hold rather than as recipe moves (P5). The builder reads `srExport.research.ts` and says which.
    - The 16 O items of `-2-right` at 2.2 and 2.5, if item 8 stands.
  - **After:** every item outside the declared population is byte-identical with identical properties (`rerun_diff.py`, run from a copy so the committed `rerun-diff.json` is never rewritten).
  - **Inside:** BC at 0.1 gives no offer; BC at 1.1 passes P7; the A items write 4/4 and pass P7; the `-2-right` items pass P1-P6, with some in 3/4.
  - **Refuted by:** any undeclared mover. That is a stop.
- **H5. The reader stays honest across the 1.5 boundary.**
  - **Prediction.** Take a learner whose stored `-1` daily reads were held at 1.1 (steps only) and who arrives at 1.5. They are not moved forward on that evidence as if it had been 1.5's phrase. The reader's step 3 sees that the phrase may now hold skips and returns its existing `lesson` reason.
  - The mechanism uses only what the run already stores (`opened.rung`, `recipe`, `seed`, `material`; P8). The same stored fact lets the evidence job write the phrase again: a held daily run's recompute finds its phrase, and is not kept out as `phrase-differs`.
  - **Refuted by:** a forward move on day one at 1.5, or a recompute exclusion of the held run.
  - **A new stored field is a stop (below).**
- **H6. Every moved test expectation is S8's.**
  - Every expectation that moves in the unit or e2e suites is itemised and classified (a) to (f). This covers `generatorContract`, `composedContract`, `readerMovesTheDemand`, `sightReadingPromises`, the `firstThirtyDays*` diaries, `sightReadingSlot`, `tests/e2e/fixtures/reader-learners.json` (regenerated only by its own test) and the e2e specs in P12.
  - `UNREALISABLE_AT` changes only by entries for `metre.three-four`, each with its measured reason, and `docs/05`'s table gains the same rows.
  - **Refuted by:** an expectation that moves for another reason. That is a stop.
- **H7. The detector agrees with an independent reader.**
  - **Prediction.** On every built catalogue file, `threeFour`'s `present` equals "partitura reads a 3/4 time signature".
  - **Refuted by:** any disagreement, listed by file and bar. That is a stop.
- **H8. `-2-right` with `["4/4","3/4"]` keeps every existing bound.**
  - This is the writer's lowest-confidence prediction. `eventsPerBarAtLeast 3.78` is calibrated on 4/4 bars, and a 3/4 bar holds three-quarters of the beats.
  - **Refuted by:** any red bound in `sightReadingDistribution`, `sightReadingPromises` or the research P1-P6 for that row. Then **revert that one row change** and keep everything else. Record the bound, the measured value and the seed set. **Never move a bound** (ruling §3: "do not calibrate a new threshold on the same failures it is meant to judge").

## OPEN (measured and reported, not changed)

1. Does a 1.1 learner's held daily run, judged at 1.5, count toward 1.5's `reads` requirement (`full`, share 0.9, count 5) or its `runs from exercises`, through `rungState`? Answer from the code and one constructed case. The ruling kept the judging rung's evidence semantics; after the change the counted phrase no longer holds 1.5's skips. This is a question for the reviewer, not a change.
2. The daily card's meta line prints `levelLabel(item.level)` for `-1` while the phrase is held below it. Is that a false statement? Record what it says.
3. Does threading `reached` change the hold for any unanchored learner? Measure it: for each of 0.1-1.2, compare `taughtAtRung` with and without the session's `reached`.
   - Equal: pass the rung alone, and pin the equality in a unit case so a future early track turns it red.
   - Different: thread `reached`, with the rejected alternative written.

## Finish condition (every item done, or an explicit not-done line by name)

1. **The base evidence, before any edit.**
   - The content build.
   - H4's base run against `checks-run1.csv`.
   - H1's red on the base: the seed and bar for 1.1, the offer for 0.1.
   - The probe on the base, equal to `docs/prompts/runs/LP1/probe-refusals.txt` or each difference listed.
   - `declared-population.txt` written.
2. **The daily hold (S1), built.**
   - `readingOffer`'s unanchored daily offer carries the learner's taught set, in both the met branch and the new-phrase branch, and returns `null` where S1 says.
   - Today carries the hold to the Score screen in the route, beside the unchanged `rung`.
   - The Score screen writes with the hold when the route names one, and by `judgingRungId()` otherwise.
   - The *Sight-read* door opens the same phrase.
   - Every other reader is unchanged; the reply names how that was shown.
3. **The round trip (H5).** The evidence job's candidate and the reader's step 3 read the held phrase from what the run already stores, each with a unit case.
4. **The acceptance cases (H1, H5).** In the unit suite (file names are the builder's), green. Their base red was shown (item 1).
5. **The browser.**
   - One new e2e case: a fresh learner at 0.1 has no `#today-daily` card and no `#today-read` door; a learner placed at 1.1 opens the daily read with the hold in the route and `rung` naming 1.5.
   - The P12 specs revised so that each places a learner at 1.1 or later before expecting the card. Each revision is written as "the test encoded the fault: a learner at 0.1 was offered a phrase", with before and after.
   - Run under the harness, targeted to those specs only.
6. **The demand (S2-S6).**
   - `demands.json`, `skills.json`, the `threeFour` detector (plus `DETECTOR_IDS`), the control, `DEMAND_WORDS`, and the `docs/05` control-table row.
   - Detector unit cases in `demandDetectors.test.ts`: the S-adversaries above.
   - `test_vocabulary_dimension.py` and `validate.py` green, with no new `taught at` warning.
7. **The promise check (S7) and the caps (S4).** Done. Every contract suite in P14 green with no bound changed.
8. **`-2-right`'s metre (S8 d).**
   - Set `timeSig: ["4/4","3/4"]` and add one `CHANGED_ON_PURPOSE` entry for it.
   - Prove that the goldens (`sight-reading-unchanged.json`, `sight-reading-v2.json`) are byte-identical by sha256 before and after.
   - Kept only if H8 holds. Otherwise reverted, with the not-done line naming the bound and the value.
9. **The probe.**
   - Re-run by `test_untaught_options.py`'s recipe and written to `docs/prompts/runs/SR2/probe-refusals.txt`.
   - `PROBE` repointed with a dated comment line in the file's existing style.
   - Every changed line itemised in `docs/prompts/runs/SR2/README.md` against H2's prediction.
   - Every other file the content build or the Python suite rewrites is itemised the same way: build reports, `tools/content/tests/fixtures/untaught_on_rung.json`, the inventory and the rung-claims report. Each line is classified as the new demand's or as a stop.
10. **The research differential (H4).**
    - Update `app/tests/research/srExport.research.ts` to build stratum BC through the app's own hold (no copied `rungForSlot`), and to emit a `NO-OFFER` outcome for an offer of `null`.
    - Adapt copies of the lane's scripts under `build/SR2/`. The changes: the vocabulary id mapped to the lane's `metre.triple` detector, and `NO-OFFER` accepted. The adaptations are listed in the reply.
    - Run before and after. Put the summary counts and the declared-against-moved table in `docs/prompts/runs/SR2/README.md`.
11. **The witness (H7).** The result, with the file count.
12. **The checks.**
    - `npx tsc -b --noEmit` (never `-p`) and lint.
    - The full unit run: shared machinery moved.
    - The Python content suite.
    - `validate.py`.
    - The content build.
    - The targeted e2e (item 5).
13. **`docs/08-test-map.md`.**
    - One new row: "The daily read held to the learner's taught set; 3/4 one vocabulary fact" (what it guards, its tests, done/date, "nothing heard").
    - The T37 row and the generator-contract row revised where their wording says 4/4 before 4.5 or the earliest listing rung's hold.
14. **The recorded observations, not fixed:**
    - the vocabulary has no demand for half and whole notes or the treble clef;
    - `heldToRung`'s single pass (outside the new control);
    - 0.3's "3 of sight-reading" template line before any reading slot exists;
    - `positionTaught` not used by the hold (P9);
    - `-3` and `-4` as the next 3/4 candidates, under predeclared contracts (ruling §3);
    - the key signature at 3.4: the named PARTIAL gap.
15. **Cleanup per §14.**

## Stop conditions

Stop, report and change nothing further when:
- **A contract test goes red and cannot pass without weakening a bound.** That includes a distribution bound, a promise, an `UNREALISABLE_AT` entry that would hide a promise failure, or a vocabulary cap beyond S4. Report the bound, the row, the rung, the value and the seeds.
  - The one exception is `-2-right` under H8: revert that row change and continue.
- **The valid-phrase space differs from the prediction.**
  - The prediction: empty at exactly 0.1, 0.2, 0.3 and 0.4; a phrase at 1.1 and 1.2.
  - Any other rung or track position with no daily read where the app offers one today is a stop.
  - Report how many learner positions on the ladder are affected and what each is offered instead.
  - The predicted four proceed under the ruling ("no daily read yet"). The reply states the count and that they are offered no card and no door.
- **The probe moves a line that is not the new demand's.** That includes a predicted line that does not appear.
- **The research differential moves an item outside `declared-population.txt`,** or the base run does not reproduce `checks-run1.csv` and the difference is unexplained.
- **The detector and partitura disagree on any catalogue file** (H7).
- **The round trip needs a new stored field** on the session row or `opened`, or a `DB_VERSION` change. That is schema meaning (FABLE §10). Report the field and why the stored `material` cannot carry it.
- **A lesson sentence becomes false.** Lessons are not owned. P13's sentence is read as "for later" by the writer; the builder records its own reading, and stops only if it reads the sentence as false at 0.x. Any other lesson stating a reading row's metre or the daily read's availability is also checked.
- **Any expectation moves outside S8** (H6).

## When to deviate

When a premise is found wrong at the lines, say so and take the better path inside the ruling, recording why. Never widen the population, change a bound, or touch a file in the not-to-touch list to make a test pass. Two cases go back to the orchestrator as questions:
- a mechanism choice the builder makes with a materially different alternative it could not rule out;
- a finding that suggests the ruling's premise is wrong.

## Files

**Owned (exactly these; any other file is a stop, except those finish item 9 lists as regenerated):**
- `app/src/curriculum/session.ts` (`readingOffer`'s unanchored daily branch, and step 3's read of the held phrase)
- `app/src/ui/screens/TodayScreen.ts` (`openDailyRead`'s route)
- `app/src/router.ts` (the route's hold parameter)
- `app/src/ui/screens/ScoreScreen.ts` (the hold resolution for a generated phrase)
- `app/src/data/evidenceJob.ts` (the held candidate)
- `app/src/engine/readingControls.ts` (the new control; `UNREALISABLE_AT` entries for it only)
- `app/src/demands/detect.ts` (`threeFour`)
- `app/src/ui/help.ts` (the one `DEMAND_WORDS` entry)
- `content/curriculum/vocabulary/demands.json`
- `content/curriculum/vocabulary/skills.json`
- `content/catalog.static.json` (`drill.reading.sight-reading-2-right`'s `timeSig` only)
- `app/tests/unit/helpers/promises.ts`
- `app/tests/unit/generatorContract.test.ts`, `sightReadingDistribution.test.ts` (no `BOUNDS` change), `sightReadingUnchanged.test.ts` (`CHANGED_ON_PURPOSE` only), `composedContract.test.ts`, `sightReadingPromises.test.ts`, `readerMovesTheDemand.test.ts`, `vocabulary.test.ts` (S4), `demandDetectors.test.ts`; any other unit test only with H6's itemisation; new unit files for H1, H3 and H5
- `app/tests/e2e/lab.spec.ts`, `doors.spec.ts`, `today.spec.ts` (P12 revisions and the new case); `tests/e2e/fixtures/reader-learners.json` (only as its test regenerates it)
- `app/tests/research/srExport.research.ts`
- `tools/content/tests/test_untaught_options.py` (`PROBE` and its comment), `tools/content/tests/test_vocabulary_dimension.py`
- `docs/prompts/runs/SR2/` (new: `probe-refusals.txt`, `README.md`, the differential summary)
- `docs/05-score-follow-engine.md` (the control-table row; the unrealisable table only for H6's entries)
- `docs/08-test-map.md`

**Not to touch:**
- `drill.reading.sight-reading-2`'s params (the 3.4 row), and every row's params other than `-2-right`'s `timeSig`;
- `sightReadingDistribution`'s `BOUNDS`, including the `sight-reading-2` contour bound;
- `metre.compound`: its `taughtAt`, control and words;
- `tools/content/generate_exercises.py`;
- `content/lessons/**`;
- the cells: `rhythm.habanera` and `rhythm.tresillo`, their detectors and `cells.py`;
- the hand model (the declared- and verified-hand seams' files);
- `tools/content/family_contracts.json` and `claims.py`'s `CONCEPT_DEMANDS`;
- `docs/prompts/runs/sightreading-quality/**` (frozen evidence: run copies);
- `docs/prompts/PACKET-TRACE.md` and `docs/pending-review.md` (the orchestrator's);
- `docs/prompts/FABLE.md`.

## Harness

`docs/prompts/operating-procedure.md` §14, once. This lane adds:
- **Content.** Rebuild with `PIANOPATH_PYTHON=C:\Users\yalir\repos\Piano Stuff\PianoProject\.venv\Scripts\python.exe` before any vitest that reads built content. Never rebuild while Playwright runs.
- **Browser.** One Playwright at a time, on port **4192** (confirm it is free; never 4173), `--workers=2`, with the config copy under `app/build/SR2/`.
- **Research scripts.** `py -3.11` with partitura, music21 and musicxml-io, as their docstrings say. Outputs go under `build/SR2/`.
- **No git at all.** Before-and-after identity is shown by sha256.

## Reply shape

At most ten lines, plus the draft entry:
- H1-H8 held or refuted, and OPEN 1-3 answered;
- the red-first seeds;
- the empty-space count, and what those learners see;
- the probe: lines added or changed against the prediction;
- the differential: declared against moved;
- `-2-right` kept or reverted, with the bound and value;
- the checks;
- the not-done lines.

Nothing heard.

Draft entry shape (`docs/pending-review.md`, number assigned at landing):

> ### Entry N — SR2: the daily read held to the learner's taught set; 3/4 one vocabulary fact taught at 1.4
>
> **What a learner meets.** … (0.1-0.4: no daily read and no *Sight-read* door until 1.1; 1.1-1.2: steps only in C position; 3/4 held out before 1.4; `-2-right` writes 3/4 from 2.2, or not, with the bound named; a reader's 3/4 move where it is taught.) Nothing heard; scoreboard 0/28.
>
> **What changed, where / what / before / after / why:** … (every file; every probe line; every moved test expectation with its S8 letter.)
>
> **Checks.** … (red first; the differential; the witness; the build; the probe; the targeted browser specs.)
>
> **Open.** OPEN 1-3; the recorded observations (finish item 14); unverified as music.
