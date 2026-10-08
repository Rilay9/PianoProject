# Characteristics list, pass 1: the findings applied (2026-10-08)

**What this is.** The record of applying `missing.md` (18 proposed characteristics, 18 missing parts) and `rows.md` (194 row verdicts, 68 merged or retired verdicts, library facts, source corrections) to `docs/classifier/characteristics-list.md`. One line per finding: **applied**, **dropped** (with the reason) or **not applied** (with the reason). No new research was done: the only files read besides the two findings files, the list and `characteristics.yaml` were `docs/classifier/rules/harmony.md` (the numerals and the chord timeline), `tools/content/musical_evaluator.py` (the `beginning` function) and `docs/prompts/FABLE.md` section 2; a text search found which other documents name notation.page-breaks and difficulty.perceptual. Nothing was run on a score. Nothing was assigned to an ability.

**Proposals dropped: none.** Each of the 18 is a property of a score or of the music a piano learner meets (what is written, how it is grouped, what it implies, what it asks the player to supply), and each is exposed by at least one ability in missing.md section 2. Several are flagged low frequency (pitch.tone-row) or as families whose cells are not yet quoted (texture.latin-pattern, style.dance-type): they stay as rows with that said in the row.

**Findings not applied:** only the OK-row notes marked "not applied" in section E (four notes that repeat what the row already says) and the unread family contracts in C3. No WRONG finding was refused. Where rows.md offered two ways to fix a row, the one chosen and why is on that row's line (texture.left-hand-pattern, difficulty.perceptual). Calls of mine, to be confirmed by whoever writes the rule: harmony.chromatic-share (harmonic-minor V and vii° are diatonic) and the renaming of notation.page-breaks.

## A. The 18 proposed characteristics (missing.md 1.1)

- `pitch.inventory`: applied. new row in 1.B. A property of the written score a learner reads (which notes, on lines or spaces). Reads the displayed pitch, as pitch.ledger now does.
- `reading.enharmonic-spelling`: applied. new row in 1.B. The learner meets E#, Cb and F#/Gb.
- `notation.reading-aids`: applied. new row in 1.A. Letter names and printed counts are on the page a beginner reads; not told apart from lyrics by any other row.
- `metre.grouping`: applied. new row in 1.C. Its source cell no longer cites OMT-meter (pass 1 found no irregular metres on that page); the grouping source is marked as still needed.
- `rhythm.silence`: applied. new row in 1.C.
- `rhythm.bar-patterns`: applied. new row in 1.C.
- `harmony.implied`: applied. new row in 1.E. Uses `roman.RomanNumeral(...)`, not the rejected `romanNumeralFromChord`.
- `form.improvisation-space`: applied. new row in 1.J. Empty bars with chord symbols or slashes are in the score the learner is handed; what the learner supplies is not asserted.
- `notation.slash-rhythm`: applied. new row in 1.A.
- `style.dance-type`: applied. new row in 1.K, one kind reported per dance; every dance cell is marked as to be quoted.
- `harmony.planing`: applied. new row in 1.E. Adapted by me: it reads the chord timeline of RULES-harmony rather than bare `chordify`, because the pass-1 finding on harmony.rhythm says chordify change points fall on every onset.
- `key.polytonal`: applied. new row in 1.B. Names `analyze('key')` as Aarden-Essen, per the key.tonic-mode finding.
- `harmony.dissonance-share`: applied. new row in 1.E.
- `harmony.chord-scale`: applied. new row in 1.E.
- `rhythm.clave-alignment`: applied. new row in 1.C. Its source (Mauleón ch III) is named, not read.
- `texture.latin-pattern`: applied. new row in 1.F, one kind per pattern, every cell marked as to be quoted from a source not read. Kept as one row because the Conventions already require each named part to be reported separately.
- `meta.keyboard-sound`: applied. new row in 1.K. The sound a score asks of the keyboard part is stated in the item; it is metadata of the score, as meta.arrangement is.
- `pitch.tone-row`: applied. new row in 1.B, flagged low frequency. Twelve-tone rows are music a piano learner meets (AB-076).

## B. The 18 missing parts of existing rows (missing.md 1.2)

