# CT1 part zero — the reuse map

The owner (2026-10-03): *every piece of this project is either predefined, easily found
online, already built, or impossible.* This table classes every component of the app and
its content into one of those four kinds. For each row it names the standard, publication
or library that already provides the component, with a link, says what the app does today,
and decides.

**Base:** `abb62a0` (head of `claude/piano-teaching-app-bo19td`, 2026-10-03).

**How it was built.** Four read-only surveys covered `app/src/**` and `tools/**`, file by
file. Each read the imports, named the algorithm, and gave `file:line`. Below them, the
searches listed at the end found each row's established counterpart. The facts that carry
a decision were rechecked by hand at the base:
- music21 10.5.0 sends `analyze('key')` to `AardenEssen`.
- `chord.commonName`, `inversion()` and `roman.romanNumeralFromChord` behave as cited (`V7` from G–B–D–F in C).
- `meter.TimeSignature('6/8').beatCount == 2`.
- the `leftHandPattern` rule (`detect.ts:514`).
- `session.ts:446/1490`: review is sorted by overdue, then picked `due[seed % len]`.
- no file under `tools/` imports `requests`.

**The classes.**
- **P** predefined: a standard or a definition.
- **Pub** published: findable data or content.
- **B** already built: a maintained library.
- **I** impossible here: needs a human ear or a teacher's judgement.

Many rows are part hand-built glue around a reused core; the class is the core's.

**The decisions.**
- **reuse:** already uses the established thing; keep.
- **keep:** hand-built, with the reason stated.
- **replace:** the established thing joins this work's plan (listed at the end).
- **claim less:** the row is class I.

---

## 1. Score files: import, conversion, model

