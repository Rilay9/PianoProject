# T36c — One sight-reading run, from the level request to the next assignment

2026-09-25. Read-only trace; nothing under `app/`, `content/` or `tools/` was changed.

**How it was done.** I read the code on the spine and ran two things from the source with
Node's type stripping (no build, no browser, no Playwright): `generateSightReading` for two
seeds at every level with each catalog row's own parameters, plus counts over seeds 1–500 per
level; and `buildSession` / `nextRecommended` over the shipped `app/public/content/catalog.json`
and `curriculum.json` at eleven placements. The counts are deterministic from the seeds, so
anyone can reproduce them. **Nothing was rendered and nothing was heard.** Every musical
judgement below is from the notation as data, and says so where it matters.

---

## Judgement, in five lines

1. Today a sight-reading run teaches the app one thing it acts on: whether a completed run of
   that catalog row cleared the first listing rung's accuracy and tempo floor. That pass counts
   towards rung completion and puts the row on the 1/3/7/21-day review calendar. If the run
   carried today's seed, it also ticks the daily streak.
2. Nothing the learner plays changes the next phrase. The generator level is a constant in each
   catalog row. Today's read is chosen by the curriculum stage number. The session's reading
   slot takes an arbitrary member of the pool at or below the stage, by catalog order: level 3
   every day at Stages 5–9 by default, and level 1 at Stage 4. Per-note, per-bar and timing
   evidence is shown once and thrown away, and the seed is not kept.
3. The phrases are narrower than their labels and noisier than their levels. Every phrase in
   the app is C major, 4/4, 72 bpm. The rungs and tags that promise keys, 6/8, syncopation
   (level 3), accidentals and skips (level 1) get none of them. Levels 2–4 carry syncopation
   nobody planned (74–100 % of phrases), and the notation of levels 6–7 is malformed in most
   phrases.
4. To learn from a run, the app would need to keep each phrase's parameters, its seed and a
   small error profile (which bars; wrong or missed; early or late by rhythm; misses after
   leaps or outside the hand position). A per-learner reading state would then move the
   generator's constraints one dimension at a time, instead of the curriculum stage choosing a
   catalog row.
5. Truth comes before adaptivity. First make each phrase contain what its rung and tags claim
   and nothing hard they do not claim, and record first-attempt evidence per phrase. Selection
   that adapts is worth building only on phrases that are valid for their level.

---

## The causal model

```
catalog row (content/catalog.static.json)                        curriculum position
  drill.params.level  (1–7, generator constraints)                 stageNumber of first incomplete rung
  item.level          (stage.decimal, hand-judged: 1.5 … 7.5)      (session.ts nextRecommended)
  concepts            (hand-written claims: "6/8", "keys" …)             │
        │                                                                 │
        ├── Today daily:  hardest row with item.level <= stageNumber ◄────┤  (TodayScreen.dailyItemFor)
        ├── session slot: rows tagged sight-reading, item.level <= stage, ◄┘  pick by (seed+slot) % n
        └── rung:         the row listed in lesson.exerciseOptions
        │
        ▼
ScoreScreen.generateSightReadingFor: passes level, hands, bars, seed  (never fifths, timeSig, bpm)
        ▼
generateSightReading → MusicXML (C major, 4/4, 72 bpm, always)   seed + params dropped: only .musicXml returned
        ▼
Score screen, Tempo mode at open → engine → SessionScore {per-note, hotSpots, timing, totals}
        ▼
evaluateOutcome(accuracy, tempoPct) vs the FIRST rung that lists the row (lessonForItem)
        ▼
summary sheet (numbers)  ──►  recordRun: progress row {best accuracy, best tempo, attempts,
                                          status, passedOn}  + session row {accuracy, tempo, wrong,
                                          missed, duration, mode}  + daily day if seed == today's
        ▼
next assignment: same row tomorrow (daily); same pool index (slot); review calendar if passed;
rung completion if passed. No field of the run above reaches the choice of the next phrase.
```

---

## The trace

The two objects, followed together:

- **Entry 1, the daily read.** Learner on rung 2.2 (Stage 2). `TodayScreen.dailyItemFor(2)`
  returns `drill.reading.sight-reading-1-left`, the hardest row with `item.level <= 2`
  (`TodayScreen.ts:379–384`, fed from `:608`). It opens via
  `router.navigateScore(id, { seed: dailySeed(dayKey(now)) })` (`:396–399`). Today's seed is
  2412934129.
- **Entry 2, a rung drill.** Rung 2.2, "Eighth notes and counting", offers
  `drill.reading.sight-reading-2-right`, whose params are `{ "level": 2, "bars": 4,
  "hands": "right" }`, catalog `level` 2.2 and concepts `sight-reading, eighths, skips`
  (`content/catalog.static.json:1951`). The same row sits on 2.5. Opened from the rung or the
  Library, it carries no seed, so the generator draws one with `Math.random`.

### 1. The level request