- `item.format: rhythm exercise`: applied. a value of the purpose field; item.format is now two fields (layout, purpose), see the item.format row finding.
- `technique.arpeggio-chord: further chords`: applied. augmented, minor 7th, major 7th, ninth and contrary motion added; technique.arpeggio-run names contrary motion apart too.
- `scale.collection: further collections`: applied. b3 pentatonic (notes to be quoted), melodic-minor modes, bebop scales, Phrygian dominant.
- `texture.broken-chord: named figures`: applied. the five figures reported separately; the alternate-note order to be quoted.
- `harmony.progression: cadential 6-4`: applied. added to the definition; the OMT page is cited by name only.
- `interval.melodic: compound intervals`: applied. 9th, 10th and larger named; generic size from spelling.
- `melody.chord-relation: chord member`: applied. root, 3rd, 5th, 7th, 9th via `getChordStep`.
- `texture.clave: 6/8 clave`: applied. added; source marked not read.
- `texture.tango: further figures`: applied. síncopa, arrastre, yumba added; arrastre by agent.
- `texture.piano-role: per section`: applied. the row reports the role per section.
- `mark.pedal-kind: depths`: applied. quarter and flutter pedal added; they come from text or signs, not from the file's pedal type.
- `mark.ornament: trill details`: applied. written start and termination added.
- `harmony.chord-quality: further qualities`: applied. Phrygian chord, quartal and quintal sonorities added.
- `mark.extended-technique: cluster size`: applied. span, key colour and how struck added.
- `form.song-sections: Latin sections`: applied. montuno (coro-pregón), mambo, moña added; Mauleón ch V content to be read.
- `notation.chord-symbols: N.C.`: applied. N.C. marks counted and placed apart (`harmony.NoChord`).
- `meta.arrangement: reharmonised`: applied. added as a kind; judged by an agent against the original's chords.
- `mark.tempo-text: beat unit`: applied. added (`MetronomeMark.referent`).

## C1. rows.md section 1: WRONG material (9)

- `pitch.ledger`: applied. counted at the displayed position, octave shift subtracted; the same rule written into the Conventions ("The written pitch").
- `notation.page-breaks`: applied. redefined as the turn opportunity (spans where one hand rests or holds long enough to turn) and renamed `notation.turn-opportunity (new)`; a search of the whole worktree finds the old id only in rows.md. The length that suffices for a turn is left to the Phase 2 rule.
- `rhythm.shuffle`: applied. long-short pair figure, 2:1 or 3:1 as notated; swing left to notation.swing-mark; the RULES-rhythm "marked" clause is flagged to be corrected there (not edited here).
- `harmony.chord-quality`: applied. `getChordStepModifications()` read beside `chordKind`; `Chord.quality` noted as triad only; the three probe results quoted.
- `harmony.roman`: applied. defined by RULES-harmony's numerals; the rejected `romanNumeralFromChord` named as rejected.
- `harmony.rhythm`: applied. chord timeline of RULES-harmony, not chordify change points; OMT source marked as not holding the term.
- `texture.left-hand-pattern`: applied. the first of rows.md's two options: defined as the code measures (a moving left hand in every bar); the second option, a repetition test, is the job of texture.ostinato. Chosen because a repetition test would make the detector (detect.ts) disagree with the definition.
- `texture.ostinato`: applied. ostinato kept unchanged-figure only; the transposed riff named as its own kind (transposed figure) with its test to be written, since RULES-texture lists it as a near-miss.
- `form.thirty-two-bar`: applied. AABA and ABAC named apart; the ABAC rule and its source (Forte or Levine) are to be written.

## C2. rows.md section 1: WRONG minor (38)

