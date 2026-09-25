# T36a: one generated exercise, from the generator to the next recommendation

2026-09-25 · read-only trace · brief `docs/prompts/tasks/T36a-trace-generated-exercise.md`

**The two items followed**

- Technique: `exercise.five-finger.c-major.right`, on rung 1.1 *Right hand C position*
- Reading: `exercise.interval-reading.c-position.right.01`, on rung 1.5 *Steps and skips, and the sight-reading habit*

**How the evidence was got.** I read the code listed at the end and ran `dump_score.py` on
these two items only. I ran the real `buildSession`, `nextRecommended`, `lessonComplete`,
`swapOptions`, `lessonForItem` and `reviewQueue` in Node against the built
`app/public/content/catalog.json` and `curriculum.json`, using progress rows I constructed.
The script lives in a scratch directory outside the repository. There was no build, no
browser and no Playwright. The summary-sheet strings come from reading `ScoreScreen.ts`; I
did not see them rendered. Nothing was heard.

---

## Judgement

1. After a run the app keeps pass/mastered, the days it passed, best accuracy, attempts and minutes. Only the first two feed anything that decides what comes next.
2. What went wrong in the run is computed for the summary sheet and then thrown away: which notes, which bars, early or late, a skip read as a step. A failed run changes nothing about the next session. Observed: a learner at 60 % gets the same card as a learner who has never played.
3. Within a rung the item is picked by `seed % options`, with no regard to what was passed, failed or how hard it is. So a passed reading melody is offered again every day, and a day-one learner on the right-hand rung is handed the hands-together pattern.
4. A rung completes on any N passes from a mixed list, so the evidence never has to be of the skill the rung names. Rung 1.5 completes on two ear drills. One pass of a five-finger pattern completes three how-to-practise rungs.
5. What the app would need: per-run evidence tied to the item's declared target skill (which intervals were misread, which hand, timing, continuity), stored, and read by selection. The rung's objective should be a checkable rule, not a count.

---

## The causal model

```
generator(params) ─► level (declared from one parameter) + concept tags ─► catalog row (+ build's notation summary)
      target skill lives only in docstrings, docs/02 Part E2 and the lesson prose
                                   │
rung lists the id ─► nextRecommended: first incomplete rung ─► fillSlot: options[seed % n];
                                                               else a level window around the *stage number*
                                   │
Score screen: mode from Settings (Wait when a piano is connected); rung used for judging = first rung listing the id
                                   │
engine: pitch per step (Wait) or pitch inside a ±150 ms window (Tempo). It is told nothing about the target skill.
                                   │
summary: numbers, weakest bars, buttons ──► dropped: hot spots, timing, every note played
                                   │
progress row: status, passedOn ─► lessonComplete (a count of passes over the option lists) ─► next rung, or the same card
                               └► reviewQueue (calendar only)
```

The model breaks in three places, and each finding below comes from one of them.

- **A. The target skill is not data.** Each generator states its purpose in prose. The row
  keeps four loose concept tags. Nothing downstream (judging, completion, selection)
  distinguishes an interval-reading item from an ear drill or a riff on the same rung.
- **B. The evidence is one bit and a date.** The engine measures pitch per step and time per
  note. The store keeps `passed` and `passedOn`, and only those are read by selection or
  completion.
- **C. Selection has no learner model.** Where the learner stands is taken from the first
  incomplete rung, and ability from that rung's stage number. The item inside the rung comes
  from a seed index.

---

## The trace, stage by stage

For each stage below: the carrier, the source of truth, what is lost, what is assumed,
whether the next stage gets enough, and whether the concept is recomputed elsewhere.

### 1. Generator inputs and intended skill

