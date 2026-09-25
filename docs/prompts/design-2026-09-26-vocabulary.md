# Vocabulary design, 2026-09-26: what an item demands, what it practises, what a run observed, and what that is evidence of

**For review. Not approved, and nothing in it is built.** Written read-only for C0a
(`tasks/C0a-vocabulary-design.md`), so that the owner and the outside reviewer can argue with it
before anything in Wave C is built. It answers the brief's eleven questions in order.

Two warnings from the reviewer govern every answer (`audit-2026-09-25-outside.md` Part 4):

- One `level` must not come back as seven little numbers.
- "The item contains X" must never become "the learner can X". Evidence comes only from what a run
  measured.

**How the evidence was got.** I read the documents and code listed at the end.

- Claims that decide something were checked at the cited lines. Claims taken from a trace say so.
- I ran read-only Python counts over the built `app/public/content/catalog.json` and
  `curriculum.json`: concept tags against the vocabulary, the rows of the three worked items, and
  the nine sight-reading rows.
- There was no build, no browser and no test run. Nothing was heard and no screen was seen. Every
  on-screen consequence below is read from code.
- The test inventory (C0b, AT-15) was running alongside this, and its file did not exist yet. The
  test classes named in §10 are this design's proposal. They must be reconciled with that inventory.

---

## The judgement

**What each concept is, in one sentence.**

- **Material demand.** A property the notation contains, found by a detector and located in bars
  and staves, such as triplet eighths in bar 3 of the right hand, or an octave leap in the left
  hand in bar 12. A person never types it.
- **Performance demand.** The conditions one run was played under: the mode, the tempo the run
  held the learner to, the hands, what the keys showed, whether the music was unseen, and what help
  was used.
- **Skill prerequisite (`needsSkills`).** The skills the ladder must already have taught before
  offering the item is honest. It is derived from the item's demands through one reviewed table.
- **Skill practised (`targetSkills`).** The ability an item, or a rung's use of it, is chosen to
  train. It is declared from the skill vocabulary and checked against the demands for presence.
- **Learner ability (skill state).** For each skill, the evidence the learner's runs produced, with
  dates and contexts, read as one of seven ladder states. It is never a score.
- **Curriculum address.** The rung an item is offered on, and nothing else.
- **Observation.** What one run measured, by that run's own definitions. Every channel it did not
  measure is marked as not measured.
- **Evidence.** What one observation supports about one skill. One pure function computes it from
  the observation, the demands of the music actually played, and the skill's definition. It is
  recomputed, never stored as a flag.
- **Teaching plan.** A lesson's structured content. Its `concept` is a skill id. Its practice
  fields name items by role. Its success criteria point at the rung's requirement instead of
  restating it.

**The smallest model that makes the truth rule enforceable** has five parts:

1. Observations that say what was measured and what was not.
2. A skill vocabulary where every skill names its *opportunity* (the demands that exercise it)
   and its *observable* (the measurement that shows it, and under which conditions).
3. Demand detectors that run over the music actually played.
4. One evidence function, whose only route to "supports" runs through a measurement.
5. A build check that refuses a rung requiring evidence of a skill no run can measure.

Levels, needs, excerpts and teaching plans come after these and do not change the rule.

**How this avoids seven little numbers.**

- Demands are properties with locations, not scores per dimension.
- Skills are named abilities: dozens of them, not seven axes.
- The learner's state is a list of evidence per skill, with an ordinal ladder state derived from
  it.
- The only scalar left is a derived level, used for sorting.

A reader can disagree: fifty ordinal states are still fifty numbers. The difference claimed here is
that each one traces back to the runs that produced it, and none is a dimension of one difficulty.

**The two places this design is least sure.**

