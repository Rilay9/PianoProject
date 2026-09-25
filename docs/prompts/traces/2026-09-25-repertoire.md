# T36b — One quarried minuet from the archive to the next recommendation, and every difficulty it carries

2026-09-25 · read-only trace · brief `docs/prompts/tasks/T36b-trace-repertoire.md`

**The object.** `song.classical.bach-menuet-bwv-anh-113.pdmx`, *Minuet in F major, BWV Anh. 113*
(PDMX upload, MuseScore 5915848), on rung **`classical.3`**: Stage 3, classical track, "Baroque
and Classical dances" (`content/curriculum/stage-3.json`, unit `classical.3.1`). File
`content/scores/pdmx/QmZzbCrrGH19zjfe766mDvw9C1cXYXSa5ApF7MRnRhpqjL.mxl`; `level` 5.23,
`levelSource: "estimated"`.

**The judged comparison.** `song.classical.petzold-minuet-g-bwv-anh114`, *Minuet in G major,
BWV Anh. 114*, on the same rung: `level` 5.1 judged, `abrsmGradeApprox` 2, from the MuseTrainer
library (`content/sources/musetrainer.json`), file
`scores/imported/song.classical.petzold-minuet-g-bwv-anh114.mxl`. The pair was chosen because
the two pieces come from the same notebook and sit on the same rung, and one was levelled by a
person and the other by the model, which is the cleanest control the catalog offers. Stage 3 is
inside the brief's "Stage 3 to Stage 5".

**What was done.** I read the code and rows named below and read both scores bar by bar
(`dump_score.py` and the raw MusicXML). I ran `difficulty.features` and `estimate` on both files
and on three bar ranges of the minuet, and counted over the built `catalog.json` and
`curriculum.json`. No build, no browser, no app run, no test run. **Whether this upload is a
faithful edition of Anh. 113, and whether it sounds right at its tempo, cannot be judged without
hearing the piece.** Everything musical below is read from the notation.

---

## Judgement, in five lines

1. The minuet carries seven difficulty numbers and a nineteen-number vector today: 5.23 in the catalog, 5.06 from the current model on the same features, 5.7 from the CSV proxy the phone's folder browser shows, quarry band "4", PDMX complexity 1.0, the rung's band [2.4, 5.3], and Stage 3 from where it sits. No reader past `pdmx.json` ever sees the vector.
2. Three of them reach a learner ("≈ L5.2" on the Lesson, Library and Today screens, "level 5.7 est." on the folder browser, and Stage 3 by placement), and they span more than two stages.
3. A teacher would trust none of them. They would trust the comparison with the judged Petzold (5.1, a person's grade-2 call). The two pieces come from the same book, but this edition has triplets, appoggiaturas, a trill, sixteenths and a turn to D minor where the Petzold has quarters and eighths. That puts it after the Petzold, around Stage 5, and a stage or two above its Stage 3 rung as a whole piece. The current model ranks the pair the other way (5.06 against 5.48) because it cannot see tuplets or grace notes.
4. The deeper fault is on the learner side. A run leaves a pass flag and best numbers keyed by item, not by rung or by dimension, so no difficulty number has anything to be compared with. The judged sibling's pass at one rung's numbers completes four stricter rungs.
5. The data model cannot hold an excerpt as a learning experience. Cut on paper, bars 5–8 and 17–24 fit what a Stage 3 learner has been taught, and the model's single number would have picked bars 1–4, the hardest to read, as the easiest.

## The causal model

The quarry measures this piece carefully: nineteen features, a checksum, a note-count gate and a
render check with cursor parity. The catalog keeps one number of all that. The curriculum placed
the piece by that number: every song was attached to a rung by level band on 2026-09-15 (commit
`2aef1c0`: "every song placed on a rung … level bands recomputed from the catalog"), and the
bands were then widened to fit.

On screen the number is a label. The session builder picks among a rung's options by position,
and uses levels only in its fallbacks, where the stage number stands in for the learner. The run
measures misses, wrong notes and timing per bar, shows them once, and stores a pass flag, best
accuracy, best tempo and dates keyed by item. The next recommendation reads the flag and the
calendar.

So the item side is rich until the catalog boundary and one number after it, and the learner
side is one bit per item. **The two never meet on a dimension.** A better difficulty number, or a
multi-dimensional one, would change almost nothing a learner is offered until a run writes
evidence that a selector reads. The cheapest place to start is the evidence the run already takes
and throws away: hot spots, timing, mode and the tempo actually played.

---

## The trace, stage by stage

Each stage gives what it knows, its source of truth, what is lost or added, what it assumes,
whether the next stage gets enough, and where the same concept is recomputed.

1. **Archive row.** Source: `PDMX.csv`, outside the repository. Title "Menuet BWV Anh 113",
   composer_raw "Unknown Composer", `complexity` 1.0, bars 64 and notes 520 (the file's 32 bars
   and 260 notes with both repeats played), rating 4.87 from 5 raters. It assumes the uploader's
   public-domain claim. Recomputed later by the CSV proxy (5.7).
2. **Quarry and shortlist.** Source: `build/pdmx/picks-candidates.json`. `shortlist.band_for`
   gives band "4" (8.125 notes per bar, just over 8), bucket `classical`, composition status
   `pd` ("owner review 2026-09-14"), and review `keep` with the composition reason as its note.
   **Lost:** rating, views and complexity stop here. The band is written into `pdmx.json` and
   has no reader downstream (grep of `tools/content` and `app/src`; its only other uses are
   queueing inside the quarry).
3. **Extraction and conversion.** Source: `quarry.py` and `convert.py`, recorded in
   `build/pdmx/quarried.json`: ok, 32 bars, 260 notes, 2 staves, 356 render steps with cursor
   parity. **Added:** the source has no tempo, so `convert.py:1432` inserts ♩ = 96 as a
   *visible* metronome mark. `tempoDefaulted: true` becomes the catalog tag `tempo-defaulted`,
   and nothing reads that tag: two spellings were grepped over `app/src` and
   `tools/content/*.py`. 176 of the 542 PDMX rows carry it.
4. **Features.** `difficulty.features` writes 19 numbers into `pdmx.json`. I recomputed them
   today on the built file and all 19 equal the stored values. Two single lines, one note per
   hand at a time, no chords. **Assumed:** tuplets and grace notes are not features, and music21
   gives a grace note no duration. This is the only multi-dimensional description of the piece,
   and it stops here.
5. **Estimated level.** `pdmx.json.level` is 5.23, with `levelFrom: "model"` (the fit before the
   2026-09-22 refit) and `levelDrivers`. **The current model on the same features gives 5.06.**
   Entry 53 re-spliced only rows that moved by 0.3 or more, so 308 of the 542 rows carry an older
   model's number (largest difference 0.29). `levelFrom` has no reader (Entry 53's grep).
   Nothing recomputes the level at runtime for a catalog item.
