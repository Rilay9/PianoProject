# Area 1.C, metre, rhythm and tempo: the rules for code (Phase 2 draft, 2026-10-08)

**What this is.** FABLE.md section 2, item 3 ("Rules for code"), for the 30 characteristics of `docs/classifier/characteristics-list.md` section 1.C, in that order. Every one of the 30 is marked code or code + agent in at least one pipeline, so every one has a rule here; none is agent-only or a gap. For each: the input, the library call or the custom algorithm, each threshold with its source or its validation on the catalogue, the output and its provenance, when it answers UNKNOWN, what differs by pipeline, the agent's residual where there is one (the residual only; the instruction is Phase 3), and real items from the catalogue. Worktree cut from origin at 75862593. Nothing in the repository's code, tables or other rules pages was changed.

**Status: a draft for the checker.** Phase 2's done condition (FABLE.md section 2, item 3) needs this page argued against by another agent, the findings applied and the orchestrator's judgement. None of that has happened. Nothing here was heard; where a musical question cannot be answered from the notation it is marked *unverified as music*.

## 0. What every rule here shares

**Measurements behind this page** (all run 2026-10-08 in this worktree's `build/r1c/`, not committed; the catalogue and its 2,020 score files copied from the main checkout's `app/public/content`, never written there):
- `raw.py`: a raw-MusicXML scan of all 2,020 notated files (0 failed): every `<time>` (and `symbol`, composite `<beats>`, `<senza-misura>`), the first bar's notated length against its signature, `<type>`, `<dot>`, `<tie>`, `<time-modification>`, `<grace>`, `<cue>`, `<metronome>`, `<sound tempo>`, `<words>`, `<swing>`, `<multiple-rest>`, beam groups and `print-object`. The reader the rules below call "the raw reader".
- `onsets.py`: every notated item through `tools/classifier/score.load` (partitura's note array and the one hand rule) and `rules/rhythm.py`'s `Bars`; 2,016 read, 4 fail to load (the same 4 that fail for every rule in `rules/rhythm.md`). Output `onsets_v3.json`.
- `sync_v4.py` (syncopation), `cells_hands.py` (habanera and tresillo per hand), `clave_align.py` (clave direction), `grace.py` (grace runs and long tuplets), `words2.py` (tempo and swing words), `pt_words.py` (what partitura makes of tempo words), `m21_tempo.py` and `m21_witness.py` (music21 witnesses), `sync_split.py` and `vel_split.py` (the proving run's disagreements), `pickup_agree.py`.
- **Pipelines** as the counts below give them: generated = ids `exercise.*` (1,211 files); PDMX = ids ending `.pdmx` (519 files); "rep" = the other 290 imported repertoire files (Mutopia, kern, MuseTrainer, NIFC and the excerpts). The characteristics list marks two pipelines; rep is counted apart because it is neither, and every PDMX rule below applies to it unless a section says otherwise.

**The input.** Unless a section says otherwise a rule reads the item's file through `score.load` (partitura 1.9.0 `load_musicxml`, `note_array(include_staff, include_time_signature, include_metrical_position, include_key_signature, include_pitch_spelling)`): tie chains merged into one note (partitura's `notes_tied`), grace notes with zero duration and left out, the hand by score.py's rule (staff 1 right, staff 2 left; two one-staff parts: part 0 right; one staff: the catalogue's `hands`). What partitura drops is read by the raw reader: `<time symbol>`, composite `<beats>`, `<metronome>` with its beat unit and dots, `<swing>`, `<multiple-rest>`, `<cue>`, `<time-modification>` ratios, beams, `print-object`. Rhythm reads sounding time, so the octave shift question (displayed against sounding pitch) does not arise in this area except where a section names a pitch (`rhythm.repeated-notes` compares MIDI pitches, the same under either reading).

**The felt beat** (one table for the whole area, from `metre.class` below): simple metres beat on the denominator (2/4, 3/4, 4/4: quarter; 2/2, 3/2: half; 2/8, 3/8: eighth); compound metres (numerator 6, 9, 12, 15 or 18, any denominator: 6/8, 9/8, 12/8, 6/4, 12/4, 6/16) beat on three of the denominator's value (dotted quarter in 6/8, dotted half in 6/4); irregular metres beat on the denominator unless `metre.grouping` gives the groups. The beat's division: three in compound metres, two otherwise. Strong beats: the downbeat, and in a four-beat bar also beat 3 (music21's `TimeSignature.getAccentWeight` gives 0.5 there and less elsewhere).

**Readable bars.** As `rules/rhythm.py`'s `Bars`: a bar whose notated length equals its signature's; a pickup bar is read right-aligned to the bar line that ends it (its notes keep their beat positions within the metre); any other short or long bar is not read by a per-beat rule, and is counted.

**A pattern** (where a row says a figure is "present" only when it recurs): `rules/rhythm.py`'s `repeated`, two consecutive bars or four anywhere, the definition validated in `rules/rhythm.md` (Lullaby of Birdland's three scattered tumbao bars are not a tumbao).

**Output.** Each rule returns a `score.Result`: a value (present or absent, counts per kind, per hand or staff), `where` (0-based bar indices; printed bar numbers are these plus one, a pickup counted as bar 0 here), provenance (`exact` for a deterministic reading of the notation; `two-witnesses` where a second reader was run and agreed; `one-witness` for a value the file states but does not print; `metadata` for a catalogue fact), or UNKNOWN with its reason. Every rule also answers UNKNOWN `no notes` and `the file does not load` (the 4 items above).

