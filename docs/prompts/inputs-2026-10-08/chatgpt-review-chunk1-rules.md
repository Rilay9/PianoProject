# PianoProject — rule-by-rule independent musical review

**Source snapshot:** `Rilay9/PianoProject`, commit `00be5cbd`, `docs/classifier/rules/area-1A.md`, `area-1B.md`, `area-1C.md`. **Scope:** all 68 individually numbered Chunk 1 rules (26 + 12 + 30), not the rest of the project. This is a critical reading of the rule specifications and recorded validation claims, **not** independent execution of the validators or model benchmarks.

**Reading standard:** The notes below distinguish exact notated evidence from inferred musical properties and from learner-facing teaching claims. A concern is not automatically a requested change: where the existing rule already preserves uncertainty, the note says to retain it. Source line references identify the beginning of each rule at the pinned commit.



## Area 1A — Score reading and notation


### 1. `item.format`

**Source:** `docs/classifier/rules/area-1A.md:31`.

**Assessment:** The format/purpose split is essential. Layout is observable; intended use (lead sheet, keyboard arrangement, hymn, exercise) is often interpretive. Current rule's false piano-score classification of Blue Bossa is consequential: preserve layout evidence, refuse a definitive piano-arrangement label when chord symbols/slashes and part names conflict. Don't let generated family metadata substitute for what the file actually contains.


### 2. `notation.staves`

**Source:** `docs/classifier/rules/area-1A.md:75`.

**Assessment:** Keep the exact structural counts. Distinguish MusicXML part count, logical staves, and pitched versus unpitched staves; none alone establishes the number of hands or instruments. The four-stave Ballade case demonstrates why counting staves as piano hands would be wrong.


### 3. `prereq.hand-assignment`

**Source:** `docs/classifier/rules/area-1A.md:95`.

**Assessment:** This is a foundational dependency, not a routine metadata read. Staff is not hand, especially with cross-staff notation, single-staff arrangements and m.s./m.d. directions. The rule currently calls unflagged note assignments exact; that is stronger than the evidence for imported repertoire. Return staff as exact and hand as declared/inferred with explicit ambiguity; propagate unresolved passages into downstream hand-based judgments.


### 4. `texture.melody-location`

**Source:** `docs/classifier/rules/area-1A.md:126`.

**Assessment:** Melody cannot be equated with the uppermost or most active line. The documented Fantaisie-Impromptu error shows an arpeggiated left hand falsely identified as melody. Require coherent melodic continuity, relative salience and accompaniment context; where voices are imitative, doubled or exchanged, report multiple candidates/UNKNOWN rather than a forced hand. The existing texture detector may provide witnesses but not certainty.


### 5. `notation.clefs`

**Source:** `docs/classifier/rules/area-1A.md:153`.

**Assessment:** Good direct notation rule, including mid-staff clefs, unusual clefs and percussion. Preserve per-staff clef state through time; never infer bass clef from staff number. Check that note counts are assigned under the clef actually in force.


### 6. `notation.clef-change`

**Source:** `docs/classifier/rules/area-1A.md:175`.

**Assessment:** The event timeline and separation of at-barline versus inside-bar are appropriate. Repeated clef declarations at system breaks should not become musical changes. A source example for restatement remains missing, but it is a narrow edge case, not a reason for another research phase.


### 7. `pitch.ledger`

**Source:** `docs/classifier/rules/area-1A.md:195`.

**Assessment:** Ledger demand depends on written display pitch and active clef, not sounding MIDI pitch. The rule appropriately excludes anomalous extreme positions, but its fixed limit risks treating difficult legitimate notation as an encoding defect. Preserve the actual ledger count and flag suspect values separately; don't silently erase the learner-visible demand.


### 8. `mark.ottava`

**Source:** `docs/classifier/rules/area-1A.md:217`.

**Assessment:** Two independent readings are useful, but agreement between parsers reading the same ambiguous encoding does not prove the printed octave. Separate written ottava spans, rendered location, and sounding transposition; words-only 8va and unclosed spans require UNKNOWN where they affect downstream ledger/range demands.


### 9. `notation.keys`

**Source:** `docs/classifier/rules/area-1A.md:241`.

**Assessment:** Keep exact key-signature event data, including per-staff and nontraditional cases. A printed signature is not the composition's tonic or mode. Consumers must not silently equate fifths with tonal center.


### 10. `key.signature-exercised`