- **Structure.** A catalog row: `drill.params.level` (the generator's number), `item.level`
  (stage.decimal, `levelSource: "judged"`) and `concepts`. There are nine rows
  (`catalog.static.json:692 … 3945`).
- **Source of truth.** Hand-authored JSON. No tool derives or checks either number: I searched
  `tools/` for `sight`, and the hits in `validate.py` concern lab presets only. The
  nineteen-feature level model cannot see a generated phrase, because there is no file.
- **Lost.** Every dimension except the one number. The row cannot say "this learner's key
  reading is weak".
- **Assumed.** That `item.level` and `stageNumber` are on one scale (`item.level <=
  stageNumber`), and that the learner's reading ability equals the stage of the first unfinished
  rung.
- **Recomputed elsewhere.** Yes, twice with different rules. The daily read takes the hardest
  row at or below the stage. The session slot takes `pick(pool, seed + slotIndex)` over the
  same pool in catalog order, plus the two transposition drills, which carry the same tag
  (`session.ts:358–372`, `:236–239`). A test re-implements the daily rule instead of calling it
  (`lessonClaimsAboutApp.test.ts:1407–1420`).

### 2. The generator options

- `generateSightReadingFor` (`ScoreScreen.ts:158–170`) passes `level`, `hands`, `bars` and the
  route `seed`, and returns `.musicXml` only.
- **Lost here.** `fifths`, `timeSig` and `bpm` are never passed, so the generator defaults them:
  `fifths ?? 0` clamped (`sightReading.ts:561`), 4/4 (`:562`), 72 bpm (`:564`). All nine
  catalog rows carry only `level`, `bars` and `hands`, so the key, metre and tempo columns of
  the level table are dead in the app. The generator itself supports them: unit tests cover
  "honours a flat key" and "supports 6/8 at level 4" (`tests/unit/sightReading.test.ts:211,
  220`). The result's `seed`, `level`, `fifths` and `melody` are discarded at `.musicXml`, so a
  fresh-seed phrase cannot be reproduced once the screen closes.
- **Next stage gets enough?** For rendering, yes. For evidence, no.

### 3. The level table's constraints

This is what `level` controls, from `LEVELS` (`sightReading.ts:145–238`), `pickRhythm`
(`:310–341`), `buildRightHand` (`:351–465`) and `buildLeftHand` (`:481–548`):

- **Right-hand and left-hand ranges.**
- **A rhythm palette.** Durations are drawn uniformly per cell, with no rule about where in the
  bar a length may start.
- **A leap cap in scale steps.** The draw is `round((u·2−1)·L)`, near-uniform on −L…L, and zero
  is mapped to +1. So repeated notes come only from range clamping and the homing rule, and the
  walk is biased upward (up with probability (2L+1)/4L: 3/4 at level 1).
- **Hands.** R, or both.
- **Left-hand texture.** None, a whole-note root, a block triad, Alberti, broken or walking.
  The pattern is built from the lowest tonic in the range: C2 at levels 5–7.
- **A key ceiling** (`maxFifths`). It clamps a requested key and never draws one.
- **Ties** (25 % at a barline) **and rests** (12 % per note).
- **Syncopation** (35 % of bars open with an eighth rest, levels 5+).
- **Triplets** (25 % per beat, levels 6+).
- **Chord-tone snapping on beats 1 and 3** (levels 5+ only).

Level does **not** control the key or metre (never requested), the tempo, the phrase length
(the row's `bars`), phrase structure, cadence, repetition, or the register of the left-hand
pattern.

- **Spec disagreement.** `05` §8 says level 2 is "alternating hands", with LH C3–G3. In the
  code, level 2 with `hands: both` is hands together over a whole-note root. `05` §8 also says
  level 3 has "RH chord tones on strong beats", which the code does not do below level 5
  (`sightReading.ts:241–249`: "Levels 1–4 do not use it … changing that would change music the
  goldens already describe"). The unit goldens pin levels 5–7 only
  (`sightReading.test.ts:322–331`). I did not look for picture baselines that might pin 1–4.

### 4. The music

Two seeds at the rung's level (level 2, RH, 4 bars):

| seed | bar 1 | bar 2 | bar 3 | bar 4 |
|---|---|---|---|---|
| 1 | C4 𝅗𝅥 · D4 ♪ · C4 ♩ · D4 ♪ | E4 𝅗𝅥. · D4 ♪ · C4 ♪ | C4 𝅗𝅥 · D4 ♩ · E4 ♩ | F4 ♩ · E4 ♩ · D4 ♪ E4 ♪ C4 ♪ C4 ♪ |
| 2 | C4 𝅗𝅥 · D4 ♪ E4 ♪ · F4 ♩ | E4 𝅗𝅥. · F4 ♩ | E4 ♩ · G4 ♩ · E4 𝅗𝅥 | G4 ♪ · E4 𝅗𝅥. · C4 ♪ |

What a learner meets:

- Seed 1, bar 1: a quarter on the "and" of 3, which is syncopation.
- Seed 2, bar 4: a dotted half from the "and" of 1 to the "and" of 4, written as one note
  across the middle of the bar. The phrase then ends on an eighth on the last off-beat.
- Both stay within C4–G4. Over 500 seeds, half of the level-2 right-hand phrases do not
  (table below).
- Neither contains a skip in bars 1–2. Seed 2 has thirds in bars 3–4.

Today's daily for Entry 1 (level 1, left hand): C3 𝅗𝅥 D3 𝅗𝅥 | C3 𝅗𝅥 C3 ♩ D3 ♩ | C3 𝅝 | C3 𝅝.
That is two notes, no eighths, for a learner whose rung is about eighths.

**Counts over seeds 1–500 per level, each at its catalog row's hands and bars:**

| level | intervals | leaves C4–G4 | quarter-or-longer event starting off the beat | last note on beat 1 / shorter than ♩ | RH on beats 1 & 3 outside the LH bar's triad | malformed triplet rest |
|---|---|---|---|---|---|---|
| 1 (R, 4) | 2nds 86 %, unison 14 % | 0 % | 0 % of phrases | 31 % / 0 % | n/a | n/a |
| 2 (R, 4) | 2nds 60 %, 3rds 27 %, unison 13 % | 50 % | 74 % of phrases | 0 % / 47 % | n/a | n/a |
| 3 (both, 8) | adds 4ths 11 %, tritone 2 %, 5th+ (via ties) 0.7 % | 97 % | 98 % | 0 % / 54 % | 46 % | n/a |
| 4 (both, 8) | adds 5ths 10 %; 6th–8ve (via ties) 1.1 % | 100 % | 100 % | 0 % / 52 % | 51 % | n/a |
| 5 (both, 8) | 6ths 8 % | 100 % | 100 % | 0 % / 55 % | 7 % | n/a |
| 6 (both, 8) | as 5 | 100 % | 100 % | 0 % / 63 % | 7 % | **87 %** |
| 7 (both, 8) | 7ths 7 % | 100 % | 100 % | 0 % / 78 % | 7 % | **89 %** |

Notes on the counts:

- **Beyond the leap cap.** The 5ths, 6ths and octaves at levels 3–4 exceed `maxLeap`. The
  tie-closing pass (`sightReading.ts:444–458`) overwrites the next bar's first pitch after the
  walk has already chosen the note that follows it.
- **The triad column.** It takes the LH root's diatonic triad as the harmony. At level 3 the
  left hand plays only the root, so that triad is my reading. A random diatonic note is outside
  a given triad 4/7 of the time, so levels 3–4 are close to chance.
- **The malformed rest.** A random rest inside a triplet is written as a plain eighth rest with
  a triplet's duration and no `<time-modification>`. Its tuplet start or stop is lost
  (`sightReading.ts:388–393` drops `cell.tuplet`). The writer's own contract says such a
  duration "is only right when `<time-modification>` goes with it" (`musicXmlWriter.ts:335–338`).
  The bar's durations still add up.
- **Two rests in a row.** 20–56 % of phrases at levels 3–7 contain two consecutive rests, for
  example two eighth rests where a quarter rest belongs.

- **Lost at this stage.** Any statement of what the phrase is for. The title,
  `Sight-reading level N · seed S`, is in the XML and is not drawn (`OsmdView.ts:170`).

### 5. The Score screen

- A fresh screen per navigation (`AppShell.ts:253–261`). Tempo mode is set after the defaults
  (`ScoreScreen.ts:3320`). Beyond that, sight-reading is special-cased in exactly four places
  (`:2464`, `:3129`, `:3141`, `:3320`).
- The mode select, *Hear it*, *Start again*, the tempo slider, loops and the R/L/Both hands
  focus are all available on a sight-read.
- The side panel and the grading use the *first* rung that lists the row (`lessonForItem`,
  `selectors.ts:29–40`). `sight-reading-2-right` is judged by 2.2's 90 %/85 % even when opened
  from 2.5.
- The screen title is the catalog title, "Sight-reading generator, level 2, right hand"
  (`:3096`). The Today row shows `L2.2`. Two different numbers are both called level.

### 6. The engine

`SessionScore` (`engine/types.ts:333–440`) knows:

- every note played: pitch, velocity, time, matched step, ok, `deltaMs`, release;
- hits, wrong notes and misses in total;
- `hotSpots` per bar (misses, wrongs);
- timing: n, signed mean, SD, median, early %, late %, and a histogram.

It could tell a wrong note from a missed one, and a late note from an early one. Because each
wrong note carries the step it was judged against, it could also recover the interval that was
misread. None of that is computed.

### 7. Grading

`evaluateOutcome` (`Scoring.ts:180–196`) reads `accuracy` and `tempoPct` only:

- pass means accuracy ≥ the rung's `minAccuracy` and tempo ≥ its `minTempoPct`;
- master-eligible means ≥ 97 % at 100 %.

The tempo floor is a share of a fixed 72 bpm. That sits awkwardly beside the app's own
instruction, "One phrase you have never seen, once, slowly" (`TodayScreen.ts:416`), because a
run below 80 % (rung 1.5) or 90 % (rung 4.6) of 72 bpm cannot pass.

**"First attempt only"** (`ScoreScreen.ts:2461–2468`) is a counter, `sightReadAttempts`
(`:333`), that starts at 0 on every screen mount and rises only when a run reaches the summary.
Three things follow:

- A stop, a restart or *Hear it* is not reported to the screen (`ScoreSession.ts:275–285`), so
  it never counts as an attempt.
- Re-opening today's read regenerates the identical phrase from the date seed, and its first
  completed run is recorded as a first attempt again.
- A mode switched to Wait is recorded like any other run.

The rung's `mastery.custom` rules, `"sight-read-5-first-attempt>=0.9"` (1.5) and
`"sight-read-5>=0.85"` (3.4), are read only by the syntactic paper gate `demandsMeasuredAccuracy`
(`selectors.ts:166–169`). I searched `app/src` for `sight-read-5` and `first-attempt`, which
returned no hits, and for `.custom`, which returned only the paper gate and
`demandsTechniqueMeasure`. Lesson 1.5's "Five generated melodies at 90 % accuracy or better on
the first attempt" is therefore not what completes the rung. One pass of the row counts as one
of its two exercises.

### 8. The summary

The learner reads (`ScoreScreen.ts:2496–2619`):

- a heading: `Mastered`, `Passed` or `Run finished`;
- `Accuracy 88%`;
- `Tempo 100% of written`;
- `Wrong notes 2`;
- `Missed 1`;
- `Weakest bars 2, 3`;
- `Timing 12 ms off the beat on average, 40% of them early`;
- on any later run: `Sight-reading counts on the first attempt only — this run is not
  recorded.`;
- buttons: `Again`, `Slower (−10%)`, `Faster (+10%)`, `Loop the weak bars`, `Done`.

The "off the beat on average" figure is the **signed** mean (`Scoring.ts:40–52` via
`util/stats.ts:20–35`). A learner scattered ±100 ms either side reads "0 ms off the beat on
average".

Without a piano the sheet asks `How did it go?`, with Rough / OK / Clean, and answers
`Recorded: Clean`. Nothing is recorded (`:2631–2636`): `selfReport` is never passed to
`recordRun`.

There is no coaching sentence. `coaching.ts` is imported only by `DrillScreen.ts:69`. Every
action button re-runs music the learner has now seen, and there is no "another phrase".

### 9. The progress row

`recordRun` (`progressStore.ts:124–178`) writes three things:

- **The progress row**: `status`, `bestAccuracy` (a max over runs), `bestTempoPct` (passing
  runs), `attempts`, `passedOn` dates, `minutes`.
- **A session row**: accuracy, tempo, wrong, missed, duration, mode, rung id, time. There is no
  seed, no hands and no hot spots.
- **`markDailyRead`**, when `seed === dailySeed(today)`, whatever the accuracy (`:131`). The
  streak is `dailyReadStreak` (`:462–472`).

The seed exists only to tick the day. The hands focus is not stored, so a two-hand row can pass
on one hand. The row's id stands for a generator configuration, so a pass on one phrase is a
pass of every phrase that configuration will ever write.

### 10. What the session builder offers next

Observed by running `buildSession` over the shipped content, with no progress rows and the
placement set:

| placement → stage | daily read | 30- and 60-min slot, Shuffle 0 / 1 / 2 | also on the card |
|---|---|---|---|
| 0.1, 1.1 → 0–1 | sight-reading-1 (L1) | no slot: the pool is empty below 1.5 | — |
| 1.5 → 1 | sight-reading-1 | no slot | the "Warm-up in the keys you are working in" row is sight-reading-1 |
| 2.2 → 2 | 1-left (L1, LH) | 1 / 1-left / 1 | warm-up row = 2-right (L2) |
| 3.4 → 3 | 2-right (L2) | 1-left / 2-right / 1 | |
| 4.5 → 4 | 2 (L2 both) | **1** / 1-left / 2 | warm-up row = 3 at Shuffle 1 |
| technique.5 → 5 | 4 | **3** / 4 / 1 | warm-up row = 4 |
| Stage 6–9 | 5, 6, 7, 7 | **3** / 4 / 5 at every stage | the 120-min slot at Stages 7–9 can be a transposition drill |

What else changes the next assignment:

- **A pass.** It puts the row in review, "Due for review today", after 1, 3, 7 and 21 days
  (observed). The review opens a fresh phrase from the same row.
- **Mastery.** Two ≥97 % runs on different days make the row "mastered". It then fills the
  review slot as "Nothing due — keeping something warm" (observed), and the repertoire slot can
  offer it as "A piece you know".
- **The daily read** ignores the row's status entirely.
- **The stage** moves only when every rung of a stage is complete. A sight-reading pass is one
  exercise towards a rung.

---

## The six questions

### 1. What is the level, and who chooses it?

The number the generator receives is `drill.params.level` of a catalog row
(`ScoreScreen.ts:161`, its only reader in `app/src`; a second search for `params.level`,
`readingLevel` and `sight.*level` found only this reader and the transposition drill's own
use). Which row is chosen depends on:

- **Today:** `stageNumber`, the stage of the first incomplete rung after placement.
- **The session slot:** the same stage plus the Shuffle counter and catalog order.
- **A rung:** the author's choice.

There is no setting. The learner's history reaches it only as completion moving
`stageNumber`, and as a per-learner Library re-level (`levelOverrides.ts:71–79`), which changes
`item.level` and so which row the daily read picks, never `params.level`. **No reading
performance ever changes it.** This is the audit's point 3 made concrete, and it is **P1-a**
below.

**Constraints are not difficulty.** What `level` controls in the generator is listed at
stage 3 of the trace. Nothing establishes that a phrase under level-N constraints suits a
learner at any particular point:

- `item.level` is declared (`levelSource: "judged"`), not measured.
- No check relates the generated output to the rung it sits on, beyond three spot claims in
  `lessonClaimsAboutApp.test.ts`: eighths appear in six level-2 seeds; the level-2 range is
  C4–C5; the daily pick at Stages 3 and 4.
- The rows' tags contradict their music: see P0-a.

The numbers are read in three ways:

1. `params.level` as **constraints on the exercise** (`ScoreScreen.ts:161`).
2. `item.level` as **the exercise's difficulty** (`TodayScreen.ts:383`, `session.ts:365`, the
   swap fallback at `session.ts` `swapOptions`, and the `L2.2` label).
3. `stageNumber` as **the learner's ability** (`session.ts:256`, `TodayScreen.ts:608`).

The comparison `item.level <= stageNumber` treats the second and third as one scale. The
generator's own number is never read as ability. It is tied to ability only through a
hand-written `item.level` per row. Rung 4.6 (Stage 4) offers level 4, while the daily read for
the same Stage-4 learner is level 2 and the default session slot is level 1.

### 2. What the level table trains

Read as a teacher would read it. "Designed" is the table; "arrives unplanned" is from the
counts above.

| level | new reading demand, designed | arrives unplanned | claimed by rung or tag and absent |
|---|---|---|---|
| 1 | Treble C position, steps, ♩ 𝅗𝅥 𝅝, start and end on C | repeated notes from homing; upward bias | "skips" (tag; rung 1.5 is *Steps and skips*): the leap cap is 1 |
| 2 | ♪ and dotted 𝅗𝅥, thirds, range to C5, LH whole-note root when both hands | syncopation in 74 % of phrases; half of phrases leave C position on rung 2.2, before thumb-under (2.5); endings on a short off-beat | the "alternating hands" of `05` §8 |
| 3 | Fourths, ties, rests, 8 bars, LH roots | syncopation in 98 %; tritone F–B; RH ignores the LH harmony | "syncopation", "6/8" (tag; rung 4.5 is *Compound time, triplets and syncopation*); `05` §8's chord tones |
| 4 | Ledger lines both sides (A3–G5), fifths, dotted ♩, LH block triads | 100 % syncopated; 6ths–octaves via ties; RH/LH clash ~50 % | "accidentals"; the table's "keys to 2♯/♭" |
| 5 | Alberti eighths from C2, designed syncopation, sixths, two octaves, chord tones | LH two ledger lines below the bass staff | "keys" (3 accidentals) |
| 6 | Triplets, LH broken quarters | malformed triplet rests in 87 % | "keys" (4 accidentals) |
| 7 | Sixteenths, walking bass, sevenths | as 6 | — |

The progression is not sensible in its steps. 1→2 adds eighths, dotted halves, skips, range
beyond the five-finger position and, with both hands, the left hand. 3→4 adds ledger lines in
both clefs, three-note chords, fifths and dotted quarters. 4→5 turns a held chord into
continuous Alberti eighths *and* adds syncopation and sixths. Key, metre and tempo, three of the
dimensions a sight-reading syllabus is usually organised around, never move at all.

### 3. Error analysis

After a run the engine knows:

- which notes were wrong and which steps were missed;
- the timing delta of every matched note;
- misses and wrongs per bar;
- the early and late shares.

None of it becomes a reading diagnosis. Nothing asks whether an interval size is consistently
misread, whether a rhythm is consistently rushed, whether the learner hesitates after a leap or
at a ledger line, or whether one hand is to blame. The summary strings (trace stage 8) say *what
happened*, as totals and the weakest bars. They never say *what it probably means*. *What to do
next* is offered only as buttons that replay seen music (`Loop the weak bars`, `Slower`),
which is the wrong next step for sight-reading and is not recorded anyway. On the audit's
point 9: the first of the three, partly, and a misleading timing sentence at that.

### 4. Evidence kept

The progress row, the session row and the daily day, as listed in trace stage 9. The readers:

- `lessonComplete` (passes);
- `reviewQueue` (`passedOn`);
- `buildSession`'s mastered list;
- the Progress screen's history (session rows);
- `sessionsForItem`, whose only consumer is the drill screen's coaching (`progressStore.ts:267`).

**The seed is not kept.** `generateSightReadingFor` drops it for fresh opens, and the session
row has no field for it. So the header's promise ("a failed sight-read can be retried on
exactly the same music once, which is how you find out whether you actually learned it",
`sightReading.ts:5–7`) is met only on screen: *Again* re-runs the loaded phrase and records
nothing. **Nothing compares two attempts.** The one path that does reproduce a phrase, re-opening
today's read, records the retry as a new first attempt.

### 5. The next assignment

- The daily read is the same row every day until the stage changes, with a new seed each day.
- The session slot is the same row every day for a given stage and session length, unless the
  learner shuffles.
- A stage lasts months: Stage 3 has 16 units and Stage 4 has 17. So a learner on Stages 3–4
  reads the same level-2 configuration daily and level 1 in the slot for that whole time: C
  major, 4/4, 72 bpm.
- *Again* does not add evidence.

A teacher would not accept this as a six-month regimen, for these reasons:

- It never meets a key signature or a metre other than 4/4.
- It never gets easier after a bad week or harder after a good one.
- The session slot can go backwards (level 1 at Stage 4; level 3 at Stage 9).
- A single good phrase retires the configuration to a review calendar built for pieces.

What *is* right is a new, unseen phrase daily with a streak, which is the habit a teacher
wants.

### 6. The teacher's read

These are from the notation; I could not judge any of it by ear.

- **Level 1.** A stepwise line from C that returns to C, readable as a first exercise. Seed 1
  arches C–F and back. Seed 2 and today's phrase oscillate between two notes for four bars:
  a drill, not a phrase. The last note lands on beat 1 of the final bar in only 31 % of
  phrases.
- **Level 3.** A random walk that happens to be diatonic. Seed 1 runs C4 F4 A4 G4 E4 | F4 D4 C4
  E4 | F4 E4 F4 B4 | C5 (two eighth rests) C5 B4 C5 | … | C4 C4 C4 C4. It has no motif, no
  repetition, no half-way cadence, rests at random and a tritone leap. The last note is never on
  the downbeat. Over a plausible bass (I IV I IV IV I V I), the right hand ignores the harmony,
  with B4 against F3.
- **Level 6.** The left hand's broken chords give a harmonic frame (seed 1: I vi I V ii ii IV
  I), and beats 1 and 3 mostly fit it. The middle harmonies are drawn at random and a V–I close
  happens only by chance. The right hand is still a walk with no phrase grammar. 63 % of phrases
  end on a note shorter than a quarter, and most carry a triplet whose rest has lost its bracket.

