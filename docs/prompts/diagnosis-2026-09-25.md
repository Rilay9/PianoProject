# Diagnosis, 2026-09-25: how the learning system works today, where it breaks, and what to decide

Written by the orchestrator from the three read-only traces (`traces/2026-09-25-generated-
exercise.md`, `-repertoire.md`, `-sight-reading.md`), the window classification
(`-window-reds.md`), and its own reading of `session.ts`, `selectors.ts`, `Scoring.ts`,
`progressStore.ts`, `PracticeEngine.ts`, `ScoreScreen.ts` and `02` Part G. Every claim
below that decides something was checked by the orchestrator at the cited line, unless it
is marked *trace only*. Nothing was heard and no screen was seen; the traces ran the real
selection and generator functions in Node against the built content, and read the
summary sheet's strings from the code.

## The judgement, in five lines

1. **The app tells the learner things that are not true**, in the mode most learners use.
   The summary reports timing it never measured, a tempo that is the slider's setting, and
   "Mastered" after one run; sight-reading phrases cannot contain the keys, metres and
   skips their rungs promise; a pass and a mastery are recorded on a tempo nobody played.
   These are bugs, local, and go first, because *never teach wrong* outranks everything.
2. **A pass is a bit on an item, not evidence against a rung.** A run is judged by the
   first rung that lists the item and the pass then completes every rung that lists it,
   including rungs that ask more. Completion is a count over mixed lists, so the skill a
   rung names is never what the evidence shows.
3. **There is no learner model.** What comes next is decided by the first incomplete rung,
   an item index inside it, and a calendar. A learner who failed at 60 % and a learner who
   has never played get the same card; a passed reading melody comes back every day;
   nothing a learner does changes the next sight-reading phrase.
4. **Difficulty and skill are not data the app can act on.** `level` means two things (a
   curriculum address and a measured quantity), one piece carries seven numbers, the
   nineteen measured features never reach the catalog, the model cannot see tuplets or
   grace notes, and the target skill of every generated exercise lives only in prose.
5. **Content sits where a number put it, not where a teacher would.** A Stage 5 minuet is
   on a Stage 3 rung by a band widened to fit it; rung lists hold items the rung does not
   teach; and an excerpt cannot exist as a learning experience, so a hard piece's easy
   eight bars are unreachable.

The reviewer's question was whether performance produces evidence that changes the
learner model and therefore the next experience, and whether the answer differs by
content type. **It does not, and the answer is the same for a generated exercise, a
quarried piece and a sight-reading run: one bit flips, a pointer moves, a date is set.**

## The causal model

```
CONTENT SIDE                                      LEARNER SIDE
generator / quarry ─► measured or declared level ─► catalog row (level, free concept tags,
                      target skill in prose only    notation summary; features dropped)
                                   │
rung lists ids ─► nextRecommended: first incomplete rung ─► fillSlot: options[seed % n]
                                                          (else a level window around the STAGE NUMBER)
                                   │
Score screen: rung = first rung listing the id (not the one that opened it)
              mode = Wait when a piano is attached; sight-reading forces Tempo
                                   │
engine: pitch per step (Wait, no timing kept) or pitch in a ±150 ms slot (Tempo)
        it is told nothing about the target skill
                                   │
summary: numbers, weakest bars, buttons ──► DROPPED: hot spots, timing, every note played
                                   │
progress row: status + passedOn (+ best numbers nobody reads)
        ─► lessonComplete: a count of passes, credited on every rung listing the item
        ─► reviewQueue: calendar only (and it parses local dates as UTC)
        ─► the same card, or the next rung in file order
```

The model breaks at three joints, and every finding below sits on one of them:
**A. the target skill and the difficulty dimensions are not data** (content side);
**B. the evidence is one bit and a date** (learner side); **C. selection reads neither**
(the joint). A better difficulty number, or a multi-dimensional one, would change almost
nothing a learner is offered until B and C exist; and B and C are cheap to start, because
the run already measures what they need and throws it away.

## What became of the hypotheses