1. **Whether a measurement actually shows the skill (construct validity).** The rule can
   guarantee that evidence comes only from a channel that was measured, at the place where the
   demand occurs. It cannot guarantee that the channel shows the skill. Two cases:
   - A name-reader plays a fixed-position interval melody, with the first finger printed, just as
     correctly as an interval-reader does (generated-exercise trace, Q5).
   - By default the keyboard strip marks the next key and its finger during every Score-screen run,
     sight-reading included (`settingsStore.ts:150–151`; `ScoreScreen.ts:3970` passes the setting
     through). Right notes can therefore show that the learner followed the lights, not that they
     read the staff.

   The design relies on performance conditions (unseen music, guide off, the item's role) to give
   the upper ladder states meaning. That is a pedagogical judgement for each skill, and no
   mechanism settles it. It is where the reviewer's disagreement is most likely to be right.

2. **How large the skill vocabulary is, and the demand-to-skill table.** The rule needs skills and
   demands as separate lists, each with definitions. Today's 283 concepts mix skills, demands,
   styles, topics and app features. On the built catalog, 318 of the 514 distinct item concept tags
   are outside that vocabulary. Three questions are open:
   - How many skills there should be, and at what grain.
   - Who keeps the table that says which skill copes with which demand.
   - Whether the whole apparatus is worth its cost.

   Too fine, and it becomes a taxonomy nobody maintains. Too coarse, and "reading" is one number
   again. The proposal is to start from what the first reader needs (the sight-reading rows'
   promises: about fifteen demands and a dozen reading skills) and grow per wave. Whether that
   earns the machinery is unproven.

---

## 1. The concepts: one sentence, one writer, their readers

| concept | where it lives today | its one writer | its readers, once built |
|---|---|---|---|
| **material demand** (`demands`) | Nowhere as such. The nineteen whole-piece features stop at `pdmx.json` (`build.py:366–371`). The catalog's `notation` block holds bars, staves, keys, metres and chord symbols. Free concept tags (`hands:right`, `C-major`) assert the rest. | **Demand detectors.** At build time they run over files (quarried, authored, generated). In the app they run over phrases generated at runtime and over imports. There is one list of demand ids and two implementations, with an agreement test, as `app/src/score/difficulty.ts` already has for the level model. | The evidence function (to find opportunities). `needsSkills` (derived from demands). Generator presence and absence checks. The derived level (as its inputs). The "what makes it hard" line. Excerpt selection. The swap sheet (demand overlap). |
| **performance demand** | Partly on `SessionRow`: `mode`, `tempoPct`, `tempoMeasured`, `performance`, `rhythmOnly`, `seed` (`db.ts:60–118`). Hands, what the keys showed, grace-note judging and input source are not stored. | **The session config**, fixed when the run starts (E1's immutable session config). It is the observation's header, not a separate object. | The evidence function (for its conditions). The sheet (which criteria apply). Rung requirements. |
| **skill prerequisite** (`needsSkills`) | Nowhere. Rung `requires` checks four notation facts, and only on rungs carrying one of five claiming concepts (`validate.py:944–1021`). The only demand-to-taught table is in a test: `unintended()` in `sightReadingPromises.test.ts:333`. | **The build.** It derives needs from `demands` through the vocabulary's `copedWithBy` table. An author may add a need, with a reason. An author may not remove a derived need except by an explicit waiver naming the demand and the reason, and `validate.py` counts waivers. | The needs-versus-taught build gate, which replaces band fitting (R8). Later, selection: needs set against the learner's evidence. |
| **skill practised** (`targetSkills`) | In prose: generator docstrings, `02` Part E2, lesson text. Item `concepts` are free tags; rung `concepts` are validated ids. | **One writer per kind of item.** The family table in the generator, for generated items. The author's header, for authored exercises. The rung option that uses it, for a whole repertoire piece (D2's "role on the option"). The person who cut it, for an excerpt. The build merges these onto the item and records where each came from. | The evidence function (the candidate skills). The sheet. The in-rung pick. The swap sheet. `validate.py` (a presence check against the demands). |
| **learner ability** (skill state) | Nowhere. The stage number stands in for it (`session.ts:256`). `SkillRow.state` becomes `known` when a lesson page is drawn after the rung is complete by item passes (`LessonScreen.ts:737`). That is item completion written as skill. | **Nobody writes it.** It is derived from observations by the evidence and ladder functions. A cache is allowed only if it stamps the version of the definitions it was derived under. | The in-rung pick. Sight-reading constraints. The swap sheet. The Skills screen. The reason line. Rung state. |
| **curriculum address** | The rung's option lists. For generated items it is also the integer part of `level` (`1.1`, `1.5`, the rung id as a default argument). | **The curriculum author** (the rung JSON). | `nextRecommended`. The Plan screen. The opening context on an observation. The sheet's criteria. |
| **observation** | `SessionRow`, which holds about half of it (§3). | **`recordRun`**, and nothing else. | The evidence function. The Progress history. Backup. |
| **evidence** | A pass flag and a date (`ProgressRow.status`, `passedOn`). | **The evidence function**, which is pure. | Skill state. Rung requirements. The sheet ("what this run showed" and "not judged"). Feedback. |
| **teaching plan** | Lesson prose (`content/lessons/*.md`). | **The lesson author** (Wave F), validated by the build. | The lesson page. The practice cue. The after-miss line. The deeper explanation. The lesson claim tests. |

**Name collisions to settle before any schema is written** (each checked in the file named):

- `needs` is taken. On `Lesson` it means what a rung is short of (`curriculum/types.ts`,
  `interface Needs`).
- `requires` is taken by rung notation requirements, and `prerequisites` by rung-to-rung
  prerequisites (`curriculum.schema.json`). Hence `needsSkills`.
- `level` becomes `levelEstimate` (§6).
- `drill.params.level` on the nine sight-reading rows is the generator's recipe index. It becomes
  `recipe.level`.
- Item `concepts` is split into `targetSkills`, `demands`, and nothing.
- `mastered` is two things: an item standard in Part G ("97 % at full tempo, twice on different
  days") and the top of the skill ladder in §5 (see §11, item 10).

**The teaching plan's fields and what binds each one to the vocabulary**

| field | holds | bound by |
|---|---|---|
| `concept` | One skill id: the lesson's central idea (T5). | Must be a vocabulary skill with an observable, or a knowledge topic. |
| `whyItMatters` | One or two sentences about the music, never about the app (T1). | Prose. |
| `notice` | What to see, hear or feel (T7). | May name demand ids to point at in `example`, e.g. "the thirds in bars 2–3". |
| `do` | The action, in one to three sentences (T8). | Prose. |
| `avoid` | The habit to avoid, described musically. | Prose. |
| `example` | An item or excerpt id, with bars, to demonstrate. | The id resolves and the bars exist. |
| `guidedPractice` | Items with role `canonical`, and the supports allowed (Wait, slowed tempo, guide on). | Role is checked. |
| `independentPractice` | Items with role `variable`, played under the skill's full conditions. | Role is checked. |
| `transfer` | Items with role `transfer`, or repertoire uses on first contact. | Validated to differ in context from the guided items. |
| `successCriteria` | A reference to the rung's requirement. | Must resolve to that requirement. The learner-facing sentence is rendered from it and never restated in prose (T2, T6). |
| `commonMisconceptions` | What the learner does; the observation signature that detects it, if one exists (for example, a step played where a skip was written); and the line said after it. | A line whose signature cannot be detected may appear in the lesson, but never as feedback after a miss. |

The same plan renders as four things: the lesson page; the cue during practice (`notice` and `do`,
shortened); the line after a miss (a matched misconception); and the deeper explanation. That is
N-180's point.

The truth rule applies to feedback too. "You missed the skip" is said only when the observation's
per-step record shows a step played where a skip was written.

---

## 2. Demand and skill are different ontologies: three items from the catalog

### A. `exercise.five-finger.c-major.right`

Rung 1.1 and `practice.4`. `level` 1.1, `judged`. Tags: `five-finger`, `C-major`, `hands:right`.

**Demands**, read from the file as the generated-exercise trace dumped it (§2):

- one staff, treble, right hand only;
- nine quarter notes, C4 D4 E4 F4 G4 F4 E4 D4 C4, then a rest;
- a range of a fifth, inside one position, and every interval a second;
- 4/4, with no key signature;
- a finger number printed on every note.

Each of these is trivial to detect. The catalog keeps `hands`, `keySig`, `timeSig` and
`notation.bars`. Its two tags `C-major` and `hands:right` are outside the vocabulary.

**Skills:**

- (a) Find and keep C position, one finger per key.
- (b) An even five-finger walk: equal tone and equal time across fingers 1 to 5. This is the
  trace's teacher read of what the pattern exists for.

**Why neither can be derived from the other:**

- The same demands (a stepwise walk C–G–C in quarters, right hand) also open a first reading
  melody, whose skill is reading a line. Nothing in the notation says "evenness", which is a
  property of the playing.
- "Evenness across five fingers" is equally a Hanon number or a scale. The skill says nothing about
  range, key or hands.
- Neither skill is fully observable today:
  - (a)'s "one finger per key" is not observable at all, because nothing tracks fingers. What is
    observable is the right pitches in order.
  - (b) needs velocity and regular onsets. The engine records both on every note
    (`RecordedNote.velocity` and `tMs`, `engine/types.ts:333–350`) and measures neither (trace §11).

So today a run of this exercise can support "right notes in position", and in Keep tempo also
"in time". It can support nothing about what the exercise is for.

### B. Anh. 113 (`song.classical.bach-menuet-bwv-anh-113.pdmx`)

Rung `classical.3`. `level` 5.23, estimated. Concepts: `["repertoire"]`.

**Demands**, from the repertoire trace, read from the file (Q2, Q4):

- Metre and key:
  - 3/4;
  - F major, with E♭, B♮, C♯ and F♯ outside the key;
  - a turn to D minor in bars 17–24.
- Rhythm and ornament:
  - sixteenths in bar 1;
  - triplet eighths in bars 2–3, nine of them in bar 3;
  - appoggiaturas in bars 2, 4, 16 and 32;
  - a trill in bar 11.
- Texture:
  - one note per hand throughout;
  - both hands moving in eighths at once in bars 2, 4, 14, 18, 20 and 24;
  - a three-note figure passing between the hands in bars 17–21.
- Reading and range:
  - ledger lines up to C6 and down to E2;
  - leaps of up to an octave in each hand.
- Length: 32 bars, with repeats.

The stored features see ranges, leaps, accidentals, the shortest value and the length. They do not
see tuplets or grace notes, and none of them reaches the catalog.

**Skills.** As `classical.3` would use the piece:

- two independent lines, one per hand (the rung's `two-voice-texture`);
- a minuet's three, with light second and third beats (`baroque-dance`);
- articulation.

Other rungs could use the same notes for different skills: triplets against a steady beat (4.5),
reading ornaments (`classical.4`), or a trill (`classical.5`).

**Why neither can be derived from the other:**

- **From demands to skill.** The same file offers triplet work, ornament work, ledger-line work and
  two-voice work. Which one it is *for* is a teacher's choice, made by the rung, and a different
  choice makes it a different learning experience. This is N-180's Piece / Excerpt /
  LearningExperience.
- **From skill to demands.** "Two-voice texture" says nothing about a trill or triplets. That is how
  a piece the notation puts around Stage 5 came to sit on a Stage 3 rung (trace Q3).
- **Only both together give the honest statement:** bars 17–24 practise the rung's skill within
  what Stage 3 has taught, and the whole piece does not.

### C. A level-4 sight-reading phrase (`drill.reading.sight-reading-4`)

Rungs 4.6 and `technique.5`. Row `level` 5.0, `judged`. Parameters: `level: 4`, `fifths: 0`,
`timeSig: '4/4'`, `accidentals: true`, `bars: 8`, `hands: 'both'`.

**Demands** belong to each phrase, not to the row. The row carries a recipe, `LEVELS[4]`
(`sightReading.ts:229–240`):

- right hand A3–G5, left hand F2–C4;
- eighths, quarters, dotted quarters and halves;
- leaps up to a fifth, ties and rests;
- a block-chord left hand;
- keys up to two accidentals, though this row fixes C major.

Each seed realises only a subset of that. T37's promises test checks, over 40 seeds, that every
level-4 phrase has an accidental reached by step and resolving upward, and none has syncopation or
triplets. The detectors for this already exist in that test (§7).

**Skills:**

- read an unseen phrase at tempo without stopping;
- read ledger lines above and below the staff;
- read a chromatic passing note;
- keep a left-hand chord under a moving right hand, at sight.

**Why neither can be derived from the other:**

- **The recipe is neither the demand nor the ability.** A given seed may contain no fifth at all.
  The code reads the row's numbers three ways (row S5):
  - `params.level` as constraints on the phrase;
  - `item.level` as the exercise's difficulty;
  - `stageNumber` as the learner's ability, compared with `item.level` as if both sat on one scale
    (`TodayScreen.ts:383`).
- **"At sight" is not in the notation.** Played a second time, the same phrase has identical
  demands but practises something else: memory and rehearsal. "Unseen" is a performance demand. It
  belongs on the observation, not on the item.

**In short:** demands answer "what is on the page, and where". Skills answer "what we are using it
to teach". Neither answers "what the learner can do". Only observations answer that.

---

## 3. The observation shape

**Principles:**

- One observation per recorded run, in the existing `sessions` store, extended rather than
  replaced.
- Every measure carries its definition.
- Every channel the run did not measure is marked not measured. It is never zero.
- The header is fixed when the run starts.

### Header: the performance demand

| field | what it holds | in `SessionRow` today | where the app has it |
|---|---|---|---|
| item | `itemId`, plus `range` (printed bars) for an excerpt or a recorded lap | `itemId` yes; `range` no | the route and the loop |
| opening context | the rung that opened the screen, the Today slot if any (new, review, technique, sight-reading, repertoire, daily read), and the route (lesson, library, plan, import) | `lessonId` holds the opening rung since T37. With no opening rung it holds the first rung listing the item (`scoreSummaryTruth` "opened from nowhere, the first rung listing it still judges it"). Slot and route are not stored. | `ScoreScreen.ts` route state |
| mode | Wait, Keep tempo, Listen, Free | yes (`mode: string`) | session |
| tempo | the percentage asked; whether a tempo was measured; the base tempo; whether that base was written or defaulted by the converter | `tempoPct` yes; `tempoMeasured` yes (T37); base tempo and its source no | item `tempoBpm`, and the `tempo-defaulted` tag (176 PDMX rows, repertoire trace) |
| hands | which hands the learner played, and whether the app played the other (duet) | no | hands focus (`ScoreScreen.ts:397`) |
| what the keys showed | strip on or off; guide next, next-two or off; finger numbers; note names on the score | no | settings (`settingsStore.ts:147–151`; defaults are strip, guide `next`, fingers on, names off) |
| grace notes judged | true or false | no. It is always false on the Score screen: `ENGINE_DEFAULTS.includeGraceNotes` (`engine/types.ts:244`). A grep for the name in `settingsStore.ts`, `ScoreScreen.ts` and `ScoreSession.ts` found no caller setting it. A grep of all non-test `app/src` found it only in `prepareSession.ts` and `engine/types.ts`. | engine options |
| input | MIDI, microphone, screen keys or paper; the tolerance window; the latency setting | only `accuracyEstimated` (microphone) | settings (`FollowInput`, `settingsStore.ts:28`); `toleranceMs` 150, or 200 for the microphone profile (`engine/types.ts:235`, `:248`) |
| unseen, first attempt | `seed`; heard before the run; demonstrated during it | `seed` yes (T37). Heard or repeated sight-reads are *not recorded* at all (T40, `02` Part G). A demonstrated performance is recorded as practice. | route seed; T33/T40 set-aside state |
| kind of run | performance; rhythm only; self-report; paper steadiness, notes heard, bpm | all yes | — |
| definitions version | which accuracy definition, tolerance and detector version applied, so a later reader can derive again | no | — |

This design recommends recording the runs that T40 now drops. A heard sight-read would be recorded
with `unseen: false`, and a demonstrated performance with `demonstrated: true`. Both are honest
evidence of the notes, and the rule in §4 keeps them out of sight-reading and performance evidence.
This is a choice (§11, item 6).

### Measures: what was observed

| field | what it holds | in `SessionRow` today | where the engine has it |
|---|---|---|---|
| pitch, with its definition | Wait: steps completed cleanly. Keep tempo: expected pitches hit inside the window. Stored as `{definition, right, of}`, so that the two accuracies (L10) are never one number. | One `accuracy`, whose definition is implied by `mode`. The denominators are not stored. | `buildScore`, `Scoring.ts:124–131` (`correctSteps/totalSteps`, `hits/expectedNotes`) |
| wrong, missed, early | counts | `wrongNotes` and `missed` yes; `early` (a right note before its window, T37) no | `SessionScore.early` (`engine/types.ts:399`); `RunResult` has no field for it |
| per-step outcome | for each step: hit, missed, wrong (with the pitch struck), or early | no | the engine's `notes` (`stepIndex`, `ok`, `deltaMs`) and its miss maps. `hotSpots` keeps the worst five bars only (`Scoring.ts:65`, `:147`), and none is stored. |
| timing per note | the onset delta of each matched note, Keep tempo only; marked measured or not measured, never zero | no | `deltas`, filled only on the tempo path (`measuresTempo`, `Scoring.ts:202`) |
| continuity | stops and long gaps in Keep tempo; time per step in Wait (the one fluency signal Wait could give, since note times are recorded) | no. It is not computed anywhere: a grep of `app/src/engine/*.ts` for `continuity` or `hesitat`, then of all non-test `app/src` for `continuity`, both came back empty. | to be built in C. This design does not invent a field ahead of its measure. |
| technique measures | articulation, voicing, shaping, accent, half-pedal: `{kind, met, judged}`, with "not measured" kept (flat velocity, no note-off) | no | `techniqueMeasureFor` (`Scoring.ts:541`), computed for the sheet and then dropped |
| pedal, rolled chords, lenient chords, loops | as measured | no | `SessionScore` |
| duration, time, id | — | yes (`durationMs`, `at`, auto-increment `id`, which evidence cites) | — |

**What stays out.** The raw notes with velocities are not needed for the truth rule. Keeping them
is L37's event-sourced replay, a later reader.

**Why per-step outcomes are included.** They are the smallest record that lets a miss be attributed
to the note where a demand is (the ledger note, the skip) rather than to its whole bar. Per-bar
figures can be derived from them. Per-bar alone is a smaller record, and it is the owner's choice
(§11, item 9). I recommend per-step because bar-level attribution would count a missed passing note
against the ledger-line skill whenever the two share a bar.

**Retention.** The `sessions` store is capped at 2,000 rows (`progressStore.ts:342`), on the stated
grounds that nothing reads old rows. The cap's comment reasons in sessions ("about six years at a
session a day"), but a row is one run. At ten runs a day the cap is reached in about two hundred
days. Once evidence and the "retained" state read observations, the cap deletes evidence (§11,
item 9).

**Loops.** A lap writes nothing today (repertoire trace Q4). A recorded lap would be an observation
with a `range`, so that looped work on bars 17–24 could count. That is a choice (§11, item 8).

---

## 4. Evidence from observations, and the rule against inference

> **The rule.** An observation is evidence about a skill only through a measurement named in the
> skill's definition, taken in that run, under the conditions the definition names, at the places
> where the notation actually played contains the demand the skill exercises. The item's demands
> say where to look. Only the observation says what was shown. A property of the item is never
> evidence, and neither is its level, its rung or its tags.

It has five parts, and each one is a place where the rule can be broken:

- **(a) Target.** The candidate skills are the item's (or the use's) `targetSkills`. Evidence is
  never inferred for a skill nobody declared. This is smaller and safer. Its cost is that a run
  gives nothing to an undeclared skill (§11, item 5).
- **(b) Channel.** The skill's observable (pitch, timing, velocity, pedal, continuity or
  identification) must have been measured in this observation. That means `tempoMeasured`,
  velocity that is not flat, CC64 present, and anything heard at all.
- **(c) Conditions.** The run must meet the skill's conditions for the standard claimed:
  - Keep tempo for anything about time;
  - unseen music and the guide off, for sight-reading at the full standard;
  - both hands played, for a coordination skill;
  - grace notes judged, for an ornament skill;
  - no demonstration during the run, for independent performance.
- **(d) Opportunity.** The demand the skill exercises must be in the bars and hands actually
  played, in the notation actually played: the phrase this seed generated, the slice of an
  excerpt, or the range of a loop.
- **(e) Attribution.** Only the per-step outcomes at the opportunity's steps count. The rest of the
  run is not evidence for this skill.

If any part fails, the function returns a stated refusal, such as `not-measured: timing`,
`condition: seen` or `no-opportunity`. The sheet can print a refusal as "not judged". A refusal is
never silence and never a zero.

### How the rule is enforced, not just written down

1. **Types.** An `Evidence` value can be constructed only from a `Measurement` taken out of an
   observation. Demand detectors return `Opportunity` values, and there is no path from
   `Opportunity` to `Evidence`. The evidence function has no parameter for the item's level, rung
   or tags.
2. **The vocabulary.** Every skill must declare an observable. A skill the engine cannot measure
   today (evenness of tone, fingering, hand shape) declares `observable: none` and can yield no
   evidence.
3. **A build gate.** `validate.py` refuses any rung whose requirement names a skill with
   `observable: none`, or names a condition no run can meet. This would have refused two things now
   in the tree: 1.5's `sight-read-5-first-attempt>=0.9`, which nothing enforces, and the technique
   measures that cannot stop a pass (`demandsTechniqueMeasure`, `Scoring.ts:849`).
4. **A property test over the vocabulary.** For every skill, three cases:
   - an observation with the skill's channel unmeasured yields no evidence, even when the demand is
     present;
   - an observation whose played range excludes the demand yields no evidence;
   - an observation that meets every part yields evidence whose count equals the opportunities
     measured.

   The test iterates over the vocabulary, so a new skill is covered by the act of adding it.

### The three items: which runs are evidence, and which are not

| item and skill (each run plays the hands the item asks for unless the row says otherwise) | Wait, guide on | Keep tempo, guide on | Keep tempo, guide off, first contact |
|---|---|---|---|
| five-finger: right notes in C position (pitch) | yes, practice standard (with time to find each note, keys marked) | yes, practice standard (keys marked) | yes, full standard |
| five-finger: steady quarters (timing) | refused: timing not measured | yes | yes |
| five-finger: even tone and time across the fingers | refused: no observable built yet (G8); from screen keys always refused (`velocityIsFlat`) | refused | refused |
| five-finger: one finger per key | `observable: none`: never | never | never |
| Anh. 113, two-voice use: two lines, one per hand (pitch at the bars where both hands move) | yes, practice standard; refused if only the right hand was played | yes | yes |
| Anh. 113: balance between the two lines | refused: the voicing measure covers chords only | refused | refused |
| Anh. 113: ornaments (if a use declared them) | refused: grace notes are never judged (`includeGraceNotes` false) | refused | refused |
| Anh. 113: triplets against the beat (if a use declared them) | refused: timing not measured | measured but not discriminating (see below), so refused under a precision condition | same |
| level-4 phrase: read unseen at tempo | not applicable (sight-reading forces Keep tempo) | practice standard: keys marked | full standard, first attempt, not heard. Its "without stopping" part is refused until continuity is measured. |
| level-4 phrase: ledger lines above and below | — | yes, at the steps with ledger notes; a seed with none gives `no-opportunity` | yes |
| level-4 phrase: chromatic passing note | — | yes, at the accidental's step | yes |

**The triplet case, as arithmetic.** It is worked from the written tempo and the engine's
constant, not measured.

- The tempo is ♩ = 96, which the converter invented. At the rung's 80 % floor, a beat lasts about
  781 ms.
- Triplet eighths therefore fall at 0, 260 and 521 ms.
- If the learner rushes them into two sixteenths and an eighth, the notes fall at 0, 195 and
  390 ms. The second note is about 65 ms early and the third about 130 ms early.
- Both are inside the default ±150 ms window (`engine/types.ts:248`), so the engine records hits.

The measurement exists, and it does not tell the right rhythm from the likely wrong one. A timing
skill's definition therefore has to state a precision. It refuses evidence when the window is wider
than the difference between the written rhythm and the error the skill is about.

### One performance, several skills: how the weighting is bounded

- **The weight is a count, never a fraction or a multiplier.** An evidence record carries `n` (the
  opportunities measured) and `right` (how many met the standard). Both are counted from the
  per-step outcomes at the opportunity's steps.
- **At most one evidence record per skill per observation.** One missed note may count against two
  skills only when both skills' opportunities include that step, such as a chromatic note on a
  ledger line. That is correct: it is one mistake, and each skill's definition names it.
- **Nothing is weighted by what the item demands.** Take an item that demands ten skills, played in
  Wait with the guide on. It yields pitch evidence at the practice standard for the skills whose
  channel is pitch, and refusals for the rest. More demands never produce more evidence.
- **Requirements count distinct observations, days and contexts.** One run can never meet a
  requirement that asks for two.

This replaces D2's "weighted by what the item actually demands", which the reviewer called
dangerous. Demands decide where to look, never how much it counts.

---

## 5. The mastery ladder

The ladder describes states of evidence per skill. One function derives it from the skill's
evidence list and today's date. The item statuses on `ProgressRow` (`new`, `started`, `passed`,
`mastered`) stay as the record of an item, and stop standing in for a skill.