**Source:** `docs/classifier/rules/area-1A.md:263`.

**Assessment:** Counting notes that actually use signature alterations is more meaningful than merely counting printed sharps/flats. However, shown/restated/cancelled accidentals depend on renderer behavior and on the unresolved accidental rule. Keep the pitch-level counts exact and display-related splits conditional.


### 11. `pitch.chromatic`

**Source:** `docs/classifier/rules/area-1A.md:285`.

**Assessment:** The classification is key-relative and inherits the uncertain tonic/mode detector. A blue note, altered dominant or borrowed harmony may be pedagogically chromatic without being a notational error. Preserve pitch-class/alteration facts independently and avoid using UNKNOWN key to discard those facts.


### 12. `reading.accidental-kinds`

**Source:** `docs/classifier/rules/area-1A.md:307`.

**Assessment:** The rule is specifically about what the learner sees. MusicXML <accidental> elements are evidence, not the final authority for OSMD output; generated naturals, courtesy marks, suppressed marks and tied continuations must be checked against actual rendered notation. This is a demonstrated failure, so revise the output to distinguish encoded, required and displayed symbols.


### 13. `reading.accidental-churn`

**Source:** `docs/classifier/rules/area-1A.md:329`.

**Assessment:** The per-position alteration-return measure is a reasonable objective statistic. It is not equivalent to visible accidental churn when OSMD omits or adds glyphs, and a single position may change spelling enharmonically. Keep the event definition explicit and derive visual churn only after the display rule is settled.


### 14. `reading.visual-density`

**Source:** `docs/classifier/rules/area-1A.md:347`.

**Assessment:** A per-staff/per-bar feature table is useful; a single density score should not masquerade as reading difficulty. Accidentals, ledger lines, simultaneous noteheads and onsets have different perceptual costs. The current shown-accidental dependency needs corrected renderer data; preserve components rather than inventing weights.


### 15. `reading.unusual-notation`

**Source:** `docs/classifier/rules/area-1A.md:367`.

**Assessment:** Counting unusual constructs is sensible, but distinguish exact encoded structures from visual oddities and corrupt exports. Cue notes, cross-staff beams, hidden noteheads and nested tuplets do not have equal teaching implications. No validated nested-tuplet positive is noted; avoid certifying that subcase until a real example is checked.


### 16. `reading.pitch-entropy`

**Source:** `docs/classifier/rules/area-1A.md:387`.

**Assessment:** Shannon entropy of sounding pitches is a reproducible descriptor, not a validated sight-reading difficulty metric. Octave distribution, sequence predictability and hand position matter independently. Preserve the numeric feature and do not use a high value alone to block a learner.


### 17. `reading.redundancy`

**Source:** `docs/classifier/rules/area-1A.md:409`.

**Assessment:** Lempel-Ziv over pitch-set onsets can identify repetition, but it is sensitive to transposition, voicing and encoding; familiar transposed sequences can appear nonredundant. Keep the metric descriptive and consider interval-normalized repetition only if a concrete teaching use needs it. The eight-onset UNKNOWN floor is a reporting convention, not a musical law.


### 18. `notation.turn-opportunity`

**Source:** `docs/classifier/rules/area-1A.md:429`.

**Assessment:** Potential rest/hold spans are directly measurable, but whether a pianist can turn a page depends on which hand is free, tempo, physical reach and page layout. The rule correctly leaves 'long enough' UNKNOWN without a sourced threshold. Do not turn a duration into a guaranteed page-turn opportunity.


### 19. `mark.fingering`

**Source:** `docs/classifier/rules/area-1A.md:449`.

**Assessment:** Distinguishing explicit fingering elements from digits in words is sound. Printed finger numbers are not proof of actual fingering, and imported digits can be non-piano annotations. Keep source and confidence, with a separate not-piano state.


### 20. `notation.lyrics`

**Source:** `docs/classifier/rules/area-1A.md:480`.

**Assessment:** Direct lyric presence/count is straightforward. Absence of encoded lyrics does not mean a tune lacks words; the Silent Night example demonstrates this. A syllable stream can help identify a melodic line but should not certify melody on its own.


### 21. `notation.chord-symbols`

**Source:** `docs/classifier/rules/area-1A.md:504`.