- **Five-finger.** `make_five_finger(root, quality, hands, bpm=60)`
  (`tools/content/generate_exercises.py:874`). The purpose is in the docstring ("one finger
  per key, one note at a time") and in `02` Part E2 ("1.1 RH position").
- **Interval reading.** `make_interval_reading(seed, hands, bpm=66, level=1.5)` (`:1571`).
  The purpose is in the docstring ("using only 2nds and 3rds"), in the comment on
  `INTERVAL_BAR_RHYTHMS` (`:1565–1567`: "unit 1.5 is about reading the *distance* between
  notes") and in Part E2 ("fixed hand position, intervals restricted to 2nds and 3rds").
- **Carrier and source of truth.** Python arguments, with the purpose written only as prose.
  **Lost:** the purpose never becomes a field.

### 2. Generation algorithm and resulting music

- **Five-finger.** Scale steps `[0,2,4,5,7]` go up and back in quarters. Fingering 1-2-3-4-5-4-3-2-1
  is printed on every note, followed by a three-beat rest. The other staff rests.

  Dump:
  ```
  bar 1 RH: C4 D4 E4 F4 (quarters)
  bar 2 RH: G4 F4 E4 D4
  bar 3 RH: C4, rest
  LH rests throughout
  ```
- **Interval reading.** A seeded random walk over degrees 1–5 in moves of ±1 or ±2. A move that
  would leave the position bounces back (`:1590–1597`). Bar rhythms come from four patterns
  of quarters and halves. The penultimate note is forced to degree 2 or 3, whichever is
  nearer the third-last (`:1599–1603`), and the last note is the tonic. Fingering is printed
  on the first note only.

  Dump:
  ```
  bar 1: E4 (half), F4 D4
  bar 2: F4 (half), D4 (half)
  bar 3: C4 (half), E4 (half)
  bar 4: E4 (half), C4 (half)
  ```
  Of the eight intervals: two 2nds, five 3rds and one repeated note. The repeated E–E comes
  from the penultimate rule: the third-last note is E, so the "approach" is E again. Seven
  of the nine notes are halves.
- The first note of every melody in the family is D or E, never C. The first move is applied
  before the first note is written. This is read from code; only seed 01 was dumped.

### 3. The `confirm_*` validation

`finalize` (`:609–613`) runs `pad_final_bar`, then `confirm` (chord symbols against their
notes), `confirm_fingering` (chords only), `confirm_not_silent` and `confirm_playable`
(A0–C8). None of them reads interval size, range within the position, rhythm or hand.

- `drill.params.maxInterval: 3` (`:1621`) has no reader. I searched `tools/**/*.py` and the
  non-test `app/src/**/*.ts` files; the only hit is its writer.
- `validate.py` `notation_requirements` (`:953`) checks only `chordSymbols`, `meter`, `mode`
  and `staves`, and only on rungs that carry a `requires` or one of the five
  `CLAIMING_CONCEPTS`. Neither 1.1 nor 1.5 does.

**Assumption introduced:** construction alone guarantees the skill. For these two families
that holds for interval *size*. Nothing guarantees it for anything else.

### 4. Difficulty assignment: declared, not measured

- **Five-finger.** `level = 1.1 if hands != "both" else 2.1` (`:887`). The key is ignored.
  - The built catalog has 48 five-finger items at exactly two levels: 1.1 for one hand, 2.1
    for both.
  - `02` Part E gives Stage 1 five-finger work in **C and G only**, and Stage 2 in C, G, F, D
    and A.
  - So 20 of the 24 one-hand items are rated 1.1 in keys with one to five black keys
    (F, D, A, E, B, D♭, E♭, G♭, A♭, B♭).
  - The generator's own comment says levels are "derived from the table above". For this
    family they are not.
  - `scale_level` (`:197`) does rank keys. So two families in one file disagree on whether
    the key matters.
- **Interval reading.** `level` is a default argument, `1.5`, the same number as the rung's
  id.
- **Both** are written with `levelSource: "judged"` (`catalog_entry`, `:649`). Nobody judged
  them. `levelConfidence` (`selectors.ts:264`) then ranks them above estimated items in swap
  sorts.
- **What the number means.** For generated items, `level` is a curriculum address (unit 1.1,
  unit 1.5, unit 2.1). It sits on the same axis as the PDMX regression levels (1.58, 1.9,
  2.32), which mean difficulty.

### 5. Catalog metadata and the build

- **The row** (built catalog) carries:
  - `type: exercise`, `level`, `levelSource: judged`, `concepts`, `hands`, `tempoBpm`,
    `keySig`, `timeSig`
  - `genre: ["technique"]`, which the reading item carries too
  - `tracks`: `technique, core`, or `core, technique, theory-ear` for the reading item
  - `drill: {kind, params}`
  - `teaching.lessonIds: []` and `practiceTips: []`
  - The concepts are `five-finger, C-major, hands:right` and `steps, skips, interval-reading, C-position`.
- **What the build adds.** `merge_catalog` (`build.py:197`) runs `attach_sections`,
  `attach_rung_tracks` (song options only), `attach_notation` and `settle_key_signatures`.
  `attach_notation` (`:351`) adds `bars, staves, keys, times, chordCount, chords,
  swungMark, finalBass`.
- **Fields that reach a learner-facing decision:**
  - `level`: session fallbacks and swap tiers
  - `concepts`: swap tier 3 and the sight-reading slot filter
  - `tracks`: the technique and jam fallbacks
  - `type`: the fallback filters
  - `drill.kind`: whether the item opens on the Score screen or the Drill screen, whether it
    counts as sight-reading, and whether a technique measure applies (none for these kinds)
  - `notation.swungMark`: engine swing
- Because the reading item carries the `technique` track, it sits in the Stage 1 technique
  fallback pool.

### 6. What is discarded after generation

- The interval sequence and its step/skip/repeat balance
- The range: C4–G4 for the right hand, C3–G3 for the left
- The rhythm profile and note density
- The starting note and where fingering is printed
- For five-finger, the key's black-key count

The build's notation summary says nothing about intervals, range or density. So nothing
downstream could select, validate or give feedback by any of them, even if it wanted to.

### 7. The curriculum rung

- **1.1**
  - Seven exercise options: three drills, `c-major.both` at 2.1, `c-major.right` at 1.1,
    `g-major.right` at 1.1 and `riff.c.falling` at 1.3.
  - Six songs.
  - `mastery` is 1 exercise and 1 song, at 0.9 accuracy and 0.8 tempo (`stage-1.json:43–48`).
  - `levelBand` is `[1.0, 2.1]`, widened to take the hands-together item on a rung whose
    finder says "right hand only".
  - The rung's `concepts` (`C-position, quarter-notes, treble-clef, 4/4`) share no tag with
    the item's.
- **1.5**
  - Eight exercise options: the `sight-reading-1` drill, the `ear.interval-2nd-3rd` drill,
    the authored `steps-and-skips-c`, IR 01–03, `drill.ear.simon-c-major` at 2.0 and
    `exercise.riff.a.falling` at 1.3.
  - `mastery` is 2 exercises, 0 songs, `songOptional`, 0.9/0.8, and
    `custom: "sight-read-5-first-attempt>=0.9"` (`:333–339`).
  - The rule in `custom` is enforced nowhere. `mastery.custom` has two readers under
    `app/src`: `demandsMeasuredAccuracy` (which refuses paper self-passes) and
    `demandsTechniqueMeasure` (technique kinds only). A search for `first-attempt` and
    `sight-read-5` under `app/src` finds nothing.
- **Reuse across rungs.** `exercise.five-finger.c-major.both` is an option on **six** rungs:
  1.1, 1.3, practice.1, practice.3, practice.4 and 2.1. In all, 181 items sit on more than
  one rung.
- **Recomputed elsewhere.** "Which rung does this item belong to" has three answers:
  - `lessonForItem`: the first rung listing it, used for judging and for the side-panel prose
  - `slot.lessonId`: used by the swap sheet
  - `lessonComplete`: every rung that lists it gets the credit

### 8. The lessons' prose

**1.1** teaches music: C position, the staff, the quarter note, "count out loud".

- Its instruction "Play the five-finger walk up and down at 60 bpm" matches the item's 60 bpm.
  The Score screen, however, opens at the Settings default of 70 % (`settingsStore.ts:131`),
  which is 42 bpm.
- Its pass line asks for Wait mode at 95 % and then Keep tempo at 90 % with the tempo at 80 %
  or more. The app accepts one run in either mode at 90 % with the slider at 80 % or more.

**1.5** teaches the idea well: line to space is a step, line to line is a skip, look one beat
ahead. Then it drifts.

- "The sight-reading generator makes a new four-bar melody every time you press it"
  describes the app. So does the *Tools for this rung* paragraph.
- It never names the three generated interval-reading items. The study it names is the
  authored `exercise.reading.steps-and-skips-c`, which I did not dump.
- Its *Common mistake* is stopping to fix a wrong note: "keep the pulse". The reading item
  opens in Wait mode whenever a piano is connected, and Wait stops at every wrong note.
- Its pass line is "Five generated melodies at 90 % accuracy or better on the first attempt,
  with no stops". Nothing checks it.

### 9. The day's session

- **Which rung.** `nextRecommended` (`session.ts:158`) returns the first incomplete rung in
  curriculum order, starting from a placement if there was one.
- **Which item.** `fillSlot` (`:248`) picks from `resolve(options)`, which drops unplayable
  items and items already used today (`:223–234`). It does **not** drop passed or failed
  items and does not look at level. The pick is `pick(candidates, seed)` =
  `candidates[seed % n]` (`:236`).
- **The seed.** It is `0` when Today opens (`TodayScreen.ts:139`) and goes up by one on
  *Shuffle*.

Observed, by running `buildSession` with the default active tracks, the 30-minute template
and seed 0:

| Learner state | technique | review | new | repertoire |
| --- | --- | --- | --- | --- |
| **A.** Placed at 1.1, nothing played | `drill.technique.five-finger-rh` | `drill.ear.simon-c-major` (L2.0), *"Nothing due — keeping something warm"* | **`exercise.five-finger.c-major.both` (L2.1)**, *"Lesson 1.1 — Right hand C position"* | Silent Night, PDMX (L2.32), *"Something to just play"* |
| **C.** Same rung; `c-major.right` and *Hot Cross Buns* started, best 60 % | identical to A | identical | identical | identical |
| **B0.** 1.1–1.4 complete, on 1.5 | `drill.reading.sight-reading-1`, *"Warm-up in the keys you are working in"* | `c-major.right`, *"Due for review today"* | **`ir.01`** | Silent Night |
| **B1.** `ir.01` passed yesterday | same | same | **`ir.01` again** | same |
| **B2.** `ir.01` passed on two days | same | same | **`ir.01` again** | same |
| **B4.** 1.5 complete, so the next rung is `practice.1` | **`exercise.hanon.01.both` (L4.4)**, *"Warm-up in the keys…"* | `c-major.right` | *Hot Cross Buns* (already passed) | Silent Night |

What the table shows:

- **No Stage 1 session has a sight-reading row.** The slot's filter is `level <= stageNumber`
  (`:365`), and `drill.reading.sight-reading-1` is level 1.5.
- **Shuffle** (seeds 1–6, state A) puts the Stage 0 placement test (seed 1) and
  `find-all-cs` at L0.2 (seed 2) into the review slot. It puts `c-major.both` into the
  technique slot at seed 3.

### 10. The Score screen

- **Mode.** `input === 'none' ? defaultModeWithoutInput : defaultModeWithInput`
  (`ScoreScreen.ts:3307`). These ship as `tempo` and `wait` (`settingsStore.ts:127–128`).
  Tempo is forced only when `drill.kind === 'sight-reading'` (`:3129`, `:3320`;
  `fromCatalog.ts:118`).
  - The interval-reading item therefore runs in Wait mode when a piano is connected.
  - The "first attempt only" rule (`:2464`) does not apply to it, so every attempt is
    recorded.
- **Rung used for judging.** `rung = lessonForItem(...)` (`:2227`), the first rung that
  lists the item. So `c-major.both` opened from rung 2.1 is judged and stored as `lessonId`
  1.1, with 1.1's prose in the side panel.
- **Prepared steps.** Nine per item, one note per step. The resting staff gives none. The
  engine receives notes and times, and nothing about the target skill.

### 11. Grading

**Wait** (`PracticeEngine.ts:719`). The accuracy is the share of steps played cleanly; any
wrong note spoils its step.

- `tempoPct` is the slider value (`:1308`), not anything played.
- No timing is collected: `deltas` is filled only in `feedTempo` (`:964`, `:991`).
- On a nine-step item, 8/9 is 88.9 %, so one wrong note fails the run.
- Nine clean steps at the default 70 % also fail, and the sheet does not say why.

**Tempo** (`:892`). The accuracy is the share of written notes hit inside ±150 ms.

- An extra wrong note is counted but does not lower the accuracy (`:925–940`; `05` §3). A run
  with three wrong notes can therefore reach 100 % and be mastery-eligible.
- A *right* note played more than 150 ms early matches no open slot. It is counted as a
  **wrong note**, and its slot later closes as **missed**.

**`evaluateOutcome`** (`Scoring.ts:180`) sets `judged = wait || tempo`. Part G defines a pass
"in Tempo mode".

**No technique measure** applies to these kinds. `techniqueMeasureFor` handles only
articulation, voicing, shaping and half-pedal (`Scoring.ts:501–592`). The five-finger
pattern is therefore graded as a pitch exercise; evenness of tone and time, which is what the
pattern exists to train, is recorded in `notes` and never measured.

### 12. The summary → question 6 below.

### 13. The progress, session and skill rows → question 1 below.

The skills store deserves one line of its own. `LessonScreen.ts:737` marks the rung's
concepts `known` when a completed lesson page is drawn. The only reader is `SkillsScreen`,
which just displays them. Search scope: `allSkills`, `displayState`, `markSkill` and
`markLessonLearnt` in the non-test `app/src/**/*.ts` files.

### 14. The review queue

`reviewQueue` (`progressStore.ts:491`) works off the calendar alone:

- It takes rows with status `passed`, measures days since the first pass against steps of
  1/3/7/21 days, and treats an item as up to date when `passedOn.length > step`.
- How the review went is never read.
- The review slot takes only `due[0]`.

**Bug, observed by running it.** `new Date(first)` (`:497`) parses the local day key
`YYYY-MM-DD` as UTC midnight.

- **Example.** An item passed at 20:30 local on 10 September is "due for review" at 20:45
  the same evening under `TZ=America/New_York`, and from 17:00 under `America/Los_Angeles`.
  Under `Europe/London` and `Asia/Tokyo` it is not.
- A review played that evening does not count, because `passedOn` already holds the date.
- Every later step lands four to seven hours early in US zones.
- `dayKey` (`:66`) was fixed for exactly this mistake. This reader was missed.

### 15. The next recommendation

It is the same card (states B0, B1, B2) until `lessonComplete` flips. After that it is the
next rung in order. Nothing about how a run went moves it.

---

## The seven questions

### Q1. What does the system learn from this run?

Every field written after a Score-screen run (`recordRun`, `progressStore.ts:124–179`), and
who reads it. The readers were searched in the non-test `app/src/**/*.ts` files, outside
`progressStore.ts` and `db.ts`.

| Field | Readers | Reaches the next experience? |
| --- | --- | --- |
| `ProgressRow.status` | the `records` builders (Today, Plan, Lesson, Skills, Library badges) → `lessonComplete` → `nextRecommended`; the `mastered` list → repertoire slot; `reviewQueue` | **yes**, as one bit (passed or mastered) |
| `ProgressRow.passedOn` | `reviewQueue`; the mastered transition in `recordRun` | **yes**, as calendar dates |
| `ProgressRow.bestAccuracy` | ProgressScreen text ("best N %"); the Simon best chain in DrillScreen | no |
| `ProgressRow.bestTempoPct` | none found | no |
| `ProgressRow.attempts` | backup merge only | no |
| `ProgressRow.lastPracticedAt` | ProgressScreen sort and text | no |
| `ProgressRow.minutes` | none found | no |
| `ProgressRow.selfPassed` | the paper rule in `lessonComplete`; badges | only for paper |
| `SessionRow` (mode, tempoPct, accuracy, wrongNotes, missed, durationMs, lessonId, …) | ProgressScreen history and performances; DrillScreen coaching (drill runs only); backup | no |
| `StreakRow.minutesByDay`, the daily-read days | Today header and daily card, Progress (from the store's comments; not traced) | no |

- **Never stored:** hot spots per bar, timing deltas and histogram, `correctSteps`, the notes
  played (pitch, velocity, duration), which wrong pitch replaced which written one, loops,
  and rolled chords.
- **So the answer is yes, as an architectural limitation (P1):** pass or fail, best
  accuracy, best tempo, and a calendar, and only pass/fail and the calendar are ever read
  back. State C in §9 shows it: two failing items at 60 % leave the card identical to a
  learner who has never played.

### Q2. What stands in for the learner's ability?

- **The stage number stands in for ability.** `session.ts:256` has
  `const level = position ? position.stageNumber : 1`. **Confirmed.** It feeds every
  fallback:
  - technique: `|level − stage| ≤ 1` (`:270`)
  - review: `≤ stage + 1` (`:292`)
  - new: `|level − stage| ≤ 1` (`:315`)
  - repertoire: `< stage + 2` (`:332`)
  - jam: `≤ stage + 1` (`:351`)
  - sight-reading: `≤ stage` (`:365`)
- **The swapped item's level stands in for the learner's level.** `swapOptions` uses
  `|level − source.level| ≤ 1` (`:463`); `alternativesFor` tier 3 uses `≤ 0.5`
  (`selectors.ts:300`).
- **Rung order stands in for the learner's position.** The first incomplete rung is where
  the learner "is"; the placement's `startAt` only moves the start.
- **The curriculum's own numbers stand in for difficulty.** Generated items' levels are unit
  ids, compared against an integer stage.
- **A constructed state where this makes a wrong selection.** A learner on 1.5, the
  sight-reading-habit rung, gets **no sight-reading row** in any 15, 30 or 60-minute
  session, because `1.5 > 1`. The same holds for all of Stage 1 (observed: the pool at
  Stage 1 is empty).
- **The error runs in both directions.** At Stage 1 the repertoire fallback hands a
  right-hand-only learner a piece at 2.32 every day, because `2.32 < 1 + 2`.

### Q3. The fallback ladder

The honest order in `operating-procedure.md` §7 is: same objective, skill, concept,
prerequisite, musical context, recent weakness, style, and only then level.

| Slot | Actual order (`session.ts`) | Against §7 |
| --- | --- | --- |
| technique | rung `exerciseOptions` (any type: ear drills, sight-reading drills, Hanon) → any non-song with the `technique` track within ±1 of the stage number | Step 1 is "same rung", taken loosely, since the "technique" slot takes any exercise option. Then it jumps straight to level. Stage 1 pool: 49 items, including 20 black-key five-finger patterns at 1.1 and every interval-reading item. |
| review | `due[0]` → a mastered item → any non-song ≤ stage + 1 | Straight to level. The Stage 1 pool has 70 items and includes the placement test and Simon (both observed in the slot). |
| new | rung exercises and songs → anything within ±1 of the stage | The Stage 1 pool has 90 items of any type and track. |
| repertoire | mastered → any song < stage + 2 | Straight to level. Observed: Silent Night (PDMX, 2.32) daily for a C-position learner. |
| jam | any item on the chords-pop, blues or jazz track ≤ stage + 1 | No rung at all. |
| sight-reading | concept tag `sight-reading` and ≤ stage | Empty for all of Stage 1. |
| swap sheet | rung options → the item's `alternatives[]` → a shared concept tag within ±0.5 → same `type` within ±1 (at most 12) | Observed for `c-major.right` on 1.1: after the six rung options come A♭, A and B♭ major five-finger patterns, then (for a review row, which carries no `lessonId`) B, D♭ and more. The shared tag is `five-finger`, and the level ignores the key. |

- **Which fallbacks actually run.** At Stage 1 the technique and new fallbacks are rarely
  reached, because rungs have 7–12 options. The **review and repertoire fallbacks run on
  every early day**, when nothing is due and nothing is mastered.
- **Where the harm comes from.** The worst selections in §9 do not come from the fallbacks.
  They come from **the first tier itself**: a seed index over a rung list that mixes levels
  and purposes. That list offers the hands-together pattern on day one, Hanon at 4.4 as a
  warm-up, and yesterday's reading melody again.

### Q4. Competing definitions

**Exercise.** There are five meanings, and they disagree.

1. Catalog `type: "exercise"`: 1,183 items, of which 1,176 are generated and 7 authored. The
   authored `steps-and-skips-c` has no `drill` block.
2. Catalog `type: "drill"`: 71 items with no file.
3. An entry in a rung's `exerciseOptions`: 429 exercise references and 153 drill references,
   all counted alike by `lessonComplete`. 14 `type: exercise` items sit in `songOptions` and
   count as songs.
4. `drill.kind`: `five-finger` covers the generated patterns, the runtime
   `drill.technique.five-finger-rh` and the rock riffs.
5. The `technique` session slot: any exercise option. On 1.5 that means the sight-reading
   drill.

`[GEN]` (`tags: ["generated"]`) is a sixth grouping and includes the riffs.

**Pass.** Eight definitions, and they disagree.

| Where | Definition |
| --- | --- |
| `02` Part A §5 | A lesson passes by *mastering* one song and one exercise. |
| `02` Part G | A pass is ≥ 90 % accuracy and ≥ 80 % tempo **in Tempo mode**. Without MIDI it is a self-report "recorded as self-assessed". A lesson is complete on 1 exercise *passed* plus 1 item. |
| rung `mastery` | Its own `minAccuracy`/`minTempoPct`, plus a `custom` rule that nothing enforces (1.5: `sight-read-5-first-attempt>=0.9`; practice rungs: `method-applied`). |
| `masteryCriteriaFor` (`selectors.ts:82`) | The rung's pair, else the Settings pair. Master is fixed at 97/100. |
| `evaluateOutcome` (`Scoring.ts:180`) | Passes in **Wait or Tempo**. In Wait, the "tempo" is the slider. |
| Settings (`settingsStore.ts:137–138`) | 90/80, for items on no rung. |
| Lesson prose | 1.1: Wait at 95 %, then Keep tempo at 90 %/80 %. 1.5: five first-attempt generated melodies, no stops. |
| Self-report | The sheet says `Recorded: OK` (`ScoreScreen.ts:2635`) and writes nothing. `selfReport` has one writer, PaperScreen (searched: non-test `app/src/**/*.ts`). |

Three more split definitions sit under "pass":

- **Mastered.** The sheet's heading says *Mastered* after a single qualifying run
  (`:2499–2508`). The store marks `mastered` only with passes on two days (`recordRun`,
  `:144`).
- **Accuracy.** Wait means clean steps, with wrong notes counted. Tempo means notes hit in
  time, with wrong notes free. Both feed one threshold and one `bestAccuracy`.
- **Sight-reading.** `drill.kind === 'sight-reading'` forces Tempo mode and first-attempt
  scoring. The concept tag `sight-reading` is the session slot's filter. The rung 1.5 rule
  is unenforced. The interval-reading items on the sight-reading-habit rung are none of the
  three.

**What I recommend** (not built): make Part G's pass the single source of truth, measured
in Tempo mode. Write Wait-mode runs as practice, not as passes. Turn each rung's `custom`
rule into either a real predicate or nothing. Drop the sheet's standalone "Mastered".

### Q5. The teacher's read, per exercise

**Five-finger, C major, right hand**

- **The ability it builds:** one finger per key, and an even, independent five-finger walk
  in C position.
- **Is it in the notation?** Yes: nine quarters C–G–C with every finger printed.
- **What else it demands:** nothing beyond the rung (treble C4–G4, quarters, 4/4).
- **Is the level honest?** At 1.1 for C, yes.
- **What a teacher would change:**
  - Play it several times through, not once through nine notes.
  - Judge what the pattern is for: evenness of tone and rhythm, and quiet, curved fingers.
    The engine records velocities and onset times and measures neither.
  - Leave the rung's hands-together neighbour (`c-major.both`, 2.1) off 1.1.
- **Could not judge without hearing it:** tone, evenness and hand shape.

**Interval reading, C position, no. 1**

- **The ability it builds:** reading a 2nd against a 3rd by how it looks on the staff.
- **Is it in the notation?** Yes: only 2nds, 3rds and one repeated note. The rhythm is half
  and quarter notes, taught on 1.2; the range is C4–G4, taught on 1.1. It drags in nothing
  unintended.
- **It permits the skill but does not force it.**
  - The hand is fixed on C–G with five possible notes, and the first note always has its
    finger printed. A learner who reads note names does just as well as one who reads
    intervals.
  - Every melody in the family starts on D or E in the same position, which gives nothing to
    transfer to.
  - The contour is a random walk (E F D F D C E E C). The two bars of F–D–F–D alternation are
    decoding practice rather than a phrase.
- **Is the level honest?** 1.5 is honest for the rung.
- **What a teacher would change:**
  - Present the same interval shapes from more than one starting note or position once the
    rung allows it, so name-reading stops working.
  - Give the melody a shape: a phrase and an answer, ending on a cadence rhythm.
  - If it is meant as sight-reading, make it unseen and open it in Tempo mode.
  - If it is meant as an étude, say so, and do not bring it back through the review queue
    as "reading".
- **Could not judge without hearing it:** whether the melody sounds like music or like an
  exercise.

### Q6. The feedback the learner reads

The run: three wrong notes and a rushed bar. The strings are read from `ScoreScreen.ts:2499–2588`; I did not see them rendered.

**Wait mode.** This is the default whenever a piano is connected. Take the three wrong notes
on three different written notes of `ir.01`, at the default 70 %:

```
Run finished
Accuracy       67%
Tempo          70% of written
Wrong notes    3
Missed         0
Weakest bars   1, 2, 3        (whichever bars held them)
Timing         0 ms off the beat on average, 0% of them early
[Again] [Slower (−10%)] [Faster (+10%)] [Loop the weak bars] [Done]
```

- The rushed bar is invisible: Wait mode keeps no time.
- The *Timing* line reports a measurement that was never taken. `score.timing` is always
  present and `heard` is true; the mean over an empty list is printed as 0. It reads as
  perfect timing. This is inferred from code, not seen rendered.
- *Tempo 70 % of written* is the slider, not the playing.
- The line that would matter at 100 % accuracy, why the run did not pass, is absent. At 70 %
  the run cannot pass whatever the accuracy.

**Tempo mode.** Suppose the three wrong notes were extra keys, each followed by the right
note in time, and the rushed bar was early within 150 ms:

```
Passed          (Mastered, at 100 % tempo)
Accuracy        100%
Tempo           100% of written
Wrong notes     3
Missed          0
Weakest bars    the bars holding the wrong notes
Timing          −40 ms off the beat on average, 60% of them early   (illustrative values; one mean over the whole run)
```

If the rush went beyond 150 ms, those right notes would appear as *Wrong notes* **and**
*Missed*. The bar would be named under *Weakest bars* with no word saying it was early.

**Does it say what happened, what it probably means, and what to do next?**

- *What happened*, partly: counts and bars.
- *What it probably means*: never. No line tells "wrong pitch" from "right pitch, wrong
  time". For the reading item, none says "you played a step where a skip was written",
  though in Wait mode `notes` holds the struck pitch against the current step.
- *What to do next*: only the generic buttons.

### Q7. Does the generator guarantee the target skill?

| | Five-finger | Interval reading |
| --- | --- | --- |
| Declared target | docstring `:875–883`; Part E2 "1.1 RH position"; lesson 1.1 | docstring `:1572–1578`; `:1564` comment; Part E2; concept tags; rung 1.5 concepts; lesson 1.5 |
| Anything checks the notation for it? | No | No. Interval *size* is guaranteed by construction; `maxInterval` is written and never read. |
| Other skills required | none beyond the rung (C4–G4, quarters) | none beyond the rung (half notes from 1.2). Name-reading substitutes for interval reading. |
| Level | **declared** from `hands` alone (`:887`); key-blind, and contradicts Part E for 20 of 24 one-hand items | **declared**: default argument `1.5` = the rung id |
| What the catalog keeps | `level`, `levelSource: judged` (untrue), tags `five-finger, C-major, hands:right`, `drill {kind, params {key, quality}}`, notation summary | same shape; tags `steps, skips, interval-reading, C-position`; `params {key, seed, maxInterval}` |
| What it throws away | the purpose; black-key count; that fingering is on every note | the purpose; interval sequence and step/skip balance; range; start note; that it is fixed, not unseen |

---

## Hypothesis status

- **H1: the learner model is completion plus best numbers.** **Supported by observed
  evidence**, with one refinement.
  - A run writes the Q1 fields. Only `status` and `passedOn` are read by selection,
    completion or review.
  - Stage number stands in for level (`session.ts:256`).
  - Hot spots, timing and misses are never read.
  - Review is calendar-only.
  - The refinement: even the "best numbers" are not read. The model is one bit and a date.
  - Constructed states C and B0–B2 show the effect: a failing learner and a never-played
    learner get the same card, and a passed item is offered again every day.
- **H2: the feedback scores without diagnosing.** **Supported, and worse than stated.**
  - The summary never says what a result probably means or what to do.
  - In the default Wait mode it prints a timing statement for timing it never measured.
  - It reports the slider as "tempo".
  - In Tempo it counts early right notes as wrong notes.
- **H3: difficulty has several definitions.** **Supported** in what this trace touched:
  - the generator's declared level, which is key-blind for five-finger and key-aware for
    scales
  - the Part E table, which the five-finger level contradicts
  - `levelSource: judged` on declared numbers
  - `levelBand`, widened to fit the options; it has two app readers, `ShelfScreen` and the
    type (searched `levelBand` in the non-test `app/src/**/*.ts` files)
  - `levelOverrides`
  - stage number as learner level
  - unit-coded item levels compared against integer stages

  The nineteen-feature model does not touch generated items, so I did not trace it.
- **H4: the fallbacks are blunt and can become the curriculum.** **Supported for the
  fallbacks. Contradicted as the main mechanism.**
  - Every fallback is a level window, and the review and repertoire fallbacks run daily at
    the start.
  - But the wrong items in the constructed states came from the **first tier**: seed-indexed
    picks over mixed rung lists, and cross-rung credit. The fallback ladder is the lesser
    problem. The absence of any learner model inside the rung is the greater one.
- **H5: generator families have no stated purpose and no check that the target skill is
  present.** **Partly contradicted, partly supported.**
  - Both families state their purpose in the docstring and in Part E2's "Trains" column.
  - The purpose never reaches the catalog, the engine or the rung's completion rule, and
    nothing checks the notation for it. These two families introduce no unintended hard
    skill by construction. The placement of `c-major.both` on 1.1 does, but that is the
    rung's fault, not the generator's.
- **H7: some lesson prose explains the app.** **Supported for 1.5, not for 1.1.** 1.5 has the
  generator paragraph and *Tools for this rung*, and promises a pass rule the app does not
  check. 1.1 is music throughout, apart from mode names in its pass line.

---

## Source-of-truth rows (the ones this trace touched)

| Concept | Current source of truth | Major consumers | Competing definitions? |
| --- | --- | --- | --- |
| Learner level | None. Proxied by the first incomplete rung's `stage.number` (`session.ts:256`), moved by the placement's `startAt` | `fillSlot` (every slot), the Today "Working on Stage N" line | Yes: stage number; the rung position; item level in the swap sheet; skills rows (display only) |
| Difficulty | Catalog `level`. For generated items it is declared by the maker from one parameter; for PDMX it is a regression | session fallbacks, `alternativesFor`, `swapOptions`, `validate.py` band and reach checks, Library | Yes: `levelBand`, Part E table, `levelSource`, `levelOverrides`, `scale_level` vs `make_five_finger` |
| Skill | Rung `concepts` (vocabulary in `concepts.json`, validated) | SkillsScreen, LessonScreen `markLessonLearnt` | Yes: item `concepts` are free tags (`C-major`, `hands:right` are not in the vocabulary), used by swap tier 3 and the sight-reading slot; generator docstrings and Part E2 hold the real purpose |
| Mastery | Rung `mastery` + `masteryCriteriaFor`, with master fixed at 97/100 | `ScoreScreen.showSummary`, `evaluateOutcome`, `recordRun`, `lessonComplete` | Yes, eight ways (Q4). `custom` is unenforced. The sheet's "Mastered" and the store's disagree. |
| Performance evidence | `ProgressRow.status` + `passedOn` | `lessonComplete`, `nextRecommended`, `reviewQueue`, repertoire slot | Yes: Wait accuracy ≠ Tempo accuracy; Wait "tempo" is the slider; self-report not stored; `SessionRow` detail unread |
| Repertoire level | *(touched only through the repertoire slot's `level < stage + 2` fallback; left to T36b)* | | |
| Curriculum stage | `stage.number` in `content/curriculum/stage-N.json` | `nextRecommended` → `fillSlot`; the Today status line | Yes: generated items' `level` encodes unit ids on the same axis, and is compared against the integer stage |

---

## Findings, ranked

### Top three

**1. P1. The learner model is one bit and a date, and selection inside a rung is
blind to it.**

- **Current implementation:**
  - `recordRun` (`progressStore.ts:124–179`) writes the Q1 fields. Only `status` and
    `passedOn` are ever read back.
  - `fillSlot` picks `options[seed % n]` (`session.ts:236`, `:260–262`, `:303–312`), with
    `resolve` filtering only today's used items (`:223–234`).
- **Why it hurts a learner:**
  - The learner who fails gets the same card tomorrow.
  - The learner who passed a reading melody gets the same melody again. By then it is
    memorised, so it no longer trains reading.
  - A day-one learner on the right-hand rung is handed the hands-together pattern, because
    it is option index 2.
- **Evidence:** states A, C and B0–B2 in §9, observed by running `buildSession`.
- **Direction:** keep the rung lists; stop choosing by index.
  1. Skip items already passed this rung and items above the rung's own level.
  2. Store per-run evidence keyed to the item's target skill (step 2 of finding 2).
  3. Prefer the item whose skill the last runs showed weakest.
- **Scope:** a model change, done in small steps; the first step is local to
  `resolve`/`pick`.

**2. P1. A rung completes on a count of passes, so the skill the rung names is never
what the evidence shows.**

- **Current implementation:** `lessonComplete` (`selectors.ts:176–204`) counts passes over
  `exerciseOptions` and `songOptions`, with any item on any rung giving credit. The
  `mastery.custom` rules are unenforced. The interval-reading item is not sight-reading to
  the Score screen (`ScoreScreen.ts:3129`, `:3320`), so it runs in Wait mode, repeatably.
- **Why it hurts a learner:**
  - Rung 1.5, "Steps and skips, and the sight-reading habit", completes on
    `drill.ear.interval-2nd-3rd` plus `drill.ear.simon-c-major`, without reading one note.
  - One pass of `exercise.five-finger.c-major.both`, the day-one "new" item, completes
    practice.1, practice.3 and practice.4, the how-to-practise rungs, and fills the exercise
    half of 1.1, 1.3 and 2.1.
  - The concepts are then marked `known`.
- **Evidence:** `lessonComplete` executed on constructed records: `complete(1.5)` with two
  ear drills is `true`, and the rungs completed by that one pass plus *Hot Cross Buns* are
  1.1, practice.1, practice.3 and practice.4. The `custom` readers were searched as in §7.
- **Direction:**
  1. Give each option a role on its rung, e.g. `reading`, `ear`, `song`, or the skill id
     from the generator.
  2. Make the rung's rule a predicate over roles and modes, e.g. "two `reading` passes, in
     Tempo mode, first attempt".
  3. Stop cross-rung credit unless the rung asks for it.
  4. Give generated items a machine-readable `targetSkill` that the rung and the summary can
     both read.
- **Scope:** a model change in the curriculum schema and `lessonComplete`. The generator
  side is local.

**3. P0. The summary sheet reports things that were not measured, in the mode most
learners use.**

- **Current implementation**, in `ScoreScreen.showSummary`:
  1. In Wait mode it prints `Timing: 0 ms off the beat on average, 0% of them early`
     (`:2580–2588`), though Wait collects no deltas (`PracticeEngine.ts:964`, `:991` only).
  2. `Tempo: N% of written` (`:2527`) is the slider in Wait mode (`PracticeEngine.ts:1308`),
     and the pass is decided on it.
  3. The heading says *Mastered* after one run (`:2499–2508`), while the store requires two
     days (`progressStore.ts:144`).
  4. *How did it go?* answers `Recorded: …` (`:2635`) and records nothing.
  5. In Tempo mode, an early right note is reported as a wrong note plus a missed one
     (`PracticeEngine.ts:925–940`).
- **Why it hurts a learner:** they are told their timing was perfect when nobody listened,
  that they mastered a piece the app still calls passed, and that a self-report was saved
  when it was dropped.
- **Evidence:** code paths as cited. I did not see these on a screen. The discriminating
  test for (1) is a Wait-mode run that plays every note late and then reads
  `#score-summary`: a correct sheet shows no *Timing* line.
- **Direction:**
  - Show *Timing* only when `timing.n > 0`.
  - Label the Wait tempo as the setting, or omit it.
  - Head a first qualifying run "Mastery run 1 of 2".
  - Pass `selfReport` to `recordRun`, as Part G says.
  - Split "early" from "wrong pitch" in Tempo.
- **Scope:** local fixes.

### The rest

**4. P0. The review queue parses local dates as UTC.**

- **Current implementation:** `progressStore.ts:497`.
- **Why it matters:** in US zones, anything passed in the evening shows "Due for review
  today" the same evening, the review done then does not count, and every step lands early.
- **Evidence:** executed under four time zones (§14).
- **Direction:** compare day keys, or parse `YYYY-MM-DD` as a local date.
- **Scope:** local.

**5. P0. Five-finger levels ignore the key.**

- **Current implementation:** `generate_exercises.py:887`.
- **Why it matters:** 20 one-hand patterns with black keys are rated 1.1, against Part E.
  The swap sheet on rung 1.1 offers A♭, A and B♭ major patterns as equivalent to C
  position, on a rung whose finder says "avoid black keys" (observed).
- **Direction:** band by key the way `scale_level` does (C and G at 1.1, the Part E Stage 2
  keys at 2.x, the rest later).
- **Scope:** local.
- **Recorded:** the same key-blindness applies to the 12 minor `both` items at 2.1.

**6. P0, a symptom of finding 1.** Stage 1 sessions have no sight-reading row. The slot's
`level <= stageNumber` excludes `sight-reading-1` at 1.5 (`session.ts:365`), so the
sight-reading-habit rung has none (observed). It can be fixed locally, but the fix belongs
with a learner level.

**7. P1. One threshold for two accuracies.** Wait counts clean steps; Tempo counts notes
hit, with wrong notes free. On a nine-note item, "90 %" means *flawless* in Wait and allows
*unlimited wrong notes* in Tempo. It is recommended in Q4. It is a model change, because the
definition of accuracy is involved.

**8. P2. Rung lists hold items the rung does not teach, and the pick is by index.**

- `c-major.both` (2.1, hands together) is on 1.1 and is the seed-0 "new" item.
- `exercise.hanon.01.both` (4.4) is practice.1's first option and becomes a Stage 1
  "warm-up".
- `exercise.riff.a.falling` is on 1.5 and its lesson never mentions it.
- **Direction:** take these off the lists, or give them roles (finding 2).
- **Scope:** content.

**9. P2. The interval-reading generator allows name-reading.** See Q5. The fix is more
starting positions when the rung allows them, a phrase shape, and a decision between étude
and unseen. Scope: content and generator, local.

**10. P2. Lesson 1.5 explains the app and promises a pass rule that nothing checks. Lesson
1.1's pass rule differs from the app's (§8, H7).**

- **Direction:** rewrite the *How you'll know* lines against the enforced rule once finding
  2 lands, and cut the generator and tools paragraphs to what to see and do.
- **Scope:** content.

**11. P3.** `levelSource: "judged"` is written on table-derived levels (`:649`), and
`levelConfidence` then prefers them.

**12. P3.** The reason strings are fixed text. *"Warm-up in the keys you are working in"*
appears over an ear drill, the sight-reading drill and Hanon at 4.4.

**13. P3.** Item concept tags are not validated against `concepts.json`. As a result the
five-finger items appear on the Skills screen under `five-finger`, whose only rung is
`technique.4`, and not under 1.1's `C-position`.

---

## Adjacent, recorded and not followed

- **P2.** `exercise.interval-reading.c-position.{right,left}.05` are options on rung 3.4,
  *Ledger lines and both hands away from middle C* (`stage-3.json:264–265`). The generator
  fixes octave 4 for the right hand and 3 for the left (`:1607`), so these items hold no work
  away from middle C. Inferred from code; not dumped.
- **P3.** Items are judged and prosed by their first rung (`lessonForItem`). `c-major.both`
  opened from 2.1 shows 1.1's notes and is stored with `lessonId` 1.1.
- **P3.** `validate.py`'s `level_band_errors` docstring says the lesson page prints the
  band. `LessonScreen` does not read `levelBand` (searched as in H3).
- **P3.** `04` §2 gives the swap tiers as lesson → concept → `alternatives[]`. The code does
  lesson → `alternatives[]` → concept → same type within ±1.
- **P2.** Skills go "rusty" 30 days after the lesson was first completed, and practice
  never refreshes them: `markLessonLearnt` skips seen concepts, and runs never touch the
  store. Every learnt concept goes rusty at day 30 however much it is practised.
- **P3.** Drill runs store `tempoPct: 100` as a constant (`DrillScreen.ts` `keep()`).
- **Inference, not measured.** The review slot takes one due item per session, while each
  pass creates four reviews, so the backlog may grow faster than it drains.

---

## What is unverified

- **Nothing was heard.** The musical reading of `ir.01`'s contour and of the five-finger
  pattern's usefulness comes from notation alone.
- **The summary strings were not seen rendered.** The Wait-mode *Timing* line is inferred
  from `deltas` being filled only in `feedTempo` and from the unconditional `score.timing`.
- **The session walk may differ on a device.** It called the real functions on the built
  content in Node. On a device, `loadCurriculum`/`allItems` overlay imports, shelf pieces
  and level overrides, which could change picks. With none present, the functions are the
  same ones.
- **Only two items were dumped.** Claims about the other interval-reading seeds (all start
  on D or E; repeated notes possible) and about the `.05` items on 3.4 come from generator
  code. `dump_score.py` hides ties, tuplets and graces; the generator code for both
  families writes none.
- **Not examined:**
  - `exercise.reading.steps-and-skips-c`, the study lesson 1.5 names; its row says 8 bars,
    one staff, authored
  - the Silent Night PDMX arrangement the repertoire slot picks
- **How drills pass.** I saw that `DrillScreen.keep()` records `outcome.passed`. I did not
  read how each drill kind computes it, so "1.5 completes on two ear drills" assumes those
  drills can pass, as Part G says they do.

## Files read

- `docs/prompts/tasks/T36a-trace-generated-exercise.md`
- `docs/prompts/operating-procedure.md`
- `docs/prompts/audit-2026-09-25-outside.md` (message 1 and the Part 2/3 notes)
- `docs/prompts/plan-2026-09-25.md` (the hypotheses)
- `docs/02-curriculum.md` Part A, Part E (the table and E2), Part G
- `docs/05-score-follow-engine.md` §2, §3, §9a
- `docs/04-ui-spec.md` §2 and the §5 summary line
- `docs/pending-review.md` (grep hits for the two items only)
- `tools/content/generate_exercises.py`: header, `scale_level`, `confirm*`, `finalize`, `catalog_entry`, `make_five_finger`, `make_coordination`, `make_interval_reading`, `make_position_shift`, `default_plan` (to `:5520`)
- `tools/content/build.py`: `merge_catalog`, `attach_notation`, `attach_rung_tracks`, `attach_sections`
- `tools/content/validate.py`: `level_band_errors`, `thin_lesson_errors`, `unknown_concepts`, `CLAIMING_CONCEPTS`, `notation_requirements`
- `tools/content/dump_score.py` (header), run on the two items
- `content/curriculum/stage-1.json` (1.1–1.5, practice.1), `stage-2.json` (2.1 options), `stage-3.json` (grep), `concepts.json` (ids)
- `content/lessons/1.1.md`, `content/lessons/1.5.md`
- The built `app/public/content/catalog.json` rows for the two items and for rungs 1.1 and 1.5's options; `curriculum.json` tracks
- `app/src/curriculum/session.ts`, `selectors.ts`, `load.ts` (loading and overlays), `tracks.ts`, `tips.ts` (header)
- `app/src/data/progressStore.ts`, `db.ts` (`ProgressRow`, `SessionRow`), `skillsStore.ts`, `settingsStore.ts` (defaults), `levelOverrides.ts` (header)
- `app/src/engine/Scoring.ts` (to `:230`, the `techniqueMeasureFor` kinds), `PracticeEngine.ts` (Wait and Tempo feeds, score assembly), `types.ts` (defaults), `drills/fromCatalog.ts`
- `app/src/ui/screens/ScoreScreen.ts` (`showSummary`, mode choice, rung lookup), `TodayScreen.ts` (seed and build), `LessonScreen.ts` (completion and skills), `SkillsScreen.ts` (`buildConcepts`), `DrillScreen.ts` (`keep()`)
- `app/src/score/ScoreSession.ts` (header)
