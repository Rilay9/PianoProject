# Research list: what no code can decide yet

Generated; do not edit. Each line is one task for a research agent. A task closes when its answer is
written into the source yaml: a quoted definition, a method with its confidence, a source, a per-rung meaning.

## 1. SOURCED_RULE rows whose definition is not yet quoted (62)

Find the published definition the rule will quote; sourced examples and near-misses become its fixtures.

- `rhythm.syncopation`: target (EXISTS; the rule is in code; its published definition is not quoted)
- `rhythm.secondary-rag`: three-over-four ragtime figure (MISSING; a cell matcher like cellBars, definition to quote)
- `rhythm.shuffle`: shuffle / swung long-short feel (MISSING; notated triplet-eighth or dotted figure, or a swing mark; definition to quote)
- `range.beyond-position`: leaves a five-finger position (EXISTS; rule in code; definition of a position not quoted)
- `key.minor-form`: harmonic or melodic minor in use (MISSING; raised 6th/7th degree counts in a minor key)
- `scale.collection`: pentatonic, blues scale, mode in use (MISSING; pitch-class set per passage vs music21 scale classes; which passage is the open part)
- `harmony.progression`: I-IV-V, ii-V-I, four-chord loops, rhythm changes (MISSING; sequence rules over harmony.roman, each progression quoted from a source)
- `harmony.applied`: secondary dominants, tritone subs, passing and pivot chords (MISSING; rules over harmony.roman)
- `harmony.cadence`: cadence types at phrase ends (PARTLY; needs form.phrase on PDMX; the evaluator knows its phrases by construction)
- `harmony.voicing`: shell, rootless, quartal, open, close voicings (MISSING; chord notes vs symbol root per chordal beat; each voicing type quoted)
- `harmony.bass-behaviour`: root motion, pedal, walking, anticipated bass (PARTLY; walking bass exists; root-on-beat, pedal point and anticipation do not)
- `melody.chord-relation`: chord tones on strong beats, approach notes, guide tones, blue notes, anticipations (PARTLY; a score for generated phrases; no per-note classification; needs harmony per beat on PDMX)
- `melody.motif-repetition`: motif reuse and variation (PARTLY; runs on generated phrases only; the repetition rule is in code, not quoted)
- `texture.broken-chord`: broken-chord figures (MISSING; successive notes of one chord within a beat group)
- `texture.alberti`: Alberti bass (MISSING; low-high-middle-high broken triad in even values; quote the definition and test near-misses)
- `texture.arpeggio`: arpeggiated texture (MISSING; chord tones across more than an octave in one direction)
- `texture.waltz-bass`: bass-chord-chord in 3/4 (MISSING; quote and match)
- `texture.oom-pah`: duple bass-chord (MISSING; quote and match)
- `texture.stride`: stride left hand (MISSING; oom-pah with a wide bass-to-chord distance; quote)
- `texture.boogie-bass`: boogie left hand (MISSING; repeated eighth figure on each chord root over the form)
- `texture.ostinato`: riff, vamp, ostinato (MISSING; a figure repeated unchanged N bars (music21 search))
- `texture.pedal-point`: pedal bass (MISSING; bass pitch held or repeated under changing harmony)
- `texture.four-to-the-bar`: comp on every beat (MISSING; chords on each beat in 4/4)
- `texture.charleston`: the Charleston comp rhythm (MISSING; an onset cell like habanera (cellBars))
- `texture.montuno`: montuno (MISSING; syncopated repeated figure aligned to a clave; quote)
- `texture.tumbao`: tumbao (MISSING; anticipated bass cell; quote)
- `texture.clave`: son or rumba clave (MISSING; onset sets, 3-2 and 2-3; quote)
- `texture.bossa`: bossa accompaniment (MISSING; bass cell plus comp cell; quote (G14 contract names it))
- `texture.tango`: tango accompaniment (MISSING; marcato in four, 3-3-2, arrastre (A7c.4); quote)
- `texture.mazurka`: mazurka rhythm (MISSING; quote and match)
- `texture.stop-time`: stop-time bars (MISSING; a hit on 1 then silence)
- `texture.tremolo-thirds`: blues tremolo in thirds (MISSING; alternating notes a third apart, or a tremolo mark)
- `texture.crushed-note`: blues crushed note (MISSING; grace a semitone below a chord tone)
- `texture.melody-in-chords`: melody as the top voice of chords (MISSING; top note of each chord forms the melody line)
- `texture.build`: rising density and dynamics across a section (MISSING; density and dynamic trend per section)
- `texture.bass-walk-up`: stepwise bass into the next root (MISSING; two to four stepwise bass notes into a chord root)
- `coordination.dynamic-balance`: melody to be brought out over accompaniment (voicing between hands) (MISSING; which staff carries the melody (detect.ts:217 melodyStaff) against the other's density and marked dynamics; the balance rule to quote)
- `coordination.pedal-with-hands`: pedal changes against hand motion (legato pedalling) (MISSING; mark.pedal positions against harmony.rhythm and texture.held-under-moving; the pedalling rule to quote)
- `technique.scale-run`: scale passages, incl. in 3rds/6ths, chromatic (MISSING; N stepwise notes one direction per hand; N to quote)
- `technique.arpeggio-run`: arpeggio passages (MISSING; chord tones across two or more octaves)
- `technique.five-finger`: stays in a five-finger position (PARTLY; derived, not written)
- `technique.position-shift`: lateral travel between positions (PARTLY; per-bar ranges exist; shifts between bars not computed)
- `technique.finger-independence`: held note plus moving notes in one hand (MISSING; overlap within a hand)
- `technique.playability`: physically playable as written (span, overlap, range) (PARTLY; span and keyboard range are checkable now; a stated playability rule (max span per level, no impossible overlaps) is not written)
- `form.twelve-bar`: twelve-bar blues and its variants (MISSING; per-bar roots over 12 bars vs sourced variants (standard, quick IV, minor))
- `form.turnaround`: turnaround (MISSING; last two bars of a chorus back to I)
- `form.multi-strain`: rag strains and trio (PARTLY; sections exist; the 16-bar-strain-with-trio rule does not)
- `form.thirty-two-bar`: AABA standards (MISSING; 8-bar section similarity)
- `difficulty.perceptual`: visual density, unusual engraving, rhythmic ambiguity (MISSING; needs reading.visual-density and reading.unusual-notation plus a rule)
- `target.concentration`: too much of the target in one place (PARTLY; generated families only; the threshold is ours)
- `target.salience`: the target is perceivable: in the melody staff, on strong beats, not buried in a chord (PARTLY; a salience rule over staff, beat strength and chord membership of each located place)
- `item.continuity`: recovery points: rests, phrase ends, repeats (PARTLY; needs form.phrase)
- `item.progression`: starts simple and adds demands (MISSING; demand density per quarter of the item from positions)
- `transfer.distance`: controlled instance vs authentic occurrence (PARTLY; generated vs real is exact; distance between a drill's pattern and a piece's instance is not measured)
- `role.suitability`: introduction, repetition, fluency or transfer (MISSING; a rule over prevalence, isolation and transfer.distance; the rule to source)
- `integrity.hand-span`: no chord beyond a stated span (PARTLY; the value exists; the span rule per level is not written)
- `quality.phrase-shape`: a beginning and an arrival (PARTLY; runs on generated phrases (one definition shared with app/src/engine/sightReadingScore.ts); nothing on PDMX; rules in code, not quoted)
- `quality.contour`: contour shape, reversals, oscillation (PARTLY; as quality.phrase-shape)
- `quality.rests`: rests placed musically (PARTLY; as quality.phrase-shape)
- `quality.leap-recovery`: leaps resolved by step (PARTLY; as quality.phrase-shape)
- `quality.cadence-close`: phrase ends on a stable degree with a cadence (PARTLY; as quality.phrase-shape)
- `meta.composer-era`: era from the composer's dates (EXISTS; matched names only; 22,111 of 36,150 PDMX rows have no composer)

## 2. Existing rules whose source must be checked (4)

- `rhythm.habanera`: read `app/src/demands/detect.ts:628 habaneraCell; :319 cellBars` and its tests for the quoted definition and sourced near-misses.
- `rhythm.tresillo`: read `app/src/demands/detect.ts:635 tresilloCell; :319 cellBars` and its tests for the quoted definition and sourced near-misses.
- `texture.left-hand-pattern`: read `app/src/demands/detect.ts:588 leftHandPattern` and its tests for the quoted definition and sourced near-misses.
- `texture.walking-bass`: read `app/src/demands/detect.ts:607 walkingBass` and its tests for the quoted definition and sourced near-misses.

## 3. CALIBRATED_MODEL rows: the model, its calibration set and its confidence handling (29)

For each: the library or model, what it is calibrated against, how a confidence is produced, what the ambiguous case does (UNKNOWN, never a guess).

- `prereq.hand-assignment`: which hand plays which notes (one-staff files, cross-staff) (from notation.staves, hands.per-bar-range; PARTLY; a one-staff file takes the catalogue's declared hand; no inference from register or stems; confirming facts are hand-written rows)
- `key.tonic-mode`: the key as sounded (vs the signature); major or minor (from notation.keys, pitch.chromatic, scale.collection; PARTLY; music21 key analysis exists but the build skips it (--no-analysis); runs only by hand; no partitura second witness; no confidence on the row)
- `key.change`: modulation, trio key change (from notation.keys, key.tonic-mode; PARTLY; signature changes are exact; unmarked modulation needs windowed key finding (music21 floatingKey) with confidence)
- `harmony.roman`: function (Roman numerals) per chord (from notation.chord-symbols, key.tonic-mode; PARTLY; from symbols with a key it is near-exact (music21 romanNumeralFromChord); from notes it needs confidence; nothing runs on PDMX)
- `harmony.modal`: modal collection vs tonic (from scale.collection, key.tonic-mode; MISSING; pitch-class profile with confidence; tonic ambiguity is the hard part)
- `texture.two-voice`: two independent voices (from difficulty.features; PARTLY; written voices are exact; real voice independence needs partitura estimate_voices with confidence)
- `texture.counterpoint`: contrapuntal texture (from texture.two-voice, texture.motion, coordination.rhythmic-independence; MISSING; contour and rhythm independence between voices, with confidence)
- `texture.half-time`: half-time feel (from mark.articulation, harmony.bass-behaviour, rhythm.syncopation; MISSING; backbeat placement inferred from accents and bass; low confidence from a score)
- `texture.call-response`: answering phrases (from form.phrase, hands.per-bar-range, texture.alternating-hands; MISSING; needs form.phrase and register or hand alternation; confidence)
- `coordination.interaction`: easy parts that are hard together (from target.isolation, coordination.synchrony-share, coordination.unequal-rates; MISSING; co-occurrence of per-hand demands at the same onsets, scored with confidence; no oracle for 'hard together' without a fingering or motor model)
- `technique.thumb-under`: runs needing thumb-under (from technique.scale-run; MISSING; a fingering estimator (pianoplayer: not installed, unchecked) or a run-length proxy)
- `technique.endurance`: duration at tempo times density (from form.length, technique.velocity; PARTLY; duration exists where rendered; no density-weighted value)
- `technique.fingering-demand`: fingering difficulty: substitutions, stretches, awkward sequences (from mark.fingering, technique.span, technique.leap-size; MISSING; a fingering solver plus a hand model; printed fingering (mark.fingering) is a partial witness)
- `form.phrase`: phrase boundaries (recovery points, cadences, shaping) (from rhythm.values, melody.motif-repetition, mark.repeat, harmony.roman; PARTLY; rest, long-note and cadence evidence exist in the proposer; no phrase segmentation with confidence on PDMX)
- `difficulty.reading`: reading load component (from difficulty.features, reading.visual-density, reading.accidental-churn; PARTLY; the inputs exist; no component value is computed or stored)
- `difficulty.rhythm`: rhythmic load component (from rhythm.values, rhythm.syncopation, rhythm.triplets; PARTLY; as difficulty.reading)
- `difficulty.pitch-navigation`: range, leaps, shifts, black keys (from hands.per-bar-range, technique.leap-size, technique.position-shift; PARTLY; as difficulty.reading; position shifts not computed)
- `difficulty.coordination`: hands-together load (from coordination.synchrony-share, coordination.rhythmic-independence, coordination.unequal-rates, texture.polyrhythm, texture.motion; MISSING; needs texture.hand-independence)
- `difficulty.technique`: spans, simultaneous notes, crossings, ornaments, repeated notes (from technique.span, texture.block-chords, technique.hand-crossing, mark.ornament, rhythm.repeated-notes; PARTLY; no component value; repeated notes missing)
- `difficulty.harmonic-load`: chord changes per bar, chromatic share (from harmony.rhythm, harmony.chromatic-share; MISSING; needs harmony.rhythm and harmony.chromatic-share)
- `difficulty.tempo`: speed demand (from technique.velocity, mark.tempo-text; EXISTS; untrusted on defaulted tempos)
- `difficulty.endurance`: length at tempo (from form.length, technique.velocity; PARTLY; as technique.endurance)
- `difficulty.expressive`: control demanded by printed marks (from mark.dynamics, mark.hairpin, mark.articulation, mark.pedal, coordination.articulation-conflict; MISSING; counts and change rate of mark.* rows)
- `difficulty.level`: one overall level inside a rung's band (from difficulty.features; PARTLY; fitted on levels set inside this project (645 items estimated); no outside calibration; collapses the vector to one number)
- `difficulty.grade-calibration`: the level tied to a published grade (from difficulty.level; MISSING; a graded reference set (CIPI, PSyllabus: not downloaded, unchecked); stages 0-2 all sit below Grade 1 and need a method-book order instead)
- `target.interaction`: the target combined with another demand at the same onset (from target.isolation, coordination.synchrony-share; MISSING; as coordination.interaction)
- `style.evidence`: the stylistic signals: swing, cells, bass behaviour, chord vocabulary, harmonic rhythm, form, syncopation (from notation.swing-mark, harmony.chord-quality, harmony.rhythm, harmony.bass-behaviour, rhythm.syncopation, form.sections; PARTLY; no vector of style signals with confidence on the row; each signal is a row above (texture.*, rhythm.*, harmony.*))
- `style.genre-label`: a genre or track label (from style.evidence, meta.genre-tags, meta.composer-era; PARTLY; metadata only today; code can combine style.evidence with provenance into a label with confidence, never a proof)
- `quality.reference-distribution`: within the real-music reference for its level on the FABLE §5 features (from difficulty.features, melody.motif-repetition, quality.contour; MISSING; the reference set per level and the feature run (music21 or partitura, never the generator's read-back) are not built)

## 4. Rows built on INFERRED evidence by a rule or directly (21)

The rule is only as good as its inferred input: say which input, and what the item gets when that input is UNKNOWN.

- `key.minor-form`: harmonic or melodic minor in use (from key.tonic-mode)
- `key.set-membership`: tonic in a stated list (guitar keys, singable keys) (from key.tonic-mode)
- `harmony.progression`: I-IV-V, ii-V-I, four-chord loops, rhythm changes (from harmony.roman)
- `harmony.applied`: secondary dominants, tritone subs, passing and pivot chords (from harmony.roman)
- `harmony.cadence`: cadence types at phrase ends (from harmony.roman, form.phrase)
- `harmony.chromatic-share`: share of non-diatonic chords (from harmony.roman)
- `harmony.bass-behaviour`: root motion, pedal, walking, anticipated bass (from harmony.roman, hands.per-bar-range)
- `melody.chord-relation`: chord tones on strong beats, approach notes, guide tones, blue notes, anticipations (from harmony.roman)
- `form.twelve-bar`: twelve-bar blues and its variants (from harmony.roman, harmony.bass-behaviour)
- `form.turnaround`: turnaround (from harmony.roman)
- `form.thirty-two-bar`: AABA standards (from form.sections, melody.motif-repetition)
- `form.sonata`: sonata or sonatina form (from the file)
- `item.continuity`: recovery points: rests, phrase ends, repeats (from form.phrase, rhythm.values, mark.repeat)
- `integrity.key-consistency`: signature agrees with the notes (from notation.keys, key.tonic-mode)
- `integrity.truncation`: the file is not cut short (from notation.bars, form.sections)
- `integrity.duplicate-version`: several uploads of one work; containment of one in another (from meta.title, notation.bars)
- `integrity.notation-sanity`: spelling, beaming, voices, accidental churn as engraved (from reading.accidental-churn, texture.two-voice)
- `style.good-example`: a good teaching example of style X (from the file)
- `quality.coherence`: the item hangs together as music (from the file)
- `quality.idiomatic`: idiomatic for the instrument and style (from the file)
- `quality.pedagogical-fit`: a good introduction, consolidation or transfer item for this rung (from the file)

## 5. EXTERNAL rows: the outside source to obtain (9)

- `difficulty.grade-calibration`: the level tied to a published grade (MISSING; a graded reference set (CIPI, PSyllabus: not downloaded, unchecked); stages 0-2 all sit below Grade 1 and need a method-book order instead)
- `integrity.title-structure`: the title's claimed form matches the sections (EXISTS; none)
- `integrity.metadata-trust`: composer, title and tags are uploader text (PARTLY; composer matched against a table; title and tags carry no trust value on the row)
- `integrity.arrangement-fidelity`: the upload represents the real piece (MISSING; cannot be proved from the file alone)
- `style.genre-label`: a genre or track label (PARTLY; metadata only today; code can combine style.evidence with provenance into a label with confidence, never a proof)
- `meta.composer-era`: era from the composer's dates (EXISTS; matched names only; 22,111 of 36,150 PDMX rows have no composer)
- `meta.genre-tags`: uploader or collection tags (EXISTS; no trust value)
- `meta.title`: title words (carol, minuet, etude, rag) (PARTLY; title parsing exists for keys and structure; no genre words)
- `meta.collection`: the source collection (Hanon, Czerny, Joplin, MuseTrainer) (EXISTS; none)

## 6. JUDGMENT residuals: challenge each again (7; the splits are in judgment.md; not a ceiling)

- `form.sonata`: whether the key plan and thematic returns the code finds amount to sonata form
- `target.representativeness`: whether the located instances are the typical form of the pattern (the matcher's own definition is the first witness; near-miss fixtures the second)
- `integrity.arrangement-fidelity`: where uploads of the same work disagree, or only one exists, whether this one is a faithful arrangement (EXTERNAL where a reference edition or recording can be compared; judgment otherwise)
- `style.good-example`: whether what the code found is idiomatic for the style (the agent gets the measured voicings, attack rhythm, register and spacing, and answers only that)
- `quality.coherence`: whether the measured phrase, motif and cadence facts add up to music worth playing; stated as 'unverified as music', never heard
- `quality.idiomatic`: whether a playable, in-style passage is how a pianist would write it
- `quality.pedagogical-fit`: given every measured fact inside the rung's rule, whether this item is the one to teach with; the agent sees the facts and the open fields only

## 7. Ambiguous or duplicate concept names (21)

Each needs one meaning per rung, or a merge with its duplicate.

- `CC64`: CC64 is the sustain pedal's MIDI controller; duplicates damper-pedal, sustain-pedal, pedal, pedalling
- `alberti`: duplicates alberti-bass
- `broken-chord`: duplicates broken-chords
- `call-response`: duplicates call-and-response
- `contrary`: duplicates contrary-motion
- `form`: generic on theory.9 and improv.9; the form meant is not named
- `four-chord-progression`: duplicates four-chord-loop
- `key-signatures`: theory.3 drill vs key-signature on 3.1 (reading)
- `leap`: duplicates leaps
- `left-hand`: on blues.6, holiday.7 and latin.7 the left-hand skill meant is not named
- `legato`: printed slurs are measurable; legato touch is played
- `octaves`: on 0.2 the octave is keyboard geography; elsewhere playing octaves
- `open-voicing`: duplicates open-voicings
- `rhythm`: generic on technique.5; the rhythm skill meant is not named
- `slash-chord`: duplicates slash-chords
- `sus`: duplicates sus-chords
- `texture`: generic on chords-pop.7, improv.7, chords-pop.9; the textures meant are not named
- `trill`: duplicates trills
- `twelve-bar`: duplicates twelve-bar-blues
- `two-hand-independence`: duplicates hand-independence
- `voicing`: on classical.4.shelf and technique.6 voicing means bringing out a voice (played); on jazz and chords-pop rungs it means chord voicing (notes)

## 8. Place rules with no source

- track `core`: stages 0-4 by difficulty and taught set; no signature of its own
- track `classical`: composer era from composers.json, or a classical form or dance; unknown composer stays UNKNOWN
- track `chords-pop`: played from chord symbols: symbols present, or a written part that reduces to a chord-symbol accompaniment
- track `blues-boogie`: twelve-bar form, with shuffle or boogie left hand
- track `jazz`: swing mark or swung figures, seventh-chord harmony, ii-V motion; sevenths alone are not jazz
- track `ragtime`: duple oom-pah or stride left hand under a syncopated right hand; multi-strain form for full rags
- track `theory-ear`: drills and short texts; items are generated drills chosen by their parameters
- track `improv-compose`: the learner makes the music; items are lead sheets, grooves and forms to improvise over
- track `hymns-gospel`: four-part chorale texture or a hymn tune with symbols; 'is a hymn' is metadata
- track `holiday`: an occasion: carol titles and tags only
- track `latin`: a named Latin cell or accompaniment: habanera, tresillo, clave, tumbao, montuno, bossa, tango
- track `rock-metal`: power chords, octave or pedal bass, riffs; the track's job is reducing a band song, which is metadata
- track `jam`: guitar keys and a lead-sheet form; playing with a guitarist is the activity
- track `technique`: a technical figure is the content: scale, arpeggio, double notes, octaves, trill, repeated notes
- track `practice`: lessons on method; any item at the learner's level
- stage `0`: no published grade separates stages 0-2; needs a method-book order or a beginner syllabus as reference (research)
- stage `1`: as stage 0
- stage `2`: as stage 0; initial is ABRSM's grade below Grade 1
- stage `3`: difficulty.level fitted on an outside graded set (CIPI, PSyllabus: research)
- stage `4`: as stage 3
- stage `5`: as stage 3
- stage `6`: as stage 3
- stage `7`: as stage 3
- stage `8`: as stage 3
- stage `9`: as stage 3; few graded sets reach diploma (research)

- every one of the 110 rung rules: what each rung is trying to accomplish, before any density threshold is written

## 9. Inputs that are recordings, not scores (6 concepts, plus A3.1 and A7e.1)

- how to source recordings whose content is known: ear-training, harmonic-dictation, inversions-by-ear, playing-by-ear, progressions-by-ear, reduction

## 10. Tools named but not installed or not checked

- jSymbolic2 (needs Java; not installed), MusPy, pianoplayer, AugmentedNet: not installed; quality unchecked.
- CIPI and PSyllabus graded datasets: not downloaded; existence and contents unchecked here.