| state | what moves a skill into it | what can never move it there |
|---|---|---|
| **introduced** | An exposure event: the learner read the lesson page for a rung targeting the skill, or heard the skill demonstrated. It is recorded as exposure, not as evidence. | A pass of anything. Today `LessonScreen.ts:737` turns a completed rung's concepts to `known`. Under this design that line records at most *introduced*. |
| **practised** | At least one evidence record, of either outcome. | Exposure alone. A Wait run for a timing skill, which is refused and so produces no record. |
| **familiar** | Supporting evidence at the practice standard, on at least one day. The practice standard is the skill's threshold with supports allowed: Wait for a pitch skill, a slowed tempo, hands separate, the guide on. | Self-report; placement; "I already know this". |
| **proficient** | Supporting evidence at the full standard on two different days, with the most recent full-standard attempt supporting. The full standard means the skill's full conditions: Keep tempo at or above the requirement's tempo for anything timed, the hands the skill needs, no demonstration during the run, and the guide off for reading skills. | Evidence from canonical items alone (§7). |
| **transfer demonstrated** | Supporting evidence at the full standard on first contact with material that differs from where proficiency was first shown, in source or in family: generated to repertoire, or one family to another. For reading skills the material is unseen by definition. For generated items, this means an item whose `role` is `transfer` for the skill. | Another seed of the same canonical item; a repeat. |
| **retained** | Supporting evidence at the full standard on the first attempt of a day, at least 21 days after the previous supporting evidence for that skill. The 21 comes from the review calendar's last step and is a starting hypothesis. | A warm-up repetition later in the same day. |
| **mastered** | Transfer demonstrated and retained, with no full-standard evidence against the skill in the most recent attempts. The recommendation is to look at the last two. | Any single run. |

