# Brief MT1: the Chord chart counts, tracks and backs the written metre

Lane MT1. An app seam, no ability marker. Drafted 2026-10-06 at HEAD `fb89c810` (= origin). PH1's model (`app/src/score/measureWalk.ts`, the `readHarmony` / `chartSegments` half of `app/src/score/harmony.ts`) was in the main checkout's working tree, uncommitted, at drafting; its task file cites Entry 268, which is not yet in `docs/pending-review.md` (the file ends at Entry 267, line 43692). Every `harmony.ts` and `measureWalk.ts` line below is the working tree's and is re-checked at the base sha. **Base: cut from origin only after PH1's record commit (Entry 268) is pushed; the brief states that sha at dispatch.**

Binding ruling: `docs/review/responses/g6-ph-briefs-cb1.md` §7 (P1 within the Chord chart; not an A7b.1 blocker; handle at least 2/4, 3/4, 4/4, 5/4, 6/8 and 2/2 honestly, never "N quarter-note clicks" by guess; decide before PH2 whether this lands first or folds into PH2). Governing text: `docs/prompts/FABLE.md` §7 (libraries; choices recorded below), §10 (narrow-seam rule), §6 and §9 (acceptance is automated through the visible path; nothing is assigned to the owner). Harness: `docs/prompts/operating-procedure.md` §14, cited and not restated; lane additions at the end. Report: operating-procedure §11 and §12, plus the report list at the end. Never name an AI model in any file.

**Not a narrow seam under FABLE §10.** MT1 adds product rules (what the click counts in compound and cut time, the tempo field's unit, Bass + drums refused where no pattern fits). So this brief is reviewed before dispatch, and the artefacts are reviewed before landing.

---

## Decision rationale (operating-procedure §10b)

- **Learner problem.** On every chord chart not in 4/4, the click, the bar tracker and the bass and drums run four quarter beats to a bar whatever the score says. A learner playing Skating (3/4) or Row, Row, Row Your Boat (6/8) hears and sees the chart's bar change at the wrong time: in 3/4 it is a beat late every bar, so the highlighted chord drifts away from the music; in 6/8 the click divides the dotted-quarter beat wrongly. Chart steps in chains (A7b.1, A7c.1) are 4/4 and unaffected (the reviewer's §7). This is a chart-wide defect.
- **Mechanism, verified at the code** (HEAD `fb89c810`; `ChordChartScreen.ts` is committed):
  - `start()` sets the metronome to four beats (`app/src/ui/screens/ChordChartScreen.ts:275`, `metronome.setBeatsPerBar(4)`).
  - `onBeat` derives the bar from `MetronomeBeat.bar` (`:222`, via `barAt` `:69-73`). That counts bars of the metronome's beat count, so the chart's bar is a four-click bar.
  - `scheduleBacking` asks `barSchedule` for four beats (`:264`, `beatsPerBar: 4`) and spaces them `60 / bpm` apart (`:260`, `:265`).
  - `compBar` holds the chord for three beats (`:245`, `(60 / bpm) * 3`).
  - The tempo field is one number, `bpm`, and it is both the click rate and the quarter-note rate (`:155`, `:352-364`). The item's tempo seeds it (`:588-597`).
- **Scale** (PH1 census, `docs/prompts/runs/PH1/census.txt`):
  - Source corpus (`content/scores/`): of 113 harmony-bearing files, 29 are not 4/4 alone. Metres by file: 4/4 85, 3/4 16, 6/8 6, 2/4 4, 2/2 2, 5/4 1. A file can write several.
  - **The built bundle, which the chart actually opens**: of 459 files, 45 are not 4/4 alone. Metres: 4/4 415, 3/4 21, 2/4 12, 6/8 8, 2/2 2, **12/8 1**, 5/4 1.
  - The reviewer's "30 / 114" is the earlier scratch count from the PH brief. The bundle figure is the denominator here.
