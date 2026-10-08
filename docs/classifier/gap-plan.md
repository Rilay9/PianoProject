# Gap plan: what decides each gap, and how the results place items

**To decide in Phase 2 (2026-10-08):** this file counts every row not EXISTS as a gap, including rows code can verify once built. The owner's meaning of a gap is what code cannot verify ("gaps mean that its not possible to verify by code"); Phase 2 sorts the rows and corrects the wording.

**Version 1: the gaps known after table iteration 1 (base 4cd63cc8), not a complete list.** Later check passes will find more missing characteristics and wrong rules; each finding adds or changes a line here. The placement design below does not depend on every gap being known.

Bounded by FABLE §2 item 7 (the owner and the reviewer, 2026-10-07): for every characteristic that is not EXISTS, and every open decision, the route that decides it, and how those results decide rung placement. It ends when each gap has its route; it is not a research programme. Rules before code: nothing here is implemented, and no row below is built until its rule has passed the table checks.

Base: origin at `4cd63cc8`. Rows: `characteristics.yaml`, 237 rows, 45 EXISTS, **192 not EXISTS** (99 PARTLY, 93 MISSING), each with one line below.

**The four routes**

- **direct**: read from the score by a named library call; no rule needed. A row that only computes over another row's value is direct, and inherits that row's UNKNOWN.
- **sourced rule**: needs a definition. The line names the source, the distinction the rule must draw, and real catalogue items for positives (+) and near-misses (−). Each + and − for a new rule is a candidate: chosen by id, title or rung option and checked to exist in `catalog.json`. Only items marked "measured" here were read, so reading each candidate is the rule's first step. The 44 rules written on 2026-10-07 are on this route with their definition already written (`rules/*.md`, which lists their positives and near-misses). What decides them is an independent check of that definition, plus the open limit the line names.
- **calibration**: needs a model. The line says what the ground truth represents and which dataset could supply it. Datasets were checked by web search on 2026-10-07, with licence and access.
- **unknown-agent**: the score cannot establish it reliably. The line says what the agent's packet holds (the measured rows) and the residual question the agent answers. Nobody in this process hears music, so a residual that needs listening stays "unverified as music".

