# Seam: positioned harmony on the Chord chart (more than one chord in a bar)

An app seam, no ability marker. Drafted 2026-10-06 at HEAD 18fa65df, with the reviewer's response at origin c6c4ab6a; CB1 landed during drafting (8e30d23d, Entry 267), so every `ChordChartScreen.ts` line below is cited at HEAD 3890a893 (`docs/review/responses/bb1-bluebossa-probe.md` §3, binding: the position contract is defined and proved before the consumers build, by reusing or factoring the existing MusicXML position walk, never a second parser). Evidence: `docs/pending-review.md` Entry 266; `docs/prompts/runs/BB1/app-facts.json`; the Blue Bossa intake record's claim checks (`../intake/QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6.md`). Harness: operating-procedure §14, cited and not restated; lane additions at the end. Report: operating-procedure §11 and §12, plus the report list at the end. Never name an AI model in any file.

**Two sequential lanes (recommended).**
- **PH1, the contract.** A pure-model change in `app/src/score/`: chord symbols gain a position, the bar becomes an ordered list of segments, unit tests prove the reviewer's six cases. **No screen changes**: the Chord chart keeps calling today's `chartBars` until PH2, so PH1's app behaviour change is nil by construction. PH1 does not touch `ChordChartScreen.ts`.
- **PH2, the consumers.** The Chord chart's grid, comp, backing and live cell move onto the segments, with a stated look for a split bar on each device (R7). **PH2 builds on CB1's landed `ChordChartScreen.ts`** (`seam-chart-backing.md`, landed at 8e30d23d, Entry 267: `onBeat` schedules the bar's backing whenever Bass + drums is on, independent of Comp, and `compBar` voices the chord only; its four-case spec is `app/tests/e2e/chart-backing.spec.ts`). PH2 is cut from origin only after PH1 has landed.

Why two: the contract is a new schema meaning (position in a bar) and is reviewed and proved on its own unit tests against independent readers; the consumers are UI and audio timing judged on pictures, scheduled-event counts and a state-machine trace. One lane would put the reviewer's pre-build contract behind a UI diff. Neither lane qualifies for landing before its artefact review (FABLE §10): PH1 adds a schema meaning and PH2 adds product rules (segment display, comp timing, the live-cell rule); both are reviewed after building, before landing.

---

## Decision rationale (operating-procedure §10b)

- **Learner problem.** Wherever a written chord changes mid-bar, the chart states, plays and judges the wrong harmony: `chartBars` keeps a bar's first symbol and drops the rest (`app/src/score/harmony.ts:168-177`, `here[0]` at `:173`). In A7b.1, Blue Bossa's bar-16 G7 and Insensatez's bar-22 E7 never show or sound, and a correct V7 shell in the second half of either bar reads no (0.25; Entry 266, Station 4). It is not a Blue Bossa problem. The writer's scratch census over every MusicXML file under `content/scores/` (one reader, the writer's own regex walk, under the session scratchpad and not committed; PH1 re-runs it with the new reader): 624 files, 114 with `<harmony>`, **103 of them with at least one bar holding more than one symbol, 1,757 such bars**; 787 of those bars only restate the same symbol; 168 bars have their first symbol after beat 1; 391 symbols stand off a quarter-note beat; 412 bars hold three or more symbols, and ten files have bars with six to sixteen.
- **Solution classes considered.**
  1. *Avoid split bars* (choose pieces without them; name bars in lessons). Rejected by the reviewer (§3): an app-wide defect; and the census says almost every chart has them.
  2. *Split by element order, or into equal halves.* Rejected: the BB1 evidence shows element order and the raw `<offset>` are not enough (bar 16's G7 is `+4` divisions before the notes in the raw file and `-10080` after a dotted half in the converted one), and positions such as 0.5, 1.0, 1.5 in the census (*Hungarian Dance No. 5*, *The Entertainer*) are not halves.
  3. *Positions computed at build time by music21 and written into the catalogue.* Not taken: the chart also opens the learner's own imports at runtime (`ChordChartScreen.ts:552`, `row.data`), so a runtime reader is needed anyway, and two readers would be two interpretations. music21 is used instead as PH1's independent witness.
  4. *A new cursor parser inside `harmony.ts`.* Rejected by the reviewer: `tempoFromXml.ts` already walks measure position.
  5. **Factor the measure-position walk out of `tempoFromXml.ts` (or extend it in place) so harmony is one more positioned event, then derive per-bar segments from it.** Chosen.
- **Why the chosen class.** One walk, one set of rules for `<divisions>`, durations, `<chord/>`, grace notes, `<backup>` and `<forward>`; the tempo reader's whole-corpus differential proves the factoring changed nothing; music21 checks every position independently.
- **What would reverse it.**
  - The factored walk changes any `tempoEvents` output on any bundled score.
  - music21 and the new reader disagree on bundled symbols beyond cases the report explains.
  - The census finds positions the walk cannot place (before 0, at or after the bar's end) in charts learners open, in numbers that make a positional grid misleading.
- **Real problem or proxy.** Real for what the chart prints, plays and judges at each instant. The live cell itself stays the same proxy it is today (at least 60 % of the chord's pitch classes held, `chordMatch` `harmony.ts:180-185`; MODE-SHEET §15), now asked of the right chord.
- **Remaining uncertainty.**
  - Whether a segment a quarter or an eighth wide can carry readable text on a 342 px phone (PH2's pictures decide; *Eye over spec*).
  - The dense bars (six to sixteen symbols) in ten files: what they are (restatements, a per-beat harmonic analysis, a converter artefact) is unread.
  - The chart plays four beats in every bar whatever the metre (`ChordChartScreen.ts:275`, `setBeatsPerBar(4)`; `:264`, `beatsPerBar: 4`), and 30 of the 114 harmony files are not in 4/4 (16 in 3/4, 6 in 6/8, 5 in 2/4, 2 in 2/2, 1 in 5/4; scratch count). An adjacent, already-present defect: recorded, not fixed here.
  - Nothing heard: every audio statement is what the app schedules on its clock.

## Goal

- **The reviewer's words (binding).** One bar may hold several ordered chord segments; the grid shows all of them, with widths by actual position and duration, not 50/50; Comp changes at the written point; the live cell judges against the harmony active at the instant of the note; a bar beginning without a new symbol carries the previous harmony until the first written change. Before any consumer: the position contract, reusing the existing walk, with the six minimum acceptance cases.
- **The writer's words.** Give a chord symbol the place in the bar the file means, prove that place against an independent reader on the two A7b.1 charts and the whole bundled corpus, change nothing else the tempo reader or a one-chord bar does, and then make the chart's four consumers read one representation.

## Status labels

VERIFIED (the writer observed it at 18fa65df; the builder re-checks), HYPOTHESIS (with its refuting test), OPEN (the builder's judgement, with one alternative considered and why it loses, operating-procedure §13), SETTLED, OUT OF SCOPE.

## Premises, verified at the lines

- `ChordSymbol` (`harmony.ts:12-21`) is `{measure, text, pitchClasses, root, bass?}`: no position. `parseHarmony` (`:119-161`) walks `<measure number=…>` blocks across the whole document with one regex and reads only `<harmony>` contents; `measure` is `parseInt` of the `number` attribute (`:124`). No timing is read. VERIFIED.
- `chartBars` (`:168-177`) loops bars 1..`measureCount` by written number and keeps the first symbol in written order; a bar with none repeats the last. Its consumer computes `measureCount` as the count of distinct `number` attributes (`ChordChartScreen.ts:567-569`). VERIFIED. Its only app consumer is `ChordChartScreen.ts` (`:49`, `:569`); tests in `app/tests/unit/harmony.test.ts:136-151`. VERIFIED by search of `app/src`, `app/tests`, `tools`.
- The walk in `tempoFromXml.ts` (`rawEvents`, `:178-226`): parts around measures (`PART` `:128`, `MEASURE` `:129`), `<divisions>` carried within a part (`:184`, `:190-192`), a measure ordinal from 0 (`:185`, `:222`), position in divisions advanced by a note's `<duration>` unless it is a `<chord/>` or grace note (`:193-201`), moved back by `<backup>` (`:202-203`) and on by `<forward>` (`:204-205`); `CHILD` (`:131`) matches `note|backup|forward|direction|attributes|sound`, **not `harmony`**. Its module note restricts it to the partwise form (`:51-56`). The walk is private: `rawEvents` is not exported. VERIFIED.
- **The offset rule differs for harmony.** The tempo reader moves a direction by its `<offset>` only when the offset says `sound="yes"` (`:26-27`, `:211-213`). Blue Bossa's raw bar 16 writes the G7 as `<offset>4</offset>` with no `sound` attribute, divisions 2, before the notes; the committed file writes `<offset sound="yes">-10080</offset>` after a 30240-division dotted half, divisions 10080 (both read from the files, VERIFIED). Under the direction rule the raw G7 would sit at 0, not 2.0, and the reviewer's first case would fail. MusicXML 4.0's `<offset>` says `sound="no"` (the default) leaves any `<sound>` or `<listening>` associated with a *direction* at the current location; a `<harmony>` carries neither. music21 applies a harmony's offset unconditionally (`music21/musicxml/xmlToM21.py`, `xmlHarmony` at 5340-5348 calling `xmlToOffset`, offset over divisions at 5815; music21 10.5.0). So: **a harmony's `<offset>` always moves it** (SETTLED here; flagged to the reviewer below).
- Two readers agree on the two A7b.1 bars (VERIFIED, 2026-10-06): the writer's scratch walk and music21 (`converter.parse`, `ChordSymbol.offset` within the measure) read Blue Bossa bar 16 as Dø7 at 0.0 and G7 at 2.0 in the committed `.mxl` and in the raw-shaped quarry dump, and Insensatez (committed `QmemwmomPM2tq51u1sTFEAPqdzPkwrJkuKCsMThnKqpvFW.mxl`, 4/4, divisions 10080) bar 22 as Bø7 at 0.0 and E7 (add ♭9) at 2.0, by the walk alone (no offset element).
- The raw Blue Bossa file in the repo is the quarry dump `docs/review/pdmx-quarry-2026-10-05/xml/B-jazz/blue-bossa-QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6.musicxml` (tracked). Its bar 16 has the raw shape above, but its bytes are not the archive member's recorded sha256 (`b2ef95b8…`, intake G13; the dump's committed blob hashes `3c69fe53…`). VERIFIED. So the raw case is "the raw shape as the quarry dumped it"; a test names that file, or a fixture copies its bar 16 verbatim with the source path. Whether the dump's harmony elements equal the archive member's is HYPOTHESIS; the intake claim check read the member (24 of 24 symbols agree between readers).
- The chart's consumers (all `ChordChartScreen.ts` at 3890a893, after CB1): the grid draws one cell per bar with `symbol?.text ?? '—'` (`:183-193`); `markMatch` judges `bars[bar]` against what is held (`:204-216`) and runs at each new bar (`onBeat`, `:220-235`, `markMatch` at `:228`) and on every note event (`:477-486`); at a new bar `onBeat` calls `compBar` if Comp is on (`:232`) and `scheduleBacking(bars[bar]?.pitchClasses)` if Bass + drums is on (`:233`); `compBar` plays the bar's chord for three beats (`:237-247`, `(60 / bpm) * 3` at `:245`); `scheduleBacking` schedules one bar of `barSchedule` from the bar's pitch classes (`:257-267`). VERIFIED.
- `barSchedule` (`app/src/audio/backingLoop.ts:130`) takes one chord per bar: bass root on beat 1 and the chord's third listed pitch class on beat 3 (`:147-155`). The Lab uses it too. VERIFIED (reading); every caller not enumerated (HYPOTHESIS: the Lab and the chart only; PH2 searches).
- `.chart-cell` and `.chart-grid` are shared: the chart (`ChordChartScreen.ts:186`), the Lab's jam (`LabScreen.ts:464`, `LabScreen.css:7-10`, `:75-78`) and the drill screen's form tracker (`DrillScreen.ts:2134`). The grid is four columns, eight from 700 px (`app/src/style.css:4883-4888`, `:4925-4929`). VERIFIED.
- Specs that read one-chord cell text: `app/tests/e2e/chart.spec.ts:44-45`, `:67` (`toHaveText('C')`, `'G7'`). VERIFIED.

---

## Lane PH1: the positioned-harmony contract

### The contract

- **Position (SETTLED).** Each `ChordSymbol` gains `offset`: quarter notes from its measure's start, read by the shared walk at the `<harmony>`'s place, plus its `<offset>` in divisions whatever its `sound` attribute. `measure` keeps today's meaning (the written number), so bar identity on the grid does not move. Grace notes and `<chord/>` notes do not advance the position, `<backup>` and `<forward>` do, `<divisions>` carry, exactly as the tempo walk does.
- **One walk (SETTLED).** Factor the measure walk out of `tempoFromXml.ts` into one place both readers use (a small module beside it, or an exported walker in the same file; OPEN which), or extend the existing walk to yield harmony too. Never a second walker. `tempoFromXml.ts`'s exports and outputs stay exactly as they are.
- **Written order (SETTLED).** `parseHarmony` keeps its written-order output and adds `offset`, so today's `chartBars` returns exactly what it returns now. PH1 deletes nothing the screen calls.
- **Segments (SETTLED in shape; three rules OPEN for the reviewer).** A new function (suggested `chartSegments`) gives, for each bar, an ordered list of `{symbol, start, duration, carried}` in quarter notes:
  - a bar whose first symbol stands at 0 starts with it;
  - a bar with no symbol at 0 starts with a `carried` segment holding the previous harmony, from 0 to its first symbol; a bar with no symbol is one `carried` segment (today's carry, made explicit);
  - segments ordered by position; ties keep written order (part order first);
  - **SETTLED, every event kept (the reviewer, `responses/g6-ph-briefs-cb1.md` §3).** Every positioned harmony at a different offset is its own segment, an identical repeated symbol included: a restatement can mark harmonic rhythm or a re-strike, and PH2's comp strikes at written events. Only an exact semantic duplicate at the same offset (same root, kind's pitch classes, bass and printed text, from two parts or duplicate XML) merges into one, and the census reports how many merged. Two different harmonies at the same offset are never resolved by part order: the reader reports the conflict, and the census lists each one for a disposition before any consumer uses it. The 787 restatement bars are preserved; the census may classify them. Dense display is PH2's problem, never solved by deleting events.
  - **SETTLED, bar length (the reviewer, §4).** An ordinary complete measure's length is the nominal length of the time signature in force, carried like `<divisions>`. An explicit pickup or incomplete measure keeps its actual notated duration, checked against music21, never stretched to a full bar. A measure whose walked length disagrees with the nominal one, unexplained, is reported in the census, never silently clamped. The model carries enough to tell the three apart.
  - **OPEN, positions outside the bar** (before 0 or at or after its end). Report each in the census; no silent clamp. If any falls in Blue Bossa or Insensatez, stop.
- **Bar 1 with no symbol at 0** has a `carried` segment holding nothing (as today's `'—'`): the chart does not wrap a chorus's last chord onto bar 1. The alternative (carry the last bar's chord round the loop) is musically defensible for a repeated chorus but changes what bar 1 shows on its first pass; it loses on the differential.

### Hypothesis the builder inherits

The tempo walk's rules place every bundled harmony where music21 places it, once the harmony offset is applied unconditionally. *Refuted if* the music21 comparison (test 7) disagrees on any symbol whose disagreement the builder cannot explain from the file (a multi-part file, a pickup numbered 0, a timewise file).

### Acceptance (the reviewer's six, then the guards), red first

Each test is written and seen red on the current code (no `offset`, no `chartSegments`) before the change; the report quotes the reds.
1. **Blue Bossa bar 16, both identities.** The raw-shaped quarry dump and the committed `content/scores/pdmx/QmTjGkyTi49tTTBrqFYXcTzdGaMMGrmViuc46mN7qmmGo6.mxl` (sha256 `b2a12ede…`, asserted): Dø7 at 0.0 and G7 at 2.0 (beat 3) in both; the segments are Dø7 [0, 2) and G7 [2, 4).
2. **Insensatez bar 22.** The committed `content/scores/pdmx/QmemwmomPM2tq51u1sTFEAPqdzPkwrJkuKCsMThnKqpvFW.mxl`: Bø7 at 0.0, E7 (add ♭9) at 2.0, the second half of a 4/4 bar (VERIFIED by two readers above; the test asserts the file's sha256 so a moved identity goes red).
3. **A symbol at bar start is at 0.**
4. **A bar with no new symbol carries the previous chord**: one `carried` segment covering the bar; and a bar whose first symbol stands after beat 1 starts with a `carried` segment up to it.
5. **Backup and several voices cannot move a harmony.** A fixture (committed under `app/tests/fixtures/scores/`): voice 1 a whole note; `<backup>` of a whole note; voice 2 two half notes with a `<harmony>` between them. The harmony is at 2.0. A reader that ignores `<backup>` puts it at 6.0; a reader that resets on voice change but ignores durations puts it at 0. Add a grace note and a `<chord/>` note before a harmony (no move) and a `<forward>` (moves it).
6. **Old one-chord bars unchanged.** Over every bundled file with `<harmony>`: for every bar whose segments are exactly one segment starting at 0, that segment's symbol equals today's `chartBars` entry for the bar (text, pitch classes, root, bass), and today's `chartBars` output for every file is byte-identical before and after PH1.
7. **Independent witness, whole corpus.** music21's in-measure offset for every symbol in every bundled harmony file against the new reader's (a script under `docs/prompts/runs/PH1/`, its output committed there): agreements counted, every disagreement listed with its cause or as unexplained.
8. **The tempo reader did not move.** `tempoEvents` over every bundled score, serialised, byte-identical before and after; `tempoFromXml.test.ts`, `scoreModelTempo.test.ts`, `tempoSoundAgainstMark.test.ts` and `importSheet.test.ts` pass unedited.
9. **The census, re-run with the new reader** (committed under `docs/prompts/runs/PH1/`): files with harmony; split bars; restatements (kept, classified); exact same-offset duplicates merged; same-offset conflicts; pickups and nominal-versus-walked mismatches; late first symbols; symbols off a quarter beat; bars with three or more segments; positions outside the bar; files whose bar numbering is not 1..N by ordinal (pickups, repeats); files with harmony in more than one part; metres. These are the denominators PH2 designs and tests against.

### Blast radius, declared

`app/src/score/harmony.ts`; `app/src/score/tempoFromXml.ts` (the factoring only); a new walker module beside them if chosen; `app/tests/unit/harmony.test.ts` and a new positioned-harmony test; the backup fixture; `docs/prompts/runs/PH1/` (scripts and outputs); `docs/08-test-map.md` (the harmony row, `:561`, and the tempo row, `:57`, extended). Any other file, `ChordChartScreen.ts` above all, is a stop.

### Stop conditions

- Test 8 shows any change in a tempo output.
- Test 6 shows any one-chord bar changed.
- A position outside the bar in Blue Bossa or Insensatez.
- The music21 comparison shows an unexplained disagreement in either A7b.1 chart.
- Factoring needs a change to `extractScoreModel` or another consumer of the tempo reader.

### Finish condition

`offset` and `chartSegments` exist; the six cases and the guards are green and were seen red; the tempo and one-chord differentials are null; the census and the music21 comparison are committed; the screen is untouched.

---

## Lane PH2: the chart reads the segments (after CB1 and PH1 land)

### Decided (SETTLED, the reviewer's §3 product shape; the mechanism OPEN)

- **The grid** shows every segment of a bar, its width the segment's share of the bar (`duration / bar length`), a thin divider at each change. A one-segment bar draws exactly as today (same text, same element, same attributes), so `chart.spec.ts:44-45`, `:67` stay green unedited. A `carried` segment shows the carried chord's text as today's carried bars do.
- **The sounding bar and segment.** The bar keeps today's current border; the segment sounding now gets its own mark inside it. The live verdict (✓, ✗, idle) belongs to the segment it was judged against.
- **Comp** strikes each segment's chord at its written position, scheduled on the audio clock from the bar's start (`start × seconds per quarter`), not at the next beat callback: 391 symbols in the corpus stand between beats. A one-segment bar's comp is today's (one chord, three beats). A split segment's chord sounds no longer than its segment.
- **Backing** (CB1's, scheduled from `onBeat` whenever Bass + drums is on): each bass event takes the root or fifth of the harmony sounding at that event's beat, so in a bar split at beat 3 the beat-3 bass note belongs to the second chord. Drums do not change. A one-segment bar's events are byte-identical to today's. `barSchedule`'s one-chord behaviour is unchanged for every caller (the Lab's included); add to it only, or call it per segment, OPEN.
- **The live cell** judges each note-on against the segment sounding at the instant it is struck (the bar position from the audio clock, not the last beat callback). At each segment's start, what is held is re-judged against the new segment, exactly as today's bar start re-judges it (`markMatch` at a new bar, `ChordChartScreen.ts:228`). The alternative (keep a held chord's verdict until a new note) loses: it would leave a ✓ standing on a chord that is no longer sounding.
- **Carry-over** is the model's (PH1): a bar opening without a symbol at 0 sounds and judges the carried harmony until its first written change.

### The look of a split bar, per device (`docs/04-ui-spec.md` §0 R7)

Constraints on every device: the grid's four-bars-to-a-row (eight from 700 px) form is kept, so a phrase still reads as a row; no chord symbol is ever truncated, ellipsised or clipped; one-segment bars look exactly as they do now. Measure the real worst cases, not a guess: Blue Bossa's row 13-16 (bar 16: "Dmi7b5" then "G7", the chart's printed kind text), Insensatez's row 21-24 (bar 22: "Bmi7b5" then "E7"), and the census's densest bar on a bundled chart.

- **Phone upright** (342 × 740, 360 × 780; four cells a row, each about a quarter of the width): segments side by side at their proportional widths; each symbol's text steps down in size to fit its segment, to a minimum the builder sets from the pictures; a segment too narrow for its text at that minimum wraps it (root over quality). If even that fails on a dense bar, propose the fallback (for example the bar's symbols in order with a small duration rule under them) with pictures, and say what it costs. This is the hard case; it gets the most pictures.
- **Phone sideways** (568 × 320: four cells a row, wide cells; 780 × 360: eight a row): proportional segments, text stepping down only where needed; the short height is unchanged by this lane (the transport, keys and grid keep today's order).
- **Tablet** (1024 × 768, 1366 × 1024, both ways; eight cells a row): proportional segments at today's size wherever they fit.

Pictures at every cell above, of each state this lane changes: idle with a split bar on screen; playing with the first and then the second segment sounding; a ✓ in segment 2 with segment 1 idle; a carried segment at a bar start. `docs/04-ui-spec.md` §3b gains the rule and the three looks in the same change. *Eye over spec*: where a picture shows a better look than this section, take it and say why.

### Tests, red first

1. A unit test of the "harmony sounding at position p" lookup over the segments (bar starts, the change instant itself, carried segments).
2. `app/tests/unit/chordChart.test.ts` (jsdom; its `playChordSpy` already spies on comp): on Blue Bossa bar 16, comp strikes Dø7 at the bar's start and G7 two quarters later; on a one-segment bar, one strike of three beats, as before. Red on the screen as CB1 left it.
3. The live cell: a note-on just after the change instant is judged against G7 (a G-B-F shell reads yes in segment 2), and just before it against Dø7; a held D-F-C re-judged at the change reads no in segment 2.
4. Backing: in bar 16 the beat-3 bass note is G7's root or fifth (by CB1's instrumentation in `app/tests/e2e/chart-backing.spec.ts`, extended to read bass pitches); in one-segment bars every event is as before.
5. A browser case on the two A7b.1 charts: bar 16 and bar 22 each draw two segments with the right texts and widths in a 1 : 1 ratio; one bar of *The Entertainer* (or the census's off-beat case) draws its uneven ratio.
6. **Before and after differential.** On a chart with one symbol in every bar (`import.imported-test-tune` in `chart.spec.ts`, and one bundled chart the census lists with no split bar): grid text, attributes, and CB1's four case counts (`chart-backing.spec.ts`: bass, kick, snare, hat, piano starts, clicks) identical before and after. On Blue Bossa: only the split bars' events and cells change, and the report lists each change by bar. Any other change is a stop.
7. **The state machines** (trace in code first, then test): start; stop mid-split-bar (nothing left scheduled for segment 2); suspend and resume (X15) mid-bar; the chorus wrap (bar 1 of chorus 2 with and without a symbol at 0); tempo changed while running; Comp and Bass + drums toggled mid-bar.

### Blast radius, declared

`app/src/ui/screens/ChordChartScreen.ts` (CB1's landed version); `app/src/score/harmony.ts` (delete `chartBars` and its tests once nothing calls it, or keep it with a reason); `app/src/audio/backingLoop.ts` only additively, if chosen; chart-only CSS (new classes inside `.chart-cell`, scoped to the chart screen, never changing `.chart-cell` for the Lab or the drill screen); `app/tests/unit/chordChart.test.ts`, `harmony.test.ts`, `app/tests/e2e/chart-backing.spec.ts` (extended), a new or extended chart e2e spec; `docs/04-ui-spec.md` §3b; `docs/08-test-map.md`; `docs/prompts/checks.json` if a spec reads a shared helper. Any other file is a stop.

### Stop conditions

- A one-chord chart's grid or event counts change (test 6).
- The Lab's jam or the drill screen's form tracker changes in any picture or test.
- `barSchedule`'s output changes for any existing call.
- A device cannot show a split bar without truncating a symbol or breaking the row form, and no fallback has been agreed: bring the pictures back, do not ship a guess.

### Finish condition

The grid, comp, backing and live cell read the one segment model; the six cases' learner-visible consequences hold on screen and in scheduled events; the one-chord differential is null; the three device looks are pictured and written into `04` §3b.

---

## Out of scope

- The chart's fixed four beats in a bar for non-4/4 pieces (30 of 114 harmony files): recorded, classified as an app-wide chart defect, not fixed here.
- The chart printing the file's kind text ("G7" for an altered dominant; Entry 266); the No Chord symbols the reader skips by accident (Entry 266, `<root-step text="">`); Free play's shell naming.
- Bar numbering that is not 1..N (pickups, repeats): the census lists it; the grid keeps today's identity.
- The Python build's `chordCount` (`tools/content/notation.py:122`): counts symbols, which positions do not change.
- Copyright and export; any listening claim.

## Points for the reviewer (flagged, not silently decided)

1. A harmony's `<offset>` moves it whatever its `sound` attribute, unlike the tempo reader's directions: required by the reviewer's own first case (the raw G7 has no `sound` attribute), consistent with music21, and argued from MusicXML 4.0's wording above. Confirm.
2. Settled by the reviewer (§3): every event at a different offset is kept; only exact duplicates at one offset merge; conflicts at one offset are reported.
3. "The grid shows all of them" meets bars of six to sixteen symbols in ten bundled files. PH1's census says what those bars are; PH2 may need a fallback look for them on a phone, brought back with pictures before it ships.

## When to deviate

A premise here is wrong (a VERIFIED line does not reproduce): say so, take the better path inside the declared files, and record one alternative and why it loses (operating-procedure §13). A better path that needs an undeclared file: stop and report.

## What these lanes add to the harness (§14)

- PH1: no browser; music21 from the main checkout's Python 3.11; the corpus differentials read `content/scores/` read-only.
- PH2: the lane's own port, two workers, never 4173; pictures under the worktree's `build/`, the kept ones committed under `docs/prompts/runs/PH2/`.

## Report

Every item done, or an explicit NOT DONE line with the reason. PH1: the reds quoted; the six cases with their values; the tempo and one-chord differentials (counts compared, files compared); the census table; the music21 comparison's agreement count and every disagreement; each OPEN rule's choice with the alternative weighed. PH2: each test's red and green; the differential by chart; the state-machine trace and its tests; the pictures by device cell and state; the `04` §3b text added. Nothing heard.