Two things I could not judge without hearing them: whether levels 5–7 sound like music or like
an exercise at 72 bpm, and how an Alberti or walking bass in the C2 octave sounds on the owner's
piano. How OSMD draws the untupleted rest is unverified because nothing was rendered.

---

## Hypothesis status

**H1, the learner model is completion plus best numbers; the stage number stands in for level;
review is calendar-only. Supported by observed evidence, and sharper than stated.**

- For sight-reading, the next phrase reads **nothing** from sight-reading runs. The daily read
  ignores even the row's own pass or mastery. The session slot ignores all progress except
  "already on the card".
- The stage number is the only learner input (`session.ts:256`, `TodayScreen.ts:608`). The
  hot spots, timing and misses never leave the summary. Review is the 1/3/7/21 calendar
  (observed in `buildSession` output).
- The trace also finds a mismatch H1 did not name: **the evidence has the wrong shape.**
  Piece-shaped progress (a best score, pass, master, a review calendar) is applied to a
  generator configuration that writes a different phrase every time (P1-b).

**H2, feedback scores without diagnosing. Supported by observed evidence.**

- The summary gives totals, the weakest bars and a signed-mean timing sentence. There is no
  coaching on the Score screen.
- The one prescriptive action, `Loop the weak bars`, conflicts with sight-reading's premise:
  it practises seen music, and nothing is recorded.