**Assessment:** The harmony timeline and duplicate removal are valuable. Role classification (over melody/accompaniment/alone) depends on the unsettled format/melody rules. Preserve exact <harmony> facts and treat free-text candidates and role labels as inferred; a duplicated symbol is not necessarily a second chord change.


### 22. `harmony.figured-bass`

**Source:** `docs/classifier/rules/area-1A.md:532`.

**Assessment:** Direct <figured-bass> extraction is preferable to music21 where its reader drops the element. Numbers in lyrics or words are weak candidates and should never certify figured bass. The absence of a positive catalogue witness means the encoded path is specified but not empirically validated here.


### 23. `mark.repeat`

**Source:** `docs/classifier/rules/area-1A.md:554`.

**Assessment:** Keep the custom counter as the best current candidate, not as proven correct. The strict benchmark still has a Carioquinha failure, and alternative counts partly follow the counter's conventions. Validate the actual ordered playback measure sequence, not only bars_played; equal counts can conceal different routes. Preserve multiple plausible interpretations/UNKNOWN.


### 24. `notation.reading-aids`

**Source:** `docs/classifier/rules/area-1A.md:581`.

**Assessment:** The aid types (note names, colored noteheads, fingering, words, lyrics) should stay distinct. File annotations do not always survive rendering or appear as intended. Counts of learner-visible aids should follow the renderer where practical; avoid equating any numeric glyph with fingering.


### 25. `notation.slash-rhythm`

**Source:** `docs/classifier/rules/area-1A.md:608`.

**Assessment:** Distinguish slash notation with and without stems, measure-style slash bars, and beat repeats. These have different implications for required reading versus improvisation. The direct-reader approach is suitable, provided slash glyphs and ordinary comping noteheads are not conflated.


### 26. `integrity.notation-sanity`

**Source:** `docs/classifier/rules/area-1A.md:630`.

**Assessment:** This is an integrity warning system, not an authoritative correction engine. Missing accidentals, enharmonic spelling and unusual beaming may be deliberate; keep exact structural anomalies separate from subjective spelling/beaming candidates. Never let an unsourced 'sanity' threshold silently rewrite the score or exclude legitimate difficult passages.


## Area 1B — Pitch, keys, and hand position


### 1. `hands.per-bar-range`

**Source:** `docs/classifier/rules/area-1B.md:30`.

**Assessment:** Whole-score compass is objective; per-hand range inherits hand-assignment uncertainty. Out-of-88 notes can be export defects, transposition or instrument mismatch, so flag rather than auto-repair. Range within a bar does not itself establish required simultaneous stretch.


### 2. `pitch.black-key-share`

**Source:** `docs/classifier/rules/area-1B.md:58`.

**Assessment:** The pitch-class calculation is objective and the C-flat/G-flat near-miss is useful. Report per-staff and overall values without treating black-key share as equivalent to hand difficulty or key familiarity. Keep staff/hand distinct.


### 3. `technique.five-finger`

**Source:** `docs/classifier/rules/area-1B.md:79`.

**Assessment:** The rule is failing because five-semitone span does not prove a stable five-finger position: chromatic double notes and shifting frames are counterexamples. A feasible fingering model can generate hypotheses, not certify the player's hand shape. For curriculum certification, require an explicit exercise design or robust passage-level evidence; otherwise UNKNOWN.


### 4. `technique.position-shift`

**Source:** `docs/classifier/rules/area-1B.md:116`.

**Assessment:** This depends on the failed frame segmentation and confuses crossings with shifts in generated cases. Do not count every frame change as a necessary physical hand relocation. Distinguish observed note-span transition, plausible finger crossing and unavoidable repositioning; the last needs fingering/ergonomic evidence.


### 5. `key.tonic-mode`

**Source:** `docs/classifier/rules/area-1B.md:144`.

**Assessment:** The current detector reportedly outperforms music21/AugmentedNet on this corpus, so retain it as a candidate. Three-model agreement is a high-confidence heuristic, not proof: correlated relative-major errors are documented. Preserve multiple candidate keys and local evidence; do not force a tonic on modal, ambiguous or polytonal music.


### 6. `key.minor-form`

**Source:** `docs/classifier/rules/area-1B.md:203`.

**Assessment:** Natural/harmonic/melodic minor are melodic-harmonic usages, not mutually exclusive piece-level key identities. The rule's per-run reading is preferable to one label for an entire composition. Avoid classifying a single raised sixth or seventh as a complete melodic-minor passage without directional/contextual evidence.


