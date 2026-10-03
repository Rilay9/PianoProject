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


## 8. Expert-annotated oracles, further libraries and existing generators (the owner, 2026-10-03)

**Provenance.** The owner named these candidates. A search agent then confirmed each exists
and read its licence from search results; its queries are listed below. This session did
not recheck them, so the reviewer confirms each before it is relied on.

**Licences.** The personal build may use non-commercial data. A public release may not ship
NC or SA content, but using such data as a **test oracle** ships nothing.

| # | Candidate | What it gives this project | Licence (as reported) | Link | Use |
|---|---|---|---|---|---|
| 8.1 | DCML Mozart piano sonatas | Experts' harmony and cadence labels, bar by bar | CC BY-NC-SA 4.0 | [DCMLab/mozart_piano_sonatas](https://github.com/DCMLab/mozart_piano_sonatas) | Oracle for chord, Roman-numeral and cadence concepts (5.5) |
| 8.2 | When in Rome (Gotham) | Roman-numeral analyses in RomanText, read by music21 | CC BY-SA 4.0 | [MarkGotham/When-in-Rome](https://github.com/MarkGotham/When-in-Rome) | Oracle for Roman numerals and progressions (5.5) |
| 8.3 | Couturier, Bigo and Levé: Mozart texture annotations | Experts' melody and accompaniment labels per bar | **Annotations ODbL; scores CC BY-NC-SA 4.0** (the dataset's README) | [hal-03860195](https://hal.science/hal-03860195v1) | The oracle for **accompaniment function** (5.4). It cannot establish named figures such as Alberti (see §9.0) |
| 8.4 | CIPI | 652 pieces with Henle difficulty levels | CC BY-NC-SA 4.0 (reported) | [zenodo 8037327](https://zenodo.org/records/8037327) | Difficulty oracle (5.7, R7) |
| 8.5 | PSyllabus | Piano Syllabus levels for 7,901 pieces (audio) | **Unresolved:** research use only versus CC BY 4.0. A private oracle only | [zenodo 14794592](https://zenodo.org/records/14794592) | Level labels by title, to compare with the curriculum and the level model |
| 8.6 | ASAP | Scores aligned to real piano performances | CC BY-NC-SA 4.0 | [CPJKU/asap-dataset](https://github.com/CPJKU/asap-dataset) | Oracle for score following (4.2) |
| 8.7 | partitura | Pitch spelling, key estimation, voice separation, alignment | Apache-2.0 | [CPJKU/partitura](https://github.com/CPJKU/partitura) | Second library behind music21 for spelling and voice separation (1.13–1.15) |
| 8.8 | MusPy | Standard metrics for symbolic music (pitch range, scale consistency, rhythm regularity) | MIT | [salu133445/muspy](https://github.com/salu133445/muspy) | Generator checks (6.3–6.5), part two |
| 8.9 | jSymbolic | Hundreds of symbolic features | GPL-3.0 | [DDMAL/jSymbolic2](https://github.com/DDMAL/jSymbolic2) | Possible features for difficulty (CL17); Java, build-time only |
| 8.10 | basic-pitch, parangonar | Audio to notes; note-level alignment | Apache-2.0 | rows 3.2 and 4.2 | Offline oracles (R10) |

**Existing generators.** The owner asked what exists for this personal project. The search
agent's top fits:

| Fit | Project | What it generates | Output and licence (as reported) | Link |
|---|---|---|---|---|
| 1 | OSME | Sight-reading with configurable notes, rhythm and range | MusicXML, TypeScript, BSD-3-Clause; **the link is unconfirmed**, as the published home is [opensheetmusiceducation.org](https://opensheetmusiceducation.org/) | reported as github.com/opensheetmusicdisplay/osme |
| 2 | SightScore | Sight-reading by ABRSM grade | MusicXML strings, JavaScript; licence unconfirmed | reported as github.com/stevenmusic/SightScore |
| 3 | ftrain/sightreading | A procedural sight-reading curriculum | MusicXML and MIDI, JavaScript, LGPL-3.0 | reported as github.com/ftrain/sightreading |
| 4 | SREGen | Sight-reading by genetic algorithm | C#, licence unconfirmed | [SREGen](https://kchua.github.io/SREGen/) |
| 5 | Tonal | The theory facts any generator needs | MIT | [tonaljs/tonal](https://github.com/tonaljs/tonal) |

**What this changes (the owner's direction, 2026-10-03).**
- **Spelling by construction.** Exercises are built from music21's scale, chord and arpeggio
  objects, never hand tables. The scale and arpeggio families already are (6.1); R4 and R5
  extend this to the rest.
- **Published before generated.** Hanon, Czerny, Burgmüller, Clementi and others come from
  Mutopia and IMSLP before anything is generated. Their availability on Mutopia was not in
  the agent's report, so it is open (part two).
- **Expert-annotated data is the test oracle wherever it covers a concept:**
  - 8.3 for accompaniment function only; named figures need their own sourced checks;
  - 8.1 and 8.2 for chords;
  - 8.4 and 8.5 for levels;
  - 8.6 for score following.
- **Sight-reading generators.** The ones above are compared with `engine/sightReading.ts` in
  part two §2: the same level parameters, run through MusPy's metrics. Replacement is
  decided on that comparison, not on this list.
- **AI music generators** (Magenta and the like) are excluded: they are opaque, the opposite
  of checkable.

**The agent's searches:**
- OSME Open Sheet Music Education exercise generator
- SREGen music exercise generator
- music21 exercise generator sight reading
- sight reading generator GitHub MusicXML
- abcjs notation sight reading exercises
- VexFlow music notation exercise generator
- Tonal.js music theory exercises scale chord generator
- ear training open source web app exercises
- rhythm generator music exercises open source
- Hanon Czerny Burgmüller public domain piano études
- DCML Mozart piano sonatas corpus harmony annotations
- Mark Gotham "When in Rome" Roman numeral music21
- Couturier Bigo Levé Mozart texture annotations melody accompaniment (and its licence)
- CIPI Ramoneda piano difficulty (and its licence)
- PSyllabus (and its licence)
- ASAP aligned scores and performances dataset
- jSymbolic (and its licence)
- partitura
- MusPy
- Spotify basic-pitch
- parangonar


## 9. The reuse census (`CLAUDE.md`, *Reuse before reinvention*)

**These labels are candidate decisions, not proof** (`plan.md` §11.6). A REPLACE row needs
three more things before anything is replaced: its semantic fit, its limitations, and a
"why not simpler?" line. Every row also allows the no-op outcomes: keep as is, narrow the
claim, retire, or defer.

Every custom mechanism, with:
- why it is custom;
- what was searched for in its place: an asset, a library, a dataset, a reference implementation or a published algorithm;
- what was found and why it was taken or rejected;
- one label.

**Labels:**
- **KEEP CUSTOM:** nothing better exists, or what exists fits worse; the reason is stated.
- **REPLACE WITH LIBRARY:** a maintained library does it.
- **REPLACE WITH DATA:** published data supplies it.
- **ADAPT EXISTING:** a reference implementation or published algorithm, with a thin adapter.
- **USE REAL CONTENT:** licensed real music teaches it.
- **UNSOLVED:** nothing found, and our version is not trustworthy either; claim less.

Rows in sections 1–8 above stay as written. This census adds the mechanisms they grouped,
one by one. Rows cite their sources by the ids in `plan.md` §3 (S1–S8, O1–O8, L1–L8).

### 9.0 New sources found for the census (2026-10-03, after full network access)

**Fetched and read here:**

| Id | Source | What it holds | Licence | Use |
|---|---|---|---|---|
| S2 | ABRSM Piano 2025–26 | Sight-reading parameters table (p. 16), grade by grade: length, time signatures, keys, hand position, features | Read and cite | **The level table for sight-reading:** Initial is 4 bars in 4/4, C major / D minor, hands separately in five-finger position. Grade 4 adds 6/8, anacrusis and chromatic notes. Grade 6 adds triplets, clef changes and the right pedal |
| S5 | Faber Piano Adventures correlation chart (3 pp.) | Topics per Faber level, aligned to Alfred, Bastien, Piano Safari, Music Tree and the Celebration Series, the exam ladders as reported | Read and cite | **Concept order across method books.** For example, Faber 3A introduces "Ostinato and alberti bass", ledger lines, 3/8, 6/8, the triplet and swing rhythm |
| O3 | ALGOMUS "Mozart Piano Sonatas" archive ([data.gouv.fr](https://entrepot.recherche.data.gouv.fr/dataset.xhtml?persistentId=doi:10.57745/OHRWPC)) | Per-bar expert texture labels for K. 279, 280 and 283 (`analysis/*_texture.dez`; 134 labels in K. 279/1), plus form, harmony and cadence | **Annotations ODbL;** scores CC BY-NC-SA 4.0 | The texture oracle. See the caution below |
| O3a | Texture syntax (Couturier, Bigo, Levé, SMC 2022) and descriptor code ([gitlab algomus.fr/symbolic-texture-dataset](https://gitlab.com/algomus.fr/symbolic-texture-dataset), [comparing-texture](https://gitlab.com/algomus.fr/comparing-texture)) | Layers M (melody), H (harmonic), S (static), with density and diacritics: h homorhythm, p parallel, o octave, t sustained, r repeated notes, b oscillation, s scale. About 60 Python descriptors over music21 streams (`descriptors.py`: pitches, onsets, slices, regularity, voices) | GPL-3.0 (build-time tools only; nothing shipped) | **A published texture vocabulary and its features**, in place of our own `texture.*` demands |

**The caution on O3.** The experts label *function and figure*, not style names. Alberti
bass is written `HS1`, a single-voice harmonic-static accompaniment (paper §3, Figure 1c).
So O3 checks two things:
- whether a bar is a melody over an accompaniment layer;
- whether a matcher's "Alberti" bars fall in `HS1`-type accompaniment (precision).

It does **not** check recall of Alberti as such.

**Found but not fetched here:**

| Id | Source | What it holds | Licence | Use |
|---|---|---|---|---|
| O9 | [FiloBass](https://aim-qmul.github.io/FiloBass/) (Riley and Dixon, ISMIR 2023) | 48 verified transcriptions of professional jazz bass lines: scores, aligned MIDI, chord symbols, beats | Zenodo CC BY 4.0, plus a research-use agreement for the copyright material | Oracle and statistics for walking bass: which degrees fall on which beats, and approach-note practice |
| O10 | [iRb corpus](https://archives.ismir.net/ismir2018/paper/000206.pdf) (Broze and Shanahan); [Jazz Harmony Treebank](https://github.com/DCMLab/JazzHarmonyTreebank) | Chord progressions of 1,186 jazz standards, in Humdrum, which music21 reads | Research corpus; licence to check | Real progressions for ii–V–I, turnarounds, rhythm changes and blues forms, in place of hand tables |

**Reference implementations** (from the reference survey; read through page summaries, so
names are to confirm):

| Project | Licence | What it offers us |
|---|---|---|
| [ynot99/sight_reading_practice](https://github.com/ynot99/sight_reading_practice) | MIT | Our stack (OSMD, Web MIDI, TS). Order-free chord matching in a window (`domain/matching/ChordMatcher.ts`); rhythm difficulty kept separate from pitch difficulty; a fake MIDI clock test harness |
| [PianoBooster](https://github.com/pianobooster/PianoBooster) | GPL | Follow-mode windows: an early cut-off and a beginner/advanced stop point (`Conductor.cpp`); a tiered running accuracy (`Rating.cpp`) |
| [Perfect Ear (wero1414/ear-training)](https://github.com/wero1414/ear-training) | MIT | A 43-stage ear-training ladder with SM-2 review |
| [ftrain/sightreading](https://github.com/ftrain/sightreading) | LGPL-3.0 | 23 mastery-gated sight-reading levels |
| [ctrlshiftcommit/piano-practice-app](https://github.com/ctrlshiftcommit/piano-practice-app) | MIT | Waits out the attack transient; an explicit "uncertain, unscored" outcome |
| [isc/arabesque](https://github.com/isc/arabesque) | MIT | A bar-by-bar practice journal (OSMD) |

**Not found:** a JavaScript online-DTW score follower; a Tonal-based drill app; a MIDI to
MusicXML importer with hand split in JS.

### 9.1 Generator families (`tools/content/generate_exercises.py`, 57 families)

**How it was found.** Two scripts were run over the code, with their outputs beside this
file:
- `families-ast.txt`, over the AST: the tables and music21 calls of each family;
- `spelling-paths.txt`, over the call graph: how each family spells.

**Corrected after review.** It is not true that every family spells "by construction".
- **From the key:** many families spell from the key's degrees.
- **Through `up()`:** about 25 spell chord tones through `up()`'s single interval name per
  semitone count (`SEMITONE_INTERVAL`, :3480), so a sharp eleventh and a flat fifth cannot
  both be right.
- **With no key-derived helper:** seven families (`chromatic`, `blues_scale`, `pentatonic`,
  `riff`, `tresillo`, `swing_pair`, `modal_vamp`).

Passing a name through `pitch.Pitch` checks nothing. The independent check is partitura's
pitch-spelling estimator over every generated item (`plan.md` §11.1). **The musical content** (which chords, which figures, which rhythms) comes
from hand tables and hand loops. The census therefore asks of each family where its content
should come from, not how it spells.

#### Technique

| Family : line | Content today | Searched | Label and decision |
|---|---|---|---|
| `scale` :1048 | music21 scales; fingering from Clementi Op. 42, Kelley, McLain (cited) | S1/S2 technical requirements; published scale books (copyrighted) | **KEEP CUSTOM.** Correct by construction. ADAPT its forms, ranges and tempi to S1/S2 rows: hands, octaves, contrary motion, speeds |
| `arpeggio` :1136, `seventh_arpeggio` :1496, `broken_seventh` :1758, `triad_inversions` :1182 | Degrees through `key.Key`; Kelley and McLain fingering | S1's "broken/solid chords" forms by level; music21 `chord` | **KEEP CUSTOM**, forms ADAPTed to S1/S2. `broken_seventh` shapes (`SEVENTH_SHAPES` :1441) have no cited source: cite S1's broken-chord patterns or drop |
| `five_finger` :1226 | `FIVE_FINGER_STEPS` :438 | Faber (S5: 5-finger scales at 1–2A, transposition at 2A) | **KEEP CUSTOM** (trivial); levels from S5 |
| `chromatic` :1392 | 1–3 fingering (McLain) | — | **KEEP CUSTOM** |
| `double_scale` :1609, `octave_scale` :1679 | `DOUBLE_THIRD_*` and `DOUBLE_SIXTH_*` fingering tables :1603–1606 | Published thirds fingering (Czerny, Op. 740 is too advanced; standard charts) | **KEEP CUSTOM.** The double-note fingering tables have **no cited source**, so cite or mark them computed |
| `hanon` :1268 | Mutopia Hanon notes (`hanon-mutopia.json`) | — | **USE REAL CONTENT** (already) |
| `trill` :2499, `tremolo_octaves` :2622, `repeated_notes` :2446, `rotation` :2700 (Alberti at speed) | Hand loops | **Real études written for exactly these:** Czerny Op. 599, 261, 849; Burgmüller Op. 100; Duvernoy Op. 176 on Mutopia and IMSLP (`plan.md` §3d) | **USE REAL CONTENT first**; keep the generated drill only as an isolated short loop. Mutopia's holdings are not yet listed, so that listing is the first action |
| `articulation` :2757, `shaping` :2869, `voicing` :2911, `pedal` :2369, `pedal_variant` :3259 | Hand phrases; measured by velocity, release and CC64 | Burgmüller Op. 100 (legato, staccato, voicing studies), Czerny | Kind (b): performance only. **USE REAL CONTENT** for the music. The measures stay **KEEP CUSTOM** for MIDI input only (`plan.md` W10) |

#### Reading and rhythm

| Family : line | Content today | Searched | Label and decision |
|---|---|---|---|
| `rhythm` :1871 | `RHYTHM_PATTERNS` :1829 | S1/S2 rhythm requirements; constraint-generated rhythm exercises (L4) | **ADAPT EXISTING.** The palette per level comes from S2's table, and a CP-SAT model meets it exactly |
| `interval_reading` :1998, `position_shift` :2062, `coordination` :1960, `hand_independence` :2827, `syncopation` :2949, `meter` :3189 | Hand loops, `random` in `interval_reading` | S2 sight-reading parameters; Beyer Op. 101, Köhler, Gurlitt and Czerny Op. 599 (public-domain graded reading); ynot99's generator; ftrain's levels | Early levels: **USE REAL CONTENT** (Beyer, Czerny Op. 599). Drill volume: **ADAPT EXISTING**, i.e. the `plan.md` §4 pipeline with S2's rows. `meter` uses `SHUFFLE_BASS` :3145 for odd meters, which is to check |
| `study` :6019 (`study.py`, 1,405 lines) | Own phrase grammar, random walk, own evaluator | Published études at each level (Burgmüller, Czerny, Gurlitt); `plan.md` §4 | **USE REAL CONTENT**, and retire `study.py`'s grammar. Any study kept is rebuilt as a §4 recipe |

#### Harmony and accompaniment

| Family : line | Content today | Searched | Label and decision |
|---|---|---|---|
| `accompaniment` :2200 | `ACCOMPANIMENT_PATTERNS` :2189: broken [0,1,2,1], Alberti [0,2,1,2] (matches S6's low–high–middle–high), waltz [bass, chord, chord] over I–IV–V–I | O3 `HS1` bars in Mozart; Clementi Op. 36 | **USE REAL CONTENT first:** passages in an O3 `HS1` layer **and** verified as Alberti by the sourced check; Op. 36 passages verified the same way. `HS1` alone is accompaniment. The figure table **KEEP CUSTOM**, citing the same definition as the matchers, but implemented separately from them so the check stays independent. Progressions **REPLACE WITH DATA** (O1/O2 at the level) |
| `oompah` :2315, `stride` :4268, `secondary_rag` :3038 | `OOMPAH_CHORDS` :2268; stride "bass, chord, tenth, chord"; `SECONDARY_RAG_CELL` :3030 | **Joplin rags in KernScores** (already fetched: `kern/joplin`); waltzes by Burgmüller and Gurlitt | **USE REAL CONTENT candidates:** Joplin passages, each **verified for the figure** before it is claimed. Genre establishes nothing. Generated loops kept as isolated drills, with figures from the shared definitions |
| `cadence` :2152 | Hand voicings, "one of three" | S3 (cadences by grade); music21 `figuredBass.realizer`; O1 cadence labels | **REPLACE WITH LIBRARY** (RomanText → realizer) **plus DATA** (O1 cadences as real examples) |
| `four_chord_loop` :3815, `slash_bass` :3867, `intro` :5263, `modal_vamp` :5887 | `FOUR_CHORD_LOOP` :3812, hand intervals | O2 (popular-music analyses are in When in Rome); music21 `harmony.ChordSymbol` | **REPLACE WITH LIBRARY** for the chords; progressions stay as named standard forms (I–V–vi–IV is a definition) |
| `seventh_voicing` :3760, `ii_v_i` :4390, `tritone_sub` :4491, `open_voicing` :4530, `turnaround` :4329, `passing_chord` :5427, `walkup` :5339, `comping` :4180 | `II_V_I` :3431, `VOICING_LABELS`, `COMPING_BARS` :4134, `WALKUP_*` :5334–5336, `PASSING_TARGETS` :5424 | O10 (real jazz progressions); jazz voicing definitions (shell, rootless A/B in jazz-theory texts); Tonal/music21 chord symbols | **REPLACE WITH LIBRARY** (symbols → pitches) and **REPLACE WITH DATA** (O10 progressions and turnarounds). Voicing *types* **KEEP CUSTOM** as cited definitions. Comping *rhythms* are **UNSOLVED** as to source: no open, labelled comping-rhythm data was found, so they are claimed as rhythm drills only |
| `power_chord` :5503 | `POWER_CHORD_ROOTS` :5500 | — | **KEEP CUSTOM** (a definition: root, fifth, octave) |

#### Blues, jazz and Latin figures

| Family : line | Content today | Searched | Label and decision |
|---|---|---|---|
| `walking_bass` :4005 | `TWELVE_BAR` :3937, `TWELVE_BAR_MINOR` :3950; root–third–fifth–approach | O9 FiloBass (real lines); O10 (forms) | **ADAPT EXISTING.** The rule (chord tone on the beat, approach into the next root) is checked against O9's statistics. Forms come from O10. Generation stays, because real lines are copyright and research-only |
| `boogie` :4665 | `BOOGIE_PATTERNS` :4618 (R–3–5–6–♭7 type) | StudyBass definition; early boogie recordings and scores (public-domain status per piece to check) | **KEEP CUSTOM** figures with the cited definition. Real content is UNSOLVED until a public-domain boogie score is confirmed |
| `blues_scale` :4761, `pentatonic` :5710 | `BLUES_SCALE` :4757, hand intervals | music21 `scale` has no blues scale; Tonal's `Scale.get("C blues")` does | **REPLACE WITH LIBRARY** (Tonal's scale dictionary at runtime; at build a cited interval list, which is a definition) |
| `clave` :4945, `tresillo` :5774, `tumbao` :5114, `montuno` :5149, `latin_groove` :5197 | `CLAVE_PATTERNS` :4870, `TUMBAO_OFFSETS` :4907, `LATIN_VAMP` :4912 | Clave and tresillo are standard definitions (onset sets); montuno and tumbao have published forms in salsa texts (copyrighted) | **KEEP CUSTOM** as cited onset definitions. Montuno is **UNSOLVED** for real content |
| `swing_pair` :5823, `riff` :5619, `ostinato` :5969 | Hand figures | — | **KEEP CUSTOM**, small. Ostinato candidates: O3 static (`S`) layers with the repeat verified in the notes |

### 9.2 Demand detectors (`app/src/demands/detect.ts`, 19)

| Detector | Label | Reason and replacement |
|---|---|---|
| `bassClef`, `ledgerLines`, `steps`, `skips`, `leaps`, `eighths`, `shorterThanQuarter`, `sixteenths`, `dottedQuarters`, `ties`, `triplets`, `compoundMetre`, `keySignature`, `chromatic` | **REPLACE WITH LIBRARY** | music21 at build is the reference (`plan.md` W2); `detect.ts` stays for imports and runtime phrases and must agree on the catalogue. Two known gaps: `bassClef` assumes staff 2 is the bass clef, where music21 `clef` reads the clef; `chromatic` falls back to pitch class against the major scale, where music21 `key.KeySignature.accidentalByStep` reads the key |
| `syncopation` | **REPLACE WITH LIBRARY** + cited definition | Rule over music21 `beatStrength` (onset on a weaker position, sustained over a stronger one). Definition from S7; the E22 blind spots are tests |
| `beyondPosition` | **KEEP CUSTOM** | Five-finger position is a method-book definition (S5); the rule is one line |
| `handsTogether` | **KEEP CUSTOM** | A fact of onsets |
| `leftHandPattern` | **REPLACE WITH DATA-checked definitions** | The vague demand narrows to "accompaniment layer present", in O3a's vocabulary (`H`/`S` layer under `M`), validated on O3. Named figures are separate checks (`figures.py`), each proven on its source's examples. O3 measures only their precision |
| `walkingBass` | **ADAPT EXISTING** | Cited rule, checked against O9 statistics; stride and one-note pulse excluded (`pending-detect.patch`) |

### 9.3 Scoring and performance rules

| Rule (file : line) | Today | Searched | Label and decision |
|---|---|---|---|
| Wait mode (`PracticeEngine.feedWait` :905) | Advance when the set is struck; clean when there are no wrong notes and at most one retry | PianoBooster follow mode (wait with an early cut-off and a stop point); ynot99 wait mode (pitch only) | **ADAPT EXISTING:** add PianoBooster's early window and a beginner stop point as explicit settings. The set match stays |
| Keep-tempo match (`findSlot` :1298, 150 ms) | Greedy nearest per note | ynot99 `ChordMatcher` (order-free window); parangonar and O7 ASAP as oracles; no JS online DTW exists | **KEEP CUSTOM** the matcher. **Test it against O7** with real performances, and adopt ynot99's order-free chord window if O7 shows chord-order misses |
| Pass and master (`Scoring.ts` :428, :507: 0.90 and 80%; 0.97 and 100%) | Flat thresholds, called hypotheses | PianoBooster's tiered running accuracy; exam marking criteria are holistic; no published numeric standard | **UNSOLVED** as truth, so claim less (§4.3). The thresholds stay as stated hypotheses. Consider PianoBooster's running accuracy as the display |
| Technique measures (`Scoring.ts` :594–1049) | Velocity, release and CC64 ratios | No published thresholds | **KEEP CUSTOM**, MIDI only, as hypotheses; never credited from the microphone |
| Steadiness (`steadiness.ts`) | Standard deviation against the click | Descriptive statistics | **KEEP CUSTOM** |
| Tempo ladder (`nextLadderTempo` :144: ±10, clamped 30–100) | Fixed steps | ftrain starts at 30 bpm and gates on mastery; S1/S2 give target tempi per grade for technique | **ADAPT EXISTING:** the targets per level come from S1/S2 technical tempi; the step stays |
| Microphone detection (`audio/pitch/*`) | Score-informed harmonic templates | ctrlshiftcommit (attack wait, "uncertain" outcome); xon-music (YIN plus harmonic decomposition, documented failure list); basic-pitch | **KEEP CUSTOM.** Adopt the "uncertain, unscored" outcome, and test with basic-pitch as the offline oracle (R10) |

### 9.4 Drill factories (`content/catalog.static.json`: 78 rows; `engine/drills/*`)

**What the catalogue holds** (counted at the base):

| Kind | Rows |
|---|---|
| sight-reading | 9 |
| rhythm | 7 |
| note-flash | 5 |
| chord | 5 |
| backing-track | 5 |
| find-key | 4 |
| five-finger | 4 |
| ear-progression | 3 |
| simon | 3 |
| ear-interval, ear-chord, call-response, mode, extended-chord, harmonic-dictation, roman-numeral, transposition, ear-tune | 2 each |
| checklist, walkthrough, placement, dynamics, pedal, arpeggio, inversion, chord-scale | 1 each |
| no drill kind (songs) | 7 |

| Drill kinds (factory) | Today | Searched | Label and decision |
|---|---|---|---|
| `note-flash`, `find-key` (`factories.ts` :35, :61: MIDI 60–72, uniform) | Uniform random | Faber S5 note-reading order (landmarks, then Bass C to Treble G at Primer); Alex-R-A's per-note adaptive repetition | **ADAPT EXISTING:** ranges per level from S5; per-note weakness weighting |
| `chord`, `inversion` (:114, :136) | Root 60–71; maj, min, dim, dom7 | S3's chord qualities by grade; Tonal chord dictionary | **REPLACE WITH LIBRARY** (Tonal) and **REPLACE WITH DATA** (qualities per grade from S3), as candidates |
| `ear-interval`, `ear-chord`, `ear-progression` (:183, :208, :245) | Fixed sets; progressions in C | S1/S2 aural tests by grade; Perfect Ear's 43-stage ladder | **ADAPT EXISTING:** the sets per level from S1/S2 aural requirements, with Perfect Ear's order as the comparison |
| `harmonic-dictation` (`ChordDictationDrill`, `harmony.ts` :388) | Chords split at a 120 ms gap | S1/S2 aural requirements | **KEEP CUSTOM** the splitting; content per level from S1/S2 |
| `roman-numeral`, `mode`, `chord-scale`, `extended-chord` (`harmony.ts` :67–201, `theory.ts`) | Hand tables | Tonal (`RomanNumeral`, `Mode`, `Chord`) | **REPLACE WITH LIBRARY** (R4), as a candidate |
| `ear-tune`, `call-response`, `transposition` | Random walks over a scale; transposition reuses the sight-reading generator | — | **KEEP CUSTOM**; claim nothing beyond notes matched (already so) |
| `sight-reading` (`engine/sightReading.ts`) | Bounded random walk, rejection sampling | S2's parameters table (fetched); ynot99 and ftrain generators; OSME | **ADAPT EXISTING:** parameters from the S2 and S1 source tables, rhythm on its own axis (ynot99); checked by the `plan.md` §4.4 checks on a seeded sample |
| `simon` (`simon.ts`) | Memory chain, pass at 5 and master at 8 | No standard | **KEEP CUSTOM**; thresholds are hypotheses |
| `rhythm`, `pedal`, `dynamics`, `backing-track` (`special.ts`) | Windows ±150 ms, CC64, velocity ratio 1.6; backing track records only | — | **KEEP CUSTOM**, MIDI only; thresholds are hypotheses |
| `five-finger`, `arpeggio` (runtime technique drills) | Fixed patterns | S1/S2 technical requirements | **KEEP CUSTOM**; forms from S1/S2 |
| `checklist`, `walkthrough`, `placement` | Not musical content: a list, a guided tour, the placement test | — | **KEEP CUSTOM**; outside the census's musical scope, listed so the coverage check is total |
| Coaching sentences (`coaching.ts`) | "Rules, not a model"; guesses | — | **KEEP CUSTOM**, labelled as suggestions |

### 9.5 Difficulty calculations

| Calculation | Today | Searched | Label and decision |
|---|---|---|---|
| `difficulty.py` and `difficulty.ts` (19 features, log-linear, own ridge solver) | Fitted on the catalogue's own judged levels | O4 CIPI, O5 PSyllabus, O6 exam lists; O3a descriptors; jSymbolic | **ADAPT EXISTING** (owned by CL17). Refit and validate on O4–O6. The solver becomes numpy. O3a descriptors and Ramoneda et al.'s published features are candidate features |
| `pdmx-csv-level.json` (second model on PDMX CSV fields) | Its own fit | As above | **REPLACE WITH DATA** where O5 or O6 match the title; otherwise kept as a fallback |
| Generator level functions (`scale_level` :377, `five_finger_level` :441, `arpeggio_level` :489, `broken_seventh_level` :506) | Hand formulas | S1/S2 technical requirements state the level at which each scale, arpeggio and form is required | **REPLACE WITH DATA:** level = the first S1/S2 grade that requires the form |
| `sightReading.ts` level parameters | Hand per level | S2 table (fetched), S1 | **REPLACE WITH DATA** (`plan.md` W8's level table) |
| Rung `levelBand` | Hand | S5 and S1/S2 placement of the rung's concepts | **REPLACE WITH DATA** once W8 lands; the owner decides moves |

### 9.6 Theory and harmony operations

| Operation | Label |
|---|---|
| Key naming, seven copies (row 1.15) | **REPLACE WITH LIBRARY** (music21) |
| Spelling tables: `StaffCard`, `musicXmlWriter`, `extractScoreModel`, `detect.ts` | **REPLACE WITH LIBRARY** (Tonal) |
| Chord-kind table (`harmony.ts`) | **REPLACE WITH LIBRARY** (Tonal) |
| Roman numeral to chord (`theory.ts` :305) | **REPLACE WITH LIBRARY** (Tonal) |
| Key estimation, browser port of Aarden–Essen | **KEEP CUSTOM** (a faithful port; music21 is the reference) |
| Chord identification from notes (absent) | **REPLACE WITH LIBRARY** (music21; O1/O2 measure its trust) |

### 9.7 Content sources

| Source | Label |
|---|---|
| Mutopia, KernScores, PDMX, MuseTrainer, NIFC | **USE REAL CONTENT** (kept) |
| Exercise generation where études exist | **USE REAL CONTENT:** first list Mutopia's Czerny, Burgmüller, Beyer, Duvernoy, Gurlitt and Clementi Op. 36 holdings, and IMSLP's where Mutopia lacks them |
| Authored ABC tunes (`content/scores/authored`, 33) | **KEEP CUSTOM**, CC0. A folk tune with a public-domain source (Mutopia, PDMX) replaces its authored copy where the notes agree |
| Lessons (109) | **ADAPT EXISTING:** each definition a lesson states is cited to S6/S7; prose stays |
| Concept vocabulary and texture demands | **REPLACE WITH DATA:** texture concepts take O3a's published syntax |

### 9.8 Progression mechanisms

| Mechanism | Today | Searched | Label and decision |
|---|---|---|---|
| Curriculum order (`stage-*.json`) | Own | S1, S2, S3, S5 | **REPLACE WITH DATA** for first-appearance levels (W8); **the owner decides** reorders |
| Prerequisites and eligibility (`prerequisites.ts`, `eligibilityCore.ts`) | Own gates | No library models this product | **KEEP CUSTOM**; their inputs (concept presence) come from the sourced matchers |
| Session composition and review pick (`session.ts` :446/:1490, `due[seed % len]`) | Own | FSRS (ts-fsrs); Perfect Ear's SM-2 | **REPLACE WITH LIBRARY** (owner's decision, R6). The pick bug is P0 regardless (CL12a's file) |
| Skill ladder (`ladder.ts`) | Own thresholds | — | **UNSOLVED** as truth; claim less (`plan.md` §2.6) |
| Transfer (`transfer.ts`) | Six categorical dimensions | — | **KEEP CUSTOM**; texture dimension fed by the O3a vocabulary |

### 9.9 Census totals

Counted by script over the 64 labelled rows of §9.1–§9.8. Each row counts once, by
the first label in it, so a row that keeps a definition but replaces its data counts under
its first label.

| Label | Rows |
|---|---|
| KEEP CUSTOM | 23 |
| REPLACE WITH LIBRARY | 14 |
| REPLACE WITH DATA | 7 |
| ADAPT EXISTING | 9 |
| USE REAL CONTENT | 9 |
| UNSOLVED | 2 |

UNSOLVED appears in more rows than it leads. **UNSOLVED** (stated plainly; claim less):
- pass and master thresholds as truth;
- the skill ladder as mastery;
- comping-rhythm sources;
- real montuno content;
- real boogie content until a public-domain score is confirmed.

**Deletions this census welcomes:**
- `study.py`'s grammar, retired for real études;
- seven key-name functions, for one;
- four theory tables, for Tonal;
- the hand level formulas, for S1/S2 data;
- the vague `texture.left-hand-pattern` demand, for O3a layers plus figure matchers.

**The searches behind §9:**
- the reference survey's searches (as listed in its report);
- *FiloBass dataset jazz walking bass*;
- *iRb corpus jazz standards*;
- *Couturier texture piano descriptors code*;
- the [algomus.fr/code](https://www.algomus.fr/code/) listing;
- GitLab API reads of the two texture repositories;
- the fetched texts of S1 (`pdftotext`), S2 (p. 16), S5 and the ISMIR 2022 texture paper.

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