6. **Catalog row.** `import_pdmx.build_item` calls `common.catalog_item`
   (`import_pdmx.py:120–170`). It keeps level, levelSource, tracks `["classical"]` from the
   bucket, **`concepts: ["repertoire"]`**, the tags, and `attach_notation`'s identity block
   (32 bars, 2 staves, F major, 3/4, no chord symbols). **It drops** the features, drivers,
   band, rating, and any grade. `build.py:366–371` says so in its own words: the features and
   drivers exist and "none of it reaches `catalog.json`". **Not enough downstream:** nothing
   after this point can ask which hand, which rhythm or which reading demand makes the piece
   hard.
7. **Rung and lesson.** `classical.3` lists it third of six song options. Band [2.4, 5.3],
   mastery 90 %/80 %, **no `requires`**, prerequisite 3.4. `content/lessons/classical.3.md`
   names "F major (Anh. 113)". The rung's finder asks for "two voices, one per hand" at
   "elementary, Grade 1 to 2", and nothing checks that against the options (Q3). Entry 56
   re-measured it at +0.13 over Stage 3's judged maximum, inside its 0.7 bar, so it stayed.
8. **Library, Plan, Lesson and Today.**
   - The Library detail shows "≈ L5.2", *What it trains*: "repertoire", and "The app guessed this
     level from the music itself — change it if it feels wrong", with a re-level control.
   - The Plan screen shows no level (grep of `PlanScreen.ts` for "level").
   - The Lesson row reads "≈ L5.2 · Hands together · PDMX (MuseScore upload, uploader's
     public-domain claim)". The rung's band is **not printed**, although `02` (line 28) and the
     schema say the lesson page prints it: grep of `app/src/ui` and `app/src/curriculum` for
     `levelBand` finds one reader, `ShelfScreen.ts:139`.
   - Today's *New* slot is `pick(options, seed)` over the rung's three exercises and six songs
     (`session.ts:302–324`). That is a choice by list position. With the seed at 0, which is what
     Today starts at until *Shuffle*, my reading of `fillSlot` is that it lands on the Petzold,
     not on this piece.
