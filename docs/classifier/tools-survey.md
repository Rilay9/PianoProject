# Existing tools for the hard characteristics: a survey (2026-10-08)

**What this is.** One research pass, on the owner's go, acting on `docs/classifier/rules/lessons-chunk1.md` item 10: before more rules are written, find the libraries, trained models and annotated datasets that already answer the hard musical questions. Worktree cut from origin at c13b6ca4. Nothing was installed or run; no rule is written here. Which candidate to test is the owner's decision.

**How it was done.** A fixed list of characteristics (the brief's chunk-1 list, and every row of sections 1.D to 1.L of `characteristics-list.md` that is not a direct read of a notation field), up to three candidates each. Facts were read on the project's or paper's own page:
- licence, last push and latest release: the GitHub API (`gh api repos/...`), on 2026-10-08;
- figures: the paper's own text (arXiv HTML, or the PDF fetched to `build/` and read with `pdftotext`);
- library functions: the installed sources in `.venv` (music21 10.5.0, partitura 1.9.0), read, not run.

A figure that comes only from a web-search summary, or that could not be found on the page, is marked **not confirmed**. Every accuracy below is the publisher's figure on the publisher's data. None was measured on this project's catalogue, and none says how the tool will do on the catalogue's scores (lessons item 10 asks for that measurement next).

**Status of a characteristic.**
- **candidate**: an existing tool, model or library function answers the question itself.
- **nothing found**: nothing does. Where libraries supply only the inputs (note arrays, intervals, chords) and the detection itself would still be custom, the row says "nothing found (building blocks: ...)".

**Excluded as direct reads of a notation field** (not surveyed): `mark.dynamics`, `mark.hairpin`, `mark.articulation`, `mark.slur`, `mark.pedal`, `mark.pedal-kind`, `mark.ornament`, `mark.arpeggiate`, `mark.tremolo`, `mark.fermata`, `mark.expression-text`, `mark.glissando`, `meta.genre-tags`, `meta.collection`, `generated.spec-declared`, `meta.keyboard-sound`.

**Offline.** "Yes" means it runs in a Python (or local) build with no network once installed. "Weights download once" means the model file is fetched once from a host (W&B, Hugging Face, OneDrive, Google Drive) and then runs locally.

---

## 1. Key, mode and key change

Characteristics: `key.tonic-mode`, `key.change`

| candidate | what it does here | licence | offline | input | published accuracy (source) | maintenance | leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AugmentedNet (Nápoles López, Gotham, Fujinaga, ISMIR 2021), github.com/napulen/AugmentedNet | A CRNN trained for Roman numeral analysis. It outputs a local key at every time step (gives key changes and tonicisations) together with chord degree, quality, inversion and root. | MIT | yes, the model file `AugmentedNet.hdf5` is in the repo | MusicXML (also its RomanText for training) | Key 83.7%, Degree 66.0%, Quality 77.6%, Inversion 77.2%, Root 83.2%, RN 45.0% (best configuration, aggregate test set); key 77.2% to 88.7% across test sets (BPS, WTC, When in Rome and others) (repo README) | last push 2024-02-11, release v1.9.1 2022-08-08 | Trained on classical (chorales, sonatas, quartets) and RomanText analyses. Pop, jazz, lead sheets and generated drills are out of its training domain. A global key is not a separate output. |
| music21 key-profile analysers (`analysis.discrete`: KrumhanslSchmuckler, AardenEssen, BellmanBudge, TemperleyKostkaPayne, SimpleWeights), `analysis.windowed.WindowedAnalysis`, `analysis.floatingKey.KeyAnalyzer` (bar-wise key with smoothing); partitura `estimate_key` (Krumhansl–Kessler, Temperley or Kostka–Payne profiles) | Global key by profile correlation. Windowed and floating-key analysis give local keys. | BSD-3 (music21), Apache-2.0 (partitura) | yes, both already installed | MusicXML, MIDI, kern and others | Global key on the Albrecht–Shanahan set (982 kern files, 492 test, 20 splits): Krumhansl–Schmuckler 74.2%, Temperley 88.6%, Bellman–Budge 91.1%, Aarden–Essen 90.4%, Sapp 90.4% (Nápoles López, Arthur, Fujinaga, DLfM 2019, Table 3, read in the PDF). No published figure found for music21's windowed or floating-key output. | music21 v10.5.0 2026-06-17; partitura v1.9.0 2026-05-25 | These are the profiles chunk 1 already used, and Aarden–Essen called a C major scale A minor (lessons item 6). Local-key output has no published accuracy. Mode beyond major/minor is not covered. |
| justkeydding (Nápoles López et al., DLfM 2019), github.com/napulen/justkeydding | An HMM over key profiles. Stage 1 segments local keys; stage 2 takes the global key. A logistic-regression ensemble over six profiles. | MIT | yes | MIDI (and audio) | Global key on the same Albrecht–Shanahan set: ensemble 94.4% (major 96.1, minor 91.5); single profiles 78.4% to 91.3% (same Table 3). Local keys were not evaluated: the paper says that needs ground truth that is "currently scarce". | last push 2020-05-08, release v0.9.1 2019-09-18; C++ core | Unmaintained since 2020. Local-key accuracy unknown. MIDI input only (MusicXML would need exporting to MIDI). |

**Annotated data to test against.**
- When in Rome (github.com/MarkGotham/When-in-Rome, CC BY-SA 4.0): about 2,000 analyses of 1,500 works, with local keys. It includes the "Key Modulations and Tonicizations" textbook corpus (Aldwell and others), which is made for key change.
- DCML corpora (CC BY-NC-SA 4.0): the Mozart piano sonatas, ABC, Distant Listening Corpus.
- The Albrecht–Shanahan global-key set: cited in the paper; its location was not checked.

| id | status | what serves it |
| --- | --- | --- |
| `key.tonic-mode` | candidate | justkeydding ensemble, the music21 profiles (Bellman–Budge best published single profile), AugmentedNet's opening/closing local key |
| `key.change` | candidate | AugmentedNet local key; AnalysisGNN local key (section 10); music21 floating-key analysis (no published figure) |

**Recommendation.**
1. Test AugmentedNet first. It is the only candidate with a published local-key figure, it reads MusicXML, and it needs no download. Run it on the "Key Modulations and Tonicizations" corpus and the DCML Mozart sonatas, then on the catalogue items chunk 1 got wrong (the 145 home-dominant areas, Happy Birthday, the Inventions).
2. Use Bellman–Budge, already installed, as the global-key witness. Compare the two against each other before trusting either.

## 2. Scale and mode naming

Characteristics: `scale.collection`, `key.minor-form`

| candidate | what it does here | licence | offline | input | published accuracy (source) | maintenance | leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| music21 `scale` (MajorScale, MinorScale, HarmonicMinorScale, MelodicMinorScale, the church modes, OctatonicScale, WeightedHexatonicBlues) with `ConcreteScale.deriveRanked` / `deriveAll` | Ranks which scales of a type contain a set of pitches. Names the collection of a run or passage once the notes are chosen. | BSD-3 | yes | any music21 stream | none published (deterministic set matching) | v10.5.0 2026-06-17 | Does not choose which notes form "the run". A pitch set fits several scales (a C major run fits A natural minor and D Dorian), so the tonic still comes from the key (section 1). |
| Tonal (`@tonaljs/scale`, `Scale.detect`), github.com/tonaljs/tonal | Detects scale names from a pitch-class set (JavaScript; the app's side). | MIT (package.json) | yes | note names | none published | last push 2026-09-29 | Same ambiguity as above. JavaScript, not the Python build. |
| MusPy metrics `pitch_in_scale_rate`, `scale_consistency` (hermandong.com/muspy) | Share of notes in a given scale, and the best-fitting major/minor scale. | MIT | yes | MusicXML, MIDI, ABC (via music21) | none (descriptive metric) | v0.5.0 2022-04-16, last push 2026-03-11 | Major and minor only. No modes, no minor forms. |

No trained model or annotated dataset for naming the scale or minor form of a passage was found. Searched: "scale identification symbolic", "mode estimation symbolic music", plus the music21, partitura, MusPy and Tonal documentation.

| id | status | what serves it |
| --- | --- | --- |
| `scale.collection` | candidate | music21 `deriveRanked` (set matching, given the key); Tonal `Scale.detect` |
| `key.minor-form` | nothing found (building blocks: music21 HarmonicMinorScale and MelodicMinorScale membership tests; the local key from section 1) | nothing names the form of minor in use |

**Recommendation.** Use music21 `deriveRanked` with the local key from section 1 as the tie-breaker. The minor form stays a project rule over those reads. When in Rome's analyses mark mode, not the minor form, so no annotated test set was found.

## 3. Hand assignment

Characteristics: `prereq.hand-assignment`

| candidate | what it does here | licence | offline | input | published accuracy (source) | maintenance | leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| piano_svsep, "Cluster and Separate" (Foscarin, Karystinaios, Nakamura, Widmer, ISMIR 2024), github.com/CPJKU/piano_svsep | A GNN that assigns every note to a staff (hand) and a voice, cross-staff voices included. | MIT | yes, `pretrained_models/model.ckpt` is in the repo (trained on DCML) | MusicXML in, MEI out | Staff accuracy 91.0, voice F1 89.9 on the DCML Romantic corpus; staff 96.3, voice F1 96.6 on J-Pop (baseline 80.7 and 89.9 staff) (arXiv 2407.21030, Table 1, read in the HTML) | last push 2026-03-09, no release | Predicts the staff an engraver would write, not the hand that plays it: the two differ where a score writes m.s./m.d. or crosses staves. The public model is trained on the classical DCML data only (the J-Pop set is private). |
| Penner and Hindle (arXiv 2609.28787, September 2026), "Statistical Models for Automatic Fingering-Annotated Piano Sheet Music Transcription" | Jointly assigns hand and finger to notes. | CC BY 4.0 (models and scripts on Zenodo, per the paper) | yes (statistical models) | MIDI / PIG text | Hand separation 90.8% on PIG; joint hand+finger 56.6% (paper HTML) | new (2026); Zenodo record not opened | A preprint, not peer-reviewed as read. Zenodo files and their format were not checked. |
| partitura `estimate_voices` (VoSA, Chew and Wu 2004) | Voice streams, not hands. A fallback building block only. | Apache-2.0 | yes, installed | partitura score | none for hands; Simonetta et al. 2019 report that VoSA "tends to create too many voices" | v1.9.0 | Not a hand assigner. |

Annotated data to test against: PIG (150 pieces, 309 fingerings with hand labels; "only nonprofit, academic use is allowed", registration needed; beam.kisarazu.ac.jp/research/PianoFingeringDataset/); the DCML piano corpora (staff = written hand; CC BY-NC-SA 4.0).

| id | status | what serves it |
| --- | --- | --- |
| `prereq.hand-assignment` | candidate | piano_svsep (staff), Penner and Hindle (hand) |

**Recommendation.** Test piano_svsep first on the chunk-1 cases (Asturias cross-staff bars, Grieg op. 47 no. 2 m.s./m.d. bars, Amazing Grace, Abide with Me). Score it against PIG hand labels where pieces overlap. Read the written staff and the predicted staff side by side. Where they disagree, the item goes to the agent.

## 4. Hand position, shifts and fingering

Characteristics: `technique.five-finger`, `technique.position-shift`, `technique.thumb-under`, `technique.fingering-demand`

| candidate | what it does here | licence | offline | input | published accuracy (source) | maintenance | leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| pianoplayer (Marco Musy), github.com/marcomusy/pianoplayer | Searches feasible fingerings minimising a hand-effort cost, with an adjustable hand size. It writes fingering into the MusicXML. Hand positions and shifts (thumb-unders, crossings, position changes) can be read off the fingering. | MIT | yes | MusicXML, .mxl, MuseScore, MIDI, PIG text | none published: the README gives no comparison with human fingering (README read) | release 3.0.1 2026-03-01, last push 2026-06-21 | No published accuracy at all. Its cost model is the author's own. Hand assignment is taken from the staves. |
| Nakamura, Saito, Yoshii (2020), "Statistical learning and estimation of piano fingering", Information Sciences 517; HMMs trained on PIG | First- to third-order HMMs and a chord HMM, trained on human fingerings. | paper: arXiv 1904.10237; code: not confirmed (a demo page statpianofingering.github.io is cited) | yes if code obtained | PIG text (onset, offset, pitch) | General match rate on 30 test pieces: 3rd-order HMM 64.5, 2nd 64.3, 1st 61.7, chord HMM 61.2, LSTM 61.3; human annotators against each other 71.4 (Table 2, read in the PDF) | 2020 | Code availability not confirmed. Even humans agree with each other on only 71% of notes, so any "five-finger position" read from one fingering inherits that spread. |
| Penner and Hindle 2026 (as in section 3) | Joint hand and finger. | CC BY 4.0 | yes | MIDI / PIG | joint hand+finger 56.6% on PIG | 2026 | As in section 3. |

Data:
- PIG (above; nonprofit academic use only).
- ThumbSet (Ramoneda et al., ACM MM 2022; zenodo.org/records/6433702; partial fingerings in PIG format; licence not checked).
- The CIPI paper's ArGNN fingering model, used as a difficulty feature (arXiv 2306.08480): its match rate is not reported there, and no code was found for it as a fingering tool.

| id | status | what serves it |
| --- | --- | --- |
| `technique.five-finger` | candidate | positions read off a fingering from pianoplayer or an HMM trained on PIG |
| `technique.position-shift` | candidate | the same, as a change of position between consecutive fingered notes |
| `technique.thumb-under` | candidate | the same: thumb after a higher-numbered finger in a run |
| `technique.fingering-demand` | candidate | pianoplayer's cost; the CIPI fingering dimension (section 13) |

**Recommendation.** Test pianoplayer first: it reads MusicXML directly and is maintained. Score its output against PIG's human fingerings by Nakamura's match rate (the human ceiling is 71.4). Then derive positions from its fingering on the chunk-1 `position_shift` drills, which were all typed "crossing". A five-finger frame is then the span of one fingering position, not a hand-written frame rule.

## 5. Melody location

Characteristics: `texture.melody-location`

| candidate | what it does here | licence | offline | input | published accuracy (source) | maintenance | leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Symbolic-Melody-Identification (Simonetta, Cancino-Chacón, Ntalampiras, Widmer, ISMIR 2019), github.com/LIMUNIMI/Symbolic-Melody-Identification | A CNN over the piano roll that gives each note's probability of being melody, so the melody can move between hands and voices. | MIT | yes (trained on its Mozart and Pop sets) | symbolic score / piano roll | The paper gives violin plots only, no table. MidiBERT's paper reports this CNN at accuracy 92.08, F1 89.13 on POP909 melody versus non-melody (arXiv 2107.05223, Table 3, read). An "F1 0.890 on Mozart" figure seen in a search summary is **not confirmed**. | last push 2019-10-21 | Old code (2019). The paper says it "could not sufficiently distinguish between melody and accompaniment lines when they shared a similar texture". |
| MidiBERT-Piano (Chou et al., 2021/2024), github.com/wazenmai/MIDI-BERT | A pre-trained transformer fine-tuned for note-level melody / bridge / accompaniment. | MIT | weights download once (Google Drive) | MIDI (CP tokens) | POP909 three-class melody accuracy 96.15 (CP, score); two-class melody versus non-melody accuracy 99.06, F1 98.70 (Tables 2 and 3, read in the PDF) | last push 2024-04-10 | Pop-trained. The README warns it does worse on classical music. Score MusicXML must be exported to MIDI. |
| Skyline (highest note) | The baseline: the top note at each onset. | n/a | yes | any | POP909 accuracy 79.52, F1 66.76 (MidiBERT Table 3) | n/a | Fails when the melody is not the top voice (Simonetta et al.). |

Data to test against:
- POP909 (github.com/music-x-lab/POP909-Dataset, MIT; melody, bridge and piano tracks for 909 pop songs);
- Simonetta et al.'s Mozart melody annotations (38 movements; released with the repo);
- BPS-motif (section 7) for classical piano.

| id | status | what serves it |
| --- | --- | --- |
| `texture.melody-location` | candidate | Simonetta CNN (classical-trained), MidiBERT (pop-trained), skyline as the floor |

**Recommendation.** Test both trained models against the skyline on the chunk-1 failures (BWV 936, O Sacred Head, Mariage d'amour), split by genre: MidiBERT on the pop items, Simonetta on the classical ones. Score them against POP909 and the Mozart annotations.

## 6. Score format: lead sheet, piano score, other instrument

Characteristics: `item.format`

**Nothing found.** No tool, model or dataset classifies a score's layout as lead sheet, chord chart, piano score or song score.
- Searched: "lead sheet versus piano arrangement classification", "detect lead sheet MusicXML", and symbolic classification surveys (ISMIR 2023 "Symbolic music representations for classification tasks" covers composer, performer and difficulty, not layout).
- Nearest building blocks:
  - music21 `harmony.ChordSymbol` and `instrument.Instrument` reads (installed);
  - Midi Miner (github.com/ruiguo-bio/midi-miner, GPL-3.0, last push 2024-06-18), which classifies multitrack MIDI tracks as melody, bass or drum. Its accuracy was **not confirmed** (not read), and it does not see MusicXML layout.

| id | status | what serves it |
| --- | --- | --- |
| `item.format` | nothing found (building blocks: music21 chord-symbol, staff and instrument reads) | a project rule, with the agent deciding the unclear cases |

**Recommendation.** Keep this one project-specific, as lessons item 10 allows when nothing serves. The chunk-1 threshold failures (Blue Bossa, Tishomingo Blues) stay its validation set.

## 7. Spelling and notation errors

Characteristics: `integrity.notation-sanity`

| candidate | what it does here | licence | offline | input | published accuracy (source) | maintenance | leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PKSpell (Foscarin, Audebert, Fournier-S'niehotta, ISMIR 2021), github.com/fosfrancesco/pkspell | Predicts the spelling of each note and the key signature from pitch classes and durations. A note whose written spelling differs from the prediction is a misspelling candidate. | MIT | yes, the trained model is in the repo | pitch-class and duration lists (from any score) | Pitch-spelling error 0.13% (256 errors) on Meredith's MuseData set, against CIV 0.18% and ps13 0.59% (1,064). Key signature 97% correct on 932 Albrecht pieces (paper Table 1 and section 3.2, read in the PDF) | last push 2022-07-26 | Trained on classical (ASAP). Jazz and lead-sheet spelling are not tested there. It flags differences; it does not say which spelling is wrong. |
| partitura `estimate_spelling` (ps13s1, Meredith 2006) | The same comparison with the classic algorithm. | Apache-2.0 | yes, installed | partitura note array | 0.59% error on MuseData, as cited in PKSpell's Table 1 (from Meredith's paper) | v1.9.0 | Higher error. Same limits. |
| Géré, Audebert, Jacquemard, "Detecting notational errors in digital music scores" (TENOR 2025, arXiv 2510.02746) | A rule-based state machine. Step 1 checks rhythm/time consistency (written durations against the MusicXML); step 2 checks for notation that breaks common conventions. | arXiv paper; code **not confirmed** (not linked on the abstract page) | n/a | MusicXML | Applied to ASAP: about 40% of scores had at least one notational error (abstract). No precision or recall read. | 2025 | Code availability not confirmed. Its rules are published conventions, the nearest thing to a reference for this row. |

Also seen, not read: Bouquillard and Jacquemard, "Pitch Spelling Jazz Lead Sheets, Solo Transcriptions, Classical Piano and Monophonic Scores" (arXiv 2606.20198, 2026). It spells jazz lead sheets, which PKSpell does not cover; no figures or code were read.

| id | status | what serves it |
| --- | --- | --- |
| `integrity.notation-sanity` | candidate | PKSpell / ps13 for spelling; Géré et al. for rhythm consistency (code not confirmed) |

**Recommendation.** Run PKSpell and ps13 together on the chunk-1 spelling cases (the blues B♭/E♭5 items, Minecraft Nether). A note flagged by both is the strongest misspelling candidate. Ask the TENOR 2025 authors for code (the owner decides whether to ask) before writing rhythm-consistency checks.

## 8. Tuplets and cadenza bars

Characteristics: `rhythm.triplets`, `rhythm.tuplets-other`, `rhythm.cadenza`

**Nothing found** that detects tuplet groups or cadenza bars beyond reading the notation.
- Searched: the music21 `duration.Tuplet` and partitura reads (installed), "cadenza detection symbolic", and "unmeasured bar detection".
- The nearest tool is Géré et al.'s rhythm/time-consistency check (section 7). It would flag over-full bars and unclosed or inconsistent tuplet brackets, the PDMX defect lessons item 6 names, but its code is not confirmed.

| id | status | what serves it |
| --- | --- | --- |
| `rhythm.triplets` | nothing found (building blocks: music21 `duration.Tuplet`, raw `<time-modification>`) | project rule |
| `rhythm.tuplets-other` | nothing found (building blocks: the same) | project rule |
| `rhythm.cadenza` | nothing found (building blocks: bar duration against the time signature, cue and grace reads) | project rule; Géré et al. if its code is obtained |

**Recommendation.** These stay notation reads. Their faults in chunk 1 were encoding defects, which section 7's consistency check is meant for.

## 9. Melodic intervals, contour and range

Characteristics: `interval.melodic`, `quality.contour`, `quality.leap-recovery`, `melody.tessitura`, `melody.degree-profile`

| candidate | what it does here | licence | offline | input | published accuracy (source) | maintenance | leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| music21: `Stream.melodicIntervals`, `interval.Interval`, `analysis.discrete.Ambitus`, `MelodicIntervalDiversity`, `analysis.patel.melodicIntervalVariability`, the native and jSymbolic feature extractors, `key.Key.getScaleDegreeAndAccidentalFromPitch` | Deterministic measures of intervals, contour, range and degree. | BSD-3 | yes, installed | any | n/a (deterministic) | v10.5.0 | All of these need the melody line first (section 5). |
| jSymbolic 2.2 (McKay et al.), jmir.sourceforge.net | 246 features, melodic interval and contour among them (music21 re-implements 72). | GNU GPL | yes (Java) | MIDI, MEI | n/a | 2.2 (2018) | Duplicates music21 for these rows. |
| IDyOM (Pearce), github.com/mtpearce/idyom | Information content and expectancy of each melody note (a learned model of melodic expectation). | GPL-3.0 | yes (Common Lisp) | kern, MIDI | none read for these rows | release v1.8 2026-09-28 | Does not name contour types. A Lisp toolchain. |

| id | status | what serves it |
| --- | --- | --- |
| `interval.melodic` | candidate | music21 `melodicIntervals` |
| `quality.contour` | candidate | music21 jSymbolic contour features (direction of motion, melodic arcs) |
| `quality.leap-recovery` | nothing found (building blocks: music21 intervals) | a project count over the interval string |
| `melody.tessitura` | candidate | music21 `Ambitus` on the melody line |
| `melody.degree-profile` | candidate | music21 scale-degree reads given the key (section 1) |

**Recommendation.** No new tool is needed. These rows inherit their faults from melody location (section 5) and key (section 1). Test those first.

## 10. Chords, Roman numerals, progressions and non-chord tones

Characteristics: `melody.chord-relation`, `harmony.chord-quality`, `harmony.inversion`, `harmony.roman`, `harmony.progression`, `harmony.applied`, `harmony.chromatic-share`, `harmony.rhythm`, `harmony.chord-vocabulary`, `harmony.implied`, `harmony.planing`, `harmony.dissonance-share`, `harmony.chord-scale`, `harmony.voicing`, `harmony.chord-connection`, `harmony.bass-behaviour`, `texture.bass-walk-up`, `texture.pedal-point`

| candidate | what it does here | licence | offline | input | published accuracy (source) | maintenance | leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AugmentedNet (section 1) | Per time step: local key, degree, quality, inversion, root, Roman numeral, including applied chords (tonicisation). Works where no chords are written. | MIT | yes | MusicXML | Quality 77.6%, Inversion 77.2%, Root 83.2%, Degree 66.0%, full RN 45.0% (README) | 2024 / v1.9.1 2022 | Classical-trained. A full numeral is right less than half the time. |
| AnalysisGNN (Karystinaios, Hentschel, Neuwirth, Widmer, CMMR 2025), github.com/manoskary/analysisgnn | One GNN for cadence, phrase, section, local and global key, chord quality, inversion, root, bass, Roman numeral, non-chord tones, pedal and metrical strength, note by note. | MIT | weights download once from W&B (then `--checkpoint_path`) | anything partitura reads (MusicXML stated) | RN (CSR) 0.530 on the AugmentedNet test set (against ChordGNN+Post 0.518, RNBert 0.574) and 0.516 on the Distant Listening Corpus; pedal F1 0.771; cadence and phrase in sections 11 and 13 (arXiv 2509.06654, Table 2, read in the HTML) | last push 2026-04-30 | Trained on the DCML Distant Listening Corpus (CC BY-NC-SA), AugmentedNet data and cadence sets: classical. No published figure for key or quality alone was read. |
| music21 `roman.romanNumeralFromChord`, `chordify`, `ChordSymbol`, `analysis.reduceChords.ChordReducer`, `chord.Chord.isConsonant` / `.commonName` / `.inversion()` | Deterministic numeral, quality and inversion for a given chord and key. Chord reduction of a texture. | BSD-3 | yes, installed | any | n/a | v10.5.0 | Chooses neither the key nor which notes form the chord (non-chord tones). That is the part the trained models learn. |

Also found:
- ChordGNN (ISMIR 2023, github.com/manoskary/ChordGNN, MIT): archived, superseded by AnalysisGNN.
- Functional Harmony / BPS-FH (Chen and Su, github.com/Tsung-Ping/functional-harmony, GPL-3.0, last push 2023-02-21): dataset and models for 32 Beethoven sonata first movements; model figures not read.

Data to test against:
- When in Rome (CC BY-SA 4.0);
- DCML Mozart piano sonatas, ABC, Distant Listening Corpus (CC BY-NC-SA 4.0);
- TAVERN (github.com/jcdevaney/TAVERN, CC BY-SA 4.0; Mozart and Beethoven themes and variations with numerals);
- BPS-FH.
- For pop and jazz progressions:
  - Chordonomicon (666,000 chord progressions with section and genre labels; github.com/spyroskantarelis/chordonomicon shows Apache-2.0 while a search summary reports CC BY-NC 4.0 on Hugging Face: **licence not settled**);
  - the Jazz Harmony Treebank (github.com/DCMLab/JazzHarmonyTreebank, 150 iRealPro standards with tree analyses; licence **not confirmed**, GitHub reports none).

Non-chord tones:
- AnalysisGNN has a non-chord-tone module that excludes passing and other non-functional notes from its other tasks. No figure was read for it alone.
- Ju, Condit-Schultz, Arthur and Fujinaga, "Non-chord tone identification using deep neural networks" (DLfM 2017) report F1 72.19% on 140 Bach chorales (search summary, **not confirmed**; no code found).

| id | status | what serves it |
| --- | --- | --- |
| `melody.chord-relation` | candidate | AnalysisGNN non-chord-tone output (chord tone or not; the kinds, passing, neighbour, suspension and so on, are not separate outputs as read); music21 chord membership given the chord |
| `harmony.chord-quality` | candidate | AugmentedNet quality; music21 `ChordSymbol` / `commonName` for printed symbols |
| `harmony.inversion` | candidate | AugmentedNet inversion; music21 `inversion()` |
| `harmony.roman` | candidate | AugmentedNet, AnalysisGNN; music21 `romanNumeralFromChord` given a key |
| `harmony.progression` | candidate | a lookup over the numeral sequence from the models above; Chordonomicon and Jazz Harmony Treebank as reference progressions |
| `harmony.applied` | candidate | AugmentedNet / AnalysisGNN numerals with tonicisation |
| `harmony.chromatic-share` | candidate | derived from the numerals above |
| `harmony.rhythm` | candidate | chord change points from AugmentedNet / AnalysisGNN, or printed symbols |
| `harmony.chord-vocabulary` | candidate | distinct numerals from the models above |
| `harmony.implied` | candidate | AugmentedNet and AnalysisGNN infer chords from notes with no symbols written (classical-trained; nothing found for monophonic tunes) |
| `harmony.planing` | nothing found (building blocks: chord timeline, music21 chord intervals) | project rule |
| `harmony.dissonance-share` | candidate | music21 `isConsonant` over chordified verticals |
| `harmony.chord-scale` | nothing found (building blocks: chord symbols, music21 scale membership) | project rule |
| `harmony.voicing` | nothing found (building blocks: music21 chord spacing reads) | project rule |
| `harmony.chord-connection` | nothing found (building blocks: partitura note arrays) | project count |
| `harmony.bass-behaviour` | candidate | AnalysisGNN bass-note output; music21 `chord.bass()` against the root |
| `texture.bass-walk-up` | nothing found (building blocks: bass line and chord roots) | project rule |
| `texture.pedal-point` | candidate | AnalysisGNN pedal (F1 0.771 on the Distant Listening Corpus); Algomus fugue pedal annotations as test data |

**Recommendation.** Test AugmentedNet (no download) and AnalysisGNN side by side on the DCML Mozart sonatas and When in Rome. Then try them on the catalogue's generated progression drills, which declare their numerals in their specs: a free check on the drills, though out of the models' training domain. Keep music21 for printed chord symbols. Whether the models hold on pop and jazz items is open; no trained model for those was found that reads scores.

## 11. Cadence

Characteristics: `harmony.cadence`

| candidate | what it does here | licence | offline | input | published accuracy (source) | maintenance | leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AnalysisGNN (section 10) | Note-level cadence type. | MIT | weights download once | MusicXML via partitura | Cadence macro F1 0.558 on the Distant Listening Corpus; 0.497 on the combined cadence sets (GraphMuse 0.516) (arXiv 2509.06654, Table 2) | 2026 | About half right by macro F1. Classical only. |
| cadet, "Cadence Detection in Symbolic Classical Music using GNNs" (Karystinaios and Widmer, ISMIR 2022), github.com/manoskary/cadet | Graph classifier for PAC, IAC and HC. | MIT | yes | MusicXML / kern via partitura | Three-class macro F1, note / beat: Bach fugues (PAC and rIAC) 0.602–0.653 / 0.667–0.702; Haydn string quartets (PAC and HC) 0.542–0.648 / 0.610–0.663; Mozart string quartets 0.584–0.588 / 0.569–0.606 (arXiv 2208.14819, Table 3, read in the PDF; column layout garbled in extraction, values agree with a search summary) | archived; last push 2024-11-06 | Archived. Half cadences are the weakest class. Classical only. |
| GraphMuse (github.com/manoskary/graphmuse) | The library under both, with a cadence model. | MIT | yes | MusicXML, MEI, kern, MIDI (paper) | cadence 0.516 (as reported in AnalysisGNN Table 2) | v0.0.6 2025-09-30 | A library more than a tool. |

Data: DCML Mozart piano sonatas (harmony, cadence and phrase annotations, CC BY-NC-SA 4.0); Algomus Bach WTC I fugue cadences (algomus.fr/fugues; licence not stated on that page); Haydn quartet expositions.

| id | status | what serves it |
| --- | --- | --- |
| `harmony.cadence` | candidate | AnalysisGNN, cadet |

**Recommendation.** Test AnalysisGNN on the DCML Mozart piano sonata cadences, then on the chunk-1 half-cadence-called-modulation case. At the published F1 its output is a witness for the agent, not a verdict.

## 12. Voice-leading

Characteristics: `harmony.voice-leading`

| candidate | what it does here | licence | offline | input | published accuracy (source) | maintenance | leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| music21 `voiceLeading.VoiceLeadingQuartet` (parallel fifths and octaves, hidden intervals, motion type), `iterateAllVoiceLeadingQuartets`, `figuredBass.checker` | Deterministic checks between pairs of voices. | BSD-3 | yes, installed | any | n/a | v10.5.0 | Needs separated voices first (section 14). |
| conseq (github.com/bitflipp/conseq) | Finds consecutive perfect intervals in MusicXML and colours the notes. | MIT | yes | MusicXML | none published | last push 2026-10-08; Python | Parallels only. Very new (single author). |

| id | status | what serves it |
| --- | --- | --- |
| `harmony.voice-leading` | candidate | music21 `VoiceLeadingQuartet` over voices from section 14 |

**Recommendation.** Use music21 over voices from piano_svsep or vocsep (section 14). No test set of marked voice-leading errors was found. Searched: "part-writing error dataset", "voice leading error detection".

## 13. Motifs, sequences, imitation and fugue

Characteristics: `melody.motif-repetition`, `melody.sequence`, `texture.imitation`, `texture.ostinato`, `form.fugue`

| candidate | what it does here | licence | offline | input | published accuracy (source) | maintenance | leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Wang, Kuo, Su, "Improving motif discovery of symbolic polyphonic music with motif note identification" (TISMIR 2025), github.com/york135/TISMIR2025_motif_discovery | Identifies motif notes (MidiBERT), then runs repeated-pattern discovery (SIATEC, CSA) on them. | article CC BY 4.0; code licence **not confirmed** (GitHub reports no licence file) | yes (weights not checked) | onset and MIDI-pitch pairs | On BPS-motif (32 Beethoven sonata movements, 263 motifs): CSA establishment F1 0.676, occurrence F1 0.372, three-layer F1 0.276; SIATEC 0.366 / 0.309 / 0.130 (article page) | last push 2025-08-12 | Low occurrence F1. Beethoven-trained. |
| music21 `search` (`approximateNoteSearch`, `rhythmicSearch`, `search.segment.scoreSimilarity`) | Exact and approximate matching of a known figure. | BSD-3 | yes, installed | any | n/a | v10.5.0 | Finds a figure you give it; does not discover one. |
| Algomus fugue analysis (Giraud, Groult, Leguy, Levé, Computer Music Journal 39(2), 2015) and "Detecting episodes with harmonic sequences" (ISMIR 2012) | Subject and countersubject detection; sequences in episodes. | data at algomus.fr/data (licence not stated on the fugue page); code not found | n/a | voice-separated kern | 66% of subjects found with a musically relevant end, 85% of occurrences retrieved, "almost no false positive", on WTC I (search summary; **not confirmed** on the paper) | 2015 | No released code found. Needs separated voices. |

Data:
- BPS-motif (with the TISMIR 2025 code);
- JKU Patterns Development Database (MIREX pattern-discovery task; 5 pieces; not opened);
- Algomus fugue reference analyses: subjects, countersubjects, cadences and pedals for WTC I and Shostakovich op. 87 nos. 1–12.

| id | status | what serves it |
| --- | --- | --- |
| `melody.motif-repetition` | candidate | Wang et al. 2025 discovery; music21 `search` for matching |
| `melody.sequence` | nothing found (building blocks: music21 interval and rhythm strings; Giraud et al. 2012 describes a method but no code was found) | project rule |
| `texture.imitation` | nothing found (building blocks: voices from section 14 plus music21 `search`) | project rule |
| `texture.ostinato` | candidate | music21 `search` for exact repetition of a figure |
| `form.fugue` | nothing found as code (Algomus method published, no code found; Algomus annotations as test data) | agent, with the Algomus annotations as reference |

**Recommendation.** Lowest priority. These are agent-weighted rows, and the best published occurrence F1 is 0.37. If one is tested, use music21 `search` for ostinato and motif recurrence on the generated drills, whose figures are declared.

## 14. Texture type, voices and part roles

Characteristics: `texture.type`, `texture.voice-count`, `texture.counterpoint`, `texture.hands-together`, `texture.block-chords`, `interval.harmonic`, `texture.double-notes`, `texture.octaves`, `texture.power-chord`, `texture.melody-in-chords`, `texture.sustained`, `texture.repeated-chords`, `texture.register-trajectory`, `texture.build`, `texture.call-response`, `texture.part-roles`, `texture.piano-role`

| candidate | what it does here | licence | offline | input | published accuracy (source) | maintenance | leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Symbolic texture dataset and descriptors (Couturier, Bigo, Levé, ISMIR 2022), gitlab.com/algomus.fr/symbolic-texture-dataset | Bar-by-bar texture labels for 9 Mozart sonata movements (1,164 labels): melodic, harmonic or static layers; homorhythm, parallel, octave motion; sustained, repeated or oscillating notes; scale motives. Released low-level texture descriptors and logistic-regression predictors. | GPL-3.0 (GitLab API) | yes | the dataset's score files and TSV labels | Per-element F1 (logistic regression, 9-fold): M 0.912, H 0.744, S 0.616, homorhythm 0.673, parallel 0.572, octave 0.538, sustained 0.669, repeated 0.501, scale motives 0.363, oscillation 0.098. The "always true" model scores M 0.973 and H 0.799, higher than the predictor (paper Table 2, read in the PDF) | last activity 2024-01-24 | 9 movements only. The predictors do not beat "always true" on the common elements. A labelling syntax and test set more than a tool. |
| vocsep (Karystinaios, Foscarin, Widmer, IJCAI 2023), github.com/manoskary/vocsep_ijcai2023 | GNN voice separation (link prediction). Voice count and counterpoint are read from its voices. | MIT | yes ("code, data and pretrained models" in the repo, per search summary) | partitura scores | F1: Inventions 0.997, Sinfonias 0.985, WTC I 0.976, WTC II 0.972, Haydn quartets 0.872; McLeod and Steedman 0.992 / 0.982 / 0.964 / 0.964 / 0.781 (arXiv 2304.14848, Table 1, read in the PDF) | archived; last push 2023-10-18 | Archived. Contrapuntal music only; homophonic piano texture is piano_svsep's case. |
| piano_svsep (section 3) | Voices with chords (homophonic voices) and staves. | MIT | yes | MusicXML | voice F1 89.9 (DCML Romantic), 96.6 (J-Pop) | 2026 | As in section 3. |

Also:
- music21 `chordify`, `Stream.getElementsByOffset`, `interval.Interval` and partitura note arrays (installed): the deterministic building blocks for chord size, harmonic intervals, octaves, hands-together onsets.
- Midi Miner (GPL-3.0) for part roles (melody, bass, drum) in multitrack MIDI: accuracy **not confirmed**.

| id | status | what serves it |
| --- | --- | --- |
| `texture.type` | candidate | the Couturier labels and descriptors (melodic / harmonic / static layers, homorhythm) |
| `texture.voice-count` | candidate | piano_svsep, vocsep, partitura `estimate_voices` |
| `texture.counterpoint` | candidate | vocsep (independent lines) |
| `texture.hands-together` | candidate | partitura note array onsets per staff (deterministic) |
| `texture.block-chords` | candidate | music21 `chordify` / onsets per staff (deterministic) |
| `interval.harmonic` | candidate | music21 `interval.Interval` on simultaneous notes per hand |
| `texture.double-notes` | nothing found (building blocks: harmonic intervals per hand) | project rule |
| `texture.octaves` | candidate | the Couturier "octave motion" element (F1 0.538); music21 intervals |
| `texture.power-chord` | nothing found (building blocks: chord content per onset) | project rule |
| `texture.melody-in-chords` | nothing found (building blocks: melody location, section 5, plus block chords) | project rule |
| `texture.sustained` | candidate | the Couturier "sustained notes" element (F1 0.669); chord durations |
| `texture.repeated-chords` | candidate | the Couturier "repeated notes" element (F1 0.501) |
| `texture.register-trajectory` | nothing found (building blocks: per-bar range) | project count |
| `texture.build` | nothing found (building blocks: dynamics and onset density) | project rule |
| `texture.call-response` | nothing found (building blocks: phrases, section 15) | agent |
| `texture.part-roles` | candidate | Midi Miner track roles (accuracy not confirmed); MidiBERT melody / bridge / accompaniment |
| `texture.piano-role` | nothing found (building blocks: `item.format`, part roles) | agent |

**Recommendation.** Use piano_svsep's voices as the shared input for voice count, counterpoint and voice-leading (one model, three rows). The deterministic rows stay music21 or partitura reads. Use the Couturier dataset as the test set for texture type, not its predictors.

## 15. Accompaniment patterns and dance or Latin figures

Characteristics: `texture.broken-chord`, `texture.alberti`, `texture.arpeggio`, `texture.waltz-bass`, `texture.oom-pah`, `texture.stride`, `texture.boogie-bass`, `texture.walking-bass`, `texture.left-hand-pattern`, `texture.offbeat-chords`, `texture.charleston`, `texture.montuno`, `texture.tumbao`, `texture.clave`, `texture.bossa`, `texture.tango`, `texture.mazurka`, `texture.stop-time`, `texture.tremolo-thirds`, `texture.crushed-note`, `texture.half-time`, `texture.latin-pattern`, `mark.extended-technique`, `technique.written-ornament`

**Nothing found** for any of these.
- No library, trained model or annotated dataset names accompaniment figures (Alberti, waltz bass, stride, boogie, walking bass) or Latin cells in scores.
- Searched: "accompaniment pattern recognition symbolic", "Alberti bass detection", "texture classification dataset", "clave / montuno detection symbolic", "written-out ornament detection".
- The nearest are the Couturier texture labels (section 14), which mark oscillations (F1 0.098) and scale motives but not named figures; and the jSymbolic rhythm features, which describe onsets without naming a pattern.
- POP909 has piano accompaniment tracks without pattern labels.

| id | status | what serves it |
| --- | --- | --- |
| `texture.broken-chord` | nothing found (building blocks: chords per hand from music21 `chordify`) | project rule |
| `texture.alberti` | nothing found (building blocks: the same) | project rule |
| `texture.arpeggio` | nothing found (building blocks: the same) | project rule |
| `texture.waltz-bass` | nothing found (building blocks: onsets per beat per staff) | project rule |
| `texture.oom-pah` | nothing found (building blocks: the same) | project rule |
| `texture.stride` | nothing found (building blocks: the same, plus leap size) | project rule |
| `texture.boogie-bass` | nothing found (building blocks: music21 `search` for a transposed figure) | project rule |
| `texture.walking-bass` | nothing found (building blocks: bass intervals and durations) | project rule |
| `texture.left-hand-pattern` | nothing found (building blocks: onsets per bar per staff) | project rule |
| `texture.offbeat-chords` | nothing found (building blocks: onsets per beat) | project rule |
| `texture.charleston` | nothing found (building blocks: onsets per beat) | project rule |
| `texture.montuno` | nothing found (building blocks: onsets against a clave grid) | project rule |
| `texture.tumbao` | nothing found (building blocks: the same) | project rule |
| `texture.clave` | nothing found (building blocks: the same) | project rule |
| `texture.bossa` | nothing found (building blocks: the same) | project rule |
| `texture.tango` | nothing found (building blocks: the same) | project rule, agent names the style (lessons item 3) |
| `texture.mazurka` | nothing found (building blocks: onsets and accents in 3/4) | project rule, agent names the style |
| `texture.stop-time` | nothing found (building blocks: onsets and accents) | project rule |
| `texture.tremolo-thirds` | nothing found (building blocks: music21 `Tremolo` reads, alternating intervals) | project rule |
| `texture.crushed-note` | nothing found (building blocks: grace-note reads) | project rule |
| `texture.half-time` | nothing found (building blocks: accent and bass positions) | project rule, agent |
| `texture.latin-pattern` | nothing found (building blocks: onset grids) | project rule, agent |
| `mark.extended-technique` | nothing found (building blocks: music21 notehead and chord-span reads) | project rule, agent |
| `technique.written-ornament` | nothing found (building blocks: interval and duration strings) | project rule |

**Recommendation.** These are the project-specific rules lessons item 10 allows. Each rule records that this search found nothing. The project's generated drills, which declare their pattern, are the positives, with lessons items 2 and 3 for the counterexamples.

## 16. Coordination between the hands

Characteristics: `coordination.synchrony-share`, `coordination.rhythmic-independence`, `coordination.unequal-rates`, `coordination.articulation-conflict`, `coordination.dynamic-balance`, `coordination.register-overlap`, `coordination.pedal-with-hands`, `coordination.sustain-vs-move`, `coordination.hand-interval`, `texture.motion`, `texture.alternating-hands`, `technique.hand-crossing`

**Nothing found** that measures coordination between the hands as a packaged tool.
- Searched: "hand independence computational measure", "two hands coordination piano score difficulty".
- Score Analyzer (Sébastien et al., ISMIR 2012) defines a hand-synchronisation criterion in its difficulty marks, but no code was found.
- Nakamura's fingering work notes the HMMs ignore "interdependence of the two hands".
- These rows are deterministic counts over the hand assignment (section 3).

| id | status | what serves it |
| --- | --- | --- |
| `coordination.synchrony-share` | nothing found (building blocks: partitura onsets per staff) | project count |
| `coordination.rhythmic-independence` | nothing found (building blocks: rhythm strings per hand) | project count |
| `coordination.unequal-rates` | nothing found (building blocks: notes per bar per hand) | project count |
| `coordination.articulation-conflict` | nothing found (building blocks: music21 articulation and slur reads per staff) | project count |
| `coordination.dynamic-balance` | nothing found (building blocks: per-staff dynamics, melody location) | project rule, agent |
| `coordination.register-overlap` | nothing found (building blocks: per-bar range per hand) | project count |
| `coordination.pedal-with-hands` | nothing found (building blocks: pedal reads against chord changes, section 10) | project count |
| `coordination.sustain-vs-move` | nothing found (building blocks: durations across staves) | project count |
| `coordination.hand-interval` | nothing found (building blocks: shared onsets across staves) | project count |
| `texture.motion` | candidate | music21 `VoiceLeadingQuartet.motionType` on the outer lines |
| `texture.alternating-hands` | nothing found (building blocks: onsets per staff) | project count |
| `technique.hand-crossing` | candidate | piano_svsep or Penner and Hindle hand labels against pitch order; pianoplayer fingering |

**Recommendation.** Nothing to test here first. Every row rests on the hand assignment, so section 3's test comes first.

## 17. Technique runs, spans and leaps

Characteristics: `technique.scale-run`, `technique.arpeggio-run`, `technique.arpeggio-chord`, `technique.finger-independence`, `technique.span`, `technique.leap-size`, `technique.displacement-rate`, `technique.pedal-implied`

| candidate | what it does here | licence | offline | input | published accuracy (source) | maintenance | leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RubricNet descriptors (Ramoneda, Eremenko, D'Hooge, Parada-Cabaleiro, Serra, ISMIR 2024), github.com/PRamoneda/rubricnet | Six descriptors: pitch entropy, pitch range, average pitch, displacement rate (Chiu and Chen 2012), average inter-onset interval, and Pitch Set LZ. | code MIT (GitHub API); the arXiv paper page shows CC BY 4.0, which may be the paper's own licence | yes | symbolic scores (CIPI MusicXML) | as difficulty predictors only (section 18) | last push 2025-12-02 | Displacement rate is its published definition; it does not name scale or arpeggio runs. |
| music21 `chord.Chord.commonName`, `.inversion()`, `scale.ConcreteScale.deriveRanked` | Names the chord an arpeggio outlines and the scale a run uses. | BSD-3 | yes | any | n/a | v10.5.0 | Does not find the run. |
| Couturier "scale motives" element (section 14) | A labelled texture element for scale passages. | GPL-3.0 | yes | dataset | F1 0.363 | 2024 | Weak. Mozart only. |

| id | status | what serves it |
| --- | --- | --- |
| `technique.scale-run` | nothing found (building blocks: music21 `deriveRanked` on a run found by a project rule) | project rule |
| `technique.arpeggio-run` | nothing found (building blocks: the same) | project rule |
| `technique.arpeggio-chord` | candidate | music21 `commonName` / `inversion()` |
| `technique.finger-independence` | nothing found (building blocks: durations per hand; fingering from section 4) | project rule |
| `technique.span` | nothing found (building blocks: simultaneous pitches per hand) | project count |
| `technique.leap-size` | nothing found (building blocks: successive pitches per hand) | project count |
| `technique.displacement-rate` | candidate | RubricNet's implementation of Chiu and Chen's displacement rate |
| `technique.pedal-implied` | nothing found (building blocks: durations, span, chord changes) | project rule, agent |

**Recommendation.** Take displacement rate from RubricNet's code rather than re-deriving it. The rest are counts or rules.

## 18. Difficulty

Characteristics: `difficulty.reading`, `difficulty.rhythm`, `difficulty.pitch-navigation`, `difficulty.coordination`, `difficulty.technique`, `difficulty.harmonic-load`, `difficulty.expressive`, `difficulty.perceptual`, `difficulty.level`, `difficulty.local-profile`

| candidate | what it does here | licence | offline | input | published accuracy (source) | maintenance | leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CIPI models (Ramoneda et al., "Combining piano performance dimensions for score difficulty classification", Expert Systems with Applications 2023/24), github.com/PRamoneda/difficulty-prediction-CIPI | Classifies a score into Henle's 9 levels from three learned dimensions: pitch, fingering (ArGNN) and expressiveness (VirtuosoNet score encoder). | code NOASSERTION (no licence file recognised); dataset CC 4.0, restricted access on request (Zenodo 10.5281/zenodo.6564421) | yes once obtained | MusicXML | Ensemble on CIPI (652 pieces, 29 composers): 9-class balanced accuracy 39.5% (±3.4), 3-class 71.3%, within ±1 level 87.3%, MSE 1.1 (arXiv 2306.08480, read in the HTML) | last push 2023-10-25 | Classical repertoire graded by one editor (Henle). The dimensions are learned embeddings, not named loads. Code licence unclear. |
| RubricNet (section 17) | An interpretable rubric over six descriptors. | code MIT (see section 17) | yes | MusicXML | CIPI 9-class accuracy 41.4% (±3.1), MSE 1.7; Mikrokosmos-difficulty 3-class 79.6% (arXiv 2408.00473, read in the HTML) | 2025-12-02 | Six descriptors only. Reading, rhythm-reading and coordination loads are not separate. |
| Score Analyzer (Sébastien et al., ISMIR 2012) | Published criteria per dimension (displacements, hand synchronisation, fingering, polyphony and others). | paper; no code found | n/a | MusicXML | not read | 2012 | No code. |

Data:
- CIPI (above): Henle levels.
- PSyllabus (Ramoneda et al.; 7,901 pieces with 11 levels mapped from ABRSM, RCM, Trinity and others; MIDI and audio; Zenodo 14794592 seen, licence not checked).
- Mikrokosmos-difficulty.
- MIREX 2026 has a new audio-only difficulty task with no results yet (music-ir.org, read).

| id | status | what serves it |
| --- | --- | --- |
| `difficulty.level` | candidate | CIPI ensemble, RubricNet |
| `difficulty.pitch-navigation` | candidate | RubricNet pitch range and displacement rate; CIPI pitch dimension |
| `difficulty.technique` | candidate | CIPI fingering dimension |
| `difficulty.expressive` | candidate | CIPI expressiveness dimension |
| `difficulty.reading` | nothing found (building blocks: the reading rows of section 1.B) | project model |
| `difficulty.rhythm` | nothing found (building blocks: RubricNet average IOI; the rhythm rows of section 1.C) | project model |
| `difficulty.coordination` | nothing found (building blocks: section 16 counts) | project model |
| `difficulty.harmonic-load` | nothing found (building blocks: section 10 outputs) | project model |
| `difficulty.perceptual` | nothing found (building blocks: visual-density reads) | project rule |
| `difficulty.local-profile` | nothing found (building blocks: RubricNet descriptors computed in a window) | project model |

**Recommendation.** Test RubricNet first: it is interpretable, MIT on GitHub, and its descriptors are the rows above. Calibrate the project's `difficulty.level` against CIPI and PSyllabus grades. Its published 9-class accuracy (about 40%) says an exact grade from code alone is not reliable; within ±1 level it is.

## 19. Form: phrases, sections and named forms

Characteristics: `form.length`, `form.sections`, `form.phrase`, `form.period`, `form.twelve-bar`, `form.turnaround`, `form.intro-ending`, `form.multi-strain`, `form.thirty-two-bar`, `form.binary-ternary`, `form.variations`, `form.sonata`, `form.rondo`, `form.song-sections`, `form.improvisation-space`

| candidate | what it does here | licence | offline | input | published accuracy (source) | maintenance | leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AnalysisGNN (section 10) | Note-level phrase and section boundaries. | MIT | weights download once | MusicXML | Phrase macro F1 0.742, section 0.768 on the Distant Listening Corpus (Table 2) | 2026 | Classical only. Labels boundaries, not form names. |
| van Kranenburg, "Rule mining for local boundary detection in melodies" (ISMIR 2020), github.com/pvankranenburg/ismir2020 | Phrase boundaries in melodies: Random Forest and RIPPER over features including Grouper and LBDM. | MIT | yes | kern melodies | Boundary F1: Random Forest 0.68 (MTC), 0.76 (Essen), 0.89 (Bach chorales); Grouper 0.68 / 0.65 / 0.62; LBDM 0.55 / 0.53 / 0.45 (Table 3, read in the PDF) | last push 2023-07-06 | Monophonic melodies only (needs melody location first). Grouper itself is in the Melisma analyser (licence not checked). |
| Allegraud et al., "Learning sonata form structure on Mozart's string quartets" (TISMIR 2019) | An HMM labelling P, TR, S, C, development and recapitulation. | dataset ODbL v1.0 (algomus.fr/data); code not released (music21-based, per the article) | n/a | score features | Section F1 (M18 model): P 0.69, S 0.38, development 0.53, P′ 0.66, S′ 0.30; 38–41% of main boundaries within 3 bars (article page) | 2019 | No code. String quartets. |

Also found:
- musicaiz (github.com/carlosholivan/musicaiz, AGPL-3.0, release v0.1.2 2023-03-07): graph-based structure segmentation, best F1 0.564 at one-bar tolerance (arXiv 2303.13881 abstract).
- Dai, Zhang and Dannenberg's POP909 hierarchical structure (github.com/Dsqvival/hierarchical-structure-analysis, MIT, C++): human phrase labels for POP909 songs. Its 92.8% figure is from a search summary, **not confirmed**.
- TAVERN (themes and variations with numerals, CC BY-SA 4.0) for `form.variations`.
- Chordonomicon (section labels; licence not settled) for song sections.
- music21 `repeat.Expander` for `form.length`, which chunk 1 found disagreeing with the spec (`mark.repeat` failing).

| id | status | what serves it |
| --- | --- | --- |
| `form.length` | candidate | music21 `repeat.Expander` (chunk 1: disagreements recorded); partitura unfolding |
| `form.sections` | candidate | AnalysisGNN section boundaries |
| `form.phrase` | candidate | AnalysisGNN phrase; van Kranenburg's boundary model for melodies |
| `form.period` | nothing found (building blocks: phrases and cadences) | agent |
| `form.twelve-bar` | nothing found (building blocks: numerals from section 10; Chordonomicon as reference) | project rule |
| `form.turnaround` | nothing found (building blocks: numerals) | project rule |
| `form.intro-ending` | nothing found (building blocks: sections) | agent |
| `form.multi-strain` | nothing found (building blocks: sections, key changes) | agent |
| `form.thirty-two-bar` | nothing found (building blocks: section similarity; Jazz Harmony Treebank and Chordonomicon as reference) | project rule |
| `form.binary-ternary` | nothing found (building blocks: sections, cadences, key areas) | agent |
| `form.variations` | nothing found as code (TAVERN as test data) | agent |
| `form.sonata` | candidate | the Allegraud HMM method (no code released; data ODbL) |
| `form.rondo` | nothing found (building blocks: section similarity) | agent |
| `form.song-sections` | candidate | POP909 phrase labels and Chordonomicon section labels as references (data only; no score-reading model found) |
| `form.improvisation-space` | nothing found (building blocks: chord symbols over empty or slash bars) | project rule |

Note: `form.sonata` and `form.song-sections` count as "candidate" for a published method or labelled data, not a runnable tool. Without them, two more rows would read "nothing found".

**Recommendation.** Test AnalysisGNN phrase and section output on the DCML Mozart sonatas (phrase annotations). Use van Kranenburg's model on extracted melodies. Named forms stay with the agent, given these boundaries.

## 20. Style, genre, dance and metadata

Characteristics: `style.evidence`, `style.genre-label`, `style.dance-type`, `meta.composer-era`, `meta.title`, `meta.published-grade`, `meta.familiarity`, `meta.arrangement`, `expression.character`

| candidate | what it does here | licence | offline | input | published accuracy (source) | maintenance | leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MusicBERT (Zeng et al., ACL Findings 2021), github.com/microsoft/muzic (musicbert) | A pre-trained symbolic model fine-tuned for genre and style. | MIT (repo) | weights download once (OneDrive) | MIDI (OctupleMIDI) | Genre F1-micro 0.784 (TOP-MAGD, 13 genres), style 0.645 (MASD) (paper table, read in the PDF) | repo archived; last push 2026-08-05 | Multitrack pop MIDI genres, not piano-teaching styles (ragtime, stride, tango). Archived. |
| CLaMP 3 (Wu et al., ACL 2025), github.com/sanderwood/clamp3 | Text–music retrieval. A score can be scored against style names zero-shot. | MIT | weights download once (Hugging Face), then local | interleaved ABC (MusicXML converted by its scripts), MIDI text | No symbolic genre figure read in the README | last push 2025-05-11 | Zero-shot accuracy for these styles is unknown. |
| jSymbolic 2.2 + a classifier | Features for a trained style classifier. | GNU GPL | yes (Java) | MIDI, MEI | none for these labels | 2018 | Needs labelled training data. |

Also: MidiBERT-Piano's composer classification on Pianist8 (8 classes) reaches 67.46% (CP, score) and 81.75% (CP, performance) (Table 2).

Metadata lookups:
- CIPI (Henle levels) and PSyllabus (syllabus grades) are published grade lists that a title match could look up for `meta.published-grade`.
- No offline composer-date source was checked.

| id | status | what serves it |
| --- | --- | --- |
| `style.evidence` | nothing found (building blocks: the texture, rhythm and harmony rows; MusicBERT and CLaMP 3 give a genre guess, not the evidence vector) | project assembly |
| `style.genre-label` | candidate | MusicBERT genre (pop genres); CLaMP 3 zero-shot |
| `style.dance-type` | nothing found (building blocks: metre, anacrusis, accompaniment figures; a "Nottingham dance classification" use was seen in a search summary, not confirmed) | agent |
| `meta.composer-era` | nothing found (no offline composer-date table checked) | lookup to be sourced |
| `meta.title` | nothing found (building blocks: title words) | project lookup |
| `meta.published-grade` | candidate | CIPI and PSyllabus grade lists (lookup after identity match) |
| `meta.familiarity` | nothing found | agent |
| `meta.arrangement` | nothing found | agent |
| `expression.character` | nothing found | agent |

**Recommendation.** Use PSyllabus and CIPI as the grade lookup first; this is data, not a model. Do not use MusicBERT or CLaMP 3 for style labels unless they are first measured on the catalogue's own styles. Lessons item 3 keeps naming the style with the agent.

## 21. Musical quality

Characteristics: `quality.coherence`, `quality.idiomatic`

**Nothing found** that judges whether a score hangs together or is idiomatic.
- Searched: "music generation evaluation metrics", "coherence of generated symbolic music".
- The nearest are descriptive statistics for generated music: MusPy metrics (pitch-class entropy, scale consistency, groove consistency, empty-beat rate; MIT) and mgeval (Yang and Lerch; GitHub reports no licence, last push 2021-08-02). They compare distributions; they do not give a verdict on one piece. IDyOM's information content (section 9) measures predictability, not coherence.

| id | status | what serves it |
| --- | --- | --- |
| `quality.coherence` | nothing found (building blocks: MusPy metrics, IDyOM information content) | agent with its checklist |
| `quality.idiomatic` | nothing found (building blocks: the technique rows; pianoplayer's fingering cost) | agent with its checklist |

**Recommendation.** No test. These stay agent judgements, as the characteristics list already marks them.

## 22. Chunk-1 characteristics not surveyed before (2026-10-08)

**What this is.** The 55 characteristics of sections 1.A to 1.C of `characteristics-list.md` that sections 1 to 21 give no row, each now placed in one of two ways: a **direct read** (a notation field, or plain arithmetic over fields, named with its reader) or **surveyed** (libraries, trained models and annotated data searched, up to three candidates). Done on the owner's go for handoff step 2, by one agent, from base commit 0fb1d9e3. Nothing was installed or run, no rule is written, and nothing was run on the catalogue. The readers were checked by reading the installed sources (`.venv`: music21 10.5.0, partitura 1.9.0); other facts follow the conventions in the header (GitHub API on 2026-10-08, the paper's own text, **not confirmed** where only a search summary or page-fetch summary was seen). Of the 55, 37 are direct reads and 18 are surveyed (6 candidate, 12 nothing found).

### 22.0 Direct reads (37)

The test applied: the answer is an element or field of the score, or a count, share, maximum or table lookup over fields, with no musical judgement that a library or trained model could do better. A threshold that a rule still has to fix (a stream length, a register boundary) is a parameter of that later rule, not a judgement in the read. These ids are written without backticks on purpose: a backticked id at the start of a row means "surveyed" in this file.

| id | field and reader | why no judgement is needed |
| --- | --- | --- |
| notation.staves | MusicXML `<staves>` and the part count; music21 `Score.parts`; partitura note-array field `staff` (added by `feature_functions=['staff_feature']`, `staff_feature` in `note_features.py`) | A declared number. |
| notation.clefs | The `<clef>` in force at each note: music21 `clef.Clef` found with `getContextByClass`; partitura `Clef` objects and `clef_feature` | Which clef governs a note is a lookup; the per-clef counts are sums. |
| notation.clef-change | The same clef elements with their offsets (music21 `Stream.recurse()` filtered to `clef.Clef`; partitura `Clef`) | A change is a clef element after a staff's first. |
| pitch.ledger | Written pitch against the staff: music21 `Pitch.diatonicNoteNum` against `Clef.lowestLine` (both read in the sources), minus the `spanner.Ottava` shift | Line-or-space and ledger count are subtraction on the diatonic number; the clef gives the staff's edges. |
| mark.ottava | music21 `spanner.Ottava` (`type` 8va, 8vb, 15ma, 15mb); partitura `OctaveShiftDirection` (the importer reads `octave-shift`, `importmusicxml.py` line 1047); MusicXML `<octave-shift>` | An element with a kind and a span. |
| notation.keys | music21 `key.KeySignature`; partitura `KeySignature` and note-array fields `ks_fifths`, `ks_mode`; MusicXML `<key>` | The `<fifths>` value and its position. |
| key.signature-exercised | music21 `KeySignature.alteredPitches` (`key.py` line 457) against the notes' written letters | A count of notes whose letter the signature alters. |
| reading.accidental-kinds | `<accidental>` text and its `cautionary` attribute from raw MusicXML (music21's import leaves `cautionary` a TODO, `xmlToM21.py` line 3428); music21 `pitch.Accidental.name` and `.displayStatus`; `Stream.makeAccidentals` applies the bar rule for carried accidentals | The kind is the element's text; the carry-over is the fixed bar rule that the library implements. |
| reading.accidental-churn | music21 `Pitch.accidental` per note, grouped per bar by letter name and octave | A sequence test (cancelled, then returned) within one bar at one staff position. |
| reading.visual-density | partitura note array (`onset_beat`, `staff`) grouped per staff per bar; accidental and ledger counts from the two rows above; jSymbolic R-10 as the published definition (music21 `NoteDensityFeature`, `jSymbolic.py` line 2124) | Counts per bar. |
| reading.unusual-notation | Raw MusicXML `<cue>`, nested `<tuplet>`, `<staff>` on notes inside one beam, and `<notehead>` values (music21 `Note.notehead`). music21 leaves `<cue>` unread (a TODO in `xmlToM21.py`) and partitura skips cue notes (`importmusicxml.py` lines 616 to 620) | A closed list of element names and values. |
| mark.fingering | music21 `articulations.Fingering` (`fingerNumber`, `substitution`, `alternate`); partitura `Fingering` (`parse_fingering`, `importmusicxml.py` line 1907); MusicXML `<fingering>` | Count and share of what is printed. |
| notation.lyrics | music21 `note.Lyric` with its `number`; MusicXML `<lyric number>` | One element per syllable. |
| harmony.figured-bass | Raw MusicXML `<figured-bass>` and `<figure>` (music21 skips the element: `'figured-bass': None`, `xmlToM21.py` line 2409); where figures are typed as text, music21 `figuredBass.notation.Notation` parses a figure string | The figures are element or string content. Limit: the characteristics list says the held PDMX files carry no `<figured-bass>`; recognising figures typed as lyrics is outside this read. |
| mark.repeat | music21 `bar.Repeat`, `spanner.RepeatBracket`, `repeat.DaCapo`, `DalSegno`, `Segno`, `Coda`, `Fine` (classes read in `repeat.py`), and `repeat.Expander` for the bars played (as section 19 uses it for the length row); partitura `Repeat`, `Ending`, `DaCapo`, `DalSegno`, `Segno`, `Coda`, `Fine` | Each kind is a printed element or a word from a closed list; the expansion is a library routine. Chunk 1 recorded this row failing (section 19); that is a fault in the reading to fix, not a need for judgement. |
| notation.slash-rhythm | music21 `Note.notehead == 'slash'`; raw `<measure-style><slash>` (music21's `handleMeasureStyle` leaves `slash` a TODO, `xmlToM21.py` line 6492) | An element or value, plus the durations already on the notes. |
| hands.per-bar-range | music21 `analysis.discrete.Ambitus` and `Pitch.midi`; partitura `pitch` and `staff`; register shares by jSymbolic P-9 to P-11 (music21 `ImportanceOfBassRegisterFeature` and its two siblings) | Minimum, maximum and span per bar; the register boundaries are the published ones. The hand is the staff here; which hand plays a note is the hand-assignment row (section 3). |
| pitch.black-key-share | music21 `Pitch.pitchClass`; partitura `pitch` (MIDI number) modulo 12 | A share over the fixed set of five black pitch classes. |
| pitch.inventory | music21 `Pitch.nameWithOctave` per note per staff; partitura `pitch` with `staff`; jSymbolic P-4 and P-5 | The distinct written pitches with counts. |
| reading.enharmonic-spelling | music21 `Pitch.name` against `Pitch.ps`, and `Pitch.isEnharmonic` | White-key accidentals are a closed list (E sharp, B sharp, C flat, F flat); one key under two names is two names with the same `ps`. Whether a spelling is wrong is the notation-sanity row (section 7), not this one. |
| notation.times | music21 `meter.TimeSignature`; partitura `TimeSignature` with `ts_beats`, `ts_beat_type`; MusicXML `<time>` | An element and its position. |
| metre.class | music21 `TimeSignature.classification`, `beatCount`, `beatDivisionCount` (`meter/base.py` lines 1116, 826, 948); partitura `ts_mus_beats` | A fixed table over numerator and denominator. The definition classes irregular signatures by written numerator, so the table applies the definition, not music21's label (it calls 7/8 "Simple Septuple"). |
| mark.anacrusis | `<measure implicit="yes">` (read by music21, `xmlToM21.py` line 5830, and partitura, `importmusicxml.py` line 655); `Measure.paddingLeft`; or the first bar's notated length against `TimeSignature.barDuration` | A comparison of two lengths. |
| rhythm.values | music21 `Duration.type` and `note.Rest`; native `UniqueNoteQuarterLengths`, `RangeOfNoteQuarterLengths`; partitura `duration_beat` | A count by value. |
| rhythm.dotted-quarter | music21 `Duration.dots` with the next note's `Duration.type` | Two fields of adjacent notes. |
| rhythm.ties | music21 `Note.tie` (a `tie.Tie` with start, continue, stop) with measure numbers; MusicXML `<tie>` | An element, and whether its two ends share a bar. |
| rhythm.repeated-notes | partitura note array `pitch` per `voice`; music21 `RepeatedNotesFeature` (jSymbolic M-9, `jSymbolic.py` line 327) | Run lengths over consecutive equal values. |
| rhythm.equal-stream | partitura `duration_beat` per staff | A run of equal values; the minimum length is a threshold a later rule sets (the characteristics list says it is still to source). |
| notation.swing-mark | Raw MusicXML `<swing>`: neither reader makes an object for it (music21's `xmlToM21.py` has no swing handling, partitura's importer has none); the word "Swing" from music21 `expressions.TextExpression` | Element presence plus a closed word list. |
| rhythm.beat-onset-share | partitura `is_downbeat` and `onset_beat`; music21 `Note.beat` | The fraction of beats (and of bar starts) that carry an onset. |
| mark.tempo-text | `<metronome>` through music21 `tempo.MetronomeMark` (`.referent`, `.getQuarterBPM()`) or partitura `Tempo(bpm, unit)`; tempo words against the closed term table the libraries ship (partitura's `ConstantTempoDirection` table, `importmusicxml.py` line 84; music21 `tempo.defaultTempoValues`, `tempo.py` line 38) | A number and a beat unit; a word is matched to a table, and a word outside it is reported unclassified, not guessed. |
| mark.tempo-change | partitura `DecreasingTempoDirection`, `IncreasingTempoDirection`, `ResetTempoDirection`; music21 `tempo.MetricModulation` (`tempo.py` line 860) | Closed word lists. |
| technique.velocity | partitura `onset_quarter` and `duration_quarter` per staff with `Tempo.bpm` and `unit`, or music21 `MetronomeMark.getQuarterBPM()`; music21 `NoteDensityFeature` (jSymbolic RT-5) as a whole-item check | Notes divided by seconds. The characteristics list records a fault in the project's own code for this row (the numerator taken as quarter notes per bar); it is not a fault in a reader. |
| technique.endurance | partitura note array and `rest_array`, music21 `note.Rest`: the longest stretch of a staff without a rest | A maximum over spans. |
| metre.grouping | music21 `TimeSignature.beatSequence` and `beamSequence`; raw `<beats>` text with "+"; `note.beams` | The numerator's "+" parts or the beam groups; with neither, the answer is UNKNOWN, not a guess. |
| rhythm.silence | partitura note array onsets and ends over all staves; music21 `spanner.MultiMeasureRest`; `Score.parts` for the other parts | The gaps in the union of note intervals. |
| rhythm.bar-patterns | music21 `search.mostCommonMeasureRhythms` (`search/base.py` line 1047: returns the count, the bars and the rhythm string for each pattern), run once per staff | Counting identical rhythm strings. |

### 22.1 Sounded-key, polytonal and tone-row reads

Characteristics: `pitch.chromatic`, `key.polytonal`, `pitch.tone-row`

| candidate | what it does here | licence | offline | input | published accuracy (source) | maintenance | leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| music21 `scale.ConcreteScale.getScaleDegreeAndAccidentalFromPitch` (`scale/__init__.py` line 1854) and `deriveRanked` (sections 2 and 9) | Gives a pitch's scale degree and accidental against a key or scale, so a note outside the scale is a note with an accidental. | BSD-3 | yes, installed | any music21 stream | none (deterministic membership) | v10.5.0 | The key as sounded comes from section 1, and the raised notes of a minor key from section 2; the library gives neither. |
| MusPy `pitch_in_scale_rate` (section 2) | Share of notes in a given scale. | MIT | yes | MusicXML, MIDI, ABC | none (descriptive) | last push 2026-03-11 (section 2) | Major and minor only, as section 2 records. |
| music21 `search.serial` (`TransformedSegmentMatcher`, `ContiguousSegmentSearcher`) with `serial.ToneRow`, `TwelveToneRow` | Finds the transformations (transposed, inverted, retrograde) of a given pitch-class segment as contiguous segments of a score, with a setting for repeated notes and for chords. | BSD (file header) | yes, installed | any music21 score with measures | none (deterministic search) | v10.5.0 | It needs the row as input. Which twelve notes are the row, and statements with omitted or split notes, are not decided by it. |
| AMADS `amads.pitch.serial` (github.com/music-computing/amads) | Row manipulations: hexachord rotation and Krenek's pair swaps. | MIT (GitHub API) | yes | pitch lists | none | v1.4.0 2026-08-06, last push 2026-10-01 | Transforms rows; does not look for them in a score. The README says much of the toolkit remains to be tested (page fetch). |

Searched: "polytonality bitonality automatic detection symbolic score dataset". The results were about single-key detection (Ng, Boyle and Cooper 1996; Rizo, Iñesta and Ponce de León 2006; the TAVERN and When in Rome analyses). None labels or detects two keys at once, in the summaries seen (**not confirmed** beyond the search summary).

**Annotated data to test against.**
- `pitch.chromatic`: the sounded key comes from When in Rome (CC BY-SA 4.0, section 1). No set labels individual chromatic notes.
- `key.polytonal`: none found.
- `pitch.tone-row`: no annotated score set found. music21's `serial.py` ships a table of rows from named works (Berg, Schoenberg and others; `HistoricalTwelveToneRow`, `findHistorical`), a lookup of known rows, not a set of scores.

| id | status | what serves it |
| --- | --- | --- |
| `pitch.chromatic` | candidate | music21 `getScaleDegreeAndAccidentalFromPitch` / `deriveRanked`, given the key from section 1 and the minor form from section 2; MusPy `pitch_in_scale_rate` for the whole-piece share |
| `key.polytonal` | nothing found (building blocks: raw `<key>` per staff; the section 1 key finders run once per staff) | project rule, agent confirms |
| `pitch.tone-row` | candidate | music21 `search.serial` `TransformedSegmentMatcher` for the statements of a given row; choosing the row is a project step |

**Recommendation.** Nothing to test first for `pitch.chromatic` beyond section 1's key test. Try `TransformedSegmentMatcher` on a row taken from music21's `findHistorical` table once a score of that work is in hand.

### 22.2 Reading-load measures, page turns, aids and chord symbols

Characteristics: `reading.pitch-entropy`, `reading.redundancy`, `notation.reading-aids`, `notation.turn-opportunity`, `notation.chord-symbols`

| candidate | what it does here | licence | offline | input | published accuracy (source) | maintenance | leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RubricNet extractor (section 17), `extractor/DifficultyFeatures/code/raw_data_extractors.py` | Calls `pitch_entropy` and `pitch_set_lz` per part (read in the source): the two descriptors the rows define. | MIT (section 17) | yes | CIPI MusicXML | none for the descriptors alone (difficulty figures in section 18) | last push 2025-12-02 | The repository's own notes call one of its feature files "erroneous" (the ISMIR submission's `basic-CIPI.json`) and say the debugged features are in a separate archive. Its extractor README is a placeholder. The code should be read before reuse. |
| AMADS `amads.algorithms.entropy` and `amads.algorithms.complexity` | Relative (normalised) entropy of a distribution, after the MIDI Toolbox; Lempel-Ziv complexity by the LZ77 algorithm. | MIT | yes | lists of values | none | v1.4.0 2026-08-06 | The entropy is normalised to 0 to 1 and the complexity is LZ77, where the rows name Shannon entropy and LZ76. A different variant. |
| Python package `lempel_ziv_complexity` (github.com/Naereen/Lempel-Ziv_Complexity) | A Python Lempel-Ziv complexity count over a sequence. | MIT (GitHub API) | yes | sequences | none | last push 2021-03-31 | Which variant (LZ76) it counts is **not confirmed**. Not installed; unmaintained since 2021. |
| music21 `harmony.ChordSymbol`, `harmony.NoChord` (from `<harmony>`) | Printed chord symbols as objects with root, kind and bass. | BSD-3 | yes, installed | MusicXML `<harmony>` | none (deterministic) | v10.5.0 | Its text parser is the weak part: the characteristics list records that it rejects "Cm7/Bb". Symbols typed as plain text are outside the `<harmony>` route. |
| Tonal `@tonaljs/chord` (`Chord.get`) | Parses a chord symbol string, including slash chords such as "Cmaj7/B", into tonic, bass and notes (README read). | MIT per section 2 (the GitHub API reports none) | yes | symbol strings | none | last push 2026-09-29 | JavaScript. It reads symbols, not scores, and does not name the symbol system (letter names against Roman numerals or Nashville numbers). |

Nothing found for the other two rows:
- `notation.turn-opportunity`: searched "automatic page turn points detection sheet music score rests analysis algorithm". The published systems turn pages by following a performance (for example Henkel, Schwaiger and Widmer, arXiv 2111.06643, a title seen in the results; its content is **not confirmed**). A claim that engravers place turns at rests came from one search summary (**not confirmed**). No tool measures free spans in a symbolic score.
- `notation.reading-aids`: searched "detect letter names or counting syllables written in noteheads beginner sheet music MusicXML analysis". Found only that MusicXML carries note names in `<notehead-text>`, which music21 leaves unread (`xmlToM21.py` line 3091, a TODO), and that engraving tools can print letters in noteheads. No detector.

**Annotated data to test against.** For chord symbols, the Jazz Harmony Treebank and Chordonomicon (section 10; licences not settled there). None for pitch entropy, redundancy, page turns or reading aids.

| id | status | what serves it |
| --- | --- | --- |
| `reading.pitch-entropy` | candidate | RubricNet's `pitch_entropy` (section 17); AMADS relative entropy as a second implementation |
| `reading.redundancy` | candidate | RubricNet's `pitch_set_lz` (section 17); the row's LZ76 variant is not confirmed in any listed library |
| `notation.reading-aids` | nothing found (building blocks: raw `<notehead-text>` and `<notehead>`, music21 `note.Lyric` text) | project rule; the agent separates counting from real words in lyrics |
| `notation.turn-opportunity` | nothing found (building blocks: partitura `rest_array` and note array per staff, music21 `note.Rest`) | project rule; the length that suffices for a turn is a rule |
| `notation.chord-symbols` | candidate | music21 `ChordSymbol` / `NoChord` from `<harmony>`; Tonal `Chord.get` for symbols typed as text |

**Recommendation.** For the two entropy and complexity rows, read RubricNet's extractor before reuse (its own notes flag an erroneous feature file) and compare it with the AMADS functions on one score.

### 22.3 Syncopation, backbeat, hemiola and polyrhythm

Characteristics: `rhythm.syncopation`, `rhythm.backbeat`, `rhythm.hemiola`, `texture.polyrhythm`

| candidate | what it does here | licence | offline | input | published accuracy (source) | maintenance | leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SynPy (Song, Pearce, Harte, "SynPy: a Python toolkit for syncopation modelling", SMC 2015) | Seven syncopation models behind one interface, one value per bar: Longuet-Higgins and Lee, Pressing, Toussaint's metric complexity, Sioros and Guedes, Keith, Toussaint's off-beatness, and the weighted note-to-beat distance. | code licence **not confirmed**: the repository page (code.soundsoftware.ac.uk/projects/syncopation-dataset) refused the connection on 2026-10-08. The paper footer says CC BY 3.0 and its Zenodo record (10.5281/zenodo.851079) says CC BY 4.0 | yes if obtained (Python) | standard MIDI files (type 0 and 1) or the toolkit's own text rhythm notation; results to XML or JSON. Not MusicXML | none: the paper plots each model's output over the 111 rhythms of its dataset and, in the text read, gives no agreement figure with listeners (paper read in the PDF) | paper 2015; repository activity **not confirmed** | Four models cannot process polyrhythms and one handles duple metre only (Table 1 caption). All use onsets, and only Sioros and Guedes uses velocity, so "an accent off the beat" is not an output of most. MIDI input means exporting the score. |
| AMADS `amads.time.meter` (`syncopation`, `syncopation_span`, `inner_metric_analysis`), github.com/music-computing/amads | `syncopation` holds the weighted note-to-beat distance and loads a score through partitura `load_score`. `syncopation_span` is a new measure that its own docstring says lacks empirical testing. `inner_metric_analysis` computes metric and spectral weights from onsets (Volk 2008). | MIT (GitHub API) | yes | any format partitura reads, MusicXML included (`syncopation.py` source) | none read for these modules | v1.4.0 2026-08-06, last push 2026-10-01 | One published model only. The source warns that partitura takes beats from the time-signature denominator (6/8 has six). The README says much remains to be tested (page fetch). |
| Beatsearch (github.com/Tomasito665/Beatsearch) | Symbolic rhythm features including monophonic and polyphonic syncopation vectors, syncopated-onset ratio and mean syncopation strength (names read in its docs source). | MIT (GitHub API) | yes | its own rhythm objects, strings such as "x--x--x---x-x---", MIDI (the MIDI loader's docs page was not read) | none read | last push 2018-08-02 | No push since 2018; MusicXML input is not listed. |
| GrooveToolbox (github.com/fredbru/GrooveToolbox, ISMIR 2020) | Rhythm and microtiming features of drum loops: syncopation, density, complexity, swing ratio. | Apache-2.0 (GitHub API) | yes | MIDI drum loops, grouped by kit part | none read | last push 2026-07-13 | Drum kits only; the README lists Python 3.5 or 2.7. No backbeat function in the function names of `Groove.py` (read), so the test for beats 2 and 4 is not supplied. |

Searches with no tool found:
- `rhythm.hemiola`: "hemiola detection symbolic music automatic computational". Results: a DFT-of-onsets treatment of hemiola (Chander, a SysMus 2021 poster seen in a search summary, **not confirmed**, no code seen) and AMADS's inner metric analysis as a building block.
- `texture.polyrhythm`: "polyrhythm detection symbolic MIDI cross-rhythm 3 against 2 algorithm library". No library found; the search summary suggested checking onsets against 1/2 and 1/3 grids (a suggestion, not a source).
- `rhythm.backbeat`: "backbeat detection snare on beats 2 and 4 symbolic MIDI drum pattern classification library". No symbolic detector found; the one backbeat detector in the results works on live audio.

**Annotated data to test against.**
- `rhythm.syncopation`: Song's syncopation dataset, 111 rhythm patterns with perceptual ratings of syncopation strength (27 monorhythms in 4/4, 36 in 6/8, 48 polyrhythms in 4/4; SynPy paper section 4, read). Its licence and the repository link are **not confirmed**. Fitch and Rosenfeld (2007, Music Perception) appeared as a PDF title in the results and was not read.
- The RAG-C ragtime collection (about 11,000 MIDI files, Kirlin ISMIR 2020 paper text, read; CC BY 4.0 paper): used there with the Longuet-Higgins and Lee measure per bar. It has no ratings, so it supplies material, not labels. Its licence is **not confirmed**.
- `rhythm.backbeat`, `rhythm.hemiola`, `texture.polyrhythm`: no annotated set found.

| id | status | what serves it |
| --- | --- | --- |
| `rhythm.syncopation` | candidate | SynPy (the onset-based kinds: off-beat onset held across a strong beat, rest on a strong beat before an off-beat onset); AMADS weighted note-to-beat distance; the accent kind is not served |
| `rhythm.backbeat` | nothing found (building blocks: partitura `onset_beat` and `is_downbeat`, music21 `Note.beatStrength`; GrooveToolbox covers drum loops only) | project rule |
| `rhythm.hemiola` | nothing found (building blocks: AMADS inner metric analysis, ties and onsets per bar) | project rule, agent confirms the grouping |
| `texture.polyrhythm` | nothing found (building blocks: partitura `onset_beat` per staff, music21 `duration.Tuplet` per staff; section 16 counts) | project rule |

**Recommendation.** Score SynPy (after exporting a score to MIDI) and AMADS's weighted note-to-beat distance against Song's ratings for the onset kinds. Neither covers the accent kind.

### 22.4 Named rhythm cells and clave direction

Characteristics: `rhythm.habanera`, `rhythm.tresillo`, `rhythm.cinquillo`, `rhythm.secondary-rag`, `rhythm.clave-alignment`

| candidate | what it does here | licence | offline | input | published accuracy (source) | maintenance | leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Jajoria, Krenn, Mäder, "Towards a computational definition of the tresillo rhythm and its tracing in popular music" (arXiv 2109.10256v1, 2021) | Folds a song's onsets into one bar and scores their cosine similarity to a tresillo template (a plain and a parametrised version). | paper CC BY 4.0 (its footer); code **not confirmed**, none mentioned in the text | n/a | MIDI, 4/4 assumed | none: its validation songs were picked by the authors by listening, and the text says the parametrised model "clearly outperformed" the plain one without a figure (paper read in the PDF) | 2021 preprint | Tresillo only; no habanera, cinquillo or clave; pop MIDI; no code. A later SMC 2024 version was seen in a search summary and not read. |
| music21 `search.rhythmicSearch` (`search/base.py` line 341) | Finds a given sequence of consecutive note lengths in a stream; returns the start indices. | BSD-3 | yes, installed | any music21 stream | none (deterministic) | v10.5.0 | It matches the lengths of consecutive notes. An onset cell in the rows is a set of onset positions in a bar, which differs when a rest or a tie falls inside the cell. |
| Kirlin, "A corpus-based analysis of syncopated patterns in ragtime" (ISMIR 2020), github.com/pkirlin/ragtime-ismir-2020 | Turns ragtime MIDI into binary onset patterns per bar and counts them, with a Longuet-Higgins and Lee score per pattern. | paper CC BY 4.0; the GitHub API reports no licence file | yes | MIDI | none (a corpus study) | last push 2024-04-22 | Rhythm only, no pitch: it cannot test the secondary rag's period-three pitch pattern. |

Searched: "tresillo habanera cinquillo clave detection symbolic rhythm pattern MIDI dataset Afro-Cuban"; "clave direction 3-2 2-3 automatic detection MIDI or audio Latin music dataset"; "ragtime syncopation computational analysis secondary rag pattern detection symbolic corpus". No detector for habanera, cinquillo or the secondary rag; the search summary found no use of the phrase "secondary rag" in the ragtime corpus papers (**not confirmed**). Vurkaç's 2011 "Clave-direction analysis" (title seen in a search summary; paper not read, **not confirmed**) argues for automatic clave-direction identification.

**Annotated data to test against.**
- `rhythm.clave-alignment`: the UCI "FIRM Teacher Clave Direction Classification" dataset (Vurkaç 2011; CC BY 4.0; 10,800 instances of a 16-position onset vector for one 4/4 bar, classes neutral, reverse clave, forward clave and incoherent, labelled from the donor's listening tests and interviews; facts from the UCI page through a page-fetch summary, not checked against the file). It labels one bar's onset vector; the row asks per two-bar cycle and per line.
- `rhythm.habanera`, `rhythm.tresillo`, `rhythm.cinquillo`, `rhythm.secondary-rag`: no annotated set found. RAG-C (above) has the bars but no cell labels.

| id | status | what serves it |
| --- | --- | --- |
| `rhythm.habanera` | nothing found (building blocks: onset positions per bar from partitura `onset_beat`; music21 `rhythmicSearch` for a notated cell; Jajoria et al.'s template method for tresillo) | project rule |
| `rhythm.tresillo` | nothing found (building blocks: the same) | project rule; Jajoria et al. as the published method (no code) |
| `rhythm.cinquillo` | nothing found (building blocks: the same) | project rule |
| `rhythm.secondary-rag` | nothing found (building blocks: partitura `pitch` and `onset_beat` for a period-three pitch test) | project rule |
| `rhythm.clave-alignment` | nothing found (building blocks: onsets per two-bar cycle; the UCI clave set as labelled data) | project rule, agent confirms |

**Recommendation.** No tool to test; these stay project rules with this search recorded as the reuse line. Use the UCI clave set as a check on a clave-direction rule.

### 22.5 Long-short feel

Characteristics: `rhythm.shuffle`

| candidate | what it does here | licence | offline | input | published accuracy (source) | maintenance | leaves unsolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AMADS `amads.time.swing` (`beat_upbeat_ratio`) | The beat-upbeat ratio of consecutive eighth-note beats from beat and upbeat timestamps, with the 0.25 to 4.0 bounds of Corcoran and Frieler (2021) (docstring read). | MIT (GitHub API) | yes | lists of timestamps | none read | v1.4.0 2026-08-06 | It measures a ratio from timestamps. It does not find notated long-short pairs, and a score gives no timestamps beyond the notated values. |
| GrooveToolbox `get_swing_ratio` (section 22.3) | Swing ratio of a drum loop from microtiming. | Apache-2.0 | yes | MIDI drum loops | none read | last push 2026-07-13 | Performance microtiming on drums, not notation. |

Searched: "shuffle swing feel detection from symbolic score or quantized MIDI long-short eighth ratio triplet feel classification". The results measure swing from performances (audio or unquantised MIDI); none classifies a notated triplet or dotted pair as shuffle. A quantised grid cannot tell swing from a triplet feel by position alone (a patent seen in the results, **not confirmed**).

Annotated data: none found for notated pairs. The Weimar Jazz Database, which the AMADS docstring cites through Corcoran and Frieler, holds performance timings, not notation (not opened).

| id | status | what serves it |
| --- | --- | --- |
| `rhythm.shuffle` | nothing found (building blocks: music21 `Duration` pairs per beat; AMADS `beat_upbeat_ratio` for the ratio once the pairs are found) | project rule |

**Recommendation.** None to test. The rule counts notated pairs and uses the ratio function only as arithmetic.

### 22.6 Not confirmed in this section

- SynPy's code licence and whether its repository is reachable (the page refused the connection); the Song dataset's licence; RAG-C's licence.
- Facts seen only in a search summary or a page-fetch summary: Henkel et al.'s page-turning content; the claim that engravers place turns at rests; Chander's hemiola poster; Vurkaç's 2011 paper; the SMC 2024 tresillo version; the Fitch and Rosenfeld paper's content; the UCI clave dataset's figures; AMADS's README statements; the patent on swing and triplet feel; the polytonality search results.
- Tonal's licence (the GitHub API reports none; section 2 reads MIT from `package.json`, not rechecked).
- Which Lempel-Ziv variant `lempel_ziv_complexity` counts.
- Whether code exists for Jajoria et al.
- Beatsearch's MIDI loader (docs page not read).

---

## Counts (by script over this file)

The script counted rows of the per-characteristic tables (lines starting `` | `id` | ``) by their status cell. Section 22 also has direct-read lines, written without backticks, which are not counted as surveyed.

| scope | surveyed | with a candidate | nothing found | direct reads (no row) |
| --- | --- | --- | --- | --- |
| chunk-1 list (sections 1 to 21) | 13 | 8 | 5 | 0 |
| sections 1.D to 1.L (not direct reads) | 129 | 48 | 81 | 16 (listed at the top) |
| section 22: chunk-1 characteristics not surveyed before | 18 | 6 | 12 | 37 |
| all | 160 | 62 | 98 | 53 |

How the counts were checked:
- Every id on a `Characteristics:` line has exactly one status row, and the reverse.
- The 142 ids of sections 1 to 21 are the brief's 13 chunk-1 ids plus the 145 rows of sections 1.D to 1.L, less the 16 direct reads listed at the top. None is missing and none is extra.
- The script for sections 1 to 21 is `build/tools-survey/check.sh`, run 2026-10-08.
- The 55 ids of section 22 are the chunk-1 characteristics of sections 1.A to 1.C that had no row: 37 direct-read lines and 18 status rows (6 candidate, 12 nothing found). `build/tools-survey/check22.py` (not committed), run 2026-10-08, checks that each of the 55 appears exactly once in section 22, that no other id has a new row, that the `Characteristics:` ids and the status rows match, and that the section 22 and all rows above equal a recount of this file.

Of the 98 "nothing found", most are rules where libraries give the inputs and a project rule or count does the rest. Those rows name their building blocks.

Of the 62 "candidate":
- some are deterministic library reads (music21, partitura), where no accuracy applies;
- `form.sonata`, `form.song-sections` and `meta.published-grade` rest on published methods or data rather than runnable tools.

## Not done in this pass

- No candidate was installed, run or measured on the catalogue. Every accuracy is the publisher's, on the publisher's data.
- Not confirmed:
  - the PIG, ThumbSet and PSyllabus terms beyond what is quoted;
  - the code for Nakamura's HMMs, Ju et al.'s non-chord-tone model (F1 72.19% on Bach chorales from a search summary), Géré et al.'s error checker and the Algomus fugue tool;
  - Midi Miner's accuracy;
  - the licences of Chordonomicon, the Jazz Harmony Treebank and the Algomus fugue data;
  - the Simonetta Mozart figure, the Algomus fugue figures and the POP909 structure figure (search summaries only).
- The 55 chunk-1 characteristics of sections 1.A to 1.C that had no row (including `key.polytonal`, `pitch.tone-row`, `rhythm.syncopation`, `reading.accidental-kinds` and `mark.repeat`) are covered in section 22: 37 as direct reads with their readers named, 18 surveyed. Section 22.6 lists what in it is not confirmed.
