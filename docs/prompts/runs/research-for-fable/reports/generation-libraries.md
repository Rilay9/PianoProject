# Generation libraries: which custom responsibilities an established library could delete

Research only, 2026-10-03. Nothing in the repo was changed or run. The probes were throwaway scripts in the scratchpad. The OR-Tools, partitura and Tonal installs used for them have been deleted.

**The question.** Which of PianoProject's exercise-generation responsibilities can an established library take over, so that custom code is *deleted*? Whether a library can make music is not the question.

**The short answer.** The generator is already mostly a thin layer over music21. Its spelling helpers deliberately work around music21 behaviours that the probes below confirm, and music21 itself still has open issues on those behaviours. Below the matrix is a short list of real deletions. Most of them are small. The largest one is on the browser side (Tonal), and it is a risk trade rather than a free win.

---

## 1. Current custom mechanisms (map)

Line ranges come from reading the files. Line counts are rough and include docstrings, which are often half the block.

| # | Responsibility | Where (file:line) | Size | What it actually does |
|---|---|---|---|---|
| R1 | Scale-degree spelling | `generate_exercises.py:1928` `scale_pitches`; `:1584` `_diatonic_run`; `study.py:373-399` `_spelled`/`pitch_at`/`midi_at` | ~20 + 10 + 30 | Already calls music21: `scale.MajorScale/MinorScale.nextPitch`, `getPitches`, `key.Key.pitchFromDegree`. The custom part is the octave arithmetic and the evaluator's step numbering. |
| R2 | Interval-spelled transposition | `generate_exercises.py:3480` `SEMITONE_INTERVAL`, `:3683` `up`, `:3609` `by_octaves` | ~45 | Maps semitones to named intervals, because `Pitch.transpose(int)` spells by pitch class. |
| R3 | Enharmonic policy (readability) | `:3500` `UNWRITTEN`, `:3644` `_readable`, `:3694` `_transpose_name`, `:3725` `chart_root`; `:553` `UNWRITABLE_MINOR`/`minor_key` | ~150 (≈35 code) | The project's *policy*: respell double accidentals; keep E♯/F♭ when the key or chord gives them; respell a borrowed root that is C♭/F♭/B♯/E♯; choose the cheaper root for approach chords. Uses `simplifyEnharmonic`/`getEnharmonic`. |
| R4 | Chord construction and naming | `:1441-1494` `SEVENTH_SHAPES`/`SEVENTH_SPELLING`/`seventh_chord`; `:3386-3470` `SEVENTH_VOICINGS`, `TRIAD_INTERVALS`, `triad`, `chord_shape`, `telling_pair`, `_figure`; `study.py:245-250` `CHORDS`, `:411` `chord_pitches`; `blues_forms.py:16-73` | ~150 | Semitone tables plus interval spelling, and figure strings for `harmony.ChordSymbol`. The tables are deliberately small; see the `confirm` docstring, `:648`. |
| R5 | Progressions/forms | `:3431` `II_V_I`, `:3812` `FOUR_CHORD_LOOP`, `:3937-3976` `TWELVE_BAR(_MINOR)`, `:4323` `TURNAROUNDS`, `:2268` `OOMPAH_CHORDS`; `study.py:252-354` `GRAMMAR`/`FORMS`/`draw_plan` | ~60 + ~110 | Each progression is a list of (semitone degree, quality) pairs. The study adds a phrase grammar with half and authentic cadences. |
| R6 | Voicing / voice leading | `:3511` `in_guide_tone_window`, `:3519` `alternating_forms`, `:3536` `place_near`, `:3760` `make_seventh_voicing`, `:4530` `make_open_voicing`; `study.py:442-546` `lh_root`/`lh_voicing`/`texture_events` | ~250 | Octave placement nearest the previous chord, A/B rootless alternation, and keeping the left hand within F2–C4. |
| R7 | Fingering conventions | `:74-300` Clementi-verified scale tables, `:304-340` arpeggio, `:1351` `chromatic_finger`, `:1603-1606` double 3rds/6ths, `:3978` `walking_bass_fingers`, `:991` `expand_fingering` | ~330 | Sourced tables (Clementi Op. 42 via Mutopia; McLain 1974), checked by `tests/test_fingering.py`. |
| R8 | Fingering export workaround | `:627` `fingered_chord`; `:898` `print_as_contracted` | ~45 | Works around music21 dropping `Fingering` on notes inside a chord. |
| R9 | Rhythm/metre/bar filling | `:891` `finalize` (`makeMeasures`, `makeTies`), `:801` `pad_final_bar`; `:3114-3190` `MeterSpec`; `study.py:492, 636-645, 735-780` | ~25 + ~80 + ~60 | `finalize` is already music21. `pad_final_bar` hand-fills the last bar with a rest. |
| R10 | MusicXML writing / reproducibility | `:926` `write` → `convert.py:1902` `write_mxl`, `:1749` `deterministic_ids`, `:1789` `without_encoding_date`, `:1861-1900` `pinned_archive`/`normalise_archive` | ~200 | music21 writes the file. The project then pins ids, the date and the zip metadata so the bytes are reproducible. |
| R11 | Structural guards | `:648` `confirm`, `:728` `confirm_fingering`, `:781` `confirm_not_silent`, `:824` `confirm_playable`, `:3562` `fits_on_the_keyboard`, `:3584` `one_of` | ~250 | Checks the symbol against the notes, that the fingering is monotone, that the score is not silent, and that every note is between A0 and C8. |
| R12 | Physical gate | `family_contracts.py:298-523` (`physical_facts`, `hand_moves`, `crossing_against_the_hand`, `physical_faults`) | ~225 | Span, hand moves against time, fast repeats, rate, continuous playing. |
| R13 | Contracts / pedagogical gate | `family_contracts.py` (600) + `family_contracts.json` (6,493 lines, 57 families) | large | Data plus the readers of that data. |
| R14 | Musical evaluator | `musical_evaluator.py` (931) | 931 | Python port of the app's D1 phrase scorer (contour, motif, arrival, cadence, harmony, leaps). |
| R15 | Search: draw → hard check → score → choose | `study.py:782-1180` `Realiser` (`draw`, `_choose` weighted walk, `hard_faults` ~990-1095, `compose` 1137-1180), `BUDGET=600`, `CANDIDATES=24` | ~400 | Rejection sampling with a hard layer, then picks the evaluator's best within a tolerance. |
| R16 | Randomness/seeding | `study.py:793-794` (sha256 of recipe → `random.Random`); `generate_exercises.py:2007-2009`; `app/src/engine/sightReading.ts:255` `makeRng` | ~15 | stdlib PRNG / a few lines of TS. |
| R17 | MIDI → MusicXML (import) | `tools/midi-cleanup/midi_to_musicxml.py`: `read_midi` 241 (music21's low-level `midi` module), `spell_in_key` 206, `quantise` 459, `notatable_pieces` 571, `split_hands` 622, `key_estimate` 727 (music21 `analyze('key')`) | ~1,200 | Records why music21's own MIDI parse was rejected (`read_midi` docstring: extra tied note-heads). |
| R18 | App: pitch/chord/roman theory | `app/src/engine/drills/theory.ts:16-428` (`CHORD_QUALITIES`, `nameHeldChord`, `MODE_STEPS`, `parseChordSymbol`, `romanToChord`, `shellChord`, `secondaryToChord`, `intervalNameToSemitones`); `sightReading.ts:2591-2760` (`romansForProgression`, `romanToLabChord`, `suffixFor`, `chordsForProgression`, `voiceChord`); `score/harmony.ts` `KINDS` (185 lines) | ~410 + ~170 + ~185 | All pitch-class arithmetic with no letter spelling. Five modules import `theory.ts`. |
| R19 | App: MIDI→step/alter spelling and MusicXML writer | `app/src/engine/musicXmlWriter.ts:118-171` `midiToPitch`, `spelledPitch`; the whole writer (397 lines) | ~60 / 397 | Flat-or-sharp by key preference, plus a per-pitch-class override map. |

---

## 2. Library responsibility matrix

| Responsibility | Current custom mechanism | Candidate library | What it can replace | What stays project-specific | Evidence / confidence | Recommendation |
|---|---|---|---|---|---|---|
| R1 Scale-degree spelling | `scale_pitches` :1928, `study._spelled` :373 | music21 10.5.0 (already pinned) | Nothing more. These already *are* music21 calls (`nextPitch`, `pitchFromDegree`, `getPitches`). | Octave arithmetic; the evaluator's step numbering. | **Observed:** `key.Key('A-').getScale()` → A♭ B♭ C D♭ E♭ F G; G♭ major → …C♭…; `pitchFromDegree(7)` in F♯ → E♯. High. | **Keep current.** It is already a thin layer. |
| R2 Interval-spelled transposition | `SEMITONE_INTERVAL`/`up`/`by_octaves` :3480/:3683/:3609 | music21 `interval.Interval` | Only the 20-entry table, in theory. | The table itself. music21's integer interval is chromatic: **observed** `interval.Interval(4).transposePitch(C#4)` → **F4**, not E♯4, and `Interval(6).name` is `d5` where the table says `A4`. `Pitch('D-4').transpose(24)` → C♯6. | High. The table exists *because* of music21 defaults. | **Keep current.** |
| R3 Enharmonic policy | `_readable`, `_transpose_name`, `chart_root`, `UNWRITTEN` :3500-3760 | music21 `simplifyEnharmonic`/`getEnharmonic` (already used); Tonal `Note.simplify`/`enharmonic` | Nothing. The primitives are already library calls. | The *policy* (which spellings a reader should see) is pedagogy: keep E♯ in F♯ major, print B7 not C♭7 as the tritone sub in B♭, choose the cheaper approach-chord root. **No library decides this.** | **Observed:** `ChordSymbol('G-m7')` → G♭ B𝄫 D♭ F♭; `RomanNumeral('bII7', B-)` → C♭ E♭ G♭ B♭; `RomanNumeral('viio7', G-)` → …E𝄫. In both libraries a library spelling is the input to `_readable`, never a replacement for it. | **Keep current.** |
| R4 Chord construction | `seventh_chord` :1481, `TRIAD_INTERVALS`, `chord_shape`, `study.chord_pitches` :411, `blues_forms` | music21 `roman.RomanNumeral`, `harmony.ChordSymbol` | `study.CHORDS` + `chord_pitches` (~25 lines) could become `RomanNumeral(name, key).pitches`. **Observed:** `V7` in c → G B♮ D F (leading tone raised automatically); `VII`/`VI` in minor correct. It could also fix the latent semitone-spelling hazards below. | Quality vocabulary for jazz/blues: **observed** `RomanNumeral('IV7', C)` is diatonic (F major 7), so a blues IV7 needs an explicit quality anyway. Semitone+quality tables are simpler for blues/jazz families. `bVI7` in E♭ minor came out as C𝄫 E𝄫 G𝄫 B♭: music21's minor-mode "b" lowers the already-minor VI. | High for study (diatonic); low for jazz families. | **Investigate (small).** Use RN in `study.py` only. Delete ~25 lines and drop one route by which a chord is spelled. |
| R4a Latent spelling hazard | `blues_forms.roots` :25 (`tonic_pitch.transpose(step)` by semitones); `make_modal_vamp` :5937-5950 (`root.transpose(step)`, `chord_root.transpose(third)`) | music21 `interval`/`RomanNumeral` | Replace integer transposes with interval names or RN figures. | — | **Observed:** integer transposes of a B♭ tonic are correct, but E♭ IV → **G♯**, A♭ → **G♯** C♯ E♭, D♭ → C♯ F♯ G♯. modal_vamp in C minor bVI → **G♯** C E♭. **Not live:** shipped blues keys are C/F/G/E/A (`content/scores/authored/blues-12-bar-*.py`) and modal_vamp keys are A/E/D (:6371). Both break the moment a flat key is added. | **Fix as a class** (inside generate_exercises' own rule, R2). This is a hazard in the existing code, not a library adoption. |
| R5 Progressions/forms | tables :3431-4323; `study.GRAMMAR` 252 | music21 `roman` (figures); Tonal `Progression.fromRomanNumerals` (JS) | Spelling of each chord from its figure (see R4). | Which progressions, forms, cadences and harmonic rhythm each rung teaches: curriculum and pedagogy. No library supplies a phrase grammar. RCM/ABRSM syllabi are a *source* for these, not code. | High. | **Keep current.** |
| R6 Voicing / voice leading | `place_near`, `alternating_forms`, `lh_root` | music21 `voiceLeading` (checks only); Tonal `Voicing`/`VoiceLeading` (JS) | music21 offers *checks* (**observed:** `VoiceLeadingQuartet('C4','D4','F3','G3').parallelFifth()` → True), not a voicer. Tonal's voicer is JS-only. **Observed:** `Voicing.search('Dm7', ['F3','A4'])` returned [] in 6.4.3 (open issue #450, "Some chords not returning voicings"). | Register windows (F2–C4 LH, E4–E5 guide tones), A/B alternation, nearest-octave placement: all about the hand on this instrument. | Medium. | **Keep current.** music21 `voiceLeading` could serve as an *independent checker* (CF1 style), but it would delete nothing. |
| R7 Fingering conventions | Clementi tables :74-300, `chromatic_finger` :1351 | pianoplayer 3.0.2 (MIT, 2026-03-02); published: Parncutt et al. 1997; PIG dataset | Nothing. The tables are already the preferred tier (an existing sourced asset, checked against the extracted Clementi chart). | Everything: which convention to teach is a sourced pedagogical choice. | Medium. Library versions verified on PyPI; pianoplayer quality was not evaluated. | **Keep current.** pianoplayer could at most be a second opinion for unsourced families. |
| R8 Fingering-in-chord export | `fingered_chord` :627 | music21 upstream | Would disappear if music21 exported per-note articulations inside chords. | — | music21 issue **#909** "Articulations of notes in chords are uncorrectly written in MusicXML", **open** (opened 2021). | **Keep current.** Re-check on each music21 bump. |
| R9a Final-bar padding | `pad_final_bar` :801 (~23 lines) | music21 `Stream.makeRests(fillGaps=True, timeRangeFromBarDuration=True, inPlace=True)` | The whole function. | — | **Observed:** a 15-eighth part after `makeMeasures` has a last bar of 3.5 quarters; after `makeRests(timeRangeFromBarDuration=True)` it is 4.0 with a trailing 0.5 rest. Not checked: behaviour with pickups, multiple voices or ties into the last bar. The generated items have no pickups, but that is unverified for all 57 families. | **Adopt (small)**, with a byte-diff over the full plan (`--full`). |
| R9b Measures/ties/beams | `finalize` :891 | music21 (already) | Already library. | — | **Observed:** `makeNotation` splits and ties across the barline correctly. | **Keep current.** |
| R10 MusicXML writing | music21 writer + `convert.py` normalisation | music21 (writer); partitura 1.9.0 `save_musicxml`; Verovio 6.3.0 (LGPL); pymusicxml 0.6.0 (GPL-3.0) | The writer is already music21. Swapping writers deletes nothing, and the reproducibility pass would be needed for any writer. | `deterministic_ids`, `without_encoding_date`, `pinned_archive`: music21 10.5.0 writes `date.today()` unconditionally (the `convert.py:1782` docstring cites `m21ToXml.py`). | High. | **Keep current.** |
| R11 Structural guards | `confirm_*` :648-845 | none | — | They state project facts: the symbol agrees with the notes, the fingering is monotone, the score is not silent, every note is on the keyboard. Each is a few lines over music21 iteration. | High. | **Keep current.** |
| R12 Physical gate | `family_contracts.py:298-523` | none found (pianoplayer models cost, not gates) | — | Hand-span, move-against-time and repeat rules are judgements on this instrument and this learner. | Medium. | **Keep current.** |
| R13 Contracts | `family_contracts.json/.py` | JSON Schema (`jsonschema` already a dependency) | Possibly part of the shape validation in `family_contracts.py`, if any is hand-written (not measured). | All contents. | Low. | **Investigate only if** the reader validates by hand. |
| R14 Musical evaluator | `musical_evaluator.py` | music21 `analysis`/`features` (jSymbolic-style) | Nothing equivalent. Feature extractors measure, they do not score phrase shape against a cadence plan. | All of it. It must also stay identical to the app's TS scorer. | High. | **Keep current.** |
| R15 Search (draw-and-check) | `study.Realiser` :782-1180 | Google OR-Tools CP-SAT 9.15.6755 (Apache-2.0, PyPI 2026-01-14); python-constraint2 2.7.3 (BSD-2, 2026-08-18); MiniZinc Python 0.10.0 (MPL-2.0, needs the MiniZinc binary) | In principle, the hard layer (`hard_faults`: range, leap cap, three-repeat, strong-beat chord tones, cadence tone and approach, target densities) as constraints instead of rejection. Perhaps ~100-150 lines of `_choose` weights + `hard_faults` would become an equally long model. | The evaluator's score: contour shape, motif restatement, sequence and "earliest within tolerance" are non-linear. A solver still has to *generate many and score* to choose. Variety, motif and restatement logic stay custom. | **Observed (CP-SAT probe, 32-note melody, the hard rules above):** solves, is deterministic at `num_workers=1` with a fixed `random_seed`, varies by seed, and *proves* infeasibility instantly. My first model was infeasible and the solver said so, which rejection sampling cannot do. But the seeded random objective produced an aimless line: validity is easy, musicality is the evaluator's job. **Observed in shipped catalog** (`app/public/content/catalog.json`, 24 studies): draws 27–234 (median 45) of the 600 budget, and every study reached 24 valid candidates. The current loop is not failing. | **Keep current.** Adopt CP-SAT only if refusals (`StudyRefusal`) start appearing at new rungs or the hard layer grows combinatorially. The plan already says "OR-Tools: not expected" for N1/N2. |
| R16 Randomness | stdlib `random.Random` seeded from the recipe hash; TS `makeRng` | none needed | — | — | High. | **Keep current.** |
| R17a MIDI reading | `read_midi` (music21 low-level `midi`) | mido 1.3.3 (MIT, 2024-10-25); pretty_midi 0.2.11.post0 (MIT, 2026-07-28); symusic 0.6.0 (MIT); miditoolkit 1.0.1 (MIT, 2023-11-23) | Swap one reader for another. No deletion: event bookkeeping stays. | Rejection of music21's high-level parse is recorded (`read_midi` docstring). | High. | **Keep current.** |
| R17b MIDI pitch spelling | `spell_in_key` :206 | partitura 1.9.0 `musicanalysis.estimate_spelling` (PS13); music21 issue #1144 "Spell pitches according to key during MIDI import", **open** | Would replace `spell_in_key` if it were good. | Key-based spelling policy. | **Observed:** PS13 on a 16-note A♭-major passage (A♭ scale, D♭ chord) spelled it **G♯ A♯ B♯ C♯ D♯ E♯ F G♯**, which is unusable. A longer context might do better (untested). | **Keep current.** Rejected, with reason. |
| R17c Quantisation / hands split | `quantise`, `split_hands` | music21 `quantize`; partitura `estimate_voices` | Not evaluated in depth. The docstrings record why the project's per-bar grid differs. | Per-bar grid choice, swing detection. | Low. | **Keep current.** Out of generation scope. |
| R18 App pitch-class theory (browser) | `theory.ts:16-428`, `sightReading.ts:2591-2760`, `harmony.ts` KINDS | **Tonal** (`tonal`, MIT; 6.5.0 published 2026-09-28; 6.4.3 2026-01-18) | `CHORD_QUALITIES`/`parseChordSymbol` → `Chord.get`; `romanToChord`/`secondaryToChord` → `RomanNumeral` + `Progression.fromRomanNumerals`; `MODE_STEPS`/`modePitches` → `Mode`/`Scale`; `intervalNameToSemitones` → `Interval.semitones`; `noteNameToMidi` → `Note.midi`. It also adds **letter spelling**, which the app lacks (**observed** in 6.4.3: A♭ major scale correct; `Progression.fromRomanNumerals('Ab', ['IIm7','V7','Imaj7'])` → B♭m7 E♭7 A♭maj7; `Note.transpose('C#4','3M')` → E♯4). Estimate: ~200–300 TS lines could go. | `nameHeldChord`'s bass-first ranking (**observed** `Chord.detect(['E','G','C'])` → `['Em#5','CM/E']`, the wrong first answer for free play; issues #160, #503 open). Quality *words*, chord-scale pedagogy (`CHORD_SCALES`), diminished/half-diminished flags in drills. Open issue #457 "Progression.fromRomanNumerals doesn't respect major/minor": minor-key romans need care. | **Observed packaging defect:** `tonal@6.5.0` from npm has `"main": "dist/index.js"` but ships only `index.cjs`/`index.mjs`, and Node ESM import failed (`ERR_MODULE_NOT_FOUND`), including its sub-packages. 6.4.3 imports fine. Vite would probably resolve `module`, but vitest/Node were not tested. | **Investigate.** This is the largest real deletion, but it is a new runtime dependency in the app, and the app's drills need pitch classes far more than spellings. Pin 6.4.3 or verify that 6.5.x resolves under vitest. Start with `romanToChord`/`secondaryToChord`/`parseChordSymbol` behind the existing function signatures, with the current unit tests as the parity bar. |
| R19 App MIDI→step spelling, MusicXML writer | `musicXmlWriter.ts` | Tonal `Note.fromMidi`/`fromMidiSharps` (spelling only); no maintained JS MusicXML *writer* found | `midiToPitch`'s two-way flat/sharp choice (~20 lines). | Writer structure (397 lines). | Medium. | **Keep current** unless R18 is adopted, in which case route spelling through it. |

**Other libraries, briefly rejected** (version, release date and licence from PyPI):

- mingus 0.6.1 (GPLv3; last release 2020-12-31): stale and GPL.
- musicpy 7.16 (LGPLv2.1+, 2026-09-19): overlaps music21 with no MusicXML advantage.
- abjad 3.31 (PyPI licence field "MIT" but classifier "GPL", 2025-10-31; needs Python ≥3.12 and LilyPond, while this repo runs Python 3.11).
- pymusicxml 0.6.0 (GPL-3.0-only).
- Verovio 6.3.0 (LGPL-3.0): a renderer/converter, useful only as a second parser (plan CF1).
- Hypothesis 6.168.3 (MPL-2.0, 2026-09-28): not a replacement. It is a test-side tool for the CF1 property checks the plan already names.

---

## 3. Notes per library, with sources

**music21 10.5.0.** PyPI shows 10.5.0 as the latest release (2026-06-17), licence BSD-3-Clause, Python ≥3.11. It matches the pin. https://pypi.org/project/music21/
- Probes run on the installed 10.5.0: listed in rows R1–R4, R6, R9.
- The key finding is negative: integer transposition and integer `Interval` are chromatic and respell by pitch class. The project's whole spelling layer exists to avoid that, and the probes confirm the reason is real.
- Open issues relevant here:
  - #909: articulations on notes inside chords are exported wrongly; it is why R8 exists. https://github.com/cuthbertLab/music21/issues/909
  - #1144: MIDI import does not spell by key; it is why R17b exists.
  - #2053: `preferSecondaryDominants` relabels diatonic chords; relevant only if `romanNumeralFromChord` is ever used for checking.
  - #1866: `chordSymbolFigureFromChord` misses sus4.
  - Source: https://github.com/cuthbertLab/music21/issues
- The GitHub API was blocked from this session. Maintenance was read from the PyPI release date and the issues page only.

**Google OR-Tools CP-SAT 9.15.6755.** Apache-2.0, PyPI upload 2026-01-14, Python ≥3.9. https://pypi.org/project/ortools/
- Probe: see R15.
- The Google developer docs were blocked by the egress proxy. Capability claims (table constraints `AddAllowedAssignments`, enforcement literals, `random_seed`, single-worker determinism) are observed from running the probe, not read from docs.
- Fit: it can express the hard layer; it cannot express "sounds like a phrase" except through the existing evaluator.

**python-constraint2 2.7.3.** BSD-2, 2026-08-18. The original python-constraint 1.4.0 dates from 2018-11-05. A plain CSP solver with no optimisation, so it is weaker than CP-SAT for this use. https://pypi.org/project/python-constraint2/

**MiniZinc (python bindings) 0.10.0.** MPL-2.0, 2025-02-25. It needs the external MiniZinc toolchain, which is a heavier runtime than CP-SAT. https://pypi.org/project/minizinc/

**Tonal.** `tonal` 6.5.0, MIT, npm 2026-09-28; the previous release is 6.4.3, 2026-01-18. https://www.npmjs.com/package/tonal
- Observed packaging defect in 6.5.0: see R18.
- Relevant open issues: #503, #450, #160, #155, #457, #387 (browser import). https://github.com/tonaljs/tonal/issues
- It runs in the browser and offline, and it is pure JS.

**partitura 1.9.0.** Apache-2.0, 2026-05-25. It reads and writes MusicXML/MIDI/kern/MEI and has `estimate_spelling` (PS13), `estimate_key`, `estimate_voices` and `estimate_time` (observed in `dir()`). PS13 failed on a short A♭ passage. https://pypi.org/project/partitura/ · https://github.com/CPJKU/partitura

**pianoplayer 3.0.2.** MIT, 2026-03-02. An automatic piano fingering generator. Its quality was not evaluated. https://github.com/marcomusy/pianoplayer

**mido 1.3.3** (MIT, 2024-10-25), **pretty_midi 0.2.11.post0** (MIT, 2026-07-28), **symusic 0.6.0** (MIT, 2026-04-08) and **miditoolkit 1.0.1** (MIT, 2023-11-23) are MIDI I/O libraries. None of them would delete project logic.

**mingus 0.6.1** (GPLv3, 2020-12-31), **musicpy 7.16** (LGPL, 2026-09-19), **abjad 3.31** (2025-10-31; licence metadata inconsistent: field MIT, classifier GPL), **pymusicxml 0.6.0** (GPL-3.0-only, 2026-09-25) and **Verovio 6.3.0** (LGPL-3.0, 2026-08-19) were read from their PyPI pages only.

---

## 4. Highest-value findings, ranked by real code deleted or risk removed

1. **App-side Tonal adoption (R18)** is the only candidate that deletes a meaningful block: roughly 200–300 TS lines of roman, chord and mode tables, and it would give the app letter spelling it does not have.
   - Risks:
     - `tonal@6.5.0` fails to import under Node: `main` points to a file that is not shipped (observed). Pin 6.4.3 or verify.
     - `Chord.detect` ranks inversions differently from free play's bass-first rule.
     - Minor-key roman numerals have an open issue (#457).
   - Recommendation: investigate, keeping the existing signatures and tests as the parity bar.
2. **Latent semitone-spelling hazard (R4a).** It is not a library adoption, but music21's interval or roman API removes it.
   - `blues_forms.roots` would print G♯ for the IV of E♭ and G♯/C♯ for A♭.
   - `make_modal_vamp` would print G♯ for the ♭VI of C minor.
   - Neither is shipped today: the blues keys are C/F/G/E/A and the vamp keys A/E/D. Both break if a flat key is added. The generator's own `up()`/`SEMITONE_INTERVAL` rule already says how to fix them.
3. **`pad_final_bar` → `makeRests(timeRangeFromBarDuration=True)` (R9a).** It deletes ~23 lines with a library call (observed). Adopt only with a full-plan byte-diff.
4. **`study.py` chord spelling → `roman.RomanNumeral` (R4).** About 25 lines, and the minor's leading tone comes for free (observed). Small.
5. **CP-SAT for the study realiser (R15): do not adopt now.** The shipped evidence shows that the draw-and-check loop is not failing: 24/24 studies hit 24 valid candidates in 27–234 of 600 draws. A solver would not delete the evaluator-driven selection, which is where the musical judgement lives. Re-open only if `StudyRefusal`s appear.
6. **The rest is honestly already a thin music21 layer or project policy.**
   - Spelling: R1, R2, R3.
   - Measures, ties and the writer: R9b, R10. R10's normalisation exists only because of music21's writer behaviour.
   - Fingering: R7, a sourced asset. R8 works around an open music21 bug.
   - Guards and gates, the evaluator, contracts: R11–R14.
   - No library found would delete these, and adopting one would only move code around.

**Not checked:**
- music21 behaviour with pickups or voices for `makeRests` padding.
- Tonal 6.5.0 under Vite/vitest; only plain Node ESM failed.
- pianoplayer output quality.
- PS13 on longer inputs.
- Maintenance signals beyond release dates: the GitHub API was blocked.
- No generated score was rendered or listened to. These findings are about code responsibility, not about how any exercise sounds.