| | status | what was observed |
|---|---|---|
| H1 learner model = completion + best numbers | **supported, and worse** | even the best numbers are unread; only `status` and `passedOn` feed anything (T36a Q1, run in Node on constructed states) |
| H2 feedback scores without diagnosing | **supported, and worse** | it also reports what was not measured: a Wait-mode timing line, the slider as tempo, "Mastered" after one run (`ScoreScreen.ts` 2499–2588, `PracticeEngine.ts` 964/991/1308) |
| H3 several definitions of difficulty | **supported, sharpened** | two meanings of `level` (address vs quantity); thirteen definitions on one piece, three of them learner-facing, several inert; the features stop at `pdmx.json` (T36b Q1) |
| H4 fallbacks are blunt and become the curriculum | **contradicted as the main mechanism** | the fallbacks are level windows, but the wrong items in every constructed state came from the *first tier*: an index over a mixed rung list, and cross-rung credit (T36a §9) |
| H5 generators have no stated purpose or presence check | **half contradicted** | every family states its purpose in a docstring and in `02` Part E2; it never becomes a field, nothing checks the notation for it, and `maxInterval` is written and never read (T36a Q7) |
| H6 PDMX at piece level only | **supported, with a nuance** | a bar range is addressable (sections, `?loop=`, the engine loop) but never an experience with a level, concepts, a pass or progress; one excerpt exists by accident as a truncated upload (T36b Q4) |
| H7 lesson prose explains the app | **supported for 1.5, not 1.1** | 1.5 describes "the sight-reading generator" and promises a pass rule nothing checks; 1.1 is music throughout |
| H8 nothing judged by ear | **supported** | every "correct" in the record is notation, data or code |

**Not in any hypothesis, and found by the traces:** the untrue summary lines; the
sight-reading generator never receiving key, metre or tempo; a pass judged by the first
rung and credited on every rung; the review queue's UTC parse; key-blind five-finger
levels; the invented tempo printed as if written. The largest immediate problems were
outside the orchestrator's model going in.

## The five problems

### 1. P0 — The app reports things it did not measure, and passes on them

*Current implementation.* `evaluateOutcome` treats Wait and Tempo alike (`Scoring.ts:184`);
in Wait the "tempo" compared against the rung's floor is the slider
(`PracticeEngine.ts:1308`), and the summary prints it as "N % of written"
(`ScoreScreen.ts:2527`). Wait keeps no timing (`deltas` written only at 964 and 991, in the
Tempo path) yet the sheet prints "0 ms off the beat on average" whenever `score.timing`
exists (`:2580–2588`). The heading says *Mastered* after one qualifying run while the
store needs two pass dates (`progressStore.ts:143–144`); and the store grants *mastered*
on one eligible run plus any earlier pass, where Part G asks for the master standard twice.
The no-piano self-report prints "Recorded" and stores nothing (*trace only*). In Tempo,
a right note more than 150 ms early is counted as a wrong note and then a miss (*trace
only*). Sight-reading: `generateSightReadingFor` passes only level, hands, bars and seed
(`ScoreScreen.ts:158–170`), so every phrase is C major, 4/4, one tempo, and the rungs
that promise keys, 6/8 or skips (4.5, 1.5) cannot get them; levels 6–7 lose the triplet
bracket on a rest in most phrases (*trace only*, seeds 1–500). Five-finger patterns are
levelled by hands alone (`generate_exercises.py:887`), so twenty black-key patterns sit at
1.1 and the swap sheet on rung 1.1 offers A♭ major as equal to C position. 176 quarried
rows carry a tempo the converter invented, printed as a written mark (*trace only*). The
review queue parses a local day key as UTC (`progressStore.ts:497`), so an evening pass is
due for review the same evening in US zones.

*Why it matters.* The learner is told their timing was perfect when nobody listened, that
a piece is mastered when the app still calls it passed, that a phrase trains 6/8 when it
is in 4/4, and that a pass at "80 % tempo" was earned when the slider was at 80.

*Direction, now, all local, each with a test seen red:* show timing only when it was
measured; label or omit the slider tempo; head a first qualifying run "mastery run 1 of
2" and require two eligible runs; pass the self-report through; pass `fifths`, `timeSig`
and `bpm` from the drill's params and add a check that each rung's claimed features
appear in generated phrases; level five-finger by key as `scale_level` does; fix the
triplet bracket; print the invented tempo as suggested and read the tag; compare day keys
in the review queue.

*Decision needed:* one. **Does a Wait-mode run count as a pass?** Part G says a pass is in
Tempo mode. Recommendation: no; a Wait run is recorded as practice, never as a pass or a
mastery, and the sheet says so. This changes what a learner with a piano experiences on
every rung, so it is yours.

### 2. P1 — A pass is a bit on an item, not evidence against a rung's criteria

*Current implementation.* `lessonForItem` returns the first rung listing an item
(`selectors.ts:29–40`); the Score screen judges by it and ignores the rung that opened
the screen (`ScoreScreen.ts:2225–2231`; `fromRung` at `:219` is used only for Back).
`lessonComplete` counts `passed` item ids over the rung's lists (`selectors.ts:176–204`),
so one pass credits every rung listing the item: 53 of 181 multi-rung items have a later
rung asking more (*trace only*, counted on the built curriculum). `mastery.custom` has two
readers, neither of which enforces a rule like `sight-read-5-first-attempt>=0.9`
(`selectors.ts:167`, `ScoreScreen.ts:2450`). Accuracy means clean steps in Wait and notes
hit in Tempo, with wrong notes free in Tempo, under one threshold.