9. **Score screen.** The rung is `lessonForItem`, the first rung listing the item, which is
   `classical.3` for this piece. On a tablet the side panel shows `classical.3.md`, whose prose
   describes the Petzold ("the Petzold below is thirty-two bars and comes to rest at bars 8, 16,
   24 and 32"). This file's halves are 12 and 20 bars. The piece has no `teaching.sections`. The
   default mode with a piano attached is Wait (`settingsStore.ts:127`), and the tempo slider
   starts at 70 % (`:131`) of the invented 96.
10. **The run.** The engine judges steps (Wait) or notes (Tempo), counts misses and wrong notes
    per measure, keeps timing deltas and pedal, and unrolls repeats.
11. **Grading.** `masteryCriteriaFor(classical.3)` gives a pass at 90 % of notes and 80 % of
    written tempo. Master is fixed at 97 % and 100 % (`ScoreScreen.ts:2412–2417`). **In Wait mode
    the tempo compared is the slider's setting** (`PracticeEngine.ts:1308`, `Scoring.ts:184`).
    The Settings screen states its own "A pass needs accuracy %" for the same screen.
12. **Feedback.** The summary sheet (`ScoreScreen.ts:2497–2581`) shows "Passed" or "Run
    finished", accuracy, "Tempo N % of written", wrong notes, missed notes, up to three weakest
    bars and timing, with *Loop the weak bars*. It never states the bar that decided its title.
13. **Progress and evidence.** A `ProgressRow` (status, bestAccuracy, bestTempoPct only on a
    pass, attempts, passedOn dates, minutes, selfPassed) and a `SessionRow` (lessonId, mode,
    tempoPct, accuracy, wrong, missed, duration). **Hot spots, timing, per-bar and per-hand data
    are not stored** (`db.ts:35–90`).
14. **Next recommendation.** Four readers:
    - `lessonComplete` asks whether the item is passed, on any rung.
    - `nextRecommended` returns the first incomplete rung in file order.
    - `reviewQueue` brings a piece back 1, 3, 7 and 21 days after its first pass.
    - The Repertoire slot offers any mastered item.

    The Skills screen matches item concepts against lesson concepts, and "repertoire" is not a
    lesson concept, so **a pass of this piece changes no concept state.**

**Where the judged sibling differs.**
- **Source.** Its level is typed in `musetrainer.json`, whose header says "Levels are stage.unit
  … stage 5 ~ [ABRSM] 2-3". Grade 2 was written down as 5.1.
- **Catalog row.** It carries four concepts ("3/4", "binary-form", "hands-together",
  "baroque-ornament") and two sections (the halves, bars 1–16 and 17–32). Its tempo of 126 comes
  from its edition.
- **Judging.** It sits on five rungs (3.4, classical.3, 4.4, 4.6, 4.7), and is judged at 3.4's
  numbers wherever it is opened.
- **Progress.** Its pass turns "3/4" and "hands-together" to *learning* on the Skills screen.
- **The model** reads it at 5.48.

---

## Q1 — Every definition of difficulty in play

| # | definition | this piece (Petzold) | computed | read by | can two disagree about one piece today? |
|---|---|---|---|---|---|
| 1 | catalog `level` | 5.23 (5.1) | `pdmx.json` at quarry time; typed in `musetrainer.json` | session fallbacks, swap tiers, `levelLabel` on five screens, `rungForLevel`, `validate` bands, `candidates`, `rung_audit`; calibration target when judged | yes, with 2, 9, 10 and 13 |
| 2 | current model on the stored features | 5.06 (5.48) | `difficulty.estimate` with `level-model.json` | nothing at runtime for catalog items | yes: 0.17 below row 1, and it **inverts the pair's order** |
| 3 | `levelSource` | estimated (judged) | importers | `levelConfidence` tie-break in swaps, "≈" in the label, one Library sentence, calibration membership | not a number, but it decides which number is trusted |
| 4 | `abrsmGradeApprox` | absent (2) | typed on MuseTrainer, authored and kern rows | **no reader** in `app/src` (two searches: `abrsm` case-insensitive over `*.ts`, then a file listing), nor in `validate`, `candidates`, `rung_audit` or `ladder_report` | inert; by `02`'s map grade 2 is Stage 5, and the sibling sits on a Stage 3 rung |
| 5 | the nineteen features | vector in `pdmx.json` | `difficulty.features` (`FEATURE_NAMES`) | `import_pdmx.concepts_for` reads five of them for concept flags | not a level; never reaches the catalog |
| 6 | TypeScript port | not computed | `app/src/score/difficulty.ts`, agreement test within 0.2 on 42 fixtures | assign sheet and Library import only | cannot disagree about the catalog copy; an imported copy of this file would get its own number (the port reads grace notes differently, its header says, and this file has four) |
| 7 | `levelOverrides` | none set | device IndexedDB | applied before every reader (`curriculum/load.ts:259`); promotes the item to judged | device-local; never reaches calibration |
| 8 | PDMX `complexity` | 1.0 | CSV | `band_for` (moves a band only at ≥ 3) and the CSV proxy | never reaches the catalog |
| 9 | quarry band | "4" | `shortlist.band_for` | queues and quotas; written to `pdmx.json` and read by nothing after | yes: band 4 against 5.23 |
| 10 | CSV proxy | **5.7** | `pdmx/index.py` with `pdmx-csv-level.json` (a model fitted on 368 quarry levels) into `library.json` | FolderScreen ("level 5.7 est.", "around Stage 5"); *Add* sets the import's level to 5.7 (`folderLibrary.ts:2260`) | yes: +0.47 over row 1, and learner-facing |
| 11 | rung `levelBand` | [2.4, 5.3] | authored, then moved to fit options (Entry 53 moved 18 bands) | `validate` (fails the build), `candidates` (filters by it), `rung_audit`, `ShelfScreen.ts:139` (a paper piece assigned to this rung defaults to 2.4) | it describes the options, so it cannot disagree with them; circular with `candidates` |
| 12 | rung pass numbers against Part G's master | 90 %/80 %; master 97 %/100 % | `masteryCriteriaFor(lessonForItem(...))` | the Score screen's judging | not for this piece (one rung); for the Petzold, 3.4's 85 % judges the runs that complete classical.3, 4.4 (97 %), 4.6 and 4.7 |
| 13 | what suits a Stage 3 learner | — | *New* fallback \|L − 3\| ≤ 1 (`session.ts:315`); Repertoire fallback L < 5 (`:332`); core reach ≤ 5.0 (`validate.py:475`, core rungs only); Entry 56's stage maximum + 0.7 = 5.8 (a script run once) | session builder, build | yes: this piece is out by the first three and in by the fourth and by its rung |

**There are two definitions of `level`.**
- **An address.** `rungForLevel` (`rungFor.ts:33–54`) reads 5.23 as unit "5.2", and
  `musetrainer.json` writes grade 2 as "5.1".
- **A continuous quantity.** The regression fits these numbers as reals, although Stage 3 has six
  core rungs and Stage 4 seven, so 3.6 to 4.1 is one step on the ladder and 0.5 apart as a
  number.

On top of that, the stored level (1), the model's current reading of the same features (2) and
the folder proxy (10) are three definitions of "this piece's estimated difficulty", and two of
them are shown to learners.

**Recommended source of truth.**
- **The measured features, for an estimated piece.** `level` should be a view derived from them
  at build time by the one model, stamped with that model's version, rather than a stored number
  that goes stale by policy. A person's judgement, as a grade or a level, overrides the view and
  joins the calibration set.
- **`abrsmGradeApprox`** should either be the judged input that `level` is derived from, or be
  deleted.
- **Band, complexity and the CSV proxy** are queueing tools for the quarry. The folder browser
  should call its number something else, or level the file with the port once it is opened.
- **`levelBand`** should be generated and never hand-moved, and either printed (as `02` promises)
  or not used as a build gate.
- **"Suits a Stage N learner"** should be one function, shared by the session builder,
  `validate` and `rung_audit`, and replaced later by a learner-side model.

What would change downstream: `validate`'s band and reach checks, `candidates`' filter,
`rung_audit`, the session fallbacks, and the folder browser's label. The screens' "≈ L5.2" would
move only where the derived value differs at one decimal.

## Q2 — What the features know that the number forgets

| dimension | this minuet | the Petzold | in the fitted model? |
|---|---|---|---|
| reading: range, ledger lines, accidentals | RH 22, LH 22 semitones; ledger ratio 0.073 (C6 above, E2 below); outside the key: E♭, B♮, C♯, F♯ | RH 24, LH 21; ledger 0.020; C♯ in its turn to D | rangeRight +0.575, rangeLeft +0.418, blackKeyRatio +0.896, keyAccidentals +0.133; **ledgerRatio dropped** |
| rhythm and ornament | shortest note a sixteenth; six durations; triplet eighths in bars 2–3 (nine in bar 3); appoggiaturas in bars 2, 4, 16 and 32; a trill in bar 11 | shortest note an eighth; four durations; no tuplets, no graces, no printed ornament | shortestValue −0.126 (small); **distinctRhythms dropped**; tuplets and grace notes **not measured**; ornaments +0.017 |
| texture and hand independence | one note per hand throughout; both hands move (the LH runs in eighths in bars 2, 4, 14, 18, 20 and 24); the figure passes between the hands in bars 17–21 | an opening LH triad, a final RH triad, two voices in the LH in bars 25–26 and 29; the LH mostly holds halves and dotted halves | voicesPerStaff +0.394 (the Petzold scores 2, the minuet 0); **simultaneity dropped**; nothing measures two hands moving at once |
| leaps | RH 12, LH 12 | RH 16, LH 12 | maxLeapRight +0.427; **left dropped** |
| physical demand | 4.33 notes/s at the invented 96 | 3.54 notes/s at its edition's 126 | notesPerSecond +0.441 |
| length | 32 bars | 32 bars | bars +0.423 |

The dimension where this minuet is harder, rhythm and ornament, is nearly invisible to the model:
it is dropped, weighted lightly, or not measured at all. The dimension where the Petzold is
harder, texture, is weighted. That is the whole reason the current model ranks them 5.06 against
5.48 while a teacher reading the notation would rank them the other way. One number cannot say
"stays in position, hard in rhythm and ornament" against "held left hand, some chords".

**Where a two-dimensional answer would change what a learner is offered.**
1. **Today's *New* slot** picks among the rung's nine options by position (`session.ts:311–318`).
   A rung whose concept is two-voice texture could prefer the options whose other demands are
   within what the ladder has taught so far.
2. **The swap sheet.** For this piece, tier 3 of `alternativesFor` is "any PDMX piece within
   half a level" (Q H4): 128 candidates, 95 classical, 19 pop and 4 jazz, and the nearest include
   *Fly Me to the Moon*. A dimension match would keep a swap on the same demand.
3. **Choosing an excerpt** (Q4) cannot be done right with one number.
4. **Entry 56's too-hard rule** went back to one number after Entry 51 had compared feature by
   feature.

**But none of these has anything on the learner side to match against.** An item vector with no
per-dimension evidence from the learner changes the swap sheet at best. The run already locates
trouble per bar (`hotSpots`). A per-bar feature reading, such as "bar 3: nine triplet eighths",
would turn "weakest bars 2, 3" into "triplets", and that is the evidence a dimension needs. The
architectural step is that pairing, not a better item number.

## Q3 — Placement

**A teacher's read from the notation.** As a whole piece, this edition needs several concepts the
ladder itself teaches later:
- **Triplets:** the ladder teaches them at 4.5, "Compound time, triplets and syncopation".
- **Grace notes and ornaments:** at `classical.4`, "Grade 1 pieces and articulation".
- **A trill:** at `classical.5`, and at technique.5 and technique.6.
- **Sixteenths:** no lesson concept names them (grep of every lesson's `concepts` for "sixteenth"
  and "16th" found none).
- **A modulation** with C♯ and F♯.

It sits on a Stage 3 rung (`02`: "initial / grade 1") whose prerequisite is 3.4. It belongs after
`classical.4`, around Stage 5, and after the Petzold. The Petzold in its edition (quarters and
eighths, a held left hand, no printed ornament) is a fair goal piece for the end of Stage 3 or
the start of Stage 4. Judged 5.1 (grade 2), it is itself a named exception in `validate.py`'s
`CORE_REACH_PLAN` on core 3.4. **The rung's two minuets are not equals: one is a stretch and the
other is two.**

**The rung's own words disagree with its stock.** The finder says "elementary, Grade 1 to 2",
which is Stage 4–5 on `02`'s map. The lesson says the classical track "starts with dances,
because … everything a new reader needs". The rung is written for a new reader and stocked for a
grade-2 player.

**The mechanism that put it there.** Commit `2aef1c0` attached every song by level band and
recomputed the bands. Entry 56's check then compares each option with the stage's judged maximum
plus 0.7. Stage 3's maximum, 5.10, is set by four judged rows: the Petzold and its `.alt`, the
full *Greensleeves* on core 3.3, and the easy Pachelbel Canon on 3.5 and 3.6. Every one of them
is on a core rung beyond the core reach, admitted as a named `CORE_REACH_PLAN` exception or by
the variant-family allowance. **The ceiling that admits pieces to Stage 3 is calibrated on the
exceptions to the rule that keeps pieces out of it.**

*Alternative explanation:* the classical track holds goal pieces above the stage on purpose, and
`02`'s "level versus rung" allows it. If so, the defect is only that nothing tells the learner:
the band is not printed, and the options are not ordered by what has been taught.

**What `requires` and `notation_requirements` check.** At least one option must have chord
symbols, a given meter, an explicit major or minor `<mode>`, or at least N staves
(`validate.py:953–1021`). A rung has to declare `requires` only when its concepts include one of
the five `CLAIMING_CONCEPTS`. `classical.3`'s concepts (baroque-dance, articulation,
two-voice-texture) are not among them, so **nothing is checked on this rung.**