**Moving down.** States are recomputed, never stored, so a state falls when the evidence does. Two
full-standard attempts against the skill in a row put a proficient skill back to familiar. Time
alone lowers nothing. A skill with no recent evidence is shown as "not shown recently". That
replaces "rusty 30 days after a lesson regardless of practice" (L16, `skillsStore.ts:12`).

**What "transfer" requires** is a different context. It is judged on the observation's context
fields: item identity, source class, family, role, and first contact.

**What "retained" requires** is time since the last supporting evidence, plus a first attempt of
the day.

**Placement and self-pass.** The recommendation is that these set *introduced* for the stages placed
past, and write a self-assessed evidence class. The ladder shows that class separately, and no
requirement accepts it. That extends Part G's existing self-assessment rule.

**Rung state.** A rung's requirement becomes a statement over this ladder and over observations, for
example "reading by interval proficient; two unseen phrases read at 90 % or more in Keep tempo, on
different days". The done, in-progress or open state the learner sees is derived from it. The
interim step is to judge observations against each rung's own criteria before skill state exists.
That step is labelled interim in the code and in the record, as D2 asks.

---

## 6. Where `level` goes

**Recommendation.** `level` becomes a derived, versioned scalar, `levelEstimate`, used for sorting
only. It is dropped from learner screens as a number.

**How it is derived:**

- For every item with a file (quarried, authored or generated), the build computes it with
  `difficulty.py`: `estimate(features(file), level-model vN)`, stamped with the model version.
- Imports get the port's estimate at import time (`app/src/score/difficulty.ts`, via
  `estimateImport.ts`).
- Items with no file (runtime drills) get none and sort by rung order.
- A person's judgement (a grade or a level, with who and when) replaces the estimate for sorting
  and joins the calibration set.

**What it is not.** It is never written by hand, never used as an address, never compared with a
stage number, and never read as ability.