*Why it matters.* The Petzold minuet opened from `classical.3` is held to 3.4's 85 %; that
pass completes `classical.3` (90 %), 4.4 (97 %), a 4.6 performance capstone and 4.7 (from
memory). Rung 1.5, the sight-reading habit, completes on two ear drills. One pass of the
hands-together five-finger pattern completes three how-to-practise rungs. Eight
definitions of "pass" exist across `02`, the rungs, the selectors, Settings, the lessons
and the sheet.

*Direction, the smallest model change:* a run stores what was measured (mode, accuracy by
its own definition, whether tempo was measured, the judging rung; `SessionRow` already
holds most of it) and rung completion is derived from stored runs against each rung's own
criteria, with an option carrying a *role* on its rung (reading, ear, song, technique) so
the rule can say "two reading passes in Tempo mode, first attempt". Judge by the rung that
opened the screen when there is one. Make Part G the single definition of pass.

*Decision needed:* **roles on rung options and predicate completion**, which changes what
finishes a rung for every learner. Recommendation: yes.

### 3. P1 — There is no learner model; selection is by index and stage number

*Current implementation.* `fillSlot` takes the learner's level from the stage number of
the first incomplete rung (`session.ts:256`) and picks inside a rung by `options[seed %
n]` (`:236`, `:260`, `:303`), filtering only today's used items. Nothing reads hot spots,
timing, misses or which concept failed; the run computes them for the sheet and drops
them. The sight-reading level is a constant on nine hand-written rows, chosen by stage;
the daily read is the hardest row at or under the stage, and Stage 1 sessions get no
sight-reading row at all because the only drill is level 1.5 (`:365`). Review is calendar
only.

*Why it matters.* Observed by running `buildSession` on constructed states: a learner at
60 % on two items gets the same card as one who has never played; a reading melody passed
on two days is offered again as *new*; a day-one learner on the right-hand rung is handed
the hands-together pattern because it is option index 2; a Stage 1 warm-up can be Hanon
at 4.4. A teacher would not accept the sight-reading regimen for six months: one row per
stage, one key, one metre, and nothing eased or stretched by how the last read went.

*Direction, in steps, each small:* (1) inside a rung, skip items already passed on it and
items above its level, and prefer the option whose role the rung still needs; (2) store
per-run evidence keyed to the item's target skill (per-bar misses, timing, the wrong pitch
against the written one, first attempt or not); (3) a per-concept skill state updated from
that evidence, read first by the sight-reading generator (move one dimension at a time:
key, then range, then rhythm) and by the in-rung pick, then by the swap sheet. Not an
adaptive-learning platform: three readers, added one at a time, each with a constructed
learner state as its test.

*Decision needed:* **the shape of adaptivity.** Recommendation: the three steps above, in
that order, with sight-reading as the first consumer because it is the one place the app
makes music on the spot.

### 4. P1 — Difficulty and skill are not data the app can act on