**The hand on PDMX** (1.M): where a rule reports what one hand plays, code flags the passages where the staff may not be the hand (a voice split inside a bar across staves, a voice-number collision, hand words such as "m.g." or "l.h.", a staff chord beyond one hand's reach) and an agent reads only those, once per item, shared by every row. Rules defined per staff (what is printed on a staff) do not inherit it. This is not repeated in each section; a section says only which of the two its rule is.

---

## notation.times

**Input.** The raw reader's `<time>` elements of part 0, each with its measure index, `symbol` attribute, composite `<beats>` ("3+2") and `<senza-misura>`; witnesses: music21 `meter.TimeSignature` per measure and partitura's `ts_beats`/`ts_beat_type` per note.

**Rule.** List every `(bar, signature, symbol)`. A *change* is a bar whose signature differs from the one before. Two kinds of signature are reported apart and not counted as changes of metre:
- **a partial-bar device**: a signature lasting exactly one bar, shorter than the signature before and after it (which are equal), at a repeat, volta or the first bar. PDMX writes split bars around repeats this way (Beethoven's Bagatelle Op. 119 No. 3, `song.classical.beethoven-bagatelle-in-d-major-op-119-no-3.pdmx`: 1/4 and 1/8 bars inside 3/8; the Radetzky March, `song.classical.radetzky-march-for-easy-piano.pdmx`, a 1/4 bar at bar 72 of 4/4);
- **a cadenza bar**: a signature lasting exactly one bar, longer than the signature before it and returning to it after (`song.classical.chopin-nocturne-op9-2` 6/4 and 2/4 inside 12/8 at its "Senza tempo"; `song.classical.s-awecki-super-mario-land-2-ending-theme-as-played-by-tom-brier.pdmx` 12/4, 8/4, 11/8, 33/16 for one bar each): reported to `rhythm.cadenza` as a candidate;
- **a symbol that contradicts the numbers**: `symbol="cut"` with 4/4 (8 files: `song.classical.beethoven-moonlight-i`, Czerny Op. 299 Nos. 5 to 9 on PDMX, `song.folk.boogie-woogie.pdmx`, `song.jazz.twelfth-street-rag`). The learner reads the printed ¢; `metre.class` classes it 2/2 and the item is flagged to `integrity.notation-sanity`. `symbol="common"` with 4/4 (95 signatures) and `symbol="cut"` with 2/2 (15) are consistent.

**Thresholds.** None. The partial-bar definition is operational (this page), validated on the two PDMX items named.

**Output.** The signatures with their bars; the number of changes; the partial-bar devices and contradicting symbols apart. Provenance `two-witnesses` (the raw reader and partitura agree; the proving run of 2026-10-07 found 0 of 1,211 generated and 0 of 524 PDMX disagreeing with its own witness, `docs/classifier/proving/2026-10-07/report.md`). **UNKNOWN**: never; a file with no `<time>` at all is reported `unmetred` (1 item, `song.classical.satie-gnossienne-1`, which the app reads as 4/4; `metre.class` is UNKNOWN for it).

**Pipelines.** Generated: no item changes signature (measured: 0 of 1,211; signatures 4/4 1,108, 2/4 74, 3/4 18, 6/8 8, 12/8 1, 5/4 1, 7/8 1); the recipe's `timeSig` (meter family) is the cross-check. PDMX: 33 of 519 files change signature, among them the partial-bar devices above; composite numerators and `<senza-misura>` occur in no file of either pipeline (measured).

**Examples.** Positives: `song.classical.chopin-fantaisie-impromptu-in-c-sharp-minor-op-66.pdmx` (changes of signature), `song.beautiful.hungarian-sonata` (changes). Near-misses: `song.classical.beethoven-bagatelle-in-d-major-op-119-no-3.pdmx` and `song.classical.radetzky-march-for-easy-piano.pdmx` (one-bar partial-bar devices, not changes of metre); `song.classical.beethoven-moonlight-i` (prints ¢ with numbers 4/4).

## metre.class

**Input.** Each signature from `notation.times` (numerator summed over composite parts), with its symbol.

**Rule (a fixed table).** Let N be the numerator, D the denominator.
- N = 2, 3, 4: simple duple, triple, quadruple. Named apart inside these: **3/8** (simple triple, three eighth beats) and **cut time** (2/2, or ¢ whatever the numbers say).
- N = 6, 9, 12 (and 15, 18): compound duple, triple, quadruple, whatever D is (6/8, 9/8, 12/8, 6/4, 12/4, 6/16).
- N = 1: `single`, reported only; a one-bar N = 1 signature is a partial-bar device (`notation.times`).
- any other N (5, 7, 8, 10, 11, 13 ...): irregular, named by N (quintuple 5/4, 5/8; septuple 7/8, 7/4; 11/8 ...). How it groups is `metre.grouping`.

**Sources and validation.** Simple against compound, and the top numbers 6, 9 and 12 of compound duple, triple and quadruple: Open Music Theory, "Meter" (https://openmusictheory.github.io/meter.html: "Meters that divide the beat into two equal parts are simple meters; meters that divide the beat into three equal parts are compound meters"; compound duple 6, triple 9, quadruple 12) [sourced; OMT has no irregular metres and says nothing of 3/8 or cut time]. 3/8 as simple triple: the app's ruling (`app/src/score/metre.ts` `isCompound`, the reviewer's ruling L120b) and ABRSM's sight-reading parameters, which list 3/8 at Grade 3 apart from 6/8 at Grade 4, and 5/8, 5/4 at Grade 6 and 7/8, 7/4 at Grade 7 (as quoted in `docs/classifier/abilities/draft-abrsm-trinity.md`, ABRSM 2025-26 syllabus p.16; a reading of that draft's quotation, not re-read here).

**Two definitions in the tree that disagree** (operating procedure section 5):
- music21 10.5 `TimeSignature.classification` (checked by import on every signature in the catalogue): 3/8 "Other Single" (`beatCount` 1, one dotted-quarter beat); 7/8 "Simple Septuple"; 6/4 and 12/4 compound. The app's `isCompound` reads compound only with denominator 8, so 6/4 (11 files, among them `song.classical.chopin-nocturne-op9-1` and `song.classical.liszt-liebestraum-3`) and 12/4 (1 file) are simple six- and twelve-quarter bars to the app.
- Recommendation: this table is the source of truth: OMT's numerator rule for compound (so 6/4 is compound duple, against the app), the app's ruling for 3/8 (against music21). The app's `isCompound` is a code defect for 6/4 and 12/4, to correct in Phase 5.

**Output.** Per signature: its class and name, with the bars it covers; the item's set of classes. Provenance `exact`. **UNKNOWN**: no signature (`unmetred`). Witnesses: music21 `CompoundOrSimpleMeterFeature`, `TripleMeterFeature`, `QuintupleMeterFeature`, `ChangesOfMeterFeature` (checked to exist; they follow music21's classification, so they disagree on 3/8 by design).

**Pipelines.** Identical. Generated: the meter family's recipe declares the signature (cross-check). The proving run's metre rows (compound, three-four, odd) agree with their witness on all items (0 of 1,211, 0 of 524).

**Examples.** Positives: `exercise.meter.7-8` (irregular, septuple), `exercise.meter.12-8` (compound quadruple), `exercise.rhythm.six-eight-eighths.4bar` (compound duple), `song.classical.beethoven-fur-elise` (3/8, named apart). Near-misses: `song.classical.chopin-nocturne-op9-1` (6/4: compound duple here, simple to the app); `song.classical.beethoven-moonlight-i` (numbers 4/4, printed ¢: cut time here); `song.classical.chopin-nocturne-op9-2` (12/8, whose cadenza bars 34-36 are encoded as a 6/4 and a 2/4 bar: signatures that measure a cadenza, not a change of metre; `rhythm.cadenza` reads the "Senza tempo" there).

## mark.anacrusis

**Input.** The raw reader: the first bar's notated length (the furthest point any part, staff or voice reaches in it, from `<duration>`, `<backup>` and `<forward>`, rests included) and its signature; witness: `score.load`'s `pickup` (partitura's measure lengths).

**Rule.** An anacrusis is present when the first bar is shorter than its signature's bar. Its length in beats is the first bar's length over the felt beat. Not an anacrusis: a full first bar that opens with rests (reported as `late_entry`, the offset of its first note in beats, which `rhythm.silence` uses); a pickup written as its own short signature (none found in the catalogue: 0 files whose first signature is shorter than the second and lasts one bar, measured). `implicit="yes"` is not required: it is a witness only.

**Sources and validation.** Wikipedia, "Anacrusis" (https://en.wikipedia.org/wiki/Anacrusis): "a note or sequence of notes, a motif, which precedes the first downbeat in a bar in a musical phrase"; the notation "should omit a corresponding number of beats from the final bar" [sourced]. Whether the final bar is shortened to match is reported (`final_completes`), never required: the source says "should", and PDMX re-exports are inconsistent. Validated: the raw reader and `score.load` agree on every one of the 2,016 loadable items (generated 0 and 0; PDMX 102 and 102; rep 80 and 80) [measured, `pickup_agree.py`]. `implicit="yes"` marks only 5 of the 104 PDMX files with a short first bar and 11 of the 80 rep files, so a rule on `implicit` alone would miss 95 per cent of them [measured, `raw_report.py`].

**Output.** Present or absent; the length in beats (the commonest: one quarter, 57 PDMX and 51 rep files; an eighth, 27 and 18; two quarters, 15 PDMX); the late-entry offset where the bar is full. Provenance `two-witnesses`. **UNKNOWN**: no signature.

**Pipelines.** Generated: no item has an anacrusis (0 of 1,211, measured) and no generator family writes one (`generate_exercises.py` has no pickup; the one "upbeat" at line 2339 is a comment about a bass pattern), so absent by the family list, code over the file confirming it. PDMX: as the rule; the 24 files that open with a full bar led by half a bar of rest or more (90 with any leading rest) are not anacruses as defined, and are reported as late entries [measured]. Whether such a bar was meant as a pickup is not a question this row asks.

**Examples.** Positives: `song.classical.away-in-a-manger.pdmx`, `song.classical.alexander-s-ragtime-band.pdmx`, `song.classical.beethoven-fur-elise` (one-eighth pickup). Near-misses: `song.classical.foster-oh-susanna.pdmx` and `song.classical.debussy-clair-de-lune-beginner-version.pdmx` (full first bar led by rests: late entry, not anacrusis); every generated item.

## rhythm.values

**Input.** The raw reader's `<type>` on every note and rest (chord members counted once, grace notes apart), with `<dot>` and `<time-modification>`; witness: music21 `duration.Duration.type` and partitura's `symbolic_duration["type"]`.

**Rule.** Count each written value separately, notes and rests apart: breve, whole, half, quarter, eighth, 16th, 32nd, 64th and shorter; whole-bar rests (`<rest measure="yes">`) apart from written whole rests. A value inside a tuplet is counted under its written type and also flagged as tuplet (so an eighth-note triplet is not an eighth for a learner who has met only duple eighths: `rhythm.triplets` reports it). Also: the shortest and longest values, the number of distinct values, and per value the bars it occurs in.

**Thresholds.** None; the value names are MusicXML's (`<type>`, https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/type/), and the per-grade value lists the abilities use are ABRSM's and Trinity's (ABRSM p.16 and Trinity p.81, as quoted in `draft-abrsm-trinity.md`) [sourced, at the ability, not here].

**Encoding noise (PDMX).** 512th, 256th and 128th values in PDMX files are artefacts of the re-export's quantisation, not written values: 17 512ths and 6 256ths in five files (`song.classical.chopin-ballade-no-4-in-f-minor-op-52.pdmx`, `song.classical.chopin-prelude-no-15-in-d-flat-major-op-28.pdmx`, `song.classical.lecuona-malaguena-by-ernesto-lecuona.pdmx`, `song.classical.puccini-o-mio-babbino-caro-for-solo-piano.pdmx`, `song.jazz.fats-waller-ain-t-misbehavin.pdmx`), each beside the nonsense tuplet ratios of `rhythm.tuplets-other` [measured]. Rule: a value shorter than a 128th is not counted; the item is flagged to `integrity.notation-sanity`. *Unverified as music* that every one is an artefact; none is a plausible written value in the pieces named.

**Output.** The counts per value and kind, shortest and longest, distinct count, bars. Provenance `exact` (the proving run: at most 5 of 1,211 generated and 3 of 524 PDMX disagree on eighths, sixteenths and shorter-than-quarter, all tuplet or tie-end definitional differences between the detector and its witness). **UNKNOWN**: never beyond the shared reasons.

**Pipelines.** Generated (measured): 16th 23,032, eighth 21,710, quarter 4,888, whole 1,965, half 852; nothing shorter than a 16th. Percussion one-line staves (the 18 rhythm and 10 clave items) are rhythm-only and counted the same way.

**Examples.** Positives: `exercise.rhythm.sixteenths.4bar` (sixteenths), `exercise.rhythm.half-and-quarters.4bar` (halves and quarters). Near-misses: `exercise.rhythm.triplet-quarters.4bar` (quarters inside triplets: counted, flagged tuplet); `song.classical.puccini-o-mio-babbino-caro-for-solo-piano.pdmx` (4 512ths and a 256th: artefacts, not counted).

## rhythm.dotted-quarter

**Input.** partitura's untied notes (`part.notes`) with `symbolic_duration` (`type`, `dots`), grouped by staff and voice and ordered by onset; witness: the raw reader's `<dot>` counts.

**Rule.** Each dotted note is counted by kind: dotted half, dotted quarter, dotted eighth, dotted 16th, and double-dotted values apart. For each, the note that follows it in the same staff and voice and starts where it ends is recorded, so the pair kinds a syllabus names are counted: dotted quarter followed by an eighth, dotted eighth followed by a 16th. In a compound metre a dotted quarter (6/8) or dotted half (6/4) is the beat and is counted as `beat-length dotted value`, not as a dotted rhythm (the app's `dottedQuarters` already leaves compound bars out). A dotted value made by a tie (quarter tied to an eighth) is not a written dotted note and is not counted (as the app).

**Sources.** ABRSM sight-reading "dotted minim" (Grade 1), "dotted crotchet-quaver" (Grade 2); Trinity, dotted minim (Grade 2), dotted crotchet (4), dotted quaver (5) (both as quoted in `draft-abrsm-trinity.md`, a reading of that draft) [sourced].

**Output.** Counts per kind and per following value, with bars; provenance `exact`. Measured pair counts (generated / PDMX): dotted quarter then eighth 41 / 3,105; dotted eighth then 16th 24 / 2,702; dotted quarter then quarter 152 / 4,752 (mostly the 6/8 beat and dotted quarter-quarter in 3/4). **UNKNOWN**: never beyond the shared reasons.

**Pipelines.** The proving run's 4 PDMX disagreements are unresolved there; two are in files that open with rests (a pickup-padding question, as in syncopation below) [measured, `sync_split.py`]; not re-examined further.

**Examples.** Positives: `exercise.rhythm.dotted-quarter-eighth.4bar` (four dotted quarter-eighth pairs), `song.classical.beethoven-fur-elise` (12 dotted eighth-16th pairs). Near-misses: `exercise.rhythm.six-eight-dotted-quarters.4bar` (dotted quarters that are the 6/8 beat); `exercise.rhythm.six-eight-long-short.4bar` (quarter-eighth long-short in 6/8: no dot written).

## rhythm.ties

**Input.** partitura's untied notes with `tie_next`/`tie_prev` (each chain from its head), positioned in readable bars; witness: the raw reader's `<tie type="start">`.

**Rule.** Count tie chains (a chain of three notes is one tie for a learner's purpose, and its links are also counted). For each chain: within a bar or across a bar line (the chain ends in a later bar); and **syncopating** when its head starts off the felt beat and the chain sounds past the next beat (the `held` kind of `rhythm.syncopation`, reported here too). A chord tied as a whole counts once per tied pitch in `links` and once in `chains` per onset.

**Why the count ratio was 0.5.** The proving run's "count ratio median 0.5 against the witness, unexplained" is the unit: the witness counts every written note at either end of a tie (`prove_exists.py` line 243, `tie_start or tie_stop`), so a two-note tie counts 2; the app's model merges a tie chain into one note and `detect.ts` `ties` locates it once (`tieLength > 1`). Reading of the two sources; the ratio 0.5 is what two-note chains give; not re-run as a count comparison. The rule above counts chains, and reports links apart, so both units are named.

**Output.** Chains, links, within-bar, across-bar, syncopating, with bars. Measured: generated 219 chains, 217 across the bar, 11 syncopating (11 items); PDMX 9,647 chains, 6,616 across, 4,835 syncopating in 187 files. Provenance `exact`. **UNKNOWN**: never beyond the shared reasons.

**Pipelines.** As the rule. PDMX ties are exact on the held file (the proving run: 1 of 524 disagree).

**Examples.** Positives: `song.classical.alexander-s-ragtime-band.pdmx` (9 chains, all syncopating), `exercise.secondary-rag.c.4bar` (syncopating ties). Near-misses: `exercise.ii-v-i.a` (chords tied across the bar line on the downbeat: across-bar, not syncopating; 217 across-bar chains in the generated files, 11 syncopating), `exercise.latin-groove.a.son-3-2` (7 chains across the bar, none syncopating: the left hand's held tumbao notes start on the off-beat inside the bar and are counted by `rhythm.syncopation`'s held kind, not as syncopating ties).

## rhythm.syncopation

**Input.** partitura's tied notes (`part.notes_tied`, so a tie chain is one note held to its end) per hand, with pitch, `symbolic_duration` (tuplet `actual_notes`, written `type`) and `articulations`; the felt beat and strong beats (section 0); readable bars, a pickup right-aligned.

**The lines read.** Longuet-Higgins and Lee's rule is stated for a monophonic line, so it is read on two lines a listener follows, never on a hand's merged onsets: the right hand's **top line** (at each right-hand onset its highest note, kept only if no right-hand note still sounding is higher) and the left hand's **bottom line** (the same downwards). Inner voices are not read.

**Rule.** For each line onset o off the felt beat (its position in the beat is not 0), with nb the next beat:
- **held**: the line has no onset at nb and the note sounds past nb (a tie or a long note across the beat);
- **off-beat attack**: the line has no onset at nb, the note ends by nb, the line has a later onset, and o is the line's only onset in its beat (an isolated stroke off the beat, the beats on both sides silent in the line: the clave's and the off-beat comp's kind; it also counts an afterbeat chord alone on each "and" over a bass on the beats, which `texture.offbeat-chords` names, so an ability that wants syncopation proper reads the held kind);
- **held at the subdivision**: within one beat, an onset off the division (16th inside an eighth pair, in simple time) held past the next division point with no line onset there (the short-long-short "syncopa" inside a beat);
- **accent**: an accent or strong accent on an off-beat onset;
- **rest**: on a strong beat the **whole texture** is silent (no onset and nothing sounding, both hands), something sounded within the beat before, and a note enters off the beat within that beat;
- reported, not counted as syncopation: **silent beat after a run** (the L-H&L rest case when o ends a run of notes inside its beat: a figure ending off the beat before a rest).
Left out: notes inside a tuplet whose written value is a beat or longer (quarter-note triplets are a cross-rhythm, `texture.polyrhythm`), and tuplet notes from the subdivision kind. A pickup is read against the beats it is counted on, and the rest kind is never read in a pickup bar. Present when any of held, off-beat attack, accent or rest occurs; each kind is counted per line with its bars, so an ability can ask for one kind (the syllabi's "simple syncopation" is the held kind; AB-035 names held, accent and rest).

**Sources.** The definition the app already cites: "a momentary contradiction of the prevailing meter or pulse" (Harvard Dictionary of Music) made operational by Longuet-Higgins and Lee (1984): a note at a weaker metrical position followed by no new note at the stronger position after it (both as restated in `app/src/demands/detect.ts`, from secondary sources; neither original read) [sourced, at second hand]. ABRSM sight-reading Grade 5 "simple syncopation" (as quoted in `draft-abrsm-trinity.md`). The strong-beat weights are music21's `getAccentWeight`. The owner's and reviewer's ruling of 2026-10-07 that a pickup is not automatically syncopation is kept.

**Validation, and what each choice removed** (`onsets.py` per-hand version, then `sync_v4.py`, all 2,016 loadable items; measured):
- Reading a hand's merged onsets (the first version) made Bach's Prelude in C (`song.classical.bach-wtc1-prelude-1`) syncopated in every bar: the left hand's E enters on the second 16th and is held over beat 2 while the right hand plays on, and the right hand "rests" on each downbeat that the left hand plays. Reading the lines and the whole texture for the rest kind leaves it with no syncopation, as the music has none; so for Chopin's Étude Op. 10 No. 1 and the C minor Prelude BWV 999.
- The held kind alone missed the clave and the off-beat comps (`exercise.clave.son-3-2`: short strokes off the beat with rests on the beat), which are syncopated by any definition; the off-beat attack kind finds them. Counting every off-beat note before a silent beat (the plain L-H&L rest case) found the generated `broken7` and `trill` figures, whose last 16th before a rest is no syncopation; requiring the stroke to be alone in its beat removes them, and removes the right hand of BWV 999 (`song.classical.bach-prelude-in-c-minor-bwv-999.pdmx`), whose 16th figure starts off the beat after the left hand's bass (41 false attacks before, 0 after).
- Quarter-note triplets (`exercise.rhythm.triplet-quarters.4bar`) were held syncopations before the tuplet exclusion.
- Against the app's stored detector (`detect.ts` `syncopation`, the catalogue copied 2026-10-08), per item present or absent: generated 1,175 of 1,211 agree; the 36 others are 30 the rule finds and the detector does not (the Charleston and anticipated comps, `exercise.comping.*.charleston` and `*.anticipated`, chords off the beat that the detector's quarter-or-longer clause misses; the 4:3 waltz items of `texture.polyrhythm`; `exercise.bass-cell.tresillo.c`) and 6 the detector finds and the rule does not (`exercise.trill.*.4pb`, one location each; the rule reports only the silent-beat-after-a-run kind there; not looked at as scores). PDMX: 371 of 516 agree; of the 145 others, 61 are the detector's pickup padding in files with a pickup (the defect `detect.ts` records as fixed on 2026-10-07, still in the catalogue's stored values), 13 its quarter-or-longer clause in metres whose beat is longer than a quarter (2/2, 3/2, 6/8: a quarter off the half-note beat ends on the next beat and crosses nothing; `song.classical.beethoven-joyful-joyful-we-adore-thee.pdmx` 91 locations, the Handel Sarabande, `song.classical.clementi-sonatina-no-1-muzio-clementi.pdmx`), 63 other detector-only (by their kinds, a hand resting on the downbeat while the other hand plays, or an inner voice held over the beat: read from the per-hand kind counts of 5 of them and 2 rep items (Asturias, Invention No. 8, BWV 999, the Anh. 5 Sonatina, Rosemary's Waltz; Chopin Op. 10 No. 1, *Rhythm and Boogie*), not looked at as scores), 8 rule-only (not looked at). So the proving run's 58 "unexplained" PDMX disagreements were 56 pickups (measured, `sync_split.py`: 56 of 58 stored-only, count 1, in files whose first bar is short).

**Output.** Per line and kind: count and bars; present. Measured (items with the kind): generated held 35, off-beat attack 76, rest 6; PDMX held 222, off-beat attack 51, accent 53, rest 46. Provenance `exact`. **UNKNOWN**: no readable bar and no pickup.

**Pipelines.** Generated: code; the recipe declares syncopation in the syncopation studies and rhythm drills (cross-check). PDMX: code (the 1.M marking "to be validated" is answered by the split above: the disagreements are the detector's, explained); the line is chosen per staff, so the hand residual applies only where a melody crosses staves (flagged passages).

**Examples.** Positives: `exercise.rhythm.syncopated.4bar` (held, 12 in 4 bars), `song.ragtime.joplin-entertainer` (held 51, right hand), `exercise.clave.son-3-2` (off-beat attack), `exercise.comping.b-flat.off-beats` (off-beat attack, 15). Near-misses: `song.classical.bach-wtc1-prelude-1` (figuration across the hands: none), `song.classical.beethoven-joyful-joyful-we-adore-thee.pdmx` (2/2 quarters on the weak half: none here, 91 for the detector), `song.classical.anon-kum-ba-yah.pdmx` (a pickup: none), `exercise.rhythm.triplet-quarters.4bar` (a cross-rhythm), `exercise.broken7.a-dominant7.both` (a run ending before a rest: reported as silent beat only).

## rhythm.triplets

**Input.** The raw reader's `<time-modification>` with `actual-notes` 3 and `normal-notes` 2 on each note (chord members once), with its `<type>` and staff; witness: music21 `duration.Tuplet` (`numberNotesActual`, `numberNotesNormal`).

**Rule.** A triplet is a note with ratio 3:2. Count notes and groups (consecutive 3:2 notes in one staff and voice whose written durations sum to two of their type's value) per written value (eighth, quarter, 16th) and per staff, with bars. Defined per staff, as printed (1.M: this row is per staff, so it carries no hand residual). A 6:4 sextuplet is not a triplet (it is reported by `rhythm.tuplets-other`); nor are the three eighths of a compound beat, which carry no time modification.

**Thresholds.** None [MusicXML `time-modification`, https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/time-modification/].

**Output.** Notes and groups per value and staff; bars. Provenance `two-witnesses`: on `song.classical.beethoven-moonlight-iii` music21's tuplet counts equal the raw reader's for every ratio (3:2 45, 6:4 12, 5:4 10, 7:4 24, 15:8 28) [measured, `m21_witness.py`]; the proving run: 0 of 1,211 and 0 of 524 disagree. **UNKNOWN**: never beyond the shared reasons.

**Pipelines.** Generated: only 3:2 occurs (588 notes, measured), in the triplet rhythm items, `exercise.independence.*.3v2`/`2v3` and the shuffle items. PDMX: 11,122 notes at 3:2.

**Examples.** Positives: `exercise.independence.c.3v2` (eighth triplets in one hand), `song.blues.black-bottom-stomp` (320 triplet notes). Near-misses: `exercise.rhythm.six-eight-eighths.4bar` (three eighths to the beat, no tuplet); `song.classical.chopin-fantaisie-impromptu-in-c-sharp-minor-op-66.pdmx`'s 6:4 sextuplets (another tuplet).

## rhythm.tuplets-other

**Input.** As `rhythm.triplets`, every ratio other than 3:2; nesting from the raw reader (a note with more than one `<tuplet>` notation, or music21 `len(duration.tuplets) > 1`).

**Rule.** Count each ratio by kind: duplets (2:3 in compound time, 2:1), quadruplets (4:3), quintuplets (5:4, 5:3, 5:2), sextuplets (6:4), septuplets (7:4, 7:8), and larger; nested tuplets apart. Two kinds are separated from tuplets proper:
- **encoding noise**: a ratio whose normal-notes exceeds 16, or whose two numbers are within 5 per cent of each other (160:159, 80:79, 40:39, 480:371, 23:24) is not a tuplet but a quantisation artefact of the re-export, flagged to `integrity.notation-sanity` [validated: these occur only in PDMX files (5 files) and in two rep files (`song.classical.chopin-ballade-1` 39:32, `song.classical.chopin-polonaise-op53.nifc` 29:20), next to the sub-128th values of `rhythm.values`, measured, `grace.py`];
- **irregular figuration** (11 or more notes, or 9 or more at more than twice the normal density, other than 12, 16, 24 and 32): the cadenza-like kind `rhythm.cadenza` reads.

**Thresholds.** The 16 and 5 per cent bounds are operational (this page), validated by the separation above: every ratio they remove sits in a file that also has sub-128th values or nonsense durations; no ratio a printed edition would carry (5:4, 6:4, 7:4, 9:8, 11:8, 13:8, 15:8) is removed [measured].

**Output.** Counts per ratio, nested count, bars, per staff. Provenance `two-witnesses` (the Moonlight III comparison above). **UNKNOWN**: never beyond the shared reasons.

**Pipelines.** Generated: none occurs (0 notes other than 3:2, measured) and no family writes one: absent by the family list, code confirming it. PDMX: 5:4 619, 6:4 1,694, 7:4 51, 2:3 21, nested 36 notes (17 of them in the Raindrop Prelude, `song.classical.chopin-prelude-no-15-in-d-flat-major-op-28.pdmx`, beside its noise ratios: whether those nestings are real is *unverified as music*).

**Examples.** Positives: `song.classical.beethoven-moonlight-iii` (5:4, 6:4, 7:4), `song.classical.debussy-clair-de-lune` (2:3 duplets, 46 notes), `song.classical.chopin-nocturne-in-f-sharp-major-op-15-no-2.pdmx` (5:4, 199 notes). Near-misses: `song.classical.lecuona-malaguena-by-ernesto-lecuona.pdmx`'s 480:371 and the like (noise, not tuplets); `exercise.independence.c.3v2` (triplets only).

## rhythm.cadenza

**Input.** The raw reader: runs of consecutive grace notes in one staff and voice before one principal note; runs of `<cue>` notes; tuplets of irregular ratio (`rhythm.tuplets-other`); `<words>` matching cadenza or free-time terms.

**Code part (candidates).** A passage is a candidate when any of:
- a run of **6 or more grace notes** before one principal note;
- a tuplet of irregular ratio (11 or more notes, or 9 or more at more than twice the normal density, other than 12, 16, 24 and 32) spanning a beat or more;
- a run of cue-size notes spanning a beat or more;
- a cadenza bar from `notation.times` (a one-bar signature longer than its neighbours);
- words: cadenza, quasi cadenza, ad lib., ad libitum, a piacere, senza tempo, colla voce, liberamente, freely (case-insensitive, an abbreviation's dot optional).

**Thresholds and validation.** The 6-grace floor is operational, set on the catalogue [measured, `grace.py`]: runs of 6 to 9 or more occur only in Chopin's fioriture (`song.classical.chopin-berceuse.nifc` bar 44, 9; `song.classical.chopin-nocturne-op27-2.nifc` bar 60, 9; `song.classical.chopin-variations-op12.nifc`; `song.classical.chopin-waltz-op34-1.nifc`, 8; `song.classical.chopin-ballade-3.nifc`, 7; `song.classical.chopin-rondo-op1.nifc`, 7; `song.classical.chopin-nocturne-op37-1.nifc`, 6); runs of 4 and 5 are turns, slides and short flourishes (`song.classical.chopin-fantaisie-impromptu.nifc` 4, `song.folk.boogie-woogie.pdmx` 4, `song.beautiful.g-minor-bach.alt` 5). The irregular-ratio bound keeps Chopin's 11:8, 13:8, 18:8 and Beethoven's 15:8 and leaves out measured 9:8 nonuplets (`song.classical.schubert-liszt-standchen`, `song.classical.lecuona-malaguena-by-ernesto-lecuona.pdmx`) [measured]. The word list is operational, from Wikipedia "Tempo"'s rubato entry and common score usage [neither: to be checked against a published list of terms].

**Output.** Candidate passages with bars, kind and size; provenance `exact` for the candidates. **UNKNOWN**: never for the candidate list.

**Agent residual (PDMX and rep).** For each candidate: is the passage played freely (outside the beat), or is it a measured figure? Code never says "played freely".

**Pipelines.** Generated: no candidate in any of 1,211 files (0 grace notes, 0 cue notes, 0 irregular tuplets, measured), and no family declares one: absent by the family list. PDMX: the re-export kept no run longer than 4 grace notes and no cue notes in any of the 519 files (measured), so on PDMX the candidates come from irregular tuplets and words only: a PDMX fioritura written as small notes in the upload is not visible as such (reading: inferred from the re-export, whose originals are not held, 1.M).

**Examples.** Positives: `song.classical.chopin-berceuse.nifc` (9 grace notes, bar 44; 11:8 runs, bar 43), `song.classical.chopin-nocturne-op9-1` (11:6, bar 3), `song.classical.chopin-prelude-op28-18.nifc` (11:8), `song.classical.chopin-nocturne-op9-2` ("Senza tempo" at bar 34, the words route). Near-misses: `song.classical.schubert-liszt-standchen` (9:8 runs, measured), `song.classical.chopin-fantaisie-impromptu.nifc` (a 4-note grace run, an ornament).

## rhythm.repeated-notes

**Input.** `score.load`'s note array, grouped by hand, staff and voice (partitura's `voice`), onsets in order; MIDI pitch. Witness: music21 `RepeatedNotesFeature` (jSymbolic M-9, whole-item share; checked to exist).

**Rule.** In one voice, consecutive onsets that are each a single note of the same MIDI pitch are a repetition (a tie chain is one note, so a tied note is not a repetition). Report per hand: the number of repeated pairs, the longest run (notes), and the inter-onset interval at which they repeat (as a written value). Repeated chords are `texture.repeated-chords`, not this row. One-line percussion staves (the rhythm and clave items) are left out: every note there is the same pitch by construction.

**Thresholds.** None in the row; the ability sets the run length and value it needs [no threshold to source].

**Output.** Pairs, longest run, the interval, bars, per hand; provenance `exact`. Measured longest runs (PDMX): 34 files have none; the commonest longest run is 2 (148 files); 54 files reach 9 or more. **UNKNOWN**: never beyond the shared reasons.

**Agent residual (PDMX).** The voice where voices are mis-encoded (two lines in one voice make a melody's repeated note look like an alternation, and the reverse); code flags files whose voices change size or cross staves (1.M), and the agent reads only those.

**Pipelines.** Generated: code over the file; `exercise.repeated-notes.*` declares the repetition (3x, 4x: the rule finds runs of 3 and 4 in the right hand, measured).

**Examples.** Positives: `song.classical.albeniz-asturias.pdmx` (right hand, runs to 96 at the eighth), `song.classical.chopin-prelude-no-15-in-d-flat-major-op-28.pdmx` (the repeated A-flat, runs to 56 in the left hand), `exercise.repeated-notes.c.4x.right`. Near-misses: `exercise.rhythm.sixteenths.4bar` (one pitch on a percussion line: left out), an Alberti bass (alternation, never two equal pitches in a row: `exercise.accompaniment.alberti.c-major.both`, 0 pairs).

## rhythm.equal-stream

**Input.** `score.load`, per hand: the distinct onsets (chords and voices merged) with the longest note starting at each.

**Rule.** A stream is a maximal run of consecutive onsets in one hand at one equal inter-onset interval d of an eighth or shorter, each onset's note lasting at least d/2 (so a run broken by a rest is not one stream). Report per hand: the longest stream in notes and in bars (its span over the bar length), its value d, its start bar, and the number of streams of at least 8 notes. Also the **merged** stream: the same over both hands' onsets together, so figuration shared between the hands is seen (Bach's Prelude in C, `song.classical.bach-wtc1-prelude-1`: the right hand's longest run is 15 notes, the two hands together 529 sixteenths, measured).

**Thresholds.** d at most an eighth: operational (the row's "running sixteenths, Hanon cells"; an eighth is included because the Hanon and Alberti families run in eighths and sixteenths). The minimum of 8 notes for counting a stream is operational: it is two beats of sixteenths or one 4/4 bar of eighths, and separates a figure from a running passage on the catalogue [validated, `onsets.py`: counted per hand, the commonest PDMX longest run is 4 to 7 notes (187 hands: one beat or two of quicker notes inside a melody) and the next 8 to 11 (105 hands); 1,033 of the 1,081 generated hands with a run reach 12 or more]. Whether 8 is right for an ability is the ability's threshold, not this row's [neither sourced nor validated as a teaching threshold].

**Output.** As above, per hand and merged; provenance `exact`. **UNKNOWN**: never beyond the shared reasons.

**Agent residual (PDMX).** A stream shared between the hands where the staff is not the hand: the hand residual, on the flagged passages only.

**Pipelines.** Generated: code; the hanon, scale, arpeggio and alberti families' figures are equal values by construction (cross-check).

**Examples.** Positives: `exercise.hanon.20.right` (241 sixteenths, 30 bars), `song.classical.bach-wtc1-prelude-2` (384 and 408 sixteenths per hand), `song.classical.chopin-etude-op10-1.nifc` (75 sixteenths from bar 41). Near-misses: `song.classical.ode-to-joy.full` (3 eighths at most), `song.classical.bach-wtc1-prelude-1` per hand (15 notes: the stream is split between the hands; found only by the merged figure).

## rhythm.habanera

**Input.** `rules/rhythm.py`'s `Bars` (the shared conventions of `rules/rhythm.md`); the cell from `tools/content/cells.py` `HABANERA` = {0, 3/8, 1/2, 3/4} of the bar.

**Rule.** For each hand, the readable bars in 2/4, 4/4 or 2/2 whose distinct onsets are exactly the cell; present when they are a pattern. Two kinds reported apart: **2/4**, the published form, and **doubled** (4/4, 2/2: dotted quarter, eighth, quarter, quarter). The app's `detect.ts` `cellBars` reads the left hand only (line 323); the rule reads each hand and reports both.

**Why the doubled kind is reported apart.** Reading the right hand too was measured over the catalogue (`cells_hands.py`): the doubled cell in a right hand is, as often as not, the common dotted-quarter melody rhythm and no habanera: *Auld Lang Syne* (`song.folk.auld-lang-syne.pdmx`, 9 bars), *Deck the Halls* (`song.folk.deck-the-halls.pdmx`), *Suo Gan*, and the generated drill `exercise.rhythm.dotted-quarter-eighth.4bar`; the left hand too in *Auld Lang Syne* (12 bars). Bizet's Habanera (`song.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx`, 85 left-hand bars), Nazareth's *Carioca* (22) and *La Cumparsita* (7) are habaneras. So the cell (onsets) is code; that a doubled-form bar is a habanera is not, and teaching the habanera from *Auld Lang Syne* would teach wrong. Sources: Wikipedia, "Habanera (music)" and `cells.py`'s CD1 definition (as `rules/rhythm.md`).

**Output.** Per hand and kind: bars, count, present; provenance `exact`. **UNKNOWN**: no readable bar in 2/4, 4/4 or 2/2.

**Agent residual.** Generated: none (`exercise.bass-cell.habanera.*` declare it; the proving run: 0 of 1,211 disagree). PDMX and rep: the hand where the staff is not the hand (flagged passages); and for the doubled kind, whether the piece's bars are a habanera (style, with `style.dance-type`), never from the onsets alone.

**Examples.** Positives: `exercise.bass-cell.habanera.c` (left hand, 8 bars), `song.classical.bizet-l-amour-est-un-oiseau-rebelle.pdmx` (85 left-hand bars), `song.classical.nazareth-carioca-1913.pdmx` (22). Near-misses: `exercise.tresillo.c` (one onset fewer); `song.folk.auld-lang-syne.pdmx` (the doubled cell, no habanera).

## rhythm.tresillo

**Input and rule.** As `rhythm.habanera`, with `TRESILLO` = {0, 3/8, 3/4}, both hands, the 2/4 and doubled kinds apart. Exact equality: the habanera (one onset more) is not a tresillo.

**What the proving run's 10 generated disagreements are.** The latin-groove son 3-2 (5) and tumbao (5) items: the stored reader reads the left hand, and the right hand of latin-groove holds the son clave's three-side, which *is* the tresillo (measured: `exercise.latin-groove.*.son-3-2` and every son and bossa clave item have the tresillo in the right hand in every other bar, `cells_hands.py`), while the tumbao's left hand sounds only the tresillo's last two strokes (`rules/rhythm.md`, texture.tumbao), which is not the cell. Resolution: per hand, the rule finds the right-hand tresillo and not the tumbao's; a definitional difference with `detect.ts`, which reads the left hand only, closed by this rule.

**Output, UNKNOWN, residual.** As `rhythm.habanera`. Tresillo bars as a pattern: generated 4 items left hand, 11 right hand; PDMX 7 and 12 (measured).

**Examples.** Positives: `exercise.tresillo.c`, `exercise.clave.son-3-2` (right hand, the three-side), `song.classical.rodriguez-la-cumparsita.pdmx`. Near-misses: `exercise.tumbao.c` (two strokes of three), `exercise.bass-cell.habanera.c` (the habanera).

## rhythm.cinquillo

**Input.** As `rhythm.habanera`; the cell {0, 1/4, 3/8, 5/8, 3/4} of a 2/4 bar (or its doubled form in 4/4 or 2/2), either hand.

**Rule.** Bars whose distinct onsets in one hand are exactly the cell; present when they are a pattern; per hand.

**Source.** Wikipedia, "Cinquillo" (https://en.wikipedia.org/wiki/Cinquillo): "an eighth, a sixteenth, an eighth, a sixteenth, and an eighth note" in a 2/4 bar, which puts onsets on sixteenth pulses 0, 2, 3, 5 and 6 of 8; "an embellishment of ... tresillo" [sourced].

**Validation.** Over the catalogue (`onsets.py`): the cell is a pattern in Joplin's rags and other ragtime (the right hand: *The Entertainer* `song.ragtime.joplin-entertainer` bars 59, 67, 76 ...; *The Cascades* `song.ragtime.joplin-cascades`; *12th Street Rag*; *Tiger Rag* `song.jazz.django-reinhardt-tiger-rag.pdmx`; *Chicken Reel*), where the same eighth-sixteenth figure is ragtime's standard syncopation; in one or a few scattered bars, never a pattern, in 24 other items. That a ragtime bar holding the cell's onsets is a cinquillo in the Cuban sense is a naming question, as for the habanera: the row claims the onsets [measured; the naming *unverified as music*].

**Output.** Per hand: bars, count, present; provenance `exact`. **UNKNOWN**: no readable bar in 2/4, 4/4 or 2/2.

**Pipelines.** Generated: no family writes the cell; three study items hold it in one or three scattered bars (`exercise.study.syncopation.c-major.4-4.8bar.broken.01` bar 3), not a pattern: absent, code confirming it. PDMX: per staff exact; the hand residual on flagged passages.

**Examples.** Positives: `song.ragtime.joplin-entertainer` (7 bars), `song.ragtime.joplin-cascades` (10), `song.folk.chicken-reel.pdmx` (bars 75-76, 79-80). Near-misses: `song.ragtime.joplin-chrysanthemum` (2 scattered bars: an incident), `exercise.study.syncopation.c-major.4-4.8bar.broken.01` (one bar).

## rhythm.secondary-rag

**Rule.** `docs/classifier/rules/rhythm.md` § rhythm.secondary-rag, unchanged, and its code `tools/classifier/rules/rhythm.py` `secondary_rag` (Berlin's definition; period-three pitches over even beat divisions in the right hand's top line, nine notes, twelve at four to the beat). Its positives, near-misses, UNKNOWN and catalogue counts (6 present of 1,488 read) are that page's.

**Validation item that page leaves open (S8).** Joplin's *Elite Syncopations* and *Pine Apple Rag* carry the concept and the rule finds none. The top line holds no period-three stretch of seven notes or more (`rules/rhythm.md`, `build/period3.py`); whether the figure sits in an inner voice is what the agent reads on PDMX. Not re-run here.

**Agent residual (PDMX).** The pattern in an inner voice (the rule reads the top line only).

**Examples.** As `rules/rhythm.md`. Positives: `song.jazz.twelfth-street-rag` and `song.pop.12th-street-rag.pdmx` (both editions), `song.pop.the-memphis-blues.pdmx`. Near-misses: `exercise.secondary-rag.c.4bar` (a three-over-four figure crossing the beat by note lengths), `song.classical.beethoven-moonlight-i` (triplet arpeggios, three to the beat), `song.classical.bach-wtc1-prelude-1` (a figure restarting every half bar).

## rhythm.shuffle

**Rule.** `docs/classifier/rules/rhythm.md` § rhythm.shuffle and its code, with one correction the characteristics list makes: even eighths under a Swing direction are **not** this row (they are `notation.swing-mark`); the rule's "marked" kind is moved to `notation.swing-mark` and this row keeps the notated long-short figures only (triplet quarter-eighth, 12/8 quarter-eighth, and the dotted kind with its UNKNOWN). The code change is Phase 5.

**Output and UNKNOWN.** As that page (21 present, 12 UNKNOWN dotted-only, measured 2026-10-07). After the correction, `exercise.swing-pair.*` and *Lullaby of Birdland* leave this row (their eighths are even, under a direction).

**Examples.** Positives: `exercise.meter.12-8` (12/8 quarter-eighth), `song.blues.black-bottom-stomp` (triplet pairs). Near-misses: `exercise.rhythm.dotted-quarter-eighth.4bar` (long-short over two beats), `exercise.rhythm.triplet-quarters.4bar` (quarter-note triplets), `exercise.swing-pair.c` (even eighths under a direction: `notation.swing-mark`, after the correction).

**Agent residual (PDMX).** The hand, on flagged passages; the dotted-only UNKNOWN stays UNKNOWN (no reader can tell a dotted shuffle from a dotted rhythm from the page: *unverified as music* for every such item).

## notation.swing-mark

**Input.** The raw reader: `<swing>` (in `<sound>` or a direction); every `<words>` text with its bar; text holding a note glyph (Unicode U+2669 to U+266C, SMuFL U+E1D0 to U+E1EF and U+ECA0 to U+ECBF) for the triplet-equivalence sign.

**Rule.** A swing mark is present from the bar of: a `<swing>` element; a word matching `\b(swing|swung|shuffle)` (case-insensitive; `rules/rhythm.py`'s `SWING_ON`); or a note-glyph text holding an equals sign and a triplet figure. It holds until a word matching `\b(straight|even (8th|eighth)s?)` (`SWING_OFF`) or the end. Report the bars under it and the kind of mark.

**Sources.** MusicXML `swing` (https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/swing/); the words are the generator's own and the common chart usage [the word list: neither sourced nor exhaustive; validated on the catalogue as below].

**Validation** (`words2.py`, measured): `<swing>` occurs in none of the 2,020 files (it cannot occur in a held PDMX file, which music21 re-exported, 1.M). The words find: generated 5 items (`exercise.swing-pair.*` "Swing: long, then late" after "Straight"; the two shuffle rhythm items "Shuffle — play the eighths long-short"), PDMX 8 files (among them `song.jazz.george-shearing-lullaby-of-birdland.pdmx`, `song.classical.st-louis-blues.pdmx`, `song.pop.electric-light-orchestra-elo-mr-blue-sky-hard-piano.pdmx`), rep 3. The note-glyph route finds no swing sign in the catalogue: the 4 note-glyph texts are metronome marks typed as text ("♪=114", "♪=112", "♪=95", and one SMuFL quarter), which `mark.tempo-text` reads.

**Output.** Present, the bars, the kind (element, word, sign); provenance `exact` for what is printed. **UNKNOWN**: never.

**Agent residual (PDMX).** Swing asked in prose a word list does not hold ("with a lilt", "laid back", "jazz feel"), and a sign drawn as an image. Generated: none; the generator's words are a closed list.

**Pipelines.** The generated boogie and twelve-bar shuffle families print no direction (`rules/rhythm.md`'s generator findings): absent here, which is correct for what is printed.

**Examples.** Positives: `exercise.swing-pair.c` (from bar 5), `exercise.rhythm.shuffle-eighths.4bar`, `song.jazz.george-shearing-lullaby-of-birdland.pdmx`. Near-misses: `exercise.swing-pair.c` bars 1-4 (under "Straight"), `exercise.boogie.*` (shuffle in title and concepts, no printed mark).

## rhythm.backbeat

**Input.** `Bars` per hand; accent marks (`accent`, `strong-accent`) from partitura's `notes_tied` articulations; readable bars in 4/4 and 12/8.

**Rule.** A bar is a backbeat bar when either: a hand's onsets are exactly beats 2 and 4 ({1/4, 3/4} of the bar) (**onsets** kind); or the bar's accent marks fall only on beats 2 and 4 (**accents** kind). Present when the bars of a kind are a pattern, per kind and hand. A hand with single notes on 1 and 3 and chords on 2 and 4 (the oom-pah and stride left hand) is **not** this row: it is counted apart as `afterbeat chords` and belongs to `texture.oom-pah` and `texture.stride`.

**Source and validation.** Wikipedia, "Backbeat" (https://en.wikipedia.org/wiki/Backbeat): "a syncopated accentuation on the 'off' beat. In a simple 4/4 rhythm these are beats 2 and 4" [sourced]. The chords kind was first included and then separated on the catalogue (`onsets.py`): it found the stride exercises (`exercise.stride.c`), Czerny Op. 299 Nos. 5 and 8, Chopin nocturnes Op. 37 No. 1 and Op. 55 No. 1, Satie's Gnossiennes: oom-pah left hands with no accent on 2 and 4, which the definition's "accentuation" does not cover [measured]. Measured with the two kinds kept: PDMX onsets kind 8 files (left hand: Debussy's *Rêverie* and *Arabesque*, `song.pop.misc-soundtrack-light-the-world.pdmx`; right hand: *Blinding Lights* `song.pop.the-weeknd-the-weekend-blinding-lights-easy-piano.pdmx`, *Tiger Rag*), accents kind 7 (among them `song.pop.eiffel-65-i-m-blue.pdmx`, `song.classical.chopin-fantaisie-impromptu-in-c-sharp-minor-op-66.pdmx`).

**Output.** Per kind and hand: bars, present; provenance `exact`. **UNKNOWN**: no readable bar in 4/4 or 12/8.

**Agent residual (PDMX).** Which hand is the accompaniment (`texture.melody-location`): a melody that happens to sound only on 2 and 4 (the right hand of *Tiger Rag*) and accents on 2 and 4 in a classical étude (the Fantaisie-Impromptu) are found by the onsets and are not a backbeat groove; the agent decides whether the found bars are the accompaniment's backbeat. *Unverified as music* for every item until then.

**Pipelines.** Generated: no family declares a backbeat and none is found (0 items), absent by the family list.

**Examples.** Positives: `song.pop.the-weeknd-the-weekend-blinding-lights-easy-piano.pdmx` (onsets kind, right hand), `song.pop.eiffel-65-i-m-blue.pdmx` (accents kind). Near-misses: `exercise.stride.c` (afterbeat chords: oom-pah), `song.classical.chopin-fantaisie-impromptu-in-c-sharp-minor-op-66.pdmx` (accents on 2 and 4 in an étude: the agent's residual).

## rhythm.hemiola

**Input.** `Bars` per hand.

**Code part.** Three kinds, per hand, each reported apart:
- **two-bar**: two consecutive readable bars of 3/4 (or 3/2) whose onsets in one hand are exactly {0, 2, 4} quarters (halves in 3/2) of the six-beat span: three two-beat units across the bar line;
- **6/8 as 3/4**: a 6/8 bar whose onsets in one hand are exactly the three quarter positions {0, 1, 2};
- **3/4 as 6/8**: a 3/4 bar whose onsets are exactly two dotted quarters {0, 3/2} (the reverse grouping; sesquialtera when it alternates with the metre's own).

Present at one occurrence (a cadential hemiola is one event); the count and bars reported.

**Source.** Wikipedia, "Hemiola" (https://en.wikipedia.org/wiki/Hemiola): "three beats of equal value in the time normally occupied by two beats"; the article reports that some writers keep "sesquialtera" for the vertical two against three and that Grove treats the two as interchangeable [sourced; the notation by ties and accents is not in the article].

**Validation** (`onsets.py`, measured). The strict two-bar kind is rare: Chopin's Boléro (`song.classical.chopin-bolero.nifc`, left hand, bars 198-199) and Debussy's *La plus que lente* (`song.classical.debussy-debussy-claude-la-plus-que-lente.pdmx`, left hand, bars 116 and 118). 6/8 as 3/4: `song.pop.koji-kondo-song-of-storms-easy.pdmx` (left hand, bars 1, 3, 5, 7), `song.pop.kodaline-all-i-want-kodaline.pdmx`, `song.pop.toby-fox-fallen-down-reprise-undertale-easy.pdmx`. 3/4 as 6/8: 13 PDMX files (`song.classical.leontovych-carol-of-the-bells-christmas-medley.pdmx` bars 73-76, `song.folk.scarborough-fair-piano-solo.pdmx`). The rule finds a hemiola only when the hand's rhythm is the plain two-beat units; a hemiola shown by accents, by chords changing every two beats, or by a melody whose two-beat units are subdivided is not found by code.

**Output.** Per kind and hand: bars and count; provenance `exact`; absence means "none in plain rhythm". **UNKNOWN**: no readable bar in 3/4, 3/2 or 6/8.

**Agent residual (PDMX and rep).** The grouping shown by ties, accents, chord changes or subdivided units, which code does not read; and confirming the found bars as a hemiola. Generated: absent by the family list (no family declares a hemiola and none is found, 0 items).

**Examples.** Positives: `song.classical.chopin-bolero.nifc` (two-bar, bar 198), `song.pop.koji-kondo-song-of-storms-easy.pdmx` (6/8 as 3/4). Near-misses: `song.classical.leontovych-carol-of-the-bells-christmas-medley.pdmx` and `song.folk.scarborough-fair-piano-solo.pdmx` (3/4 as 6/8: the reverse kind, reported apart); `song.classical.handel-georg-friedrich-handel-sarabande.pdmx` (a 3/2 sarabande, not found by the strict kind: none of the Bach and Handel items in the catalogue is, measured; whether it holds a hemiola shown otherwise is the agent's).

## texture.polyrhythm

**Input.** `Bars` per hand; the raw reader's tuplets per staff as a witness of the tuplet-written kind.

**Rule.** For each readable bar, test spans in order: each felt beat, each pair of beats (in a bar of an even number of beats), the whole bar; a span inside one already found is skipped. In a span, each hand's onsets as fractions of the span are an **even division into p** when they are exactly {0, 1/p, ..., (p-1)/p}. The span is a polyrhythm p:q (right hand p, left hand q) when both hands divide evenly, p differs from q and neither divides the other. Report the ratio reduced (6:4 is 3:2), the span level, the bars. Kinds: 2:3, 3:2, 3:4, 4:3, other. Written without tuplets is found the same way (two dotted quarters against three quarters in a 6/8 bar is 2:3 at the bar).

**Source.** Wikipedia, "Polyrhythm" (https://en.wikipedia.org/wiki/Polyrhythm): "the simultaneous use of two or more rhythms that are not readily perceived as deriving from one another", with 3:2 and 4:3 named as the common cases [sourced]. "Neither divides the other" is that definition's "not ... deriving from one another" made operational (2 against 4 derives) [operational, validated below].

**Validation** (`onsets.py`, measured). Generated: `exercise.independence.*.3v2` and `*.2v3` (3 each) are found at every beat with their declared ratio (16 beats each), the family's declared ratio agreeing in all 6. Repertoire: Chopin's nocturnes, polonaises and the Fantaisie-Impromptu (8:6 reduced 4:3, 50 beats), Debussy's *Arabesque* No. 1 (2:3 and 3:2), Brahms Op. 118 No. 2 (2:3, 27 beats), Beethoven's Seventh, second movement (3:2, 46). Found and not a teaching polyrhythm: the generated waltz accompaniments `exercise.accompaniment.waltz.*.both` (5 items) write four dotted eighths a bar in the right hand over three quarters, a 4:3 at the bar (measured, and read in the file: `<type>eighth</type><dot/>`, duration 0.75 of a quarter). That is a generator finding: a 4:3 cross-rhythm in a waltz accompaniment exercise, whether intended or not, is what the score asks; *the generator's intent is unverified*.

**Output.** Ratio, level, bars, count per kind; provenance `exact`; the tuplet-mark count per staff beside it. **UNKNOWN**: one hand only (`no second hand`), no readable bar.

**Agent residual (PDMX).** Kinds shown only by beaming or accents over even values (6/8 against 3/4 written in eighths in both hands); and the hand on flagged passages. A lone fioritura span (11:8 against a left-hand triplet: Chopin's 15:2, 20:3 spans) is reported under "other" with its ratio; whether it is a polyrhythm to practise or free figuration is `rhythm.cadenza`'s question.

**Examples.** Positives: `exercise.independence.c.3v2`, `song.classical.debussy-debussy-premiere-arabesque-l-66-no-1.pdmx`, `song.classical.chopin-fantaisie-impromptu-in-c-sharp-minor-op-66.pdmx`. Near-misses: `exercise.accompaniment.alberti.c-major.both` (eighths against quarters: one division derives from the other, none found, measured); `exercise.accompaniment.waltz.c-major.both` (found, a generator finding above).

## rhythm.beat-onset-share

**Input.** `Bars`; all hands' distinct onsets merged.

**Rule.** Over the readable bars: the share of felt beats on which some note starts (`beats_on / beats`), and the share of downbeats on which some note starts. A beat held through (a whole note in 4/4) has no onset on beats 2 to 4: the pulse is not audible there, which is what the row asks.

**Thresholds.** None in the row; it is a share [operational definition, this list].

**Output.** The two shares and their counts; provenance `exact`. Measured (`onsets.py`): median share generated 0.906, PDMX 0.944, rep 0.971; lowest PDMX `song.folk.insensatez-how-insensitive-jobim.pdmx` 0.18 (a bossa lead sheet), generated `exercise.ii-v-i.*` 0.19 (whole-note chords). **UNKNOWN**: no readable bar.

**Pipelines.** Identical (what is printed).

**Examples.** Positives (a high share, audible pulse): `exercise.hanon.20.right` (61 of 62 beats), `song.classical.beethoven-fur-elise` (304 of 312). Near-misses: `exercise.ii-v-i.a` (3 of 16), `song.blues.hesitating-blues` (80 of 192: the pulse held, not struck).

## mark.tempo-text

**Input.** The raw reader: every `<metronome>` (`beat-unit`, `beat-unit-dot`, `per-minute`, and two beat units for a metric equation) with its bar and part; every `<sound tempo>`; every `<words>` text; partitura's `ConstantTempoDirection` as a witness only. The catalogue's `tempo-defaulted` tag.

**Rule.**
- **The metronome mark.** The first `<metronome>` with a number, at the item's start (no note sounds before it; else it is a change, `mark.tempo-change`). Quarter BPM = per-minute × the beat unit's length in quarters, dots included (a half = 60 is 120; a dotted quarter = 80 is 120): music21's `MetronomeMark.getQuarterBPM()` normalisation, which `tools/content/difficulty.py` `_quarter_bpm` already uses. The beat unit is reported as printed, and the felt-beat BPM = quarter BPM over the felt beat in quarters (so a 6/8 mark of a dotted quarter = 60 counts 60 a minute). A metronome typed as words (a note glyph followed by `=` and a number: "♪=114") is read by a regex (`[note glyph]\s*=\s*(\d+)`) with the glyph's value (2 PDMX files, measured).
- **The tempo word.** The opening words classified against the Italian basic tempo terms of Wikipedia "Tempo" (https://en.wikipedia.org/wiki/Tempo: larghissimo, grave, largo, larghetto, lento, adagio, adagietto, andante, andantino, moderato, allegretto, allegro, vivace, vivacissimo, presto, prestissimo, with assai, molto, poco, meno, più as qualifiers) [sourced]; words not in the list are reported unclassified.
- **Not a tempo the learner sees.** A `<sound tempo>` with no printed mark is a playback setting: reported as `playback` with provenance `one-witness`, never as the printed tempo; with the catalogue's `tempo-defaulted` tag it is the converter's default and is not a tempo at all.

**Why not partitura's tempo classes.** Measured (`pt_words.py`, 228 files with tempo-like words): partitura maps "allegretto" to "allegro" (28 cases), "più lento" to a constant "lento", "più mosso", "meno mosso" and "poco mosso" to a constant "mosso" (a change of tempo lost), "stringendo" to a constant tempo, and "rubato" to an `IncreasingTempoDirection`; and it leaves "Tempo II", "Tempo rubato", "(accel.)", "poco. rit" and "rit. - - -" as plain `Words`. Classification is therefore by this rule's term list over the raw text; partitura only locates the words. music21's import makes `TextExpression` of every tempo word (checked: 0 `TempoText` on the generated 12/8 item; 1.M).

**The generator's compound-metre marks.** Every generated item prints a quarter-note mark, the 6/8, 12/8 and 7/8 items included (`exercise.rhythm.six-eight-*` quarter = 80, `exercise.meter.12-8` quarter = 76), because `generate_exercises.py` writes `tempo.MetronomeMark(number=bpm)` with music21's default quarter referent (lines 580, 1903, 4954). Read literally, a 6/8 drill at quarter = 80 counts its dotted-quarter beat at 53 a minute. Whether the generator meant 80 to the dotted quarter is the generator's question (a finding for Phase 5); the rule reads what is printed.

**Output.** Quarter BPM, felt-beat BPM, the beat unit as printed, the word and its class, with bars; provenance `exact` for printed marks and words, `one-witness` for a playback tempo. **UNKNOWN**: no printed mark and no classified word (the tempo is then not stated).

**Validation** (`raw_report.py`, `words2.py`, `tempo_check.py`, measured). Generated: all 1,211 print a quarter-note mark at bar 1. PDMX: 234 of 519 print no metronome mark; of those 50 open with an Italian basic term and 184 with neither (UNKNOWN for the printed tempo); all 234 carry a `<sound tempo>`, 159 of them the converter's default (tag `tempo-defaulted`) and 75 a playback tempo from the upload. Beat units on PDMX first marks: quarter 249, dotted quarter 20, eighth 8, half 6, dotted half 1, dotted eighth 1.

**Agent residual (PDMX).** Unclassified opening words in other languages or English ("Langsam", "Lent", "Moderately", "Gently": 22 PDMX files have such words, measured by a pattern, not exhaustively); a mark typed in a form the regex does not hold. The agent reads the word and states the tempo range it implies, or UNKNOWN.

**Examples.** Positives: `song.classical.chopin-etude-op10-1.nifc` (quarter = 176), `song.folk.scarborough-fair-piano-solo.pdmx` (quarter = 165), a dotted-quarter mark in 6/8 among the 20 PDMX files above. Near-misses: `song.classical.albeniz-asturias.pdmx` (no printed mark: its catalogue 144 is a playback tempo), `exercise.rhythm.six-eight-eighths.4bar` (a quarter-note mark in 6/8: read literally).

## mark.tempo-change

**Input.** As `mark.tempo-text`: every `<words>` with its bar after the opening, every later `<metronome>`, and two-beat-unit metronomes (metric equations).

**Rule.** Classify each word by kind with the term list of Wikipedia "Tempo" ("Terms for change in tempo") [sourced], abbreviations and spellings added [operational]:
- **slower**: rit., ritard., ritardando, rall., rallentando, riten., ritenuto, allargando, slargando, lentando, calando, tardando, meno mosso, meno moto, più lento;
- **faster**: accel., accelerando, affrettando, stringendo, string., più mosso, stretto, precipitando, doppio movimento, più allegro, più vivo;
- **return**: a tempo, tempo I, tempo primo, in tempo, l'istesso tempo;
- **free**: rubato, ad lib. (shared with `rhythm.cadenza`);
- **new tempo**: a later basic tempo word or a later metronome mark with another number;
- **metric modulation**: a `<metronome>` with two beat units (an equation), or `tempo.MetricModulation` where music21 makes one.

A word's scope: rit. and accel. run to the next return, new tempo or the next dashed line's end where the file has one (`<dashes>`); otherwise to the next tempo word. "poco", "molto", "poco a poco" are qualifiers kept with the word.

**Output.** Each change with its kind, bar and scope; counts per kind; provenance `exact` for listed terms. **UNKNOWN**: never for what is listed; unlisted words are reported unclassified.

**Validation** (`words2.py`, measured, by item): PDMX slower 79 files, return 37, faster 10, free 12; rep slower 18, return 15, faster 9, free 4; generated none (the generator prints no tempo change). Metric equations: 0 files.

**Agent residual (PDMX).** Words in other languages and unlisted abbreviations ("e rallent", "ritentuo", "pochiss. rit": misspellings measured in the catalogue), and a change written in prose.

**Examples.** Positives: `song.classical.chopin-nocturne-op9-2` ("poco rit." bar 11, "a tempo" bar 12, "poco rallent.", "poco rubato" bar 27, "Senza tempo" bar 34), `song.classical.lecuona-malaguena-by-ernesto-lecuona.pdmx` ("rit. poco", "a tempo", "accel. poco a poco" bar 51), `song.classical.debussy-clair-de-lune` ("Tempo rubato", "Un poco mosso", "a Tempo I"). Agent residual in the catalogue: `song.classical.debussy-debussy-claude-la-plus-que-lente.pdmx` ("Lent", "Tempo animé", "Mouvt": French, unclassified by the list). Near-misses: `song.classical.albeniz-asturias.pdmx` and `song.classical.chopin-ballade-1` ("morendo" or "smorz.": dying away, dynamics and tempo at once; reported unclassified, a question for `mark.expression-text`); "cresc." and "dim." anywhere (dynamics, never classified here).

## technique.velocity

**Input.** `score.load` per hand; the tempo from `mark.tempo-text` (quarter BPM at the start, and the changes from `mark.tempo-change` where a later printed mark sets a number).

**Rule.** Per hand: onsets per second (a chord is one action) and notes per second (each pitch), over the item and at the peak. Seconds come from quarters × 60 / quarter BPM, piecewise between printed marks. **Peak**: the readable bar with the most onsets per quarter, at that bar's tempo. **Sustained speed**: the fastest equal stream (`rhythm.equal-stream`) of 8 notes or more, as onsets per second. Repeats are not unrolled (the rate does not change by repeating). Tempo-free figures are always reported (onsets per quarter, peak onsets per quarter), so the row has an answer where no tempo is printed.

**Sources.** jSymbolic RT-5 note density ("average number of notes per second"; music21 `NoteDensityFeature` as the whole-item witness, checked to exist) and Sébastien et al. 2012, "playing speed" (tempo with the shortest significant value), as the characteristics list cites them [the definitions sourced as cited; no threshold in the row].

**The proving run's disagreements, resolved.** All 9 generated and 68 of 88 PDMX `technique.velocity` disagreements (and 38 of 54 rep) are exactly explained by the first signature: their witness-to-stored ratio equals the numerator divided by the bar's true length in quarters (2 in 6/8, 12/8, 7/8 and 3/8; 0.5 in 2/2) [measured, `vel_split.py`, 115 of 151]. The cause is `tools/content/difficulty.py` line 363, `seconds = (bars * beats_per_bar * 60.0) / max(1.0, bpm)` with `beats_per_bar = signatures[0].numerator`: it counts the numerator as quarters. It is not the metronome's beat unit, as the code-or-agent review's S10 read it: the generated 6/8 items print a quarter-note mark, which both readers take as quarters. The rule above uses the bar's length in quarters; `difficulty.py` is a code defect to correct in Phase 5 (this page changes no code).

**Output.** Per hand: onsets and notes per second (mean, peak bar, sustained), with the tempo's provenance; provenance `exact` where the tempo is printed. Examples measured: `exercise.hanon.20.right` at quarter = 60, 3.89 onsets a second, peak 4.0; `song.classical.chopin-etude-op10-1.nifc` at quarter = 176, right hand 11.3 a second (peak 11.7), left hand 0.7. **UNKNOWN** (for the per-second figures only): no printed tempo (`mark.tempo-text` UNKNOWN); the tempo-free figures are still reported.

**Agent residual (PDMX).** The tempo where only a word or nothing is printed (`mark.tempo-text`'s residual: the agent's stated range, used as a range, never as a measured tempo); the hand on flagged passages.

**Examples.** Positives: `song.classical.chopin-etude-op10-1.nifc` (a fast right hand), `exercise.hanon.20.right`. Near-misses: `song.classical.albeniz-asturias.pdmx` (no printed tempo: per-second UNKNOWN, its playback 144 not used), `exercise.rhythm.six-eight-eighths.4bar` (2.67 a second at the printed quarter = 80; 1.33 in the stored feature, the defect above).

## technique.endurance

**Input.** `score.load` per hand; the tempo as `technique.velocity`.

**Rule.** Per hand, the longest **active span**: consecutive onsets of the hand with no rest between them (each onset at or before the end of the hand's sounding notes) and no gap between consecutive onsets longer than one felt beat. Report its length in onsets, quarters, bars and seconds at the tempo, and onsets per second over it.

**Thresholds.** The one-beat gap is operational, added after the first version on the catalogue [validated, `onsets.py`]: without it a hand holding long notes counts as never resting (a whole-note left hand under a melody gave PDMX spans of 885 quarters in `song.pop.kodaline-all-i-want-kodaline.pdmx`); with it the generated maxima are the Hanon items (62 quarters, the whole exercise) and the 12/8 blues bass (72), and the generated median is 8 quarters.

**Output.** As above; provenance `exact` (the seconds carry the tempo's provenance). **UNKNOWN** (seconds only): no printed tempo.

**Agent residual (PDMX).** The tempo (as `technique.velocity`) and the hand on flagged passages.

**Examples.** Positives: `exercise.hanon.20.right` (241 onsets, 62 seconds at quarter = 60), `song.classical.bach-wtc1-prelude-2` (384 onsets right hand, 96 quarters). Near-misses: `song.classical.bach-wtc1-prelude-1` per hand (short spans: the figure alternates hands), `exercise.meter.12-8`'s right hand (one onset: held chords).

## metre.grouping

**Input.** The raw reader: composite `<beats>` ("2+2+3"); top-level beams (`<beam number="1">` begin, continue, end) per bar of part 0; `<words>`; music21 `TimeSignature.beatSequence` and `beamSequence` for a signature's default grouping (checked: 2+2+3/8 gives three beats; 7/8 defaults to a 2+2+3 beam sequence, 5/8 to 2+3).

**Rule.** For each irregular or compound bar, its grouping from, in order:
1. a composite numerator (exact);
2. a counting instruction in the words: `\d(\s*\+\s*\d)+` ("Count 3 + 2", "count 2 + 2 + 3");
3. the bar's top-level beam groups, when they tile the bar (every note under a beam or a beamless note of a group's length) and the metre's denominator is 8 or 16 (eighth and sixteenth groups show the grouping; in X/4 metres quarters are not beamed and beams of eighths sit inside one beat, so beaming says nothing of 3+2 against 2+3);
4. else UNKNOWN (`no composite numerator, counting words or beaming that tiles the bar`). music21's default `beamSequence` is never the answer: it is the library's default, not the composer's.

A change of grouping under one signature (7/8 as 2+2+3 then 3+2+2) is reported with its bars. For compound metres the expected grouping is the beat (3+3 in 6/8); a bar beamed otherwise (2+2+2 in 6/8) is reported as a regrouping, which `rhythm.hemiola` reads.

**Validation** (measured). No file in the catalogue has a composite numerator (0 of 2,020). Generated: `exercise.meter.7-8` beams 2+2+3 in every bar, agreeing with its recipe's "2 + 2 + 3"; `exercise.meter.5-4` has quarters only (no beams) and prints "Count 3 + 2" (the words route), agreeing with its recipe; `exercise.meter.12-8` beams in threes as its recipe says. PDMX 6/8: the commonest beaming is two groups of three eighths (765 bars), beside one-group, two-note and sixteenth groupings (`raw_report.py beams`, which measures each group's span from its first to its last onset; the per-bar tiling is the rule's, not run here). The groupings of 5/8 and 7/8 themselves have no source in this list (OMT has no irregular metres): the row reports what is printed, so it needs none.

**Output.** Per bar: the grouping and its source (composite, words, beams); changes; provenance `exact`. **UNKNOWN** as above.

**Agent residual (PDMX).** Beaming left at the editor's default (MuseScore beams 7/8 by its own default) is not the composer's grouping; a PDMX file's beaming is one witness at best. The agent reads the grouping from accents, chord changes and phrasing where the beaming is the default and the bar is irregular.

**Examples.** Positives: `exercise.meter.7-8` (2+2+3 by beams), `exercise.meter.5-4` (3+2 by words). Near-misses: `song.jazz.the-dave-brubeck-quartet-take-five.pdmx` (5/4: beams sit inside beats, no counting words, so UNKNOWN by code; its 3+2 is the agent's), `exercise.rhythm.six-eight-eighths.4bar` (3+3, the metre's own grouping: no irregular grouping to report).

## rhythm.silence

**Input.** `score.load`: every note's onset and offset, all hands; the raw reader's `<multiple-rest>`, whole-bar rests and `print-object="no"`. Other parts: the original upload (`content/scores/pdmx`) where the app's file was re-staffed, since the app's file keeps the piano staves only (catalogue `editionNotes`: "kept ... omitted P1-Staff1, Drumset").

**Rule.** The union of all sounding notes; a silence is a gap between one note's end (the latest sounding) and the next onset, lasting at least one felt beat at that point. Report: count, each one's start, length in beats and bars, the bar of the re-entry; multi-bar rests (`<multiple-rest>`) apart; the leading silence before the first note (`late_entry`, from `mark.anacrusis`). Whether other parts sound during a silence is read from the original upload's other parts where they exist, and is otherwise UNKNOWN (`other parts not held`).

**Thresholds.** The one-beat floor is operational: a shorter gap is articulation, not silence [neither sourced nor validated as a teaching threshold].

**Integrity before reading.** A PDMX file with overfull bars gives nonsense gaps: `song.classical.debussy-children-s-corner-doctor-gradus-ad-parnassum.pdmx` reports a 167.5-beat silence in a 76-bar file, where note onsets run past the bars' lengths (42 whole-bar rests and 331 hidden objects, measured). Rule: silences are read only in bars that pass `integrity.bar-duration`; a failing bar makes the row UNKNOWN for its span.

**Output.** As above; provenance `exact`. Measured: items with a silence of a beat or more, generated 34, PDMX 176, rep 95. **UNKNOWN**: per span as above; `other parts not held` for the meanwhile question.

**Pipelines.** Generated: one part, nothing else sounds (the swing-pair items' four-beat silence between halves). PDMX: as the rule; hidden rests (`print-object="no"`) count as silence (nothing sounds).

**Examples.** Positives: `exercise.swing-pair.c` (four beats from bar 5), `song.blues.weary-blues` (7.5 beats at bar 3), `song.classical.chopin-scherzo-2.nifc` (silences up to 9 beats). Near-misses: `exercise.clave.son-3-2` (gaps of one to one and a half beats inside the clave figure: silences by the floor, which is the figure's own rests: the ability, not this row, decides whether such gaps count), `song.classical.debussy-children-s-corner-doctor-gradus-ad-parnassum.pdmx` (UNKNOWN by integrity).

## rhythm.bar-patterns

**Input.** `Bars` per staff: each readable bar's distinct onsets with the longest note from each, clipped to the bar.

**Rule.** The rhythm string of a bar on a staff is the ordered list of (onset, duration) pairs in quarters (chords and voices merged; rests implicit as the gaps). Report per staff: the distinct strings with count and bars, the share of bars using the most common one, and the same per beat (the string of each felt beat). A dotted-quarter-eighth bar and an eighth-dotted-quarter bar differ. Defined per staff, as printed (no hand residual, 1.M).

**Library.** music21 `search.mostCommonMeasureRhythms` exists (checked by import) and is the witness on chordless staves only: on a staff with chords it raises `AttributeError: 'Chord' object has no attribute 'pitch'` (measured on `song.classical.beethoven-moonlight-iii`, right hand); on `exercise.meter.7-8` it agrees (1 distinct rhythm, 4 of 4 bars). The custom string (the one `coordination.rhythmic-independence` builds) is therefore the rule.

**Output.** Per staff: distinct patterns, counts, bars, top share; provenance `exact`. Measured top-pattern share of the right hand (median): generated 0.75, PDMX 0.31, rep 0.23. **UNKNOWN**: no readable bar.

**Examples.** Positives (one dominant pattern): `song.classical.bach-wtc1-prelude-1` (0.91 of 34 bars), `exercise.meter.7-8` (1.0). Near-misses: `song.classical.beethoven-fur-elise` (16 distinct right-hand patterns, top share 0.37), `exercise.clave.son-3-2` (two patterns alternating: the two-bar cycle, 0.5 each).

## rhythm.clave-alignment

**Input.** `Bars` per hand; `rules/rhythm.py`'s `_cycles` (the 16-pulse cycle on sixteenths, one 4/4 bar, or on eighths, two 4/4 bars) and `CLAVES` (son, rumba, bossa, 3-2).

**Code part.** Per hand: read the cycles **in phase**, non-overlapping from the first readable bar, in the notation (sixteenths or eighths) whose cycles fit a clave best on average. In each cycle of three onsets or more, score each clave in each direction as matches minus extra onsets (2-3 is the 3-2 set shifted by eight pulses); the cycle follows the direction of the best score, and is `neutral` on a tie. Report per hand and per phrase of cycles: the counts of 3-2, 2-3 and neutral cycles, and the cycles that go against the hand's majority (cruzado candidates).

**Validation** (`clave_align.py`, measured). A first version read cycles from every bar (overlapping) and got 2-3 items wrong, because a two-bar cycle started on its second bar is the other direction; a second chose the notation by total score and read the eighth-notated son 2-3 as sixteenths. The version above agrees with the declared direction on all 40 generated items that declare one (clave 3-2 and 2-3 for son, rumba and bossa, the montuno and latin-groove son 3-2, the bossa comps), 0 disagree; the quarter-pulse left hands of the `.pulse` items are neutral, as they should be. On repertoire the tallies are mixed (`song.pop.honne-location-unknown-brooklyn-session-honne.pdmx`: right hand 45 3-2, 25 2-3, 26 neutral; `song.pop.marr11317-recado-bossa-nova.pdmx` 21 2-3, 3 3-2): *unverified as music*, and the phase depends on where the cycle is anchored.

**Source.** Mauleón, ch. III, "The Melody and Clave" (named in the list from the styles draft, **not read**): the alignment principle is cited, not quoted; the scoring above is operational [validated on generated items only].

**Output.** Per hand: direction counts per phrase, cruzado candidates with bars; provenance `exact` for the counts, which are not yet a musical judgement. **UNKNOWN**: no readable 2/4, 4/4 or 2/2 bar; no cycle with three onsets.

**Agent residual (PDMX and rep).** Where the phrase (and so the cycle) begins, which the anchor at the first readable bar can get wrong after an intro of odd length; which direction the melody follows; whether the counter-direction cycles are cruzado or the analysis's phase error. Generated: none, the recipe's declared direction agreeing with code in every item.

**Examples.** Positives: `exercise.clave.son-2-3` (2-3 in 4 of 4 cycles), `exercise.montuno.c.3note.son-3-2` (3-2). Near-misses: `exercise.clave.son-3-2.pulse` left hand (neutral: a quarter pulse), `exercise.tumbao.c` (two onsets a cycle: no direction).

---

## Findings for other owners (not changes made here)

1. **`detect.ts` syncopation over-counts in long-beat metres and pickups** (rhythm.syncopation above): code defects, Phase 5.
2. **`difficulty.py` line 363 counts the numerator as quarters** (technique.velocity): every 6/8, 3/8, 12/8, 7/8 item's notes-per-second is halved and every 2/2 item's doubled; the proving run's "beat unit" reading (S10) is replaced by this mechanism.
3. **The app's `isCompound` reads 6/4 and 12/4 as simple** (metre.class): 11 files hold a 6/4 bar, 1 a 12/4 bar.
4. **The generator writes quarter-note metronome marks in 6/8, 12/8 and 7/8** (mark.tempo-text): a generator question.
5. **The generated waltz accompaniments `exercise.accompaniment.waltz.*.both` write a 4:3 cross-rhythm** (four dotted eighths a bar over three quarters; texture.polyrhythm): a generator question; the app's syncopation detector misses it and this page's rule counts it.
6. **`rhythm.shuffle`'s "marked" kind belongs to `notation.swing-mark`** (as the list already says): code change in Phase 5.
7. **music21 `search.mostCommonMeasureRhythms` fails on chords** (rhythm.bar-patterns).
8. **partitura's tempo-word classes are wrong for allegretto, più/meno mosso, stringendo, rubato** (mark.tempo-text).

## Counts (by script over this file)

**Every threshold or defining choice on this page, with its label** (sourced: a published definition read; validated: run on catalogue items in `build/r1c/` and reported above; neither: operational, to be sourced or validated):

| # | characteristic | threshold or choice | label |
| --- | --- | --- | --- |
| T1 | notation.times | a one-bar shorter signature between equal ones is a partial-bar device | validated |
| T2 | notation.times | a one-bar longer signature between equal ones is a cadenza bar | validated |
| T3 | metre.class | compound = numerator 6, 9, 12 (15, 18), any denominator | sourced |
| T4 | metre.class | 3/8 simple triple, named apart; 2/2 and ¢ named apart | sourced |
| T5 | mark.anacrusis | first bar shorter than its signature; `implicit` not required | sourced |
| T6 | rhythm.values | values shorter than a 128th are encoding noise | validated |
| T7 | rhythm.syncopation | the felt beat and strong beats (downbeat; beat 3 of four) | sourced |
| T8 | rhythm.syncopation | lines read: right hand's top, left hand's bottom; inner voices out | validated |
| T9 | rhythm.syncopation | the rest kind needs the whole texture silent on the strong beat | validated |
| T10 | rhythm.syncopation | tuplet notes of a beat's value or longer left out | validated |
| T11 | rhythm.syncopation | an off-beat attack needs no earlier onset of the line in its beat | validated |
| T12 | rhythm.tuplets-other | normal-notes above 16, or ratio within 5 per cent of 1, is noise | validated |
| T13 | rhythm.tuplets-other | irregular: 11 or more notes, or 9 or more at over double density, not 12, 16, 24, 32 | validated |
| T14 | rhythm.cadenza | 6 or more grace notes before one principal note | validated |
| T15 | rhythm.cadenza | the free-time word list | neither |
| T16 | rhythm.equal-stream | interval an eighth or shorter | neither |
| T17 | rhythm.equal-stream | a stream counted from 8 notes | validated |
| T18 | rhythm.habanera | the cell {0, 3/8, 1/2, 3/4} and its doubled form | sourced |
| T19 | rhythm.habanera | the doubled kind is reported apart and is not a habanera by onsets alone | validated |
| T20 | rhythm.tresillo | the cell {0, 3/8, 3/4} | sourced |
| T21 | rhythm.cinquillo | the cell {0, 1/4, 3/8, 5/8, 3/4} | sourced |
| T22 | rhythm.habanera, tresillo, cinquillo, backbeat | a pattern: two consecutive bars or four anywhere | validated |
| T23 | rhythm.backbeat | beats 2 and 4 of a four-beat bar | sourced |
| T24 | rhythm.backbeat | afterbeat chords (oom-pah) excluded | validated |
| T25 | rhythm.hemiola | three two-beat units in two triple bars (and the 6/8, 3/4 kinds) | sourced |
| T26 | rhythm.hemiola | present at one occurrence | neither |
| T27 | texture.polyrhythm | even divisions, neither dividing the other | validated |
| T28 | mark.tempo-text | the Italian basic tempo terms | sourced |
| T29 | mark.tempo-text | quarter BPM = number × beat unit with dots | sourced |
| T30 | mark.tempo-text | a `<sound tempo>` without a printed mark is not the printed tempo | validated |
| T31 | mark.tempo-change | the change terms | sourced |
| T32 | mark.tempo-change | the abbreviations and spellings added | neither |
| T33 | technique.velocity | the peak window is one bar | neither |
| T34 | technique.velocity | seconds from the bar's length in quarters, not the numerator | validated |
| T35 | technique.endurance | a gap of more than one beat between onsets ends a span | validated |
| T36 | rhythm.silence | a silence lasts at least one felt beat | neither |
| T37 | metre.grouping | beams show grouping only with denominator 8 or 16 | neither |
| T38 | metre.grouping | counting words `\d(\s*\+\s*\d)+` | validated |
| T39 | notation.swing-mark | the swing and straight word lists | validated |
| T40 | rhythm.clave-alignment | in-phase cycles, best-fitting notation, matches minus extras | validated |

Counts by script (`build/r1c/count_page.py` over this file, 2026-10-08): 30 sections, one per row of section 1.C, in its order (30 of 30; 0 rows are agent-only or gaps, so no one-line entries); rules written 30, of which 2 carry `rules/rhythm.md` over (`rhythm.secondary-rag` unchanged, `rhythm.shuffle` with the list's correction); thresholds and defining choices 40: sourced 12, validated 21, neither 7 (the labels are this page's own, in the table above); every section names at least two positive and two near-miss catalogue ids under **Examples**. Agent residuals stated: 17 sections, the 17 rows the list marks code + agent on PDMX (16 under an **Agent residual** heading; `rhythm.tresillo` inherits `rhythm.habanera`'s), the shared hand residual stated once in section 0; `rhythm.syncopation`, marked "code (to be validated)" on PDMX, is validated above and stays code.

## Not done

- The rules are written, not built: no code in `tools/classifier` implements the rules above except where a section names existing code (`rules/rhythm.py` for the cells, shuffle and secondary rag). The build scripts under `build/r1c/` are measurements, not the rules' code.
- No checker has argued against this page (Phase 2's done condition); nothing here was heard.
- The ability combinations and level thresholds for the abilities that read these rows (`ability-characteristics.md`) are not written here: this brief covers the characteristics.
- `rhythm.syncopation`'s accent kind reads `accent` and `strong-accent` only; `sf`, `sfz` and `fz` on an off-beat note are not read (partitura's dynamics, not run).
- `rhythm.hemiola` by accents or chord change, `metre.grouping` by per-bar beam tiling, `rhythm.silence`'s other-parts question from the original uploads, `mark.tempo-change`'s dashed-line scope and `technique.velocity`'s piecewise tempo were specified and not run.
- Sources named and not read: Mauleón (clave alignment); the syllabi are cited through `draft-abrsm-trinity.md`'s quotations, not re-read; Longuet-Higgins and Lee and the Harvard Dictionary through `detect.ts`'s secondary statement, as there.
- The proving run's 4 PDMX `rhythm.dotted-quarter` and 5 `rhythm.ties` disagreements were split by cause only in part.