- **Solution classes considered.**
  1. *No change; mark non-4/4 charts as unsupported.* Rejected: 45 bundled charts, and the chart is the jam tool for waltzes and 6/8 folk tunes.
  2. *Click the numerator in the denominator's unit (MusicXML's literal `<beats>`).* MusicXML 4.0 defines `<beats>` only as "the number of beats, as found in the numerator of a time signature" (w3.org MusicXML 4.0 reference, `<beats>`). That is a notational count, not the felt beat. Rejected for compound metres: 6/8 would click six eighths, against music21's default reading of two dotted-quarter beats (`TimeSignature('6/8').beatCount == 2`, `beatDuration.quarterLength == 1.5`, `beatDivisionCount == 3`; music21 10.5.0 `meter/base.py`, `beatCount` docstring at `:826`, `_setDefaultBeatPartitions` at `:1147`: "numerator == 6 and favorCompound … partition(2)").
  3. *Quarter-note clicks, bar length in quarters* (the Score screen's rule, `app/src/engine/prepareSession.ts:189-190`: "6/8 is six eighths = three beats"). Rejected: this is exactly the "N quarter-note clicks" the reviewer forbids. In 6/8 three quarter clicks fall on eighths 1, 3 and 5, across the two dotted-quarter beats. In 2/2 four clicks against two half-note beats.
  4. **The felt beat by the app's existing one reading of a bar's beat, witnessed by music21; the chart's metronome, tracker, backing and comp driven by each bar's metre.** Chosen. The reading is `beatLength` / `isCompound` in `app/src/demands/detect.ts:134-141`: compound = beat-type 8 with more than one group of three eighths (6/8, 9/8, 12/8), beat = dotted quarter; otherwise the denominator. It is already reviewed (L120b, `docs/review/responses/0bcd3be0.md`, cited in its comment `:124-133`). On every metre in the bundled charts it agrees with music21 (table below).
  5. *Fold into PH2.* See "Land before PH2 or fold" below.
- **Why the chosen class.**
  - It reuses a reviewed rule instead of a third reading. CLAUDE.md *Reuse before reinvention*; FABLE §7 "reuse".
  - music21 is the independent witness for every metre (FABLE §7 "compare").
  - `barSchedule` stays byte-identical for every caller (the Lab's included), so no new groove is invented.
  - Where no existing pattern fits, the chart says so instead of playing a guess.
- **What would reverse it.**
  - music21 and the app's reading disagree on any metre in a bundled chart, beyond 3/8, which is explained below and does not occur in the corpus.
  - A bundled chart mixes metres with different beat units: none by the drafting scan (HYPOTHESIS below).
  - The catalog `tempoBpm` of a non-4/4 fixture is not in quarter notes a minute. The conversion would then be wrong; stop.
  - Per-bar beat counts cannot be given to the metronome without a non-additive change to `BeatScheduler`. Stop; the shared clock is other screens' too.
- **Real problem or proxy.** Real for timing: the click, the tracker and the backing's events fall where the written metre puts beats and barlines. Judged on scheduled audio events and their audio-clock times, not on sound. Whether the generic 2-, 3- and 4-beat bass-and-drums pattern is a good accompaniment in 2/4, 3/4 or 2/2 is not established. It is `barSchedule`'s existing rule, *unverified as music*, as the 4/4 pattern is today.
- **Remaining uncertainty.** Nothing heard. 5/4's grouping (see the table). Whether a learner reads a compound-time tempo in dotted quarters is a convention (MusicXML's `<metronome>` carries `<beat-unit>` and `<beat-unit-dot>` for exactly this), HYPOTHESIS. PH1's artefact review is pending ("the four open decisions", Entry 268, unread at drafting). If it changes `ChartMeasure` or the bar-length rule, MT1's base moves.

## Land before PH2 or fold into it: **land before, as its own lane** (recommended)

- **PH2's scheduler needs MT1's timeline.** PH2 strikes the comp at written positions "`start × seconds per quarter`" from the bar's start and gives each backing beat the harmony sounding at it (`briefs/seam-chart-positioned-harmony.md`, PH2 "Decided"). Both need seconds per quarter, beats per bar and the bar's metre. Written once on a metre-true clock, PH2 has nothing to redo. Built on four beats and fixed later, PH2's comp, backing and live-cell timing would be rewritten. The reviewer warned against exactly that ("do not let PH2 accidentally cement the four-beat assumption").
- **PH2 carries a product review that may take rounds.** It must picture dense bars on three device shapes and may need a fallback look (the reviewer's §3). Folding would hold a P1 chart-correctness fix behind that look.
- **Smaller reviews.** MT1's three product rules (click unit, tempo-field unit, backing refusal) are reviewed apart from PH2's display rules.
- **No calendar cost.** PH2 is held until PH1's artefacts are reviewed (the reviewer's §8). MT1 can be built in that window.
- **Against.** Both lanes edit `onBeat`, `scheduleBacking` and `start` in `ChordChartScreen.ts`, so PH2 rebases onto MT1. Two PH2 sentences need amending (listed under "What MT1 hands PH2").
- **Reverse to fold if** PH2 is dispatched before MT1 can be cut, or PH1's review moves the metre data. Then this brief's contract table and red cases become PH2 acceptance items, unchanged.

## Status labels

VERIFIED (observed at drafting; the builder re-checks at the base sha), HYPOTHESIS (with its refuting test), OPEN (the builder's judgement, with one materially different alternative and why it loses, operating-procedure §13), SETTLED, OUT OF SCOPE.

## Premises, verified at the lines

- **The chart's four-beat constants:** `ChordChartScreen.ts:275`, `:264`, `:245`, and `barAt` over `MetronomeBeat.bar` (`:69-73`, `:222`). VERIFIED.
- **`barSchedule`** (`app/src/audio/backingLoop.ts:130-173`):
  - takes any `beatsPerBar` (`:140`);
  - bass root on beat 1, fifth on beat 3 only when there are at least three beats (`:147-155`);
  - kick on even-indexed beats, snare on odd (`:162-166`); its comment claims the 3-beat case "is what a jazz waltz does" (`:164-165`), unsourced;
  - hat on every beat and a binary or swung off-beat at 0.5 or 2/3 of the beat (`:116-117`, `:167-170`).
  - Callers: the chart (`ChordChartScreen.ts:264`) and the Lab (`LabScreen.ts:504`, `beatsPerBar: 4` at `:506`). VERIFIED by search of `app/src`.
- **The metronome's meter.** `Metronome.setBeatsPerBar` works mid-run (`app/src/audio/Metronome.ts:177-180`). `BeatScheduler.setBeatsPerBar` makes the next beat not yet pulled the downbeat of a new bar (`app/src/audio/BeatScheduler.ts:115-128`). The accent is beat 1 only (`isAccent: beatInBar === 1`, `:160`). Count-in beats are `countInBars × beatsPerBar`, fixed at construction (`:65-66`). VERIFIED.
- **The click's construction**, which the browser instrument classifies:
  - the default sound is `wood` (`app/src/data/settingsStore.ts:148`);
  - the wood click is a buffer source into a **bandpass** filter at 2400 Hz when accented and 1600 Hz when not (`Metronome.ts:257-281`, `:261`);
  - CB1's probe counts only *highpass* noise and `setValueAtTime` tones, so clicks are in neither class (`app/tests/e2e/chart-backing.spec.ts:22-27`, `:93-100`).
  - VERIFIED. The spec does **not** yet count clicks; MT1 adds that.
- **The model carries the metre, but `ChartMeasure` drops its kind.**
  - `WalkTime` holds `beats` and `beatTypes` as written, and `quarters` (`measureWalk.ts:41-48`, read at `:84-103`).
  - `WalkMeasure.time` is the signature in force for each measure (`:58`, `:143`).
  - `ChartMeasure` keeps only `nominal` (quarters), `walked`, `implicit`, `status` and `length` (`harmony.ts:192-205`, built at `:209-221`). **3/4 and 6/8 are both `nominal: 3`; 2/2 and 4/4 are both `4`**, so the chart cannot tell their beats apart from `ChartMeasure` as it stands. VERIFIED (working tree).
  - MT1 therefore adds the written signature to `ChartMeasure`: an additive field, nothing else in `harmony.ts` moving. This is a PH1 schema addition, flagged to the reviewer.
- **Metre lookup by bar.** `chartSegments` finds a bar's measure by written number (first measure with the number), else carries the bar before's, with 4 for a first bar with none (`harmony.ts:321-334`). MT1 uses the same lookup for the metre, so bars past the last measure and pickups numbered 0 resolve as the model resolves them. VERIFIED (working tree).
- **The tempo unit.**
  - The converter writes the opening mark's quarter-note tempo (`tools/content/convert.py:1608`, `getQuarterBPM()`) and inserts default marks as quarter notes (`:1333-1349`); the default is 96 (`:72`).
  - The musetrainer import reads `<sound tempo>` (`tools/content/import_musetrainer.py:131-133`), which MusicXML defines in quarter notes a minute.
  - So catalog `tempoBpm` is quarter notes a minute for those paths: VERIFIED by reading.
  - **That it holds for every fixture below is HYPOTHESIS.** Refuting test, in MT1's unit suite: for each fixture, catalog `tempoBpm` equals the opening event of `tempoEvents` on its file (`tempoFromXml.ts`, normalised to quarter notes a minute by its module note, `:18-21`).
- **The bundled non-4/4 charts and their ids** (drafting scan of `app/public/content/scores/` joined to `catalog.json`; a scratch script, not committed; MT1's census re-runs it with `readHarmony`):
  - 2/4: `song.classical.ah-vous-dirais-je-maman.pdmx`, `song.ragtime.joplin-entertainer` (tempo 70), eight `exercise.oompah.*`.
  - 3/4: `song.jazz.vince-guaraldi-skating.pdmx` (192), `song.folk.greensleeves.waltz` (112; pickup numbered 0), `song.folk.happy-birthday`.
  - 5/4: `song.jazz.the-dave-brubeck-quartet-take-five.pdmx` (136; written `<beats>5</beats>`, not `3+2`).
  - 6/8: `song.folk.row-row-row-your-boat` (81), `song.classical.1803-1856-adolphe-adam-o-holy-night.pdmx` (150).
  - 2/2: `song.pop.corcovado.pdmx` and `song.pop.avalon.pdmx` (both 96, tagged `tempo-defaulted`).
  - 12/8: `exercise.meter.12-8` (76).
  - **Metre change:** `song.beautiful.merry-christmas-mr-lawrence`: one part; 3/4 at bar 1 and 4/4 from bar 17 to the end (bar 75). music21 agrees (`TimeSignature` at measures 1 and 17).
  - VERIFIED by the scan. Whether any other bundled chart changes metre: HYPOTHESIS, none (the scan lists one file with two signatures).
- **Existing chart specs open only 4/4-or-unknown charts:** `import.imported-test-tune`, `song.folk.hot-cross-buns`, `song.jazz.autumn-leaves`, `exercise.blues.twelve-bar-shuffle.c`, Blue Bossa (grep of `app/tests/e2e` for `/chart/`). VERIFIED. They are the 4/4 guard and stay green unedited.

## The per-metre contract

**SETTLED for review.** "Beat" is the felt beat: `detect.ts`'s `beatLength`, with music21's `beatDuration` as witness. Bar length is the metre's nominal length, `WalkTime.quarters`. The click counts beats. The tempo field states beats a minute in the beat unit.

| Metre | Beats clicked per bar | Beat unit (quarters) | music21 witness: beatCount / beatDuration / beatDivisionCount | Accent | Bar length (quarters) | Bass + drums per bar |
|---|---|---|---|---|---|---|
| 2/4 | 2 | quarter (1) | 2 / 1.0 / 2 | beat 1 | 2 | `barSchedule(beatsPerBar: 2)` at the beat: bass root on 1; kick 1, snare 2; hat on beats and off-beats. Existing generic rule, unverified as music. |
| 3/4 | 3 | quarter (1) | 3 / 1.0 / 2 | beat 1 | 3 | `barSchedule(beatsPerBar: 3)`: root 1, fifth 3; kick 1 and 3, snare 2; hats. The existing "jazz waltz" claim (`backingLoop.ts:164-165`), unsourced, unverified as music. |
| 4/4 | 4 | quarter (1) | 4 / 1.0 / 2 | beat 1 | 4 | Today's, byte-identical (the differential). |
| 5/4 | 5 | quarter (1) | 5 / 1.0 / 2 (flat weights after beat 1: no default grouping) | beat 1 | 5 | **None: no pattern fits.** The generic rule would kick on 1, 3 and 5, an implied 2+2+1 grouping. Neither conventional quintuple grouping (3+2, 2+3) is that (convention: HYPOTHESIS, refutable by a cited theory text), and the file writes no grouping. Chip refused with its reason (below). |
| 6/8 | 2 | dotted quarter (1.5) | 2 / 1.5 / 3 | beat 1 | 3 | **None: no pattern fits.** `barSchedule`'s off-beat is binary (0.5 or 2/3 of the beat), and music21 divides the 6/8 beat in three. Refused with its reason. |
| 12/8 (bundle) | 4 | dotted quarter (1.5) | 4 / 1.5 / 3 | beat 1 | 6 | None, as 6/8. |
| 2/2 | 2 | half (2) | 2 / 2.0 / 2 | beat 1 | 4 | `barSchedule(beatsPerBar: 2)` at the half-note beat: root on 1; kick 1, snare 2; hats on the quarters. The 2/4 rule in its own unit, unverified as music. |
| Any other (3/8, 9/8, 6/4, 7/8, composite `3+2`, multi-pair) | bar quarters ÷ `beatLength` | `beatLength` | listed per case by the witness script | beat 1 | `WalkTime.quarters` | A pattern only when the beat count is 2, 3 or 4 and the beat division is binary; otherwise none. **None of these is in a bundled chart** (drafting scan). A non-integer beat count is a stop. |
| None in force / `senza-misura` | 4 | quarter | — | beat 1 | 4 | Today's: the model's own fallback (`chartMeasureOf` `nominal ?? 4`; `chartSegments` 4). |

**Known witness disagreement (explained, not in the corpus).** music21 reads 3/8 as one dotted-quarter beat (`beatCount` 1). The app reads it as three eighth beats by the reviewer's L120b ruling (`detect.ts:124-133`). The chart follows the app's ruling. The witness script reports the case. music21 also reads `3+2/4` as two beats (`beatCount` 2), where common counting is five; not in the corpus either.

**The accent** stays beat 1 only, in every metre: today's metronome behaviour, music21's top weight. music21's secondary weights (beat 3 of 4/4 at 0.5) are not rendered today. OUT OF SCOPE.

**The tempo field (SETTLED for review).** The field states beats a minute in the bar-1 metre's beat unit:
- the default is catalog `tempoBpm ÷ beat length in quarters`, clamped 40–240 as now;
- the click and backing run at `60 / field` seconds a beat;
- the label names the unit wherever the beat is not a quarter (wording OPEN; for example a dotted-quarter or half-note glyph beside "bpm").

The sounding tempo is unchanged by the unit: Corcovado's defaulted 96 quarters becomes 48 half notes, the same bar length in seconds. 4/4 charts show exactly today's number and label. *Alternative weighed:* keep the field in quarter notes a minute. It loses because the number would not count what the learner hears (120 on a 6/8 chart clicking 80 times a minute).

**Bass + drums refused (SETTLED for review; presentation OPEN).** On a chart whose bar-1 metre has no pattern (5/4, 6/8, 12/8):
- the chip is disabled (`aria-disabled="true"` and not pressable), and nothing is scheduled;
- one sentence says why, and that the click and Comp follow the metre.

Where the sentence sits is the builder's call, with one alternative weighed, and pictured on phone upright, phone sideways and tablet (`docs/04-ui-spec.md` §0 R7). *Alternative weighed:* a new compound pattern. It loses because a groove is a stylistic musical property that needs a sourced contract (FABLE §4, §5), so it is its own lane. A chart that changes between a patterned and an unpatterned metre plays the pattern bar by bar; no bundled chart does (HYPOTHESIS above).

**The comp's hold (SETTLED for review; formula OPEN within the constraints).** Constraints:
- in 4/4 it is today's three quarters, exactly;
- in every metre it ends before the next bar's downbeat.

Recommended: three quarters of the bar's length in quarters (2/4 1.5, 3/4 2.25, 6/8 2.25, 2/2 3, 5/4 3.75). *Alternative weighed:* "min(3 quarters, bar length)". It loses because a 3/4 chord would ring into the next downbeat.

**The bar tracker** advances at each bar's downbeat, after that bar's beat count. Across a metre change (Mr Lawrence 16→17, and the chorus wrap 75→1) the new bar's first click is accented and the count changes there. Count-in and resume (X15) count in the metre of the bar they lead into.

**Pickups and mismatched bars: OUT OF SCOPE, unchanged class.** Every bar sounds for the metre's nominal length, a pickup included, exactly as every bar is four beats today. Taking `ChartBar.length` for pickups would change 4/4 charts with pickups (`song.folk.bella-ciao`, `song.folk.when-the-saints.f`) and break the 4/4 differential. It is a separate product rule: PH2's or a later seam's (point 3 for the reviewer).

## Mechanism (OPEN, with constraints)

- **Where the metre reading lives.** Either export `isCompound` and `beatLength` from `detect.ts` (or move them to a small shared module that `detect.ts` imports), or keep a chart-side copy. Constraint: one reading, and `detect.ts`'s behaviour and tests stay unchanged. A copy needs its reason.
- **How the metronome learns each bar's count.** The chart calls `setBeatsPerBar` at the bar boundary, or `BeatScheduler` gains an additive per-bar beat-count option. Constraints: the accent lands on each bar's beat 1 across a change and the wrap; the Score, Metronome, PDF and Lab screens are unchanged; `BeatScheduler.test.ts` and `Metronome.test.ts` pass unedited.
- **HYPOTHESIS the builder inherits.** Calling `setBeatsPerBar` from the tick listener on the last beat of the bar before a change is enough, because one pull rarely holds two beats: the look-ahead is 100 ms (`Metronome.ts:41`) and a beat at the field's 240 maximum is 250 ms. *Refuted if* a fake-clock test at 240 with a simulated stall (`SCHEDULER_STALE_MS`, `:65`) shows a misplaced accent. Then take the additive scheduler option.

## Red-first cases

Each one is seen red on the base before the change, and the report quotes the reds.

1. **The metre reading, against music21.** A unit test over 2/4, 3/4, 4/4, 5/4, 6/8, 12/8 and 2/2 (plus 3/8 pinned to the app's ruling) asserts beats per bar, beat length and bar length, as in the table. The witness script under `docs/prompts/runs/MT1/` prints music21's `beatCount`, `beatDuration.quarterLength`, `beatDivisionCount` and `barDuration` for every metre in every bundled harmony chart's harmony part, and, per (file, measure), music21's signature against the app's per-bar reading. Agreements are counted and every disagreement is listed with its cause. Red: no per-bar reading exists for the chart.
2. **The chart sets the metronome per metre** (`chordChartLifecycle.test.ts`'s fake metronome, which records `setBeatsPerBar`): 3 on a 3/4 chart, 2 on 6/8, 2 on 2/2, 5 on 5/4, 4 on Blue Bossa. Red: always 4.
3. **The tracker.** On the 3/4 fixture the bar advances every 3 beats, on 6/8 every 2. On Mr Lawrence bar 16 has 3 beats and bar 17 has 4, and chorus 2's bar 1 has 3 again. Suspended mid-bar 17 and resumed, it resumes on bar 17's downbeat with a 4-beat count-in. Red today.
4. **The tempo field.** Row, Row, Row opens at 81 ÷ 1.5 = 54 with the dotted-quarter unit shown, Corcovado at 48 with the half-note unit, Blue Bossa at 96 with today's label. A click interval of `60 / field` s is checked in case 6. Red today.
5. **Backing and comp per metre** (unit, through the screen with the kit and piano spied):
   - on 3/4, `barSchedule` is called with `beatsPerBar: 3` and spaced at the beat;
   - on 2/2, with `beatsPerBar: 2` at the half-note beat;
   - on 5/4, 6/8 and 12/8, the chip is disabled and nothing is scheduled even if `backing` were set;
   - the comp's hold ends before the next downbeat in each metre.
   - Red today.
6. **The visible path, in the browser** (new `app/tests/e2e/chart-metre.spec.ts`). It reuses CB1's init-script instrument (`chart-backing.spec.ts:52-102`), extended to classify **clicks** (bandpass buffer sources, accented when the filter is at 2400 Hz) and to record each start's audio-clock `when`. For each fixture (Skating 3/4, Take Five 5/4, Row, Row, Row 6/8, Corcovado 2/2, Ah vous dirais-je 2/4, `exercise.meter.12-8`, Mr Lawrence across bars 16-18) it asserts:
   - clicks between consecutive accents = the table's beats;
   - successive click `when`s differ by `60 / field` (to the audio clock's resolution);
   - the form's "Bar n" changes on the accented click;
   - with Bass + drums on, bass, kick and snare `when`s fall on the click times the table's pattern names (3/4: bass on clicks 1 and 3), and nothing is scheduled where the table says none, with the chip disabled.
   - The builder confirms with `readHarmony` and music21 that the bars run are `full` in each fixture; if one is not, it swaps in another listed fixture of the same metre and says so.
   - Red today.

## The 4/4 differential

- **Browser.** CB1's four cases on Blue Bossa (`chart-backing.spec.ts`), with the extended instrument, run on the base and on MT1:
  - bass, kick, snare, hat, piano, `bassHz`, **click and accent counts**, and every start's `when` relative to the first click;
  - identical in all four cases, and the chips' states the same.
  - A 4/4 chart with a pickup (`song.folk.bella-ciao`) gets the same comparison over its first five bars.
  - `chart.spec.ts`, `carry-overs.spec.ts`, `empty-states.spec.ts` and the two `modes-chart-*` specs pass unedited.
- **Whole corpus, unit level.** For every bundled harmony chart whose harmony part is 4/4 alone, the per-bar values the chart uses are 4 beats, quarter beat, `barSchedule(beatsPerBar: 4)` and a three-quarter comp hold; the tempo field's default and label are unchanged. This is checked through an exported pure helper, so no browser is needed. For every other chart the census lists file, metres, beats per bar, field default and whether Bass + drums is offered. That list is the learner-visible change set.
- **Any 4/4 change is a stop**, reported, never explained after landing.

## Blast radius, declared

- `app/src/ui/screens/ChordChartScreen.ts`.
- `app/src/score/harmony.ts`: additive only. `ChartMeasure` carries the signature in force, and `positionedHarmony.test.ts` and `harmony.test.ts` pass unedited.
- The metre reading: `app/src/demands/detect.ts` export or move, refactor-only with its tests unedited; or a new small module.
- `app/src/audio/BeatScheduler.ts` / `Metronome.ts`: additive only, and only if the HYPOTHESIS above is refuted.
- Tests: `app/tests/unit/chordChart.test.ts`, `chordChartLifecycle.test.ts`, a new metre unit test, `app/tests/e2e/chart-backing.spec.ts` (instrument extended; its four assertions kept), the new `chart-metre.spec.ts`.
- `docs/04-ui-spec.md` §3b: the metre rule and the refusal sentence.
- `docs/prompts/runs/curriculum-review-2026-10-05/MODE-SHEET.md` §15: the words "in 4/4" (`:145`) only.
- `docs/08-test-map.md`; `docs/prompts/checks.json` reader lists; `docs/prompts/runs/MT1/`.
- `app/src/audio/backingLoop.ts` is **not** in the radius: `barSchedule` must not change. Any other file is a stop.

## Stop conditions

- Any 4/4 differential above changes.
- music21 and the app's per-bar reading disagree on a bundled chart, unexplained.
- A fixture's catalog `tempoBpm` is not its file's quarter-note opening tempo.
- A bundled chart mixes beat units across metres, or has a non-integer beat count.
- Per-bar counts need a non-additive `BeatScheduler` change, or any change to `barSchedule`, the Lab, the Score screen or the Metronome screen.
- PH1's base has changed `ChartMeasure` or the bar-length rule since drafting: report, then continue only on the new shape if the contract table is unaffected.

## What MT1 hands PH2 (recorded for the PH2 brief; not edited here)

- PH2 "Comp": "A one-segment bar's comp is today's (one chord, three beats)" becomes "today's in 4/4; MT1's hold rule in other metres".
- PH2 "Backing": "the harmony sounding at that event's beat" means the metre's beat, from MT1's per-bar reading. Seconds per quarter is `60 / field × (1 / beat length)`.
- Pickup and mismatched-bar timing (`ChartBar.length` versus the nominal bar) is PH2's to decide, or a separate seam's, under the reviewer's §4 model.

## Adjacent, recorded and not fixed (outside this seam)

- The Score screen clicks quarter notes in 6/8 and 2/2 (`prepareSession.ts:189-190`); the same class of defect there.
- The Lab hard-codes four beats (`LabScreen.ts:506`, `:910`); its progressions are app-made 4/4, so there is no defect today.
- Catalog tempos with float noise (`80.99999999999999` for Row, Row, Row) reach the chart's tempo field as written today (`ChordChartScreen.ts:595-596`, no rounding).

## Points for the reviewer (flagged, not silently decided)

1. The three product rules above: beats clicked by the felt beat (compound = dotted quarter, 2/2 = half); the tempo field in that beat's unit; Bass + drums refused in 5/4, 6/8 and 12/8 rather than a guessed groove.
2. `ChartMeasure` gains the written signature: an additive change to PH1's model, which is under its own artefact review.
3. Pickups keep a full nominal bar (today's class), so the 4/4 differential holds. Taking the pickup's notated length is a product rule for PH2 or a later seam.
4. The ruling's "30 / 114" is the PH brief's scratch count. The shipped bundle is 45 of 459 and adds a 12/8 chart, which the ruling's list does not name; this brief covers it.

## When to deviate

A VERIFIED premise does not reproduce: say so, take the better path inside the declared files, and record one alternative and why it loses (operating-procedure §13). A better path that needs an undeclared file: stop and report.

## What this lane adds to the harness (§14)

- music21 from the main checkout's Python 3.11 for the witness script; its output committed under `docs/prompts/runs/MT1/`.
- The lane's own Playwright port, two workers at most, never 4173.
- Pictures of the refusal sentence under the worktree's `build/`; the kept ones committed under `docs/prompts/runs/MT1/`.

## Report

Every item done, or an explicit **NOT DONE** line with the reason:
- each red case, quoted red, then green;
- the music21 comparison: agreement count and every disagreement;
- the 4/4 differential, browser counts and `when`s, before and after, case by case, and the whole-corpus unit check;
- the census of non-4/4 charts (file, metres, beats, field default, Bass + drums offered);
- each OPEN choice with its weighed alternative;
- the tempo-unit HYPOTHESIS per fixture, confirmed or refuted;
- the scheduler HYPOTHESIS, confirmed or refuted;
- the pictures by device;
- every file changed.

Nothing heard.