**Before its number is trusted even for sorting,** the model's blind spots (tuplets, grace notes,
ornaments: R3) are fixed. Today it inverts the order of Anh. 113 and the Petzold. For generated
four-bar exercises the number is dominated by length (the repertoire trace's caveat), which is one
more reason it stays a sort key.

### Every reader of `level` today, and what it reads instead

Scope: the repertoire trace's Q1 table, plus two greps: `\.level\b` over non-test
`app/src/**/*.ts`, and `["level"]` / `get("level")` over `tools/content/*.py`. `params.level`,
`micSource.level` and engine-internal uses were excluded. That is a search, not a proof: a reader
that reaches the field another way is not in this list.

| # | reader | what it does with `level` today | what it reads instead | wave |
|---|---|---|---|---|
| 1 | `session.ts:256` | Uses the stage number as the learner's level, feeding six fallbacks: `:270` technique, `:292` review, `:315` new, `:332` repertoire, `:351` jam, `:374` sight-reading. | Skill state (needs against evidence) and L14's search order. Interim: `levelEstimate` against the rung's own option range, labelled interim, and never against the stage number. | C |
| 2 | `session.ts:472–475` `swapOptions` | Offers items within ±1 of the source's level. | A shared target skill, then demand overlap. `levelEstimate` only as a tie-break. | C |
| 3 | `selectors.ts:300–305` `alternativesFor` tier 3 | Offers items within ±0.5 that share a concept tag. Uses `levelConfidence` (`:264`) as the tie-break. | Shared `targetSkills` (validated, so `repertoire` is no longer one), then demand overlap. `levelConfidence` removed. | C |
| 4 | `TodayScreen.ts:382–383` daily read | Picks the hardest reading row with `item.level <= stageNumber`. | The reading skill state. This is C's first reader. | C |
| 5 | `levelLabel` (`widgets.ts:357`), shown on Lesson `:213`, Library `:644`, `:703`, `:923`, Skills `:276`, Today `:254`, `:340`, `:419`, Shelf `:485` | Prints "≈ L5.2". | The two or three demands a learner can act on ("triplets, a trill, left hand in eighths"), and the rung for a curriculum item. No number. | E (the demands must exist first) |
| 6 | `LibraryScreen.ts:108`, `:130`, `:738`, `:794` | Filters and sorts by level; the re-level control defaults to 5. | Sort by `levelEstimate`. Filter in stage words. Re-level records a judgement. | E |
| 7 | `SkillsScreen.ts:100`, `ProgressScreen.ts:559` | Sorts by level. | `levelEstimate`, for sorting only. | E |
| 8 | `FolderScreen.ts:655` ("level 5.7 est."), `:1104` via `rungForLevel` (`rungFor.ts:37–54`) | Prints the CSV proxy and reads `5.23` as unit `5.2`. | Label it the archive's estimate, or replace it with the port's estimate once the file is opened. Suggest a rung by needs-versus-taught once demands can be measured on the file. | E |
| 9 | `folderLibrary.ts:2260`; `importStore.ts:525` | Sets an added import's level to the CSV proxy, or defaults it to 5. | The port's estimate at import. | E |
| 10 | `levelOverrides.ts:57`, `:77` | Replaces the level and promotes the item to `judged`. | A device-local judgement, used for sorting and recorded as such. Never an address, never evidence. | E |
| 11 | `assignSheet.ts:136`, `:205`; `ShelfScreen.ts:130` (and `:139` per the trace) | Takes a typed level; a paper piece takes the rung band's floor as its level. | Judgement input. A paper piece's address is its rung. | E |
| 12 | `validate.py:148`, `:168` | Reports counts by `int(level)`. | By the rung's stage. | E |
| 13 | `validate.py:450`, `:525` | Checks core reach and band membership, and runs the `levelBand` gate. | The needs-versus-taught gate. | E |
| 14 | `candidates.py:122–247` | Filters and sorts by level and band. | Demands and needs against what the rung has taught. `levelEstimate` only to sort. | E |
| 15 | `ladder_report.py:37–169`; `rung_audit.py:129` | Computes bands and band spans. | A derived display, or demands per rung. | E |
| 16 | `fit_level_model.py:65` | Uses judged levels as calibration targets. | Unchanged: judgements stay the calibration set. | — |
| 17 | writers: importers, `author.py` headers, `catalog_entry` (`generate_exercises.py:692`), `difficulty.py` | Write `level`. | People write judgements; the model writes the estimate. Generators stop writing a level. | D, E |

The nine sight-reading rows' `drill.params.level` is not `item.level`. It is the generator's recipe
index. Renaming it `recipe.level` stops any reader mistaking it for difficulty or ability (S5).

### What happens to the rest

- **`levelSource`** is replaced by the estimate's provenance: `{from: 'model', version}` or
  `{from: 'judgement', by, at}`. Generators never write `judged` (G6). `levelConfidence` is removed.
- **`abrsmGradeApprox` on items** is deleted: it has no reader in `app/src` (trace Q1, two searches).
  A person's grade is recorded as a judgement and converted into the calibration set by `02`'s
  stated grade map. The stage-level `abrsmGradeApprox` string describes a stage and stays.
- **`levelBand`** stops being authored or used as a build gate; the needs-versus-taught gate
  replaces it. If kept at all, it is generated for the ladder report. `02` promised to print it; the
  recommendation is to print demands instead.
- **`levelOverrides`** stay as device-local judgement for sorting, as in row 10.
- **The quarry band** is a queueing tool inside the quarry. Rename it (`queueBand`) and keep it out
  of the files the catalog reads.
- **The folder proxy** is labelled as the archive's estimate, or superseded by the port once the
  file is opened.

---

## 7. Generated items

**How a family declares `targetSkills`.** Each family declares its skills once, in a data table in
the generator. It is not typed per item. A family may declare several skills, with one primary. The
build validates them against the skill vocabulary, and a rung option may narrow them.

**How its `demands` are measured, not declared.** The build runs the demand detectors over each
generated MusicXML, exactly as over a quarried file. The generator's parameters (`maxInterval: 3`)
become *constraints*, checked against that measurement:

- G3: the target is present;
- G4: nothing unintended is.

A parameter is never a declared demand. For the runtime generator (sight-reading), the app measures
each phrase with the same detector ids.

`sightReadingPromises.test.ts` already holds the seed of all three tables this needs:

- **About a dozen detectors:** `hasEighth`, `hasTriplet`, `hasTie`, `hasDottedQuarter`,
  `hasSixteenth`, `hasSyncopation`, `hasChromatic`, `range`, `bothHands`, `walkingBass`,
  `patternedLeftHand`, `scaleSteps`.
- **A concept-to-check table:** `CLAIMED_BY_CONCEPT`.
- **A demand-to-taught-at table:** in `unintended()`. Eighths are taught at 2.2; ties and dotted
  quarters at 2.4; a key signature at 3.1; syncopation, triplets and compound metre at 4.5.

Lifting these out of a test and into `app/src` is the first build step (§10, C2).

**Canonical, variable, transfer as a field.** `role` is a field on the item, relative to its primary
target skill:

- **canonical:** the same notes every time. A lesson names it. It is used to teach and demonstrate.
- **variable:** the same constraints with a new realisation. It is used for acquisition.
- **transfer:** a different surface for the same skill: another position, key or source. It is used
  to test.

The ladder reads `role`. A canonical item can take a skill to familiar, but never to proficient on
its own. Transfer needs an item with role `transfer`, or first contact with a repertoire piece (§5).
For a fixed file, first contact is itself read from the observations: once seen, any item is
practice material.

### Worked through: interval reading

The family is `make_interval_reading` (`generate_exercises.py:1629`), 16 items, on rung 1.5.

**Today:**

- `level` is the default argument `1.5`, which is also the rung id. `levelSource` is `"judged"`.
- Its concepts are `steps`, `skips`, `interval-reading` and `C-position`. All four are in the
  vocabulary.
- `params.maxInterval: 3` is written and never read.
- Each item is deterministic per seed, so that a lesson can name one.
- The first note carries a finger number, and the hand stays in a fixed C position.
- Every melody starts on D or E (trace Q5, read from code; only seed 01 was dumped).

**The family table:**

```json
{
  "family": "interval-reading",
  "targetSkills": { "primary": "reading.skips-by-interval" },
  "constraints": { "maxInterval": "3rd", "position": "fixed", "hands": "one" },
  "presence": [ { "demand": "interval.3rd", "min": 3 }, { "demand": "interval.2nd", "min": 2 } ],
  "absence": [ "interval.4th-or-wider", "eighths-or-shorter", "key-signature" ],
  "role": { "named-by-a-lesson": "canonical", "otherwise": "variable" }
}
```

Here `reading.skips-by-interval` means reading a second and a third by their shape on the staff,
not by naming each note. The id is a sketch; how skills are named is the owner's choice (§11,
item 1).

