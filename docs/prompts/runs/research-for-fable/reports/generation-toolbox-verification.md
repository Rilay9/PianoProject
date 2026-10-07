# Generation toolbox verification (2026-10-04)

Research only. Nothing in the repo was changed. Probes ran under
`scratchpad/toolbox/` (Node 22.22.0, Python 3.11.15, music21 10.5.0, OpenJDK 21.0.11).
Large downloads were deleted after use. Scripts and outputs kept there: `dorian_cpsat.py`,
`spell.py`, `pt.py`, `dorian.musicxml`, `solution.json`, `blues.mma`, `blues.mid`,
`swing.mid`, `anmid.py`, `fbcheck.py`, `mma-bin-25.05.0/`.

Access note: the GitHub REST API and github.com issue pages were blocked for this session
(403). Repositories were read with `git clone --depth`. The MusPy issue list came from a
WebFetch summary of the issues page.

## Summary table

| Tool | Claim | Verified? | Evidence | Caveats |
|---|---|---|---|---|
| Tonal | MIT; latest `tonal` 6.5.0 (2026-09-28); previous 6.4.3 (2026-01-18) | yes | `npm view tonal time`, `npm view tonal license` | |
| Tonal | 6.5.0 fails to import under Node; 6.4.3 imports | **yes, reproduced** | probe: CJS and ESM both throw `Cannot find module …/tonal/dist/index.js`; 6.4.3: CJS ok (49 exports), ESM ok | Cause: tsdown migration (commit "Migrate to tsdown (#495)", 2026-07-28) emits `index.cjs`/`index.mjs`/`index.d.cts`/`index.d.mts`, but `package.json` still says `main: dist/index.js`, `types: dist/index.d.ts`, and has no `exports`. 21 of 28 `@tonaljs/*` packages at 6.5.0 have a missing `main`. Not fixed on `main` as of 2026-09-29. |
| Tonal | 6.5.0 usable in a Vite/TypeScript app | **partly** | esbuild bundle (uses `module` field) works and gives output identical to 6.4.3; `tsc --moduleResolution bundler` fails with TS2307 "Cannot find module 'tonal' or its corresponding type declarations"; 6.4.3 passes | So bundling works but type-checking (`npx tsc -b` in this app) would fail on 6.5.0. Vite itself not tested. |
| Tonal | has rhythm-pattern, duration-value, time-signature, voicing, voice-leading, progression, roman-numeral, mode, scale, chord, chord-detect | yes | all present under `node_modules/@tonaljs/` and exported from `tonal` | `RhythmPattern` is generative utilities (binary/euclid/hex/onsets/probability/random/rotate), not a library of named rhythms. `DurationValue` has no triplet values (`get('qt')` is empty). |
| Tonal | `Chord.detect(['E','G','C'])` | yes (probe) | returns `['Em#5', 'CM/E']` | **Ranks Em#5 above C/E** (same with `assumePerfectFifth`). The app's `nameHeldChord` (bass-first, then root search) would answer C major / E. |
| Tonal | Roman numerals / progression in minor | yes (probe), **defect found** | `Progression.fromRomanNumerals('A', ['i','iv','V7'])` → `['A','D','E7']` (minor quality lost); with `'Am'` → `['', '', '7']`; `toRomanNumerals('A',['Am','Dm','E7'])` → `['Im','IVm','V7']`. music21 `RomanNumeral('i'/'iv'/'V7', Key('a'))` → A minor, D minor, E dominant seventh (correct). | Tonal's `RomanNumeral.get('iv')` does record `major:false`, but `Progression` ignores case. `Key.minorKey('A')` gives correct chord lists (natural `Am7 Bm7b5 Cmaj7 Dm7 Em7 Fmaj7 G7`, harmonic `… E7 … G#o7`) but grades are uppercase (`I II bIII IV V bVI VII`). |
| Tonal | voicing / voice-leading on ii-V-I | yes (probe) | `Voicing.sequence(['Dm7','G7','CMaj7'], ['F3','A4'], VoicingDictionary.lefthand, VoiceLeading.topNoteDiff)` → `[F3 A3 C4 E4] [F3 A3 B3 E4] [B3 D4 E4 G4]` | Rootless left-hand (3-5-7-9 / 7-9-3-5) jazz voicings; dictionaries available are `lefthand`, `triads`, `all`. Smooth (common F,A,E then B→ move). Not pedagogically tuned for beginners. |
| MMA | GPL, Python, CLI, MIDI output | yes | mellowood.ca/mma (page text: "command line driven program", "creates MIDI files", "GNU General Public License"); `text/COPYING` = GPL v2 "or any later version" | |
| MMA | latest release | yes | downloads page: stable `mma-bin-25.05.0.tar.gz` (Last-Modified 2025-05-11, SHA1 matched), developer `mma-devl.25.05.3` (Last-Modified 2026-06-20); `MMA/gbl.py` version "25.05.0 -- May/2025" | Home page still says "release 21.09.3"; downloads page is current. PyPI `mma` 1.5.20.2 is an unofficial 2020 fork (hugonxc/mma_pip), not the official release. |
| MMA | runs headless; 12-bar blues probe | **yes (probe)** | `python3 mma.py -G` (build groove DB) then `python3 mma.py blues.mma -f blues.mid`; ~0.1 s wall | Output is **random per run** (three runs → three MD5s) unless the file sets `RndSeed N`; with `RndSeed 7` two runs were byte-identical. |
| MMA | groove library size | yes | 281 library files processed; "Total number of grooves: 2021" (whole lib incl. yamaha/casio/kara conversions); stdlib: 1171 `DefGroove` lines in 124 entries | Counts include variants, intros, endings. Downloads page: "well over 1000 MMA patterns". |
| JJazzLab | LGPL 2.1, Java desktop, latest 5.2.1 | yes | `LICENSE` in repo (LGPL v2.1); `pom.xml` 5.2.1; release-notes page "JJazzLab 5.2.1 release notes"; Maven Central toolkit lastUpdated 2026-04-14 | Exact app release date UNVERIFIED (API blocked); April 2026 inferred from Maven metadata and repo HEAD 2026-04-13. |
| JJazzLab | headless CLI MIDI export | **no (app) / yes via Java API** | App's only `OptionProcessor` (`StartupShutdownSongManager.java`) handles default args = files to open in the GUI; no export option found in source. Separate **JJazzLab Toolkit** (LGPL 2.1, `org.jjazzlab.toolkit:jjazzlab-toolkit:5.2.1`, "without graphical user interface") has a demo that builds a 12-bar blues leadsheet in code and calls `SongMidiExporter.songToMidiFile(...)`. | The application is GUI-only for export (drag from mix console). Headless use means writing Java against the Toolkit, which requires **Java 25+**; this machine has Java 21, so the Toolkit was not run. Licence of bundled Yamaha-format styles UNVERIFIED. |
| FiloBass | dataset of jazz bass lines; ISMIR 2023 | yes | Riley & Dixon, "FiloBass: A Dataset and Corpus Based Study of Jazz Basslines", ISMIR 2023, arXiv 2311.02023; Zenodo 10069709 v1.0.0, 2023-11-03 | |
| FiloBass | contents, format, method, licence | yes | zip (434 MB, MD5 matched Zenodo): 48 tracks × {musicxml, musicxml_no_repeats, midi_from_score, midi_downbeat_aligned, midi_fully_aligned, syncpoints json, bass-stem mp3} + `note_data.csv` (53,656 rows: 53,382 notes, 274 rests). Paper: Melodyne "Melodic" detection on Demucs-separated stems of Aebersold backing tracks, manually corrected, every note checked at least twice, proof-read by a professional jazz bassist. Zenodo licence: CC BY 4.0. | Source audio is Aebersold play-along recordings; whether CC BY 4.0 on derived stems/transcriptions is clear of Aebersold's and the composers' rights is UNVERIFIED (not a legal judgement). Tunes include copyrighted standards. |
| FiloBass | parse with music21 | yes (probe) | all 48 MusicXML files: 12,497 measures, 1 wrong-length measure (Tangerine m.330, final bar 3 beats); written range E2–C5 typical (bass clef with `<transpose chromatic=-12>`, i.e. sounding octave lower — plausible double-bass range); chord symbols present in every file; bass note on a chord-symbol onset equals chord root between 77/145 (Blues-By-Five) and 334/357 (Milestones) | Exported by Soundslice. Harmony `kind` uses `other` with text (e.g. `7b9`) in places. |
| MusPy | MIT; latest 0.5.0 (2022-04-16) | yes | PyPI JSON; repo LICENSE | |
| MusPy | maintenance | partly | last repo commit 2024-01-25 (CI/merge); no release since 2022-04; 21 open issues incl. #84 "truncates MIDI files' lengths when converted to numpy arrays" (2025-10-21), #82 tempo distortion event→MIDI (2024-05), #69 MusicXML harmony parsing, #77/#78/#34 dataset download failures | Issue list via WebFetch summary, not read directly. |
| MusPy | works with music21 10.5.0 | yes (probe) | installed 0.5.0 with music21 10.5.0: `read_midi`, `read_musicxml` (FiloBass Autumn-Leaves, 858 notes), `to_music21`, piano-roll, `pitch_range`, `scale_consistency` all ran | Not exhaustive. |
| OR-Tools CP-SAT | Apache 2.0; latest 9.15.6755 (2026-01-14) | yes | PyPI JSON | |
| OR-Tools CP-SAT | solves the Dorian exercise spec quickly; detects infeasibility | yes (probe) | see §6 | **Owner's proposed contradiction is not contradictory**: it solved OPTIMAL. The output satisfies every rule but is musically poor (see §6). |
| partitura | reads back the MusicXML | yes (probe) | partitura 1.9.0 (Apache 2.0, 2026-05-25): 49/49 RH notes match pitch spelling, onset and duration; key `(0, 'dorian')` | |
| Abjad | requires LilyPond | yes | PyPI description of abjad 3.31 (MIT, 2025-10-31): "Abjad requires LilyPond 2.25.26 (or later)" | Not adopted; nothing further checked. |