*Current implementation.* `level` is a curriculum address for generated items (`1.1`,
`1.5`, the rung id as a default argument) and a regression quantity for quarried ones,
on one axis; `levelSource: judged` is written on table-derived numbers. One quarried
minuet carries seven numbers (catalog 5.23; the current model 5.06; the folder browser's
proxy 5.7; quarry band 4; PDMX complexity; the rung's band; its stage), three of them
shown to a learner. The nineteen features are dropped at `import_pdmx.build_item`
(`build.py:366–371` says so); the model has no feature for tuplets or grace notes and so
ranks Anh. 113 (triplets, appoggiaturas, a trill, sixteenths) *below* the plainer Petzold.
`abrsmGradeApprox` has no reader in `app/src`. Item concept tags are free text
(`C-major`, `hands:right`) not validated against `concepts.json`, so a rung's concepts and
its options' concepts never meet; the swap sheet's "shared concept" tier matches on
`repertoire`, which every quarried item carries.

*Why it matters.* No selector can ask which hand, which rhythm or which reading demand
makes a piece hard, because nothing after the catalog boundary knows. The number that is
shown cannot be trusted where it matters most (rhythm and ornament), and the app cannot
say "easy to read, hard in the left hand".

*Direction.* One source of truth: a piece's measured features, extended with tuplets,
grace notes and ornaments, from which `level` is derived at build time by one versioned
model, with a person's judgement overriding and joining the calibration set; generated
items levelled the same way rather than declared. A machine-readable `targetSkill` on
generated items and validated concept tags on every item, so the rung, the summary and
the selector read one vocabulary. The inert definitions (`abrsmGradeApprox`, the quarry
band, the folder proxy's name) removed or renamed.

*Decision needed:* **which is the source of truth for level.** Recommendation: the
measured features plus judgement, with the model's blind spots fixed first.

### 5. P1/P2 — Content sits where a number put it, not where a teacher would

*Current implementation.* Every song was attached to a rung by level band on 2026-09-15
and the bands were widened to fit (*trace only*, from the placing commit and Entry 53).
Stage 3's ceiling is calibrated on four judged rows that are themselves admitted
exceptions to the reach rule. `validate.py`'s notation requirements check only chord
symbols, metre, mode and staff count, on rungs whose concepts claim them, and "one option
suffices". Rung lists hold items the rung does not teach (hands-together on the
right-hand rung; Hanon on the first practice rung; a riff on 1.5 that its lesson never
names). The rung finder says "right hand only" or "two voices, one per hand" and the stock
contradicts it. An excerpt cannot be an item: `level`, `concepts` and `file` are per item
with no bar range, `songOptions` is a list of ids, sections carry no level, and a looped
range writes no evidence.

*Why it matters.* A Stage 3 learner meets a piece that needs triplets (taught at 4.5),
ornaments (`classical.4`) and a trill (`classical.5`). Cut on paper, that piece's bars
17–24 teach the rung's own concept, two voices, inside what Stage 3 has taught; the model's
single number would have picked bars 1–4, the hardest to read, as the easiest.

*Direction.* A check of the concepts a piece *needs* (from the extended notation block)
against the concepts the ladder has *taught* before its rung, as a build gate that
replaces band-fitting; roles on rung options (problem 2) so a list cannot hold an
untaught item unnamed; and, as its own decision, an item that points at a file *and* a
bar range with its own level and concepts, whose progress counts toward the parent.

*Decision needed:* **the excerpt item.** Recommendation: yes, after problems 1–3, on one
rung first (`latin.4`, which has no music, or `classical.3` with the cuts above).

## The source-of-truth table, merged

| concept | source of truth today | major consumers | competing definitions |
|---|---|---|---|
| learner level | none; the stage number of the first incomplete rung (`session.ts:256`), moved by placement | every slot's fallback; the Today status line | rung position; the swapped item's level; skills rows (display only); "suits Stage N" written four ways (`session.ts`, `validate.py` reach, Entry 56's script) |
| difficulty | catalog `level`: declared for generated items, a regression for quarried, typed for judged | fallbacks, swap tiers, labels on five screens, `validate`, `candidates`, `rung_audit` | address vs quantity; the current model's re-reading; the folder proxy; the quarry band; `levelBand`; `levelOverrides`; the port (imports only); `abrsmGradeApprox` (no reader) |
| skill | rung `concepts` (validated vocabulary) | Skills screen; `markLessonLearnt` | item `concepts` (free tags, unvalidated); generator docstrings and `02` Part E2 (the real purpose); `drill.kind`; `tracks` |
| mastery | rung `mastery` via `masteryCriteriaFor`; master fixed at 97/100 | the sheet's heading, `evaluateOutcome`, `recordRun`, `lessonComplete` | eight definitions of pass (`02` A §5, `02` G, rung pair, `custom`, selectors, Settings, lesson prose, self-report); the sheet's *Mastered* vs the store's; Wait accuracy vs Tempo accuracy |
| performance evidence | `ProgressRow.status` + `passedOn` | `lessonComplete`, `nextRecommended`, `reviewQueue`, the repertoire slot | `SessionRow` detail, unread; hot spots and timing, unstored; the judging rung, stored and ignored; self-report, unstored; in Wait the tempo is the slider |
| repertoire level | as difficulty, plus the rung's `levelBand` and the finder's words | `validate`, `candidates`; the Shelf's default | band (the span of the options) vs finder ("Grade 1 to 2" = Stage 4–5) vs the stage's own words ("initial / grade 1") |
| curriculum stage | the stage file a rung lives in | `nextRecommended` → learner level | generated levels encode unit ids on the same axis; `rungForLevel` reads 5.23 as "Stage 5" for a piece on a Stage 3 rung |

## The window baseline (T35): not sound to build on

The three items, classified with the measurement behind each (`traces/2026-09-25-window-
reds.md`); the mechanism was read by the orchestrator at the cited lines.

- **R1, `score.layout` sideways 880 × 412, 1 and 2 bars the same ink: outdated spec, over
  a real fault.** Sideways the count yields by design and the row says so; at that stage
  no asked count changes the glass. The spec should assert that the drawn count rises with
  the asked count *or* the row states the yield. But the yield itself is over-priced (the
  shared mechanism below), the row's sentence is false ("would be too small" when two bars
  fit), and the row flips with history: a fresh page says 2 shown, one stepper press later
  the same stage says 1.
- **R2, `score.screen` Size + draws a smaller staff: implementation bug.** Size's 100 % is
  priced from a *prediction* (`base` in `chooseWindowShape`, `WindowRenderer.ts:1577–1593`)
  that sits below the scale actually drawn, so 110 % yields a bar *and* draws it smaller,
  and the same 110 % gives two different sizes depending on the path taken. Breaks `08` §9
  invariant 3 (zoom is monotonic) and the owner's rule 6. Not a test bug: the spec's
  reading fell by the same ratio as the renderer's own scale.
- **R3, `score.rotate`: 7 of 10 red, not because of `data-fit=size`.** Five reds assert a
  pre-T34 page width, two hold the greyed look-ahead row to the full width; both are
  outdated spec. Two reds are a renderer fault: the look-ahead row is priced into the
  window's width (fault B).

**The shared mechanism** (`WindowRenderer.ts:2371–2377`, `:1577`): the chooser prices every
bar at `naturalBar`, a running *maximum* of row-ink ÷ bars-in-row that never comes down
within one engraving zoom and includes the clef, key and time signature, so a one-bar row
inflates it for the rest of the session; `scaleFor` meanwhile sizes from the ink actually
drawn, so the chooser and the fit disagree. Every test helper steps down to one bar and
back, so the tests always run in the inflated state. Tablet sideways, Twinkle, 4 bars at
rest: the per-bar price rose by more than a third after the stepper passed through 1 bar
and the window was split into two rows each about a third of the width; after Play the
zoom changed, the price reset, and the same window became one row at nearly the full
width.

**Three more faults found on the way, all P0 or P1 by the owner's own rules:**
- **B, P0.** The greyed look-ahead row sets the window's scale (`fitSlots` hands it to
  `scaleFor`; the chooser granted it on height only). At rest it shrinks the window by
  about a tenth on one phone and a quarter on another; mid-run the frozen scale holds and
  the greyed row runs off the right edge (both tablet Nocturne 4-bar cells on the sheet).