What they miss:
- **Level fit.**
- **Rhythm, tuplets, ornaments and voices.** The `notation` block does not record them.
- **"One option suffices",** which lets the other five ignore the rung's purpose. The *Écossaise*
  is right hand alone, against the finder's "two voices, one per hand". The K. 331 theme is "set
  here in C major in 3/4 … over the plainest accompaniment", against the finder's avoid
  "arrangements with an added accompaniment".
- **The concepts a piece needs against the concepts the ladder has taught by that rung.** That is
  the check that would have caught this placement.

## Q4 — Can the data model represent an excerpt at all?

**The architectural fact first.** A PDMX source is forced into being a whole-piece repertoire
item.
- **The item is the unit of level, concepts, pass and progress.** `level`
  (`catalog.schema.json:69`), `concepts` (`:98`) and `file` (`:209`) are per item, and an item has
  `"additionalProperties": false` (`:23`). There is no bar range on an item.
- **A rung offers items by id.** `songOptions` is an array of strings
  (`curriculum.schema.json:150`), with no range.

**Three mechanisms address a bar range, and none of them makes it an experience of its own.**
1. **`teaching.sections`** (`catalog.schema.json:385–425`) holds a label, `fromMeasure` and
   `toMeasure`: no level, no concepts. It is fed from `content/sources/sections.json`, which holds
   22 items and none from PDMX, though the file accepts PDMX ids. The Score screen's section
   select turns a section into a loop (`ScoreScreen.ts:3104–3116`).
2. **The route `#/score/<id>?loop=a-b`** (`router.ts:172–182`), used by the tour. A rung's
   `tools` cannot name bars: "a rung wanting the ladder over a piece would have to name bars,
   which is a different feature" (`curriculum.schema.json:169`).
3. **The engine's loop.** A lap goes to the tempo ladder and never to `recordRun`
   (`ScoreScreen.ts:3257–3262`), so a looped range leaves no evidence.

`variantOf` (`catalog.schema.json:217`) could link an excerpt to its piece, but it has no reader
in `app/src` (grep); only `validate` and `score_checks` read it. `trimMusicXml.ts` cuts a document
to its first N bars at runtime, but only for the layout probe. It shows that cutting is cheap; it
is not an excerpt mechanism.

**What the model can and cannot represent.**
- **Can:** a named loop range for practice, and a separate file-backed item with its own level and
  concepts.
- **Cannot:** an excerpt's own level, concepts, pass rule or progress row, or the relation
  "passing bars 17–24 is evidence toward the piece".

**One excerpt already exists, by accident.** `song.pop.minuet-in-g-minor-bach-piano.pdmx`, on the
same rung, is a truncated upload titled "(first 16 bars)". Its review note says it was kept at
4.42 "because the full setting levels at 5.92". The excerpt idea is already in the catalog,
unnamed, and it got there because it was shorter.

**Three cuts on paper, as evidence for a later decision (not a design).** For each cut: what the
notation asks, which concepts it needs and where the ladder teaches them, the model's number for
the cut (whole piece: 5.06), and whether a Stage 2–3 learner could use it.

- **E1, bars 5–8.**
  - *Asks:* the RH plays A4 C5 F4 C5 G4 C5 | A4 C5 B♭4 C5 G4 C5, twice: a moving lower line under
    a repeated C5, inside one F position. The LH walks in quarters in the low register: F3 A2 G2 |
    F2 G2 E2.
  - *Teaches:* steady eighths over a walking bass in 3/4, hearing the line inside the figure, and
    the low bass notes.
  - *Concepts:* eighths (2.2), 3/4 (1.4), B♭ (3.1), ledger lines below the bass staff (3.4).
  - *Model:* 3.20.
  - *Stage 3 after 3.4: yes. Stage 2: no* (B♭ and the low ledger notes arrive at 3.1 and 3.4). It
    is inside Stage 3's judged range on every feature except two. Notes per second at the written
    tempo is 4.80 against a Stage 3 maximum of 4.36, though it is 3.84 at the rung's 80 %.
    Ledger ratio is 0.139 against 0.10, from the LH's E2 and F2.