## 1. Tonal

- Packages at `tonal@6.5.0` (exact pins): abc-notation 4.9.2, array 4.8.5, chord 6.2.0, chord-type 5.2.0,
  collection 4.9.0, core 5.0.3, duration-value 4.9.0, interval 5.1.0, key 4.11.3, midi 4.10.3,
  mode 4.9.3, note 4.12.2, pcset 4.10.2, progression 4.9.3, range 4.9.3, rhythm-pattern 1.0.0
  (published 2024-07-23, never updated), roman-numeral 4.9.2, scale 4.13.5, scale-type 4.9.3,
  time-signature 4.10.0, voice-leading 5.1.3, voicing 5.1.4, voicing-dictionary 5.1.4, chord-detect 4.9.2,
  plus pitch, pitch-distance, pitch-interval, pitch-note.
- Repo `tonaljs/tonal` is active: commits 2026-09-28/29 (#496–#506).
- Import failure mechanism (6.5.0): see table. Bundler resolution via `module` works; TypeScript
  resolution via `types` does not. A pin to 6.4.3 avoids both.
- Probe outputs 6.4.3 vs 6.5.0 (6.5.0 via esbuild bundle) are identical apart from export order.

Mapping onto the app's hand-maintained tables (read only):

| App (`app/src/engine/…`) | Tonal equivalent | Fit |
|---|---|---|
| `drills/theory.ts` `CHORD_QUALITIES`, `parseChordSymbol` | `ChordType.get`, `Chord.get(sym).intervals/notes` | App works in pitch-class integers; Tonal gives spelled notes. |
| `drills/theory.ts` `nameHeldChord` | `Chord.detect` | Tonal ranks `Em#5` first for E-G-C; app's bass-first rule is better for learners. |
| `drills/theory.ts` `MODE_STEPS`, `modePitches`, `parseModeName` | `Mode.get(name).intervals`, `Mode.notes`, `Scale.get('D dorian').notes` | Direct. |
| `drills/theory.ts` `CHORD_SCALES`, `chordScaleFor` | `Chord.chordScales` | Tonal returns every compatible scale (Dm7: `minor`, `minor blues`, `dorian`, `phrygian`, … `chromatic`); the app deliberately picks one. Not a drop-in. |
| `drills/theory.ts` `romanToChord`, `secondaryToChord`, `anyRomanToChord` | `RomanNumeral.get`, `Progression.fromRomanNumerals`, `Key.majorKey/minorKey` (`chords`, `secondaryDominants`) | `Progression` loses minor quality (defect above). `Key.*.chords` lists are correct. |
| `drills/theory.ts` `NOTE_VALUE_BEATS` | `DurationValue.get(x).value × 4` | No triplet entry in Tonal. |
| `drills/theory.ts` `parseTimeSignature` | `TimeSignature.get` | Direct (adds simple/compound type). |
| `drills/theory.ts` `noteNameToMidi`, `intervalNameToSemitones` | `Note.midi`, `Interval.semitones` | Direct. |
| `sightReading.ts` `LAB_KEYS` (`fifths`) | `Key.majorKey(t).alteration` (Gb → -6) | Direct. |
| `sightReading.ts` `voiceChord`, `romanToLabChord` | `Voicing.search/sequence` + `VoicingDictionary.triads/lefthand`, `VoiceLeading.topNoteDiff` | Dictionaries are jazz-oriented; a beginner voicing set would still be project data. |
| `score/harmony.ts` `chordMatch` | `Chord.get(sym).notes` → chroma | Partial. |

## 2. MMA (Musical MIDI Accompaniment)

- Official: https://www.mellowood.ca/mma/ and /mma/downloads.html. GPL v2-or-later. Pure Python
  (2.7 or 3.x), no dependencies. Stable 25.05.0 (May 2025), developer 25.05.3 (June 2026).
- Input: a text song file of directives plus numbered bar lines with chord symbols; `Groove <name>`
  selects the style. Output: Standard MIDI File.
- Styles relevant to beginners exist in `lib/stdlib`: swing, easyswing, fastswing, blues,
  slowblues, fastblues, shuffleboggie, countryblues, 50srock, basicrock, softrock, 8beat, waltz
  (several), bossanova, samba, chacha, beguine, tango, calypso, march, polka, folk, ballad, popballad.
- Probe (`blues.mma`: Tempo 100, `Groove Blues`, C7 F7 C7 C7 | F7 F7 C7 C7 | G7 F7 C7 G7):
  - 12 bars of 4/4 (48 quarters). Tracks: Drum (48 events), Bass (6 notes), Walk (36 notes),
    Chord (30 piano chords). Bass/walk downbeat = chord root in **8/12** bars (bar 5 F7 → A2,
    bars 6 and 10 F7 → B♭2, bar 11 C7 → G2); 25/42 bass notes are chord tones. The walking line
    is randomised scale/approach motion; B♭ on an F7 downbeat is a non-chord tone.
  - Same chart with `Groove Swing`: Drum, Chord-Guitar, Chord, Bass. Bass downbeats = root in
    **12/12** bars, 48/48 bass notes are chord tones; two-feel with triplet pickups, so swing is
    rendered in the MIDI timing (onsets at 1.667, 3.667).
  - Not listened to. Nobody in this process heard the output.

## 3. JJazzLab

- https://github.com/jjazzboss/JJazzLab: LGPL 2.1, Java/NetBeans platform desktop app, version 5.2.1.
- Headless: the **application is GUI-only for MIDI export** (export is by dragging from the mix
  console: https://jjazzlab.gitbook.io/user-guide/editors/mix-console). Its command-line handling
  only opens `.sng` files.
- The **JJazzLab Toolkit** (https://github.com/jjazzboss/JJazzLabToolkit, LGPL 2.1, Maven Central
  `org.jjazzlab.toolkit:jjazzlab-toolkit` 5.1 and 5.2.1) is the engine "without graphical user
  interface". Its demo creates a song in code (`SongFactory.createEmptySong`, `CLI_Factory.createChordSymbol`),
  picks a rhythm (`Cool8Beat.S737.sst-ID`) and writes MIDI with `SongMidiExporter.songToMidiFile`.
  Requires Java 25+. Not run (Java 21 here). A build-time use would be a small Java program, not a CLI.

## 4. FiloBass

- Riley & Dixon, ISMIR 2023 (Milan). https://arxiv.org/abs/2311.02023, https://zenodo.org/records/10069709,
  https://aim-qmul.github.io/FiloBass/. CC BY 4.0, 434 MB zip.
- 48 Aebersold play-along tracks, about 5 hours of audio, 12 bassists (Rufus Reid and Steve Gilmore
  account for about half the notes). Repertoire is standards and jazz tunes (All The Things You Are,
  Autumn Leaves, C Jam Blues, Now's The Time, Sonnymoon For Two, Four, Oleo …): walking 4/4 swing.
- Formats: score MusicXML (with and without repeats), MIDI from score, downbeat-aligned and fully
  aligned performance MIDI, sync points JSON, bass-stem MP3, note-level CSV with chord, degree and
  interval columns.
- music21 check: see table. Bars add up (1 short final bar in 12,497). Ranges are double-bass
  plausible. Chord-root-on-chord-onset rates of roughly 50–94 % per tune are consistent with real
  walking lines (approach notes, inversions).

## 5. MusPy

- https://github.com/salu133445/muspy, https://pypi.org/project/muspy/. MIT. 0.5.0 (2022-04-16) is
  the latest; repo HEAD 2024-01-25. Low maintenance.
- Does: a `Music` object model; I/O to MIDI, MusicXML, ABC, music21, pretty_midi, pypianoroll;
  representations (pitch, event, piano-roll, note); dataset loaders (Essen, Haydn, JSB, Hymnal,
  LMD, MAESTRO, MusicNet, NES, NMD, Wikifonia, EMOPIA, music21 corpus); objective metrics.
- Known issues: listed in the table (#84, #82, #80, #79, #77, #78, #69, #56, #34).

## 6. OR-Tools CP-SAT probe

Spec as encoded (`scratchpad/toolbox/dorian_cpsat.py`, 166 lines, 136 non-blank non-comment):

- Grid of eighth-note slots. Bars 1–7: each beat is one quarter or two eighths (solver chooses).
  Bar 8: final whole note.
- Pitch = index into D Dorian C4…E5 (B always natural). Final note D4 or D5 on bar 8 beat 1.
- No melodic interval > 5 semitones between consecutive onsets. Steps (1–2 semitones) ≥ 70 % of
  intervals (`10·steps ≥ 7·intervals`).
- B natural on at least 4 onsets. Range ≤ 12 semitones, span minimised (the "8 preferred" rule as
  an objective); a second run makes span ≤ 8 hard.
- Bars 1–2 = bars 5–6 in rhythm and pitch.
- LH vamp Dm G Dm G Dm G Dm Dm (roots D, G). No RH-root octave/unison on two consecutive
  downbeats (roots always move, so that is a parallel octave).
- Added, not in the owner's spec: RH downbeat is a tone of the bar's chord.

Results (8 workers, Python 3.11, ortools 9.15.6755; times are this machine's wall clock, an
indication only):

```
[base, span<=12, minimise span] OPTIMAL ~0.5 s   span 3, B x17, steps 34/48
  bar 1 Dm: D5(e) C5(e) D5(q) C5(q) C5(q)
  bar 2  G: B4(e) C5(e) B4(e) C5(e) C5(q) B4(e) C5(e)
  bar 3 Dm: D5(e) C5(e) B4(e) C5(e) B4(e) C5(e) B4(e) C5(e)
  bar 4  G: B4(e) C5(e) B4(e) C5(e) B4(e) C5(e) B4(e) B4(e)
  bar 5 Dm: (= bar 1)   bar 6 G: (= bar 2)
  bar 7 Dm: D5(e) C5(e) B4(e) C5(e) B4(e) C5(e) B4(e) C5(e)
  bar 8 Dm: D5(w)
[base, hard span<=8] OPTIMAL ~0.3 s   span 7, B x12, steps 33/47
  bar 1 Dm: D5(e) E5(e) D5(e) C5(e) D5(q) B4(e) A4(e)
  bar 2  G: B4(e) C5(e) D5(q) C5(q) C5(q)
  bar 3 Dm: D5(e) C5(e) B4(e) A4(e) B4(e) A4(e) B4(e) A4(e)
  bar 4  G: B4(e) C5(e) B4(e) A4(e) B4(e) A4(e) B4(e) C5(e)
  bar 5-6 = bars 1-2
  bar 7 Dm: A4(q) B4(e) D5(e) D5(e) A4(e) C5(e) E5(e)
  bar 8 Dm: D5(w)
[enumerate, no objective, 1 worker] 51 distinct solutions in 5.0 s (stopped by time limit)
[owner's contradiction: B>=12, no repeated notes, span<=7] OPTIMAL ~0.3 s  -> NOT infeasible
  (B-C-D oscillation satisfies it: span 3, B x12)
[real contradiction: B>=4 with span<=2 (B..D needs 3)] INFEASIBLE ~0.2 s
```

Findings:
- CP-SAT handles this many simultaneous rules in well under a second and proves infeasibility as fast.
- The owner's suggested contradiction is satisfiable; a genuine contradiction must be checked, not assumed.
- **Product judgement (inferred, not heard):** the solutions obey every rule and are poor music. The
  span-minimised one is a B–C trill for most of eight bars, sits on the top of the range, and never
  touches the low tonic. The span ≤ 8 one is better but still oscillates (B A B A B A). A teacher would
  reject both. Rules like "no a-b-a-b oscillation", contour, phrase shape, cadence approach and tonic
  placement were not encoded, and whether they fix it is UNTESTED.

music21 spelling and round-trip (`spell.py`, 20 lines; `pt.py`, 16 lines):
- `key.Key('d','dorian')` → 0 sharps; `scale.DorianScale('d')` D E F G A B C D. RH notes spelled
  from the Dorian table, no accidentals printed; LH whole-note chords Dm (D3 F3 A3) and G (G2 B2 D3);
  8 measures; written to `scratchpad/toolbox/dorian.musicxml`.
- partitura 1.9.0 `load_musicxml`: 49/49 RH notes equal in spelled pitch, onset and duration;
  24 LH notes; key signature `(0, 'dorian')`.

## 7. Abjad

abjad 3.31 (MIT, 2025-10-31) requires LilyPond 2.25.26 or later (PyPI description). Not adopted, so
nothing further was checked.

## Sources

- https://www.npmjs.com/package/tonal ; https://github.com/tonaljs/tonal (cloned)
- https://www.mellowood.ca/mma/ ; https://www.mellowood.ca/mma/downloads.html
- https://github.com/jjazzboss/JJazzLab ; https://github.com/jjazzboss/JJazzLabToolkit ;
  https://www.jjazzlab.org/en/download/release-notes/ ;
  https://jjazzlab.gitbook.io/user-guide/editors/mix-console ;
  https://repo1.maven.org/maven2/org/jjazzlab/toolkit/jjazzlab-toolkit/maven-metadata.xml
- https://zenodo.org/records/10069709 ; https://arxiv.org/pdf/2311.02023 ; https://aim-qmul.github.io/FiloBass/
- https://pypi.org/project/muspy/ ; https://github.com/salu133445/muspy ; https://github.com/salu133445/muspy/issues
- https://pypi.org/project/ortools/ ; https://pypi.org/project/partitura/ ; https://pypi.org/project/abjad/