- **C, P0, distortion.** Phone upright, Nocturne, 4 bars mid-run: a look-ahead slot
  wrapped onto two systems and bar 5 was justified across the whole row, while
  `data-stretch` still says `natural` because it records intent, not outcome. This is the
  one thing the owner said must never happen, and `score.window-rule` is blind to it.
- **D, P1, two definitions of "staff".** Every spec and the tour camera read the
  `.staffline` box, which includes notes, stems and fingerings and is about twice the
  five-line span; the renderer's own `pieceInk.staff` is the same. So the readability
  floor ("five lines with ten pixels between") is enforced at a little over half its
  stated value.
- **E, product, the owner's call.** Tablet sideways at 2 bars draws the window at maximum
  size with nothing ahead, on both pieces, while the staff is far above any floor. That
  is T34's rule 2 working as written and, to the reader's eye and mine, wrong: the second
  good (look-ahead) should win once the first (readability) is comfortably met.

**Direction for Wave B.** Price bars from what is drawn, not from a running maximum with
the opening in it; hold the Size target fixed per step and refuse any shape smaller than
the 100 % scale; take the window's scale from window rows only and decide B's remainder
by the owner's choice; make the five-line height the one meaning of "staff" and re-derive
the floor; teach `score.rotate` and `score.layout` the T34 promises; and add a
distortion check that reads outcome (drawn width against engraved width per bar), not
`data-stretch`. Each with a red line first.

*Decisions needed:* two, both product. **B:** when the greyed next row does not fit across
at the window's scale, drop it or let it run off the edge showing its opening?
Recommendation: drop it, and say "next bar below" in the row. **E:** on a wide stage where
readability is comfortably met, should the look-ahead beat the asked count? Recommendation:
yes.

## The decisions, separated: fact, design problem, proposal, and what stays a choice

Revised 2026-09-25 on the reviewer's instruction: the audit above is left as it is; this
section separates what the traces *establish* from what they *suggest* and from what only
the owner can decide. The target model throughout is

> performance → observations → evidence → skill state → curriculum decision

and not *performance → completion → rung state*. Where a proposal below is a step on the
way, it is called a step, and the thing it must not become is named.

### D1. What a Wait-mode run is evidence of

- **Fact (observed at the lines).** In Wait mode the engine keeps no timing (`deltas`
  written only in the Tempo path) and the "tempo" compared against the rung's floor is the
  slider's value (`PracticeEngine.ts:1308`); `evaluateOutcome` passes Wait and Tempo alike
  (`Scoring.ts:184`); Wait is the default with a piano attached; `02` Part G defines a pass
  in Tempo mode.
- **Design problem.** A pass today asserts two things, notes and tempo, and in the default
  mode the second was never observed. The record cannot tell a pass that was played in time
  from one that was not.