**Demands measured on seed 01**, from the trace's dump:

- treble clef, right hand, C4–G4;
- eight intervals: two seconds, five thirds and one unison;
- halves and quarters, in 4/4, over four bars;
- a finger number on the first note only.

Presence passes (five thirds against a minimum of three; two seconds against two), and absence
passes. `needsSkills` is derived as C position (1.1) and half notes (1.2), both taught by 1.5.

**What counts as evidence:**

- **IR 01 in Wait, guide on:** pitch at the thirds' steps supports the practice standard. It can
  take the skill to *familiar* at most, because the item is canonical and the run was guided.
- **First contact with IR 07 in Keep tempo, guide off:** full standard. It counts toward
  *proficient*.
- **A first attempt on sight-reading row 1**, which on 1.5 now writes skips: the same skill, from a
  different family that is unseen by construction. It counts as *transfer* only if the owner
  accepts another generator family as a different context (§11, item 5).
- **Real transfer** means the same interval shapes from other starting notes and positions, which
  is what the trace's teacher asked for. This family cannot produce that material today (G7).

The design makes that gap visible: on generated C-position material alone, the skill can never
reach *transfer demonstrated*, and the Skills screen would say so.

**What the row becomes.** Four fields are added:

- `targetSkills`, from the family table;
- `demands`, measured;
- `role`;
- `levelEstimate`, from the file's features, for sorting.

`drill.params` stays as `recipe`. The tags `steps`, `skips` and `C-position` leave `concepts`:
they are demands, and the detectors find them.

**Five-finger, for contrast.** The primary skill is `technique.even-five-finger`, whose observable
is the regularity of velocity and timing. That observable is not built, so the skill has no evidence
until G8 builds it. The secondary skill is position in C, observed through pitch. The sheet should
say that evenness was not judged.

---

## 8. The excerpt

As D5 defines it, the excerpt is an item with fields only. Mining excerpts automatically is R7 and
is not designed here.

```json
{
  "id": "excerpt.classical.bach-menuet-bwv-anh-113.b17-24",
  "type": "excerpt",
  "excerptOf": "song.classical.bach-menuet-bwv-anh-113.pdmx",
  "range": { "from": 17, "to": 24, "pass": 1 },
  "leadIn": { "bars": 1, "judged": false },
  "demands": "measured on the slice",
  "needsSkills": "derived from the slice's demands",
  "targetSkills": ["texture.two-voices"],
  "hands": "both",
  "context": {
    "keyArea": "D minor, the relative minor",
    "formPosition": "second half, first phrase",
    "startsOnPhrase": true,
    "endsOnCadence": true,
    "judgedBy": "person"
  },
  "cutFor": { "skill": "texture.two-voices", "rung": "classical.3",
              "reason": "the lesson's own point, inside what Stage 3 has taught" },
  "levelEstimate": "from the slice's features, with the short-length caveat",
  "provenance": { "by": "…", "at": "…" }
}
```

**Its fields:**

- **Range.** In printed bars, as `teaching.sections` already counts them (`curriculum/types.ts`).
  `pass` says which time through a repeat. The engine maps steps to printed bars through
  `sourceMeasureIndex` (`engine/types.ts:280`).
- **Demands.** Measured on the slice, never inherited. The repertoire trace's three cuts show why:
  on the whole-piece number, the hardest cut (bars 1–4) ranked easiest.
- **Context and reason.** These are what make an excerpt a learning experience and not a smaller
  piece. An excerpt without `cutFor` and `context` is refused, following D5's rule that
  `pieceId + startBar + endBar` alone is refused.
- **Phrase and cadence.** Whether the slice starts on a phrase and ends on a cadence is a person's
  judgement at cut time, marked as such. No cadence detector exists.
- **Lead-in.** A bar of lead-in is shown as context and not judged, so the learner is not dropped
  mid-phrase.

**Its relation to the parent.**

- An observation of the excerpt stores the excerpt id, which resolves to the parent and the range.
- The evidence function finds opportunities on the parent's notation within that range. So evidence
  from the excerpt is, automatically, evidence about the parent's skills over those bars.
- An excerpt run never sets the parent's item status. The parent can still show "bars 17–24 secure"
  from those observations.
- The excerpt has its own progress row, because it is an item.
- A rung lists it by id, like any other item.
- `variantOf` is not reused for it. That field means a simple or full edition, and it has no reader
  in `app/src` (repertoire trace Q4).

A `teaching.sections` entry and a loop are practice tools over the same ranges. A section becomes an
excerpt by gaining the fields above.

---

## 9. Genre and style

- **`genre` and style tags are descriptive metadata.** They serve display, the Library's filters,
  and the identity and exposure model (Wave G).
- **They are never:**
  - a demand;
  - a skill dimension;
  - an input to difficulty;
  - a reason to select by level.
- **The PDMX CSV's `genres` and `tags` are not evidence of style.** This is the standing constraint
  in the plan and in `00` §1a.
- **Today's generated rows misuse the field.** Every generated exercise carries
  `genre: ["technique"]`, the reading items included, and every drill carries `["drill"]`
  (`catalog_entry`, `generate_exercises.py:700`; built catalog). These are types, not genres, and
  they should go.

A style is three things in this vocabulary, and a tag is none of them:

1. **A style profile for generators.** A named set of constraints over demands, living with the
   recipes in Wave D (G14, G15, I9). It covers:
   - rhythmic vocabulary, such as the bossa's two-bar figure or swung eighths;
   - harmonic vocabulary: which progressions;
   - texture patterns;
   - phrase and cadence conventions;
   - articulation.

   `CLAVE_PATTERNS` and `COMPING_PATTERNS` already share one list object (`02` Part E2), which is a
   small style profile in code.
2. **A style skill in the skill vocabulary,** wherever there is an ability to perform. Today's
   concept `bossa-nova` is defined as "comping the syncopated Brazilian pattern against a steady
   bass". That is a skill, and its observable is timing against the pattern.
3. **A style demand,** which a detector can find: a clave figure, a swing marking, a stride leap.

So `bossa-nova` splits three ways:

- a genre tag, which is descriptive;
- a skill, `style.comp-bossa-pattern`, which is pedagogical and observed through timing;
- a demand, `rhythm.bossa-figure`, which is measured.

A generated "Latin exercise" is Latin only in the demand sense, until someone hears it (G32). The
style of a quarried piece is read from its demands or from a person, never from the CSV.

---

## 10. Migration, in the smallest steps

The order follows the reviewer's sequence for sight-reading:

1. Can the generator produce what the curriculum says? B did the promises.
2. Can the app measure whether the learner did it? That is C1 to C3.
3. Only then can evidence change what comes next. That is C4 onward.

The AT-15 classes are preserve, revise, delete, replace and add. The file-level classes below are
proposals for C0b to confirm or correct.

**C1. Observations stored.**

- **What:** Extend `SessionRow` and `RunResult` with §3's header and measures: per-step outcomes,
  the pitch definition, early notes, per-note timing marked measured or not, hands, what the keys
  showed, grace notes, input, the opening context, the range, the definitions version and the
  technique measures. Stop filling `lessonId` from the first listing rung when nothing opened the
  screen.
- **Consumers:** the Progress history (L41: it prints "88 % at 70 %" for a Wait run and can read
  `tempoMeasured`) and backup. No selector reads the new fields yet.
- **Obsolete tests:**
  - `sessionRetention.test.ts` "keeps more than any screen reads, so the bound is invisible":
    revise. The premise breaks as soon as observations are evidence.
  - `scoreSummaryTruth` "opened from nowhere, the first rung listing it still judges it": revise.
    A run from nowhere has no rung and is held to Part G's defaults.
  - `recordTruth` session-row cases: revise, for the new row shape.
- **Proof:** a new `observationTruth` unit test on constructed runs. A Wait run stores timing as not
  measured, with no deltas. A Keep tempo run stores a delta per matched note and marks early notes.
  The per-step array holds every step, not the worst five bars. A right-hand run stores `R`. A run
  with the guide on stores it. Grace notes off is stored. Each new field's case must fail on today's
  code.