**Libraries.**
- m21 = music21 10.5.0; pt = partitura 1.9.0, both in `.venv`.
- Every class or function named below was checked by import on 2026-10-07 (script in my worktree's `build/libs.py`). All are present except `partitura.score.Tie`: partitura keeps ties as note attributes.

**Datasets** (checked by web search on 2026-10-07):

| Dataset | What it holds | Licence and access |
| --- | --- | --- |
| CIPI | 652 pieces, 9 Henle levels | Zenodo 8037327: files restricted, on request, "non-profit and academic research only", asks for an academic affiliation. **Not obtainable for this project's use as far as the terms say.** |
| PSyllabus | 7,901 pieces, 11 syllabus levels from ABRSM, RCM, Trinity and others; metadata JSON with composer, title, syllabus and level, plus MIDI | Zenodo 14794592: CC BY 4.0, open access, "research use only" |
| Mikrokosmos-difficulty | 147 MusicXML pieces in 3 levels | GitHub PRamoneda/Mikrokosmos-difficulty: no licence file |
| PIG | 150 pieces with pianists' fingering and the hand for each note | Registration required, no redistribution |
| When in Rome | Roman-numeral and local-key analyses | GitHub MarkGotham/When-in-Rome: new analyses CC BY-SA |
| DCML Mozart piano sonatas | Harmony, cadence and phrase labels | GitHub DCMLab/mozart_piano_sonatas: CC BY-NC-SA 4.0 |
| Essen Folksong Collection | About 6,250 melodies with phrase markers | GitHub ccarh/essen-folksong-collection: CCARH licence, personal and academic use, no redistribution |
| RCM Piano Syllabus 2022 | Repertoire lists from Preparatory A and B upward | Public PDF (teacherportal.rcmusic.com and rcmusic-kentico-cdn) |

**Tools.**
- pianoplayer 3.0.2: MIT, PyPI.
- AugmentedNet: MIT, GitHub napulen/AugmentedNet.
- Neither is installed.

## 1. The rows

| row | route | what decides it | source, library or dataset | depends on |
| --- | --- | --- | --- | --- |
| `prereq.hand-assignment` | calibration | Two-staff files: the staff is the hand, cross-staff notes by their own `<staff>` (exact). One-staff and multi-part files: an inferred split, calibrated against the engraver's staff choice, using the catalogue's two-staff items merged to one staff and split again. That ground truth is notation convention, not the hand a pianist would choose; PIG's per-note hands are the second set. UNKNOWN below the calibrated margin | pt `note_array(include_staff=True)`; `app/src/import/midi/handSplit.ts` as the split to calibrate; PIG v1.2 | `notation.staves`, `hands.per-bar-range`; the voice-to-hand misreadings (decision D4) |
| `clef.treble` | direct | count of treble clefs per staff | m21 `clef.TrebleClef`; raw `<clef><sign>G` | - |
| `notation.clef-change` | direct | every clef after a staff's first, with measure and offset | m21 `clef.Clef` offsets; raw `<clef>` in later `<attributes>` (the signs `build.py:509 clef_misread` already reads) | fixes the clef-not-read misreadings (D4) |
| `notation.lyrics` | direct | lyric count per staff | m21 `note.Lyric`; raw `<lyric>` | - |
| `mark.dynamics` | direct | dynamic marks per staff with measure (the per-staff split is what `coordination.dynamic-balance` needs) | m21 `dynamics.Dynamic`; pt `score.Dynamic` | - |
| `mark.hairpin` | direct | crescendo and diminuendo spanners with start and end measure | m21 `dynamics.Crescendo`, `Diminuendo`; raw `<wedge>` | - |
| `mark.articulation` | direct | staccato, accent and tenuto per note per staff | m21 `articulations.Staccato`, `Accent`, `Tenuto` | - |
| `mark.slur` | direct | slurs per staff, with length in notes | m21 `spanner.Slur`; pt `score.Slur` | - |
| `mark.pedal` | direct | pedal marks, count and positions | m21 `expressions.PedalMark`; pt `score.SustainPedalDirection` | - |
| `mark.pedal-kind` | direct | sustain, sostenuto or half from the pedal type; una corda and tre corde matched as their printed words | m21 `PedalMark` type and form, `TextExpression`; pt `score.Words` | `mark.pedal` |
| `mark.ornament` | direct | kind (trill, mordent, turn, grace) and position per ornament; the realisation in notes belongs to `technique.written-ornament` | m21 `expressions.Trill`, `Mordent`, `Turn`, grace notes; raw `<ornaments>` | - |
| `mark.arpeggiate` | direct | spread-chord marks and positions | m21 `expressions.ArpeggioMark` | - |
| `mark.tremolo` | direct | single-note and two-note tremolos | m21 `expressions.Tremolo`, `TremoloSpanner` | - |
| `mark.ottava` | direct | ottava spans and their extent | m21 `spanner.Ottava`; raw `<octave-shift>` | - |
| `mark.fermata` | direct | fermatas with positions | m21 `expressions.Fermata`; pt `score.Fermata` | - |
| `mark.repeat` | direct | repeats, endings, segno, coda and Fine written on the row; today they are read only for integrity (`score_checks.py:1237`) | m21 `bar.Repeat`, `spanner.RepeatBracket`, `repeat.Coda`, `repeat.Fine` | - |
| `mark.fingering` | direct | printed fingerings per staff, and the share of notes fingered | m21 `articulations.Fingering`; raw `<fingering>` | - |
| `mark.anacrusis` | direct | first bar shorter than the time signature, written on the row (today only in `excerpt_proposer.py:368`) | m21 measure duration against time signature; raw `implicit="yes"` | `score.py`'s pickup line has the multi-part fault (D5) |
| `mark.tempo-text` | direct | first and all metronome marks. The 60 items whose file writes a tempo the row lacks are a measurement already confirmed wrong, so the fix is queued. The 174 `tempo-defaulted` items keep provenance "metadata only" and are UNKNOWN wherever a clause reads tempo | m21 `tempo.MetronomeMark`; `tempoFromXml.ts:254` | - |
| `mark.tempo-change` | direct | rit., rall., accel. and a tempo with positions: spanners, plus words matched against those printed terms | m21 `tempo.RitardandoSpanner`, `AccelerandoSpanner`, `TextExpression`; pt `DecreasingTempoDirection` | - |
| `mark.expression-text` | sourced rule | The text is direct. Classifying it as an expression term, a text dynamic or an ending cue needs a vocabulary. Distinction: "Fine" as text against a `repeat.Fine` object; "cresc." as words against a hairpin. Examples: list every distinct `<words>` string in the catalogue (one script), then take one + and one − per class from that list | a published term list (ABRSM or RCM theory syllabus terms by grade); m21 `TextExpression`, pt `Words` | - |
| `expression.character` | calibration | Ground truth is ABRSM list membership: List A is technically agile, List B lyrical. That is the board's syllabus construction, not the piece's character as such. Consumer: no place reads it today | ABRSM syllabus lists via `meta.published-grade` | `meta.published-grade`, `technique.velocity`, `mark.slur`, `mark.articulation` |
| `rhythm.values` | direct | histogram of note and rest values, dots included | m21 `duration.type`, `dots`, `note.Rest` | - |
| `rhythm.ties-across-bar` | direct | ties whose stop is in the next measure | m21 `tie.Tie` with `measureNumber` | - |
| `rhythm.tuplets-other` | direct | tuplets other than 3:2, read from `<time-modification>` (actual and normal), never from the printed label (the tuplet-label misreading, D4) | m21 `duration.Tuplet` ratio; raw `<time-modification>` | - |
| `rhythm.repeated-notes` | direct | consecutive equal pitches per voice per staff: count and longest run | pt `note_array` (pitch, voice, staff) | - |
| `rhythm.equal-stream` | sourced rule | The minimum stream length, as an operational definition fixed before the run. Distinction: an even stream (4.4 and technique.5's evenness) against a scale run and against a note value. + `exercise.hanon.01.both`, `exercise.hanon.11.both`, `exercise.repeated-notes.c.3x.left`; − `song.classical.petzold-minuet-g-bwv-anh114` (eighth runs broken by quarters) | Hanon's cells as the convention; validated empirically (FABLE §2 item 7) | - |
| `rhythm.secondary-rag` | sourced rule | Independent check of the written definition (Berlin 1980). Open: `song.ragtime.joplin-elite-syncopations` and `song.ragtime.joplin-pine-apple-rag`, tagged secondary-rag, read absent (a wrong claim, or the figure in an inner voice); `exercise.secondary-rag.c.4bar` reads absent (generator or claim) | `rules/rhythm.md` § rhythm.secondary-rag | one definition (D2) |
| `rhythm.shuffle` | sourced rule | Independent check. Open: dotted pairs alone are UNKNOWN (12 items); the generated twelve-bar-shuffle and boogie families print no shuffle (a generator finding). Per-rung meaning: "shuffle" is played, so no rung rule requires the notated row | `rules/rhythm.md` § rhythm.shuffle | `notation.swing-mark` |
| `rhythm.beat-onset-share` | direct | share of onsets on a beat | pt `note_array(include_metrical_position=True)`; m21 `beat` | - |
| `key.signature-exercised` | direct | how many sounding notes the signature alters | m21 `KeySignature.alteredPitches` against note steps | - |
| `key.transposition-cost` | direct | per target key, black-key count and five-finger fit after transposing. Consumer: no place reads it today | m21 `Stream.transpose` | `technique.five-finger` |
| `reading.visual-density` | direct | notes, accidentals and voices per bar, plus ledger share. Per-system density is dropped: MusicXML system breaks are optional, so they are not a reliable fact | m21 / pt counts; `difficulty.py:296` features stored | - |
| `reading.accidental-churn` | direct | accidentals displayed per bar that the key does not imply | m21 `pitch.accidental.displayStatus`; raw `<accidental>` | - |
| `reading.accidental-kinds` | direct | kinds of accidental (double sharp, natural, ...) | m21 `pitch.Accidental.name` | - |
| `reading.unusual-notation` | sourced rule | Which constructs count as unusual (cross-staff beaming, mid-bar clefs, nested tuplets, clusters, extended techniques). Examples: one + per construct from the first count, and − items that use the common form | Gould, *Behind Bars* (2011) as the reference list; raw MusicXML | - |
| `reading.pitch-entropy` | direct | entropy of the pitch(-class) distribution per hand | `scipy.stats.entropy` over pt `note_array`; definition from RubricNet (Zapata and Ramoneda 2024), reporting Chiu and Chen 2012 | - |
| `reading.redundancy` | direct | LZ76 complexity of the interval sequence: small custom code, the count is short (lempel_ziv_complexity 0.2.2 is not installed) | RubricNet's definition | - |
| `key.tonic-mode` | calibration | Two witnesses: m21 key analysis and pt `estimate_key`. Agreement gives the value; disagreement gives UNKNOWN. The calibration sets the confidence margin. Ground truth is analysts' local keys, which are mostly classical and represent expert analysis; for folk and pop, signature plus final bass is the cheap check | When in Rome (CC BY-SA); DCML Mozart (CC BY-NC-SA 4.0) | `notation.keys`, `scale.collection` |
| `key.minor-form` | sourced rule | Independent check. Open: it reads the shared key helper, not `key.tonic-mode` (159 UNKNOWN) | `rules/harmony.md` § key.minor-form | `key.tonic-mode` |
| `key.change` | calibration | Signature changes are direct. Unmarked modulation is a windowed key estimate with confidence; ground truth is When in Rome's and DCML's local-key changes. The new key's relation to the old one (dominant, relative) is direct once both keys are known | m21 `analysis.floatingKey`; pt `estimate_key` per section | `key.tonic-mode` |
| `key.set-membership` | sourced rule | The key lists: guitar keys (E, A, D, G, C and their relatives) for jam; singable keys for A7g.1. Per rung: jam.7's charts are in flat keys by design, so membership is jam/jam.5/jam.6's meaning only. + `exercise.walking-bass.e.blues.intro`; − jam.7's flat-key charts | a guitar method's open-key list; a singing-range source for A7g.1 | `key.tonic-mode` |
| `scale.collection` | sourced rule | Independent check. Open: equality against containment; the fallback to the pitch set when the key is unknown | `rules/harmony.md` § scale.collection | `key.tonic-mode` |
| `harmony.chord-quality` | direct | quality parsed from printed symbols. From the notes it is UNKNOWN: chordify is weak on broken textures, so it is never a decision | m21 `harmony.ChordSymbol` (`commonName`, `chordKind`) | `notation.chord-symbols` |
| `harmony.rhythm` | direct | chord-change positions per bar from symbol offsets. From the notes, via `harmony.roman` (UNKNOWN when it is) | m21 `ChordSymbol` offsets | `harmony.roman` for unsymbolled items |
| `harmony.chord-vocabulary` | direct | count of distinct numerals | over `harmony.roman` | `harmony.roman` |
| `harmony.inversion` | direct | Slash symbols: bass against root, exact. Notes: lowest note against root where `harmony.roman` resolves; UNKNOWN otherwise | m21 `ChordSymbol.bass()`, `root()` | `harmony.roman` |
| `harmony.roman` | calibration | The written rule exists. The calibration sets the 60%-resolved threshold and the confidence. Ground truth: expert Roman numerals (classical), and printed symbols for jazz and blues (root agreement measured 0.864 of resolved beats). Second witness: AugmentedNet | When in Rome; DCML Mozart; AugmentedNet (MIT, not installed); `rules/harmony.md` § harmony.roman | `key.tonic-mode`, `notation.chord-symbols` |
| `harmony.progression` | sourced rule | Independent check. Open: rhythm changes have no catalogue positive (I Got Rhythm reads UNKNOWN); the two-chord vamp (D3) | `rules/harmony.md` § harmony.progression | `harmony.roman` |
| `harmony.applied` | sourced rule | Independent check. Open: pivot chords wait for `key.change` | `rules/harmony.md` § harmony.applied | `harmony.roman`, `key.change` |
| `harmony.cadence` | sourced rule | Independent check, against DCML's cadence labels as an outside witness. Open: unmarked phrase ends wait for `form.phrase`, so the list is a lower bound | `rules/harmony.md` § harmony.cadence; DCML Mozart cadences | `harmony.roman`, `form.phrase` |
| `harmony.chromatic-share` | direct | share of numerals outside the key's diatonic set. Convention to state: harmonic minor's raised seventh counts as diatonic in minor | over `harmony.roman` | `harmony.roman` |
| `harmony.voicing` | sourced rule | Independent check. Open: UNKNOWN without symbols (1,557 items), by design | `rules/harmony.md` § harmony.voicing | `notation.chord-symbols` |
| `harmony.voice-leading` | sourced rule | Which four-part faults count (parallel fifths and octaves, spacing, crossing). Distinction: a four-part chorale texture (hymns.4) against a melody with chords. + `song.folk.amazing-grace-satb.pdmx`, `song.classical.bach-o-sacred-head-johann-sebastian-bach-on-a-tune-by-hans-leo-hassler.pdmx`, `exercise.cadence.g.voice-led`; − `exercise.cadence.c.root` | Aldwell and Schachter, *Harmony and Voice Leading*, or Kostka and Payne; m21 `voiceLeading.VoiceLeadingQuartet` | `texture.voice-count` |
| `harmony.chord-connection` | direct | per hand at each chord change: common tones and summed semitone motion | pt `note_array` at `harmony.rhythm` change points | `harmony.rhythm` |
| `harmony.modal` | sourced rule | Re-routed from calibration: no modal ground-truth set was found. The collection is exact (`scale.collection`) and the tonic comes from `key.tonic-mode`, so the mode is a definition over the two, UNKNOWN when the tonic is. + `exercise.modal-vamp.a`, `exercise.modal-vamp.e` (declared modes); − `song.folk.greensleeves.chords` (minor with inflections: the case `modal-minor` is UNSURE about) | a modes definition (Open Music Theory, "Modes") | `scale.collection`, `key.tonic-mode` |
| `harmony.bass-behaviour` | sourced rule | Independent check. Open: the bass approach note (D3) and one definition per fact (D2) | `rules/harmony.md` § harmony.bass-behaviour | `harmony.roman` |
| `melody.chord-relation` | sourced rule | Independent check. Open: blue notes are counted by spelling (`song.blues.livery-stable-blues` writes F# for the blue third) | `rules/harmony.md` § melody.chord-relation | `harmony.roman` |
| `melody.degree-profile` | direct | scale degree per melody note: start, end and the set used | m21 `key.Key.getScaleDegreeFromPitch` | `key.tonic-mode` |
| `melody.tessitura` | sourced rule | Ambitus is direct. The rule compares it with a stated voice range (A7g.1, accompanying a singer). + hymn tunes (`song.folk.amazing-grace-satb.pdmx` soprano); − instrumental lines (`song.classical.czerny-the-school-of-velocity-op-299-no-1.pdmx`). Consumer: no place reads it yet | SATB ranges as Kostka and Payne give them; m21 `analysis.discrete.Ambitus` | `hands.per-bar-range` |
| `melody.motif-repetition` | sourced rule | Repetition and variation measures for PDMX, not only generated phrases. + `song.folk.hot-cross-buns` (bars 1-2 restated), `song.classical.ode-to-joy.rh`; − `exercise.reading.steps-and-skips-c` | FABLE §5's features (rhythm-motif reuse per four bars, interval-sequence repetition); Müllensiefen's FANTASTIC m-type features as the published form | - |
| `texture.block-chords` | direct | chord sizes per hand per onset (2-, 3-, 4-note) and their positions | pt `note_array` grouped by onset and staff | - |
| `texture.broken-chord` | sourced rule | Independent check. Open: the overlap by definition with walking-eighths boogie and arpeggios that turn back | `rules/texture.md` § texture.broken-chord | - |
| `texture.alberti` | sourced rule | independent check | `rules/texture.md` § texture.alberti | one definition (D2) |
| `texture.arpeggio` | sourced rule | independent check | `rules/texture.md` § texture.arpeggio | - |
| `texture.waltz-bass` | sourced rule | Independent check. Open: it reads the figure, not the dance (Chopin mazurkas count) | `rules/texture.md` § texture.waltz-bass | one definition (D2) |
| `texture.oom-pah` | sourced rule | Independent check. Open: present from two bars anywhere, so a rung rule reads its share, never presence | `rules/texture.md` § texture.oom-pah | one definition (D2) |
| `texture.stride` | sourced rule | Independent check. Open: the more-than-an-octave travel is a stated reason, not a quoted number; `exercise.stride.c` and the rest of its family are found by neither rule (a generator finding) | `rules/texture.md` § texture.stride | - |
| `texture.boogie-bass` | sourced rule | independent check | `rules/texture.md` § texture.boogie-bass | - |
| `texture.ostinato` | sourced rule | Independent check. Open: UNKNOWN under four bars (524 items) | `rules/texture.md` § texture.ostinato | - |
| `texture.pedal-point` | sourced rule | Independent check. Open: "foreign harmony" means a triad the bass is not in, so a held bass making a seventh chord is not counted | `rules/texture.md` § texture.pedal-point | - |
| `texture.held-under-moving` | direct | per hand: a note sounding through at least one later onset of the same hand | pt `note_array` onsets and durations by staff | - |
| `texture.sustained` | direct | distribution of chord durations per hand; any threshold belongs to the rung rule (rock.5, rock.6) | pt durations | - |
| `texture.four-to-the-bar` | sourced rule | independent check | `rules/texture.md` § texture.four-to-the-bar | - |
| `texture.charleston` | sourced rule | Independent check. Open: the displaced Charleston | `rules/rhythm.md` § texture.charleston | one definition (D2) |
| `texture.montuno` | sourced rule | Independent check. Open: no real montuno in the catalogue; `exercise.montuno.*.bossa` reads absent, which is a naming question for latin.6 | `rules/rhythm.md` § texture.montuno | - |
| `texture.tumbao` | sourced rule | independent check | `rules/rhythm.md` § texture.tumbao | one definition (D2) |
| `texture.clave` | sourced rule | independent check | `rules/rhythm.md` § texture.clave | one definition (D2) |
| `texture.bossa` | sourced rule | Independent check. Open: the comp cell decides and the bass never does; whether latin's songs write a bossa accompaniment at all (`bossa-nova` is UNSURE) | `rules/rhythm.md` § texture.bossa; `GENERATOR-ADDENDUM` G14 contract | - |
| `texture.tango` | sourced rule | Independent check. It never says present, by design: the style residual needs a source beyond the notes | `rules/rhythm.md` § texture.tango | - |
| `texture.mazurka` | sourced rule | Independent check. Open: it cannot tell the polonaise apart; 18 of 36 Chopin mazurkas are UNKNOWN | `rules/rhythm.md` § texture.mazurka | - |
| `texture.stop-time` | sourced rule | Independent check. Open: UNKNOWN under four bars | `rules/texture.md` § texture.stop-time | - |
| `texture.octaves` | direct | per hand: simultaneous octaves and broken (alternating) octaves. 0.2's "octaves" is keyboard geography, not an item property (per-rung meaning) | pt `note_array` | - |
| `texture.double-notes` | direct | per hand per onset: two-note simultaneities by interval (thirds, sixths) | pt `note_array` | - |
| `texture.power-chord` | direct | per onset per hand: root and fifth (and octave) with no third; or a symbol with "5" | pt `note_array`; m21 `ChordSymbol` | - |
| `texture.two-voice` | calibration | Written voices are exact. Independence uses the voice separation estimate, calibrated against files whose voices are encoded. Ground truth: engraved voices in Bach two-part music (`song.classical.bach-invention-no-4-in-d-minor-bwv-775.pdmx`) and the Bach chorales in m21's bundled corpus (public domain) | pt `estimate_voices` | `difficulty.features` |
| `texture.voice-count` | direct | written voices per staff, and the most notes per onset per staff (four parts engraved as chords) | raw `<voice>`; pt `note_array` | - |
| `texture.counterpoint` | unknown-agent | Re-routed from calibration: no labelled set of contrapuntal and homophonic piano scores was found. Packet: `texture.two-voice`, `texture.motion`, `coordination.rhythmic-independence`, `melody.motif-repetition` (imitation). Residual: "are these independent lines, or a melody with accompaniment?" (classical.7) | - | the three rows |
| `texture.part-roles` | unknown-agent | Re-routed from calibration: no calibration set. Packet: `integrity.extra-parts`, part instrument names, per-part ranges, `texture.ostinato`. Residual: "which part is the melody, the bass, the riff?" | m21 `instrument.Instrument` | `integrity.extra-parts` |
| `texture.motion` | direct | for onset pairs where both hands move: parallel, similar, contrary and oblique counts | pt `note_array` by staff | - |
| `texture.alternating-hands` | direct | share of onsets where one hand sounds alone and the hands alternate | pt onsets by staff | - |
| `texture.polyrhythm` | direct | a tuplet in one hand against plain values in the other, at overlapping times, with the ratio named | m21 `duration.Tuplet` per staff | `rhythm.tuplets-other` |
| `texture.tremolo-thirds` | sourced rule | Independent check. Open: tempo is not read; the tremolo-mark path is untested on real data | `rules/texture.md` § texture.tremolo-thirds | `mark.tremolo` |
| `texture.crushed-note` | sourced rule | Independent check. Open: a crush written in real values is not recognised. Per-rung: on blues.3 and blues.4 it is played; the printed grace is optional | `rules/texture.md` § texture.crushed-note | - |
| `texture.half-time` | unknown-agent | Re-routed from calibration: the yaml itself says confidence is low from a score. Packet: accents by beat, `harmony.bass-behaviour`, `rhythm.syncopation`. Residual: "is the backbeat on 3?" (rock.6). Unverified as music | - | the three rows |
| `texture.call-response` | unknown-agent | Re-routed from calibration: whether a phrase *answers* another is not a note pattern. Packet: `form.phrase` boundaries, `hands.per-bar-range` per phrase, `texture.alternating-hands`. Residual: "does the second phrase answer the first?" (blues.9) | - | `form.phrase` |
| `texture.melody-in-chords` | sourced rule | Independent check of the evidence. Whether the top line is a melody (84 of 372 positives are voice-led successions) is that rule's residual, for an agent | `rules/texture.md` § texture.melody-in-chords | `texture.block-chords` |
| `texture.build` | sourced rule | Independent check. Open: register is not read (`texture.register-trajectory`); it reads its own dynamics until `mark.dynamics` exists | `rules/rhythm.md` § texture.build | `mark.dynamics` |
| `texture.register-trajectory` | sourced rule | Trend of register per section; distinction: register moved against dynamics alone. + `song.classical.grieg-in-the-hall-of-the-mountain-king.pdmx` (candidate, to read); − `exercise.shaping.a.crescendo` (dynamics only) | rock.7's own definition (the same idea moved down an octave), validated empirically; OpenLearn 1.3 as `texture.build` cites it (register as a component of a build) | `hands.per-bar-range`, `form.sections` |
| `texture.bass-walk-up` | sourced rule | Independent check. Open: the definition is operational, with no quoted source | `rules/harmony.md` § texture.bass-walk-up | `harmony.roman` |
| `texture.hand-independence` | direct | reports `coordination.synchrony-share` and `coordination.rhythmic-independence`, never a label; the label belongs to `difficulty.coordination` | over the two rows | the two rows |
| `coordination.synchrony-share` | direct | share of onsets shared by both hands | pt onsets by staff | `prereq.hand-assignment` (one-staff files) |
| `coordination.rhythmic-independence` | direct | per bar, whether the two hands' rhythm strings are equal; count of bars that differ | pt onsets by staff | as above |
| `coordination.unequal-rates` | direct | notes per bar per hand: the ratio and where it changes | pt `note_array` | as above |
| `coordination.articulation-conflict` | direct | onsets where the two hands carry different articulation or slur state | m21 articulations and slurs per staff | `mark.articulation`, `mark.slur` |
| `coordination.dynamic-balance` | sourced rule | Per-staff dynamics are direct first. The rule: the melody staff (`detect.ts:217 melodyStaff`) marked louder, or the other staff softer and denser. + `exercise.voicing.a`; − `exercise.independence.c.2v1` | a voicing passage from a piano pedagogy text (to name); validated on these items | `mark.dynamics`, `reading.visual-density` |
| `coordination.register-overlap` | direct | overlap of the hands' per-bar ranges, in semitones and bars | over `hands.per-bar-range` | `hands.per-bar-range` |
| `coordination.pedal-with-hands` | sourced rule | Pedal changes against harmony change points: legato (syncopated) pedalling releases at or after the new chord. + `exercise.pedal.c`, `exercise.pedal.g`; − a pedal held through changes (from the first count) | Banowetz, *The Pianist's Guide to Pedaling* (1985) | `mark.pedal`, `harmony.rhythm` |
| `coordination.sustain-vs-move` | direct | onsets where one hand holds while the other moves | pt durations by staff | - |
| `coordination.hand-interval` | direct | interval between the hands at each shared onset | pt `note_array` | - |
| `coordination.interaction` | calibration | Ground truth would have to label "hard together" apart from overall difficulty: hands-separate against hands-together error or practice data. **None was found or checked**; a grade-labelled corpus calibrates overall difficulty, not this. Until one exists the packet carries the co-occurrence counts (direct) and the row is UNKNOWN | none located | `target.isolation`, `coordination.synchrony-share`, `coordination.unequal-rates` |
| `technique.scale-run` | sourced rule | Independent check. Open: N = 6 is a stated reason, not a quoted number; extent in octaves is not reported | `rules/texture.md` § technique.scale-run | - |
| `technique.arpeggio-run` | sourced rule | independent check | `rules/texture.md` § technique.arpeggio-run | - |
| `technique.arpeggio-chord` | direct | the chord each run outlines, inside the run's boundary | m21 `chord.Chord.commonName`, `inversion()` | `technique.arpeggio-run` |
| `technique.five-finger` | sourced rule | Independent check. Open: the position definition (seven semitones) is not quoted | `rules/texture.md` § technique.five-finger | - |
| `technique.position-shift` | sourced rule | Independent check. Open: 1,542 of 2,013 items shift, so a rung rule reads count and place, never presence | `rules/texture.md` § technique.position-shift | - |
| `technique.thumb-under` | calibration | A fingering estimate, calibrated against annotated fingerings; ground truth is pianists' chosen fingering, which is what thumb-under is. + `exercise.scale.c-major.1oct.similar.right.2`; − `exercise.position-shift.c.right` (moves the hand, no crossing) | pianoplayer 3.0.2 (MIT); PIG v1.2 (registration) | `technique.scale-run` |
| `technique.velocity` | direct | Onsets per second per hand at the written tempo. Convention to state: a chord is one event, and the hand comes from the staff (one-staff files: `prereq.hand-assignment`). Stored on every item: the build has no call site, a confirmed fault, queued. `tempo-defaulted` gives UNKNOWN | `difficulty.py:296` | `mark.tempo-text` |
| `technique.endurance` | direct | Re-routed from calibration: the value is the longest continuous playing per hand, in seconds at written tempo, with no rest of a beat or more. The threshold is the rung's (technique.8); practice.4's meaning is activity | over `form.length`, `technique.velocity` | `technique.velocity` |
| `technique.finger-independence` | sourced rule | Independent check. Open: the curriculum means evenness of weak fingers (4.4) where the rule means a held note plus moves; that is a per-rung meaning (D1) | `rules/texture.md` § technique.finger-independence | - |
| `technique.span` | direct | largest simultaneous span per hand, under the stated convention; stored on every item (confirmed fault, queued) | `difficulty.py:296`; pt `note_array` | `prereq.hand-assignment` |
| `technique.leap-size` | direct | largest leap per hand. Convention to state: the line through chords (top note or every note). The 540 disagreements with the witness come from that gap | `difficulty.py:296`; m21 intervals | as above |
| `technique.displacement-rate` | sourced rule | Share of moves over 12 semitones within two beats. + `exercise.stride.c` (candidate); − `exercise.boogie.c.root-fifth` (7-semitone moves at its bar joins, measured) | Sébastien et al. 2012, Table 1; Chiu and Chen 2012 as RubricNet reports it | `technique.leap-size`, `mark.tempo-text` |
| `technique.hand-crossing` | direct | crossings per item under the stated convention; stored on every item (confirmed fault, queued) | `difficulty.py:296` | `prereq.hand-assignment` |
| `technique.fingering-demand` | calibration | A solver cost per passage, calibrated on PIG. That ground truth is chosen fingering, not difficulty; difficulty-from-fingering was validated on Mikrokosmos's composer ordering (Ramoneda et al. 2022) | pianoplayer; PIG; Mikrokosmos-difficulty | `technique.span`, `technique.leap-size`, `mark.fingering` |
| `technique.playability` | sourced rule | Notes within 21-108, no more than five notes per hand per onset, no span beyond the stated maximum, no held note a hand cannot keep under its moving notes. Operational, validated: every admitted real item passes; hand-made near-misses fail | operational definition | `technique.span`, `integrity.piano-range`, `texture.held-under-moving` |
| `technique.pedal-implied` | sourced rule | The three conditions in the row, with UNKNOWN when the evidence is short. + `song.classical.schumann-schumann-album-for-the-young-op-68-no-4-a-hymn-tune-choral.pdmx` and `song.folk.greensleeves.waltz` (3.5's songs, to read); − `song.classical.petzold-minuet-g-bwv-anh114` (Baroque two-voice, no pedal need) | Banowetz (1985) | `mark.pedal`, `harmony.rhythm`, `texture.held-under-moving`, `coordination.sustain-vs-move`, `texture.broken-chord`, `technique.span` |
| `technique.written-ornament` | sourced rule | Main, neighbour, main at ornament speed (a sixteenth or faster at tempo). + `exercise.mordent.c.2pb.left`, `exercise.trill.c.4pb.left`; − a neighbour figure in quarters (from the first count) | an ornament table (C. P. E. Bach, *Essay*, or the ABRSM ornament guide) | `mark.tempo-text` |
| `form.sections` | direct | sections from repeats, double bars, rehearsal marks and key or time changes, written on the row (`score_checks.py:1174`) | m21 `expandRepeats` as witness; `expressions.RehearsalMark` | `mark.repeat` |
| `form.phrase` | calibration | Boundary cues (rest, long note, cadence, repetition) combined with a confidence; UNKNOWN below the calibrated margin. Ground truth is editors' or analysts' phrase boundaries: Essen for melodies, DCML for piano | Essen (CCARH licence); DCML Mozart phrases | `rhythm.values`, `melody.motif-repetition`, `mark.repeat`, `harmony.roman` |
| `form.period` | sourced rule | Antecedent on a weaker cadence, consequent on a stronger one, sharing the opening. + `song.classical.mozart-theme-du-1er-mouvement-de-la-sonate-k-331.pdmx`, `song.classical.ode-to-joy.rh`; − `song.folk.hot-cross-buns` (restatement, no weak-then-strong pair). Consumer: no place reads it yet | Caplin, *Classical Form* (1998) | `form.phrase`, `harmony.cadence`, `melody.motif-repetition` |
| `form.twelve-bar` | sourced rule | Independent check. Open: the downbeat-bass fallback (confidence x 0.9) | `rules/harmony.md` § form.twelve-bar | `harmony.roman` |
| `form.turnaround` | sourced rule | independent check | `rules/harmony.md` § form.turnaround | `harmony.roman` |
| `form.intro-ending` | sourced rule | Bars before the first statement of the form, and after its last. + `exercise.walking-bass.e.blues.intro`, `exercise.comping.a.charleston.intro`; − a pickup bar (`mark.anacrusis`), which is not an intro | Levine, *The Jazz Theory Book* (form vocabulary); m21 `repeat.Coda`, `repeat.Fine`, `RehearsalMark` | `form.sections`, `mark.expression-text` |
| `form.multi-strain` | sourced rule | Independent check. Open: Chopin waltzes count as multi-strain (it reads sections, not genre); UNKNOWN on 1,560 unmarked items | `rules/harmony.md` § form.multi-strain | `form.sections`, `key.change` |
| `form.thirty-two-bar` | sourced rule | Independent check. Open: thresholds were set on four items; `song.classical.bertini-etude-in-b-flat-major-op-29-no-4.pdmx` and `song.classical.duvernoy-etude-op-176-no-19.pdmx` read AABA | `rules/harmony.md` § form.thirty-two-bar | `form.sections`, `melody.motif-repetition` |
| `form.binary-ternary` | sourced rule | Independent check. Open: UNKNOWN without marked sections (1,558 items) | `rules/harmony.md` § form.binary-ternary | `form.sections` |
| `form.variations` | sourced rule | Sections restating one theme's harmonic and melodic skeleton. + `song.classical.mozart-twinkle-variations-k265`, `song.classical.chopin-variations-op12.nifc`; − `song.classical.elgar-elgar-enigma-variations-xi-nimrod.pdmx` (one variation, alone). Consumer: no place reads it yet | Grove, "Variations" | `form.sections`, `melody.motif-repetition` |
| `form.sonata` | unknown-agent | Packet: `key.change`, `form.sections`, `melody.motif-repetition`. Residual: "do the key plan and the thematic returns amount to sonata form?" Items for classical.5 and classical.7: `song.classical.mozart-k545-i`, `song.classical.clementi-sonatina-no-1-muzio-clementi.pdmx` | - | the three rows |
| `difficulty.features` | direct | Every feature stored on every item (no build call site: a confirmed fault, queued), each with its convention stated | `difficulty.py:296`; m21 `features` as witness | `prereq.hand-assignment` |
| `difficulty.reading` | calibration | A component scale from its rows, weighted by fitting overall level. Ground truth: graded lists label only the overall grade, so the component is interpretable but not separately calibrated (RubricNet's design) | PSyllabus (CC BY 4.0), RCM/ABRSM lists; Mikrokosmos | `difficulty.features`, `reading.*` |
| `difficulty.rhythm` | calibration | as `difficulty.reading` | as above | `rhythm.values`, `rhythm.syncopation`, `rhythm.triplets` |
| `difficulty.pitch-navigation` | calibration | as `difficulty.reading` | as above | `hands.per-bar-range`, `technique.leap-size`, `technique.position-shift` |
| `difficulty.coordination` | calibration | Ground truth for coordination specifically is missing: a grade set calibrates overall difficulty, not coordination. Only its weight inside the overall fit is calibratable; on its own the row is UNKNOWN as a scale | as `coordination.interaction` | `coordination.*`, `texture.polyrhythm`, `texture.motion` |
| `difficulty.technique` | calibration | as `difficulty.reading` | as above | `technique.span`, `texture.block-chords`, `technique.hand-crossing`, `mark.ornament`, `rhythm.repeated-notes` |
| `difficulty.harmonic-load` | calibration | as `difficulty.reading` | as above | `harmony.rhythm`, `harmony.chromatic-share` |
| `difficulty.tempo` | calibration | as `difficulty.reading`; `tempo-defaulted` gives UNKNOWN | as above | `technique.velocity`, `mark.tempo-text` |
| `difficulty.endurance` | calibration | as `difficulty.reading` | as above | `technique.endurance` |
| `difficulty.expressive` | calibration | as `difficulty.reading` | as above | `mark.*`, `coordination.articulation-conflict` |
| `difficulty.perceptual` | sourced rule | A rule over visual density and unusual constructs. Consumer: no place reads it yet | Gould (2011); RubricNet's density features | `reading.visual-density`, `reading.unusual-notation` |
| `difficulty.level` | calibration | Ground truth is the boards' overall grade for matched pieces. Stages 0-2 sit below Grade 1: there the lists are RCM Preparatory A and B, and ABRSM and Trinity Initial, plus the taught-set order (section 2) | PSyllabus metadata; RCM 2022 syllabus PDF; Mikrokosmos (3 levels); CIPI not obtainable | `difficulty.features`, `meta.published-grade` |
| `difficulty.local-profile` | calibration | Segment difficulty from piece-level labels; ground truth is the piece grade spread over its segments (Ramoneda et al. 2022) | Mikrokosmos-difficulty; pianoplayer; PIG | `technique.velocity`, `technique.leap-size`, `technique.fingering-demand`, `technique.displacement-rate` |
| `difficulty.grade-calibration` | calibration | Match catalogue items to graded entries (identity via `meta.published-grade`), fit `difficulty.level` on the matched items, check on held-out items | PSyllabus; RCM, ABRSM, Trinity lists | `difficulty.level`, `meta.published-grade` |
| `target.distribution` | direct | share of bars holding the target, its longest run and its longest gap | positions cache (`build/positions-cache.json`) | - |
| `target.concentration` | sourced rule | The density's stated reason ("pairs ... come back in half the bars", `opportunity-density.json`) as a bars-share clause, fixed before the run. + `exercise.study.subdivision.c-major.4-4.8bar.sustained.01` (eighths in 6 of 8 bars); − `song.folk.hot-cross-buns` (eighths in 1 of 4 bars, which passes the count rule) | operational, validated empirically | `target.distribution` |
| `target.salience` | sourced rule | Staff, beat strength and chord membership of each located place. − the inner-voice case: `song.ragtime.joplin-elite-syncopations` (claimed secondary rag, not in the top line) | operational, validated on these items | `target.prevalence`, `texture.block-chords` |
| `target.isolation` | direct | co-occurring demands per bar | positions cache | - |
| `target.interaction` | calibration | as `coordination.interaction`: no ground truth located | none located | `target.isolation`, `coordination.synchrony-share` |
| `item.continuity` | sourced rule | Recovery points (rests of a beat or more, phrase ends, repeats) per A4.1's "landmark" | ABILITY-MAP A4.1 | `form.phrase`, `rhythm.values`, `mark.repeat` |
| `item.progression` | sourced rule | Demand density per quarter of the item; whether "starts simple" holds | operational; method-book ordering as the reference | `target.distribution`, `target.isolation` |
| `target.representativeness` | unknown-agent | Packet: `target.prevalence`, `target.salience`, `target.isolation`, the matcher's definition and near-misses. Residual: "are these instances the typical form of the pattern?" | - | the three rows |
| `transfer.distance` | sourced rule | Same onset set or figure in a different key, register, voicing or context than the drill. + `exercise.tresillo.c` against The Crave bars 21-26 (a verified fact) | the family contract's canonical form; FABLE §4 roles | `generated.spec-declared`, `target.prevalence`, `target.isolation` |
| `role.suitability` | sourced rule | Roles as `ORCHESTRATION-CONTRACT.md` defines them (MODEL, CONTROL, TRANSFER, SIGHT-READING), as a rule over the four inputs | ORCHESTRATION-CONTRACT.md | `target.prevalence`, `target.isolation`, `transfer.distance`, `item.progression` |
| `generated.spec-interpreted` | sourced rule | Each family's contract states each parameter's musical meaning. Example: `key` is used three ways in 100 of 1,134 files | the family contracts (`content/sources/family-contracts`) | `generated.spec-declared` |
| `generated.spec-complete` | direct | which of range, phrase structure and harmonic plan each family declares (a listing). Whether a family must declare them is the contract's question (FABLE §5) | `family_contracts.py:81` | - |
| `generated.spec-vs-actual` | direct | m21 and pt read the generated file; each declared field (range, key, metre, bars, harmony where declared) is compared | m21, pt | `generated.spec-complete` |
| `integrity.key-consistency` | sourced rule | The rule in `score_checks.py:452`, its basis quoted. Run the analysis in the build (today `--no-analysis`); pt as second witness | `score_checks.py:452`; pt `estimate_key` | `key.tonic-mode` |
| `integrity.render` | direct | the CI render step (`ci.yml:474`) passing on the current catalogue: evidence, not a rule | `render_check.py` | - |
| `integrity.duplicate-version` | sourced rule | Same work means same `work_key` plus bar-fingerprint containment over a threshold, stated. + `song.classical.ode-to-joy.full` / `.rh` / `beethoven-ode-to-joy.easy`, `song.classical.satie-gymnopedie-1` / `.alt`; − `song.classical.bach-menuet-bwv-anh-113.pdmx` against `bach-menuet-in-d-minor-bwv-anh-132.pdmx` (similar titles, different works) | `score_checks.py:1059`, `:1000`; `quarry_core.py:95` | `meta.title`, `notation.bars` |
| `integrity.extra-parts` | direct | parts beyond piano, written on the row | m21 parts and instruments; `quarry_core.py:207` | - |
| `integrity.transposing-part` | direct | a part with a transposition | m21 `Instrument.transposition`; raw `<transpose>` | - |
| `integrity.lead-sheet-shape` | direct | one staff with chord symbols | over `notation.staves`, `notation.chord-symbols` | - |
| `integrity.piano-range` | direct | lowest and highest MIDI pitch against 21-108 | pt `note_array` | - |
| `integrity.hand-span` | sourced rule | Maximum span per stage, from the syllabi's technical requirements (e.g. octaves first required at a stated level). + technique.7's octave items at their stage; − the same items placed at stage 2 | RCM 2022 *Technical Requirements*; ABRSM scales lists | `technique.span` |
| `integrity.notation-sanity` | sourced rule | Which disagreements are faults: spelling (pt's estimate against the file) and beaming against the metre | Gould (2011); pt `estimate_spelling`, `estimate_voices` | `reading.accidental-churn`, `texture.two-voice` |
| `integrity.metadata-trust` | sourced rule | Trust per field: a matched composer is trusted; title and tags are uploader text unless matched to a reference work list. The current code's rule, stated with its basis | `quarry_core.py:95`; `composers.json` | `meta.composer-era`, `meta.title`, `meta.genre-tags` |
| `integrity.arrangement-fidelity` | unknown-agent | Packet: `integrity.duplicate-version`, `integrity.truncation`, `integrity.key-consistency`, `integrity.title-structure`. Residual: "is this a faithful arrangement?" External where a reference edition can be compared; unverified otherwise | - | the four rows |
| `style.evidence` | direct | Re-routed from calibration: the vector is an assembly of rows that each carry their own provenance, with no model. A combined label is `style.genre-label`'s job | over the listed rows | `notation.swing-mark`, `harmony.*`, `rhythm.syncopation`, `form.sections` |
| `style.genre-label` | unknown-agent | Re-routed from calibration: no style-labelled score set was found; PDMX tags are uploader text. Packet: `style.evidence`, `meta.genre-tags`, `meta.composer-era`, `meta.collection`. Residual: "which style is this?" The track rules in `places.yaml` read the signals, not this label | - | `style.evidence` |
| `style.good-example` | unknown-agent | packet and residual as `judgment.md` gives them; unverified as music | - | `style.evidence`, `harmony.voicing`, `harmony.rhythm`, `hands.per-bar-range`, `target.prevalence` |
| `quality.phrase-shape` | sourced rule | The beginning-and-arrival rule in code, quoted, then run on PDMX as well as generated phrases | Caplin (1998) for arrival; FABLE §5 features | - |
| `quality.contour` | sourced rule | contour types and reversals, quoted | Huron (1996), the melodic arch | - |
| `quality.rests` | sourced rule | rest placement at phrase ends, quoted | FABLE §5 features; Caplin | `form.phrase` |
| `quality.leap-recovery` | sourced rule | a leap followed by a step in the other direction, quoted | von Hippel and Huron (2000), post-skip reversal | - |
| `quality.cadence-close` | sourced rule | the phrase ends on a stable degree with a longer value | FABLE §5 features; Caplin | `melody.degree-profile` |
| `quality.reference-distribution` | calibration | Reference distributions per level from real pieces at that level: evidence and regression diagnostics, never gates (FABLE §5). Ground truth is real music at level L, never "good" | Mikrokosmos levels; graded-matched catalogue items; Essen melodies for melodic features | `difficulty.grade-calibration`, `melody.motif-repetition`, `quality.contour` |
| `quality.coherence` | unknown-agent | packet and residual per `judgment.md`; stated as "unverified as music" | - | the split's six rows |
| `quality.idiomatic` | unknown-agent | packet and residual per `judgment.md` | - | the split's four rows |
| `quality.pedagogical-fit` | unknown-agent | packet: every measured fact inside the rung rule (section 2); residual per `judgment.md` | - | the split's seven rows |
| `meta.title` | direct | genre words (carol, minuet, étude, rag, waltz, march) matched from a word list; trust inherits `integrity.metadata-trust` | `score_checks.py:406` | `integrity.metadata-trust` |
| `meta.published-grade` | direct | a lookup after identity matching | PSyllabus metadata JSON (CC BY 4.0); RCM 2022, ABRSM and Trinity lists | `integrity.metadata-trust` |
| `meta.familiarity` | unknown-agent | Packet: `meta.title`, `integrity.duplicate-version` (upload count). Residual: "is the tune widely known?" No sourced list exists | - | the two rows |

## 2. How the results decide rung placement

### 2.1 The form of a rung rule

A rung rule is a record, one per rung, read by one evaluator. It reads table rows only: values with their provenance. It also reads curriculum facts the build already derives. It never reads a score directly. Proposed shape, in `docs/classifier/rung-rules.yaml`, validated by `build_matrix.py` like the other yamls:

```yaml
"2.2":
  purpose: "play eighth notes evenly, two to the beat, and count the off-beats"   # quoted, with where from
  purpose_src: [content/lessons/2.2.md, stage-2.json finder.skill]
  roles: [CONTROL, MODEL, TRANSFER]            # places.yaml's roles the options serve
  target:                                      # every clause must pass
    - {row: rhythm.eighths, measure: established, threshold: opportunity-density.json, means: "two to a beat"}
    - {row: notation.times, measure: simple-metre-bars, threshold: all}   # per-rung meaning of eighth-notes
  taught: derived                              # claims.rung_ancestry + taughtAt; never written by hand
  tolerate: []                                 # rows present-but-not-established allowed although untaught, each with its reason
  avoid: [notation.swing-mark]                 # absent rows the taught-set clause does not already cover
  band: {stage: 2, components: none, why: "below Grade 1: the taught set carries coping (§2.3)"}
  unknown_when: [measurement.misread, provenance: metadata-only on tempoSensitive rows, witnesses disagree, inferred below confidence]
```

What it reads, clause by clause:

| Clause | Reads | How |
| --- | --- | --- |
| Target | the characteristics the rung's concepts map to, through their per-rung meaning | a measure (present, established by density, bars-share, count) and a threshold whose source is named |
| Taught set | `prereq.untaught-demands` against the ancestry | derived by `claims.untaught_on`; widened row by row as rows gain code. An untaught demand fails unless `tolerate` names it with the curriculum review's reason |
| Avoid | the finder's `avoid` list | only what the taught set does not already exclude |
| Band | difficulty components with ceilings, each from `difficulty.*`, and the calibration that fixes them | never a single uncalibrated number as a gate (§2.3) |
| Unknown policy | each input's provenance | which provenances make a clause decidable: exact, or two witnesses agreeing. One witness where two disagree, inferred under its confidence, a `measurement.misread` mark, and a tempo-defaulted item on a tempo-sensitive row each give UNKNOWN |

**Per-rung meanings.**

Today `concepts.yaml` gives one `k`/`ch` per concept. Iteration 1 put the per-rung meanings of 74 names into free-text `amb` notes (`research.md` §7). A rule cannot read free text, so the schema needs a field. Proposed shape:

```yaml
articulation:
  k: notes
  ch: [mark.articulation, mark.slur]
  per_rung:
    classical.3: {k: played, ch: [meta.composer-era, texture.two-voice], instead: played,
                  means: "marks absent, chosen by the player: unmarked Baroque two-voice pieces"}
alberti: {same_as: alberti-bass}
```

`build_matrix.py` checks four things:
- every `per_rung` key is a rung that names the concept;
- each entry is complete;
- a `same_as` target exists;
- once the migration is done, no `amb` names a rung without a `per_rung` entry.

`generated/rungs.md` then renders per-rung rows. This is a schema change (`build_matrix.py`), so it is decision D1.

### 2.2 FITS, DOES NOT FIT, UNKNOWN

For each item on each rung:
1. Each clause gives PASS, FAIL (with the failing value), or UNKNOWN (with the blocking input and its route).
2. Any FAIL gives **DOES NOT FIT**, listing every failing clause, even when other clauses are UNKNOWN. A decided failure does not wait on an undecided clause.
3. Otherwise, any UNKNOWN gives **UNKNOWN**. The output names the clause, the input, and what would resolve it: the fix queued for a confirmed-wrong measurement, a calibration, or an agent residual.
4. Otherwise, **FITS**.

**UNKNOWN never becomes FITS.**
- No default applies, and no "probably".
- A measurement UNKNOWN (a misread clef, a defaulted tempo, a missing calibration) is never handed to an agent as a substitute.
- An agent answers only a residual of a JUDGMENT row the rule declares as its own clause. Today that is only `quality.pedagogical-fit`, used to choose among items that already FIT; that answer is recorded with provenance `agent` and listed apart.

The differential against today's options becomes the moves, itemised where/what/before/after/why (README step 6).

### 2.3 What decides each rung's purpose, and the band

**Who drafts it.** An Opus agent drafts each rung's `purpose`, `roles`, `target`, `tolerate` and `avoid` from five sources:
- the lesson text (`content/lessons/<rung>.md`);
- the stage file (title, concepts, `introduces`, `finder.skill/constraints/avoid`, `mastery`, `requirements`);
- the ABILITY-MAP block for each ability the rung serves;
- the chain record, where one exists;
- the iteration-1 per-rung meanings.

Every clause quotes the line it comes from.

**Who checks it.** A fresh checker (a different agent pass) verifies each clause against its quoted line. The outside reviewer reads it as text. The orchestrator judges disagreements. The owner is never a gate.

**Conflicts are itemised, not resolved inside the rule.** Where the lesson names an item the rule refuses (2.2's Alouette and Sakura, §3), or where the lesson teaches something locally that `taughtAt` places later, that is a curriculum decision: change the lesson, add a `tolerate` entry with its reason, or move `taughtAt`. It goes to the curriculum review as a line.

**The band.**
- Stages 3-9: the band reads `difficulty.level` only after `difficulty.grade-calibration` exists. Until then the band clause is UNKNOWN, so no item at those stages can FIT. That holds back everything, which is why calibration matters most there.
- Stages 0-2: below Grade 1, no published grade separates them (`places.yaml`). The proposal is that the taught-set clause plus explicit ceilings carry the coping question there: length, and tempo for tempo-sensitive targets. Method books order their early levels by the concepts they introduce, which is what the taught set encodes. The level number is a ranking signal at these stages, not a gate. This is a design choice for the curriculum review to accept or reject (D7). The worked example uses it.

## 3. Worked example: rung 2.2, "Eighth notes and counting 1 and 2 and"

**Why this rung.** Every row its concepts read is EXISTS: `eighth-notes` and `beams` read `rhythm.eighths`; `subdivision` reads `rhythm.shorter-than-quarter`. Its finder's avoid list also reads EXISTS rows: `rhythm.triplets`, `rhythm.syncopation`, `metre.compound`.

**Purpose** (`content/lessons/2.2.md`; `stage-2.json` finder): "playing eighth notes evenly and counting the off-beats"; "two of them fill one quarter-note beat". Per-rung meaning of `eighth-notes`: two to a beat. In 6/8 the eighth is the counting unit (the lesson says so), so compound bars do not exercise this target.

**The rule:**

| Clause | Reads | Passes when |
| --- | --- | --- |
| T1 target | `rhythm.eighths` (EXISTS), `target.prevalence` (EXISTS) | eighths established: at least 8 located and at least 0.5 per bar (`content/sources/opportunity-density.json`) |
| T2 meaning | `notation.times`, `metre.compound` (EXISTS) | eighths in simple metre |
| C1 taught set | `prereq.untaught-demands` (EXISTS) | nothing measured outside 2.2's ancestry (0.1-2.1 and 2.2: clef.bass, interval.step, skip and leap, metre.three-four, rhythm.eighths, rhythm.shorter-than-quarter, texture.hands-together). A demand marked `measurement.misread` gives UNKNOWN |
| A1 avoid | `notation.swing-mark` (EXISTS) | no swing mark; 2.2 teaches even eighths. The finder's triplets, syncopation and compound metre are already in C1 |
| B band | stage 2 | taught set as above; the ceiling is the written tempo, and `tempo-defaulted` gives UNKNOWN for these tempo-sensitive targets (`opportunity-density.json` `tempoSensitive`) |

**Three real items.** Measured from the built catalogue, the positions cache and `claims.untaught_on` (scripts in my worktree's `build/`); the clef read by m21.

| Item | Verdict | Why |
| --- | --- | --- |
| `exercise.study.subdivision.c-major.4-4.8bar.sustained.01` | **FITS** | T1: 18 eighths in 8 bars, in 6 of the 8. T2: 4/4. C1: nothing untaught. A1: `swungMark` false. B: tempo 72, written by the generator. Generated pipeline: the app's detectors read the file, independent of the generator's spec (`generated.spec-vs-actual`) |
| `song.folk.anonymous-swing-low-sweet-chariot.pdmx` (a 2.2 song option today) | **DOES NOT FIT** | C1 fails: `rhythm.syncopation` is established (4 located, at printed bars 2, 6, 10 and 14, so not the pickup case) and is taught at 4.5, latin.3 and jazz.4, none on 2.2's path. `rhythm.dotted-quarter` (taught 2.4) and `range.beyond-position` (taught 2.5) are present. B would be UNKNOWN (tempo-defaulted), but a FAIL decides. Move: off 2.2's options, itemised |
| `song.folk.hot-cross-buns.lh` | **UNKNOWN** | T1 passes: 8 eighths in a 4-bar item. C1: its only untaught demand is `pitch.ledger` (17 located), and the build marks that reading `misread` ("one staff in the bass clef: the detectors read staff 1 as the treble clef"). m21 reads a bass clef and the notes C3, D3, E3, all inside the bass staff, so no ledger line. Two witnesses disagree, so the clause is UNKNOWN. It is resolved by the queued clef-read fix (D4), never by a default |

**What the example shows** (measured on the built catalogue, every measured item, rule clauses T1 + C1 + B):
- **No real song FITS at 2.2 except `song.folk.hot-cross-buns`.** Two of 2.2's own named songs are refused: `song.folk.sakura.pdmx` (untaught pitch.ledger, rhythm.ties, range.beyond-position) and `song.folk.london-bridge`, whose 4 located eighths do not reach the density rule and whose bar-8 shift is untaught.
- **Hot Cross Buns passes T1 with all its eighths in bar 3, one bar of four.** The density file's stated reason is "pairs of them come back in half the bars", but its arithmetic is a count per bar. The reason and the arithmetic disagree. That routes `target.concentration` (a sourced rule) and the role question (an introduction item against a fluency item: `role.suitability`).
- **`song.folk.alouette.pdmx` fails C1 on `metre.compound` (taught at 4.5), yet the lesson teaches its 6/8 on this rung.** A one-fact-three-places conflict between the lesson, the options and `taughtAt`, for the curriculum review (D7).

## 4. Open decisions, each with its route

| # | Decision | Route and what decides it | Drafts / checks |
| --- | --- | --- | --- |
| D1 | **Per-rung meanings** (74 `amb` names) | Schema: add `per_rung` and `same_as` to `concepts.yaml` (section 2.1), checked by `build_matrix.py`. Then each `amb` becomes entries, or is removed with the reason. The meanings come from the lessons, as iteration 1 read them. The five UNSURE names (bossa-nova, modal-minor, coordination, finger-independence, rhythm) are settled by opening the rung's files (direct): bossa-nova's latin songs, rock.4's figures. Where the lesson never says (technique.5's "rhythm", technique.4's "coordination"), the curriculum review decides | Opus drafts the entries and the `build_matrix.py` change; a fresh checker compares each with its lesson line; the reviewer reads |
| D2 | **Eight rows marked `onedef: detect.ts` that now have Python rule code**: `rhythm.secondary-rag`, `harmony.bass-behaviour`, `texture.alberti`, `texture.waltz-bass`, `texture.oom-pah`, `texture.charleston`, `texture.tumbao`, `texture.clave` | **What I checked.** `detect.ts` defines none of the eight as a detector, and none is one of the 22 vocabulary demands (`taughtAt` lists 22). The app names some of them only in generation (`sightReading.ts`), backing loops, help text and comments. So no app consumer measures these facts, and the tag points at a definition that does not exist. **Proposed:** remove `onedef` from the eight; the Python rule is the one definition. If a row later becomes an app demand (eligibility of an imported score), its definition moves to `detect.ts`, with the Python kept as the test witness, in the same change. One invariant is still owed: every `texture.alberti`, `waltz-bass` and `oom-pah` positive must also be a `texture.left-hand-pattern` positive (`detect.ts:588`, the family the three are species of). It is a cross-definition test, run when the rules are checked. `harmony.bass-behaviour` already leaves walking bass to `detect.ts walkingBass`. The README's "one definition per fact" stays; only the tag changes | Orchestrator decides; one-line yaml edits plus the invariant written as a check in the next table pass |
| D3 | **`approach-note` and `vamp` point at rules that do not define them** | **approach-note** is read on jazz.6, blues.6 and jam.6, all walking-bass rungs, so the bass sense. It is a sourced rule: the last bass note before a chord change lies a semitone or a whole step from the new root. Source: Friedland, *Building Walking Bass Lines* (1995), secondhand via Wikipedia, as the walking-bass adjudication cites it; Levine, *The Jazz Theory Book*. Measured with m21 at bar joins, on the lower staff: the last bass note of each bar against the first of the next. Mid-bar chord changes were not read. `exercise.walking-bass.c.blues` arrives by semitone at 12 of 12 joins; `exercise.walking-bass.f.ii-v-i` at 3 of 3. Near-misses: `exercise.boogie.c.root-fifth` (7 semitones at every join), `exercise.boogie.f.walking-eighths` and `exercise.boogie.c.pinetop` (4). It is a sub-measure of the walking line, so it lives beside `walkingBass` in `detect.ts` if the app needs it, otherwise in `harmony.bass-behaviour`. The melodic approach note is already defined in `melody.chord-relation` (A7b.2). **vamp** (rock.4; theory.5 is an activity) is a sourced rule: a loop of one to four chords repeated unchanged, at least twice through. Source: the ostinato article `rules/texture.md` already quotes ("a repeating musical figure"); a two-chord loop is the case `harmony.progression` misses. + `exercise.modal-vamp.a`, `.d`, `.e`: in `measure.py`'s 2026-10-07 output, `harmony.progression` returns no named progression for all three, and `texture.ostinato` reads absent, so the concept selects none of its own positives. − `exercise.ostinato.e.fifths` (a melodic figure; ostinato present, no chord loop). Duplicates `riff` and `ostinato` on rock.4: `same_as` per D1 | Opus writes both definitions on the rules pages with these fixtures; a fresh checker verifies on the files |
| D4 | **30 score-model misreadings** (DC2 `593a2cff`: clef not read, voice-to-hand, first key only, a tuplet label) | Each class is a measurement already confirmed wrong, so the fix is queued, not new code (FABLE §2 item 7). Clef: read each staff's `<clef>` with offsets in the score model (`notation.clef-change`, direct); `build.py:509` already marks 75 items `misread`, and the marks give UNKNOWN until fixed. First key only: detectors read every key change (`notation.keys` already lists them; direct). Tuplet label: read `<time-modification>`, not the label (`rhythm.tuplets-other`, direct). Voice-to-hand: `prereq.hand-assignment` (staff direct for two-staff files; calibration for one-staff). **The 30 are not itemised in any tracked file.** I searched origin's tree for the class phrases and checked the six files DC2 touched; DC2's commit message gives only the counts. So the first step is recovering the per-item list: from the adjudicator's data if kept, or by re-running the proving-run comparison after DC2 and taking the detector-error rows | The list: a Sonnet gatherer. The fixes: one builder after the rules pass, with each class's items as red-first tests |
| D5 | **4 classifier scores that fail to load** (`tools/classifier/score.py`; reproduced 2026-10-07) | Direct, two causes: (a) **partitura's importer fails** where music21 loads all three: `song.classical.bach-invention-no-1-in-c-major-bwv-772.pdmx` and `song.classical.sakamoto-shining-boy-and-little-randy-ryuichi-sakamoto.pdmx` (IndexError at partitura `importmusicxml.py:1926`), and `song.classical.puccini-o-mio-babbino-caro-for-solo-piano.pdmx` (KeyError '512th' in partitura's duration table). Route: music21 as the fallback reader for the note array when pt fails, the provenance saying so. (b) **`score.py`'s own pickup line** (`notes[measures[0] == 0]` indexes the all-parts note array with part 0's mask) fails on `song.classical.chopin-ballade-1`: pt loads it as 2 parts, the second with 3 notes, so the all-parts array has 5,179 rows against part 0's 5,176-row mask (the error message's numbers). A confirmed fault: mask per part. Until fixed, all four items are UNKNOWN on every row with the reason "score did not load" (`measure.py` already records `_load_error`), never dropped | One small fix after the rules pass; the four items as tests |
| D6 | **The 44 written rules have not passed an independent check** | Sourced rule: iteration 2's checkers, each against its rules page's positives and near-misses and the open limit on its line in section 1. A rule passes, or its row stays PARTLY with the finding | Fresh checkers; the reviewer reads |
| D7 | **Rung purposes and the stage 0-2 band** (sections 2.3 and 3) | The curriculum review decides five things: (1) whether stages 0-2 use taught set plus ceilings instead of the level number; (2) Alouette and 6/8 at 2.2 against `metre.compound` at 4.5; (3) whether 2.2's named songs that carry an untaught shift or a single tie are tolerated; (4) whether an introduction item may hold its target in one bar (Hot Cross Buns) while a fluency item may not; (5) the opportunity-density reason against its arithmetic | Opus drafts per rung from the lesson; a fresh checker; the reviewer; never the owner as a gate |
| D8 | **Calibration access** | CIPI's terms (academic affiliation, non-profit research) appear to exclude this project. The difficulty calibration rests on PSyllabus metadata (CC BY 4.0), the RCM, ABRSM and Trinity lists, and Mikrokosmos (no licence file). Whether to ask CIPI's owners is the owner's call, the only item here that is | owner, if at all |

## 5. Counts

Counted by script from the table above against `characteristics.yaml`. Every non-EXISTS row appears exactly once; no other row appears.

| Route | Rows |
| --- | --- |
| direct | 76 |
| sourced rule | 79 (44 of them written rules awaiting their independent check) |
| calibration | 24 |
| unknown-agent | 13 |
| **total** | **192** = the non-EXISTS rows of `characteristics.yaml` (99 PARTLY + 93 MISSING) |

**13 rows are routed differently from their yaml `decision`.** This file does not edit the yaml; the next table pass applies or rejects each one with the reason given on its line.
- DIRECT → sourced rule (4): `mark.expression-text`, `reading.unusual-notation`, `key.set-membership`, `harmony.voice-leading`.
- CALIBRATED_MODEL → sourced rule (1): `harmony.modal`.
- CALIBRATED_MODEL → unknown-agent (5): `texture.counterpoint`, `texture.part-roles`, `texture.half-time`, `texture.call-response`, `style.genre-label`.
- SOURCED_RULE → direct (1): `technique.arpeggio-chord`.
- CALIBRATED_MODEL → direct (2): `technique.endurance`, `style.evidence`.

The count script and the measurement scripts behind sections 3 and 4 are in my worktree's `build/` (`count_routes.py`, `rung22.py`, `rung22b.py`, `pos.py`, `hcb.py`, `approach.py`, `loadfail.py`, `libs.py`). They are not committed.