**H3, difficulty has several definitions that collapse before selection. Supported by observed
evidence.**

- Three numbers are in play: `params.level` (a bundle of constraints), `item.level`
  (hand-judged stage.decimal) and `stageNumber`. Beside them sit hand-written `concepts` that
  describe a different bundle again.
- The learner sees two of the numbers on one screen ("level 2" and `L2.2`).
- The mapping between them is declared, never measured.
- The daily read and the session slot answer "which reading row for this learner" by different
  rules.

**H5, generators have invariants but no stated purpose, and no check that the target skill is
present or other hard skills absent. Partly contradicted, mostly supported.**

- *Contradicted*: the sight-reading generator does state a purpose per level, in `05` §8 and
  the `LEVELS` comments, and unit tests check several invariants: the level-1 range and steps,
  start and end on the tonic, chord tones at 5+, triplet markup, syncopation, the two-octave
  span, the key clamp.
- *Supported*: nothing checks that the rung's or tag's claimed skill is present (6/8,
  syncopation at 3, keys, skips) or that unplanned demands are absent (syncopation at 2–4, range
  beyond position at 2, leaps beyond the cap via ties). Nothing checks the notation of a rest in
  a triplet.

**The different problem the evidence points at.** Beyond "one number" (H3), the product's labels
and the generator's output have drifted apart with no test between them: the key and metre
columns of the table are unwired, and several tags describe music that is never made. The first
fault is not that the app does not adapt. It is that the phrase does not reliably train what the
rung says it trains.