**C2. Vocabulary v0 and the detector module.**

- **What:** Split `concepts.json` into:
  - skills, each with kind, opportunity, observable and standards;
  - demands, each with a detector id and `copedWithBy`;
  - app features and style tags, kept apart from both.

  v0 holds only what the sight-reading rows and their rungs promise. Move the detectors,
  `CLAIMED_BY_CONCEPT` and `unintended()` out of `sightReadingPromises.test.ts` into one module in
  `app/src`.
- **Consumers:** the promises test, and C3.
- **Obsolete tests:** the helper code inside `sightReadingPromises.test.ts` is replaced; it becomes
  the module's own tests. Its assertions stay.
- **Proof:** a detector test per demand on hand-made phrases (present, absent, boundary), and
  `validate.py` refusing a skill that has no observable.

**C3. The evidence function.**

- **What:** the pure function, its refusals, and the property test over the vocabulary (§4).
- **Consumers:** the sheet (a "not judged: timing" line where today it omits the line), and C4.
- **Obsolete tests:** none.
- **Proof:** the property test over every v0 skill, plus four constructed observations that must
  yield nothing:
  - a Wait run, for a timing skill;
  - a seen phrase, for sight-reading;
  - a right-hand run, for a two-hand skill;
  - a phrase with no ledger note, for the ledger skill.

  These are the first four assertions of backlog row Q6.

**C4. The first reader: sight-reading constraints from the reading skill state (S4).**

- **What:** the daily read and the session's reading slot choose the recipe from the reading
  skills' ladder states, changing one dimension at a time. They stop using
  `item.level <= stageNumber`.
- **Consumers:** Today, and the session builder.
- **Obsolete tests:**
  - `lessonClaimsAboutApp` "the daily read is the right-hand level-2 phrase at Stage 3 and the
    two-hand one at Stage 4" (`:1426`): delete. It re-implements the stage rule.
  - `sightReadingSlot.test.ts`: revise. The stage rule becomes the evidence rule, and the Stage 1
    assertions are preserved as a floor.
- **Proof:** constructed learner states: one that has never read, one that misread skips on two
  days, one proficient on eighths. Each gets a different next recipe, and each recipe differs from
  the learner's last one in exactly one dimension.

**C5. Rung state derived (interim, and labelled so).**

- **What:** rung completion computed from observations against the opening rung's own criteria.
  Each `mastery.custom` rule becomes a predicate or is removed. The requirement is restated over
  the ladder once skill state exists.
- **Consumers:** `nextRecommended`, Plan, Today.
- **Obsolete tests:**
  - `curriculumSelectors.test.ts`, the `lessonComplete` cases: replace. They test a count over item
    flags.
  - `lessonCompletePerf.test.ts`: revise.
  - `rungMastery.test.ts` "a run judged against its rung": preserve.
  - `session.test.ts`, `nextRecommended`: revise.