| # | Component | What it does | Class | Established source | Today | Decision |
|---|---|---|---|---|---|---|
| 1.1 | MusicXML as the score format (`app/src/score/*`, `content/scores/**`) | Every score, generated or imported, is MusicXML | P | [MusicXML 4.0, W3C CG report](https://www.w3.org/2021/06/musicxml40/) | Reuses the standard | reuse |
| 1.2 | `.mxl` unzip (`score/mxl.ts`, 64 lines) | Compressed MusicXML to text | B + P | [fflate](https://github.com/101arrowz/fflate); the `.mxl` container is in [MusicXML 4.0](https://www.w3.org/2021/06/musicxml40/) | `fflate` plus a regex read of `META-INF/container.xml` | reuse |
| 1.3 | Timewise to partwise (`score/toPartwise.ts`, 73 lines) | OSMD loads partwise only | P | [W3C `timepart.xsl`](https://www.musicxml.com/for-developers/musicxml-xslt/), shipped with MusicXML 4.0; browsers have `XSLTProcessor` | Hand-built regex rewrite | **replace** with the official stylesheet (plan item R1) |
| 1.4 | Parsing MusicXML into the app's `ScoreModel` (`score/extractScoreModel.ts`, 545 lines) | Steps, notes, hands, repeats unrolled, ties, tuplets, key, time signatures | B | [OpenSheetMusicDisplay 2.1.2](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay) | OSMD parses; the app walks OSMD's model into its own | reuse; its key-name and accidental tables (`:162–232`) duplicate theory tables (see 6.6) |
| 1.5 | Tempo (`score/tempoFromXml.ts`, 303 lines) | Reads `<metronome>` and `<sound tempo>` | P | [MusicXML `<sound>` and `<metronome>`](https://www.w3.org/2021/06/musicxml40/) | Hand-built regex walker | keep: it exists because OSMD 2.1.2 misreads tempo (`:8`); imported files must be read in the browser, where music21 is unavailable |
| 1.6 | Chord symbols (`score/harmony.ts`, 185 lines) | `<harmony>` symbols for the chord chart | P | [MusicXML `<kind>` values](https://www.w3.org/2021/06/musicxml40/) (about 40); chord dictionaries in [Tonal](https://github.com/tonaljs/tonal) | Hand table of 20 kinds; an unlisted kind keeps its printed name but is matched on the major triad (`:28–30`) | **replace** the table with the full standard list via Tonal's chord dictionary (R4): today a bar of an unlisted kind (augmented-seventh, major-minor and others) is marked played on a triad that is not its chord |
| 1.7 | Source conversion (`tools/content/convert.py`, 2412 lines) | `.krn`, `.abc`, `.ly`, `.xml`, `.mxl` and `.mid` to one two-staff piano `.mxl` | B | [music21 `converter`](https://music21.org/music21docs/moduleReference/moduleConverter.html); [python-ly](https://pypi.org/project/python-ly/) for `.ly` | music21 parses and writes. Hand-built repairs: `settle_durations`, `collapse_to_two`, `drop_seam_bars` and others | reuse; the repairs are source-specific fixes no library offers, each tested |
| 1.8 | ABC workarounds (`abc_tools.py`, 345 lines) | Inline voices to blocks; reads fingering marks | B | [music21 ABC reader](https://music21.org/music21docs/moduleReference/moduleAbcFormat.html) | Regex pre-pass because music21 misreads `[V:]` inline voices | keep: works around a library gap, tested |
| 1.9 | Mutopia import (`import_mutopia.py`, 629 lines) | Mutopia via its MIDI, re-spelled from the `.ly` | Pub + B | [Mutopia](https://www.mutopiaproject.org/legal.html); [python-ly](https://pypi.org/project/python-ly/) | python-ly for pitches; own `\repeat` unfolder (`:170`) | keep; *unknown* why the `.ly` is not converted directly with `ly.musicxml` (`convert.parse_lilypond` does that elsewhere). The MIDI route is recorded in the file and was not re-examined here |
| 1.10 | Hanon and Clementi extraction (`extract_hanon.py` 224, `extract_fingering.py` 190) | Notes and printed fingering from Mutopia `.ly` | B | [python-ly](https://pypi.org/project/python-ly/) (already a dependency) | Own regex LilyPond note parser (`NOTE_RE`, `parse_notes:75`) | **replace** the parser with python-ly's (R2) |
| 1.11 | MIDI file reading in the app (`import/midi/readMidi.ts`, 323 lines) | Standard MIDI File to note events | P + B | [SMF spec (MIDI Association)](https://midi.org/standard-midi-files); [@tonejs/midi](https://github.com/Tonejs/Midi) | Own chunk walker ("bundle budget", `:20`) | **replace** the byte layer with `@tonejs/midi` (R3); keep the stages after it, which have parity tests with the Python tool |
| 1.12 | MIDI cleanup and quantisation (`tools/midi-cleanup/midi_to_musicxml.py` 1199; `import/midi/quantise.ts`, `slice.ts`, `notatable.ts`, `fraction.ts`) | Grid choice per bar, swing, chord slicing, notatable lengths | B (partly) | [music21 `midi.translate` / `quantize`](https://music21.org/music21docs/moduleReference/moduleMidiTranslate.html), whose docs advise a dedicated tool for live-played MIDI | Python uses music21's `MidiFile`, key, `makeNotation` and writer. Own grid, swing and slice; music21's reader was rejected for inventing notes (152 for 129 note-ons) | keep: chosen against music21 with a measured reason; tested on [MAESTRO](https://magenta.tensorflow.org/datasets/maestro) |
| 1.13 | Hand split for one-track MIDI (`import/midi/handSplit.ts`, 155 lines) | Left and right hand from one track | B (research only) | Published methods exist; no maintained JS or Python library found (searched: music21 and partitura) | Own moving-boundary search | keep: nothing maintained exists |
| 1.14 | Key estimation (`import/midi/key.ts`, 242; `midi_to_musicxml.py:727`; `score_checks.py:1496`) | Key of an imported score | B | [music21 `analysis.discrete` (Aarden–Essen; Krumhansl–Schmuckler)](https://music21.org/music21docs/moduleReference/moduleAnalysisDiscrete.html) | Python calls music21; the browser port copies music21's Aarden–Essen weights | reuse (a faithful port) |
| 1.15 | Key name and mode from a signature, duplicated at least seven times (`notation.key_name:138`, `import_kern.key_name:158`/`mode_for:255`, `import_musetrainer.key_name:143`, `build._key_words:276`/`settle_key_signatures:291`, `author.key_name:156`, `score_checks.signature_key:420`, `candidates.sounds_minor:69`) | Names the key; picks major or minor by the final bass | B | [music21 `key.KeySignature.asKey`, `Key`, `analyze('key')`](https://music21.org/music21docs/moduleReference/moduleKey.html) | Hand-written each time | **replace** with one music21-backed function (R5) |
| 1.16 | Kern facts (`import_kern.py`, 896 lines) | Catalogue rows for KernScores files | Pub + B | [Humdrum/KernScores (Sapp)](https://github.com/craigsapp/mozart-piano-sonatas); [music21 humdrum reader](https://music21.org/music21docs/moduleReference/moduleHumdrumSpineParser.html) | Own `kern_pitch` token parser (`:193`) beside music21 | **replace** `kern_pitch` with music21's parsed pitches (inside R5) |
| 1.17 | MusicXML facts by ElementTree (`notation.py` 159, `score_checks.read_score:211`, `excerpt_proposer.read_bars:184`, `truncation_scan.py`, `dump_score.py`) | Bars, keys, times, final bass, corpus checks | B | [music21 stream API](https://music21.org/music21docs/moduleReference/moduleStreamBase.html) | Hand XML readers (fast, no parse) | keep: read-only scans where a music21 parse of the whole corpus costs more than it saves; key naming moves to R5 |
| 1.18 | Excerpt cutting (`excerpts.py`, 1116 lines) | Bar ranges as their own items | B | music21 `measures()`, `repeat`, `spanner` | Reuses music21; own repeat-crossing refusal | reuse |
| 1.19 | Writing MusicXML in the app (`engine/musicXmlWriter.ts`, 397 lines) | Generated phrases and MIDI imports to MusicXML 3.1 | P | [MusicXML partwise DTD](https://www.w3.org/2021/06/musicxml40/) | Hand string emitter following the DTD | keep: no maintained browser MusicXML writer found (music21 is Python-only). Spelling moves to R4 |
| 1.20 | SMuFL glyphs (`score/textGlyphs.ts`, 66 lines) | Maps SMuFL code points to Unicode | P | [SMuFL (W3C CG)](https://w3c.github.io/smufl/latest/) | Table from the standard | reuse |
| 1.21 | Schema validation (`validate.py`) | Catalogue and curriculum JSON | B | [jsonschema](https://python-jsonschema.readthedocs.io/) | Reused | reuse. `requests` is declared in `tools/content/requirements.txt` and imported nowhere under `tools/` (checked with grep): remove it (R12) |

## 2. Rendering and the score screen

| # | Component | What it does | Class | Established source | Today | Decision |
|---|---|---|---|---|---|---|
| 2.1 | Engraving (`score/OsmdView.ts`, 500 lines) | Draws the score as SVG | B | [OSMD](https://github.com/opensheetmusicdisplay/opensheetmusicdisplay) (VexFlow) | Reused, with phone engraving rules | reuse |
| 2.2 | Windowed layout (`score/WindowRenderer.ts` 5303, `slots.ts` 325, `autoFit.ts` 116) | Fits one to four systems to a phone, slides, looks ahead | none exists | No library offers windowed look-ahead layout; OSMD and [Verovio](https://www.verovio.org/) both paginate | Hand-built | keep: product-specific, with no established equivalent |
| 2.3 | Single-note staff cards (`ui/StaffCard.ts`, 234 lines) | One note on a staff for drills | B | OSMD or VexFlow could draw it; the file rejects them for speed (`:4–9`) | Hand SVG with a fixed spelling table (`:25`) | keep the drawing; the spelling table moves to R4 |
| 2.4 | On-screen keyboard and ribbon (`ui/KeyboardStrip.ts` 464, `KeyRibbon.ts` 168) | Feedback and touch input | P | [Pointer Events](https://www.w3.org/TR/pointerevents/) | Hand DOM | keep: UI, nothing to reuse |
| 2.5 | Lesson Markdown (`ui/markdown.ts` 176; `common.read_front_matter:395`) | Lesson and tip text with front matter | B | [micromark](https://github.com/micromark/micromark) (about 14 kB); [js-yaml](https://github.com/nodeca/js-yaml), [PyYAML](https://pyyaml.org/) | Own subset renderer ("a library would be 40 kB", `:5`) and two matching YAML-subset parsers | **replace** the two front-matter parsers with js-yaml and PyYAML, and the renderer with micromark (R11; low priority, P3) |
| 2.6 | PDF pages (`pdf/PdfDocument.ts`) | Renders PDF pages | B | [pdf.js](https://github.com/mozilla/pdf.js) | Reused | reuse |
| 2.7 | Finding staff systems on a PDF page (`pdf/systems.ts` 282, `systemPlan.ts`) | Cuts systems for paper practice | P (method) | Horizontal projection is the standard first step of optical music recognition; full OMR exists in [Audiveris](https://audiveris.com/) (Java) and [oemer](https://github.com/BreezeWhite/oemer) (Python), neither in the browser | Hand projection profile; the user can correct the cuts | keep: no browser OMR library |

## 3. Input, audio and timing

| # | Component | What it does | Class | Established source | Today | Decision |
|---|---|---|---|---|---|---|
| 3.1 | Live MIDI (`midi/WebMidiSource.ts` 612, `parseMidiMessage.ts` 289) | Keyboard input and output | P | [Web MIDI API (W3C)](https://www.w3.org/TR/webmidi/); [MIDI 1.0 spec](https://midi.org/specs) | Browser API plus a status-byte switch from the spec | reuse |
| 3.2 | Microphone pitch (`audio/pitch/detector.ts` 701, `dsp.ts` 634, `calibration.ts` 469) | Is each expected piano note sounding? (polyphonic, score-informed) | B (partly) | Monophonic: [pitchy (McLeod)](https://github.com/ianprime0509/pitchy). Polyphonic, offline: [Spotify basic-pitch](https://github.com/spotify/basic-pitch) | Own harmonic template matcher with inharmonicity and confusion guards | keep: no maintained library does real-time polyphonic, score-informed detection in an AudioWorklet. pitchy is monophonic; basic-pitch is not real-time. Add basic-pitch as an **offline reference** for the detector's tests (R10) |
| 3.3 | FFT (`audio/pitch/fft.ts`, 103 lines) | Spectrum for the pitch detector | B | [fft.js](https://github.com/indutny/fft.js) (radix-4, allocation-free) | Own radix-2 Cooley–Tukey with a Hann window | **replace** with fft.js (R9; P3: the current one is tested) |
| 3.4 | Click detection for loopback latency (`audio/loopbackProcessor.ts`, `loopbackLatency.ts`) | Finds the returned click | P | [Goertzel algorithm](https://en.wikipedia.org/wiki/Goertzel_algorithm); median/MAD rejection is textbook statistics | Implements the standard algorithms | keep: the definitions are followed; cite them in the code |
| 3.5 | Metronome scheduling (`audio/BeatScheduler.ts`, `Metronome.ts`) | Sample-accurate clicks | P | ["A Tale of Two Clocks" (Wilson, web.dev)](https://web.dev/articles/audio-scheduling) | The same look-ahead pattern, 25 ms timer and 100 ms horizon | reuse (the pattern); add the citation |
| 3.6 | Piano sound (`audio/Piano.ts`) | Plays notes back | B | [smplr](https://github.com/danigb/smplr) | Reused | reuse |
| 3.7 | Backing loop sounds (`audio/backingLoop.ts`, `DrumKit`) | Bass, drums and comping for the chord chart | B | smplr's `DrumMachine` and `Soundfont` | Hand sine and noise synthesis | **replace** with smplr's instruments (R8; P3) |
| 3.8 | Latency and tap tempo (`audio/latency.ts`, `tapTempo.ts`, `clock.ts`) | Measures delay; turns taps into bpm | P | Web Audio `outputLatency` and `getOutputTimestamp`; median and IQR | Standard statistics on browser clocks | keep |
| 3.9 | Seeded randomness (`sightReading.makeRng:255`, `dailySeed:3127`) | Reproducible generation | P | mulberry32; FNV-1a (published hash) | Copied and named in comments | reuse |
| 3.10 | Storage (`data/db.ts` and stores) | IndexedDB persistence | B | [idb](https://github.com/jakearchibald/idb) | Reused | reuse |

## 4. Score following and scoring a run

| # | Component | What it does | Class | Established source | Today | Decision |
|---|---|---|---|---|---|---|
| 4.1 | Wait mode (`engine/PracticeEngine.ts`) | Advances when the step's notes are all struck | none needed | A known-step set match; there is no alignment problem | Hand-built set match | keep |
| 4.2 | Keep-tempo matching (`PracticeEngine.findSlot:1298`) | Pairs each played note with the nearest expected one in a window | B (offline) | [parangonar](https://github.com/sildater/parangonar) and [Matchmaker](https://carloscancinochacon.com/documents/extended_abstracts/ParkEtAl-ISMIR-LBD-2024.pdf) (Python, research) | Greedy nearest within 150 ms | keep: no maintained browser library. Use parangonar **offline** as a reference oracle on recorded runs (R10) |
| 4.3 | Accuracy, timing and verdict (`engine/Scoring.ts`, 1154 lines) | Pass at 0.90 accuracy and 80% tempo; master at 0.97 and 100% | I (thresholds) | Exam marking schemes are published but holistic ([ABRSM](https://www.abrsm.org/sites/default/files/2024-06/Piano%202025%20&%202026%20Prac%20syllabus%2020240524_access.pdf), [RCM](https://rcmusic-kentico-cdn.s3.amazonaws.com/rcm/media/main/about%20us/rcm%20publishing/piano-syllabus-2022-edition.pdf)) | Own fixed thresholds | **claim less:** the counts are observed facts; the thresholds are hypotheses, and the app's words must say "met the standard", never "mastered" as a teacher means it (part three) |
| 4.4 | Articulation, voicing, shaping, pedal, dynamics measures (`Scoring.ts:594–1049`, `drills/special.ts`) | Technique measures from velocity, release and CC64 | P where the input reports it; I otherwise | MIDI velocity and CC64 are in the [MIDI 1.0 spec](https://midi.org/specs); whether it sounds right is judgement | Own ratios | keep the measures only for MIDI input (part three: credited only where the input reports them) |
| 4.5 | Paper steadiness (`engine/steadiness.ts`) | Standard deviation of onsets against clicks | P | Descriptive statistics | Hand-built | keep |

## 5. Concepts, analysis and difficulty

| # | Component | What it does | Class | Established source | Today | Decision |
|---|---|---|---|---|---|---|
| 5.1 | Notation facts: clef, ledger lines, steps, skips and leaps, note values, ties, triplets, compound metre, key signature, accidentals (`demands/detect.ts`, 13 of 19 detectors) | Says which reading demands a score holds | P + B | [music21](https://music21.org/music21docs/): `interval.Interval` ([generic intervals](https://music21.org/music21docs/moduleReference/moduleInterval.html)), `duration`, `tie`, `duration.Tuplet`, `meter.TimeSignature.beatCount`/`beatStrength` ([meter](https://music21.org/music21docs/moduleReference/moduleMeterBase.html)), `key.KeySignature.accidentalByStep`, `clef` | Hand-built TypeScript over the app's own model | **replace** as the reference: music21 computes these at build time and the catalogue carries the result. `detect.ts` stays only for imports and runtime phrases, and must agree on the whole catalogue (CT1 part one) |
| 5.2 | Syncopation (`detect.ts:370`) | Off-beat emphasis | P | Defined in theory texts ([Open Music Theory, rhythm and meter](https://openmusictheory.github.io/contents.html)); metric weight from music21 `beatStrength` | Own rule, with known blind spots (E22) | **replace:** a sourced definition over music21 `beatStrength` (part one) |
| 5.3 | Hand span, "beyond position" and hands together (`detect.ts:460`, `:500`) | Range of one hand; two hands sounding together | P | Five-finger position is defined in method books ([Faber Piano Adventures](https://pianoadventures.com/piano-books/basic-piano-adventures/level-2a/things-to-know/)); hands together is a fact of the onsets | Own rules | keep the rules, sourced and tested (part one) |
| 5.4 | Accompaniment figures (`detect.ts:514` `leftHandPattern`, `:533` `walkingBass`; `claims.py:79–85` maps seven named styles onto one demand) | Says a piece holds Alberti, waltz, oom-pah, stride, boogie or walking bass | P (definitions); no library | Alberti: [Hutchinson §14.3](https://musictheory.pugetsound.edu/mt21c/ArpeggiatedAccompaniments.html) ("low–high–middle–high"). Stride: [Wikipedia, Stride](https://en.wikipedia.org/wiki/Stride_(music)). Oom-pah / waltz: [Wikipedia, Oom-pah](https://en.wikipedia.org/wiki/Oom-pah). Walking bass: [TJPS](https://www.thejazzpianosite.com/jazz-piano-lessons/jazz-chord-voicings/walking-bass-lines/). Boogie: [StudyBass](https://www.studybass.com/lessons/blues-bass/the-boogie-woogie-blues-pattern/) | One vague detector; two-hand scales and arpeggios read as accompaniment (the appendix's 16) | **replace:** one sourced matcher per named figure, custom code because no library implements them (part one) |
| 5.5 | Chords, inversions and Roman numerals over the notes | Chord identity in pieces | B | music21 [`chord.Chord.commonName`, `inversion()`](https://music21.org/music21docs/moduleReference/moduleChord.html), [`roman.romanNumeralFromChord`](https://music21.org/music21docs/moduleReference/moduleRoman.html), `chordify` | **Never identified from a score's notes.** Searched (grep for these music21 calls and for identify/recognise/roman-numeral functions):
- In `tools/`: no call; the one match is a comment explaining why `midi_to_musicxml.py:769` does not use `chordify`.
- In `app/src`: Roman numerals only go one way, numeral to chord, to build drill prompts (`engine/drills/harmony.ts:201`, `theory.ts:305`); `score/harmony.ts` expands printed chord symbols and never names a chord from notes.

Chord concepts are claimed without measurement | **replace (new):** music21 at build time for chord, inversion and Roman-numeral concepts (part one) |
| 5.6 | Key of a piece | The key a rung claims | B | music21 `analyze('key')` | Signature plus a final-bass rule (row 1.15) | as 1.15 and 1.14 |
| 5.7 | Difficulty (`tools/content/difficulty.py` 662, `fit_level_model.py`; `app/src/score/difficulty.ts` 370; `content/sources/level-model.json`, `pdmx-csv-level.json`) | 1–9 level estimate | Pub + B | Published labelled data: [CIPI](https://github.com/PRamoneda/difficulty-prediction-CIPI) (652 pieces, Henle levels), [PSyllabus](https://arxiv.org/pdf/2403.03947v2) (Piano Syllabus levels); [Ramoneda et al. 2023](https://archives.ismir.net/ismir2023/paper/000084.pdf) | Own log-linear model fitted on the catalogue's own judged levels, with its own ridge solver (`_solve:496`) | keep the model (CL17 owns the level scalar); **replace** the oracle: validate against CIPI's published levels where pieces overlap, and use numpy if the solver stays (R7, handed to CL17) |
| 5.8 | Physical playability gate (`family_contracts.physical_facts:364`) | Span, moves, repeated notes | B (partly) | [pianoplayer](https://pypi.org/project/pianoplayer/) (fingering by effort) | Own rules | keep; pianoplayer is a candidate cross-check, not a replacement, because it cannot be checked here either |
| 5.9 | Phrase quality (`engine/sightReadingScore.ts` 827, `tools/content/musical_evaluator.py` 931) | Scores generated phrases: arrival, contour, motif | I | Whether a phrase is musical is judgement; published structural rules exist ([Open Music Theory](https://openmusictheory.github.io/contents.html): cadence, phrase) | Own weighted rules | **claim less:** these rank candidates only; nothing tells the learner a phrase is musical (*unverified as music*) |

## 6. Generators, drills and theory content

| # | Component | What it does | Class | Established source | Today | Decision |
|---|---|---|---|---|---|---|
| 6.1 | Scales, arpeggios, five-finger and chromatic (`generate_exercises.py`) | Technical exercises | P + B + Pub | Spelling: music21 `scale.*`. Fingering: Clementi Op. 42 ([Mutopia](https://www.mutopiaproject.org/)), Kelley's charts, McLain *Class Piano* ch. 9 (cited `:74–286`). Exam forms: [ABRSM 2025–26](https://www.abrsm.org/sites/default/files/2024-06/Piano%202025%20&%202026%20Prac%20syllabus%2020240524_access.pdf) and [RCM 2022](https://rcmusic-kentico-cdn.s3.amazonaws.com/rcm/media/main/about%20us/rcm%20publishing/piano-syllabus-2022-edition.pdf) technical requirements | Reuses music21 and the published charts | reuse; part two checks each family against its contract |
| 6.2 | Hanon | Technical exercises | Pub | [Hanon, *The Virtuoso Pianist* (IMSLP)](https://imslp.org/wiki/The_Virtuoso_Pianist_(Hanon,_Charles-Louis)), via Mutopia | Reads the published notes (`hanon-mutopia.json`) | reuse |
| 6.3 | Accompaniment, stride, boogie, comping, Latin and the other style families (`ACCOMPANIMENT_PATTERNS:2189`, `BOOGIE_PATTERNS:4618`, `CLAVE_PATTERNS:4870` and the rest) | Generated style patterns | P | The definitions in 5.4; real examples are preferred (`operating-procedure.md` §12) | Hand tables | keep generation for exact control; **verify** every family with the part-one matchers (part two). Where a real excerpt teaches the same thing, it comes first |
| 6.4 | Sight-reading generator (`engine/sightReading.ts` 3134) | Seeded phrases for levels 1–7 | P (parameters) | Graded sight-reading parameters are published in the [ABRSM](https://www.abrsm.org/sites/default/files/2024-06/Piano%202025%20&%202026%20Prac%20syllabus%2020240524_access.pdf) and [RCM](https://rcmusic-kentico-cdn.s3.amazonaws.com/rcm/media/main/about%20us/rcm%20publishing/piano-syllabus-2022-edition.pdf) syllabi. Generators exist ([OSME](https://opensheetmusiceducation.org/), [SREGen](https://kchua.github.io/SREGen/), [an evolutionary approach](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7948302/)); none is a maintained library with seeded, rung-promised constraints | Own bounded random walk with rejection sampling | keep the generator; **replace** its level parameters with the published syllabus parameters, compared in part two §3 |
| 6.5 | Studies (`tools/content/study.py`, 1405 lines) | Composed studies | P + I | Graded repertoire is published (rows 7.1–7.2) | Own phrase grammar and random walk | keep only where §12's comparison favours generation; *unverified as music* |
| 6.6 | Theory tables (`engine/drills/theory.ts` 503: chord qualities, modes, Roman numerals, note names; also `StaffCard` spelling, `musicXmlWriter.midiToPitch`, `extractScoreModel` and `detect.ts` key tables) | Note, interval, chord, mode and Roman-numeral facts for drills | P + B | [Tonal](https://github.com/tonaljs/tonal) (Note, Interval, Chord, Scale, Mode, Key, RomanNumeral); definitions in [Open Music Theory](https://openmusictheory.github.io/triads.html) | Hand tables, repeated in four places | **replace** with Tonal (R4), tested against music21 at build time |
| 6.7 | Prompt and ear drills (`engine/drills/factories.ts`, `harmony.ts`) | Note flash, chords, inversions, intervals, progressions | P | Intervals and chord qualities are predefined; graded ear-test content is published in the ABRSM and RCM syllabi (aural tests) | Uniform random draws from fixed sets | keep the generation; part two compares the sets with the syllabi's ear tests by grade |
| 6.8 | Trading fours and call-and-response (`engine/tradingFours.ts`, `factories.callResponseDrill`) | Improvisation prompts | P + I | Scales are predefined; whether an answer is good is judgement | Own random walk; counts in-scale notes only | **claim less:** no pass and no credit (already so) |

## 7. Curriculum, content and learner model

| # | Component | What it does | Class | Established source | Today | Decision |
|---|---|---|---|---|---|---|
| 7.1 | Curriculum order (`content/curriculum/stage-*.json`, `docs/02-curriculum.md`) | Stages, rungs, concepts per rung | Pub | [RCM Piano Syllabus 2022](https://rcmusic-kentico-cdn.s3.amazonaws.com/rcm/media/main/about%20us/rcm%20publishing/piano-syllabus-2022-edition.pdf), [ABRSM Piano 2025–26](https://www.abrsm.org/sites/default/files/2024-06/Piano%202025%20&%202026%20Prac%20syllabus%2020240524_access.pdf), [Faber Piano Adventures](https://pianoadventures.com/piano-books/basic-piano-adventures/level-2a/things-to-know/) | Own order; each stage has an `abrsmGradeApprox` label, and `docs/02` cites no syllabus as its basis (`:21`) | keep the order until part two §3 compares it with the syllabi; reordering is the **owner's** decision |
| 7.2 | Score sources (`fetch.py`, `content/sources/*.json`, `content/scores/**`) | Repertoire | Pub | [Mutopia](https://www.mutopiaproject.org/legal.html), [PDMX](https://arxiv.org/html/2409.10831v1), [KernScores / Humdrum](https://github.com/craigsapp/mozart-piano-sonatas), MuseTrainer library, NIFC Chopin first editions (CC BY 4.0) | Reused, with a licence ledger | reuse |
| 7.3 | Licence gate (`licensing.py`) | Public-domain and CC verdicts | P | [17 U.S.C. §302](https://www.law.cornell.edu/uscode/text/17/302); [Creative Commons licences](https://creativecommons.org/licenses/) | Rules from the statute | reuse |
| 7.4 | Lesson and theory text (`content/lessons/*.md`, 109 files; `content/tips/*.md`, 27) | What each rung teaches | Pub | [Open Music Theory](https://openmusictheory.github.io/contents.html), [Hutchinson, *Music Theory for the 21st-Century Classroom*](https://musictheory.pugetsound.edu/mt21c/MusicTheory.html) (both openly licensed) | Hand-written prose, uncited | keep the prose; every definition a lesson states gets its source in `concepts.md` (part one). A lesson that contradicts its source is corrected there |
| 7.5 | Concept vocabulary (`concepts.json` 286, `vocabulary/skills.json`, `demands.json`) | Names of what is taught | P | The definitions in section 5 | Own vocabulary, unsourced | keep the ids; each concept gets its kind, source and matcher (part one) |
| 7.6 | Review scheduling (`curriculum/session.ts:1446–1490`; `evidence/ladder.ts` `RETENTION_DAYS=21`; `REPERTOIRE_WINDOW_DAYS=14`) | When a skill or piece comes back for review | B | [FSRS / ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) (maintained, MIT); [Leitner system](https://en.wikipedia.org/wiki/Leitner_system) | Fixed thresholds of 21 and 14 days, called hypotheses in the code. The due list is sorted by overdue, then **picked `due[seed % len]`** (`:446`, `:1490`), so the sort does not decide what is reviewed | **replace** with ts-fsrs (R6). It needs new stored fields and changes what the learner is offered, so it is handed to the owner. The pick fault is P0, in a file CT1 may not edit (CL12a owns `session.ts`) |
| 7.7 | Skill ladder (`evidence/ladder.ts`, 304 lines) | Introduced → … → mastered | I (thresholds) | No standard; a teacher's judgement | Own threshold state machine | **claim less:** the states rest on hypotheses and say so; FSRS's retrievability can inform "retained" once R6 lands |
| 7.8 | Evidence rules, transfer, eligibility (`evidence/*.ts`, `curriculum/eligibilityCore.ts`, `transfer.ts`, `selectors.ts`, `candidates.ts`) | What a run proves and what is offered next | none exists | No library models this product's evidence | Own, governed by `docs/design/evidence-truth.md` (CL11) | keep; part four puts the deny-by-default resolver in front of the concept claims |
| 7.9 | Content review log (`review/record.ts`, `tools/content/review.py`) | Human review decisions, append-only | none needed | — | Own JSONL log | keep |
| 7.10 | Finder prompts (`tools/content/finder.py`) | Search queries for new repertoire | none needed | — | Templates | keep |

## Rows of class I: what the app does instead

| Row | Needs | The app does instead |
|---|---|---|
| 4.3, 7.7 | A teacher's judgement of mastery | Reports observed counts against stated thresholds, and calls the thresholds hypotheses |
| 4.4 | Hearing tone, voicing, pedal | Measures velocity and CC64 only where MIDI reports them; never credited from the microphone |
| 5.9, 6.5 | Whether a phrase or study is musical | Ranks candidates only; *unverified as music* |
| 6.8 | Whether an improvised answer is good | Counts notes in the scale, gives no pass and no credit |
| — | Fingering, wrist, relaxation, posture | Not observable from note events; lesson-only, never credited (CT1 part three) |

## The replacement plan this map adds to CT1

Priority follows `operating-procedure.md` §8. Items CT1 owns are done in this work. The
others are handed on with their owner named.

| Id | Replace | With | Class | Owner | Why it is safe or not |
|---|---|---|---|---|---|
| R0 | `detect.ts` as the truth of concept presence | music21 at build time, plus sourced custom matchers for the accompaniment figures | P0 | CT1 parts one and two | `detect.ts` remains for imports and must agree with the build on the catalogue |
| R5 | Seven hand key-name and mode functions; `kern_pitch` | One music21-backed function | P1 | CT1 | Content-build only; the catalogue is rebuilt and diffed |
| R4 | Four theory and spelling tables (`theory.ts`, `StaffCard`, `musicXmlWriter`, `harmony.ts KINDS`) | Tonal | P1 | CT1 (except CL12a's files) | App-side; drill and writer tests must hold. One new dependency |
| R6 | Fixed 21- and 14-day review; `due[seed % len]` | ts-fsrs | P1 (P0 for the pick) | **Owner's decision**: a stored-schema change and a change in what the learner is offered (a CT1 stop condition); `session.ts` belongs to CL12a | Not done here |
| R7 | Difficulty validated only against its own judged levels | CIPI and PSyllabus published levels as the oracle | P1 | CL17 (the level scalar) | Handed over |
| R1 | Regex timewise-to-partwise | W3C `timepart.xsl` via `XSLTProcessor` | P2 | CT1 | Small; the converter has tests |
| R2 | Own regex LilyPond parser | python-ly (already a dependency) | P2 | CT1 | Output JSON diffed byte-for-byte before and after |
| R3 | Own SMF byte parser | `@tonejs/midi` | P2 | MIDI-import owner | Parity tests cover the later stages; not CT1's concept work |
| R10 | Detector and matcher tests built from own fixtures | basic-pitch and parangonar as offline reference oracles | P2 | Audio and engine owners | Test-only |
| R8 | Hand synthesis in the backing loop | smplr instruments | P3 | — | Not CT1 |
| R9 | Own FFT | fft.js | P3 | — | The current one is tested; low value |
| R11 | Own Markdown and two YAML-subset parsers | micromark, js-yaml, PyYAML | P3 | — | Not CT1 |
| R12 | `requests` declared and unused | remove the line | P3 | CT1 | Trivial |

## Searches run (2026-10-03)

Each row's link came from one of these searches or from the code's own citation:

1. ts-fsrs spaced repetition TypeScript library npm
2. pitchy McLeod pitch method JavaScript library npm
3. @tonejs/midi parse MIDI file JavaScript
4. tonal.js music theory library chord detect key scale
5. music21 analysis key Krumhansl documentation analyze('key')
6. Alberti bass definition lowest highest middle highest open music theory
7. parangonar partitura note alignment score following library
8. piano score difficulty estimation dataset PSyllabus CIPI
9. "A Tale of Two Clocks" Web Audio scheduling metronome
10. RCM Piano Syllabus 2022 edition pdf technical requirements grades
11. music21 roman.romanNumeralFromChord documentation
12. pianoplayer automatic piano fingering python
13. ABRSM piano syllabus 2025 2026 scales and arpeggios requirements pdf
14. Open Music Theory accompaniment textures arpeggiated Alberti broken chord
15. verovio MusicXML rendering JavaScript toolkit
16. music21 midi quantize voice separation hand split piano MIDI to MusicXML
17. Hanon The Virtuoso Pianist IMSLP public domain score
18. sheet music sight reading exercise generator open source algorithm melody
19. Hutchinson Music Theory for the 21st-Century Classroom arpeggiated accompaniments Alberti
20. stride piano definition left hand bass note on beats 1 and 3 chord on 2 and 4
21. boogie-woogie bass pattern definition walking bass definition quarter notes
22. PDMX public domain MusicXML dataset MuseScore license
23. pitch spelling algorithm MIDI to note names Meredith PS13 music21 key-aware
24. Faber Piano Adventures level 1 2A 2B scope and sequence concepts
25. Spotify basic-pitch polyphonic transcription JavaScript TensorFlow.js npm
26. W3C Web MIDI API specification
27. MusicXML 4.0 W3C community group final report
28. waltz bass oom-pah-pah definition bass note beat one chord beats two and three
29. music21 meter TimeSignature getAccentWeight beatStrength documentation
30. Mutopia Project license public domain Creative Commons LilyPond scores
31. MusicXML timepart.xsl parttime.xsl XSLT convert timewise partwise
32. music21 chord Chord commonName inversion pitchedCommonName documentation
33. markdown-it OR marked lightweight markdown parser size kB browser
34. Leitner system spaced repetition boxes definition
35. Open Music Theory intervals chord qualities seventh chords
36. oemer optical music recognition open source staff line detection Audiveris
37. smplr npm Soundfont sampled piano Web Audio danigb
38. fft.js indutny fast radix-4 FFT JavaScript npm
39. js-yaml npm YAML parser JavaScript
40. KernScores Humdrum craigsapp mozart piano sonatas github
41. opensheetmusicdisplay OSMD MusicXML renderer VexFlow github
42. SMuFL Standard Music Font Layout specification w3c
43. Goertzel algorithm single frequency DFT

**Links not from these searches.** Some links were not returned by any search above:
- fflate, idb, pdf.js, PyYAML and jsonschema: their projects' canonical homes.
- 17 U.S.C. §302: cited by `licensing.py`.
- the MIDI Association spec pages.
- MAESTRO: cited by `fetch_maestro.py`.
- Pointer Events: the W3C recommendation.

Each opens with one search of its name.

## What this map does not establish

- **Pedagogical claims:** whether a replacement teaches better. The rows decide where the
  truth comes from, not whether the music is good.
- **Read but not run:** the libraries proposed were read about, not run here, except
  music21 (rechecked).
- **The surveys' scope:** `app/src/**`, `tools/content/**`, `tools/midi-cleanup/**` and
  `content/**`, as surveyed. Not covered:
  - `app/src/ui/screens/*` beyond the four engine screens and the chord chart;
  - `app/src/data/*` beyond the stores named;
  - `tools/content/pdmx/*`;
  - `tools/docs/*` and `tools/ci/*` (record tooling, not product).

  A component that lives only in an unsurveyed file is missing from this map.