- **Proposal.** Not "Wait runs are not passes": that defines the problem away. Rather: a run
  stores what it *observed* (pitch accuracy under Wait's definition; nothing about tempo),
  and any criterion that demands a tempo cannot be met by observations that carry none. A
  Wait run is honest evidence of knowing the notes; it is no evidence of pulse. The sheet
  says which.
- **What stays a choice.** Whether a rung's requirement should include tempo at all for its
  first pass (Part G says yes; lesson 1.1 asks for Wait at 95 % *then* Tempo at 90 %, which
  is a two-stage requirement nobody built). Recommendation: keep Part G, and let a rung state
  a two-stage rule where its lesson already does.

### D2. What a pass is evidence *of*, and against *what*

- **Fact.** A run is judged by the first rung that lists the item, not the one that opened
  the screen (`selectors.ts:29–40`; `ScoreScreen.ts:2225–2231`, `fromRung` at `:219` used
  only for Back); the pass is a flag on the item and `lessonComplete` credits it on every
  rung listing the item (`selectors.ts:176–204`); 53 of 181 multi-rung items have a later
  rung that asks more (*trace only*); `mastery.custom` has two readers and neither enforces
  a rule (`selectors.ts:167`, `ScoreScreen.ts:2450`); Wait accuracy and Tempo accuracy are
  different quantities under one threshold.
- **Design problem.** The evidence is keyed to the item and to nothing else: not to the
  criteria it was judged against, not to the skill the run exercised, not to the context it
  was practised in. So it cannot be reused honestly (one run *can* be evidence for several
  skills) and cannot be refused honestly (a 3.4 pass should not finish 4.7 "from memory").
- **Proposal, in the target model's terms.** (1) *Observations*: a run writes what was
  measured, by its own definitions: mode, pitch accuracy and which definition, whether tempo
  was measured and at what, per-bar misses and wrongs, timing, first attempt or not, the
  item, and the context that opened it. `SessionRow` holds half of this already. (2)
  *Evidence*: derived from observations against the item's declared target skills (D4), so
  one performance yields evidence for each skill the item exercises, weighted by what the
  item actually demands. (3) *Skill state*: per concept, updated from evidence, with recency.
  (4) *Curriculum decision*: a rung's requirement is stated over skill evidence ("two unseen
  phrases read in Tempo mode at ≥ 90 %"; "this piece at ≥ 85 % with hands together"), and
  its state is *derived* from the skill state and the observations, never stored as a flag.
  The "roles on options" idea from the first draft is only the item's target-skill
  declaration seen from the rung's side; it is not a completion predicate over item flags,
  and the first draft's wording invited exactly that misreading.
- **A step, and what it must not become.** Storing observations and judging by the opening
  context can land first, without the skill model, because they are needed by every later
  step. Deriving rung state from stored observations against each rung's own criteria is
  also a step: better than the flag, but if it ships alone it is a disguised item-completion
  architecture and must be labelled as interim in the code and the record.
- **What stays a choice.** Is the rung that opened the screen the right source of intent, or
  should a run outside any rung (Library, import) still yield skill evidence? Recommendation:
  both, and they are not in tension once evidence is keyed to skills; the opening rung only
  sets which criteria the *sheet* reports against. Is rung state binary? Recommendation: the
  learner sees a rung as open, in progress or done, but the state underneath is graded
  evidence and stays so. What "pass" means per content type (repertoire, technique,
  sight-reading) is a pedagogy question: recommendation, one observation shape, and
  per-type requirements written in the rung.

### D3. Whether anything the learner does changes what comes next

- **Fact.** `fillSlot` takes the learner's level from the stage number of the first
  incomplete rung (`session.ts:256`) and picks inside a rung by index (`:236`, `:260`,
  `:303`); nothing reads hot spots, timing or misses; the sight-reading level is a constant
  per row; review is calendar-only. Observed by running `buildSession` on constructed
  states: a failing learner and a never-played learner get the same card.
- **Design problem.** There is no skill state to read, so selection reads position and
  chance. This is the consequence of D2's design problem, not a separate one.
- **Proposal.** Three readers of the skill state, added one at a time, each with a
  constructed learner state as its test: the in-rung pick (prefer the option whose skill
  evidence is weakest or missing; skip what is already evidenced on this rung), the
  sight-reading generator's constraints (move one dimension at a time from the reading
  skill state), and the swap sheet. Nothing else adapts. The calendar review stays, with its
  date bug fixed.
- **What stays a choice.** How visible adaptation is (does the learner see why an item was
  chosen; can they override). Recommendation: the reason line already exists on every row;
  make it true, and keep Shuffle and Swap as the override.

### D4. Which numbers mean what

- **Fact.** `level` is a curriculum address for generated items (declared from one
  parameter; the rung id as a default) and a regression quantity for quarried ones, on one
  axis; `levelSource: judged` is written on declared numbers; one quarried piece carries
  seven numbers, three shown to a learner; the nineteen features are dropped at the catalog
  boundary; the model has no feature for tuplets or grace notes and ranks Anh. 113 below the
  plainer Petzold; `abrsmGradeApprox` has no reader; item concept tags are free text not in
  the vocabulary; the swap sheet's "shared concept" tier matches on a tag every quarried item
  carries.
