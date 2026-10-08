# Research list: what no code can decide yet

Generated; do not edit. Each line is one task for a research agent. A task closes when its answer is
written into the source yaml: a quoted definition, a method with its confidence, a source, a per-rung meaning.

## 1. SOURCED_RULE rows whose definition is not yet quoted (28)

Find the published definition the rule will quote; sourced examples and near-misses become its fixtures.

- `rhythm.syncopation`: target (EXISTS; pickup evidence, not a certified defect (proving run 2026-10-07 (docs/classifier/proving/2026-10-07/)): of the 83 items where the detector finds syncopation and the raw-score witness does not, 82 have it located in printed bar 1 and open with a pickup bar, and in 81 that pickup is the only place found; one (bars 80-82, no pickup) is unexplained. Whether an anacrusis counts is the definition to quote; the rule in code is T37's, written for generated phrases)
- `rhythm.equal-stream`: a continuous stream of equal note values in one hand (Hanon cells, repeated notes) (MISSING; consecutive onsets at one spacing per hand, its length; the minimum length to state; technique.scale-run is scale passages only and rhythm.sixteenths a value, not a stream)
- `range.beyond-position`: leaves a five-finger position (EXISTS; rule in code; definition of a position not quoted)
- `melody.tessitura`: the melody line's range and its weighted central range, against a stated voice range (MISSING; music21 analysis.discrete.Ambitus (checked to exist); the voice ranges to quote)
- `melody.motif-repetition`: motif reuse and variation (PARTLY; runs on generated phrases only; the repetition rule is in code, not quoted)
- `texture.register-trajectory`: register change across a section: the same idea moved down an octave, a widening or dropping register (MISSING; a trend over hands.per-bar-range per section; hands.per-bar-range is per bar and texture.build reads density and dynamics, not register (rules/rhythm.md § texture.build))
- `coordination.dynamic-balance`: melody to be brought out over accompaniment (voicing between hands) (MISSING; which staff carries the melody (detect.ts:217 melodyStaff) against the other's density and marked dynamics; the per-staff printed dynamics (different dynamics for RH and LH, an EXACT fact) to be exposed before the rule; the balance rule to quote)
- `coordination.pedal-with-hands`: pedal changes against hand motion (legato pedalling) (MISSING; mark.pedal positions against harmony.rhythm and texture.held-under-moving; the pedalling rule to quote)
- `technique.playability`: physically playable as written (span, overlap, range) (PARTLY; span and keyboard range are checkable now; a stated playability rule (max span per level, no impossible overlaps) is not written)
- `technique.pedal-implied`: the item needs pedal where none is printed: harmony changing under a held or broken-chord texture, a held bass the hand cannot keep under a moving chord, a broken chord wider than the span marked to sound together (MISSING; a pedalling rule to quote; UNKNOWN when the evidence is short; partitura durations (checked); no library. Also the concept map's 'pedal need without a printed mark' (damper-pedal, pedal, pedalling, legato-pedalling))
- `technique.written-ornament`: trills, mordents and turns written out in measured notes (no sign) (MISSING; mark.ornament reads signs and grace notes only; a figure matcher (main note, neighbour, main note at the ornament's speed) with its definition to quote)
- `form.period`: a phrase pair forming a question and an answer (antecedent and consequent: the first on a weaker cadence, the second on a stronger one, sharing an opening) (MISSING; no library; a published definition of the period to quote)
- `form.intro-ending`: bars before the form proper begins (intro) and after it (tag, coda, fine): their length and position (MISSING; music21 repeat.Coda, repeat.Fine, expressions.RehearsalMark (checked to exist); no rule)
- `form.variations`: theme and variations: sections restating one theme (MISSING; no library)
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

## 3. CALIBRATED_MODEL rows: the model, its calibration set and its confidence handling (32)

For each: the library or model, what it is calibrated against, how a confidence is produced, what the ambiguous case does (UNKNOWN, never a guess).

- `prereq.hand-assignment`: which hand plays which notes (one-staff files, cross-staff) (from notation.staves, hands.per-bar-range; PARTLY; a one-staff file takes the catalogue's declared hand; no inference from register or stems; confirming facts are hand-written rows)
- `expression.character`: fast and agile versus lyrical and expressive (ABRSM's List A and List B characters) (from technique.velocity, mark.slur, mark.tempo-text, mark.articulation; MISSING; no library; ABRSM list membership through meta.published-grade could calibrate it)
- `key.tonic-mode`: the key as sounded (vs the signature); major or minor (from notation.keys, pitch.chromatic, scale.collection; PARTLY; music21 key analysis exists but the build skips it (--no-analysis); runs only by hand; no partitura second witness; no confidence on the row)
- `key.change`: modulation, trio key change, and the new key's relation to the old (dominant, relative, other) (from notation.keys, key.tonic-mode; PARTLY; signature changes are exact; unmarked modulation needs windowed key finding (music21 floatingKey) with confidence; the new key's relation to the old (dominant, relative) is not in any output)
- `harmony.roman`: function (Roman numerals) per chord (from notation.chord-symbols, key.tonic-mode; PARTLY; written and run on the catalogue (2026-10-07), not yet checked by an independent pass; the notes path agrees with printed symbols on the root in 0.864 of the beats it resolves and leaves 6,282 of 14,397 symbol beats unresolved (jazz songs 0.54, blues songs 0.30); no second witness for the notes path (AugmentedNet not installed); the key is the shared helper, not key.tonic-mode; UNKNOWN when melody only or under 60% of beats resolve)
- `harmony.modal`: modal collection vs tonic (from scale.collection, key.tonic-mode; MISSING; pitch-class profile with confidence; tonic ambiguity is the hard part)
- `texture.two-voice`: two independent voices (from difficulty.features; PARTLY; written voices are exact; real voice independence needs partitura estimate_voices with confidence)
- `texture.counterpoint`: contrapuntal texture (from texture.two-voice, texture.motion, coordination.rhythmic-independence; MISSING; contour and rhythm independence between voices, with confidence)
- `texture.part-roles`: in a multi-part source, which part is the melody, the bass, a riff and the rhythmic engine (from integrity.extra-parts, hands.per-bar-range, texture.ostinato; MISSING; music21 instrument.Instrument per part (checked); partitura estimate_voices (checked to exist); no model or calibration set; also serves the re-staffing of PDMX items)
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
- `difficulty.tempo`: speed demand (from technique.velocity, mark.tempo-text; PARTLY; the implementation exists and the build never stores its output: 0 of 2,020 catalogue items (proving run 2026-10-07 (docs/classifier/proving/2026-10-07/)); build.py has no call site, excerpts.py runs it for the 6 excerpts' level only. Where it was run, its meaning disagreed with the raw-score witness on a share of items (span 167, leap 540, rate 151 of 2,019): which line through chords, and which hand for a one-staff file, are unspecified)
- `difficulty.endurance`: length at tempo (from form.length, technique.velocity; PARTLY; as technique.endurance)
- `difficulty.expressive`: control demanded by printed marks (from mark.dynamics, mark.hairpin, mark.articulation, mark.pedal, coordination.articulation-conflict; MISSING; counts and change rate of mark.* rows)
- `difficulty.level`: one overall level inside a rung's band (from difficulty.features; PARTLY; fitted on levels set inside this project (645 items estimated); no outside calibration; collapses the vector to one number)
- `difficulty.local-profile`: difficulty in a moving window per hand and for both hands, and its peak: where the hardest passage is (from technique.velocity, technique.leap-size, technique.fingering-demand, technique.displacement-rate; MISSING; pianoplayer 3.0.2, MIT (PyPI; not installed); Nakamura's fingering HMM trained on the PIG dataset (registration required; licence not read); segment-level difficulty from score-level labels (Ramoneda et al. 2022) is the calibration route)
- `difficulty.grade-calibration`: the level tied to a published grade (from difficulty.level; MISSING; a graded reference set (CIPI, PSyllabus: not downloaded, unchecked; Mikrokosmos-difficulty, 147 pieces in 3 levels, GitHub, no licence file); an error-rate oracle (Nakamura and Yoshii 2018: difficulty validated against annotated performance errors) is a different calibration set; stages 0-2 all sit below Grade 1 and need a method-book order instead)
- `target.interaction`: the target combined with another demand at the same onset (from target.isolation, coordination.synchrony-share; MISSING; as coordination.interaction)
- `style.evidence`: the stylistic signals: swing, cells, bass behaviour, chord vocabulary, harmonic rhythm, form, syncopation (from notation.swing-mark, harmony.chord-quality, harmony.rhythm, harmony.bass-behaviour, rhythm.syncopation, form.sections; PARTLY; no vector of style signals with confidence on the row; each signal is a row above (texture.*, rhythm.*, harmony.*))
- `style.genre-label`: a genre or track label (from style.evidence, meta.genre-tags, meta.composer-era; PARTLY; metadata only today; code can combine style.evidence with provenance into a label with confidence, never a proof)
- `quality.reference-distribution`: within the real-music reference for its level on the FABLE §5 features (from difficulty.features, melody.motif-repetition, quality.contour; MISSING; the reference set per level and the feature run (music21 or partitura, never the generator's read-back) are not built)

## 4. Rows built on INFERRED evidence by a rule or directly (27)

The rule is only as good as its inferred input: say which input, and what the item gets when that input is UNKNOWN.

- `key.minor-form`: harmonic or melodic minor in use (from key.tonic-mode)
- `key.set-membership`: tonic in a stated list (guitar keys, singable keys) (from key.tonic-mode)
- `harmony.chord-vocabulary`: the number of distinct chords in an item (a hymn on three or four chords) (from harmony.roman)
- `harmony.progression`: I-IV-V, ii-V-I, four-chord loops, rhythm changes (from harmony.roman)
- `harmony.applied`: secondary dominants, tritone subs, passing and pivot chords (from harmony.roman)
- `harmony.cadence`: cadence types at phrase ends (from harmony.roman, form.phrase)
- `harmony.chromatic-share`: share of non-diatonic chords (from harmony.roman)
- `harmony.bass-behaviour`: root motion, pedal, walking, anticipated bass (from harmony.roman, hands.per-bar-range)
- `melody.chord-relation`: chord tones on strong beats, approach notes, guide tones, blue notes, anticipations (from harmony.roman)
- `melody.degree-profile`: the scale degree of each melody note relative to the tonic: start and end degree, the set of degrees used (from key.tonic-mode)
- `technique.pedal-implied`: the item needs pedal where none is printed: harmony changing under a held or broken-chord texture, a held bass the hand cannot keep under a moving chord, a broken chord wider than the span marked to sound together (from mark.pedal, technique.span, texture.held-under-moving, coordination.sustain-vs-move, harmony.rhythm, texture.broken-chord)
- `form.period`: a phrase pair forming a question and an answer (antecedent and consequent: the first on a weaker cadence, the second on a stronger one, sharing an opening) (from form.phrase, harmony.cadence, melody.motif-repetition)
- `form.twelve-bar`: twelve-bar blues and its variants (from harmony.roman, harmony.bass-behaviour)
- `form.turnaround`: turnaround (from harmony.roman)
- `form.intro-ending`: bars before the form proper begins (intro) and after it (tag, coda, fine): their length and position (from form.sections, mark.repeat, mark.expression-text, harmony.progression)
- `form.thirty-two-bar`: AABA standards (from form.sections, melody.motif-repetition)
- `form.variations`: theme and variations: sections restating one theme (from form.sections, melody.motif-repetition, meta.title)
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

## 5. EXTERNAL rows: the outside source to obtain (11)

- `difficulty.grade-calibration`: the level tied to a published grade (MISSING; a graded reference set (CIPI, PSyllabus: not downloaded, unchecked; Mikrokosmos-difficulty, 147 pieces in 3 levels, GitHub, no licence file); an error-rate oracle (Nakamura and Yoshii 2018: difficulty validated against annotated performance errors) is a different calibration set; stages 0-2 all sit below Grade 1 and need a method-book order instead)
- `integrity.title-structure`: the title's claimed form matches the sections (EXISTS; none)
- `integrity.metadata-trust`: composer, title and tags are uploader text (PARTLY; composer matched against a table; title and tags carry no trust value on the row)
- `integrity.arrangement-fidelity`: the upload represents the real piece (MISSING; cannot be proved from the file alone)
- `style.genre-label`: a genre or track label (PARTLY; metadata only today; code can combine style.evidence with provenance into a label with confidence, never a proof)
- `meta.composer-era`: era from the composer's dates (EXISTS; matched names only; 22,111 of 36,150 PDMX rows have no composer)
- `meta.genre-tags`: uploader or collection tags (EXISTS; no trust value)
- `meta.title`: title words (carol, minuet, etude, rag) (PARTLY; title parsing exists for keys and structure; no genre words)
- `meta.collection`: the source collection (Hanon, Czerny, Joplin, MuseTrainer) (EXISTS; none)
- `meta.published-grade`: the piece (by title and composer) is on a published graded list, at what grade, from which board (MISSING; a lookup, not a model, after identity matching (which inherits integrity.metadata-trust); the ABRSM, RCM and Trinity syllabus PDFs are public; PSyllabus metadata (Zenodo, research use only); CIPI (Zenodo, restricted, non-profit academic use on request))
- `meta.familiarity`: the tune is widely known (Ode to Joy, Twinkle), so the learner can play it without the page (MISSING; no dataset found or checked; JUDGMENT unless a list is sourced; docs/review/pdmx-quarry-2026-10-05/FAMILIAR-SONG-VERDICT.md (present at HEAD) is the only witness)

## 6. JUDGMENT residuals: challenge each again (8; the splits are in judgment.md; not a ceiling)

- `form.sonata`: whether the key plan and thematic returns the code finds amount to sonata form
- `target.representativeness`: whether the located instances are the typical form of the pattern (the matcher's own definition is the first witness; near-miss fixtures the second)
- `integrity.arrangement-fidelity`: where uploads of the same work disagree, or only one exists, whether this one is a faithful arrangement (EXTERNAL where a reference edition or recording can be compared; judgment otherwise)
- `style.good-example`: whether what the code found is idiomatic for the style (the agent gets the measured voicings, attack rhythm, register and spacing, and answers only that)
- `quality.coherence`: whether the measured phrase, motif and cadence facts add up to music worth playing; stated as 'unverified as music', never heard
- `quality.idiomatic`: whether a playable, in-style passage is how a pianist would write it
- `quality.pedagogical-fit`: given every measured fact inside the rung's rule, whether this item is the one to teach with; the agent sees the facts and the open fields only
- `meta.familiarity`: whether the tune is widely known to the learner, given its title and how many uploads of it exist; no sourced list of familiar tunes

## 7. Ambiguous or duplicate concept names (74)

Each needs one meaning per rung, or a merge with its duplicate.

- `CC64`: the sustain pedal's MIDI controller, the signal the app reads and scores (3.5); the skill is legato-pedalling's row; technique.6 never mentions it; duplicates damper-pedal, sustain-pedal, pedal, pedalling
- `alberti`: duplicates alberti-bass
- `anticipation`: on jam.5 a comping rhythm (the chord pushed ahead of the beat), not a melodic non-chord tone; written comp exercises are chosen by rhythm.syncopation
- `arranging`: holiday.4, hymns.6 and chords-pop.9: the input is a written piano setting with no chord symbols, which the learner varies or re-derives; improv.9 has no item
- `articulation`: per rung: technique.4 notes, printed legato and staccato pairs (mark.articulation, mark.slur); classical.3 played, the marks absent and chosen by the player, so its items are unmarked Baroque two-voice pieces (meta.composer-era, texture.two-voice)
- `balance`: duplicate of voicing, melody-projection and tone on technique.6; the word does not occur in technique.6.md
- `bass-walk-up`: hymns and hymns.5: the learner adds walk-ups under chord-symbol hymns; the written study is a drill; texture.bass-walk-up selects only where a walk-up is written out
- `blue-note`: notes on blues.3, blues.4, blues.5; on improv.5 the learner's improvised line over a written left hand (activity)
- `blues-scale`: notes (or the Simon drill) on blues.3 and blues.4; activity on improv.5, where the item is a written left hand and the scale is what the learner improvises with
- `bossa-nova`: UNSURE (iteration 1): texture.bossa only if the rung's files write a bossa accompaniment; latin.md says the songs are mostly printed on one staff, in which case it is a style label (style.genre-label); the files were not opened
- `broken-chord`: duplicates broken-chords
- `cadences`: on theory.4 the cadence drill, identified by ear; harmony.cadence fits repertoire only
- `call-and-response`: the learner answers a phrase (improv.3, improv.4, blues.5) or plays it back (jazz.3, the Answer-the-phrase drill); texture.call-response in an item is not what these rungs teach
- `call-response`: duplicates call-and-response
- `chord-scale`: improv.6: a scale chosen per chord to improvise from; theory.7: the drill that pairs each chord with a scale; jazz.7 never mentions it
- `comping`: charleston, four-to-the-bar and voicing are what the learner produces (their own rows cover the written exercises); chords-pop.9's items print no chord symbols; latin never discusses comping
- `contrary`: duplicates contrary-motion
- `coordination`: UNSURE (iteration 1): technique.4 never discusses coordination, so its meaning cannot be read from the lesson; if it means hands together it is a score property (notes, texture.hands-together), not played
- `crushed-note`: a crush the learner makes on blue notes (blues.3; blues.4 says grinding); the printed grace (texture.crushed-note) chooses items only where one is printed and is not required
- `damper-pedal`: the pedal family (damper-pedal, pedal, pedalling, legato-pedalling, sustain-pedal, CC64): played; items are chosen by the need for pedal (harmony changing under held or broken textures, technique.pedal-implied); mark.pedal where printed, never required (3.5: many editions print none)
- `dynamic-build`: duplicate of build-and-release on rock.7
- `endurance`: per rung: technique.8 the endurance of the passage (technique.endurance); practice.4 session length and rest (activity, level-only)
- `evenness`: 4.4 and technique.5: the streams are Hanon cells and fast repeated notes, not scale runs; practice.2 never mentions it
- `finger-independence`: UNSURE (iteration 1): technique.4 never discusses it; the characteristic (a held note plus moving notes in one hand) is one narrow sense, and 4.4's sense (even weak fingers in a stream) is another; rules/texture.md reports the catalogue tagging Hanon and repeated-note exercises with it, which the rule reads absent
- `form`: both rungs name the forms: theory.9 ABA and the named forms (form.binary-ternary, form.thirty-two-bar: an item shows one of them, not both); improv.9 an ABA the learner composes (activity)
- `four-chord-loop`: per rung: chords-pop.6 and chords-pop.8 the I-V-vi-IV loop (harmony.progression); hymns.2 a hymn on three or four chords, a chord-vocabulary count (harmony.chord-vocabulary)
- `four-chord-progression`: duplicates four-chord-loop
- `guide-tones`: improv.6: the learner plays thirds and sevenths over the changes the app loops; no repertoire
- `guitar-keys`: per rung: jam, jam.5, jam.6 key.set-membership; on jam.7 the charts are in flat keys and the task is moving them to a guitar key (activity), so the right items fail the membership test
- `half-pedal`: technique.7: an exercise scored on pedal depth from the MIDI pedal; no printed sign
- `improvisation`: per rung: loop drills and the lab (improv.3, improv.6); the learner's own (improv.7, blues.9: activity, level-only); improv.9 not classified by the audit; lead sheets only on jazz.9 (lead-sheet)
- `inversions-by-ear`: theory.4's inversion drill is a reading drill; hearing is self-checked
- `key-signatures`: theory.3: naming signatures, self-checked (no drill) vs key-signature on 3.1 (reading)
- `leap`: duplicates leaps
- `left-hand`: per rung: blues.6 the driving boogie and walking patterns; holiday.7 bass then chord; latin.7 differs per piece
- `legato`: per rung: classical.4 and technique.4 printed slurs and finger legato (mark.slur); hymns.4 four voices joined with no slurs, so mark.slur would keep every hymn off: there the items are four-part hymns (texture.voice-count)
- `legato-pedalling`: change the pedal just after the new chord (3.5, technique.6); items chosen by harmony changing under held or broken textures (technique.pedal-implied); coordination.pedal-with-hands where the pedal is printed; mark.pedal optional
- `melody-projection`: duplicate of voicing, balance and tone on technique.6
- `modal-minor`: UNSURE (iteration 1): rock.4 never says modal; its figures are in A, D and E minor, and whether they use a mode (harmony.modal) or plain minor is not stated; the files were not opened
- `modes`: per rung: theory.5, theory.6, theory.7 the modes drill; improv.6 and improv.7 a note pool to improvise from (activity); jazz.8 never mentions modes; harmony.modal and scale.collection only for repertoire
- `modulation`: per rung: theory.8 and jazz.8 the modulating dictation drill (by ear); key.change fits repertoire; improv.8 and theory.9 never mention it
- `mordent`: technique.5's mordent is written out in eighth notes with no sign (technique.written-ornament reads such figures in repertoire); duplicate of ornamentation
- `octaves`: on 0.2 the octave is keyboard geography; on holiday.4 a device the learner adds (an octave under the bass), not an item property; elsewhere playing octaves
- `odd-meter`: duplicate of meter-5-4 on technique.5
- `open-voicing`: duplicates open-voicings
- `ornamentation`: technique.5's ornament is the written-out mordent drill (no sign); duplicate of mordent
- `passing-chords`: per rung: hymns.5 prints them in the symbols (notes); on hymns the learner adds them (activity)
- `pedal`: classical.5's miniatures print no pedal and the learner chooses it; same pedal family as damper-pedal
- `pedalling`: classical.4.shelf and classical.6: pedal where the page marks it or where the learner adds it; classical.8 never mentions it; same pedal family as damper-pedal
- `pentatonic-scale`: improv.4: improvising over the loop with the pentatonic, and the Answer-the-phrase drill drawn from it
- `register`: rock.7: a register change across a section (the same idea moved down an octave); holiday.4: a device the learner applies (the word is not used)
- `reharmonisation`: per rung: hymns.6 plays written arrangements with no chord symbols, the reharmonisation already printed (notes); improv.8 the learner reharmonises a lead sheet (activity, lead-sheet)
- `rhythm`: UNSURE (iteration 1): technique.5 never says which rhythm skill is meant (the word does not occur in technique.5.md); rhythm.values + rhythm.syncopation is a guess
- `riff`: duplicate of ostinato and vamp on rock.4
- `secondary-dominants`: per rung: hymns.5 printed in the symbols (notes); theory.7 and jazz.9 drills; improv.8 the learner inserts them (activity); chords-pop.8 not classified by the audit
- `seventh-chord`: technique.6 means seventh arpeggios; chords-pop.8 never discusses it
- `shell-voicings`: jazz.5 and jazz.6: the learner voices chord symbols as shells over lead sheets; the shell exercise is a drill; harmony.voicing on the written notes only where shells are printed; blues.7 never mentions shells
- `shuffle`: a played feel: blues and boogie items with eighth runs; the notated shuffle (rhythm.shuffle) optional, never required (blues.4: nothing in the notation says so); blues.6 never mentions it
- `slash-chord`: duplicates slash-chords
- `stride`: duplicate of stride-bass
- `sus`: duplicates sus-chords
- `sustain-pedal`: technique.6: pedal under a held melody note while the harmony changes; coordination.pedal-with-hands where the pedal is printed; same pedal family as damper-pedal
- `swing-eighths`: jazz tunes with eighth runs, the swing mark (notation.swing-mark) optional (jazz.5: none of this rung's pieces prints it); jazz.6 never teaches it
- `texture`: chords-pop.7 the spread (open) voicing and improv.7 the quartal voicing, both harmony.voicing; chords-pop.9 generic, the texture not named
- `tone`: classical.4.shelf: arm-weight singing tone on any melody; technique.6 never mentions it
- `transposition`: any written item in the band, transposed at the keyboard: 4.4 transposes Hanon, chords-pop.8 written songs, neither a lead sheet; theory.6 never mentions it
- `trill`: duplicates trills; technique.6's trills are written out as measured notes
- `tritone-substitution`: jazz.7 and improv.8: the learner substitutes the dominants of a lead sheet; harmony.applied only where printed; jazz.8 never mentions it
- `twelve-bar`: duplicates twelve-bar-blues
- `twelve-bar-improv`: improv.5: the written twelve-bar shuffles, left hand written and right hand improvised, not lead sheets
- `two-hand-independence`: duplicates hand-independence
- `vamp`: a repeated chord loop, not a melodic figure; on theory.5 the learner plays it (activity: a Dorian vamp); on rock.4 the lab's chord loop (the minor vamp preset), duplicating ostinato and riff
- `voice-leading`: per rung: hymns and hymns.4 four-part voice leading (harmony.voice-leading); 3.2 and chords-pop.6 smooth chord connection through inversions and common tones (harmony.inversion, harmony.chord-connection)
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

## 9. Inputs that are recordings, not scores (7 concepts, plus A3.1 and A7e.1)

- how to source recordings whose content is known: call-and-response, chord-identification, ear-training, harmonic-dictation, modulation, playing-by-ear, progressions-by-ear

## 10. Tools named but not installed or not checked

- jSymbolic2 (needs Java; not installed), MusPy, pianoplayer, AugmentedNet: not installed; quality unchecked.
- CIPI and PSyllabus graded datasets: not downloaded; existence and contents unchecked here.

