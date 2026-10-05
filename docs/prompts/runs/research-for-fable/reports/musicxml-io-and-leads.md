# musicxml-io probe, and four Python leads, and six PDMX lookups

Research only, 2026-10-04. Nothing in the repo was changed (`git status` clean after every probe).
Scratch work: `scratchpad/mxio/` (dumpers `dump_mxio.mjs`, `dump_py.py`, harness `cmp.py`, `batch.py`).
Readers compared: musicxml-io 0.10.3 (npm), music21 10.5.0 (project's), partitura 1.9.0 (scratch venv).
Comparison key per note: (measure number, offset in bar, spelled pitch, quarter length, grace); ties
compared separately, raw and tie-merged (music21 `stripTies`, partitura `notes_tied`, own merge for musicxml-io).

## Bottom line

- musicxml-io read every shipped file faithfully. Over 812 files it loaded all of them, matched music21 note for
  note on 789, and where the two disagreed it was right twice (music21 drops `<alter>` when
  `<accidental>` is `other` or `natural-sharp`). Twice it gave the literal arithmetic of a malformed
  `<backup>` (negative offset), where music21 gives the intended reading.
- It does **not** fix the lost-fingering problem as it stands. Its ABC parser sees every chord
  fingering but puts them all on the first note of the chord.
- It cannot snip as it stands. There is no range extract, `deleteMeasure` drops bar-1 attributes, and dangling ties
  at a cut pass `validate()`.
- It reads the app's runtime sight-reading MusicXML exactly (14 of 14 phrases).
- A shipped file, `song.classical.mozart-k545-i.alt`, has corrupt `<alter>8/9>` in bar 18.

## Part 1 — musicxml-io

| Claim | Verified? | Evidence | Caveats |
| --- | --- | --- | --- |
| Repo is github.com/tan-z-tan/musicxml-io | Yes | npm `repository` field; cloned it | — |
| Licence MIT | Yes | npm metadata, repo LICENSE, repo page | — |
| Latest version 0.10.3, published 2026-09-11 | Yes | `npm view musicxml-io time`; tag commit "chore: release v0.10.3" 2026-09-11 | 46 versions since first commit 2025-12-27; ~weekly to monthly releases |
| 342 commits | Yes | `git rev-list --count HEAD` on clone = 342; repo page says 342 | single maintainer (npm maintainer list: tan-z-tan); 6 stars, 0 forks |
| Test suite | Yes, ran it | 23 test files, 1177 tests, all passed on the clone (vitest 4.1.5) | — |
| API stability | Yes (stated unstable) | README: "⚠️ This library's API is not yet stable and may change between versions." | pin exact version if adopted |
| README API table matches code | **No, one mismatch** | README: `deleteMeasure(score, part, measure)`; actual d.ts: `deleteMeasure(score, measureNumber)` (deletes in every part) | docs lag code |
| Parse .xml/.mxl, serialize .xml/.mxl | Yes, exercised | all 812 shipped files parsed, with no failures (see Probe 5); PDMX round-trip identical in music21 (144 notes/rests, ties, articulations) | — |
| Validate | Yes, exercised | `validate()` caught a stripped first bar (MISSING_DIVISIONS, STAFF_EXCEEDS_STAVES) | it did **not** flag a dangling tie start left by a cut (snip 1–4 reported valid) |
| Measure/note queries | Yes (exports present, `getAllNotes`/`getHarmonies` used) | `dist/index.d.ts` exports ~100 query fns | — |
| Ties, tuplets, beams, repeats, chord symbols | Ties/tuplets/chords/harmony exercised; beams/repeats listed only | see probes | `<harmony>` kind kept (`A:minor`) |
| Measure insert/delete | delete exercised | see snipping | no "extract range" operation; delete renumbers and drops bar-1 attributes |
| Transposition | Listed (`transpose`, `transposeChecked`) | exports | NOT exercised |
| ABC import | Yes, exercised | 7 ABC files parsed | **chord fingering bug**, below |
| MIDI export, playback timeline | Listed (`exportMidi`, `exportMidiWithTimingMap`, `generatePlaybackTimeline`) | exports, README | NOT exercised; one closed issue #40 "exportMidi Ignores Ties" (closed 2026-05-30) |
| Known issues | Yes | Issues page: 0 open, 1 closed (#40). PRs: 6 open (5 dependabot, 1 demo from 2025-12) | tiny tracker = little outside usage, not proof of correctness |
| Bundle cost | Yes (esbuild, browser, ESM, minified/gzip) | parse 51,067/14,070 B; parseAuto 57,455/17,123; parse+serialize 109,335/27,361; parseAbc 33,384/11,157 | equals README's stated figures; byte sizes are deterministic, not a machine timing |
| Dependencies / formats | Yes | one runtime dep `fflate ^0.8.3`; ESM + CJS; `browser` export condition without `fs`; `engines.node >=20.12.0`; `sideEffects:false` | unpacked 1.7 MB on disk |

### Probe 1: the 7 ABC-route files that lost chord fingerings

| ABC source | `!n!` in .abc | musicxml-io on shipped .mxl (notes / fingerings) | musicxml-io `parseAbc` (notes / fingerings / notes carrying >1 fingering) |
| --- | --- | --- | --- |
| greensleeves-68 | 80 | 80 / **52** | 80 / 80 / 14 |
| greensleeves-chords | 82 | 82 / 37 | 82 / 82 / 15 |
| greensleeves-waltz | 112 | 112 / 52 | 112 / 112 / 30 |
| happy-birthday-simple | 55 | 55 / 25 | 55 / 55 / 10 |
| jingle-bells-g | 58 | 58 / 25 | 58 / 58 / 11 |
| oh-when-the-saints-f | 41 | 41 / 17 | 41 / 41 / 8 |
| row-row-row-your-boat | 51 | 51 / 35 | 51 / 51 / 8 |

- On the shipped greensleeves .mxl all three readers agree: 80 notes, 52 fingerings, 15 chord symbols,
  16 bars, key 0 (A minor), 6/8, G2/F4 clefs, no ties, no notes differ. Raw XML: 52 `<fingering>`
  (grep). So musicxml-io is **faithful to the file**.
- `parseAbc` on `greensleeves-68.abc` **sees all 80** fingerings, but **misplaces chord fingerings**:
  for `[!2!C,!1!E,]` it puts both `2` and `1` on C3 and none on E3. Serialized XML confirms:
  `C3 ['2','1']`, `E3 chord []`. Same pattern in all 7 files (the "multi" column equals the
  number of two-note chords carrying fingerings). Mechanism (source `src/importers/abc.ts`):
  decorations are queued in `pendingNotations` and `attachPendingNotations` dumps the whole queue
  on the next emitted note, which for a chord is its first note. So the count is right and the
  placement wrong; it is not a drop-in fix for the project's lost-fingering problem without a patch
  upstream or a post-pass.
- music21 10.5.0's own ABC parser reads `greensleeves-68.abc` as 80 notes and **0** fingerings, so
  the 52 in the shipped file come from the project's own pipeline, not music21's ABC reader.
- ABC import maps `V:1`/`V:2` to **two separate parts** (P1, P2), not one two-staff piano part, and
  numbers the pickup bar `1` (shipped file: `0`).

### Probe 2: Happy Birthday A#

`imported/song.folk.happy-birthday.mxl`: raw XML has one `<alter>1</alter>` (step A, octave 3,
staff 2, bar 5, a chord tone) and no `<alter>-1`. musicxml-io, music21 and partitura all report
`A#3` at bar 5 staff 2. None respells to B♭. All three: 52 notes, 8 bars, 3/4, key 0, 3 chord
symbols, no note differs. Chord symbols: musicxml-io `C:major, G:dominant, C:major`; music21
`C, G7, C`; partitura `C, G/7, C`.

### Probe 3: snipping with musicxml-io

File: `pdmx/QmQxJ4tsA3Xdsym1ZgNNRkGpiX8cT5yaKnPVMfFVvDDsMo.mxl` (one part, two staves, 42 bars,
3/4, key 0, divisions 10080, two treble clefs; ties cross 4→5 and 8→9). No range-extract
operation exists, so the cut is `deleteMeasure` repeated.

- **Bars 1–4** (delete 42…5): attributes survive because bar 1 is kept. music21: 9/9 notes match
  the original bars with ties, key 0, 3/4, G2/G2. partitura: 9/9 notes; key/time/clefs kept. The tie
  that started in bar 4 is **left dangling** in the XML (`tied type="start"`, no stop). music21 keeps
  it as `start`; partitura silently drops the tie flag. `validate()` returned valid with 0 errors.
- **Bars 5–8** (delete 42…9 then bar 1 four times): the excerpt **loses divisions, key, time,
  clefs and `<staves>`**, because they lived on bar 1. `validate()` does flag it (5 errors:
  MISSING_DIVISIONS, STAFF_EXCEEDS_STAVES). music21 then reads staff-2 notes onto staff 1 and no
  key/time/clef; partitura reads durations 10080× too long (default divisions 1). The incoming tie
  stop at bar 5 is kept as an orphan. A real snipper must copy the effective attributes into the
  new first bar and close or open ties at the cut itself.

### Probe 4: the app's runtime writer

Feasible read-only: `npx tsx` (installed in scratch) imported
`/home/user/PianoProject/app/src/engine/sightReading.ts` directly and called
`generateSightReading({level, seed, bars: 4})` for levels 1–7, seeds 12345 and 999 (14 phrases),
as `tests/unit/sightReading.test.ts` does. musicxml-io read every file; the right-hand pitch
sequence it reads (staff 1, no chord tones, tie continuations dropped) **equals `result.melody`
in all 14**; key and time match the result; `validate()` valid for all 14. Levels 6–7 carry
3:2 tuplets (`<time-modification>`), level 4 carries LH chords (8 `<chord/>`). On L4, L6, L7
(seed 12345) all three readers agree note for note (pitch, offset, duration incl. triplet
1/3 values, ties). Voice labels: generator writes voices 1 and 5.

### Probe 5: all shipped scores, three readers

812 MusicXML files the app ships (`pdmx/` 542, `imported/` 226, `excerpts/` 5, `authored/` 39), each
read by all three readers, raw (ties not merged). Per note the key is (bar number, offset in bar,
spelled pitch, quarter length, grace).

| Result | musicxml-io | partitura 1.9.0 | music21 10.5.0 |
| --- | --- | --- | --- |
| Files that failed to load | **0** | 4 (2 PDMX: `IndexError` in `parse_fingering`; 1 PDMX: `KeyError '512th'`; K545 alt) | 1 (K545 alt) |
| Files compared with music21 | 808 | 808 | — |
| Identical to music21, note for note | 789 | 744 | — |
| Same pitch+duration multiset (ignoring bar/offset) | 806 | 799 | — |
| Disagreements left after removing bar-label-only ones | **3 files** | 48 files | — |

What the disagreements are (each checked against the raw XML):

- **Bar labels, 16 files, not a reading difference.** Bars numbered like `20X1` (split or
  irregular bars). musicxml-io and partitura keep the XML string `20X1`; music21 stores the integer
  20. Notes identical otherwise.
- **`pdmx/QmTpVDFtEMe5LzKqgSVFCDMDwbqfwBi8EsrqqgdXeZVMjh.mxl`, 14 notes.** XML: `<alter>1</alter>`
  with `<accidental>other</accidental>` (e.g. bar 6 F5). musicxml-io and partitura: F#5. music21:
  F5. `<alter>` is what sounds in MusicXML, so **music21 is wrong** here: it lets the
  unrecognised display accidental override the pitch.
- **`imported/song.classical.chopin-ballade-1.mxl`, bar 232.** XML: G5 `<alter>1</alter>`,
  `<accidental>natural-sharp</accidental>`. musicxml-io and partitura: G#5; music21: G5. Again
  **music21 is wrong**.
- **Ballade 1 bar 246 and `chopin-nocturne-20.alt.mxl` bar 58.** Voice 1 fills 3828 of 3840
  divisions, then `<backup>3840</backup>`, so voice 2 literally starts 12 divisions before the
  barline. musicxml-io reports offset −0.025 (−0.0125 in the nocturne), which is what the XML says.
  music21 (and partitura) put it at 0, which is what the music means. musicxml-io is faithful
  to the arithmetic, music21 to the intent. A consumer of musicxml-io would need to clamp this.
- **partitura's 48** are mostly grace notes at the very end of a bar, which my bar lookup files
  under the next bar (harness artefact). The rest are rounding at the fourth decimal, plus 4 files
  with complex tuplets or cross-voice cases that I did not resolve (`QmSJazDX…`, `QmUkCd5k…`,
  `QmXq44w8…`, `QmcBaSHu…`). Ballade 1 also differs at bars 249 and 253 (UNVERIFIED which reader is right).
  Not pursued: partitura is the comparison reader, not the candidate.
- **Tie-merged comparison is inconclusive.** I merged ties for musicxml-io with my own code
  (`--merge`), and it mishandles chords and multiple ties. Its disagreements with
  music21 `stripTies` (e.g. a G3 held 6 beats read as 4) come from my code, not the library. I did
  not test musicxml-io's own `getTiedNoteGroups`.

**Data defect in a shipped file (found in passing):**
`imported/song.classical.mozart-k545-i.alt.mxl` (in `app/public/content/catalog.json` as
`song.classical.mozart-k545-i.alt`, level 7.1) has 20 notes in bar 18 with `<alter>8</alter>` or
`<alter>9</alter>` (e.g. F3 alter 9). music21 refuses it ("incorrect accidental 9.0 for pitch F3").
partitura raises `KeyError: 9`. musicxml-io loads it without complaint and `validate()` returns
valid with 0 errors. How the app's OSMD renders those notes was not looked at.

**Targeted feature files (all three agree note for note unless noted):**

| Feature | File | What was checked | Result |
| --- | --- | --- | --- |
| Two voices per staff + ties | `pdmx/QmQxJ4tsA3Xdsym1ZgNNRkGpiX8cT5yaKnPVMfFVvDDsMo.mxl` (42 bars, 144 notes/rests) | notes, ties, then a parse→serialize round trip | identical; the round trip is identical in music21 (pitches, durations, ties, articulations, expressions) |
| Tuplets | generated L6/L7 phrases (3:2) | durations of 1/3 | identical; musicxml-io and music21 report `3:2` (my partitura dumper does not extract tuplet ratios) |
| Chord symbols | greensleeves 68, Happy Birthday | count + kind | count 15 / 3 in all; musicxml-io keeps root+kind (`A:minor`, `G:dominant`); music21 gives figures (`Am`, `G7`); **partitura 1.9.0 drops `<kind>`** (`A` for Am, `kind=None`) |
| Irregular bars | `pdmx/QmdTZbbMT8VGXoYtr8S8LCfqDpmCd6go7ydUsMVVTCjP6K.mxl` (2/4, 14 bars, 99 notes) | bar lengths | all three report bar 1 = 0.5 (pickup), bar 5 = 1.5 (ends at a backward repeat), bar 6 = 0.5 (starts at a forward repeat), bar 14 = 1.5; XML has `implicit="no"` on all; notes identical |
| Grace, repeats/voltas | covered by the 812-file batch (246 PDMX/imported files have `<grace`, 72 have `<ending`) | — | no musicxml-io-specific disagreement on those files beyond the 3 above. Volta/repeat *structure* (`getRepeatStructure`, `generatePlaybackSequence`) was not tested |

Across the corpus 136 PDMX files have at least one bar whose length differs from the time
signature (music21 count, pickups included).

## Part 2 — four Python leads

| Claim | Verified? | Evidence | Caveats |
| --- | --- | --- | --- |
| Magenta note-seq parses MusicXML into NoteSequence | Yes | repo has `note_seq/musicxml_parser.py`, `musicxml_reader.py`; README lists MusicXML among input formats | — |
| note-seq is archived | Yes | github.com/magenta/note-seq banner: "This repository was archived by the owner on May 6, 2026. It is now read-only." | last commit on default branch 2025-02-28 |
| note-seq licence | Yes | Apache-2.0 (repo; PyPI "Apache 2") | — |
| note-seq last release | Yes | PyPI 0.0.5, uploaded 2022-07-01 | heavy deps (librosa, bokeh, pandas, protobuf>=4.21.2) |
| SCAMP 0.13.0 released 2026-09-25 | Yes | PyPI upload 2026-09-25T17:54:05 | requires Python >=3.12 (project's default python3 is 3.11) |
| SCAMP licence | Yes | GPL-3.0 (repo LICENSE); PyPI licence field empty | GPL matters if code is bundled; fine as a build-time tool |
| SCAMP does event-based composition, quantization, MusicXML/LilyPond export | Yes | repo README: "quantize and export the result to music notation in the form of MusicXML or Lilypond"; LilyPond needs abjad extra | MusicXML via `pymusicxml` 0.6.0 |
| SCAMP probe works | Yes | 10-line script (`scamp_probe.py`) wrote `scamp_probe.xml`; music21 read it | see below |
| MusicLang does pattern extraction / projection onto chord progressions | Yes | `examples/02_patterns/01_pattern_extraction.py` (`chord.to_pattern()`, `Score.from_pattern(pattern, chord_progression)`); `Score.patternize`, `get_patterns`, `project_on_score`, `project_on_rhythm` in `musiclang/write/score.py` | not run |
| MusicLang last PyPI release | Yes | 0.26.0, 2024-03-13 | last commit 2024-03-25; repo not marked archived (WebFetch); effectively dormant 2.5 years |
| MusicLang licence | Yes | BSD-2-Clause (PyPI + repo); its AI half moved to `musiclang_predict` (GPL-3.0 per repo page) | pins `music21==8.1.0`, `partitura==1.3.1`, `pandas==1.5.3`, `tensorflow`: conflicts with the project's music21 10.5.0; would need its own venv |
| musicdiff compares visible notation differences | Yes | README: "focused on visible notation differences, not only on audible musical differences" (tied eighths ≠ quarter; beamed ≠ unbeamed); `-i/-x` select notes, beams, ties, slurs, signatures, chordsymbols, lyrics, etc.; text, visual (PDF) or OMR-NED JSON output | — |
| musicdiff parses via music21 | Yes | depends on `music21>=10.5.0` and `converter21>=4.0.2` (PyPI requires_dist, README) | Python >=3.12 |
| musicdiff licence / latest | Yes | MIT; 6.0, uploaded 2026-09-22; last commit 2026-09-22 | not run |

SCAMP probe detail: input durations 1.02, 0.49, 0.51, 0.98, 1.5, 0.5, 2.0 then a 2-beat wait, 4/4.
music21 reads: bar 1 C4 1.0, D4 0.5, E4 0.5, F4 1.0, G4 1.0 (tie start); bar 2 G4 0.5 (tie stop),
A4 0.5, G4 2.0, rest 1.0. So it quantized to the grid and split the barline-crossing note into a
tie; the trailing 2-beat wait became only the 1-beat rest that fills the bar (transcription ends at
the last note). musicxml-io read the same 8 notes. It plays audio while transcribing (fluidsynth
errors with no audio device are harmless) and runs in real time.

## Part 3 — PDMX metadata (`build/ct1/PDMX.csv`, 254,077 rows)

Search: case-insensitive over title, song_name, subtitle, composer_name, artist_name. Ranking:
no licence conflict, not draft, `tracks` = "0" (General MIDI piano), best path, rating. Note:
PDMX `n_tracks` counts parts, so a two-staff piano score is `n_tracks 1` (188,113 rows have 1,
33,455 have 2); "2 tracks" is therefore not a piano-grand-staff signal. `song_length.bars` appears
to count played bars (K.545 I = 146 for a 73-bar movement with repeats; inferred, not checked).
Suitability not judged.

| Lead | Matches | No conflict & not draft | Three best candidates (title — licence — n_tracks — bars — best_path — rating — mxl) |
| --- | --- | --- | --- |
| Mozart K.545 (mozart + 545/facile/semplice) | 12 (13 with any "545"+mozart/sonata) | 12 | "Sonata No. 16 K 545 3rd Movement" — cc-zero — 1 — 84 — F — 4.9 — `./mxl/7/9/QmPaDt5oro5S5MxK47tRyuppCxwhyyTfe5568yRv4494KE.mxl`; "Sonata no 16 in C Major" — cc-zero — 1 — 146 — F — 4.89 — `./mxl/4/5/Qme6WJRXUdZb9NiankZ4rKj5LAZ9DPiqzdKqqrk9HyghVL.mxl`; "Sonata No 16 KV 545 'Facile' Mozart" — cc-zero — 1 — 146 — F — 4.85 — `./mxl/0/42/Qmas87p3CricUGpNozvLiZYcc1CFGAXGr7QhREAqmmXoG8.mxl`. None is best_path; one more "Sonata no.16 … Retrograde" (best_path T) is a retrograde arrangement. |
| Clementi Op. 36 No. 2 | 1 exact ("Clementi: Sonatina No. 2 Op 36") | **0** | Only hit: cc-zero — 1 — 261 — F — 4.76 — **license_conflict True** — `./mxl/4/8/Qme9Dmw9uAjPAqgwvLsnowXHwhwnZg4kwhvSSrTPgkgoSd.mxl`. Also "Six Sonatinas for Piano Op 36" (complete set, 3570 bars, best_path T, **conflict True**) `./mxl/7/10/QmPAsudN4jHYo1ZLjSocNUD8EpFJgBJiw5XrtjUyKPvKHf.mxl`. "Sonatina No1.2 Muzio Clementi" (publicdomain, n_tracks 2, 70 bars, no conflict) `./mxl/1/42/Qmbs8bGTAq4UJLeLcyLJjzUzBtXKQRFaU3hQoqKxkfmdbD.mxl` is probably Op. 36 No. 1 mvt 2 (UNVERIFIED from title). |
| Attwood Sonatina in G | 3 (attwood + sonatin); 45 for "attwood" alone (mostly Thomas Attwood songs) | 3 | "Sonatina in G" — Thomas Attwood — publicdomain — 1 — 28 — F — 4.85 — `./mxl/12/16/QmUDoLwg9ihL1tkEX3EJZ4RoSSi8G4irTc9NuX5ozQCcTc.mxl`; "Sonatina in G Major" — cc-zero — 1 — 28 — F — 4.71 — `./mxl/7/17/QmPeE4SvPiqY1q2YzuqsLvzfKXRpVM9dBgAiR4tFSKfc6v.mxl`; "Andante" — Thomas ATTWOOD — cc-zero — 1 — 24 — F — 0 — `./mxl/3/53/QmdXdGKXvVyoPHaeDP3fwwCSzEG7B3fQUNf9kGiTTvEQDW.mxl` (subtitle: "Second movement from Sonatina No. 3 in F", so a different sonatina). Only two rows are a Sonatina in G. |
| Beethoven WoO 78 | **0** (beethoven + woo 78 / god save; also "god save" + variation = 0) | 0 | none. 42 rows match "god save the king/queen" (anthem settings, a Liszt paraphrase), none by Beethoven. |
| Drunken Sailor | 63 ("drunken sailor") | 63 | "The drunken sailor Cello 2 voices" — cc-zero — 1 — 20 — F — 4.49 — `./mxl/15/55/QmXYkKjo2ffzYiqfEhktUvSgN3Ka7Lc5WjegbpuGKqBf6p.mxl`; "The Drunken Sailor" — publicdomain — 1 — 98 — F — 0 — `./mxl/8/20/QmQFerd7XgXN19YtHNrUL8oKMHfjPCwGzhSZGJvEUSZ1xz.mxl`; "What shall we do with a drunken sailor?" — publicdomain — 1 — 8 — F — 0 — `./mxl/13/30/QmVLp7UYDD5ijBRVTwrDh9r3B4WvY9JGYRrjUzbHeF73S8.mxl`. (4 of 63 are best_path; "Drunken Sailor's Hornpipe" may be a different tune.) |
| Scarborough Fair | 67 ("scarborough") | 63 | "Scarborough Fair Canticle" — Simon & Garfunkel — cc-zero — 1 — 132 — **T** — 4.77 — `./mxl/11/26/QmTjKf6rCggXUJinMH2NfTjP2cSvMCGcimtzjWqKHzjhyG.mxl`; "Scarborough fair piano solo" — cc-zero — 1 — 137 — F — 4.65 — `./mxl/2/56/QmczrVBCXLWp4njUygUtPaMz8gtCZetE9UyUD8NXdcTPnt.mxl`; "Scarborough Fair" — cc-zero — 1 — 36 — F — 4.49 — `./mxl/11/27/QmTJENYHPL17Yj2pnVcVmdeMC43hVHWP9Vb5sC47i579Ya.mxl`. ("Canticle" is credited to Simon & Garfunkel; the "Boy in the Basket" row matched on its subtitle "Long Room At Scarborough".) |

Not checked: the `tracks` value "0" may be MuseScore's default program rather than a real piano
choice; titles were not opened, so movement and arrangement identity is inferred from titles only.