### 7. `key.change`

**Source:** `docs/classifier/rules/area-1B.md:239`.

**Assessment:** A printed signature change is exact; inferred tonal regions and modulations are not. AugmentedNet's reported 67% recall/53% precision is not sufficient to gate candidate generation alone. Give the agent a harmonic timeline, including unflagged spans, and distinguish tonicisation from established modulation.


### 8. `scale.collection`

**Source:** `docs/classifier/rules/area-1B.md:274`.

**Assessment:** Pitch-class set containment alone names too many scales, as the validation already found. A scale passage requires ordered motion, interval structure, context and often fingering/tonic. Keep set membership separate from scale-run recognition and from the name of the governing key.


### 9. `pitch.inventory`

**Source:** `docs/classifier/rules/area-1B.md:322`.

**Assessment:** This is a strong direct-read feature if spelling, sounding MIDI pitch and displayed position remain distinct. Grace notes, ties and ottava need explicit treatment as the rule specifies. Use it as a reusable foundation; don't infer physical technique or tonal function from inventory alone.


### 10. `reading.enharmonic-spelling`

**Source:** `docs/classifier/rules/area-1B.md:348`.

**Assessment:** Identifying unusual written spellings and two names for one sounding pitch is objective. Calling a spelling wrong requires harmonic context, and PKSpell disagreement is not sufficient, especially in jazz/blues. Keep candidates rather than automatic corrections.


### 11. `key.polytonal`

**Source:** `docs/classifier/rules/area-1B.md:374`.

**Assessment:** Different simultaneous pitch collections do not establish polytonality: they may be bitonality, chromatic harmony, pedal points or an accompaniment against a melody. Printed per-staff signatures are direct evidence, while inferred independent tonal centers need extended context. UNKNOWN is appropriate when evidence is only set divergence.


### 12. `pitch.tone-row`

**Source:** `docs/classifier/rules/area-1B.md:401`.

**Assessment:** A twelve-tone aggregate or matching transformation is not necessarily an intentional serial row. music21 serial tools can search P/I/R/RI candidates, but selecting the governing row requires structural repetition and phrase context. Keep detected ordered windows distinct from the stronger 'tone-row technique present' claim.


## Area 1C — Metre and rhythm


### 1. `notation.times`

**Source:** `docs/classifier/rules/area-1C.md:33`.

**Assessment:** The 187 encoded signature events reportedly agree across readers; the failing part is interpretation. Return exact notated changes separately from changes of felt metre, pickups, partial-bar devices and cadenzas. The agent should resolve ambiguous function, not re-decide whether an encoded signature exists.


### 2. `metre.class`

**Source:** `docs/classifier/rules/area-1C.md:52`.

**Assessment:** A fixed N/D classification is useful for conventional signatures but not enough for ambiguous 6/4, additive or editorial groupings. Separate nominal time signature, conventional default classification and felt beat/grouping. The 'exact' provenance of musical class is too strong when grouping is contested.


### 3. `mark.anacrusis`

**Source:** `docs/classifier/rules/area-1C.md:76`.

**Assessment:** A short opening bar is a useful pickup candidate; incomplete exports, hidden rests and opening cadenza can mimic it. Keep measured shortness exact and anacrusis interpretation conditional on structural context. Full opening bar with rests is rightly separate.


### 4. `rhythm.values`

**Source:** `docs/classifier/rules/area-1C.md:92`.

**Assessment:** Written note/rest value inventory is reliable when tuplet values and whole-bar rests are distinct. A triplet eighth is not pedagogically interchangeable with an ordinary eighth, as the rule recognizes. Correct the validation prose discrepancies without changing the underlying counting logic.


### 5. `rhythm.dotted-quarter`

**Source:** `docs/classifier/rules/area-1C.md:110`.

**Assessment:** The pair counts are useful, but a dotted quarter in 6/8 can be the ordinary beat rather than a syncopated figure. Keep raw dotted values and contextual pattern labels distinct. Preserve unresolved reader disagreements as such.


### 6. `rhythm.ties`

**Source:** `docs/classifier/rules/area-1C.md:126`.

**Assessment:** Chain versus link counting is correct and avoids inflating a long tie. 'Syncopating tie' requires beat strength and voice continuity, not merely crossing a barline. Its uncertain status should propagate to any teaching requirement that depends on that classification.


### 7. `rhythm.syncopation`

