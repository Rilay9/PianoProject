# A7a.1 probe: Blues Riff in C through the intake gate; the own-left-hand chain's facts; stopped at placement

Brief: `docs/prompts/runs/curriculum-review-2026-10-05/briefs/probe-bluesriff.md`, under `docs/review/responses/a7a-drafts.md` (§2: a fact probe may run with A7a.1's unrelated PF1 FAILs). Base 523e5b65, 2026-10-07. Nothing learner-facing built; no stage file, lesson, requirement, fact row, catalogue row or app file changed. Nothing heard.

Changed outside this folder: the intake record `../curriculum-review-2026-10-05/intake/Qmb7mkEfKzmNvK5EJKb5Ntph7797QwEeS4anHT8q8wdgKi.md` (new); `docs/chains/A7a.1.yaml`, header comments only (its YAML data is equal before and after, checked by parsing both).

## Files here

- `brief-bluesriff-restaff.md`: the drafted seam for `A7a1-bluesriff-restaff` (not dispatched; three decisions for the reviewer).
- `source/`: the raw member (sha256 `69d5bb7e…`, 5,629 bytes) and the converter's output (`de329f14…`), kept as evidence only.
- Station 1: `csv_hits.py` → `hits.json` (the CSV scan); `scan_br.py` → `scan.json` (shapes and hashes from one tarball streaming); `candidate_row.py` → `candidate_row.out`, `candidates.json` (the one-row workaround); `extract.out`; `quarry.out`, `quarried.json` (gates 1-2); `gates_br.py` → `gates_br.out` (gates 3-4, analyse, identity, element counts); `converter_report.py` → `converter_report.out`, `converter-report.json` (H2); `readers.py` → `readers.out`, `readers.json`, `events-by-role.json` (the two readers); `event_table.py` → `event-table.md`; `h1_scratch.py` → `h1_scratch.out` (the re-staffing mechanism tried in scratch, nothing kept).
- Stations 2-3: `shuffle_read.py` → `shuffle_read.out`, `shuffle.json` (the C shuffle as built); `facts.probe.ts` (run from a throwaway vitest config under `app/build/`, deleted) → `app-facts.json`, `vitest-probe.out`; `chordmatch-subsets.out` (the app's `chordMatch` rule over held subsets, recomputed in Python from `app-facts.json`).
- Station 4: `preflight.out` (`py -3.11 tools/content/preflight_chains.py A7a.1 --out build/pf`), `check_chains.out`.
- `keep.py`: the copy into this folder with machine paths replaced.

## Station 1: intake (INTAKE-GATE)

- **Scan.** 254,077 CSV rows: "blues riff" 2 rows; "12 bar blues" 6 (3 under the artist field "Lessons - Blues"); the creator's rows 3. Four distinct CIDs; only `Qmb7…` is this work (the others: "12 Maten Blues", "Simple 12 Bar Blues Duet in E", "12 Bar Blues").
- **Identity.** Raw sha256 `69d5bb7ee0e3cd6ff1aed15863a4d6340538a50b0108661b7657bd0d1b877481`, equal across two streamings. Converted `de329f149bc9f50c5ec3a04922707f2c743a747c18bb0a392d2fc099ab874d12`, equal across two conversions.
- **The workaround needed two gates set aside, not one.** The shortlist rejects the row first at `piano tracks` (the CSV's 3 tracks), then at `subsets` (licence). Both were set aside for this row only (shape is the XML's to say, and rights gate nothing). This is the third item to need the single-CID workaround, and the first to need the track-count gate set aside.
- **Gates.** G1 PASS. G3 **FAIL by the tool**: quarry gate 2, "lost 57, gained 57"; by hand, a staff relabelling of the merged riff, no note lost. G2, G8 and G9 PASS, run by calling the quarry's own functions after its stop (informative). G4 FAIL by hand (an unpitched drum part). G5 PASS. G6 and G7 by hand: `ensemble`, unsupported. G10 NOT RUN. G11 PASS plus by hand. G12 PARTIAL. G13 PARTIAL (hashes only, nothing committed). G14 NOT RUN. G15 NOT RUN. The brief's stop line applies (a FAIL on G1-G3), so admission stopped there; the fact-gathering the ruling requires went on.
- **H2 confirmed.** The converter merges four music21 parts into two staves: staff 1 holds the riff (57), the voicings (36) and the drums (144 unpitched heads, kept); staff 2 holds the roots (12).
- **Admission.** Personal library: NOT ADMITTED. Curriculum: CANDIDATE.
- **Two readers.** A raw MusicXML walk and music21 agree on all 249 heads and 54 rests, and on every derived claim:
  - the plan is I I I I IV IV I I V IV I I, with bar 12 on I;
  - the voicings are rootless dominant sevenths (3, 5, ♭7);
  - the riff has 18 B4s, in bars 3-4, 7-8 and 12, each over the voicing's Bb3;
  - the riff's Bb5 in bar 9 sits over the G7 voicing's B4;
  - bar 10 holds four right-hand octaves in sixteenths, one double-dotted sixteenth and a sixty-fourth.
- **Correction to the brief's H1.** Bar 10 has one double-dotted sixteenth, not "dotted sixteenths".

## Station 2: the C shuffle

1. **Hand facts.**
   - **What the file holds.** `content/sources/verified-facts.json` holds no row for `exercise.blues.twelve-bar-shuffle.c` (0 hits). The built file (sha256 `fe0a75dd…`, the catalogue's `provenance.identity`) prints staff 1 voice 1 (96 heads, half-note C7/F7/G7 chords) and staff 2 voice 2 (96 eighths, root-fifth-sixth-fifth). The builder writes them as `PartStaff` "RH" and "LH" (`tools/content/blues_forms.py:44-45, 56, 73`), and the row's `facts.hands` is `authored, this repository's score`.
   - **No existing route covers this (premise wrong).** PF1 class 1 counts only `demand`-kind passage proofs as coverage (`preflight_chains.py:441-473`). HD2's `hand` rows exist only "where the model's compatibility reading is established wrong" (`verified_hand.py` docstring), and PF1 does not count them as coverage. The shuffle's default reading is right by construction, so neither the HD route nor any other existing route can clear these FAILs. The rule needs a reviewer decision.
   - **The options.**
     - PF1 accepts a two-staff authored item's recipe hands.
     - Or a confirming `hand` row is allowed: `{item, identity fe0a75dd…, bars [1,12], staff 2, voice 2, kind hand, fact L}`, plus staff 1 voice 1 R.
   - No row written.
2. **The authored-id ref.** The ruling (§9) already chose the mechanism: a static AST read of `PIANOPATH["id"]`. AID1 owns `check_chains.py`, so no rule was drafted here. `exercise.blues.twelve-bar-shuffle.c` is still listed unresolved 9 times, steps 2-5 and 10-14 (`check_chains.out`: 12 unresolved, the other 3 the Blues Riff CID at steps 7-9; 0 failures).
3. **Metronome volume 0 and Blind (H4, by reading).**
   - The Score screen's Metronome row is Off by default (`ScoreScreen.ts:760`). It starts the session's click, which also sounds the count-in (`ScoreSession.ts:575, 903-915`); otherwise the count-in is drawn as dots (`ScoreScreen.ts:3197-3208`).
   - Volume 0 sets the click's gain to 0 (`Metronome.ts:199-200`) and is stripped from the engine's options (`ScoreSession.ts:536`), so the clock, the cursor and the row are unchanged. H4 holds.
   - **New:** the same Settings value is the gain of the Lab's bed and of the chart's backing, bass, chord and drums alike (`backingLoop.ts:198-232`; `LabScreen.ts:777, 918`; `ChordChartScreen.ts:319-325`).
   - Blind hides the stage (notation and cursor drawn hidden, `ScoreScreen.ts:866-874`). It is not on the row (MODE-SHEET §10). The keys guide defaults to `next` (`settingsStore.ts:165`), so "keys guide off" is a Settings change.
4. **`chordMatch` on the shuffle's chart** (`harmony.ts:441-446`; threshold 0.6, `ChordChartScreen.ts:68`; the chart reads C7 C7 C7 C7 F7 F7 C7 C7 G7 F7 C7 G7, pitch classes from the app's own reader):
   - Each figure note alone scores 0.25 (root or fifth) or 0 (the sixth).
   - The whole figure held together scores 0.5.
   - One figure note plus one riff note reaches 0.6 in 0 of 78 pairs.
   - Two figure notes held together plus one riff note score 0.75 ("yes") in bars 5 and 10 (F+C+Eb), 9 (G+D+F) and 12 (G+D+B); in the other eight bars never.
   - So the cell says no to the figure and the riff as written, flickers yes in four bars when notes overlap, and is not feedback on either. The record's "ignore it" stands, with the four bars named.

## Station 3: the Lab's Blues preset under Hold the chords (C)

- **The preset** (`sightReading.ts:2433-2450`): `blues-shuffle` has key C major and progression `blues`, with left hand `walking` and right hand `none`. It runs 12 bars at 84 bpm, opens on bed `hold`, and locks the progression, the left hand and the bars.
- **The bed's chords** (`romansForProgression`, `chordsForProgression`, run): C7 C7 C7 C7 F7 F7 C7 C7 G7 F7 C7 G7. These equal the shuffle's 12 chart symbols, bar for bar.
- **What the bed plays** (`backingLoop.ts:60-107, 119-160`):
  - a bass root on beat 1 and the fifth on beat 3;
  - kick on 1 and 3, snare on 2 and 4, hat on the off-beats;
  - the chord on beats 2 and 4 (the `walking` comp).
- **Lit tones.** The bar's chord tones light on the keys every bar (`LabScreen.ts:489-495, 698`).
- **Right hand None.** Hold is allowed with Right hand None: the refusal is only for Hold with Left hand None, or Play the tune with Right hand None (`LabScreen.ts:415-423`).
- **The scale** (H5 VERIFIED): `tradeScale` is the blues scale (`tradingFours.ts:209-223`; offsets `drills/factories.ts:292`). In C that is C Eb F Gb G Bb. E is outside it, and so are A, B and D.
- **The count line.** It reads "Time round N · X of Y in the blues scale" (`LabScreen.ts:545-560`). It is set when a pass ends (`:688`), replaced by the next pass, and cleared at the start (`:821`) and at stop or redraw (`:964`). Every note played while the bed is on counts, both hands, by pitch class (`:993`; `judgeLabPass`, `sightReading.ts:3099-3117`). Nothing is stored.

## Station 4: stopped at placement

**Preflight.** 22 FAIL before (PF1's committed `preflight-A7a.1.txt`) and after (`preflight.out`): class 1 7, class 3 12, class 4 2, class 6 1. Identical, because the record's data did not change.
- The six FAILs this probe could clear (steps 7-9 in classes 1 and 3, "not in the built catalogue") stay, because the item is not admitted.
- Of the other 16, class 1 steps 2-5 need the hand rule above, and class 4 needs the both-hands seam.

**Drafts, not applied:**
- **The counted run (ruled, §6).**
  - Add `exercise.blues.twelve-bar-shuffle.c` to blues.8's `exerciseOptions`.
  - Narrow the existing `{kind: runs, from: exercises, count: 1}` to `items: ["exercise.blues.twelve-bar-shuffle.c"]`, with `hands: both` once that seam lands.
  - The five present options stay options and count for nothing.
  - Fact for the placement: the shuffle's level is 3.4 (`PIANOPATH`), on a Stage 8 rung with mastery 0.9/0.85. Its band fit was not run (`--candidate-rungs`).
- **The hands gap** (ruled, `A7a-hands-both-requirement`). Today a requirement naming the shuffle would also accept step 2's one-hand Duet row (`rungState.ts:220-254` reads no hands). The ruling's seam is drafted there; not redrafted here.
- **Blues Riff's place.** A blues.8 `songOptions` entry (songOptional, no song requirement), once the re-staffed edition is admitted. Its measured demands wait on the edition (the restaff brief's Station 4).
- **RECONCILIATION A7a.1 row B** (`RECONCILIATION.md:36`): blues.8's Blind sentence and its Pinetop target, carried by the placement lane.

**The experience question per step.** Each step lists the alternative weighed (where one was) and the evidence boundary.

| Step | Answer | Alternative weighed / evidence boundary |
| --- | --- | --- |
| 1 lesson | kept; must also say the Lab counts E, A and B as outside (Station 3) | none better for reading; nothing recorded |
| 2 Duet, L | kept; "click" means switching the Metronome row on | Keep tempo both hands loses the one-hand isolation; a Duet row would count today (hands gap) |
| 3 click off | **overturned in wording**: the Score screen's Metronome row Off (its default) does it for this screen only; Settings volume 0 also silences step 6's bed and the chart's backing (Station 2.3) | Settings volume 0 loses: global side effect |
| 4 Blind | kept; keys guide off is a Settings change | Perform not weighed; Blind not on the row |
| 5 Keep tempo, both | kept; the counted run per §6 | — |
| 6 Hold the chords | kept; the bed's 12 chords equal the shuffle's | Play the tune loses (no right hand in the preset); count is pitch-class only |
| 7 Hear it | blocked on the edition | drums omitted by construction (scratch); HYPOTHESIS until built |
| 8 Duet, R | blocked on the edition | the bar-10 sixty-fourth is inside the 150 ms window (HYPOTHESIS H3) |
| 9 Keep tempo, both | blocked on the edition | counted by nothing |
| 10-13 chart | kept; the cell says yes only in bars 5, 9, 10 and 12 when two left-hand notes overlap a riff note | the Lab's bed loses (always its own bass) |
| 14 chart, volume 0 | kept (Comp and Bass + drums off, so only the click goes) | — |
| 15 independence | kept; nothing observed | — |

**Map amendment lines (for the orchestrator, who owns `ABILITY-MAP.md`).**
- **A7a.1 B3:** "Intake IM-9 ran 2026-10-07 (the A7a.1 probe): NOT ADMITTED.
  - Quarry gate 2 FAIL by staff relabelling; an unpitched drum part; an ensemble shape.
  - The converter merges riff, voicings and drums onto one staff.
  - Two readers agree on the plan, the 18 B4s and bars 9-10.
  - The re-staffed teaching edition is ruled (`A7a1-bluesriff-restaff`) and drafted (`docs/prompts/runs/A7a1/brief-bluesriff-restaff.md`)."
- **IM-9:** "ran; NOT ADMITTED as a source file; waits on the re-staffed edition."

**Draft `docs/pending-review.md` entry.**
- **What a learner meets.** Nothing. Scoreboard unchanged. Nothing heard.
- **Done.**
  - The Blues Riff intake: not admitted (G3 by the tool, G4, G7), with two-reader claim checks bound to the raw identity.
  - The converter's merge measured.
  - The re-staffing seam drafted and its mechanism tried in scratch.
  - The shuffle's hand route found missing (PF1 counts no hand row).
  - Metronome volume found to be the Lab and chart bed volume too.
  - The Lab's blues scale read (E outside).
  - The chart cell's four overlap bars.
- **Open.** The three restaff decisions; the PF1 hand rule for authored two-staff items; step 3's wording.

## INTAKE-GATE (e), items 1-7

1. **Steps.** By tool: the scan, extract, quarry gates 1-2, analyse, identity, the two readers, the converter report. By hand, seven steps: the candidates row; G3's reading; G4; G6 and G7; G11's notation reading; the edition scan's judgement; the claim checks' agreement. A script could take the candidates row next time, as a `--cid` route in `extract.py` and `quarry.py`, and so the gate-2 relabelling check.
2. **Tools.**
   - `quarry.py` refuses a CID outside `candidates.json`; the one-row file got round it.
   - `quarry.py` stops at gate 2, so gates 3-6 had to be called directly.
   - `render_check` was not reached.
3. **Wrong or silent.**
   - `pitch_multiset` keys the staff by part index, so a lossless merge of three or more parts fails gate 2.
   - `analyse` calls a drum part "piano": it reads the program and not channel 10 or `<midi-unpitched>`.
   - G6 gap (i) recurs.
   - The shortlist's track-count gate hides multi-part files before any XML is read.
   - The converter keeps unpitched heads on a piano staff.
4. **Decisions a person made.** Two shortlist gates set aside, for this row only (the probe). Not admitting (the gate's rule). The restaff mechanism (the probe; four alternatives named in the brief).
5. **Reuse.**
   - As-is: `csv_hits.py` and `scan_br.py` (change the terms), `readers.py` (any multi-part file), `converter_report.py`.
   - After a change: `candidate_row.py` (a list of gates to set aside); the quarry's gate 2 (a staff-free check for merged parts, a tool decision).
   - Cannot reuse: nothing found.
6. **Record.** The intake record is complete; the lines above are drafted.
7. **Unverified.** Not heard. Who wrote the riff. What the B naturals do. The tempo (none printed; 120 only in the CSV title). No render of any edition. The Lab and chart bed silence at volume 0 is by reading, not run.