- **E2, bars 17–24.**
  - *Asks:* the three-note figure C♯–D–E in eighths passes from the RH to the LH and back
    (bars 17–21) while the other hand repeats quarters, then the phrase cadences into D minor
    (bars 22–24).
  - *Teaches:* the lesson's own point, "two voices, not two hands"; an accidental outside the key
    in both clefs; a phrase that ends in a cadence.
  - *Concepts:* eighths (2.2), accidentals (3.3's G♯), relative minor (3.3), two-voice texture
    (classical.3).
  - *Model:* 4.15 (eight bars).
  - *Stage 3: yes*, and it is the best of the three for this rung's concept. It is inside Stage 3
    on every feature except notes per second, by 0.04 at the written tempo.
- **E3, bars 1–4.**
  - *Asks:* sixteenths (bar 1), triplet eighths (bar 2, and nine of them in bar 3), appoggiaturas
    (bars 2 and 4), and an E♭.
  - *Teaches:* reading ornaments and tuplets.
  - *Concepts:* triplets (4.5) and ornaments (classical.4).
  - *Model:* **3.07, the lowest of the three.**
  - *No.* It needs concepts from Stages 4 and 5. The model rates it easiest because tuplets and
    grace notes are not measured, `distinctRhythms` carries no weight, and a four-bar length
    (log-scaled `bars`, −0.94) dominates every short cut.

*Caveats.* The model's numbers for four-bar cuts sit at the shortest lengths in its calibration
set (the Stage 0–1 anchors are 4–12 bars) and are dominated by length, so the concept column is
the more trustworthy reading. Each slice was cut with music21, with the 96 tempo carried into it.
The anchor ranges are Entry 51's table. Entry 53 later changed the leap features on some rows,
and Entry 56 reproduced the level maxima but not every feature range.

**What this gives the owner.**
1. Two of the three cuts bring material from a Stage 5 piece within what a Stage 3 learner has
   been taught, and one of them is on the rung's own concept.
2. The single number put the cuts in the wrong order. Any excerpt selection needs the dimension
   view.
3. Today an excerpt is one more file per cut, as the G-minor precedent shows, and nothing links
   progress on the excerpt to the piece.

## Q5 — What the app learns from a run, and what it changes

**Fields written** (`recordRun`, `progressStore.ts:124–179`):
- **ProgressRow:** attempts + 1, lastPracticedAt, minutes, bestAccuracy (the maximum),
  bestTempoPct (the maximum, on a pass only), selfPassed (cleared by a measured pass), passedOn
  (today's date on a pass), and status (new, started, passed, mastered).
- **SessionRow:** itemId, lessonId (the judging rung), mode, tempoPct, accuracy,
  accuracyEstimated, wrongNotes, missed, durationMs, at, and the performance and rhythm-only
  flags.
- **The streak's minutes.**

**Measured and then discarded:** hot spots per measure, timing (mean, spread, early and late),
the per-note record and pedal. The summary shows them; the store does not keep them.

**Readers.**
- `lessonComplete`: is the item passed?
- `nextRecommended`: the first incomplete rung.
- `reviewQueue`: passedOn and status, on the calendar.
- The Repertoire slot: status mastered.
- The Skills screen: item concepts that are also lesson concepts. For this piece, none; for the
  Petzold, "3/4" and "hands-together" become *learning*.
- The Progress screen and the badges, for display.

No selector reads bestAccuracy, the session rows, or anything per bar. I grepped `app/src` for
`sessionsForItem`, `recentSessions(`, `bestAccuracy` and `hotSpots`; the only readers are the
Drill screen's coaching text, Simon's best chain and the Progress screen.

**Is a run judged by its rung's numbers?**
- **This piece: yes.** It is on one rung, so `lessonForItem` gives classical.3's 90 %/80 %.
- **The judged sibling: no.** `lessonForItem` returns 3.4 (85 %/80 %), although the route carries
  `from=classical.3` (`ScoreScreen.ts:219`, used only for Back). The item-level pass then counts
  on classical.3 (90 %), 4.4 (97 %), 4.6 (90 %/90 %, as one of "two pieces in performance mode")
  and 4.7 (90 %/90 %, "from memory").
- **Across the built curriculum,** 181 items sit on more than one rung and **53 of them (25
  songs) have a later rung asking more than the first.** Rungs that state 0 were counted at the
  Settings defaults of 90 % and 80 %.

**What "passed" and "mastered" mean in the stored row.** This is inferred from the code; nothing
was run.
- **Tempo in Wait mode.** In Wait mode, the default with a piano, the tempo compared against 80 %
  is where the slider sits (`PracticeEngine.ts:1308`, then `Scoring.ts:184`), and the summary
  prints it as "N % of written" (`ScoreScreen.ts:2527`). `02` Part G defines a pass "in Tempo
  mode".
- **Mastery.** The row turns *mastered* when a master-eligible run arrives and `passedOn` holds
  two dates (`progressStore.ts:143–144`), and any pass adds a date. So one run at 97 % on day two,
  after a pass at 90 % on day one, masters the piece. Part G asks for 97 % at full tempo twice.
  The unit test "needs two passes on different days" (`progressStore.test.ts`) covers only the
  case where both runs are eligible.

**A repertoire piece against a generated exercise.** Both go through the same `recordRun`, into
the same rows, for the same readers. The differences are small:
- An exercise may show a technique measure (articulation, voicing or shaping). It can stop a pass
  only where the rung's `custom` names it, and none does. It is not stored.
- A sight-reading drill counts its first attempt only.
- A mastered song feeds the Repertoire slot.

Neither writes concept or dimension evidence. **So does performance change the learner model and
therefore the next experience? Only by flipping the item's status, which moves the rung pointer
and the review calendar, and the type of content makes no difference.**

**The next recommendation for this piece.**
- **After a pass:** once an exercise on the rung has also passed, `lessonComplete(classical.3)` is
  true and the pointer moves to the next incomplete rung in file order. The piece comes back in
  the review slot at 1, 3, 7 and 21 days. Once mastered, the Repertoire slot offers it every
  session: Part G says every 30 days or so, and `session.ts:326–340` has no interval.
- **After a failed run:** status "started" and a best accuracy. Nothing brings the piece back but
  the learner, because Today's *New* slot keeps its positional pick.

## Q6 — The genre corrections of 2026-09-17

1. **Rock as a style, not those songs: half done.**
   - **Done:** no rung or lesson names the seven songs (grep of `content/curriculum/*.json` and
     `content/lessons/*.md` for their ids and for the band names returned nothing). `rock.overview`
     and `rock.4`–`rock.7` teach texture on other music.
   - **Not done:** `content/sources/pdmx-wants.json` still says "The seven rock-module songs are
     the reason the rock track exists at all — the owner named them", and keeps all seven as
     wants. The seven placeholders, with no file, are still in `catalog.static.json` and the built
     catalog, so they appear in the Library as "import needed". `build/genre-plan.md`
     (gitignored) still carries `rock.8`, "Your band, reduced", which the correction said to drop.
2. **The earliest honest stage: done in structure; the "honest" half is unverified.** Genre
   elements appear at 1.1 and 1.5 (`exercise.riff.*`), 2.2 (`exercise.swing-pair.c`), 3.1 (the
   pentatonic blues) and 3.3 (the power chord), and four genre rungs start at Stage 3 (blues.3,
   jazz.3, latin.3, rock.overview), all read from `stage-1..3.json`. Entry 4 wrote them as
   "UNREVIEWED. NEEDS A MUSICAL EAR". Since then they have been checked by invariant and by
   picture (Entry 33), not by ear. Whether each is the earliest point a learner can honestly meet
   the element is a musical judgement the record has not made by ear.
3. **The public build carries the personal items: not done.** `.github/workflows/pages.yml:47–60`
   sets `PIANOPATH_STRICT_LICENSE: '1'`, so the public build puts a placeholder in place of every
   item that is not `pd`. It changes nothing for this trace's two pieces, which are both `pd`.

---

## Hypothesis status

- **H1, the learner model is completion plus best numbers: supported by observed evidence, and
  not the whole story.**
  - *Observed:* the `ProgressRow` and `SessionRow` fields. `fillSlot` takes
    `position.stageNumber` as the level (`session.ts:256`). Review is by calendar only
    (`reviewQueue`). No selector reads hot spots, timing or run numbers (grep scope as in Q5).
  - *The causal question* was whether the stage standing in for the learner produces wrong
    selection. For this piece the stage never decides anything: the *New* slot picks among the
    rung's options by position, and the stage enters only the fallbacks.
  - *The selection faults this trace found are other mechanisms:* item-keyed passes judged at the
    first rung (P0-1), and passes and mastery that record a tempo nobody measured (P0-2).
- **H3, difficulty has several definitions: supported, and sharpened.**
  - *Observed:* thirteen rows in Q1, three of them in front of a learner.
  - *Contradicted in part:* several of the definitions H3 lists are inert. `abrsmGradeApprox` has
    no reader, the TypeScript port never levels a catalog item, and `levelBand` is shown to no
    learner, so none of them can mislead one. The definitions that can are the stored level, the
    folder proxy (not on H3's list) and the stage.
  - *The collapse happens earlier than H3 says:* the features never reach the catalog, so no
    selector could read them even if one were written to.
- **H4, fallbacks are blunt: supported for the swap sheet on this piece.**
  - *Observed:* tier 3 matches on the concept "repertoire", which every one of the 542 PDMX items
    carries and no other item does (counted in the built catalog). So it is a ±0.5 level window
    presented as a concept match: 128 candidates, jazz standards among them, beside a Baroque
    minuet.
  - The technique and *New* fallbacks were not reached for this rung, because it has options.
  - The Repertoire fallback (any song under stage + 2) excludes this piece and its judged sibling,
    while the rung offers both.
- **H6, PDMX is used at the piece level only: supported, with a nuance.** The model can address
  a bar range (sections, the route loop, the engine loop), but never as an experience with a
  level, concepts, a pass or progress, and loop laps are never recorded. An excerpt already
  exists by accident as a separate item (the G-minor "first 16 bars").
- **H8, no musical judgement by ear: supported.** This piece's review note is its composition
  reason, Entries 51–56 measured features, and this trace read notation. Nothing was heard.

**A different architectural problem, where the evidence points: pass evidence has no rung and no
dimension.** It is the learner-side twin of H3. The item side has many numbers, the learner side
has one bit per item, and one rung's numbers are applied to runs that complete another rung.
That, more than the count of difficulty definitions, is what stops difficulty from mattering to
what a learner is given.

## Source-of-truth rows

| concept | current source of truth | major consumers | competing definitions? |
|---|---|---|---|
| learner level | `nextRecommended(...).stageNumber`, the stage of the first incomplete rung (`session.ts:256`) | the session fallbacks; the Skills screen's opening filter | yes: the rung's own options (up to 5.3 at Stage 3), `CORE_SONG_REACH` (stage + 2.0, core only), Entry 56's stage maximum + 0.7 (a one-off script), the placement's `startAt`; no measured learner ability exists |
| difficulty | catalog `level` (from `pdmx.json` for this piece) | labels on five screens, session fallbacks, swap tiers, `rungForLevel`, `validate`/`candidates`/`rung_audit` | yes: the current model's reading (5.06), the CSV proxy (5.7), the quarry band (4), `levelOverrides` (device-local), the port (imports only); the features underneath stop at `pdmx.json` |
| skill | for this piece, none: `concepts: ["repertoire"]` is not a lesson concept. Skills-screen state is the self-assessed skill row, plus "unseen" becoming "learning" when an item carrying a lesson concept passes | Skills screen | yes: the item concept vocabulary (`concepts_for`'s five flags, none of them a lesson concept) against lesson concepts against the rung's concepts (neither minuet carries any of classical.3's three) |
| mastery | `progressStore.recordRun` (one master-eligible run and two pass dates) | status "mastered", which feeds the Repertoire slot and ends review | yes: `02` Part G (97 % at 100 % twice on different days, in Tempo mode) against the code (one eligible run plus any other pass date; Wait runs count); the rungs' `mastery.custom` free text, mostly unenforced |
| performance evidence | `ProgressRow` and `SessionRow` | `lessonComplete`, `reviewQueue`, the Repertoire slot, the Progress screen | yes: `SessionRow.lessonId` records the judging rung, and `lessonComplete` ignores it and credits the pass on every rung |
| repertoire level | as difficulty, plus the rung's `levelBand` and the finder's `levelWords` | as difficulty; `validate`, `candidates` | yes: [2.4, 5.3] (the span of the options), "elementary, Grade 1 to 2" (the finder; Stage 4–5 by `02`'s map), Stage 3's "initial / grade 1", `abrsmGradeApprox` 2 on the sibling (no reader) |
| curriculum stage | the stage file the rung lives in (`stage-3.json`) | `nextRecommended`, learner level, Entry 56's maxima | yes: `level`'s integer part claims a stage too (`rungForLevel` reads 5.23 as "Stage 5 · unit 5.2", and the folder browser says "around Stage 5") while the lesson places the piece at Stage 3 |

---

## Findings

**Top three:** P0-1, P0-2, P1-1.

### P0-1 · A run is judged by the first rung that lists the item, and its pass completes every rung that lists it

- **Current implementation:**
  - `selectors.ts:29–40`: `lessonForItem` returns the first rung.
  - `ScoreScreen.ts:2225–2231`: `findRung` ignores `fromRung`, which is available at `:219`.
  - `ScoreScreen.ts:2412`: `masteryCriteriaFor(rung)`.
  - `ScoreScreen.ts:2476`: the run is recorded with `lessonId: rung.id`.
  - `selectors.ts:176–204`: `lessonComplete` counts `passed.has(id)` on any rung.
  - `PassRecord` (`types.ts:337`) has no rung field.
- **Why it matters to a learner.** The Petzold opened from classical.3 is held to 3.4's 85 %. One
  pass then completes the song requirement of classical.3 (90 %), 4.4 (97 %), one of the two
  pieces for the 4.6 performance capstone, and 4.7 (from memory). The learner is told the Stage 4
  capstone's piece is done by a run that was never held to that rung's numbers.
- **Evidence.** Observed in the code and in the built curriculum: 53 of the 181 items on more
  than one rung (25 songs) are affected, under the counting rule stated in Q5. Not run.
- **Alternative explanation.** An item-level pass is the intended meaning ("a passed piece is
  passed"), and the rungs' higher numbers are aspirations. Against it: `05` §9a's rule, "a run
  judged for a rung uses that rung's numbers", and the whole purpose of 4.7.
- **Direction.** *Local:* judge by the route's `from` rung when there is one. *Model change:*
  derive rung completion from the stored runs against each rung's own criteria (`SessionRow`
  already holds mode, accuracy and tempo), so that a pass means an item against a set of
  criteria, not a flag.

### P0-2 · "Passed" and "mastered" record a tempo nobody measured, and mastery needs one master-level run

- **Current implementation:**
  - `Scoring.ts:184`: `judged` includes Wait.
  - `PracticeEngine.ts:1308`: `tempoPct` is the slider's value.
  - `ScoreScreen.ts:2527`: the summary prints it as "% of written".
  - `settingsStore.ts:127`: Wait is the default with a piano.
  - `progressStore.ts:143–144`: *mastered* on an eligible run once two pass dates exist.
- **Why it matters to a learner.** For a piano learner on the default mode, the rung's
  `minTempoPct` is decided by where the slider sits. "Tempo 80 % of written" on the summary is a
  statement about the playing that is not true of it. Part G's pass is in Tempo mode, and its
  master is 97 % at full tempo twice.
- **Evidence.** Inferred from the code, not run. The unit test covers only the path where both
  runs are eligible. The discriminating tests:
  - A Wait run with the slider at 100, played slowly: the summary and the row both say 100 %.
  - `recordRun(passed, not eligible, day 1)` then `recordRun(eligible, day 2)`: Part G expects
    *passed*, and the code gives *mastered*.
- **Alternative explanation.** Wait passes are meant as note-learning passes. If so, they should
  be named that way, and kept out of `masterEligible` and out of rungs that state a tempo.
- **Direction.** Local fixes in two places. The model change is the same as P0-1: store what was
  measured, and evaluate each set of criteria from it.

### P1-1 · Neither side of a dimensional match exists: the learner model has no dimension and discards what the run measured, and the item's dimensions stop at `pdmx.json`

- **Current implementation.** `import_pdmx.build_item` drops `features`, and `build.py:366–371`
  says so. `SessionRow` has no hot spots and no timing. No selector reads run numbers.
- **Why it matters to a learner.** "Easy to read, hard in rhythm" cannot change what the learner
  gets: nothing knows the piece's rhythm demand at runtime, and nothing knows the learner's
  rhythm trouble. It is the same for repertoire and for exercises.
- **Evidence:** Q2 and Q5.
- **Direction: a model change, and the smallest one.** Store the run's per-bar misses, wrong notes
  and timing, which are already computed, and carry the feature vector, or a few named dimensions,
  into the catalog. The swap sheet is the first reader. Not a conversion function between the
  numbers.

### P1-2 · An excerpt cannot be a learning experience

- **Current implementation, evidence and cuts:** Q4.
- **Why it matters.** A Stage 3 learner cannot be given bars 17–24 of a Stage 5 piece as an item
  that has its own level, pass and progress. The workaround, one file per excerpt, loses the link
  back to the piece.
- **Direction.** A model change: an item that points at a file *and* a bar range, with its own
  level and concepts, whose progress can count toward the parent. It is the shape the plan's
  Wave D already names. This one is the owner's decision.

### P1-3 · There are two definitions of `level`, and seven numbers for one piece

- **Current implementation, evidence and direction:** Q1. `level` is both an address (stage.unit)
  and a regression target, and the stored level, the model's current reading and the folder proxy
  compete as "this piece's estimated difficulty".

### P1-4 · The swap sheet's concept tier is a level window for every PDMX piece

- **Current implementation:** `selectors.ts:294–313`. "repertoire" is on all 542 PDMX items and on
  nothing else.
- **Direction.** Make tier 3 match on the rung's concepts or on measured dimensions. Until then,
  call it "about this level".

### P1-5 · Four rules say what suits a Stage N learner, and Stage 3's ceiling is set by exceptions

- **Current implementation:** Q1 row 13. The four judged rows that set Stage 3's maximum, which
  Entry 56 admits pieces against, are all admitted exceptions to the core reach rule (Q3).
- **Direction.** One rule, and anchors that are not drawn from exceptions.

### P2-1 · An invented tempo is printed as written

- **Current implementation:** `convert.py:1432` inserts ♩ = 96 as a visible mark. The
  `tempo-defaulted` tag has no reader. 176 of the 542 PDMX rows are affected.
- **Why it matters.** This piece's pass tempo is 80 % of a number no editor wrote: 77 bpm, against
  the Petzold's 101.
- **Direction.** Print nothing, or print it as "(suggested)"; read the tag, and have the Score
  screen say so.

### P2-2 · The rung's options contradict its finder, and nothing compares a piece's needs with what the ladder has taught

- **Current implementation.** The *Écossaise* is right hand alone and the K. 331 theme is
  arranged with an accompaniment, against the finder's words. The two minuets need concepts
  taught at 4.5, classical.4 and classical.5.
- **Direction.** Add a check of the concepts a piece needs against the concepts taught before its
  rung, once the `notation` block records tuplets, grace notes and ornaments. The rung could then
  order its options by it.

### P2-3 · The Score screen's side panel beside Anh. 113 describes the Petzold

- **Direction.** Lesson prose that names its pieces generically, or per-piece notes
  (`teaching.notes` exists for this).

### P2-4 · No `teaching.sections` for this piece

- **Current implementation.** `sections.json` accepts PDMX ids, but this piece has none, so the
  lesson's "four bars at a time" has no named ranges.
- **Direction.** The architecture supports this today.

### P2-5 · The Repertoire slot offers a mastered piece every session

- **Current implementation:** `session.ts:326–340`. Part G says every 30 days or so.

### P2-6 · `levelBand` is not printed, though `02` and the schema say it is

- **Current implementation.** Two searches of `app/src` found only `ShelfScreen.ts:139` reading
  it. The build fails over bands that only the paper-piece default reads, and that default is 2.4
  for a minuet rung.

### P3-1 · An internal id on Today's screen

- **Current implementation.** Today's *New* row shows "Lesson classical.3 — Baroque and Classical
  dances" (`session.ts:322`, rendered at `TodayScreen.ts:330`). Not seen rendered.

### P3-2 · `levelFrom: "model"` carries no version

- **Current implementation.** 308 rows are an older model's output, by policy.

### P3-3 · Two comments disagree about leaving mid-run

- **Current implementation.** `ScoreScreen.ts:3476–3478` says leaving the screen draws a summary.
  `ScoreSession.ts:811–813` swallows a finish that arrives during `stop()`. One of the two is
  wrong; which one was not run.

### P3-4 · The pass bar a learner is told is not the one they are judged by

- **Current implementation.** The Settings screen's "A pass needs accuracy %" is not the bar a
  piece on a rung is judged by, and the summary never states the bar that decided its title.

**Adjacent, recorded and not followed.**
- Rung `mastery.custom` rules such as 4.6's "two-pieces-performance-mode>=0.9" and 4.7's "blind
  at >=0.9" are not enforced; only technique measures are.
- "Know it" (`selfPass`) completes a rung's song requirement on any rung, including rungs whose
  rule demands a measurement. The self-pass guard covers paper options only
  (`selectors.ts:186–188`).

---

## What is unverified

- **Nothing was heard:** not the edition's faithfulness to Anh. 113, its 12 + 20 bar form, its
  tempo, or the musical worth of the three cuts.
- **No screen was seen.** Every on-screen statement is read from code: the labels, the summary
  lines, the Today reason string, and the positional *New* pick. That seed 0 lands on the Petzold
  is my reading of `fillSlot`.
- **P0-2's behaviour is inferred from code;** no test was run.
- **The TypeScript port's number** for this file was not computed.
- **The excerpt levels** come from music21 slices with the 96 tempo carried into each one. The
  anchor feature ranges are Entry 51's table, not re-measured.
- **The Petzold's 5.1** is taken as a person's judgement because `musetrainer.json` types it,
  derived from grade 2. Who judged it, and how, is not recorded there.
- **Whether a person ever read this piece's placement.** The record mentions the id twice
  (Entries 51 and 56), both times in lines of measurements, and the placing commit says every song
  was attached by band.

## Files read

- **Briefs and method:** `docs/prompts/tasks/T36b-trace-repertoire.md`,
  `docs/prompts/operating-procedure.md`, `docs/prompts/audit-2026-09-25-outside.md`,
  `docs/prompts/plan-2026-09-25.md`, `CLAUDE.md`.
- **Record:** `docs/pending-review.md` (the 2026-09-17 standing context, Entry 4's opening,
  Entry 51's opening sections, Entry 53 §1–§5, Entry 56 §1–§3 and its follow-ups);
  `docs/decisions/2026-09-15-pedagogical-quarry.md`;
  `docs/decisions/2026-09-06-p14-pdmx-quarry.md` (the levelling model, the band note);
  `docs/03-content-pipeline.md` §3 (grep) and §3b; `docs/02-curriculum.md` (lines 14–30, Part G);
  `docs/05-score-follow-engine.md` §2 and §9a.
- **Content:** `content/sources/pdmx.json` (the rows for this piece and its siblings),
  `content/sources/level-model.json`, `content/sources/pdmx-csv-level.json` (header),
  `content/sources/musetrainer.json` (the Petzold's row and header),
  `content/sources/sections.json` (header and counts), `content/sources/pdmx-wants.json` (comment
  and the rock rows), `content/catalog.schema.json`, `content/curriculum.schema.json` (the lesson
  definition), `content/curriculum/stage-3.json` and `stage-4.json` (rungs), `stage-0..9.json`
  (stage headers), `content/lessons/classical.3.md`, `content/lessons/3.3.md` (grep).
- **Built:** `app/public/content/catalog.json`, `app/public/content/curriculum.json`; both scores
  (`dump_score.py` and the raw MusicXML); `build/pdmx/picks-candidates.json`,
  `picks-review.csv`, `quarried.json`, `library/library.json` (one row each, by cid);
  `build/genre-plan.md` (the rock lines).
- **Tools:** `tools/content/difficulty.py`, `fit_level_model.py` (the head),
  `import_pdmx.py`, `validate.py` (`level_band_errors`, `CORE_SONG_REACH`, `CORE_REACH_PLAN`,
  `notation_requirements`, the needs pass), `candidates.py` (the head), `build.py`
  (`attach_notation`, `attach_sections`), `convert.py` (the tempo insertion),
  `pdmx/shortlist.py` (`band_for`), `pdmx/README.md`, `README.md`, `dump_score.py`.
- **App:** `app/src/curriculum/selectors.ts`, `session.ts`, `rungFor.ts`, `types.ts` (grep);
  `app/src/data/progressStore.ts`, `levelOverrides.ts`, `db.ts` (the row types),
  `folderLibrary.ts` (the level patch), `settingsStore.ts` (grep);
  `app/src/engine/Scoring.ts` (lines 1–240), `PracticeEngine.ts` (lap, stop, buildScore),
  `prepareSession.ts` (the run range); `app/src/score/difficulty.ts` (the header),
  `estimateImport.ts`, `ScoreSession.ts` (stop and the finish forwarding), `trimMusicXml.ts`
  (the head); `app/src/ui/screens/ScoreScreen.ts` (rung, side panel, summary, loops, dispose,
  mode), `LessonScreen.ts` (option rows), `LibraryScreen.ts` (the detail sheet, import),
  `ShelfScreen.ts` (the band use), `SkillsScreen.ts` (`buildConcepts`), `TodayScreen.ts` (seed,
  rows), `PlanScreen.ts` (grep), `widgets.ts` (`levelLabel`), `router.ts` (`loop`);
  `app/tests/unit/progressStore.test.ts` (the mastery tests).
- **CI:** `.github/workflows/pages.yml`.
- **Git (read-only):** `git log -S` and `git show --stat` for commit `2aef1c0`.