- **Proof:** a pass of the Petzold at 3.4 no longer completes 4.4, 4.6 or 4.7 (the repertoire
  trace's case), and 1.5 no longer completes on two ear drills.

**C6. The in-rung pick and the swap sheet, which are the second and third readers.**

- **What:** both read skill state. `levelConfidence` is removed.
- **Obsolete tests:**
  - `levelSource.test.ts` "prefers a judged level over an estimated one": delete.
  - `curriculumSelectors.test.ts` "falls back to items at the same level sharing a concept":
    replace.
  - `session.test.ts`, the positional `buildSession` cases: revise.
- **Proof:** T36a's constructed states. A learner at 60 % and a learner who has never played get
  different cards. A reading melody already passed is not offered as new.

**C7. The skills store replaced by the derived state.**

- **What:** the lesson page records *introduced* and nothing more.
- **Obsolete tests:** in `skillsFromPractice.test.ts`, "marks every concept it teaches as known" and
  the rusty-at-thirty-days case are replaced. Exposure is not knowledge, and rust is not the time
  since a page was drawn.
- **Proof:** reading a lesson page sets *introduced* and nothing above it. A skill whose last
  evidence is 40 days old shows "not shown recently" and keeps its state.

**D. Generators:**

- a `targetSkills` table per family;
- Python detectors over the generated files, with an agreement test against the app's detectors on
  shared fixtures;
- presence and absence checks per family (G3, G4, AT-4);
- `role` on items;
- generators stop writing `level` and `levelSource: judged` (G6);
- item concept tags split into skills, demands and nothing (G12; 318 of 514 distinct tags are
  outside the vocabulary today).

**Obsolete tests:** those pinning generated levels by stage (backlog Q3's class). C0b should list
them; the candidates are `drillFromCatalog` and the content tests under `tools/content/tests`.

**Proof:** for each family, over many seeds, the target demand is present and the named absences are
absent. The interval-reading family fails its presence check on any seed with fewer than three
thirds.

**E. Repertoire:**

- catalog `demands` for quarried pieces, with detectors extended to tuplets, grace notes and
  ornaments (R2, R3);
- `levelEstimate` derived and versioned (R1), and the inert numbers removed (R4);
- the needs-versus-taught gate in place of bands (R8);
- the excerpt item, on one rung (R5).

**Obsolete tests:**

- `validate.py`'s band and reach tests;
- `rungFor.test.ts`: revise, so that rungs are suggested by needs;
- `levelSource.test.ts` `levelLabel`: replace with the demands line;
- `levelOverrides.test.ts` "marks the item judged": revise.

**Proof:** the gate refuses Anh. 113 whole on `classical.3` and accepts the excerpt of bars 17–24.
After the refit, the model orders Anh. 113 above the Petzold.

**F. Before lessons are rewritten,** four things must be in place:

1. Skill ids stable enough that `concept` will not be renamed out from under the prose (C2 and D).
2. Rung requirements as predicates, so that success criteria can point at them (C5).
3. Roles on items, so that guided, independent and transfer practice name real material (D).
4. The error signatures the engine can detect, so that no line after a miss is a guess (C1 and C3).

**Obsolete tests:** the lesson claim tests that grep prose for pass lines. C0b should list them.

**Proof:** tests that each plan's `successCriteria` resolves to its rung's requirement, that
`transfer` names items with role `transfer`, and that every `commonMisconceptions` signature can be
detected (backlog Q9).

---

## 11. What stays a choice

Each choice below gives options, a recommendation, and what the choice changes. The first four are
the brief's.

1. **The dimensions' names.** This design has no learner dimensions. What needs naming is:
   - the skill kinds (reading, rhythm, technique, coordination, ear, knowledge, continuity,
     expression, style), which decide the shape of a skill's criterion (L24);
   - the demand families used to group the "what makes it hard" line (reading, rhythm, range and
     leaps, texture and coordination, harmony, physical, ornament): the diagnosis's seven, plus
     ornament;
   - the grain of the skills.

   *Recommendation:* the lists above. Grow the skills from what the first reader needs. A skill
   exists only once it has an observable and a sentence a teacher would say. Keeping today's
   concept ids as skill ids where they read as abilities, instead of the `kind.name` form sketched
   here, would mean less churn. That is the owner's call.
2. **Whether a scalar is shown.** Options: "≈ L5.2" as now; stage words; or no number, only demands
   and the rung. *Recommendation:* no number on learner screens. Show the demands and the rung. The
   Library sorts by the estimate silently and filters in stage words. This changes five screens
   (§6, row 5).
3. **Whether a person's grade remains an input.** *Recommendation:* yes, as a judgement that
   overrides the estimate for sorting and as calibration data. Never as an address, and never as
   evidence about the learner.
4. **How visible adaptation is.** *Recommendation:* an item chosen by evidence says why, in one line
   drawn from that evidence ("you misread two of five skips on Tuesday; this phrase has six"). An
   item not chosen by evidence claims no reason. Shuffle and Swap stay as the override. The Skills
   screen shows each skill's ladder state with the runs behind it, and no number.
5. **Evidence for skills nobody declared.** Options: declared targets only, which is this design; or
   any skill whose opportunity occurred. Whether a different generator family counts as a
   "different context" for transfer belongs to the same choice. *Recommendation:* declared only,
   for now. Accept a different family as a different context only when its surface also differs,
   meaning position, key or source, not just the seed.
6. **The runs the rules now refuse to record** (a heard sight-read, a repeat, a demonstrated
   performance). Options: record them flagged, or do not record them, which is what T40 and Part G
   do now. *Recommendation:* record them flagged. Evidence of the notes is honest, and the ladder
   already keeps them out of sight-reading and performance evidence.
7. **The key guide in reading runs.** Options: keep the default and treat guided pitch as practice
   standard only; or turn the guide off for sight-reading drills. *Recommendation:* off for
   sight-reading drills, whose whole claim is reading, and recorded either way. This is pedagogy,
   so the choice is the owner's.
8. **Laps as observations.** *Recommendation:* record laps played at or above the pass tempo, with
   their range. Do not record every lap.
9. **Storage.** Options: per-step outcomes, which is recommended, or per bar only. Separately, the
   2,000-row cap. *Recommendation:* raise or remove the cap for measured runs, and compact old
   per-step arrays to per-bar after the retention window.
10. **The word for the item standard.** Part G's item `master` and the ladder's `mastered` are
    different claims. *Recommendation:* keep the stored value, and change the item's word on
    screen, so that "mastered" belongs to skills.
11. **The retention interval, and how many recent attempts `mastered` looks at.** 21 days and two,
    as starting hypotheses.
12. **Two detector implementations** (Python for files; TypeScript for runtime phrases and imports)
    with an agreement test, or one implementation run in both places. *Recommendation:* two, with
    the agreement test, as the level model has now. The cost is the one-fact-in-two-places risk
    this repository keeps paying, and it should be said out loud.

---

## Adjacent findings, classified

These are not part of the design. They are recorded for the backlog. The first two are not in it:
greps of the backlog, the diagnosis and the four traces for `keysGuide`, "key guide", "next key" and
"lit key" found nothing, and grace notes appear there only as a level-model and converter gap.

- **P1. The keyboard strip marks the next key and its finger by default during every Score-screen
  run, sight-reading included.**
  - Defaults: `settingsStore.ts:150–151`.
  - `ScoreScreen.ts:3970` passes the setting through, and `:3742` hides the strip only when
    `keys` is `off`.
  - Two searches found no override: `guide: 'off'` or `keysGuide: 'off'` literals across non-test
    `app/src`, and every `stripOptions` site in `ScoreScreen.ts`.
  - `04` and `05`, grepped for the guide, name no sight-reading exception.
  - Consequence: right notes under the guide are not evidence of reading. This bears on what the
    daily read and the 1.5 rung measure today.
  - Read from code; not seen on a screen.
- **P2. Grace notes are never judged on the Score screen** (see §3 for the scope of the search).
  An item whose point is ornaments cannot yield evidence of them. The lesson claims on
  `classical.4` should be checked against this in AT-1.
- **P2. The `sessions` cap counts runs, while its comment reasons in sessions**
  (`progressStore.ts:328–342`). At ten runs a day, the store forgets after about two hundred days.
  That is harmless while nothing reads old rows, and harmful once evidence does.
- **P2. The ±150 ms window accepts triplets rushed into two sixteenths and an eighth** at
  `classical.3`'s pass tempo on Anh. 113 (the arithmetic is in §4). This belongs with AT-11 and
  L39.
- **P3. `CLAIMING_CONCEPTS` in `validate.py:949` keys `minor-triad`, which is not a vocabulary id;
  the vocabulary has `minor-triads`.**
  - Searches: `concepts.json` for the id, `content/curriculum/*.json` for the string, and the built
    curriculum's rung concepts.
  - No effect today: the only rung carrying `minor-triads` (3.3) also carries the claiming concept
    `relative-minor`.
- **P2. `genre` carries types on generated items and drills** (§9). This falls under the G11 and I7
  rule.

---

## What this design did not check

- Nothing was heard, and no screen was seen. Nothing was run except read-only counts over the
  built JSON.
- The per-step outcome record is assumed to be recoverable from the engine's `notes` and miss maps,
  from reading their types. I did not trace the engine to confirm that every miss has a step index.
- How a trill is judged was not checked.
- Whether a lap's result reaches anything was taken from the repertoire trace (Q4) and not
  re-read.
- The storage cost of per-step arrays is reasoned from their shape, not measured.
- The test classes in §10 are proposals. C0b's inventory decides them.
- Counts marked as coming from the built catalog were made today on the built files:
  - 2,061 items;
  - 514 distinct item concept tags, 318 of them outside the vocabulary, carrying 3,427 of 7,114
    tag uses;
  - every rung concept is inside the vocabulary.

---

## Files read

**The documents the brief names:**

- `docs/prompts/tasks/C0a-vocabulary-design.md`
- `docs/prompts/operating-procedure.md`
- `docs/prompts/audit-2026-09-25-outside.md`, Parts 4 to 6
- `docs/prompts/diagnosis-2026-09-25.md`: the judgement, the five problems, the source-of-truth
  table, and D1 to D5
- `docs/prompts/backlog-2026-09-25.md`: the header, areas 2 to 6 and 8 to 11, including every row
  in this design's scope
- `docs/prompts/plan-2026-09-25.md`: the waves and status
- `docs/prompts/traces/2026-09-25-repertoire.md`: the trace, Q1 to Q5
- `docs/prompts/traces/2026-09-25-generated-exercise.md`: the trace, Q1, Q2, Q4, Q5, Q6 and Q7
- `docs/prompts/traces/2026-09-25-sight-reading.md`: stages 1 to 3, and questions 1 to 5
- `docs/prompts/audit-2026-09-25-outside-full.md`: N-76 §2–§7 and §33–§36; N-117 §B, §E, §F, §G,
  §K and §L; N-170 §2, §3, §8, §9 and §12; N-180 whole
- `docs/02-curriculum.md`: the introduction, Part A, Part E2 and Part G
- `docs/03-content-pipeline.md` §4
- `docs/prompts/tasks/T40-three-evidence-rules.md`
- `docs/prompts/tasks/C0b-test-inventory.md`, for its output name
- `docs/pending-review.md`: Entry 66's tests table, by grep

**Code:**

- `content/catalog.schema.json`
- `content/curriculum.schema.json`
- `content/curriculum/concepts.json`, by script
- `app/src/curriculum/types.ts`
- `app/src/data/db.ts`: the row types
- `app/src/data/progressStore.ts`: `RunResult`, `recordRun`, the cap
- `app/src/engine/Scoring.ts`: `buildScore`, `hotSpots`, `evaluateOutcome`, `measuresTempo`,
  `TechniqueMeasure`, `techniqueMeasureFor`, `demandsTechniqueMeasure`
- `app/src/engine/types.ts`: `SessionScore`, `HotSpot`, `RecordedNote`, `PreparedStep`,
  `ENGINE_DEFAULTS`
- `app/src/engine/sightReading.ts`: `LEVELS[4]`
- `app/src/score/difficulty.ts`: the header
- `app/src/curriculum/selectors.ts:255–315`
- `app/src/curriculum/rungFor.ts`
- `app/src/ui/widgets.ts`: `levelLabel`
- `app/src/ui/screens/LessonScreen.ts:718–740`
- `app/src/ui/screens/ScoreScreen.ts:3736–3760` and `:3955–3980`
- `app/src/score/ScoreSession.ts:205–225`
- `app/src/data/settingsStore.ts`: the defaults and the settings type
- `tools/content/difficulty.py`: `FEATURE_NAMES`, the header
- `tools/content/generate_exercises.py`: `catalog_entry`, `five_finger_level`, `make_five_finger`,
  `make_interval_reading`, `make_stride`, `make_rhythm`
- `tools/content/import_pdmx.py`: `concepts_for`
- `tools/content/validate.py:140–175`, `:922–965`

**Tests, for their names and their assumptions:**

- `app/tests/unit/sightReadingPromises.test.ts`, lines 1–372
- by grep for their test names: `levelSource`, `rungMastery`, `skillsFromPractice`,
  `curriculumSelectors`, `progressStore`, `recordTruth`, `lessonCompletePerf`, `sightReadingSlot`,
  `levelOverrides`, `rungFor`, `session`, `sessionRetention`, `progressAtScale`,
  `scoreSummaryTruth`, `lessonClaimsAboutApp`

**Greps, with the scope each claim above states:**

- `\.level\b` over non-test `app/src`
- `level` readers in `tools/content/*.py`
- `includeGraceNotes`, `transposeSemis`, `keysGuide`, `continuity`