---

## Source-of-truth rows

| concept | current source of truth | major consumers (this trace) | competing definitions? |
|---|---|---|---|
| **learner level** | none as such; `LessonPosition.stageNumber`, the stage of the first incomplete rung after placement (`session.ts:158–216`) | `TodayScreen.dailyItemFor` (`:379–384`, via `:608`); `session.ts fillSlot` `level` for every slot (`:256`); `simonForStage` | **Yes.** The daily read and the session slot turn the same stage into different reading rows; the placement changes it; the rung `levelBand` is a separate claim |
| **difficulty** | per catalog row: `drill.params.level` (generator constraints) **and** `item.level` (hand-judged stage.decimal) in `content/catalog.static.json`; learner-editable `levelOverrides` on `item.level` | `params.level` → `generateSightReadingFor` only (`ScoreScreen.ts:161`); `item.level` → daily pick, slot filter (`session.ts:365`), swap fallback, the `L2.2` label | **Yes.** Two numbers on one row, both called level on screen, with a hand-written mapping; neither is measured against the generated notation |
| **skill** | catalog `concepts` on the row; rung `concepts` | slot filter `concepts.includes('sight-reading')` (also catches transposition); `alternativesFor` tier 3 | **Yes.** The tags (6/8, syncopation, keys, accidentals, skips) disagree with what `LEVELS` makes |
| **mastery** | progress row `status` from `recordRun` (pass = the first listing rung's `minAccuracy`/`minTempoPct`; master = 97 %/100 % twice on different days) | `lessonComplete`, `reviewQueue`, the mastered list in `buildSession` | **Yes.** Rung `mastery.custom` and lesson prose ("five generated melodies at 90 % first attempt") against a single pass; "first attempt" per screen visit against per phrase |
| **performance evidence** | `SessionScore` in memory → `RunResult` → progress row + session row (+ daily day) | as above; the Progress history | **Partly.** The seed is used only for the daily tick and never stored; hands, hot spots and timing are lost; the self-report is shown as "Recorded" and not stored |
| **repertoire level** | (not touched) | | |
| **curriculum stage** | `curriculum.json` `stages[].number`, read through `nextRecommended` | the same readers as learner level | Same as learner level: in this trace they are one number |

---

## Findings

### Top three

**1. P1-a. The generator level is a per-row constant chosen by curriculum stage; nothing the
learner does moves the next phrase.**

- *Now:* `params.level` is hand-set per row, and `ScoreScreen.ts:161` is its only reader. The
  daily row comes from `item.level <= stageNumber` (`TodayScreen.ts:379–384`). The slot row is
  `pick(pool, seed + slotIndex)` over the ≤-stage pool in catalog order (`session.ts:358–372`,
  `:236–239`).
- *Why it matters:* for months at a stage, the learner gets the same configuration regardless
  of whether they read at 40 % or 100 %. The slot's arbitrary index can hand a Stage-9 learner
  level 3 and a Stage-4 learner level 1, and gives Stages 0–1 no slot at all.
- *Evidence:* the `buildSession` runs in trace stage 10; the searches for writers of the level
  in question 1.
- *Alternative:* stage-paced reading was a deliberate simplicity choice. That is plausible for
  the daily read ("deliberately not a random pick", `TodayScreen.ts:370–378`). It does not
  explain the slot, which is not even stage-aligned.
- *Direction:* a small reading state per learner, updated from first-attempt runs: a current
  constraint set, moved by one dimension at a time after N good or N poor reads. Both the daily
  read and the slot select from it; the stage becomes a ceiling, not the input.
- *Model change*, small if built for sight-reading alone first. The slot-index bug is a local
  fix meanwhile: take the daily rule, or the hardest ≤ stage not already on the card.

**2. P0-a. Phrases do not contain what their rungs and tags claim.**

- *Now:* `generateSightReadingFor` never passes `fifths` or `timeSig` (`ScoreScreen.ts:162–169`;
  the defaults at `sightReading.ts:561–562`), so every phrase is C major 4/4.
- Row `sight-reading-3` is tagged `syncopation, 6/8` and sits on rung 4.5, *Compound time,
  triplets and syncopation*, and its lesson says "sight-reading level 3" for it. It produces 4/4
  with no designed syncopation.
- Rows 4, 5 and 6 are tagged `accidentals` or `keys` and are always C major.
- Row 1 is tagged `skips` and sits on rung 1.5, *Steps and skips*, but level 1 cannot write a
  skip (`maxLeap: 1`).
- *Why it matters:* the learner is told a drill trains a skill it does not contain. Key-signature
  reading is never practised by any sight-read.
- *Evidence:* the catalog rows (`catalog.static.json:692, 1856, 1998, 3849, 3897`); the
  generator output; stage-4 and stage-1 JSON.
- *Alternative:* the key and metre were deliberately left for later. Nothing says so: the
  signature in `05` §8 includes `key` and `timeSig`, and the generator and its tests support
  both.
- *Direction:* pass `fifths` and `timeSig` from the row, adding them to the params, and draw a
  key within `maxFifths` from the seed where the rung wants variety. Correct the tags that
  cannot be true (level 1 "skips", level 3 "syncopation"). Point 1.5 at a steps-and-skips level
  (see P2-c).
- *Local fix* in wiring and content. The model point is that tags are unchecked claims (H5): add
  a test that generates N phrases per row and checks each tag.

**3. P1-b. Sight-reading is filed as a piece: item-shaped progress for a generator, and the
per-phrase evidence that would describe reading skill is discarded.**

- *Now:* `recordRun` keeps the best accuracy, pass/master and `passedOn` for the row
  (`progressStore.ts:124–178`). The session row has no seed, hands or error profile. Lessons
  1.5 and 3.4 promise "five generated melodies … first attempt" and "five generated sight-reads
  at 85 %", and nothing implements either (search scope in trace stage 7).
- Consequences: a configuration becomes "passed" after one good phrase, "due for review" on a
  piece's calendar, and "mastered", after which it is offered as "keeping something warm" or
  "A piece you know".
- *Why it matters:* reading skill is a rate over fresh material, which is exactly what this
  shape cannot hold. The rung's own completion rule cannot be expressed.
- *Evidence:* the `buildSession` outputs with a passed and a mastered row; the `recordRun`
  fields.
- *Alternative:* passes were meant as a coarse "did the habit" signal. The rung prose says
  otherwise.
- *Direction:* a sight-read record per phrase `{rowId, generator params, seed, firstAttempt,
  accuracy, tempo, per-bar misses, wrong-vs-missed, early/late by duration class}`, and a rung
  rule that counts qualifying first attempts. The daily streak stays as it is. Review and
  mastery do not apply to generator rows.
- *Model change*, small; P1-a builds on it.

### The rest

**P0-b. Malformed triplet notation at levels 6–7.**

- `buildRightHand`'s random-rest branch drops `cell.tuplet` (`sightReading.ts:388–393`).
- 87 % (level 6) and 89 % (level 7) of 8-bar phrases over seeds 1–500 contain an untupleted rest
  inside a triplet. The daily read at Stages 7–9 is one of these levels.
- The durations still add up, so scoring is intact. What OSMD draws was not rendered.
- *Local fix:* carry `tuplet` onto the rest; add a markup test.

**P0-c. "First attempt" is per screen visit, not per phrase.**

- `sightReadAttempts` resets per mount (`ScoreScreen.ts:333`), and every navigation mounts a new
  screen (`AppShell.ts:253–261`).
- Re-opening today's read (`TodayScreen.ts:396–399`) regenerates the identical phrase, and its
  first completed run is recorded as a first attempt. `bestAccuracy` takes the maximum
  (`progressStore.ts:136`).
- *Hear it* before playing, restarts and a switch to Wait also leave the counter at 0.
- A pass of the daily row counts towards its rungs.
- Mechanism traced in code, not driven in a browser.
- *Local fix:* key the refusal on `(rowId, seed)`. For fresh opens that needs the seed kept (P1-b).

**P0-d, adjacent, on every Score summary. "N ms off the beat on average" prints a signed mean.**

- `Scoring.ts:40–52` via `util/stats.ts:20–35`; the string at `ScoreScreen.ts:2585`. A spread
  of ±100 ms either side reads as about 0.
- *Local fix:* report mean absolute deviation, or the median absolute, beside the early share.

**P0-e, adjacent. Self-report shown as recorded, not recorded.**

- `Recorded: Clean` is written to the status line (`ScoreScreen.ts:2631–2636`), while
  `RunResult.selfReport` (`progressStore.ts:33`) is never passed.
- `02` Part G says it is recorded as self-assessed.

**P0-f, adjacent. The repertoire reason lies after a mastered item is taken elsewhere.**

- The reason is chosen by `mastered.length > 0`, not by what was picked (`session.ts:326–339`).
- Observed: a mastered sight-read went to review, and the repertoire row offered a never-played
  song as "A piece you know — keep it playable".

**P1-c. Three competing definitions of sight-reading difficulty.**

- The source-of-truth rows above. The learner sees `level 2` and `L2.2` for one row, and the
  daily read and the slot choose by different rules.
- *Direction:* make the generator's constraint set the exercise's difficulty, recorded by
  dimension. Derive `item.level` from it, or measure generated output with the level model. The
  learner is placed by reading state (P1-a).

**P2-a. Unplanned hard demands at levels 2–4.**

- Syncopation in 74, 98 and 100 % of phrases: `pickRhythm` has no metric-placement rule,
  `sightReading.ts:310–341`.
- Dotted notes written across the middle of the bar.
- On rung 2.2, half of the phrases leave C position, three rungs before thumb-under. Lesson 2.5
  names this as a feature for 2.5.
- Leaps beyond the cap via tie-closing (`:444–458`).
- *Direction:* below level 5, a note of length L starts on a multiple of L, and a dotted note
  on a beat. Level 2 stays in C4–G4 on 2.2. Re-walk after a forced tie.

**P2-b. No musical shape.**

- The last note is never on the downbeat at levels 2–7, and 47–78 % of phrases end on a note
  shorter than a quarter.
- No motif, repetition or 2+2 or 4+4 structure.
- At levels 3–4 the right hand ignores the left hand's harmony, near chance on beats 1 and 3,
  although `05` §8 asks for chord tones at 3.
- At 5–7 the middle harmonies are random, and the left-hand patterns sit from C2 because the
  root is the lowest tonic in the range (`:504`).
- Runs of up to 11–13 repeated notes at the range edges, from clamping.
- *Direction:* a phrase template (the final bar a long tonic, the penultimate V, a repeated
  2-bar cell with one change), harmony-aware notes at 3–4, left-hand register from C3.

**P2-c. The level steps bundle several new demands each, while key, metre and tempo never move.**

- Detail in question 2.
- *Direction:* one new dimension per step. Split level 2 into a C-position steps-and-skips level
  (1.5's real need) and an eighths level. Make tempo a per-level value.

**P2-d. The summary has no next step fit for sight-reading.**

- There is no "new phrase" button, and every button replays seen music.
- There is no diagnostic sentence from the measurements the engine already takes.
- The Today subtitle says "slowly" while the pass needs ≥80–90 % of 72 bpm.
- *Direction:* a "New phrase" button for sight-reading rows. One sentence of what it probably
  means, for example misses concentrated after leaps, or lateness after long notes. A tempo floor
  relative to a per-level reading tempo.

**P2-e, adjacent. Lesson voice.**

- Lesson 1.5 says "The sight-reading generator makes a new four-bar melody every time you press
  it", which is nearly the audit's own example of implementation language (H7). The screen title
  is "Sight-reading generator, level N".

**P3.**

- Consecutive rests where one would be written (20–56 % of phrases at 3–7).
- Stale text:
  - `04` §2 "Nothing new records it … off the progress row" (the day is now ticked by seed);
  - `02` Part G "generate a fresh phrase every time" (the daily read is seeded; its rung list is
    also incomplete);
  - `05` §8 levels 2 and 3 as noted in trace stage 3;
  - the code comment citing goldens for levels 1–4;
  - the `ScoreScreen` dispose comment that says a teardown stop draws a summary, which
    `ScoreSession.stop` no longer reports.
- `lessonClaimsAboutApp.test.ts:1407–1420` copies the daily rule instead of calling it.

---

## What is unverified

- **Nothing heard, nothing rendered.** All musical judgements are from pitches and durations as
  data. How OSMD draws the untupleted triplet rest, a dotted half across the middle of the bar,
  and two eighth rests is unverified.
- **The counts** are over seeds 1–500 at each catalog row's parameters. The app uses random
  32-bit seeds and date hashes, which I take to be representative, not proven. The "outside the
  LH triad" column assumes the root implies its diatonic triad at level 3.
- **The session-builder table** used no progress rows and a placement. Real progress changes
  the "already on the card" exclusions but not the selection rule.
- **P0-c** (daily re-open recorded as a first attempt) is traced through `TodayScreen`,
  `AppShell`, `ScoreScreen` and `progressStore`, and was not driven in a browser.
- **The engine** reading the written tempo (72) from the MusicXML is inferred from the writer
  (`musicXmlWriter.ts:269–278`), not traced into session preparation.
- **The built catalog** (`app/public/content/catalog.json`) is assumed current. Its nine
  sight-reading rows match `content/catalog.static.json` field for field on params, level and
  concepts.

---

## Files read

- `docs/prompts/tasks/T36c-trace-sight-reading.md`, `docs/prompts/operating-procedure.md`,
  `docs/prompts/audit-2026-09-25-outside.md`, `docs/prompts/plan-2026-09-25.md`
- `docs/05-score-follow-engine.md` §7 head and §8; `docs/04-ui-spec.md` §2 (the daily read and
  the doors) and §5c (the sight-reading line); `docs/02-curriculum.md` rung 1.5 and Part G's
  sight-reading sentence; `docs/pending-review.md`, grepped only (sight-reading, first attempt,
  daily read)
- `app/src/engine/sightReading.ts`: the generator (1–650) and `dailySeed`; the lab section by
  exports only
- `app/src/engine/musicXmlWriter.ts`: tempo and `durationToType`
- `app/src/engine/Scoring.ts`: `timingStats`, `hotSpots`, `evaluateOutcome`,
  `demandsTechniqueMeasure`; `app/src/util/stats.ts` `summarise`; `app/src/engine/types.ts`
  `SessionScore` and related
- `app/src/engine/PracticeEngine.ts` `start`/`stop`; `app/src/score/ScoreSession.ts`
  `start`/`stop`/`dispose`/`finished`
- `app/src/ui/screens/ScoreScreen.ts`: `generateSightReadingFor`, load, mode, `startRun`,
  `showSummary`, `findRung`, dispose
- `app/src/ui/screens/TodayScreen.ts`: the daily read, the rebuild, load
- `app/src/ui/AppShell.ts`: screen mounting
- `app/src/data/progressStore.ts`: whole
- `app/src/data/levelOverrides.ts` `applyLevelOverrides`; `app/src/curriculum/load.ts`
  `allItems`
- `app/src/curriculum/session.ts`: whole
- `app/src/curriculum/selectors.ts`: `lessonForItem`, `masteryCriteriaFor`, `lessonComplete`,
  `demandsMeasuredAccuracy`
- `app/src/engine/drills/fromCatalog.ts` `isSightReading`; `coaching.ts`, `review.ts` and
  `feedback.ts`, heads only (drill-screen machinery, not on this path)
- `app/src/ui/widgets.ts` `levelLabel`; `app/src/score/OsmdView.ts` draw options
- `app/tests/unit/sightReading.test.ts` (test list, goldens);
  `app/tests/unit/lessonClaimsAboutApp.test.ts` (the sight-reading claims)
- `content/catalog.static.json` (the nine rows); `content/curriculum/stage-1…9.json` (the
  lessons listing sight-reading rows);
  `app/public/content/catalog.json` and `curriculum.json` (as run)
- `content/lessons/1.5.md`, `4.6.md`; the sight-reading paragraphs of `1.3`, `1.4`, `2.2`,
  `2.5`, `3.4`, `4.5` and `technique.5`