**Source:** `docs/classifier/rules/area-1C.md:146`.

**Assessment:** The failing examples show why one boolean is inadequate. Preserve separate offbeat attacks, ties across strong beats, accents and accompaniment figures; apply only the kind required by the lesson. Default/unmetered Satie and melodic false positives must not become certified syncopation.


### 8. `rhythm.triplets`

**Source:** `docs/classifier/rules/area-1C.md:181`.

**Assessment:** Ratio 3:2 notes are straightforward; bracket-delimited groups are not when rests, mixed values or export defects intervene. Report exact note-level ratios and uncertain grouping separately. The Black Bottom Stomp count discrepancy should remain visible rather than be reconciled by assumption.


### 9. `rhythm.tuplets-other`

**Source:** `docs/classifier/rules/area-1C.md:197`.

**Assessment:** The near-one ratio filter is a heuristic for corrupted exports, not a musical definition. Real unusual ratios and artefacts can overlap; retain raw numerator/denominator and evidence of notation validity. Flag suspect ratios, and do not silently discard a rare genuine tuplet.


### 10. `rhythm.cadenza`

**Source:** `docs/classifier/rules/area-1C.md:215`.

**Assessment:** Grace runs, cue notes, irregular tuplets and 'senza tempo' are candidates, not proof of a cadenza. Cadenzas are a performance/structural interpretation. The existing code-plus-agent division is appropriate if candidate recall is not treated as exhaustive.


### 11. `rhythm.repeated-notes`

**Source:** `docs/classifier/rules/area-1C.md:238`.

**Assessment:** The voice-specific definition avoids counting repeated chords and ties. Misencoded voices can create false runs, so the agent residual is justified for imported files. A repeated pitch is not by itself a repeated-note technique requirement.


### 12. `rhythm.equal-stream`

**Source:** `docs/classifier/rules/area-1C.md:256`.

**Assessment:** Equal inter-onset intervals identify mechanical streams well, but don't necessarily imply a single continuous hand action when notes overlap or voices merge. Preserve per-hand uncertainty and distinguish measured stream density from fingering difficulty.


### 13. `rhythm.habanera`

**Source:** `docs/classifier/rules/area-1C.md:274`.

**Assessment:** Exact onset-cell detection is useful. It cannot certify habanera style or accompaniment role from timing alone; the rule already separates cell from style, which should remain. Beware doubled forms and missing onsets due to rests/ties.


### 14. `rhythm.tresillo`

**Source:** `docs/classifier/rules/area-1C.md:292`.

**Assessment:** 3+3+2 is a broadly named rhythmic cell and should not be mistaken for clave direction or a specific Latin style. The listed La Cumparsita positive is contradicted by the validation; correct the example. Preserve timing evidence without overclaiming a style.


### 15. `rhythm.cinquillo`

**Source:** `docs/classifier/rules/area-1C.md:304`.

**Assessment:** The exact cell is measurable; labeling it Cuban cinquillo rather than ragtime syncopation requires context. The rule properly delegates naming, but the recorded 10-versus-11 Cascades discrepancy needs corrected evidence, not a new classifier.


### 16. `rhythm.secondary-rag`

**Source:** `docs/classifier/rules/area-1C.md:324`.

**Assessment:** A documented Berlin period-three pattern is more defensible than a generic syncopation heuristic. The top-line-only restriction misses inner voices, and the generated exercise near-miss shows pattern requirements are narrower than a three-over-four impression. Keep the established rule, explicitly bounded to the line it analyzes.


### 17. `rhythm.shuffle`

**Source:** `docs/classifier/rules/area-1C.md:336`.

**Assessment:** The corrected distinction between printed swing marks and notated long-short pairs is necessary. A long-short pair in 12/8 does not automatically make a shuffle; style/phrase context matters. Old prevalence figures cannot validate the corrected rule; preserve uncertain classification.


### 18. `notation.swing-mark`

**Source:** `docs/classifier/rules/area-1C.md:348`.

**Assessment:** Printed swing instructions are direct notation facts. A printed 'swing' direction doesn't guarantee actual performed ratio, and absent directions don't prove straight performance. Keep mark detection separate from inferred feel.


### 19. `rhythm.backbeat`

**Source:** `docs/classifier/rules/area-1C.md:368`.

**Assessment:** Exact beats-2-and-4 onsets can be a melody or bass pattern rather than a backbeat groove. The existing agent residual rightly asks for accompaniment/style context. Do not certify backbeat from onset coincidence alone.


