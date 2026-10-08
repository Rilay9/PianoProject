# Area 1.A, the item and its score: the rules for code (Phase 2)

**What this is.** The Phase 2 rules (FABLE.md section 2, item 3) for the 26 characteristics of `docs/classifier/characteristics-list.md` section 1.A, in the list's order. Every one of the 26 is read by code in at least one pipeline (code, or code + agent), so every one has a rule here; none is agent-only or a gap. Written 2026-10-08 in a worktree cut from origin at 75862593; no code or table was changed (rules before code). Not yet argued against by a second agent or judged by the orchestrator.

**The standard each section meets.** Input; the library call or the custom algorithm; each threshold with its source or its validation on real scores; the output, its provenance and when it answers UNKNOWN; the pipelines where they differ; for code + agent, the exact residual handed to an agent (the agent's instruction itself is Phase 3); and real examples by catalogue id. Every claim is labelled **[measured: script]** or **[reading]**. Nothing here has been heard.

**What was run.** Scripts under `build/a1/` in this worktree (not committed), over the main checkout's catalogue as built 2026-10-07 15:41 (`app/public/content/catalog.json`, read only): 2,020 notated items, of which 1,211 generated (`exercise.*`), 519 PDMX (`*.pdmx`, the readable ones of the 556 held) and 290 other real scores (Mutopia, OpenScore, NIFC and other imports; they take the PDMX rules and serve here as examples). `scan.py` walks the raw MusicXML of all 2,020 files (46 s on this machine); `analyze.py` and `analyze2.py` run prototype versions of the rules below over that walk; `ottava_check2.py`, `spell_check2.py`, `expand_check.py`, `chrom_check.py` and `melody_cov.py` run the library witnesses (music21 10.5.0, partitura 1.9.0 in `.venv`, every name below checked by import in `check_api.py`); `corpus_check.py` runs the rules on music21's bundled corpus where the catalogue has no instance. The prototypes are validation tools, not the implementation; where a prototype and a rule below differ, the section says so.

---

## Shared reading (every section uses these)

**S1. The raw walk.** One pass over the MusicXML of the item (the `.mxl` container's root file): per part, `<divisions>`, `<backup>`, `<forward>`, `<chord/>`, `<grace>`, `<cue>`, `<staff>`, `<voice>`, `<tie>`, `print-object`, and every element the rows read (`<clef>`, `<key>`, `<octave-shift>`, `<accidental>` with its attributes, `<notehead>`, `<notehead-text>`, `<fingering>`, `<lyric>`, `<harmony>`, `<figured-bass>`, `<barline>`, `<ending>`, `<segno>`, `<coda>`, `<words>`, `<sound>`, `<measure-style>`, `<staff-details>`). Each note gets its part, staff, voice, 0-based measure index, onset in quarters from the score start and from its bar, duration, and its `<pitch>` (step, alter, octave). Why a raw walk and not only music21: music21's MusicXML import drops `<figured-bass>`, the `cautionary` attribute of `<accidental>` and `<sound>` jump attributes (characteristics-list.md, "Routes that find nothing"; checked again here on a synthetic file: a `cautionary="yes"` sharp reads back with `displayType` "normal" [measured: ottava_test.py]). The proving run's witness (`tools/classifier/prove_exists.py`) is a walk of the same kind and stays the independent second reader.

**S2. music21 is a second witness and the named library route, with one trap.** `Stream.recurse().notes` includes `harmony.ChordSymbol` objects, so on a file with chord symbols it counts symbol pitches as notes: Czerny's School of Velocity op. 299 no. 8 (PDMX) gives 1,977 "notes" for 1,259 noteheads [measured: ottava_probe4.py]. Every rule that iterates music21 notes filters out `harmony.ChordSymbol` first. And `Score.parts` returns one `PartStaff` per staff: a grand-staff piano part is two "parts" to music21 (`exercise.accompaniment.alberti.a-minor.both`: 2 `PartStaff`, one `StaffGroup`) [measured: inline check], so music21 never counts parts for `notation.staves`.

**S3. partitura through `tools/classifier/score.py`.** `score.load` gives the note array (onset, duration, pitch, spelling, staff, voice, key and time signature) and the hand. 3 of 519 PDMX files raise inside partitura's load or analysis (`song.classical.bach-invention-no-1-in-c-major-bwv-772.pdmx` and `song.classical.sakamoto-shining-boy-and-little-randy-ryuichi-sakamoto.pdmx`: IndexError; `song.classical.puccini-o-mio-babbino-caro-for-solo-piano.pdmx`: KeyError '512th') [measured: spell_check2.py]. A rule that needs partitura answers UNKNOWN "partitura cannot read the file" there; the raw-walk rules still answer.

**S4. Written and sounding pitch.** The MusicXML `<pitch>` is the sounding pitch; under an `<octave-shift>` the note is displayed one octave (size 8) or two (size 15) away: type "down" is an 8va or 15ma (displayed lower), type "up" an 8vb or 15mb (displayed higher) (MXL-octave-shift; music21 reads type "down" as `spanner.Ottava` "8va", and `Stream.toWrittenPitch()` turns C6 into C5 [measured: ottava_test.py]). The displayed octave is the sounding octave plus the shift (8va: −1, 15ma: −2, 8vb: +1, 15mb: +2). A note is under a shift when, on the same part and staff, its onset t satisfies start ≤ t < stop (the stop's own onset excluded). Validated against music21 `toWrittenPitch()` (chord symbols filtered) on all 93 catalogue files with a shift: the multisets of displayed (step, octave) agree in 81 [measured: ottava_check2.py]. Including the stop's onset agrees in only 19 [measured: ottava_check_incl.py]. Of the 12 that disagree, 3 have a span with no stop (`song.classical.debussy-claude-debussy-la-cathedrale-engloutie-the-submerged-cathedral.pdmx`, `song.classical.lecuona-malaguena-by-ernesto-lecuona.pdmx`, `song.jazz.james-pierpont-jingle-bells-jazz-piano.pdmx`); the other 9 differ on 2 to 46 noteheads at span ends where another voice of the staff starts while the shifted voice still sounds (`song.pop.mederic-niot-summer-road-s-cakewalk.pdmx` bar 11: the 8va melody F6-F7 sounds over voice 2's E4-F4, which start at the stop's onset) [measured: ottava_probe5.py]. Rule: the time-based staff-wide span above; a note on which it and music21 disagree has its displayed position UNKNOWN "octave-shift extent disputed", and a span with no stop leaves every note after its start UNKNOWN on the same reason (residual of `mark.ottava`).

**S5. Percussion and non-five-line staves.** A staff is unpitched when a clef in force on it has sign `percussion` or `TAB`, or its `<staff-details><staff-lines>` is not 5. Every pitch rule (clefs, ledger, keys exercised, chromatic, accidentals, entropy, redundancy, spelling) skips it and says so. On the catalogue this is exactly the 18 rhythm and 10 clave items (28 generated, 0 PDMX, 0 other), whose pitched B4 notes the app's stored reader counts as bass-clef notes and ledger notes [measured: analyze.py; proving run: all 5 generated `clef.bass` and 5 `pitch.ledger` disagreements are the five clave .pulse items].

**S6. The hand.** score.py's rule: a two-staff part gives staff 1 to the right hand and staff 2 to the left; two one-staff parts give part 0 to the right; a single staff takes the catalogue's declared hand. Where that may be wrong on PDMX, `prereq.hand-assignment` flags the passage and an agent settles it once per item; rows defined per staff (marked so below) do not inherit it.

**S7. The answer.** A `score.Result` (`tools/classifier/score.py`): a value with provenance `exact` (a deterministic reading of the notation), `two-witnesses`, `one-witness`, `inferred` (with a confidence) or `metadata`, or UNKNOWN with the reason; `where` holds 0-based bar indices (bar 1 as printed is `where` 0; a pickup is bar 0). Per-staff values are keyed `part:staff` (`0:1` is the upper staff of the first part). Shared UNKNOWN reasons: "no notes", "the file cannot be read", "partitura cannot read the file" (S3), "unpitched staff" (S5).

**S8. Pipelines.** Generated items: the file is read by the same code; the recipe (`generated.spec-declared`) is declared intent checked against the file, never the verification; where the two disagree it is a generator or reader defect, reported, not averaged. PDMX: the held music21 re-export (every held file says `music21 v.10.5.0`), so elements music21 drops are absent from every held file. Other real scores follow the PDMX rules.

---

## 1. item.format

**Marking.** Generated code; PDMX code + agent.

**Input.** The raw walk (S1): `<score-part>` (`<part-name>`, `<score-instrument>/<instrument-name>`, `<midi-instrument>/<midi-program>`), `<staves>`, clefs and staff lines (S5), voices per staff per bar, chord symbols (`notation.chord-symbols`, de-duplicated), slash noteheads (`notation.slash-rhythm`), lyrics (`notation.lyrics`); the catalogue title; the recipe's family for generated items.

**Algorithm.** Two values, decided apart.

*Layout*, first rule that applies:
1. **Rhythm staff only.** Every note-bearing staff is unpitched (S5): layout *piano score* (every note is written; the staff is a one-line percussion staff), and purpose *rhythm exercise* (below). music21 `note.Unpitched` and partitura `UnpitchedNote` find none of the catalogue's rhythm items, which write pitched B4 on a one-line percussion staff (characteristics-list.md); the clef and staff-lines test finds all 28 and nothing else [measured: analyze.py].
2. **Two or more parts.**
   - every part is one staff and the parts are named as voices (Soprano, Alto, Tenor, Bass, or S., A., T., B.; case ignored): *hymn or chorale in parts*, open score;
   - a part carries lyrics and is named or programmed as a voice (name matching voice, vocal, soprano, alto, tenor, bass, baritone, or MIDI program 53 to 55) and another part is a two-staff keyboard part: *piano-vocal-guitar song score*;
   - any part is not a keyboard: its name or instrument name does not match piano, keyboard, klavier, pianoforte, organ, harpsichord, rhodes or synth, and its MIDI program (where given) is outside 1 to 8 (pianos) and 17 to 24 (organs) of General MIDI: *piano part with other instruments*;
   - otherwise *piano score* (two keyboard parts, as in `song.classical.chopin-ballade-1`, the only two-part file in the catalogue).
3. **One part, one staff.** Chord symbols present and slash noteheads present: *chord chart*. Chord symbols on at least one bar in four (unique symbols ≥ printed bars / 4) and fewer than 10% of onsets sounding two notes or more: *lead sheet*. Otherwise *piano score* (a one-hand part).
4. **One part, two staves.** At least half of the staff-bars hold two voices, and at least half of the item's onset times strike exactly four notes: *hymn or chorale in parts* (candidate). Otherwise *piano score*.
5. **Pre-staff notation** (finger numbers or letter names without a staff) is never answered by code: MusicXML has no encoding for it.

*Purpose*:
- Generated: from the recipe's family: `rhythm` and `clave` give *rhythm exercise*; `study` gives *piece*; every other family gives *technical exercise*. This rests on the recipe alone and needs the family contracts to state it (characteristics-list.md section 1.M; a precondition, not done here).
- PDMX and other: rhythm staff only gives *rhythm exercise*; the title or a part name matching primo, secondo, duet, 4 hands, four hands, quatre mains, vierhändig or teacher part gives *duet part* (candidate); a title matching exercise, exercice, Übung, étude, etude, study, studie, scale, arpeggio, Hanon, Czerny, Beyer, velocity, technique or drill gives *technical exercise* (candidate); otherwise *piece*.

**Thresholds.**
- Lead sheet: a symbol on at least one bar in four, and under 10% chord onsets. Neither sourced nor tuned; validated by running: both lead sheets in music21's corpus (`leadSheet/berlinAlexandersRagtime.mxl`: 19 symbols over 34 bars, chord-onset share 0.0; `leadSheet/fosterBrownHair.mxl`: 40 over 35) [measured: corpus_check.py], and 63 PDMX and 16 other items classified lead sheet (titles of the first four: O Holy Night, Silent Night, We Three Kings, Blues My Naughty Sweetie; the rest not examined one by one) [measured: analyze2.py].
- Hymn in parts: two voices in at least half the staff-bars and four-note onsets at at least half the onset times. Validated: it finds 7 PDMX items, every one a hymn or chorale by title (Abide with Me, Away in a Manger, O Sacred Head, Rock of Ages, Schumann op. 68 no. 4 "Choral", Amazing Grace SATB, Go Tell It on the Mountain), and no generated item. The four-note test alone also took 115 generated chord exercises (for example `exercise.comping.a.anticipated.intro`, four-note chords in one voice), which the two-voice test removes; Bach's Invention no. 1 scores 0.003 [measured: analyze2.py, probe3.py].
- Purpose words: validated as candidates only: 74 PDMX titles match the exercise words, including Chopin's Étude op. 10 no. 6, a concert piece; the duet words match one PDMX title, a trombone duet arrangement of Silent Night, not a piano duet part [measured: analyze2.py, examples.py].
- The open-score chorale rule (rule 2, first bullet) was written after the prototype misread music21's corpus chorale `bach/bwv66.6.mxl` (four one-staff parts named Soprano, Alto, Tenor, Bass, no lyrics) as *piano part with other instruments*; it has not been re-run [measured: corpus_check.py, before the rule; reading, after].

**Output.** `{layout, purpose, evidence}`: evidence names the rule that fired (parts and names, staves, symbol and bar counts, voice and onset shares, the matched title word). Provenance `exact` for rules 1 to 3 and generated purpose; `inferred` (confidence 0.5) for every candidate. UNKNOWN on the layout when one part has two staves and chord symbols with the lower staff silent in at least half the bars (a lead sheet with partial accompaniment), or when the lyrics part's role is unclear (an accompaniment written under a sung line).

**Pipelines.** Generated: code; the layout comes from the file (1,187 two-staff, 24 one-staff), the purpose from the family. PDMX: code + agent.

**Residual to the agent (PDMX).** Each candidate (hymn in parts, technical exercise, duet part) and each UNKNOWN layout; whether a piece titled as a study or exercise is a technical exercise or a piece; pre-staff notation, which only a source image or the metadata could show. The agent receives the evidence list.

**Examples.** Positives: `exercise.clave.bossa` (rhythm staff, rhythm exercise); `song.classical.1818-franz-xaver-gruber-silent-night.pdmx` (lead sheet); `song.folk.amazing-grace-satb.pdmx` (hymn in parts); `song.folk.so-danco-samba.pdmx` (chord chart: symbols over stemless slash noteheads). Near-misses: `exercise.comping.a.anticipated.intro` (four-note chords, one voice: a piano score); `song.jazz.the-dave-brubeck-quartet-take-five.pdmx` (symbols over a full two-staff score: a piano score, not a lead sheet); `song.classical.chopin-etude-in-e-flat-minor-op-10-no-6.pdmx` (an étude: a piece, though the title word fires); `song.pop.misc-christmas-silent-night-trombone-duet.pdmx` (the duet word fires; not a piano duet part).

---

## 2. notation.staves

**Marking.** Code in both pipelines.

**Input.** The raw walk: the number of `<part>` elements, the largest `<staves>` value per part (1 when absent), and the unpitched staves (S5).

**Library.** partitura `Part.note_array(include_staff=True)` field `staff` as the second witness for staves that carry notes (the field is not in partitura's default output; `score.load` asks for it). music21 is not used to count parts: its `Score.parts` returns one `PartStaff` per staff (S2).

**Algorithm.** `parts` = number of `<part>`; `staves_per_part` = list of the largest `<staves>` per part; `pitched_staves` = staves that carry notes less unpitched staves. No threshold.

**Output.** `{parts, staves_per_part, pitched_staves, unpitched_staves}`, provenance `exact`. UNKNOWN only on the shared reasons.

**Validation.** Proving run: 2,020 of 2,020 agree with the raw witness [measured: proving run]. Catalogue: generated 1,187 two-staff and 24 one-staff single parts; PDMX 421 two-staff and 98 one-staff; other 258 two-staff, 31 one-staff and one file with two two-staff parts [measured: analyze.py].

**Examples.** Positives (two staves, one part): `exercise.accompaniment.alberti.a-minor.both`, `song.classical.bach-invention-no-1-in-c-major-bwv-772.pdmx`. One staff: `song.classical.12-bar-blues.pdmx`, `exercise.clave.bossa` (unpitched). Near-miss: `song.classical.chopin-ballade-1` (two parts of two staves each: four staves, one piano); `exercise.clave.bossa.pulse` (two staves, one of them a one-line percussion staff: one pitched staff and one unpitched, not a grand staff).

---

## 3. prereq.hand-assignment

**Marking.** Generated code; PDMX code + agent.

**Input.** The raw walk's staff, voice, onset and duration per note; `<words>` directions; the catalogue's declared hand for a single staff.

**Algorithm.** The hand of a note is score.py's rule (S6). On top of it code raises four flags, each with its bars:
1. **True cross-staff writing**: within one part, one bar and one voice number, notes on both staves whose sounding spans never overlap in time (one line moving between the staves). Flag the bar.
2. **Voice-number collision**: the same, with overlapping spans (two lines sharing one voice number, as in four-part hymns). Flag the bar.
3. **Hand words**: a `<words>` text that begins (case ignored, after spaces) with m.d., m.s., m.g., r.h., l.h., rh, lh, mano destra, mano sinistra, main droite, main gauche, rechte Hand or linke Hand. Flag from its bar to the next hand word or the end of the bar where its staff next changes material (the agent reads the extent).
4. **Beyond one hand's reach**: notes struck together on one staff spanning more than 16 semitones (wider than a major tenth). Flag the onset.
5. A single-staff, single-part item whose catalogue entry says both hands: every bar flagged ("one staff holds both hands").

**Thresholds.**
- Reach, over 16 semitones. Source in part: the stride left hand's widest written interval is "a major tenth" (Wikipedia, "Stride (music)", quoted in `docs/classifier/rules/texture.md`, stride), so a tenth is still one hand. Validated: on generated items, where staff is hand by construction, the widest one-staff simultaneity is 14 semitones; over 16 semitones occurs in 43 PDMX and 59 other items (0 generated), for example `song.classical.abide-with-me-william-henry-monk.pdmx` bar 10 (20 semitones: tenor and bass on one staff, a collision hymn), `song.classical.bach-fugue-in-g-minor-bwv-578-piano-transcription.pdmx` bars 17 and 18 (19 and 24 semitones) [measured: analyze.py, analyze2.py]. A flag, not a fact: a rolled chord or a written-out stretch for a large hand also fires.
- Hand words anchored at the start of the text. Validated: the anchored list finds 10 PDMX files (mano destra and sinistra in Bach BWV 935; m.g. in Chopin op. 10 no. 6, Debussy's Doctor Gradus and Grieg's Hall of the Mountain King; m.s. and m.d. in Grieg op. 47 no. 2; r.h. and l.h. in Lecuona's Malagueña; others) and 2 other items; an unanchored search also took 10 generated instruction sentences ("The left hand is the beat...", `exercise.clave.bossa.pulse`), which the anchor removes [measured: analyze.py, probe.py, probe4.py].

**Measured flags.** PDMX: true cross-staff writing in 29 of 519 items, collisions in 4 (Abide with Me, O Sacred Head, Amazing Grace SATB, and the rag At a Georgia Camp Meeting), hand words in 10, reach in 43; other: cross-staff 18, collisions 4, hand words 2, reach 59, one staff for both hands 2 (`excerpt.blues.wabash-blues.b1-4`, `excerpt.classical.mendelssohn-hark-the-herald-angels-sing-piano-bass-jazz-lead-sheet.pdmx.b25-28`); generated: none of the five [measured: analyze.py]. These match the code-or-agent review's 29 and 4 (`a3.py`, `a4.py`, `a6.py`, on the 421 two-staff held files).

**Output.** Per note, the hand (`R`/`L`) with provenance `exact` outside flagged bars and `inferred` (confidence 0.5) inside them until the agent answers; per item, the flags with bars. UNKNOWN: the shared reasons only.

**Pipelines.** Generated: code (0 of 1,211 items raise a flag). PDMX: code + agent.

**Residual to the agent (PDMX).** For each flagged bar only: which hand plays each note, given the staves, voices, the words and the reach. Settled once per item; the 53 rows that read a hand (characteristics-list.md section 1.M) inherit it. An unmarked crossing written on the other hand's staff raises no flag and stays invisible to code and to this residual (a known limit, as in section 1.M).

**Examples.** Positives (flag raised): `song.classical.albeniz-asturias.pdmx` (true cross-staff writing), `song.folk.amazing-grace-satb.pdmx` (collisions), `song.classical.grieg-album-leaf-op-47-no-2.pdmx` (m.s., m.d.). Near-misses: `song.classical.bach-invention-no-8-in-f-major-bwv-779.pdmx` (the review's example of voice numbers reused across staves in different bars; none of the five flags fires on it [measured: verify_ids.py]); `exercise.clave.bossa.pulse` (a sentence naming the left hand, not a hand word); `song.classical.bach-adagio-bwv-974-after-marcello.pdmx` (its widest one-staff chord is 16 semitones, a major tenth: not flagged).

---

## 4. texture.melody-location

**Marking.** Generated code; PDMX code + agent.

**Input.** score.load's notes per hand (S6); the texture rules' answers (`tools/classifier/rules/texture.py`); lyrics and chord symbols; for generated items the recipe's family.

**Algorithm.** Per bar (the phrase grouping is `form.phrase`'s, area 1.J; this row reports bars and the agent or the phrase rule groups them):
1. Only one staff sounds in the bar: the melody is that staff's top line (the highest note per onset).
2. Exactly one hand carries an accompaniment-pattern bar by an existing rule (`texture.alberti`, `texture.broken-chord`, `texture.waltz-bass`, `texture.oom-pah`, `texture.stride`, `texture.boogie-bass`, `texture.four-to-the-bar`) and that rule reports one hand only: the melody is the other hand's top line.
3. A one-staff part with lyrics or chord symbols (a lead sheet, a vocal line): the melody is that staff.
4. Otherwise UNKNOWN for the bar. A **hand exchange** is reported where consecutive settled bars, inside one phrase, put the melody in different hands.
For generated items the family states the roles (study: a line over accompaniment; hand_independence and coordination: lines in both hands); code checks the file against that statement by rules 1 and 2, and a disagreement is a defect.

**Thresholds.** None of its own; the pattern rules carry theirs (texture.md). Validated as coverage: on a random sample (seed 7) of 60 two-staff PDMX items, rules 1 and 2 settle 508 of 3,482 bars (14.6%; 135 by rule 1, 373 by rule 2), no item fully, 16 items in no bar; on 30 other items 831 of 3,432 (24.2%); on 40 generated items 41 of 155 bars [measured: melody_cov.py]. Code therefore settles a minority of bars on real scores; the rest is the agent's.

**Output.** Per bar: `{hand, voice position (top, inner, bass), rule}` or UNKNOWN; per item: share of bars settled, the hand-exchange bars. Provenance `exact` for rules 1 and 3, `one-witness` for rule 2 (it inherits the pattern rule's operational definition).

**Pipelines.** Generated: code, with the family's statement as the check. PDMX: code + agent.

**Residual to the agent.** Every UNKNOWN bar: which hand and voice carries the main line when both hands are active, inner-voice melodies, and whether a change of hand is a hand exchange. The agent receives the settled bars, the pattern rules' bars and the hands.

**Examples.** Positives (settled by code): `song.folk.when-the-saints.alternating` (every bar), `exercise.boogie.b-flat.walking-eighths` (every bar). Near-misses (nothing settled): `song.classical.bach-little-prelude-in-d-major-bwv-936.pdmx`, `song.classical.bach-o-sacred-head-johann-sebastian-bach-on-a-tune-by-hans-leo-hassler.pdmx` (both hands active, no accompaniment pattern) [measured: melody_cov.py].

---

## 5. notation.clefs

**Marking.** Code in both pipelines.

**Input.** The raw walk's `<clef>` elements (`number` = staff, `sign`, `line`, `clef-octave-change`) with their times; the notes.

**Library.** music21 `clef.TrebleClef`, `clef.BassClef` (and the other clef classes) through `note.getContextByClass(clef.Clef)` as second witness; partitura `clef_feature` (in `list_note_feats_functions()`) as third.

**Algorithm.** The clef in force at a note is the last `<clef>` on its part and staff at or before its onset (a clef written at the end of a bar governs the next bar). Count notes per staff per clef, named sign + line + octave change (G2, F4, G2+1, C1 ...). Flags: a bass clef on staff 1, a treble clef on staff 2, and any clef other than G2, F4 and their octave transpositions (another clef is outside the curriculum: FABLE.md section 2, 1a, "other clefs ... are out"). Unpitched staves are reported as such (S5), never as bass.

**Thresholds.** None.

**Validation.** The 8 PDMX disagreements of the proving run (`clef.bass`), left unresolved by the list, are resolved here: all are faults of the stored reader, which takes staff 2 as bass: six two-staff pieces with treble clefs on both staves (`song.classical.beyer-exercise-no-38.pdmx`, `song.classical.czerny-study-op-139-no-1.pdmx` and `-no-2`, `song.classical.satie-erik-satie-enfantillages-pittoresques-berceuse.pdmx`, `song.classical.schumann-a-little-piece-op-68-no-5.pdmx`, `song.classical.tchaikovsky-march-of-the-wooden-soldiers-op-39-no5.pdmx`) and two one-staff parts in the bass clef (`song.pop.louisf365-boogie-woogie-and-blues-piano-exersices.pdmx`, `song.pop.misc-computer-games-coconut-mall-trombone-solo.pdmx`); the raw witness is right on all 8 [measured: proving results.json against analyze.py]. Across the catalogue, notes are read in a bass clef on staff 1 or a treble clef on staff 2 in 154 PDMX and 132 other items, none generated; other clefs: C1 (soprano) in Mozart K. 1b, 1c, 1d, G1 (French violin) in 5 PDMX items [measured: analyze.py, ledger_attr.py].

**Output.** `{per staff: {clef: notes}}`, the flags with bars; provenance `exact`. The app's `detect.ts` `bassClef` (staff 2 taken as bass) is wrong on every item above; this rule replaces it.

**Examples.** Positives: `song.classical.schumann-a-little-piece-op-68-no-5.pdmx` (treble clef on the lower staff throughout), `song.pop.louisf365-boogie-woogie-and-blues-piano-exersices.pdmx` (one staff, bass clef). Near-misses: `exercise.clave.bossa.pulse` (one-line percussion staff: unpitched, not bass); `song.classical.mozart-allegro-in-c-major-k-1b.pdmx` (soprano clef: flagged as another clef).

---

## 6. notation.clef-change

**Marking.** Code in both pipelines.

**Input and library.** As `notation.clefs`; music21 clef objects with their offsets as second witness.

**Algorithm.** On each staff, a clef change is a `<clef>` whose (sign, line, octave change) differs from the one in force before it; a restatement of the same clef (at a system break) is not a change. Position: its bar and its offset in the bar; *at the bar line* when the offset is 0 or equals the bar's length, else *inside the bar*.

**Thresholds.** None.

**Validation.** PDMX 145 items change clef, 96 of them inside a bar; other 127 and 120; generated none [measured: analyze.py]. The most: 130 changes in `song.classical.chopin-ballade-no-4-in-f-minor-op-52.pdmx` [measured: examples.py].

**Output.** `{count, at_barline, inside_bar, changes: [{staff, bar, offset, from, to}]}`, provenance `exact`.

**Examples.** Positives: `song.classical.albeniz-asturias.pdmx` (inside bars), `song.classical.beethoven-sonatina-in-f-major-anh-5-no-2.pdmx` (at bar lines only). Near-misses: `exercise.accompaniment.alberti.a-minor.both` (no change); a system-break restatement of the same clef (not counted; no catalogue item checked for one).

---

## 7. pitch.ledger

**Marking.** Code in both pipelines.

**Input.** The displayed pitch (S4) and the clef in force (`notation.clefs`); grace notes and unpitched staves left out.

**Algorithm.** Staff position p = octave × 7 + letter (C = 0 ... B = 6; middle C = 28) of the displayed pitch. A clef puts a reference pitch on a line: G clef G4 (32), F clef F3 (24), C clef C4 (28), each plus 7 × `clef-octave-change`, on its line L (1 = bottom). Bottom line b = reference − 2(L − 1); top line b + 8. A note is on or between ledger lines below when p ≤ b − 2, above when p ≥ b + 10; the number of ledger lines is ⌊(b − p)/2⌋ below, ⌊(p − b − 8)/2⌋ above. Middle C on its own first ledger line (p = 28 one line outside the staff) is counted apart, as the row asks. Counts per staff, per bar, below and above, the most lines on one note.

**Thresholds.** None; the geometry is the staff's (WP-Ledger_line; MXL-clef).

**Validation.** The app's `detect.ts` `ledgerLines` takes staff 1 as treble and staff 2 as bass and reads the sounding pitch. Against this rule it differs on 159 PDMX and 133 other items because of the clef in force and on 69 PDMX and 21 other items because of an octave shift; never on a generated item [measured: ledger_attr.py]. For example `song.classical.satie-erik-satie-enfantillages-pittoresques-berceuse.pdmx`: 18 ledger notes here, 146 by the app's rule (treble clef on the lower staff) [measured: analyze.py]. The proving run's 0 PDMX presence disagreements hid these count differences: both readers found some ledger note. Generated: 921 of 1,211 items have ledger notes beyond middle C, 645 have middle C on its ledger line [measured: analyze.py].

**Output.** `{per staff: {below, above, middle_c, max_lines_below, max_lines_above}, bars}`, provenance `exact`; a note whose displayed position is disputed (S4) is excluded and counted as `unknown_notes`.

**Pipelines.** Same rule; PDMX adds the S4 residual through `mark.ottava`.

**Examples.** Positives: `song.classical.el-choclo-piano.pdmx` (nine ledger lines on one note), `exercise.accompaniment.alberti.a-minor.both`. Near-misses: `song.classical.1818-franz-xaver-gruber-silent-night.pdmx` (only middle C on a ledger line), `song.classical.1863-rev-john-henry-hopkins-we-three-kings-of-orient-are.pdmx` (none at all); `exercise.clave.bossa.pulse` (unpitched: not read).

---

## 8. mark.ottava

**Marking.** Generated code; PDMX code + agent.

**Input.** The raw walk's `<octave-shift>` (type up, down, stop, continue; size; number; staff) with times; `<words>`.

**Library.** music21 `spanner.Ottava` (its `type` "8va", "8vb", "15ma", "15mb"; `getSpannedElements()`) and `Stream.toWrittenPitch()`; partitura `score.OctaveShiftDirection` as third witness.

**Algorithm.** Pair each start with the next stop of the same part, staff and number; kind from type and size (down 8 = 8va, up 8 = 8vb, down 15 = 15ma, up 15 = 15mb); extent per S4; length in bars = stop bar − start bar + 1. A start without a stop is an *unclosed span*. A `<words>` text that begins with 8va, 8vb, 8va bassa, 15ma, 15mb, ottava or loco is an *ottava written as words*.

**Thresholds.** The exclusive stop, validated (S4: 81 of 93 files agree with music21).

**Validation.** PDMX: 71 items with spans (8va 223, 8vb 48, 15ma 8, 15mb 1), 3 with an unclosed span, 2 with ottava words (`song.classical.czerny-the-art-of-preluding-op-300-no-8.pdmx`, `song.pop.misc-soundtrack-light-the-world.pdmx`); other 22 items; generated none [measured: analyze.py].

**Output.** `{spans: [{kind, staff, start_bar, stop_bar, bars}], unclosed, words}`; provenance `two-witnesses` when the raw rule and music21 agree on every note, else `one-witness` with the disputed notes listed.

**Residual to the agent (PDMX).** An unclosed span (where it ends), ottava words (what they cover), and the notes S4 marks disputed. The agent receives the span, the notes after its start and the staff's other voices.

**Examples.** Positives: `song.classical.bennet-rosemary-s-waltz.pdmx` (one closed 8va span), `song.classical.albeniz-asturias.pdmx` (both witnesses agree on every note). Near-misses: `song.classical.lecuona-malaguena-by-ernesto-lecuona.pdmx` (an unclosed span: agent), `song.pop.misc-soundtrack-light-the-world.pdmx` (8va as words), `exercise.arpeggio.a-flat-major.4oct.both` (high notes written out on up to ten ledger lines, no shift; no generated file carries `<octave-shift>`).

---

## 9. notation.keys

**Marking.** Code in both pipelines.

**Input.** The raw walk's `<key>` (`<fifths>`, `<mode>`, `number` for a per-staff key, non-traditional keys without `<fifths>`).

**Library.** music21 `key.KeySignature` (`sharps`) as second witness; partitura note-array fields `ks_fifths`, `ks_mode`.

**Algorithm.** The first key: sharps (positive fifths) or flats (negative). A change: a `<key>` whose fifths differs from the one in force on that part and staff; its bar and offset. A per-staff key (`number` set) and a non-traditional key are flagged. `<mode>` is reported but never used: it is present in 1,179 of 1,211 generated files and 41 of 519 PDMX files (often the editor's default) [measured: analyze.py]; the key itself is `key.tonic-mode`'s question (area 1.B).

**Thresholds.** None.

**Validation.** Proving run: 2,020 of 2,020 agree [measured: proving run]. Key changes: PDMX 55 items, other 106, generated 0; per-staff and non-traditional keys: none in the catalogue [measured: analyze.py].

**Output.** `{first_fifths, changes: [{bar, offset, fifths}], per_staff, nontraditional}`, provenance `exact`; UNKNOWN for a non-traditional key's fifths.

**Examples.** Positives: `song.classical.beethoven-symphony-no-7-second-movement-piano-transcription.pdmx` (changes at `where` 101, 138 and 224), `exercise.scale.g-sharp-harmonic-minor.1oct.similar.both.2` (five sharps). Near-misses: `exercise.accompaniment.alberti.c-major.both` (no signature), `exercise.arpeggio7.b-flat-dominant7.2oct.both` (no signature by design: the family prints none).

---

## 10. key.signature-exercised

**Marking.** Code in both pipelines.

**Input.** The written step and alter of each sounding note (grace notes and tie continuations out), and the signature in force at it (`notation.keys`).

**Library.** music21 `KeySignature.alteredPitches` (checked: `[]` for A minor) or `accidentalByStep(step)` gives the altered letters; the same answer as the custom table (sharps in the order F C G D A E B, flats in reverse).

**Algorithm.** For each note whose letter the signature alters: *exercised* when its alter equals the signature's, *cancelled* when not (a natural or other accidental on that letter). Count per altered degree (F#, C#, B♭ ...), with bars. The app's `detect.ts` `keySignature` locates exactly the exercised notes; this rule keeps that and adds the cancelled count and the per-degree split.

**Thresholds.** None.

**Validation.** Proving run (key.signature): 2,020 of 2,020 agree [measured: proving run]. A printed signature never exercised: 69 generated items (arpeggios in minor keys: the D minor arpeggio D-F-A never plays the B♭), 4 PDMX, 1 other [measured: analyze.py].

**Output.** `{exercised: {degree: count}, total, cancelled, bars}`, provenance `exact`; `"no signature"` where fifths is 0.

**Examples.** Positives: `song.classical.chopin-ballade-no-4-in-f-minor-op-52.pdmx` (2,551 exercised notes), `exercise.accompaniment.alberti.d-minor.both`. Near-misses: `exercise.arpeggio.d-minor.2oct.both` (one flat printed, never played), `song.folk.the-itsy-bitsy-spider.pdmx` (signature present, never exercised).

---

## 11. pitch.chromatic

**Marking.** Generated code; PDMX code + agent (inherits `key.tonic-mode`).

**Input.** Sounding pitch classes (unpitched staves out); the key (tonic and mode) from `key.tonic-mode` (area 1.B), and until that rule exists the key helper of `tools/classifier/rules/harmony.py` (`infer_key`, documented in `docs/classifier/rules/harmony.md`, "The key").

**Algorithm.** Degree d = (pitch class − tonic) mod 12. Major: chromatic when d is not in {0, 2, 4, 5, 7, 9, 11}. Minor: d in {9, 11} (raised sixth and seventh) is counted as *minor-raised*, apart; chromatic when d is in neither the natural minor {0, 2, 3, 5, 7, 8, 10} nor {9, 11} (harmony.md's `diatonic`: "in minor the natural minor plus the raised sixth and seventh"). A mode other than major or minor (from `scale.collection`) uses that mode's collection. Counts per bar per hand; bars.

**Thresholds.** The scale sets, sourced through harmony.md (the minor key's own sixth and seventh, as in harmonic and melodic minor).

**Validation.** On PDMX the key helper resolves 490 of 519 items (26 UNKNOWN, 3 errors, S3); 134 are minor, and in 117 items the key-based count differs from the signature-only count, mostly by moving raised sixths and sevenths out of "chromatic": `song.classical.bach-aria-notebook-anna-magdalena-bach.pdmx` (D minor) has 18 notes outside the signature's scale, all raised sixths or sevenths, so 0 chromatic; `song.classical.albeniz-asturias.pdmx` (G minor) 186 by signature, 77 chromatic and 109 minor-raised here. On every sixth generated item (202), 183 resolve and 19 are UNKNOWN, the keyless arpeggio7 and broken7 items [measured: chrom_check.py].

**Output.** `{chromatic, minor_raised, per_bar, bars}`, provenance inherits the key's (`one-witness` or `inferred` with its confidence); `"no key"` for items whose family prints no key (rhythm, clave, 5/4, arpeggio7, broken7, chromatic); UNKNOWN when the key is UNKNOWN. Blues-form items in a major key count every blue note chromatic, as the list says.

**Residual to the agent (PDMX).** None of its own: the key, settled once per item by `key.tonic-mode`'s residual, and `key.minor-form`.

**Examples.** Positives: `song.classical.albeniz-asturias.pdmx`, `song.classical.chopin-ballade-no-4-in-f-minor-op-52.pdmx`. Near-misses: `song.classical.bach-aria-notebook-anna-magdalena-bach.pdmx` (only the minor key's raised notes), `exercise.accompaniment.alberti.c-major.both` (none); `exercise.arpeggio7.b-flat-dominant7.2oct.both` ("no key", not 0).

---

## 12. reading.accidental-kinds

**Marking.** Code in both pipelines.

**Input.** The raw walk: written step, alter, octave, staff, bar, ties and the `<accidental>` element with `cautionary`, `parentheses` and `editorial`; the signature in force. Grace notes included (they are printed).

**What the learner sees.** The app renders with OpenSheetMusicDisplay 2.1.2, whose accidental calculator (read in `app/node_modules/opensheetmusicdisplay/build/opensheetmusicdisplay.min.js`, `checkAccidental`) keeps a per-bar record of alterations keyed by staff position, prints an accidental wherever a note's alteration differs from the record, skips a tie's continuation, and also prints the file's own `<accidental>` where the record would not need one [reading of the minified source]. The rule models that, so it counts what the page shows rather than what the file lists.

**Algorithm.** The bar rule: "Accidentals apply to subsequent notes on the same staff position for the remainder of the measure where they occur ... Once a barline is passed, the effect of the accidental ends, except when a note affected by an accidental is tied to the same note across a barline" (Wikipedia, "Accidental (music)", https://en.wikipedia.org/wiki/Accidental_(music)). Per part, staff and bar, in time order, the state of each staff position (letter and octave) starts at the signature's alteration. For each note: a tie continuation shows nothing; otherwise if its alter differs from the state, a *required* accidental of its kind (sharp, flat, natural, double sharp, double flat) is shown and the state updated; if it equals the state but differs from the signature it is *carried* (within the bar; across a tie when a continuation); if it equals the state and the file has an `<accidental>`, a *courtesy* accidental is shown, *marked* when `cautionary`, `parentheses` or `editorial` is set. A required accidental the file omits is counted apart (it goes to `integrity.notation-sanity`).

**Thresholds.** None; the bar rule is sourced above.

**Validation.** Generated: 3,237 required, 1,213 courtesy (the file prints an accidental the bar rule does not need, in 203 items, for example the blues scales), 676 carried, no `cautionary` or `parentheses` attribute; 13 required accidentals missing from the file in 8 items. PDMX: 18,147 required, 2,128 courtesy in 222 items (91 marked, by `parentheses` on 112 notes; `cautionary` on none, as the list says), 7,319 carried within the bar, 750 across ties, 51 missing in 14 items. Double sharps or flats: 10 generated, 26 PDMX [measured: analyze.py].

**Output.** `{required: {kind: n}, courtesy, courtesy_marked, carried_bar, carried_tie, bars}` per staff; provenance `exact` for the file's facts, `one-witness` for "what is shown" (it rests on the OSMD reading).

**Examples.** Positives: `exercise.scale.g-sharp-harmonic-minor.1oct.similar.both.2` (double sharps), `song.classical.debussy-children-s-corner-the-little-shepherd.pdmx` (parenthesised courtesy accidentals). Near-misses: `song.classical.1818-franz-xaver-gruber-silent-night.pdmx` (no accidental shown), `exercise.blues-scale.a.1oct.right` (file accidentals the bar rule does not need: courtesy, not required).

---

## 13. reading.accidental-churn

**Marking.** Code in both pipelines.

**Input and algorithm.** The note sequence of `reading.accidental-kinds`. Per part, staff, bar and staff position, the alterations in time order (tie continuations out). A churn event is a note whose alteration differs from the previous one at that position and equals an alteration already used there earlier in the bar (F#, F♮, F#: one event at the third note). Count events and their bars. Operational (this list); no published definition was found.

**Thresholds.** None.

**Validation.** Generated: 12 items, all chromatic scales; PDMX 65 items, the most in `song.classical.chopin-ballade-no-4-in-f-minor-op-52.pdmx` (44) and `song.classical.chopin-nocturne-in-e-flat-major-op-9-no-2.pdmx` (29); other 101 [measured: analyze.py, examples.py].

**Output.** `{events, bars}`, provenance `exact`.

**Examples.** Positives: `exercise.chromatic.c.1oct.right` (up and down within a bar), `song.pop.muse-isolated-system.pdmx` (24). Near-misses: `exercise.blues-scale.a.1oct.right` (an accidental cancelled once, no return), `song.classical.1818-franz-xaver-gruber-silent-night.pdmx` (none).

---

## 14. reading.visual-density

**Marking.** Code in both pipelines (PDMX: what is printed, hidden objects excluded).

**Input.** The raw walk per staff per bar: noteheads (tie continuations included, they are printed; grace notes counted apart), onsets, simultaneous notes per onset, shown accidentals (`reading.accidental-kinds`), ledger notes (`pitch.ledger`); `print-object="no"` objects left out.

**Algorithm.** Per staff per bar: `notes`, `onsets`, `max_simultaneous`, `accidentals`, `ledger_notes`. Per item: the median and maximum of each over staff-bars, and onsets per quarter note over all staves (jSymbolic R-10, "Average number of note onsets per unit of time corresponding to an idealized quarter note", https://jmir.sourceforge.net/manuals/jSymbolic_manual/featureexplanations_files/featureexplanations.html; the list's DIFF `notesPerBar` and `ledgerRatio` are this project's earlier code, superseded by these counts).

**Thresholds.** None here; levels belong to the abilities' combinations.

**Validation.** Most notes on one staff in one bar, p10 / median / p90: generated 3 / 8 / 12, PDMX 5 / 9 / 19, other 6 / 15 / 33; onsets per quarter, p10 / median / p90: generated 0.5 / 1.9 / 3.9, PDMX 1.0 / 2.2 / 4.7, other 1.1 / 2.6 / 5.5 [measured: summ.py].

**Output.** The per-staff-bar table and the item summary, provenance `exact`.

**Examples.** Positives (dense): `song.classical.liszt-la-campanella`, `song.classical.chopin-ballade-no-4-in-f-minor-op-52.pdmx`. Near-misses (sparse): `exercise.five-finger.a-flat-major.right` (at most 4 notes in a bar, 0.75 onsets per quarter), `song.classical.1818-franz-xaver-gruber-silent-night.pdmx`.

---

## 15. reading.unusual-notation

**Marking.** Code in both pipelines.

**Input.** The raw walk.

**Algorithm.** A closed list, each counted with bars: **cue notes** (`<cue/>`); **cross-staff notes** (`prereq.hand-assignment` flag 1) and **cross-staff beams** (one beam group, beam number 1 from `begin` to `end`, grouped by part and voice, with notes on two staves); **nested tuplets** (a `<tuplet type="start">` while another is open in the same part and voice); **noteheads other than normal**, each by its `<notehead>` value (x, slash, diamond, none, triangle ...). music21 `note.Note.notehead` reads the same values. Clef changes, octave shifts and extended techniques have their own rows.

**Thresholds.** None.

**Validation.** Cue notes: 5 other items, 0 PDMX (the re-export keeps none). Cross-staff beams: 17 PDMX, 26 other. Nested tuplets: 9 PDMX (Brahms op. 118 no. 2, Chopin's Ballade no. 4, the Fantaisie-Impromptu ...), 4 other. Noteheads: PDMX slash 46 (2 items); other `none` 85, x 4; generated none of the list [measured: analyze.py]. The prototype grouped beams by staff; grouping by part and voice (as above) is needed, or a cross-staff beam is cut in two (seen in Chopin op. 10 no. 6, bar 8) [measured: probe3.py].

**Output.** `{cue, cross_staff_notes, cross_staff_beams, nested_tuplets, noteheads: {value: n}}`, provenance `exact`.

**Examples.** Positives: `song.classical.liszt-la-campanella` (cue notes), `song.classical.brahms-intermezzo-in-a-major-op-118-no-2.pdmx` (nested tuplets), `song.classical.albeniz-asturias.pdmx` (cross-staff beams). Near-misses: `song.blues.blues-riff-in-c.pdmx` (slash noteheads: counted here and read as rhythm by `notation.slash-rhythm`), `song.classical.bach-invention-no-1-in-c-major-bwv-772.pdmx` (none).

---

## 16. reading.pitch-entropy

**Marking.** Code in both pipelines (per staff, as printed).

**Input.** Per staff (unpitched staves out), the MIDI pitch of each struck note (sounding; grace notes and tie continuations out). Sounding rather than displayed: the statistic is about the keys played; an octave shift changes the page, not the pitch set.

**Library.** `scipy.stats.entropy(counts, base=2)` (checked to exist).

**Algorithm.** H = −Σ p(i) log₂ p(i) over the distinct pitches i of the staff, p(i) their share of the struck notes: RubricNet's "Pitch Entropy", "The entropy of pitches in the pitch events", computed for each hand's part separately (Ramoneda et al. 2024, https://arxiv.org/html/2408.00473, fetched 2026-10-08). A difficulty input, not a teaching target.

**Thresholds.** None.

**Validation.** Bits per staff, p10 / median / p90: generated 1.6 / 3.0 / 4.1, PDMX 2.6 / 3.6 / 4.4, other 2.7 / 4.2 / 4.9 [measured: summ.py]. Ends: generated `exercise.ostinato.a.fifths` 1.0 (two pitches); PDMX lowest `song.blues.blues-riff-in-c.pdmx` 1.19, highest `song.classical.debussy-claude-debussy-la-cathedrale-engloutie-the-submerged-cathedral.pdmx` 5.46 [measured: examples.py].

**Output.** `{per staff: bits, notes}`, provenance `exact`. UNKNOWN for a staff with fewer than two struck notes ("too few notes").

**Examples.** Positives (high): `song.classical.grieg-in-the-hall-of-the-mountain-king.pdmx` (5.42), the Debussy above. Near-misses (low): `exercise.ostinato.a.fifths`, `song.folk.petit-papa-noeil.pdmx` (1.66).

---

## 17. reading.redundancy

**Marking.** Code in both pipelines (per staff, as printed).

**Input.** Per staff, the sequence of pitch sets struck at each onset (the set of MIDI pitches struck together; tie continuations and grace notes out), each set a symbol.

**Algorithm.** Lempel-Ziv (LZ76) complexity c(n): the number of phrases in the Kaspar–Schuster parsing (F. Kaspar and H. G. Schuster, "Easily calculable measure for the complexity of spatiotemporal patterns", Physical Review A 36, 842, 1987, doi 10.1103/PhysRevA.36.842; cited from memory, not fetched), which is RubricNet's "Pitch Set LZ": "identify all subsequences of pitch sets that cannot be reproduced from preceding material through a recursive copying procedure. The number of such unique subsequences is defined as the LZ-complexity" (Ramoneda et al. 2024, as above). Custom code (about 25 lines), because the `lempel_ziv_complexity` package is not installed [measured: check_api.py] and it parses binary strings, not symbol sequences. Report c(n), n and c(n)/n (the raw count grows with length, so the share is what compares items of different lengths; RubricNet reports the count).

**Thresholds.** None.

**Validation.** c(n)/n per staff, p10 / median / p90: generated 0.29 / 0.77 / 1.0 (short exercises: n small), PDMX 0.18 / 0.31 / 0.50 [measured: summ.py]. Among PDMX staves of more than 50 onsets, the most repetitive is `song.pop.muse-isolated-system.pdmx` (0.013), the least `song.classical.czerny-the-art-of-preluding-op-300-no-10.pdmx` (0.54) [measured: examples.py].

**Output.** `{per staff: {lz, n, share}}`, provenance `exact`. UNKNOWN below 8 onsets on a staff ("too short to show repetition"; operational).

**Examples.** Positives (redundant): `song.pop.muse-isolated-system.pdmx`, `song.classical.einaudi-questa-notte.pdmx` (0.047). Near-misses (little repetition): `song.folk.go-tell-it-on-the-mountain.pdmx` (0.53), the Czerny above.

---

## 18. notation.turn-opportunity

**Marking.** Generated code; PDMX code + agent (inherits the hand).

**Input.** Per staff (the hand by S6): onsets, durations and rests; the tempo (the first metronome mark, `mark.tempo-text`; the catalogue's `tempoBpm` in the validation) and the beat unit.

**Algorithm.** Per staff, in time order: a **rest span** is a gap in which the staff sounds nothing (from the end of its last sounding note to its next onset); a **hold span** is a gap with no new onset while a note or tied chord still sounds. Each span: its bar and beat, its length in quarters and in seconds at the tempo, the hand. The longest stretch of the item with no span long enough on either hand is reported with its bars.

**Thresholds.** A span is long enough for a turn when it lasts at least 2 seconds at the printed tempo, or, with no tempo, at least one full bar. Neither sourced nor validated: Gould's *Behind Bars* is reported to advise turns where players rest ("bars of rest either side of a turn"), but that text was seen only in a search summary and gives no number. Measured to show what the threshold does: with the catalogue's tempo, the longest rest span on any staff is at least 2 s in 141 of 519 PDMX items and at least 1 s in 254 (median 0.94 s, p90 4.4 s); generated items almost never rest (3 items with a rest of a whole 4/4 bar, the `exercise.swing-pair.*` items) [measured: analyze2.py, summ.py]. To be settled in Phase 4 (characteristic checks) against the ability it serves (AB-229); hold spans are reported but not counted as turns until then (a held note still occupies the hand unless the pedal holds it).

**Output.** `{spans: [{staff, hand, bar, beat, quarters, seconds, kind}], longest_without_turn: {bars, seconds}}`, provenance `exact` (hand `inferred` in flagged bars). UNKNOWN for seconds when no tempo is printed (bars still reported).

**Residual to the agent (PDMX).** The hand, in bars `prereq.hand-assignment` flags; nothing else.

**Examples.** Positives: `song.classical.bach-little-prelude-in-c-major-bwv-924.pdmx`, `song.classical.beethoven-inno-alla-gioia.pdmx` (a staff rests a whole bar or more). Near-misses: `song.classical.bach-cello-suite-no-1-prelude-piano-transcription.pdmx`, `song.classical.away-in-a-manger.pdmx` (both staves sound throughout: no rest of a quarter) [measured: examples.py].

---

## 19. mark.fingering

**Marking.** Generated code; PDMX code + agent.

**Input.** The raw walk's `<fingering>` (text, `substitution`, `alternate`) per note; `<words>` and `<lyric>` texts.

**Library.** music21 `articulations.Fingering` (`fingerNumber`, `substitution`, `alternate`, checked on an instance) as second witness; partitura `score.Fingering`.

**Algorithm.** Per staff: fingered noteheads (struck notes with at least one `<fingering>`), their share of struck notes, and these kinds:
- **substitution**: `substitution="yes"`, or a text of two digits 1 to 5 joined by a hyphen, en dash, or the SMuFL substitution signs U+ED20 (fingeringSubstitutionAbove), U+ED21 (fingeringSubstitutionBelow), U+ED22 (fingeringSubstitutionDash) (SMuFL fingering table, http://smufl.formats.music/latest/tables/fingering.html, fetched 2026-10-08);
- **alternate**: `alternate="yes"`;
- **chord fingering**: digits stacked with line breaks in one `<fingering>` (one finger per chord note);
- **position fingering**: every fingered note opens a passage (the staff's first note or the first after a rest);
- **anomalous**: any other text (0, more than one digit without a separator, other symbols).
Digits typed as `<words>` or `<lyric>` on a note are listed apart as candidates.

**Thresholds.** None (the "finger on every note" share is `notation.reading-aids`').

**Validation.** Any fingering: generated 424, PDMX 110, other 39 items. `substitution="yes"` and `alternate="yes"`: none anywhere. Substitutions typed as text: 8 PDMX items (Chopin op. 10 no. 6 "5-4", "1-2"; Schumann op. 68 no. 19 with U+ED20; Bach Invention 1 with U+ED21); stacked chord fingering in 2 (`song.classical.oh-canada.pdmx` "1\n2\n4"); anomalous text in 7 (Kreutzer's Étude no. 2 "0" on 34 notes; "32" in Bach Invention 1); digits as words in 6 PDMX items (Mozart K. 2 easy edition, Debussy's Jimbo's Lullaby ...), as lyrics in none. Position-only fingering: 2 PDMX items (Rachmaninoff's Concerto no. 2 arrangement, Schubert D. 841 no. 1) [measured: analyze.py, analyze2.py, probe4.py].

**Output.** `{fingered, share, substitutions, alternates, chord_fingerings, position_only, anomalous, text_candidates, bars}` per staff, provenance `exact`.

**Residual to the agent (PDMX).** Each text candidate (is the digit a finger, and on which note), each anomalous fingering (a substitution written without a separator, a non-piano symbol). The agent receives the note, the text and its neighbours.

**Examples.** Positives: `exercise.hanon.01.right` (printed fingering), `song.classical.chopin-etude-in-e-flat-minor-op-10-no-6.pdmx` (substitutions as text). Near-misses: `song.classical.mozart-mozart-minuet-in-f-major-k2-easy.pdmx` (digits typed as words: candidates, not `<fingering>`), `song.classical.composer-rodolphe-kreutzer-etude-no-2.pdmx` ("0": anomalous).

---

## 20. notation.lyrics

**Marking.** Code in both pipelines.

**Input.** The raw walk's `<lyric>` (`number`, `<text>`, `<syllabic>`) per note, with its part and staff.

**Library.** music21 `note.Lyric` (`number`, `text`, `syllabic`) as second witness.

**Algorithm.** Per part and staff: syllables, verses (distinct `number` values), the staff that carries them. Each stream (part, staff, number) is classed: *counting* when at least 80% of its non-empty syllables are counting tokens (1 to 12, &, +, and, e, a, ta, ti, ti-ti, tri, ple, trip, let, po, tah, tee); *letter names* when at least 80% are a letter A to G with an optional sharp or flat, or a solfège syllable (do, re, mi, fa, sol, la, si, ti); *figures* when every syllable matches a figured-bass figure; otherwise *words*. Counting and letter streams go to `notation.reading-aids`, figure streams to `harmony.figured-bass`; this row reports words.

**Thresholds.** The 80% stream share: neither sourced nor validated on the catalogue, which holds no lyric at all.

**Validation.** No catalogue item carries a `<lyric>` element (0 of 2,020; 46 other items contain only `<lyric-font>` in their defaults), and neither do the held files (0 of 556 PDMX, 0 of 69 imported) [measured: probe2.py, lyr_held.py]. On music21's corpus: `leadSheet/berlinAlexandersRagtime.mxl`, one verse of 130 syllables on the melody staff; `leadSheet/fosterBrownHair.mxl`, two verses (91 and 81) [measured: corpus_check.py].

**Output.** `{per staff: {verses, syllables, kind}}`, provenance `exact`; absent is a valid answer.

**Examples.** Positives (outside the catalogue): music21 corpus `leadSheet/fosterBrownHair.mxl`, `leadSheet/berlinAlexandersRagtime.mxl`. Near-misses: `song.classical.1818-franz-xaver-gruber-silent-night.pdmx` (a song's melody without its words), music21 corpus `bach/bwv66.6.mxl` (a chorale in parts, no lyrics in this encoding). The catalogue has no positive; the rule's count classes are untested on real data.

---

## 21. notation.chord-symbols

**Marking.** Generated code; PDMX code + agent.

**Input.** The raw walk's `<harmony>` (root, `<kind>` with its `text`, `<bass>`, `<numeral>`, `<function>`, `print-object`, staff, offset) at its time; `<words>`.

**Library.** music21 reads `<harmony>` structurally (`MeasureParser.xmlToChordSymbol`, giving `harmony.ChordSymbol` and `harmony.NoChord` for kind "none"); its text parser is not used (it spells a flat "-" and rejects "Cm7/Bb", characteristics-list.md). partitura's `ChordSymbol` keeps the root and drops the kind (harmony.md), so it is not a witness for the kind.

**Algorithm.**
1. **De-duplicate by time**: symbols of one part with the same time, root, kind and bass are one symbol (the music21 re-export writes one per staff).
2. Count and place each symbol (bar, beat). **System**: letter-name symbols; **slash chords** (a bass other than the root); Roman numerals (`<numeral>`) or functions (`<function>`); **N.C.** (kind "none"), counted and placed apart.
3. **Over a melody or alone**: a symbol is over a melody when a struck note of its part (not a slash notehead) sounds at its time; else alone.
4. **Symbols written as text**: a `<words>` text of at most 10 characters that parses as a chord symbol (root A to G with optional sharp or flat, an optional quality m, maj, min, dim, aug, sus, M, °, ø, +, −, up to two digits, added or altered tones, an optional /bass) is a candidate. Nashville numbers and Roman numerals typed as words are candidates only when every word in a run of at least four such words parses (a lone digit is a fingering, a tempo or a study number far more often).

**Thresholds.** De-duplication, validated: 1,365 duplicates of 4,976 raw symbols in 30 PDMX items (the most: `song.jazz.vince-guaraldi-skating.pdmx`, 134 of 268), 96 in 2 other items, none of 1,520 in generated items [measured: analyze.py, examples.py]; the list's 33 files and 1,399 symbols are the same count over the 556 held files. Text candidates, validated: letter-name-like words fire in 5 PDMX and 4 other items, of which some are real symbols (`song.pop.coldplay-fix-you-coldplay.pdmx` "Gm/B", `song.classical.i-got-rythm.pdmx` "Bdim7/D", `song.classical.handel-halvorsen-passacaglia` "Am", "Dm") and some note-name reading aids (`song.classical.chopin-chopin-waltz-in-a-minor-piano-solo.pdmx`); lone-digit words fired in 9 PDMX and 10 other items and were all fingerings, tempo numbers or study numbers in the samples read, hence the run-of-four condition [measured: probe.py]. The run-of-four value is operational, not re-run.

**Validation.** Symbols present: generated 327 items, PDMX 95, other 38. N.C.: 7 PDMX; slash chords: 25 PDMX, 4 generated (the slash_bass family); Roman `<numeral>`: none; kind "other": 2 PDMX; items with at least one symbol alone: 20 generated (the montuno family), 26 PDMX [measured: analyze.py].

**Output.** `{symbols, duplicates_removed, no_chord, slash, numerals, over_melody, alone, text_candidates, timeline: [{bar, beat, root, kind, bass}]}`, provenance `exact` (`inferred` for text candidates).

**Residual to the agent (PDMX).** Text candidates (symbol or not; its time), kind "other" symbols (what chord), and N.C. extent where the notes continue. Whether a symbol is right for the notes is `harmony.*`'s (the chord residual), not this row's.

**Examples.** Positives: `song.classical.1818-franz-xaver-gruber-silent-night.pdmx` (symbols over a melody), `exercise.blues.twelve-bar-shuffle.c`, `exercise.slash-bass.c` (slash chords). Near-misses: `song.classical.czerny-the-school-of-velocity-op-299-no-10.pdmx` (every symbol written twice: duplicates), `song.classical.mozart-mozart-minuet-in-f-major-k2-easy.pdmx` (digit words: not Nashville numbers), `exercise.montuno.a.2note.son-3-2` (symbols over no melody: alone).

---

## 22. harmony.figured-bass

**Marking.** Generated code; PDMX code + agent.

**Input.** Raw `<figured-bass>` elements (music21's reader skips them: `'figured-bass': None` in its measure dispatch, the list); `<words>` and `<lyric>` on the lowest staff.

**Algorithm.** Count `<figured-bass>` elements and their figures (`<figure-number>`, `<prefix>`, `<suffix>`). Candidates: a lyric stream on the lowest staff in which every syllable matches a figure (an optional accidental, one or two digits, optionally stacked or slashed: 6, 6/4, 7, #6, 4 3), or `<words>` matching that pattern that are not a single digit 1 to 5.

**Thresholds.** The figure pattern; validated as a route that finds nothing real on the catalogue.

**Validation.** `<figured-bass>`: none in the catalogue (0 of 2,020), as expected for the re-export. Lyric figure streams: none (no lyrics). Words matching the pattern: 9 PDMX and 10 other items; every sample read was a tempo number, a study number or a bar number (Czerny op. 299 nos. 7 to 9: "7", "8", "9"; Beethoven's Für Elise "66", "60", "48") [measured: analyze.py, probe.py].

**Output.** `{figures, figure_kinds, candidates}`, provenance `exact` for `<figured-bass>`, `inferred` for candidates.

**Residual to the agent (PDMX).** Each candidate: is it a figure under the bass, and which. On the held files that is the whole row.

**Examples.** Positives: none in the catalogue or the held files (a gap in examples, not in the rule; a file exported by MuseScore with figured bass would be the first). Near-misses: `song.classical.czerny-the-school-of-velocity-op-299-no-7.pdmx` ("7": a study number), `song.classical.beethoven-fur-elise` ("66": not a figure).

---

## 23. mark.repeat

**Marking.** Generated code; PDMX code + agent.

**Input.** Raw `<barline><repeat direction times>`, `<ending number type>`, `<segno>`, `<coda>`, `<sound>` jump attributes, `<words>`.

**Library.** music21 `bar.Repeat`, `spanner.RepeatBracket`, `repeat.Segno`, `repeat.Coda`, `repeat.Fine`, `repeat.DaCapo`, `repeat.DalSegno`, `repeat.DaCapoAlFine`, `repeat.DaCapoAlCoda`, `repeat.DalSegnoAlFine`, `repeat.DalSegnoAlCoda` (all checked) and `repeat.Expander(part)` (`isExpandable()`, `process()`); partitura `score.unfold_part_maximal` as the second witness for the bars played.

**Algorithm.**
1. Structure, from the raw walk on the first part: repeat bar lines (forward, backward, `times`), endings (numbers, start, stop, discontinue), segno, coda, and jump words from a closed list matched at word boundaries: D.C., Da Capo, D.S., Dal Segno, al Fine, al Coda, To Coda, and Fine or Coda standing alone.
2. Bars played: music21 `Expander(part0).process()` when `isExpandable()`; partitura's unfolded measure count as the second witness. Agree: `two-witnesses`. Disagree, or an expansion more than four times the printed bars: UNKNOWN "repeat expansion disputed", with both counts.

**Thresholds.** The closed jump list (the standard Italian terms; MXL-segno, MXL-coda) and the four-times plausibility bound (operational, from the case below).

**Validation.** Files with any repeat structure: 211 PDMX, 120 other, 0 generated. music21 expands 186 of the 211 PDMX files and 104 of the 120 other; music21 and partitura agree on the bars played in 156 of 186 PDMX and 84 of 104 other. Of the 30 PDMX disagreements, 26 involve segno, coda or jump words; of the 4 without, `song.classical.haydn-sonata-in-g-major-hob-xvi-8.pdmx` expands to 956 bars from 97 in music21 (partitura 194), an over-expansion. music21 recognises a jump expression in 37 of the 42 PDMX files with jump words [measured: expand_check.py]. Repeat bar lines: 189 PDMX items; endings 52; segno 9; coda 6; jump words 42; `<sound>` jumps none [measured: analyze.py].

**Output.** `{repeat_barlines, endings, segno, coda, jumps: [{text, bar}], bars_printed, bars_played}`, provenance `exact` for the structure; bars played as above.

**Residual to the agent (PDMX).** Jump words outside the list, a jump whose target the words leave open, files music21 cannot expand (25 PDMX, for example `song.classical.ah-vous-dirais-je-maman.pdmx`), and disputed expansions. The agent receives the structure and both counts.

**Examples.** Positives: `song.classical.anonymous-romance-anonimo-romanza.pdmx` (repeats, endings, D.C. al Fine; both witnesses 64 bars from 33), `song.classical.nazareth-carioca-1913.pdmx` (segno and coda). Near-misses: `song.classical.haydn-sonata-in-g-major-hob-xvi-8.pdmx` (expansion disputed), `song.classical.beethoven-bagatelle-in-d-major-op-119-no-3.pdmx` (D.C. al Coda: the witnesses disagree, 115 against 97).

---

## 24. notation.reading-aids

**Marking.** Generated code (absent by the family list); PDMX code + agent.

**Input.** Raw `<notehead-text>`, `<notehead>` values and `color`, `<lyric>` streams (`notation.lyrics`' classes), `<words>` placed at note onsets, and `mark.fingering`'s share.

**Algorithm.** Each kind counted with bars:
1. **Letter names inside noteheads**: `<notehead-text>`.
2. **Letter or solfège names beside notes**: a lyric stream classed *letter names*; or `<words>` that are a letter A to G (optional sharp or flat) or a solfège syllable, at the time of a note of that letter on the same part and staff (do = C, re = D, mi = E, fa = F, sol = G, la = A, si or ti = B), when at least half the item's struck notes carry one.
3. **Counting**: a lyric stream classed *counting*, or counting tokens as words at note onsets on at least half the notes.
4. **A finger number on every note**: `mark.fingering` share at least 0.9.
5. **Shape or coloured noteheads**: `<notehead>` do, re, mi, fa, so, la, ti (shape notes), or a `color` other than black on noteheads.

**Thresholds.** Half the struck notes for rules 2 and 3, and 0.9 for rule 4: neither sourced; validated in part: `song.classical.chopin-chopin-waltz-in-a-minor-piano-solo.pdmx` carries 170 letter words, 168 of them on a note of that letter, over 173 struck notes (an aid on every note), while `song.beautiful.merry-christmas-mr-lawrence` carries 74 aligned letter words over 888 notes (8%: chord roots or cues, not an aid) and `song.pop.coldplay-fix-you-coldplay.pdmx` 46 of 59 aligned over 672 (chord symbols as text). Finger share at least 0.9: 364 generated items (the scale, arpeggio and Hanon families), 2 PDMX (`song.pop.c-c-greenwood-twinkle-twinkle-little-star-easy.pdmx`, `song.classical.mozart-theme-du-1er-mouvement-de-la-sonate-k-331.pdmx`), 20 other [measured: analyze.py, analyze2.py].

**Validation.** Notehead text, shape noteheads and counting: none in the catalogue. Coloured noteheads: 4 PDMX items (`song.classical.mendelssohn-song-without-words-op-30-no-1.pdmx`, `song.classical.scarlatti-d-scarlatti-sonata-a-major-k-323.pdmx`, `song.classical.simple-gifts-2-part-round.pdmx`, `song.pop.corcovado.pdmx`), whose purpose (an aid, or an editor's highlight) is not known [measured: summ.py].

**Output.** `{kind: {count, share, bars}}` per kind, provenance `exact` for rules 1, 4, 5 and `one-witness` for 2 and 3. Generated items: absent unless a family declares an aid (none does) and the file shows none; the fingering share is reported as rule 4.

**Residual to the agent (PDMX).** Lyrics and words that might be counting or names against real words or chord roots below the half-share; coloured noteheads (aid or highlight). Aids drawn as images are invisible to both (a gap within the row, as the list says).

**Examples.** Positives: `song.classical.chopin-chopin-waltz-in-a-minor-piano-solo.pdmx` (letter names on every note), `song.pop.c-c-greenwood-twinkle-twinkle-little-star-easy.pdmx` (a finger number on every note). Near-misses: `song.beautiful.merry-christmas-mr-lawrence` (letter words on 8% of notes), `song.folk.petit-papa-noeil.pdmx` (16 solfège words over 159 notes).

---

## 25. notation.slash-rhythm

**Marking.** Code in both pipelines.

**Input.** Raw `<notehead>slash</notehead>` with `<stem>`, and `<measure-style><slash use-stems>` / `<beat-repeat>`.

**Library.** music21 `note.Note.notehead == 'slash'` (checked) as second witness.

**Algorithm.** *Beat slashes*: slash noteheads with `<stem>none</stem>`, or `<measure-style><slash use-stems="no">` bars (play in time, rhythm free). *Rhythmic notation*: slash noteheads with stems, or `use-stems="yes"` (comp in this rhythm); the prescribed rhythm is the slashes' durations per bar. Count per kind with bars.

**Thresholds.** None.

**Validation.** Slash noteheads in 2 PDMX items (`song.blues.blues-riff-in-c.pdmx`, `song.folk.so-danco-samba.pdmx`), all stemless: beat slashes; no `<measure-style>` slash anywhere; none generated [measured: analyze.py].

**Output.** `{beat_slashes, rhythmic_slashes, bars, rhythm_per_bar}`, provenance `exact`.

**Examples.** Positives: `song.folk.so-danco-samba.pdmx`, `song.blues.blues-riff-in-c.pdmx`. Near-misses: `song.classical.1818-franz-xaver-gruber-silent-night.pdmx` (chord symbols over a melody, no slashes), `exercise.comping.a.charleston.intro` (a written comping rhythm with real noteheads, not slashes).

---

## 26. integrity.notation-sanity

**Marking.** Generated code; PDMX code + agent.

**Input.** score.load's note array with spelling and key signature; the raw walk's beams and time signatures; `reading.accidental-kinds`' missing accidentals.

**Library.** partitura `musicanalysis.estimate_spelling` (PS13); music21 `meter.TimeSignature(...).beamSequence` (an instance property; checked: 6/8 gives 3/8+3/8, 4/4 gives four quarter groups).

**Algorithm.** Three candidate kinds, each with its bar and staff.
1. **A required accidental the file omits** (from `reading.accidental-kinds`): definite; the file's `<accidental>` list contradicts its own pitches. The app's renderer computes accidentals itself (section 12, "What the learner sees"), so the page may still be right; other readers of the file (an export, another program) are not.
2. **Spelling**: a note whose written spelling differs from PS13's estimate *and* whose estimate is diatonic to the signature in force while the written spelling is not (A sharp written where B flat is wanted in F major). Not applied to items with no key signature whose spelling follows a chord root (the arpeggio7 and broken7 families): there the intended spelling is by interval from the recipe's root, and a deviation from it is the candidate (generated only).
3. **Beaming**: a beam group (beam number 1, grouped by part and voice) that crosses a beaming-unit boundary of its bar: 2/4, 3/4, 3/8 and 2/8: the whole bar; 4/4, 2/2, 3/2 and 4/8: the half bar (3/2: each half note); compound metres (6, 9 or 12 over 8, 16 or 4): the dotted beat, as music21's `beamSequence` (3/8+3/8 for 6/8). Pickup bars are right-aligned. Other metres (5/x, 7/x ...) are not checked here; their grouping is `metre.grouping`'s. A beam across a bar line is a candidate of its own.

**Thresholds.**
- Spelling filter: validated. PS13 alone differs from the written spelling on 3,605 of 58,832 generated notes in 145 items, every sampled case PS13's error (A♭ major arpeggios respelt in G♯); the filter leaves 218 notes in 24 generated items, all in keyless arpeggio7 and broken7 files (C♭ in A♭ minor 7, a correct spelling), which rule 2's exception removes; on PDMX it leaves 324 notes in 32 items (of 23,448 PS13 differences in 246), for example G♯ against A♭ in F minor in `song.classical.bach-invention-no-9-in-f-minor-bwv-780.pdmx` and in `song.classical.c418-minecraft-nether.pdmx`; other 2,301 in 93 [measured: spell_check.py, spell_check2.py]. Whether any PDMX candidate is wrong is the agent's.
- Beaming units: Gould's beaming conventions are the source this table follows; that text was not read, so the table is neither sourced nor quoted. Validated: no candidate in 15,469 generated beam groups; 62 candidates in 14 PDMX items of 45,741 groups and 269 in 27 other items; the two read were a cross-staff beam cut by grouping per staff (fixed by grouping per voice) and a Chopin fioritura run across the beat in 12/8 (`song.classical.chopin-nocturne-in-e-flat-major-op-9-no-2.pdmx` bar 29), which is the composer's beaming [measured: analyze2.py, probe3.py].

**Validation, missing accidentals.** Generated: 13 notes in 8 items, all blues-scale and tritone-sub items in flat keys: `exercise.blues-scale.b-flat.1oct.right` bar 2 plays E♮5 then E♭5 with no flat restored (a generator defect, found here); PDMX 51 notes in 14 items (`song.classical.albeniz-asturias.pdmx` 8) [measured: analyze.py, probe3.py].

**Output.** `{missing_accidentals, spelling_candidates, beaming_candidates}` each with `{bar, staff, written, estimate}`; provenance `exact` for kind 1, `one-witness` for kinds 2 and 3 (candidates, not verdicts).

**Residual to the agent (PDMX).** Each spelling and beaming candidate: an error, or a deliberate choice (an enharmonic for the voice-leading, a composer's beaming). Missing accidentals need no agent.

**Examples.** Positives (candidates): `exercise.blues-scale.b-flat.1oct.right` (missing flat), `song.classical.c418-minecraft-nether.pdmx` (30 spelling candidates). Near-misses: `exercise.arpeggio7.a-flat-minor7.2oct.both` (C♭ is right: PS13 differs, the rule does not flag), `song.classical.chopin-nocturne-in-e-flat-major-op-9-no-2.pdmx` bar 29 (a beaming candidate that is the composer's).

---

## Counts (by hand over the sections above)

- **Rules written:** 26 of 26. By the list's marking: 14 are code in both pipelines (`notation.staves`, `notation.clefs`, `notation.clef-change`, `pitch.ledger`, `notation.keys`, `key.signature-exercised`, `reading.accidental-kinds`, `reading.accidental-churn`, `reading.visual-density`, `reading.unusual-notation`, `reading.pitch-entropy`, `reading.redundancy`, `notation.lyrics`, `notation.slash-rhythm`); 12 are code on generated items and code + agent on PDMX, each with its residual named. Agent-only rows: none. Gap rows: none.
- **Thresholds**, each counted once (31):
  - sourced (7): the staff geometry for ledger lines (WP-Ledger_line, MXL-clef); the bar rule for accidentals (Wikipedia, "Accidental (music)", fetched); pitch entropy's formula (RubricNet, fetched); LZ76 (Kaspar and Schuster 1987, cited unfetched; RubricNet's description fetched); the minor key's scale sets (harmony.md); the SMuFL substitution signs (fetched); the General MIDI keyboard program ranges (not fetched).
  - validated on real scores (15): the exclusive octave-shift stop (81 of 93 files); the reach flag over 16 semitones (also sourced in part, the stride tenth); the anchored hand words; the hymn two-voice share; the hymn four-note share; the lead-sheet symbol density; the lead-sheet chord-onset share (both run, not reviewed item by item); the purpose words (as candidates only); the chord-symbol de-duplication; the text chord-symbol parse; the figured-bass pattern (validated as finding nothing real); the jump-word list; the letter and counting half share (on three items); the spelling filter; the beaming units (Gould cited, not read).
  - neither (9): the partial-accompaniment half (format UNKNOWN); the open-score chorale voice names (written after one failure, not re-run); the run of four for Nashville and Roman text; the four-times expansion bound; the turn span (2 seconds or one bar); the lyric stream 80% share; the finger-on-every-note 0.9 share; the 2-note floor for entropy; the 8-onset floor for redundancy.
- **Examples given:** 24 of 26 sections name at least two positives and two near-misses from the catalogue by id (110 ids named, every one checked present in the catalogue by `build/a1/verify_ids.py`, apart from the family patterns in prose). The two exceptions: `notation.lyrics` (positives only from music21's bundled corpus, because no catalogue or held file carries a lyric) and `harmony.figured-bass` (no positive in any held file).

## Not done

- Not argued against by a second agent; not judged by the orchestrator (FABLE.md section 2, item 3).
- The open-score chorale rule (section 1) and the per-voice beam grouping (sections 15 and 26) were written after a prototype failed and were not re-run.
- The lead-sheet thresholds were run, not reviewed item by item (63 PDMX items classified, 4 titles read).
- The turn threshold has no source and no validation against the ability it serves (AB-229): Phase 4.
- `notation.lyrics` and the reading aids' counting class have no real instance in the catalogue or the held files; their classes are untested.
- `harmony.figured-bass` has no real positive anywhere held.
- The OSMD accidental model (sections 12 and 26) rests on reading minified source, not on rendering a page.
- No PDMX spelling or beaming candidate, no flagged hand passage and no unclosed ottava was settled: those are the agent's (Phase 3 writes the instructions).
- `pitch.chromatic` depends on `key.tonic-mode` (area 1.B); it was validated with the existing key helper, which that row will replace.
- The generator defect found (missing flats in `exercise.blues-scale.{b-flat,e-flat,f}.1oct.*` and `exercise.tritone-sub.{b-flat,e-flat}`, 13 notes in 8 items) is reported, not fixed (no code changes in this phase).
- Nothing here has been heard.
