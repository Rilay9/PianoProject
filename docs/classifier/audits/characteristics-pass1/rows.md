# Characteristics list, pass 1: a verdict on every row (2026-10-08)

**What this checks.** `docs/classifier/characteristics-list.md` at f650806e (the Phase 1b draft): its 194 section-1 characteristics and its 68 merged or retired yaml rows, against FABLE.md section 2 item 1b and section 3. Written by an agent that did not write the list. No row was run on a score; nothing was assigned to an ability.

**Verdicts.** OK: the row stands. WRONG material: following the row as written would change what is detected or taught. WRONG minor: a wrong source, a wrong library claim with a working route also named, a vague definition or a duplicate. UNSURE: could not be checked, with the reason.

**Evidence keys** (what was opened or run; temp files in the worktree's `build/audit/`, not committed):
- **[count]** `build/audit/count.py` over the list and `characteristics.yaml`: 194 section-1 ids (25 new), 237 dispositions (119 kept, 50 corrected, 36 merged, 32 retired), in yaml order, no duplicates. The list's own section-3 counts are confirmed.
- **[import]** `build/audit/probe.py`, `probe2.py` to `probe4.py`: 151 music21 and partitura names imported in `.venv` (music21 10.5.0, partitura 1.9.0); all exist (`paddingLeft` and `chordKind` exist on instances only). All 27 named feature extractors exist among music21's 92. Instances probed: `ChordSymbol`, `TimeSignature`, `Fingering`, `PedalType`, `Key`, `Chord`, `VoiceLeadingQuartet`.
- **[synthetic]** `build/audit/probe5.py`: a five-line MusicXML file written for the purpose (words Allegro, rit., cresc., una corda; a `<swing>`), parsed by both libraries. A library-behaviour check, not a characteristic run.
- **[m21 src]** music21 `musicxml/xmlToM21.py` and `xmlSoundParser.py`, read.
- **[rules-T] [rules-H] [rules-R]** `docs/classifier/rules/texture.md`, `harmony.md`, `rhythm.md`, read; every `RULES-x § id` cited by the list was found as a heading (45 references, script).
- **[detect]** `app/src/demands/detect.ts`, read; **[diff]** `tools/content/difficulty.py` FEATURE_NAMES; **[cells]** `tools/content/cells.py`.
- **[JS]** the jSymbolic 2.2 feature page, fetched: every code the list cites exists with the name the row implies (page cut at T-12, as the list says).
- **[OMT]** 25 cited Open Music Theory pages fetched (all HTTP 200) and keyword-counted (`build/audit/kw.py`); **[WP]** 28 cited or relevant Wikipedia articles fetched (all 200).
- **[ABRSM]** and **[TCL]**: the text copies of the ABRSM 2025 & 2026 piano syllabus and the Trinity piano syllabus in the worktree `agent-a36009caaa4a6062d/build/src/` (`abrsm25.txt`, `tcl.txt`), searched for each cited phrase.
- **[RUB]** arXiv 2408.00473 (abstract and HTML) fetched. **[SEB]** the ISMIR 2012 Score Analyzer paper, text copy at worktree `agent-a7dc6fbea5ba91ba5/build/iter1/seb.txt`, Table 1 read.
- **[AB]** `docs/classifier/abilities.md`, searched by keyword.

## 1. Section 1: one line per characteristic (194)

| id | verdict | the correction | evidence |
| --- | --- | --- | --- |
| item.format | WRONG minor | "One value" cannot hold: the nine values mix layout (piano score, lead sheet, chord chart, open score) with purpose (technical exercise, duet part). A Czerny exercise is both a piano score and a technical exercise. Split into two fields: layout, and purpose. | [import] Score/StaffGroup/ChordSymbol/Lyric/Instrument exist; reading |
| notation.staves | OK | Note: partitura can also add staff to `compute_note_array` with `feature_functions=['staff_feature']`. | [import] `Part.note_array(include_staff=True)` returned field `staff`; `compute_note_array` with all includes did not; with `staff_feature` it did |
| prereq.hand-assignment | OK | | [import]; MXL-staff; reading |
| texture.melody-location | OK | WP-Homophony is a stand-in; hand exchange stays operational. | [WP] Homophony fetched (melody with accompaniment) |
| notation.clefs | OK | Report the number of notes read in each clef per staff, not only the clefs present (see clef.bass in section 2). | [import] clef classes; [detect] bassClef |
| notation.clef-change | OK | ABRSM-SR lists "clef changes" (Grade 6) and could be cited. | [import]; [ABRSM] |
| pitch.ledger | WRONG material | Count ledger lines from the written (displayed) position: MusicXML `<pitch>` under `<octave-shift>` is the sounding pitch, so a passage under 8va read "from the pitch and the clef" counts ledger lines the reader never sees. Subtract the ottava. | MXL octave-shift: notes "shifted up or down from their true pitched values"; [detect] ledgerLines reads the written letter |
| mark.ottava | OK | ABRSM-SR "8va sign" (Grade 7) could be cited. | [import] `spanner.Ottava`, partitura `OctaveShiftDirection`; [m21 src] octave-shift read; [ABRSM] |
| notation.keys | OK | | [import] |
| key.signature-exercised | OK | It now also carries the old key.signature's located notes (section 2). | [import] `KeySignature.alteredPitches`; [detect] keySignature |
| pitch.chromatic | OK | State the reference: against the sounded key (`key.tonic-mode`) where it differs from the signature, else Dorian-signature Baroque pieces count every B natural as chromatic. | [import]; [ABRSM] "chromatic notes" (Grade 4); [TCL] "A minor (including G#)" |
| reading.accidental-kinds | OK | The raw `cautionary` route is needed: music21 does not read it. | [m21 src] "TODO: attr: cautionary" at line 3428 |
| reading.accidental-churn | WRONG minor | "Same letter name" is ambiguous: an accidental holds for one staff position (letter and octave) on one staff. Define it so. | reading; MXL-accidental |
| reading.visual-density | OK | | [JS] R-10 "Note Density per Quarter Note"; [diff] notesPerBar, voicesPerStaff, ledgerRatio exist |
| reading.unusual-notation | WRONG minor | "Constructs a reader meets rarely" and "unusual noteheads" are open-ended; two readers will count different things. Close the list (cue notes, cross-staff notes and beams, nested tuplets, non-normal noteheads by name). | reading |
| reading.pitch-entropy | WRONG minor | RUB is misnamed: the paper is Ramoneda, Eremenko, D'Hooge, Parada-Cabaleiro and Serra (2024), arXiv 2408.00473, not "Zapata and Ramoneda". Pitch entropy is Chiu and Chen's (2012); computed per hand there. A difficulty input, not a teaching target. | [RUB] fetched; [import] scipy 1.17.1 present |
| reading.redundancy | WRONG minor | RUB misnamed as above; "Pitch Set LZ" is RubricNet's own new descriptor, not Chiu and Chen's. | [RUB]; `lempel_ziv_complexity` not installed (import) |
| notation.page-breaks | WRONG material | A page break is a property of one engraving, and the app renders its own pages, so the file's breaks say nothing about what the learner sees. The musical property behind AB-229 is the turn opportunity: spans where one hand rests or holds long enough to turn. Define that instead. | [m21 src] `<print new-page>` read into PageLayout (line 586); reading |
| mark.fingering | OK | | [import] `fingerNumber`, `substitution`, `alternate` on an instance |
| notation.lyrics | OK | | [import] |
| notation.chord-symbols | OK | | [import] text parser rejects "Cm7/Bb" and "Bbmaj7" (needs "B-"), confirming the row |
| harmony.figured-bass | WRONG minor | The claim that music21's reader "handles the element" is wrong: `'figured-bass': None` in the measure dispatch, so it is skipped. Raw MusicXML is the only route. | [m21 src] xmlToM21.py line 2409 |
| mark.repeat | OK | | [import] all repeat classes; [m21 src] segno, coda read; D.C./D.S. words turned into repeat expressions (`getRepeatExpression`) |
| hands.per-bar-range | OK | | [JS] P-8 to P-11; [import] Ambitus and the register features |
| pitch.black-key-share | OK | | [diff] blackKeyRatio |
| technique.five-finger | WRONG minor | A span of 7 semitones does not make a five-finger position: more than five different pitches in that span (a chromatic run C to G) needs a shift or substitution. Add "at most five distinct pitches". The extended class and the named positions are not in RULES-texture § technique.five-finger, which defines whole-item presence only. | [rules-T] five-finger; [detect] POSITION_SPAN = 7; [ABRSM] hand-position column |
| technique.position-shift | OK | | [rules-T] position-shift |
| key.tonic-mode | WRONG minor | `Stream.analyze('key')` runs Aarden-Essen in music21 10.5, not Krumhansl-Schmuckler. Name the method actually called (`analyze('key.krumhansl')` or AardenEssen). | [import] `analysisClassFromMethodName('key')` returned AardenEssen |
| key.minor-form | OK | | [rules-H] key.minor-form |
| key.change | OK | | [TCL] modulation by grade (Grade 5 to 7); [import] floatingKey.KeyAnalyzer |
| scale.collection | OK | Diatonic major and natural minor are also Ionian and Aeolian in the same list; name each once. | [rules-H] scale.collection; [import] scale classes; [OMT] scales2 has pentatonic, whole-tone, octatonic (no "blues") |
| notation.times | OK | | [import] |
| metre.class | WRONG minor | "Irregular (5, 7 or another number of beats)" is ambiguous: 7/8 is felt in three uneven beats (2+2+3), while music21 classifies it "Simple Septuple" (7 beats). State the grouping rule (beam groups or a stated default). | [import] 7/8 classification "Simple Septuple", 3/8 "Other Single"; [OMT] meter has no irregular metres (count 0); [JS] R-4 "Complex Initial Meter" |
| mark.anacrusis | OK | | [m21 src] `implicit` read (line 5830) |
| rhythm.values | OK | | [JS] R-13, R-15, R-23, R-24; [ABRSM] |
| rhythm.dotted-quarter | OK | | [JS] R-22 "Prevalence of Dotted Notes" |
| rhythm.ties | OK | | [import] |
| rhythm.syncopation | WRONG minor | The "(to be corrected for the pickup)" note is stale: detect.ts already excludes a silent downbeat after no note (the 2026-10-07 ruling). OMT-syncopation does not define the accent kind (no "accent" on the page); detect.ts's source (Harvard Dictionary; Longuet-Higgins and Lee 1984) is the definition to cite. | [detect] syncopation comment and code; [OMT] syncopation, "accent" count 0 |
| rhythm.triplets | OK | | [import] Tuplet; [detect] triplets |
| rhythm.tuplets-other | OK | | [TCL] "duplets and triplets" (Grade 8) |
| rhythm.cadenza | OK | WP stand-in. | [WP] Cadenza |
| rhythm.repeated-notes | OK | | [JS] M-9 "Repeated Notes" |
| rhythm.equal-stream | OK | Minimum length still to source, as the row says. | reading |
| rhythm.habanera | OK | Note: detect.ts reads the left hand only; a habanera melody is not found. | [cells] HABANERA {0, 3/8, 1/2, 3/4}; [detect] habaneraCell |
| rhythm.tresillo | OK | | [cells] TRESILLO {0, 3/8, 3/4} |
| rhythm.cinquillo | OK | | [WP] Cinquillo: eighth, sixteenth, eighth, sixteenth, eighth = pulses 0, 2, 3, 5, 6 |
| rhythm.secondary-rag | OK | | [rules-R] secondary-rag |
| rhythm.shuffle | WRONG material | Two errors. "In the triplet ratio" contradicts its own dotted eighth-sixteenth (3:1). And RULES-rhythm counts even eighths under a "Swing" direction as shuffle, so swing feel and shuffle become one row. Swung jazz eighths and the blues shuffle are taught apart. Keep swing in `notation.swing-mark`; define shuffle as the long-short pair figure; give the ratio as "2:1 or 3:1 as notated". | [rules-R] shuffle ("marked" clause); [WP] Shuffle rhythm |
| notation.swing-mark | WRONG minor | The claim "music21 reads the element" is wrong: music21's sound parser marks swing a TODO and produces no object; partitura ignores it ("ignoring direction type: swing"). Raw `<swing>` is the only route; text "Swing" arrives as TextExpression. | [m21 src] xmlSoundParser.py line 88; [synthetic] no swing object in either library |
| rhythm.backbeat | OK | WP "Backbeat" is its own article and a better stand-in than WP-Beat. | [WP] Backbeat, Beat (music) |
| rhythm.hemiola | OK | | [WP] Hemiola (sesquialtera named) |
| texture.polyrhythm | WRONG minor | "A tuplet in one hand against plain values" misses polyrhythm written without tuplets: duplets in compound time written as dotted values, two hands in 6/8 against 3/4 groupings. Detect from the onset grids per hand, not tuplet marks. | [WP] Polyrhythm; reading |
| rhythm.beat-onset-share | OK | | [import] partitura `is_downbeat` field present |
| mark.tempo-text | WRONG minor | music21's MusicXML import never makes `tempo.TempoText` from words: "Allegro" came back as a TextExpression. partitura parses it (ConstantTempoDirection "allegro"). Name partitura or TextExpression as the route. | [synthetic]; [TCL] tempo terms by grade |
| mark.tempo-change | WRONG minor | `RitardandoSpanner` and `AccelerandoSpanner` are never produced by music21's import: "rit." came back as a TextExpression. partitura's DecreasingTempoDirection works ("ritardando"). | [synthetic]; [ABRSM] tempo changes (Grade 7) |
| technique.velocity | OK | SEB's "playing speed" (tempo and shortest significant value) is a second published definition. | [JS] RT-5 "Average number of notes per second"; [SEB] Table 1 |
| technique.endurance | WRONG minor | "Duration at tempo weighted by note density" has no stated formula; two readers will compute different numbers. State it (for example notes per hand in the longest span without a rest, and that span's seconds). | reading |
| interval.melodic | OK | | [import] melodicIntervals, Interval, MelodicIntervalDiversity, features; [JS] M-1, M-9 to M-19; [OMT] intervals |
| quality.contour | OK | music21's features read a whole Part; extract each line first, as the row says. | [JS] M-22 to M-24 |
| quality.leap-recovery | OK | | [OMT] cantusFirmus: leaps of a fourth or larger followed by step in opposite direction |
| melody.tessitura | OK | | [import] Ambitus |
| melody.degree-profile | WRONG minor | `getScaleDegreeFromPitch` returns None for a chromatic note (F sharp in C); use `getScaleDegreeAndAccidentalFromPitch` (returned 4, sharp). JS P-34 to P-37 are first and last pitch, not degree. | [import] both calls on an instance; [JS] P-34 to P-37 names |
| melody.chord-relation | OK | The classical types are new beyond RULES-harmony; OMT defines them. | [rules-H] melody.chord-relation; [OMT] embellishingTones has passing, neighbor, appoggiatura, suspension, escape, anticipation |
| melody.motif-repetition | OK | | [import] approximateNoteSearch, rhythmicSearch |
| melody.sequence | WRONG minor | OMT-schemataContinuationPatterns defines the Fonte, Monte and Ponte schemata, not sequence in general, and has no descending-fifths or ascending 5-6 text. Cite a sequence definition (Kostka and Payne, or OMT's sequence pages). | [OMT] keyword counts: "fifths" 0, "5-6" 0 |
| technique.written-ornament | OK | | [JS] M-21 definition (short note between notes three times longer) |
| harmony.chord-quality | WRONG material | `ChordSymbol.chordKind` drops added and altered tones: "C7b9" gives dominant-seventh, "Cadd9" gives major, text "C5" gives an empty kind. Read `getChordStepModifications()` (it returned add 9) beside `chordKind`. `Chord.quality` reports the triad only (Cmaj7 gave "major"). As written, add9 and every altered extension would be counted as their plain chords. | [import] instances probed |
| harmony.inversion | WRONG minor | OMT-triads has no inversion text (count 0); cite OMT's inversion page or Kostka and Payne. | [OMT] triads; [import] `Chord.inversion()` |
| harmony.roman | WRONG material | RULES-harmony rejected `roman.romanNumeralFromChord` ("names a C7 in C as Ib753") and uses its own jazz-style numerals. The row names the rejected call; following it changes every numeral. Name the rules page's numerals. | [rules-H] "Numerals" paragraph |
| harmony.progression | WRONG minor | RULES-harmony defines I-IV-V, V-I, ii-V-I, four named loops and rhythm changes; descending fifths, lament bass and plagal progressions have no rule yet. A lament bass is a bass-line pattern (descending tetrachord), better read from the bass than from numerals. | [rules-H] harmony.progression; [OMT] popRockHarmony mentions doo-wop, lament, plagal once each |
| harmony.applied | WRONG minor | RULES-harmony: pivot chords "NOT DONE" (they need key.change); Neapolitan and modal mixture have no rule; "gospel passing chords" is undefined. Pivot chords need an agent ("both"), not code alone. | [rules-H] harmony.applied; [OMT] alteredSubdominants, modalMixture; [import] augmented-sixth methods |
| harmony.cadence | WRONG minor | OMT-cadenceTypes defines PAC, IAC and HC only (plagal, deceptive, Phrygian: count 0). RULES-harmony has no Phrygian half and finds cadences only at notated ends. "Half (imperfect)" beside "imperfect authentic" will confuse: name the British terms once (imperfect = half, interrupted = deceptive). | [OMT] cadenceTypes text; [rules-H] harmony.cadence |
| harmony.chromatic-share | OK | Say whether the harmonic-minor V and vii° count as diatonic. | reading |
| harmony.rhythm | WRONG material | `Stream.chordify` change points are every new onset in any voice, passing notes included, so they overcount chord changes. Read the chord timeline of RULES-harmony (symbols, else the Pardo-Birmingham segments). OMT-harmonicSyntax1 has no "harmonic rhythm" text (count 0). | [rules-H] shared analysis; [OMT] harmonicSyntax1 |
| harmony.chord-vocabulary | OK | | reading |
| harmony.voicing | WRONG minor | RULES-harmony defines quartal, shell, guide tones, rootless, close and open only; upper structure, drop-2, locked hands and Bud Powell shells have no rule. Mark them as to be written. | [rules-H] harmony.voicing |
| harmony.voice-leading | OK | | [import] VoiceLeadingQuartet methods |
| harmony.chord-connection | OK | | reading |
| harmony.bass-behaviour | WRONG minor | Its "pedal bass" duplicates `texture.pedal-point` with a different definition (RULES-harmony: any chord not containing the bass; RULES-texture: a whole foreign triad). Keep one. `ChordBassMotionFeature` measures root motion between printed chord symbols, not the bass line. | [rules-H]; [rules-T]; [import] the feature's docstring |
| texture.bass-walk-up | OK | | [rules-H] |
| texture.pedal-point | OK | Keep this definition, drop the duplicate in harmony.bass-behaviour. | [rules-T]; [WP] Pedal point |
| texture.type | OK | | [WP] Texture (music) |
| texture.hands-together | OK | Overlaps `coordination.synchrony-share` (bar level against onset level); keep both only if both levels are used. | [detect] handsTogether |
| texture.voice-count | OK | | [import] partitura `voice` field |
| texture.counterpoint | OK | | [import] estimate_voices |
| texture.imitation | OK | | [WP] Imitation (music) |
| texture.block-chords | OK | | [ABRSM] "2-note chords in either hand" (Grade 3), "3-part chords in either hand" (Grade 8); [JS] C-6 |
| interval.harmonic | OK | | [JS] C-1 |
| texture.double-notes | OK | | reading |
| texture.octaves | OK | | reading |
| texture.power-chord | WRONG minor | Symbols "ending in 5": music21's text parser gives "C5" an empty chordKind; read MusicXML kind `power`. From notes, root-fifth dyads are the ordinary open-fifth bass of classical music; the row needs the register or style condition to mean a power chord. | [import] "C5" chordKind '' ; `kind='power'` gives power |
| texture.broken-chord | OK | | [rules-T] |
| texture.alberti | OK | | [rules-T] |
| texture.arpeggio | OK | | [rules-T] |
| texture.waltz-bass | OK | | [rules-T] |
| texture.oom-pah | OK | | [rules-T] |
| texture.stride | OK | The figure, not the style (the rules page tags Joplin's rags); style.evidence decides "stride". | [rules-T] |
| texture.boogie-bass | OK | | [rules-T] |
| texture.walking-bass | WRONG minor | "Mostly by step" contradicts the coded rule (at least one move in eight by step) and its source (scale tones, arpeggios and chromatic runs mixed). The "to be corrected for over-match" note is stale: the 2026-10-07 movement ruling is in the code. The rule is whole-item (every bar), not per passage. | [detect] walkingBass, WALK_STEP_SHARE = 1/8 |
| texture.left-hand-pattern | WRONG material | detect.ts `leftHandPattern` tests only that the left hand strikes more than once in every bar under a right hand; nothing about repetition. The row says "any repeating left-hand figure". Either define it as the code measures (a moving left hand throughout) or add a repetition test; as written, the definition and its detector find different items. | [detect] leftHandPattern |
| texture.ostinato | WRONG material | The row counts a figure "transposed to follow the chord roots", but RULES-texture requires the figure unchanged and lists a pattern following the harmony as a near-miss. Counted as the row says, every Alberti and boogie bass is an ostinato. Keep ostinato unchanged; name the transposed riff as its own kind with its own test. | [rules-T] ostinato; [WP] Ostinato |
| texture.repeated-chords | WRONG minor | "The same chord re-struck" is narrower than the four-to-the-bar rule it absorbs (at most two chords a bar, one register; Bertini's tonic-dominant bars are positives). Restate the quarter-note kind as that rule says. | [rules-T] four-to-the-bar |
| texture.offbeat-chords | OK | | [WP] Reggae ("skank") |
| texture.charleston | OK | | [rules-R] |
| texture.montuno | OK | | [rules-R] |
| texture.tumbao | OK | | [rules-R] onsets {3/8, 3/4} |
| texture.clave | OK | | [rules-R] pulse sets checked against the standard son, rumba and bossa clave |
| texture.bossa | OK | | [rules-R] |
| texture.tango | WRONG minor | RULES-rhythm never answers present (a repeated figure is UNKNOWN; the style needs a source beyond the notes). The detector is "both", not "code". | [rules-R] texture.tango |
| texture.mazurka | OK | The rule cannot tell a polonaise (rules page); style.evidence must. | [rules-R] |
| texture.stop-time | OK | | [rules-T] (Harvard definition quoted) |
| texture.tremolo-thirds | WRONG minor | The rule finds any measured third-tremolo (Mozart K. 545 is a positive); calling it "the blues tremolo" would label Mozart as blues. Drop "blues" from the definition; style is style.evidence's. | [rules-T] tremolo-thirds |
| texture.crushed-note | WRONG minor | Same: the rule's positives include a Chopin mazurka; "the blues crushed note" mislabels them. Name the figure only. | [rules-T] crushed-note |
| texture.half-time | OK | | reading |
| texture.call-response | OK | | [WP] Call and response |
| texture.melody-in-chords | OK | | [rules-T] |
| texture.sustained | OK | | reading |
| texture.build | OK | | [rules-R] |
| texture.register-trajectory | OK | | reading |
| texture.part-roles | OK | | reading |
| texture.piano-role | OK | | [WP] Accompaniment |
| mark.extended-technique | OK | | [m21 src] `harmonic` read as a technical mark; [WP] Tone cluster |
| mark.glissando | OK | | [m21 src] glissando and slide both read into `spanner.Glissando` |
| coordination.synchrony-share | OK | | reading |
| coordination.rhythmic-independence | OK | | reading |
| coordination.unequal-rates | OK | | reading |
| coordination.articulation-conflict | OK | | reading |
| coordination.dynamic-balance | OK | | [TCL] "different dynamics for RH and LH" (Grade 8) |
| coordination.register-overlap | OK | Add both hands needing the same key at once (from technique.playability, section 2). | reading |
| coordination.pedal-with-hands | OK | | [WP] Sustain pedal |
| coordination.sustain-vs-move | OK | | reading |
| coordination.hand-interval | OK | | reading |
| texture.motion | OK | | [import] `motionType`; [OMT] motionTypes |
| texture.alternating-hands | OK | | reading |
| technique.hand-crossing | OK | | [diff] handCrossings |
| technique.scale-run | WRONG minor | RULES-texture finds diatonic, chromatic, and thirds or sixths in one hand; scales in 3rds or 6ths between the hands and in contrary motion have no rule. Mark them as to be written. | [rules-T] scale-run |
| technique.arpeggio-run | OK | | [rules-T] |
| technique.arpeggio-chord | OK | | [import] commonName, inversion |
| technique.thumb-under | OK | | [rules-T] (N = 6 reason) |
| technique.finger-independence | OK | | [rules-T] |
| technique.span | OK | | [diff] maxSpanRight/Left |
| technique.leap-size | OK | | [diff] maxLeapRight/Left |
| technique.displacement-rate | OK | A second published definition differs: Chiu and Chen's displacement rate (as RubricNet gives it) weights consecutive moves of 7 to 11 semitones 1 and an octave or more 2, with no time window. | [SEB] Table 1: displacements over an octave, under 2 beats; [RUB] |
| technique.fingering-demand | WRONG minor | Not "operational": SEB Table 1 has a fingering criterion (cost functions on intervals, with its references). Cite it. | [SEB] Table 1 |
| technique.pedal-implied | WRONG minor | A published reference exists: TCL-SR Grade 6, "pedalling required but not always marked". Cite it. | [TCL] |
| mark.dynamics | OK | | [import]; [ABRSM]; [TCL] |
| mark.hairpin | OK | | [TCL] "dim. and cresc. (as text)"; [synthetic] "cresc." read by partitura as IncreasingLoudnessDirection |
| mark.articulation | OK | | [import] all 13 classes; partitura names list read |
| mark.slur | OK | | [import] |
| mark.pedal | OK | | [m21 src] `<pedal>` read into PedalMark |
| mark.pedal-kind | WRONG minor | music21's import sets only Sustain or Sostenuto (lines 4501-4503); Soft and Silent never come from a file, and half pedal is not distinguished. Una corda is text only (partitura kept "una corda" as Words). | [m21 src]; [synthetic] |
| mark.ornament | OK | | [import]; partitura ornament names read |
| mark.arpeggiate | OK | | [m21 src] arpeggiate and non-arpeggiate read; [ABRSM] "spread chords" |
| mark.tremolo | OK | | [m21 src] `<tremolo>` read |
| mark.fermata | OK | | [ABRSM] "pause signs" (Grade 4) |
| mark.expression-text | OK | | [synthetic] words arrive as TextExpression / Words |
| expression.character | WRONG minor | Not operational: the ABRSM syllabus states it ("List A pieces are generally faster moving"; List B "more lyrical"). Cite it; List C (variety of styles) has no character, so this row is two values at most. | [ABRSM] "Pieces" paragraph |
| form.length | OK | | [import] repeat.Expander |
| form.sections | OK | | [import] Barline, RehearsalMark |
| form.phrase | OK | | [import] segmentByRests.Segmenter; [OMT] harmonicSyntax1 (phrase) |
| form.period | WRONG minor | OMT-period (Caplin) requires the consequent to restate the basic idea, so it defines the parallel kind only; "contrasting period" is not on the page. Cite a source that names both (Kostka and Payne; Green). | [OMT] period text read |
| form.twelve-bar | OK | | [rules-H] |
| form.turnaround | OK | | [rules-H] |
| form.intro-ending | OK | | reading |
| form.multi-strain | OK | | [rules-H] |
| form.thirty-two-bar | WRONG material | AABA only. The other common 32-bar chorus, ABAC (A B A C, eight bars each), is not found: the rules page itself returns "not AABA" for Fly Me to the Moon. Add ABAC as a named kind (reading; to source: Forte or Levine). | [rules-H] form.thirty-two-bar; [WP] Thirty-two-bar form names AABA only |
| form.binary-ternary | OK | | [rules-H]; [OMT] smallBinary, smallTernary, minuet |
| form.variations | OK | | [WP] Variation |
| form.sonata | OK | OMT's page does not mention sonatina; a sonatina source is still needed. | [OMT] SonataTheory-intro |
| form.rondo | OK | | [OMT] rondo (refrain, episode) |
| form.fugue | OK | | [WP] Fugue |
| form.song-sections | OK | | [OMT] popRockForm (verse, chorus, bridge, prechorus, intro) |
| style.evidence | OK | | reading |
| style.genre-label | OK | | reading |
| meta.composer-era | OK | | reading |
| meta.genre-tags | OK | | reading |
| meta.title | OK | | reading |
| meta.collection | OK | | reading |
| meta.published-grade | OK | | reading |
| meta.familiarity | OK | | reading |
| meta.arrangement | OK | | reading |
| generated.spec-declared | UNSURE | Not opened: each family's contract (`content/sources/family-contracts`) was not read, and the row's source is "still to be stated per family". Not a characteristic of the music but the generator's declared intent; keep it only as a declared input that the music rows check. | not checked |
| difficulty.reading | OK | | reading (see section 3 on derived rows) |
| difficulty.rhythm | OK | | reading |
| difficulty.pitch-navigation | OK | | reading |
| difficulty.coordination | OK | | reading |
| difficulty.technique | OK | | reading |
| difficulty.harmonic-load | OK | | reading |
| difficulty.expressive | OK | | reading |
| difficulty.perceptual | WRONG minor | Duplicates difficulty.reading's input (`reading.visual-density`); "rhythmic ambiguity" has no row to read. Merge into difficulty.reading or name its own inputs. | reading |
| difficulty.level | OK | | reading |
| difficulty.local-profile | OK | | reading |
| quality.coherence | WRONG minor | No criteria, so two agents will not answer alike. Give the agent a checklist (phrase arrivals, cadences, motif reuse, no stray rests). | reading |
| quality.idiomatic | WRONG minor | Same: give criteria (for the piano: reachable spans, no hand collisions, pedal-able textures; for style: the style.evidence rows). | reading |

## 2. Section 2: the 68 merged and retired rows

| id | disposition | verdict | reason |
| --- | --- | --- | --- |
| prereq.untaught-demands | retired | OK | A curriculum relation, made at assignment. |
| prereq.taught-set-generated | retired | OK | The same, for generated families. |
| clef.treble | merged into notation.clefs | OK | |
| clef.bass | merged into notation.clefs | WRONG minor | detect.ts `bassClef` locates the notes read on the bass staff (reading in the bass clef), not the clef's presence. notation.clefs must report notes per clef per staff to keep it. |
| notation.bars | merged into form.length | OK | |
| rhythm.eighths | merged into rhythm.values | OK | Each value counted separately, as the row says. |
| rhythm.shorter-than-quarter | merged into rhythm.values | OK | Derivable from the per-value counts. |
| rhythm.sixteenths | merged into rhythm.values | OK | |
| rhythm.ties-across-bar | merged into rhythm.ties | OK | |
| metre.compound | merged into metre.class | OK | 3/8 is named apart, as detect.ts treats it. |
| metre.three-four | merged into metre.class | OK | notation.times keeps 3/4 itself; simple triple alone would join 3/4 and 3/2. |
| metre.odd | merged into metre.class | OK | Subject to the metre.class grouping fix. |
| interval.step | merged into interval.melodic | OK | The step (2nd) is named in the merged row. |
| interval.skip | merged into interval.melodic | OK | The skip (3rd) is named. |
| interval.leap | merged into interval.melodic | OK | Leap = 4th and beyond, derivable from the named sizes; read the generic (letter) size as detect.ts does. |
| key.signature | merged into notation.keys | WRONG minor | detect.ts `keySignature` locates the notes the signature alters; that is key.signature-exercised's content, the right merge target. |
| key.transposition-cost | retired | OK | An item-by-key relation; AB-116 (transposing at the keyboard) is served by five-finger, chromatic and range rows on the item. Phase 2 must record the method for AB-116. |
| range.beyond-position | merged into technique.five-finger | OK | Its negation. |
| key.set-membership | retired | OK | A list test; AB-232 (a key for a voice) is served by melody.tessitura. |
| harmony.modal | merged into scale.collection | OK | |
| texture.held-under-moving | merged into technique.finger-independence | OK | |
| texture.four-to-the-bar | merged into texture.repeated-chords | WRONG minor | The rule allows two chords a bar in one register; the new row says "the same chord". Keep the rule's definition for the quarter-note kind (section 1). |
| texture.two-voice | merged into texture.counterpoint | OK | |
| texture.hand-independence | merged into coordination.rhythmic-independence | OK | |
| coordination.interaction | merged into difficulty.coordination | OK | "Easy parts hard together" is in the merged row. |
| technique.playability | merged into technique.span | WRONG minor | The yaml named span, overlap and range. Range went to hands.per-bar-range; the overlap (both hands needing the same keys at once) went nowhere. Add it to coordination.register-overlap. |
| difficulty.features | retired | OK | Each of the 19 features maps to a named row (mapping checked against FEATURE_NAMES). |
| difficulty.tempo | merged into technique.velocity | OK | |
| difficulty.endurance | merged into technique.endurance | OK | |
| difficulty.grade-calibration | merged into difficulty.level | OK | |
| target.prevalence | retired | OK | The output convention's count. |
| target.distribution | retired | OK | The convention's positions. |
| target.concentration | retired | OK | Computed from positions; its threshold is a rule. |
| target.salience | retired | WRONG minor | The convention reports bar, beat and hand, but salience also needs where a note sits in a chord (top, inner, bottom: "buried in a chord"). Add that to the output convention. |
| target.isolation | retired | OK | |
| target.interaction | retired | OK | |
| item.continuity | merged into form.phrase | OK | |
| item.progression | retired | OK | Computed from positions. |
| target.representativeness | retired | OK | Made at assignment. |
| transfer.distance | retired | OK | Made at assignment. |
| role.suitability | retired | OK | A placement decision. |
| generated.spec-interpreted | merged into generated.spec-declared | OK | |
| generated.spec-complete | retired | OK | A contract check. |
| generated.spec-vs-actual | retired | OK | Done by reading this list's rows on the file. |
| generated.identity | retired | OK | Build reproducibility. |
| integrity.key-consistency | retired | OK | The musical fact is key.tonic-mode against notation.keys. |
| integrity.bar-duration | retired | OK | A file check with code. |
| integrity.truncation | retired | OK | A file check with code. |
| integrity.repeat-structure | retired | OK | A file check with code. |
| integrity.title-structure | retired | OK | |
| integrity.grace-density | retired | OK | A renderer limit. |
| integrity.render | retired | OK | |
| integrity.duplicate-version | retired | OK | |
| integrity.extra-parts | merged into item.format | OK | |
| integrity.transposing-part | retired | WRONG minor | The reason given (transposing-instrument writing is out of scope) is about a skill; the check is about file correctness: a part in written pitch would put wrong pitches in front of the learner. It has no code (yaml: MISSING), so retiring it here drops it from every list. Keep it on a named build-check list. |
| integrity.lead-sheet-shape | merged into item.format | OK | |
| integrity.piano-range | merged into hands.per-bar-range | OK | |
| integrity.hand-span | merged into technique.span | OK | |
| integrity.notation-sanity | retired | WRONG material | No code exists (yaml: MISSING), so "stays a build check" keeps nothing. Misspelt notes (A sharp for B flat in F major) and wrong beaming in a PDMX file teach wrong reading; the owner's rule is never to teach wrong. It must stay tracked, here or on a written build-check list. |
| integrity.metadata-trust | retired | WRONG minor | The list's Conventions do not say that every meta.* value carries its provenance; only meta.genre-tags mentions it. Write it into the Conventions. |
| integrity.arrangement-fidelity | merged into meta.arrangement | OK | |
| style.good-example | retired | OK | A judgement at assignment. |
| quality.phrase-shape | merged into form.phrase | WRONG minor | Its code measures a beginning and an arrival (`musical_evaluator.py` beginning, arrival). form.phrase keeps the arrival (stable degree) and loses the beginning. Add it, or say quality.coherence owns it. |
| quality.rests | merged into form.phrase | OK | Rests at boundaries are in form.phrase; misplaced rests fall to quality.coherence. |
| quality.cadence-close | merged into form.phrase | OK | |
| quality.reference-distribution | retired | OK | A validation method. |
| quality.pedagogical-fit | retired | OK | A placement judgement. |
| meta.generator-params | merged into generated.spec-declared | OK | |

## 3. The drafter's flagged calls

- **interval.step, skip and leap into one histogram row: right.** The step (2nd) and skip (3rd) are named sizes in interval.melodic, and a leap is every size from the 4th up, so nothing is lost as long as the row reports generic (letter) size from spelling, as music21's `Interval.generic` does and detect.ts does.
- **metre.* into metre.class: right,** once the grouping rule for 5/8 and 7/8 is stated (section 1, metre.class). notation.times keeps the exact signature.
- **rhythm.eighths and sixteenths into rhythm.values: right.**
- **key.signature into notation.keys: wrong target** (section 2). Its code locates the notes the signature alters, which is key.signature-exercised.
- **texture.four-to-the-bar into texture.repeated-chords: acceptable as a kind, but the definition must be the rule's** (at most two chords a bar, one register), not "the same chord".
- **Derived difficulty rows kept as characteristics: right in kind.** A level is a property of the item that the "can the learner cope" decision reads, so it belongs on the list, marked derived. Two limits: none has a calibration set yet, so each is a placeholder until Phase 2; and difficulty.perceptual duplicates difficulty.reading's input.

## 4. Findings that are not one row

- **music21's MusicXML reader drops some elements the list says it reads.** `<swing>` (TODO in the source), `<figured-bass>` (dispatched to None), the `cautionary` attribute (TODO). Tempo words, rit. and accel. arrive as TextExpression, never as TempoText or the tempo spanners. partitura parses tempo words and cresc. into its direction classes (measured on the synthetic file). A row whose only named route is one of these finds nothing.
- **Three rows' definitions disagree with the code they name as detector:** texture.left-hand-pattern, texture.ostinato, texture.walking-bass (and harmony.roman names a rejected call). Phase 2 must pick one definition per row.
- **One fact, two definitions:** pedal point (harmony.bass-behaviour against texture.pedal-point).
- **Style words in figure rows:** texture.tremolo-thirds and texture.crushed-note say "blues" while their rules find Mozart and Chopin.
- **RUB's citation** names the wrong authors in the source table.

## 5. Counts (by script, `build/audit/count_verdicts.py` over this file)

| count | value |
| --- | --- |
| section-1 rows in the list (script over characteristics-list.md) | 194 |
| section-1 verdict lines here, same ids in the same order | 194 (yes) |
| section 1: OK | 146 |
| section 1: WRONG material | 9 |
| section 1: WRONG minor | 38 |
| section 1: UNSURE | 1 |
| merged and retired rows in the list | 68 (36 merged, 32 retired) |
| section-2 verdict lines here, same ids in the same order | 68 (yes) |
| section 2: OK | 59 (merged 31, retired 28) |
| section 2: WRONG material | 1 (merged 0, retired 1) |
| section 2: WRONG minor | 8 (merged 5, retired 3) |
| section 2: UNSURE | 0 (merged 0, retired 0) |