- `item.format`: applied. split into layout and purpose; the duet part and technical exercise moved to purpose; rhythm exercise added there.
- `reading.accidental-churn`: applied. closed to the same staff position (letter and octave on one staff).
- `reading.unusual-notation`: applied. closed list: cue notes, cross-staff notes and beams, nested tuplets, non-normal noteheads by name. "Crossed stems between voices" dropped from the list because rows.md's closed list does not hold it.
- `reading.pitch-entropy`: applied. authors corrected in the RUB key (Ramoneda, Eremenko, D'Hooge, Parada-Cabaleiro and Serra, arXiv 2408.00473); marked a difficulty input, not a teaching target.
- `reading.redundancy`: applied. Pitch Set LZ credited to RubricNet, not Chiu and Chen.
- `harmony.figured-bass`: applied. raw MusicXML is the only route; music21 skips the element (line 2409).
- `technique.five-finger`: applied. at most five distinct pitches added; the extended class, named positions and distinct-pitch test marked as to be written.
- `key.tonic-mode`: applied. `analyze('key')` named as Aarden-Essen; `analyze('key.krumhansl')` as the second witness.
- `metre.class`: applied. irregular metres classed by written numerator; their grouping handed to metre.grouping; OMT-meter marked as holding no irregular metres.
- `rhythm.syncopation`: applied. stale pickup note removed; accent kind cited to the app's source (Harvard Dictionary; Longuet-Higgins and Lee 1984); OMT marked as not defining it.
- `notation.swing-mark`: applied. raw `<swing>` only; the Conventions list the routes that find nothing.
- `texture.polyrhythm`: applied. detected from onset grids; kinds written without tuplets included.
- `mark.tempo-text`: applied. partitura or TextExpression named; music21 TempoText not produced by the import.
- `mark.tempo-change`: applied. partitura named; music21's spanners not produced by the import.
- `technique.endurance`: applied. formula stated: longest span without a rest, in notes and seconds.
- `melody.degree-profile`: applied. `getScaleDegreeAndAccidentalFromPitch`; JS P-34 to P-37 marked as first and last pitch only.
- `melody.sequence`: applied. OMT-schemata marked as defining Fonte, Monte and Ponte only; the sequence source is "KP or OMT's sequence pages", named without an address because none was opened.
- `harmony.inversion`: applied. OMT-triads marked as without inversion text; replacement "OMT's inversion page or KP", not opened.
- `harmony.progression`: applied. the progressions with no rule marked; lament bass read from the bass line; sources corrected.
- `harmony.applied`: applied. pivot chords make the detector "both"; the missing rules stated.
- `harmony.cadence`: applied. British terms named once; OMT marked as defining PAC, IAC and HC only; Phrygian half marked as without a rule.
- `harmony.voicing`: applied. upper structure, drop-2, locked hands and Bud Powell shells marked as to be written.
- `harmony.bass-behaviour`: applied. pedal bass left to texture.pedal-point; ChordBassMotionFeature marked as chord-symbol root motion only.
- `texture.power-chord`: applied. MusicXML kind `power`; the register or style condition added.
- `texture.walking-bass`: applied. the coded rule stated (one move in eight by step); whole-item; stale note removed.
- `texture.repeated-chords`: applied. quarter-note kind restated as the rule says (at most two chords a bar, one register).
- `texture.tango`: applied. detector "both"; further figures added.
- `texture.tremolo-thirds`: applied. "blues" dropped from the definition.
- `texture.crushed-note`: applied. "blues" dropped from the definition.
- `technique.scale-run`: applied. thirds or sixths between the hands and contrary motion marked as without a rule.
- `technique.fingering-demand`: applied. SEB Table 1 fingering criterion cited.
- `technique.pedal-implied`: applied. TCL-SR Grade 6 cited.
- `mark.pedal-kind`: applied. the import sets only sustain and sostenuto; una corda and depths come from text.
- `expression.character`: applied. ABRSM's List A and List B characters cited; List C has none, so at most two values.
- `form.period`: applied. OMT-period marked as defining the parallel kind only; KP and Green named, not read.
- `difficulty.perceptual`: applied. the second of rows.md's two options (name its own inputs): visual density and unusual notation; "rhythmic ambiguity" dropped; reading.visual-density taken out of difficulty.reading so the two no longer share an input. Not merged, because gap-plan.md still names difficulty.perceptual and this task may edit two files only.
- `quality.coherence`: applied. checklist given: phrase arrivals, cadences, motif reuse, no stray rests.
- `quality.idiomatic`: applied. checklist given: reachable spans, no hand collisions, pedal-able textures; the style.evidence rows for style.

## C3. rows.md section 1: UNSURE (1)

- `generated.spec-declared`: applied in part. applied: the row is marked a declared input that the music rows check, not a property of the music read from the score. Not applied: the family contracts (`content/sources/family-contracts`) were not read, because no new research is allowed; its source stays "still to be stated per family".

## D. rows.md section 2: verdicts that are not OK (1 WRONG material, 8 WRONG minor)

- `clef.bass`: applied. notation.clefs reports the notes read in each clef per staff; the section-2 line says so.
- `key.signature`: applied. merge target changed to key.signature-exercised; notation.keys no longer "absorbs" it.
- `texture.four-to-the-bar`: applied. texture.repeated-chords' quarter-note kind keeps the rule's definition.
- `technique.playability`: applied. the overlap on one key added to coordination.register-overlap.
- `target.salience`: applied. the place in a chord (top, inner, bottom) added to the output convention and the section-2 line.
- `integrity.transposing-part`: applied. kept on a named build-check list in section 2 (a "Build checks that stay tracked" subsection); still retired as a characteristic of the music. No code exists for it.
- `integrity.notation-sanity`: applied. reinstated as a characteristic in 1.A (misspelling and beaming, detector "both", no code today); counted as corrected.
- `integrity.metadata-trust`: applied. written into the Conventions ("Provenance").
- `quality.phrase-shape`: applied. form.phrase now carries the beginning (first note a chord tone of the opening harmony, first beat), read from `musical_evaluator.py` `beginning`; the arrival was already there.

## E. rows.md section 1: OK rows that carry a note (24)

- `notation.staves`: applied. `staff_feature` route added.
- `texture.melody-location`: not applied. the note only says WP-Homophony is a stand-in and hand exchange stays operational; both are already how the row reads.
- `notation.clefs`: applied. notes per clef per staff (same change as clef.bass).
- `notation.clef-change`: applied. ABRSM-SR "clef changes" (Grade 6) cited.
- `mark.ottava`: applied. ABRSM-SR "8va sign" (Grade 7) cited.
- `key.signature-exercised`: applied. carries the located notes of key.signature.
- `pitch.chromatic`: applied. reference stated: the sounded key.
- `reading.accidental-kinds`: applied. the raw `cautionary` route stated.
- `scale.collection`: applied. Ionian and Aeolian named once; OMT-scales2 marked as not holding the blues scale.
- `rhythm.cadenza`: not applied. the note is "WP stand-in", already marked in the row's source.
- `rhythm.equal-stream`: not applied. the note repeats what the row already says (minimum length still to source).
- `rhythm.habanera`: applied. the detector reads the left hand only: stated.
- `rhythm.backbeat`: applied. source changed to WP-Backbeat.
- `technique.velocity`: applied. SEB's second definition added.
- `quality.contour`: not applied. the note repeats what the row already says (extract each line first); not edited.
- `melody.chord-relation`: applied. noted that the classical types are new beyond RULES-harmony.
- `harmony.chromatic-share`: applied. harmonic-minor V and vii° counted as diatonic: my call, flagged for the rule to confirm.
- `texture.pedal-point`: applied. declared the one definition of the pedal bass.
- `texture.hands-together`: applied. overlap with coordination.synchrony-share noted; neither removed (whether both levels are used is a Phase 2 matter).
- `texture.stride`: applied. the figure, not the style.
- `texture.mazurka`: applied. the rule cannot tell a polonaise: stated.
- `coordination.register-overlap`: applied. both hands needing one key added.
- `technique.displacement-rate`: applied. Chiu and Chen's second definition added.
- `form.sonata`: applied. OMT marked as not holding sonatina.

## F. rows.md sections 3 and 4: findings that are not one row (11)

- `rows.md section 3, interval.step/skip/leap into interval.melodic`: applied. interval.melodic reports the generic size and states the leap as every size from the 4th up.
- `rows.md section 3, metre.* into metre.class`: applied. the grouping rule is stated (metre.class hands it to metre.grouping).
- `rows.md section 3, rhythm.eighths and sixteenths into rhythm.values`: applied. no change (right).
- `rows.md section 3, key.signature into notation.keys`: applied. same as the section-2 verdict for key.signature.
- `rows.md section 3, texture.four-to-the-bar into repeated-chords`: applied. same as the section-2 verdict.
- `rows.md section 3, derived difficulty rows`: applied. difficulty.perceptual's duplicate input removed (see its row); no calibration set exists yet, which the rows already say ("calibration set to source").
- `rows.md section 4, music21 reader drops elements`: applied. a Conventions bullet ("Routes that find nothing") and the row corrections.
- `rows.md section 4, three rows disagree with the code`: applied. texture.left-hand-pattern, texture.ostinato, texture.walking-bass each now say what the code and rules do; harmony.roman names the rules page's numerals.
- `rows.md section 4, pedal point defined twice`: applied. one definition, in texture.pedal-point.
- `rows.md section 4, style words in figure rows`: applied. blues dropped from tremolo-thirds and crushed-note.
- `rows.md section 4, RUB citation`: applied. corrected in the key table.

## G. Consistency adjustments I made to the new rows

These follow the pass-1 findings on existing rows; none is a refusal.

- Every new row that names a library route uses the corrected route: key.polytonal names `analyze('key')` as Aarden-Essen; harmony.planing reads the chord timeline, not bare `chordify`; pitch.inventory reads the displayed pitch.
- Sources a new row names but nobody read (Mauleón, Berklee, Willey and Cardim, LCM, Link and Wendland, Kostka and Payne, Green, OMT pages by name) are marked "not read", "to be quoted" or "DRAFT: draft-x § n" in the cell, and the Conventions say what those marks mean. A new source key `KP` and `DRAFT` was added to the key table.
- The pass-1 row check had a jSymbolic page cut at T-12; the missing-parts check had the whole page. harmony.planing cites T-19 from the second; the list's section 5 now says so.

## H. Counts, by script

`build/count_final.py` (not committed) over `docs/classifier/characteristics-list.md` and `characteristics.yaml`, run after the edits:

| count | value |
| --- | --- |
| characteristics in section 1 | 213 |
| new (not in the yaml) | 43 (25 first draft + 18 pass-1 proposals; all 18 present: True) |
| from the yaml, kept | 89 |
| from the yaml, corrected | 81 |
| merged | 36 |
| retired | 31 |
| yaml rows accounted for exactly once | 237 of 237 (kept + corrected + merged + retired = 237) |
| kept + corrected = the yaml ids in section 1 | 170 = 170 |
| script problems (duplicates, merge targets not in section 1, merged or retired ids still in section 1, order against the yaml) | 0 |

Movement from the first draft (194 characteristics; 119 kept, 50 corrected, 36 merged, 32 retired): +18 new rows, +1 reinstated (integrity.notation-sanity, from retired to corrected: retired 32 to 31), 1 renamed (notation.page-breaks to notation.turn-opportunity), 0 removed from section 1; 89 + 81 = 170 yaml ids in section 1 (was 169); kept fell from 119 to 89 and corrected rose from 50 to 81 because a row changed in definition or detector by a pass-1 finding is counted as corrected (30 kept rows moved to corrected: 119 - 30 = 89 and 50 + 30 + 1 reinstated = 81).

Findings recorded in this file, by script over this file (the lines above):

| group | lines | applied | not applied | dropped |
| --- | --- | --- | --- | --- |
| A. The 18 proposed characteristics | 18 | 18 | 0 | 0 |
| B. The 18 missing parts of existing rows | 18 | 18 | 0 | 0 |
| C1. rows.md section 1: WRONG material | 9 | 9 | 0 | 0 |
| C2. rows.md section 1: WRONG minor | 38 | 38 | 0 | 0 |
| C3. rows.md section 1: UNSURE | 1 | 1 | 0 | 0 |
| D. rows.md section 2: verdicts that are not OK | 9 | 9 | 0 | 0 |
| E. rows.md section 1: OK rows that carry a note | 24 | 20 | 4 | 0 |
| F. rows.md sections 3 and 4: findings that are not one row | 11 | 11 | 0 | 0 |
| total | 128 | 124 | 4 | 0 |