- **Design problem.** Seven different things are being asked of one field. The reviewer's
  list is the right one, and the traces show each is currently either collapsed into
  `level` or absent:

  | concept | what it is | where it lives today |
  |---|---|---|
  | material demand | what the notation asks, per dimension (reading, rhythm, range, leaps, texture, hand independence, physical) | the nineteen features, dropped; not measured for tuplets, graces, ornaments |
  | performance demand | what this *run* asked: tempo, hands, mode, unseen or not | partly in `SessionRow`; the tempo is the slider in Wait |
  | skill prerequisites | the concepts a piece needs before it is honest to offer | nowhere; `requires` checks four notation facts on some rungs |
  | skill practised | what the item is for | generator docstrings, `02` Part E2, lesson prose; never a field |
  | learner ability | skill state per concept | nowhere; the stage number stands in |
  | curriculum address | which rung, which stage | the rung itself, and again as `level`'s integer part |
  | mastery / evidence | what the observations support | a flag and a date |

- **Proposal.** Separate fields, each with one writer: `demands` (per-dimension, measured,
  extended with tuplets, graces, ornaments, simultaneity), `targetSkills` (declared by the
  generator or the author, validated against the vocabulary), `needs` (concept
  prerequisites, derived from `demands` where possible), and the rung as the only address.
  A single `level` may remain as a *derived, versioned* sort-and-display scalar with its
  derivation stated, or be dropped from the screens; it must not be written by hand, used
  as an address, or compared against the stage number as if it were ability. Generated
  items get their `demands` measured the same way as quarried ones.
- **What stays a choice.** Which dimensions (recommendation: start from the seven above and
  the features already computed); whether a scalar is shown at all (recommendation: show
  the two or three demands a learner can act on, "hard in the left hand", and keep the
  scalar for sorting); whether a person's grade remains an input (recommendation: yes, as
  judgement that overrides the derived scalar and joins the calibration set). **The schema
  is not approved by this document; it is proposed for review in its own brief.**

### D5. What an excerpt must be

- **Fact.** `level`, `concepts` and `file` are per item with no bar range; `songOptions`
  is a list of ids; `teaching.sections` carries a label and bars only; a looped range writes
  no evidence; one excerpt exists by accident as a truncated upload. Cut on paper, bars
  17–24 of Anh. 113 teach `classical.3`'s own concept within what Stage 3 has taught, and
  the single number would have ranked the hardest cut easiest.
- **Design problem.** A piece is the only unit of experience, so the honest early use of a
  hard piece is unreachable, and the only way round is a second file that forgets its
  parent.
- **Proposal, pedagogically not just technically.** An excerpt is an item that carries:
  its source piece and bar range; its own `demands`, measured on the slice (not inherited);
  its own `targetSkills`, `needs`, hands and texture; its musical context (key area, where
  it sits in the form, whether it begins and ends on phrase boundaries, and what precedes
  it, so the learner is not dropped mid-phrase); the reason it was cut (which skill, for
  which rung); and its own observations and evidence, which also count as evidence toward
  the parent piece's skills. `pieceId + startBar + endBar` alone is a smaller piece, and is
  refused.