### 20. `rhythm.hemiola`

**Source:** `docs/classifier/rules/area-1C.md:386`.

**Assessment:** A hemiola is a perceived regrouping, not just arithmetic matching of 3 against 2. Beaming, accents, harmonic rhythm and phrase boundaries matter; the current onset-only detector should output candidates. The unresolved 'alternate' definition prevents exact certification.


### 21. `texture.polyrhythm`

**Source:** `docs/classifier/rules/area-1C.md:409`.

**Assessment:** Cross-hand even-division ratios are useful evidence, but a coincidental flourish or malformed generated accompaniment should not certify a polyrhythmic skill. Fix the containing/contained span wording already identified and keep the ratio evidence distinct from the musical interpretation.


### 22. `rhythm.beat-onset-share`

**Source:** `docs/classifier/rules/area-1C.md:427`.

**Assessment:** A straightforward statistic, but audible pulse and felt beat are not equivalent to note attacks exactly on beats. A sustained note can support a pulse through harmony or accompaniment. Rename/describe the output as onset coverage, not audible pulse strength.


### 23. `mark.tempo-text`

**Source:** `docs/classifier/rules/area-1C.md:443`.

**Assessment:** Printed metronome and word markings should remain distinct from playback <sound tempo> and catalogue defaults. Tempo-word ranges are approximate; don't present them as measured BPM. Opening tempo and subsequent marks must respect their score positions.


### 24. `mark.tempo-change`

**Source:** `docs/classifier/rules/area-1C.md:466`.

**Assessment:** Classifying explicit ritardando, accelerando and a tempo words is reasonable. Unrecognized French/German terms and misspellings should be retained as text candidates rather than treated as no change. A printed instruction is not a measured performed tempo curve.


### 25. `technique.velocity`

**Source:** `docs/classifier/rules/area-1C.md:490`.

**Assessment:** Notes/sec and onsets/sec are useful workload descriptors, but peak bar at printed tempo is not a verified physical speed demand if rubato or missing tempo applies. Chords are one onset but multiple key actions. Keep time estimates conditional on tempo provenance.


### 26. `technique.endurance`

**Source:** `docs/classifier/rules/area-1C.md:508`.

**Assessment:** Longest active onset span is an objective proxy for sustained activity, not physiological endurance. The one-beat gap rule is operational and style-dependent; it should not become a learner fatigue threshold without evidence. Keep active-span measurements and avoid claims about stamina.


### 27. `metre.grouping`

**Source:** `docs/classifier/rules/area-1C.md:524`.

**Assessment:** Composite signature and explicit count words are stronger than default beaming. Editorial beaming is at most a witness for felt grouping; the rule already notes this. Avoid 'exact' musical grouping when it rests only on publisher defaults.


### 28. `rhythm.silence`

**Source:** `docs/classifier/rules/area-1C.md:548`.

**Assessment:** Union-of-sounding-notes gives exact encoded silence, but missing original parts can make it false for the complete arrangement. Keep 'other parts not held' UNKNOWN. Distinguish hidden rests, sustained pedal sound and absent notes if the downstream use concerns actual audible silence.


### 29. `rhythm.bar-patterns`

**Source:** `docs/classifier/rules/area-1C.md:566`.

**Assessment:** The normalized onset/duration string is useful for repeated rhythmic notation. Merging voices and choosing longest duration can erase a syncopated inner line; keep the output explicitly per-staff composite, not a universal groove descriptor. No extra classifier needed.


### 30. `rhythm.clave-alignment`

**Source:** `docs/classifier/rules/area-1C.md:580`.

**Assessment:** Matching cycles against son/rumba/bossa templates is not proof of clave direction. Phrase anchor, instrumentation and the melody's relation to clave are unresolved, as the rule says. Keep neutral/mixed/UNKNOWN outcomes; do not force 2-3 or 3-2 for a catalogue item without evidence.


## Interpretation of this review

These comments are suggestions and risk assessments against the current written rules, not claims that all flagged concerns are newly discovered defects. The most consequential demonstrated problems are the already-failing rules and mismatches between source notation, rendered notation, inferred musical structure, and teaching certification. Where the plan already includes correcting a failing rule, the comment belongs in that correction, not in a separate workstream. I did not validate external tool licenses or independently rerun benchmarks.