- **What stays a choice.** Whether to build it, and on which rung first. Recommendation:
  yes, after D1–D3, on `classical.3` with the cuts the trace made (a rung that has a
  teacher's read already) rather than on an empty rung.

### D6 and D7. The window: what is bug, what is stale spec, what is a changed invariant

The classification stands per item; here is the mechanism and the measurement behind each
proposed invariant change, and what is *not* an invariant change.

- **R2 (implementation bug, no invariant change).** *Mechanism:* the chooser prices every
  bar at `naturalBar.width`, a running maximum per engraving zoom of row-ink ÷ bars-in-row
  (`WindowRenderer.ts:2371–2377`) that carries the row's clef, key and time signature and
  never comes down; the Size target is priced from that prediction (`:1577–1593`) while
  `scaleFor` sizes from the ink drawn. *Measurement:* at 1280 × 720 on Hot Cross Buns, 2
  bars: 100 % drew two bars; 110 % drew one bar at 0.93 of the 100 % scale; 120 % at 0.92;
  back to 110 % at 0.85, a different size for the same setting (probe run twice, identical).
  The spec's own reading fell by the same ratio, so not a test bug. *Fix:* price from what
  is drawn, hold the target per step, refuse any shape smaller than the 100 % scale. This
  restores `08` §9 invariant 3; it changes no invariant.
- **R1 (outdated spec over the same bug).** *Mechanism:* sideways the count yields by
  design, and the yield's room is priced at the inflated per-bar width. *Measurement:*
  `data-window-bars` was 1 for 1, 2, 3 and 4 asked at 880 × 412; a page never stepped said 2
  shown, and one stepper press later the same stage said 1. *Fix:* the spec asserts "count
  rises or the row states the yield"; the pricing fix above makes the yield honest; the row's
  sentence is corrected. No invariant change.
- **R3 (five reds outdated spec, two reds fault B).** *Measurement:* the five assert a
  pre-T34 page width; the two "ink fills 74 / 78 %" cells are the window row drawn at the
  scale the wider look-ahead bar set. Spec re-pointed; B fixed. No invariant change.
- **B (implementation bug, and one product line).** *Mechanism:* `fitSlots` hands the greyed
  row to `scaleFor`, whose width term is the widest box, while the chooser granted that row
  on height alone. *Measurement:* at 390 × 844 the scale equalled (stage width − margin) ÷
  the look-ahead row's width, about 8 % under the window's own fit; at 360 × 780 about a
  quarter under; mid-run the frozen scale held and the greyed row's ink was measured past the
  stage's right edge (tablet upright, Nocturne, 4 bars). `08` §9.7 already says the window is
  never shrunk for the look-ahead, so the fix (scale from window rows only) restores an
  invariant. **The choice (D6)** is only what to do with a next row that does not fit across
  at the window's scale: drop it, or draw it running off the edge showing its opening. The
  reviewer's caution applies: dropping it can leave a hole and can oscillate at the
  breakpoint. Recommendation: draw it running off the edge, greyed, which never changes the
  window's size and never oscillates, and say "next bar continues" in the row; test the
  breakpoint with a viewport swept across it and assert the window's scale is monotone.
- **C (implementation bug, distortion).** *Mechanism:* `drawInto` gives a look-ahead slot a
  page of bars × stage width; when the zoom rises at Play, two dense bars exceed it, the
  engraver wraps the slot and justifies bar 5 across the row; `data-stretch` records intent.
  *Measurement:* the phone upright Nocturne 4-bar mid-run cell on the sheet, opened. *Fix:*
  size the page from the widest natural bar at the zoom; write `data-stretch` from the
  outcome; add a check that reads drawn width against engraved width per bar. Restores the
  owner's first rule; no invariant change.
- **D (two definitions of "staff").** *Measurement:* the `.staffline` box every spec reads is
  1.8 to 2 times the five-line span on two pieces; `pieceInk.staff` the same. *Fix:* the
  five-line height becomes the one meaning; the floor's number is re-derived from screens
  the owner has called readable. This changes the *number* in an invariant, not the
  invariant; two pieces is a thin base and the re-derivation should measure more.
- **E (intentional behaviour; the one real invariant change, D7).** *Mechanism:* T34 rule 2
  grants the next bar only if it fits at the largest scale, and the largest scale on a wide
  stage leaves no room. *Measurement:* tablet sideways, Twinkle and Nocturne at 2 bars: one
  row at maximum size, cursor on the last bar, no next bar, the lower sixth to third of the
  stage empty, staff far above any floor. *The choice:* whether readability, once
  comfortably met, should yield room to the look-ahead. The owner said the two are "the most
  important things" together; T34 read "maximise readability" as "maximise size".
  Recommendation: yes, with "comfortably met" defined as a multiple of the five-line floor
  from D above and tested on the sheet's four tablet cells before and after. This one is
  yours, because it changes what a tablet shows on every piece.

**Needs no decision and can start on the word:** R2, R1's pricing and sentence, R3's spec,
B's scale fix, C, D, and every item under problem 1 except D1's requirement question.

## What this changes in the plan

- **Wave B (on your go):** every P0 in problem 1, local, each with a test seen red; the
  window's R2, B, C and D at the shared mechanism, the two stale specs re-pointed, a
  distortion check that reads outcome; then T33. One chain, commit, push, green baseline.
  D6 and D7 as decided.
- **Wave C:** D1–D3 in the target model's terms (observations, evidence keyed to skills,
  skill state, three readers), one consumer at a time, with constructed learner states as
  tests; any interim completion-from-observations step labelled as interim.
- **Wave D:** D4 (the separated fields, schema proposed for review first), then D5
  (needs-versus-taught as a gate; the excerpt item as defined, on one rung), then the
  lesson-voice pass and the carried-over open items.

## Unverified

Nothing was heard. No screen was seen: every on-screen string is read from code. The
constructed learner states ran the real functions on the built content in Node, without
imports, shelf pieces or overrides. Counts marked *trace only* were made by the agents on
the built catalog and curriculum and were not re-counted, except the quarried-item and
"repertoire"-tag counts (517 quarried items, all tagged; 25 others tagged too, which the
repertoire trace missed).
