# Curriculum upgrade pass (2026-10-05)

The second pass the restart packet asked for. Pass one (`SYNTHESIS.md`) found what is wrong or missing in the fifteen tracks. This pass asks of each track: *given the external benchmark research and the track's intended endpoint, what should change so it becomes a stronger learning progression, not merely an internally consistent one?*

**Inputs.** The fifteen track records (their sections 2, 3, 6, 8 and 11), the research dossier's track sections and cross-track list, the packet's sections 5, 7 and 8, and my own re-reads at HEAD `a42c1a15`. The dossier's recommendations are treated as hypotheses; each is classified below after checking the current lesson sequence.

**Classes.** MUST (a missing bridge, a badly sequenced ability, a materially weak endpoint, or a skill without which the track is not educationally credible); SHOULD (substantially improves development or independence, not a prerequisite for the track to function); NICE (enrichment); ALREADY (adequately taught now, with the place); REJECT (does not belong here, duplicates another track, or is unsupported after checking).

**Design rules.** One owner per subskill; other tracks transfer it by a requirement line or a task, never by a copied lesson. New rungs only where a stage of development has no home; otherwise a lesson edit, a task inside an existing rung, a requirement, or a session behaviour. Generated content only where a sourced definition and an independent check exist. Real repertoire preferred to generated where it teaches the same thing. Nothing here is heard; every musical-quality judgement stays *unverified as music*.

**Evidence marks.** `[V]` re-read by me at HEAD; `[R]` the track record's cited evidence (file:line or notation read), not re-read by me; `[D]` the dossier's claim about an external source. Official ABRSM and RCM pages returned 403 to the reviewers; benchmark statements rest on the 2023-24 ABRSM PDF, course outlines (Berklee) and third-party transcriptions, named in each record's section 0.

**Needs vocabulary.** *text* = lesson edit, no code; *data* = stage JSON, catalog row or finder; *exercise* = an existing generated item placed on a rung; *generator* = a change to a generated family; *repertoire* = a real score or excerpt to admit after inspection; *search* = a content search still to run; *external* = an external recommendation the app states honestly; *code* = app behaviour.

---

## 0. Adjustments after the outside reviewer's read (2026-10-05, the owner)

1. **Decisions taken.** Hymns & gospel: narrow the name and promise to **Hymns & spirituals** now; gospel rungs 7-9 are not added (a later extension if the owner wants the domain). Rock & metal: **add rock.8 (transcribe and reduce from a recording) and rock.9 (personal full-song arrangement project)**. Jazz: **keep the soloing promise** and build the jazz-specific bridges (minor ii-V-i, chord-tone to approach-note soloing, the integrated capstone); general improvisation stays owned by improv. Section 2 is normalised to these decisions: the three jazz rows and rock.8 and rock.9 are plain MUST, the hymns rows stand, and the gospel rungs are a REJECT row.
2. **latin.8 is a firm learning need, not conditional on material.** The new PDMX review found a two-staff Piazzolla Libertango piano arrangement (`QmakqtZzLrMc3CqFnwiqjyxmhrThav2Hmu15E6Jrg9oap2`) with a repeated accented bass ostinato, articulation and sustained rhythmic texture; the exact excerpt is refined after the El gordo triste dump. Public export stays no (Piazzolla in copyright); personal-library and curriculum admission are decided separately, per the three-admissions rule.
3. **latin.4 is a firm learning need.** The habanera bass is taught directly as dotted eighth, sixteenth, eighth, eighth in 2/4, a distinct rhythmic cell, then compared with the tresillo (3+3+2); tango patterns derive from the habanera. The four old candidates failed as files; that is a sourcing failure, not evidence against teaching the habanera and tresillo. Bizet's Habanera and Contra Danza are being dumped next; the shipped Por Una Cabeza and The Crave excerpts serve until then.
4. **Dossier claims are leads, not authority.** The 24 MUST or SHOULD rows below (listed by `count_upgrade.py`) cite an external benchmark through the dossier (`[D]`). Before any of them drives a curriculum change, the primary source (Faber, ABRSM, RCM, Berklee or the named specialist text) is read and the claim confirmed or the row downgraded; that check is the first task of the batch brief, and its result is written into the row. The primary sources to read are Faber's level guides and the Berklee course pages, which are directly accessible, and the official ABRSM and RCM syllabus PDFs; "403, therefore a third-party transcription" is not acceptable where an official PDF exists.
   - Consumed 2026-10-05 from SOURCE-CHECK-parallel (section 0 item 4): the parallel source check read the Berklee Online jazz piano, blues and rock keyboard, latin piano styles and basic improvisation pages and three peer-reviewed practice and memory papers (as abstracts). Rows it confirms carry the line 'source-checked 2026-10-05 (parallel): confirmed, §n' beside their table and are no longer gated. **The sources support the propositions and do not dictate rung numbers, repetition counts, thresholds or generator parameters.** Left gated, by name: the ABRSM and RCM technical-list and reading rows (the sight-reading progression, the reading rows for key signatures and 3/4, minor-key four-octave scales and the like, the key before dictation, the jam lost-and-find row's ABRSM citation), the hymn-specific rows (accompanying a singer, the vamp between verses), the exact rock-pattern claims the broad Berklee sequence does not cover (the syncopated rock comping row), and the rows whose benchmark is Faber or an unread Berklee page (memory before 4.6, harmonic hearing by ear, texture and bass-line options, pop rhythmic comping, singing with scale degrees, the stock blues turnaround, shuffle versus straight, the stage 8-9 use-case ladder).
   - Consumed 2026-10-05 from SOURCE-CHECK-technique-hymns-rock (section 0 item 4): the reviewer read the ABRSM Grade 8 technical requirements, the RCM Level 10 technical tests, Berklee Online Blues and Rock Keyboard Techniques (OPIAN-220), Pop/Rock Keyboard and Gospel Music for Keyboard (OPIAN-410). Lifted, by row: the technique NICE row 'Minor-key four-octave scales, thirds and sixths in all keys, diminished sevenths' (technique#9; breadth only, still NICE), 'Intro and ending paragraph; the stock blues turnaround' (blues-boogie#3; category only), 'Accompanying a singer' (hymns-gospel#5; endpoint only), and in part 'Texture by melody density and register; bass-line options' (chords-pop#4; bass-line vocabulary only) and 'Pop rhythmic comping' (chords-pop#6; category only). Still gated: the ABRSM and RCM reading, rhythm and aural rows, shuffle versus straight (blues-boogie#6), the syncopated rock comping row (rock-metal#7), the vamp between verses, the dictation-key and scale-degree-singing rows. Sources support breadth and broad sequence, never grade equivalence, exam keys or tempos, or pattern offsets.

- core: Teach repeat signs, first and second endings, D.C., fermata, the natural sign, staccato, once, where pieces first print them
- core: Reading rows: key signatures and 3/4
- core: Transposition as a core task at 1.2 and 2.5/3.2
- core: Clap the pulse, clap an echo, two-or-three-time listening, labelled self-checked
- practice: A later unit: practising a whole piece (structure and joins, start anywhere, one no-stop run, record and listen, change strategy when repetition stops helping)
- chords-pop: Playing by ear from a recording: tonic, bass, progression, chord rhythm, melody (owner)
- chords-pop: Texture by melody density and register; bass-line options (root, root-fifth, the stepwise line; walking in blues/jazz)
- chords-pop: Pop rhythmic comping (eighth-note patterns, syncopated attacks)
- blues-boogie: Scaffold: right hand improvises while the learner's own left hand keeps the groove
- blues-boogie: Intro and ending paragraph; the stock blues turnaround named beside I-vi-ii-V
- blues-boogie: Shuffle versus straight versus 12/8 slow blues, said once
- jazz: Minor ii-V-i with shells, two or three keys, tied to theory.5/7 and 4.2
- jazz: Chord-tone then approach-note soloing step
- jazz: Solo-piano arranging technique (harmonised melody; drop-2 later)
- theory-ear: A key or tonic before melodic dictation and the tune drill
- theory-ear: Minor-key progressions and numerals by ear; keys other than C
- theory-ear: Singing with scale degrees (movable do) as a self-checked habit
- improv-compose: Transcribe two bars of a real tune, vary one element, use it
- hymns-gospel: Accompanying a singer: choose the key, count in, keep tempo, one hymn in a second key
- holiday: Vamp or turnaround between verses; recovery when singers skip or repeat; simplify on the fly (pointer)
- latin: A tresillo-and-habanera stage: the habanera bass taught directly as dotted eighth, sixteenth, eighth, eighth in 2/4, a distinct rhythmic cell, then compared with the tresillo (3+3+2); tango patterns derive from the habanera. The tresillo exercise (exists), a habanera bass drill from the sourced definition, Por Una Cabeza bars 1-14 and The Crave as the printed models, the habanera named in the lesson
- latin: Say which tradition each rung's material belongs to (Cuban, Brazilian, Argentine)
- rock-metal: Syncopated chord attacks and an off-beat rock comping pattern
- jam: Lost-and-find protocol on the existing lab: sit out two bars while the bed runs, re-enter at bar 5 or 9, then with the chart covered

5. **The "80 of 103 units" is recut by kind**, so that small edits are not built and tested as 80 independent seams. Counted by `count_upgrade.py` over section 2's 138 MUST and SHOULD rows, each assigned to exactly one kind by the first rule that matches (the rules are in the script's docstring; a batch brief may refine one row's kind, never its class):

| Kind | Rows |
| --- | --- |
| substantive new or restructured teaching | 8 |
| factual or text corrections | 26 |
| transfer or requirement-line additions | 7 |
| repertoire, data, generator or app-code changes | 39 |
| existing-rung lesson or task additions | 58 |
| total (MUST + SHOULD) | 138 |

Batches are grouped by kind and by content seam (a lesson file, a stage JSON, a generator family), never one seam per touched unit.

**Source check, reading rows (2026-10-05, `SOURCE-CHECK-reading.md`):** 9 rows checked (6 core, 3 theory-ear): 4 confirmed, 4 confirmed with a correction, written into the rows (notation marks, transposition, early aural tests, minor-key progressions), 1 still gated (its only source is a Berklee outline, outside that lane's list; a later lane reads it directly). The ABRSM syllabus read is the 2025-26 PDF; no Faber page names the dotted quarter, so its introduction level is not established. The dossier-dependent rows outside reading stay gated.

---

## 1. Cross-track ownership map

| Ability | Owner (where it is built) | Recurs as | Change needed |
| --- | --- | --- | --- |
| **Sight-reading progression** | core: 1.5, 2.2, 2.5, 3.4, 4.5, 4.6 plus Today's daily read `[V]` | the daily read in every session; drill rows attached to technique.5, theory.6/9, jazz.8, chords-pop.8 with one lesson sentence each | MUST: core reading rows add key signatures (G and F from 3.1, up to two sharps or flats by 4.2) and 3/4 (from 1.4); SHOULD: sixteenths read before 4.6's Canon in D. Progression parameters taken from ABRSM's sight-reading table as evidence `[D]`, not copied. *data* + *generator* (reading controls) |
| **Basic transposition fluency** | core (1.2, 2.5 or 3.2) | core 1.2 (five-finger tune a step up), 2.5 or 3.2 (I-IV-V7 and a known tune in a second key); holiday.3 already; hymns.5 (add); practice.5 (fix forward reference) | MUST: the two core tasks (*text*; the G-major five-finger options already exist on 1.1 and 1.3 `[R]`); SHOULD: hymns.5 task; REJECT for ragtime and latin (practice in several keys is not a transposition skill there) |
| **Chart and symbol transposition** | chords-pop (3, 4, 6, 8) `[R]` | blues.8, jazz.9 already; jam.7 (narrow) | none at the owner; jam.7's transposition by numerals gets a worked example or is narrowed (SHOULD, 2.15) |
| **Structural memory and arbitrary restart** | core 4.7 (sections as units, several starting points, hearing away from the piano) `[R]` | a standard requirement line on project rungs: classical.6+, ragtime.9, jazz.9, holiday.6, latin.7, blues.8/9, improv.9: "name the sections, start from three points, then Blind" | SHOULD: the requirement line (*data* `unjudged` rule + one sentence referring to 4.7); MUST where the blind tool opens a non-form piece (blues.8 on a 97-bar Pinetop: *data*) and at ragtime.9 (strain seams: *text*). No new lesson anywhere |
| **Score study before playing** | core 4.6 gets the one routine (key and metre, sections and repeats, hardest bars, recurring accompaniment, starting points); classical.6 deepens it (cadences, texture, edition) | referenced from classical.5/8/9, hymns.6, jam.7, ragtime.6, chords-pop.9, holiday.5 (each already has a one-line prompt `[R]`) | SHOULD: one paragraph at 4.6 and one at classical.6 (*text*); the others get a reference, not a copy |
| **Ear to voice and keyboard to notation** | theory-ear (play-back by MIDI, dictation, Simon) `[R]` | core 1.2/2.2 (clap the pulse, clap an echo, self-checked); jazz.6/8 dictation (exists); improv.9 take-down (exists); one "transcribe two bars of this shipped tune" task in blues, jazz, improv, latin, rock, using one shared task template | MUST: theory wording (what the app judges versus self-check), mode and numeral definitions, a key before dictation; SHOULD: minor-key progressions, descending intervals, bass-line dictation (*generator*); SHOULD: the shared transcription task (*text*, repertoire from the catalog) |
| **Performance preparation and recovery** | core 4.6 (keep going, drop a note and carry on, Perform) `[V]`; practice (cold start, record-and-listen: add) | the Perform paragraph on classical.9, holiday.6/7, ragtime.9, latin.7, hymns.6, jazz.9 gains two lines: restart from a named landmark after an error; one cold start | SHOULD: the practice additions and the two-line template (*text*); MUST: jam's ensemble recovery (its own owner, below) |
| **Learning by ear (repertoire from a recording)** | chords-pop.8/9: find the tonic, the bass, the progression, the chord rhythm, then the melody `[R]` absent today | jazz.9 (Stardust by ear exists), hymns.2 and holiday.2 (chord under a tune exists), theory.9 (eight bars by ear exists) | MUST: the chords-pop task as a self-checked routine on the learner's own song (*text*; the lab's free play exists); the drill the lesson now names trains melody playback only `[R]` |
| **Independent repertoire choice and problem-solving** | core 4.6 and practice (practice.6) | the finder on every rung | MUST: the finder corrections (*data*); SHOULD: practice.6, practising a whole piece (2.2) |
| **Domain arranging and reduction** | chords-pop.9 (pop), rock.8-9 (band to piano), classical.9 (project) | each capstone asks the learner to choose, defend an omission, and write down what was left out | MUST: rock's reduction task (rock.8); SHOULD: "choose what not to play" in chords-pop.9 |
| **Ensemble recovery (jam)** | jam.5/6: sit out two bars while the bed runs, re-enter at bar 5 or 9 by ear and counter `[R]` absent today | jam.7 endings on cue; later a lab setting that mutes bars and reads the re-entry bar | MUST: the prose protocol on the existing lab (*text*, no code); SHOULD: the muted-bars lab setting (*code*) |

---

## 2. Track by track

Each row: item; class; rung or lesson; evidence; needs.

### 2.1 core (26 units, 27 lessons)

Endpoint kept: Grade 1 fluency with reading, two hands, rhythm, chord symbols, keys, pedal, scales and arpeggios. The track is the spine; every gap here propagates.

| Item | Class | Where | Evidence | Needs |
| --- | --- | --- | --- | --- |
| Teach repeat signs, first and second endings, D.C., fermata, the natural sign, staccato, once, where pieces first print them | MUST | 3.1 (natural beside the accidental rule), 3.4 or 4.5 (the rest) | no lesson names them `[V]`; Petzold, Schumann Chorale, Für Elise easy, Bella Ciao, Canon print them `[R]`; ABRSM sight-reading parameters list staccato from the Initial grade and ties from Grade 2, and are silent on repeats, endings, D.C. and the natural sign [source-checked 2026-10-05, ABRSM 2025-26 syllabus p.16: corrected from the dossier's "from Grade 1"] | text + data (catalog concepts) |
| Eighth notes before 2.2 in first tunes | MUST | 0.3, 1.1, 1.2, 1.3 | Hot Cross Buns bar 3, Frère Jacques bars 5-6 `[V]` | text (one sentence) or repertoire (simplify the bars); content choice |
| Say something about key signatures at 2.3, 2.4, 2.5 | MUST | those lessons | options carry signatures a stage before 3.1 `[R]` | text |
| Reading rows: key signatures and 3/4 | MUST | core sight-reading rows | all six rows `fifths: 0`, no 3/4 `[R]`; ABRSM Grade 1 includes G, F, 3/4 `[D]` | data + generator (reading controls) |
| Transposition as a core task at 1.2 and 2.5/3.2 | MUST | 1.2, 2.5 or 3.2 | never a core task `[R]`; Faber introduces transposition at Level 1 (C to G five-finger), continues it in 2A and 2B, and transposes sight-reading exercises at Level 4; ABRSM and RCM do not require it [source-checked 2026-10-05, Faber level pages: corrected from "Level 4"] | text (options exist) |
| Clap the pulse, clap an echo, two-or-three-time listening, labelled self-checked | MUST | 1.2 or 2.2; 1.4 or 2.4 | absent in Stages 0-2 `[R]`; placement item 2 asks for a clap-back with no lesson `[R]`; the ABRSM clap-back echo is the Initial grade's test B, the Grade 1 echo is sung, and pulse plus two-or-three time is Grade 1 test A [source-checked 2026-10-05, ABRSM 2025-26 syllabus p.46: corrected] | text |
| Align 4.6's title with its gate; order 4.7 after 4.6 | MUST | 4.6, 4.7 | gate measures two Perform runs `[R]`; 4.7 has no prerequisite `[R]` | text + data |
| One threshold for the 4.7 blind gate | MUST | 4.7 | three values `[R]` | text |
| Score-study routine (owner) | SHOULD | 4.6 | single lines only `[R]`; dossier 2.5 | text |
| Sixteenth reading before Canon in D | SHOULD | 4.4 | 96 sixteenths at 4.6/4.7 `[R]` | text or data (pool) |
| Stage 0 wording (hips, fixed hand shape, no-sound key test, feet, pain rule) | MUST (correctness) | 0.1 | `[R]` | text |
| Memory before 4.6 | NICE | 4.3 | Faber expects a memorised item each unit `[D]`; 4.7 carries the method | text (one line) |
| Cadence awareness in core | REJECT | — | theory.4 owns cadences `[R]` | — |
| Style-track exercises on core rungs | SHOULD | several | section 6 of the record | data or text |
| Sight-reading as a strand | ALREADY | 1.3 to 4.6 plus the daily read `[R]` | — | — |
| Pedal, scales, arpeggios, inversions, compound time | ALREADY | 3.5, 4.1-4.5 (interpretation audit AGREE/REVISE) | — | — |

### 2.2 practice (1 unit, 5 lessons)

Endpoint upgraded: from five Stage-1 tips to a practice toolbox the learner meets again when pieces get long.

| Item | Class | Where | Evidence | Needs |
| --- | --- | --- | --- | --- |
| Hedge the interleaving law; add when blocked repetition is legitimate; acquisition versus retention | MUST | practice.3:26-28, practice.1 | `[V]` text; sources mixed `[R]` | text |
| Next-day cold start as a check | MUST | practice.3 or practice.5 | retrieval nowhere in the track `[R]`; 4.7 carries it `[R]` | text |
| Soften "never a page"; transposition how-to at practice.5 | SHOULD | practice.1, practice.5 | `[R]` | text |
| A later unit: practising a whole piece (structure and joins, start anywhere, one no-stop run, record and listen, change strategy when repetition stops helping) | SHOULD, accepted into the final plan as a firm new unit | new `practice.6` at Stage 4, prerequisite 4.6 | fragments exist at 4.6, 4.7, classical.9, improv.3 `[R]`; dossier TRACK 2; Chaffin and Imreh, Williamon `[D]` | new rung, text only, no code |
| Changing strategy after unchanged failure | ALREADY | practice.5:27-51, practice.1:33-35 `[R]` | dossier claim G refuted | — |
| Tension, pain, when to stop | ALREADY | practice.4 `[R]` | — | — |
| Ten new practice rungs | REJECT | — | the toolbox fits in edits plus one unit | — |

Consumed 2026-10-05 from SOURCE-CHECK-parallel (§Practice / memory and §Practice quality): source-checked 2026-10-05 (parallel): confirmed, §Practice / memory and §Practice quality, for the row 'A later unit: practising a whole piece' (new practice.6): structure as a retrieval scheme, retrieval cues, structural restart points, and raw minutes not being a quality measure (with the caution that 'longer segments' is never turned into a rule). Gate lifted on this row; no restart count or spacing interval comes from the sources.

### 2.3 technique (5 units)

Endpoint stated, not widened: major-key four-octave scales plus the physical vocabulary of Stages 4-8. Exam breadth (minor at four octaves, thirds and sixths in all keys, diminished sevenths) is NICE.

| Item | Class | Where | Evidence | Needs |
| --- | --- | --- | --- | --- |
| Contrary scales start at the unison | MUST | 16 of the 36 `exercise.scale.*.contrary.both.*` files (10 one-octave files start an octave apart, 6 two-octave files start crossed: C, D-flat, D, E-flat, E, F), technique.4:26-30 | `[V]` recounted with music21 on 2026-10-05; the technique record said twelve | generator (start parameter, identity kept) + text |
| Stop and tension condition on every rung | MUST | technique.4-7 | one rung of five `[R]` | text |
| Every listed exercise gets a sentence or leaves the rung (7/8, sixteenth syncopation, chromatic, tremolo, Hanon 11) | MUST | technique.4-7 | `[R]` | text or data |
| Transfer claims match the études | MUST | technique.5:58-60, technique.6:45-48 | `[R]` | text |
| Half-pedal window labelled as the scored range | MUST | technique.7:41-43, :61 | `[R]` | text |
| Physical topics each get demonstration, cue, self-check, stop, transfer | SHOULD | technique.4-8 | the record's table shows most lack a stop and several a cue `[R]` | text (videos cannot be read here; name what each must show) |
| Voicing cross-reference to classical.6; relaxation pointer to practice.4 | SHOULD | technique.6, technique.4 | `[R]` | text |
| Leap landing, repeated chords as general technique | NICE | — | taught in blues.7, ragtime.5 `[R]` | text (pointer) |
| Minor-key four-octave scales, thirds and sixths in all keys, diminished sevenths | NICE | technique.8 | RCM Level 10 and ABRSM Grade 8 lists `[D]`; not a bridge for Stage 4-9 repertoire | generator (existing families, new keys) |
| Rung requirement tied to the rung's promise | SHOULD | all five | any two exercises pass `[R]` | data (requirements) |
| Scales, arpeggios, rotation, octaves, half pedal | ALREADY | technique.4-7 `[R]` | — | — |

Consumed 2026-10-05 from SOURCE-CHECK-technique-hymns-rock (§Technique, ABRSM Piano Practical Grades 2025 and 2026 Grade 8; RCM Piano Syllabus 2022 Level 10): source-checked 2026-10-05 (technique-hymns-rock): confirmed with correction, for the NICE row 'Minor-key four-octave scales, thirds and sixths in all keys, diminished sevenths' (technique#9). Gate lifted on that row. Confirmed as breadth: four-octave major and harmonic and melodic minor scales, scales a sixth apart (ABRSM and RCM) and a third apart (RCM; a legato scale in thirds at ABRSM), contrary motion from the unison, chromatic and whole-tone material, four-octave major and minor arpeggios, dominant and diminished sevenths (ABRSM). Correction: both syllabi name key subsets for several patterns, so 'in all keys' in the row is not supported; exact keys and tempos are syllabus-specific and are never copied. The row stays NICE and is phrased as a PianoProject musical endpoint, not an exam-equivalence claim.

### 2.4 classical (7 units)

Endpoint kept: long-form project at Stage 9. Repertoire supply is strong; interpretive development is the upgrade.

| Item | Class | Where | Evidence | Needs |
| --- | --- | --- | --- | --- |
| Sonatina-form task matches the editions | MUST | classical.5:22-26 | Anh. 5 is A-B-A plus coda `[R]` | text |
| An étude among rung 8's options, or the success line reworded | MUST | classical.8, stage-8.json | none of six is an étude `[R]`; Czerny Op. 299 and Chopin Op. 25 in the Library `[R]` | data (repertoire already shipped) |
| Cross-reference the control stations (technique.4 articulation, technique.6 voicing, technique.7 half pedal and 2:3) | MUST | classical.4, 6, 8 | `[R]` | text |
| Performance preparation and recovery on the project rung | MUST | classical.9 | absent beyond naming Perform `[R]`; dossier 2.6 | text (uses the owner template) |
| Score-study routine deepened (cadences, texture, edition) | SHOULD | classical.6 | scattered prompts `[R]` | text |
| Phrase and cadence shaping carried past rung 3 | SHOULD | classical.6 | only rung 3 `[R]` | text |
| Romantic and Impressionist pedal colour, half pedal | SHOULD | classical.8 | Clair de lune 236 pedal elements, lesson silent `[R]` | text (reference technique.7) |
| Structural memorisation requirement | SHOULD | classical.6-9 | Blind used; no landmark naming `[R]` | data (requirement line) |
| Speed recipe as "one method"; rubato "this kind"; counting in cross-rhythm as stage one; K.331 metre note | MUST (correctness) | classical.8, 6, 3 | `[R]` | text |
| Edition awareness and the turn | NICE | classical.9, 5 | `[R]` | text |
| Fugue | REJECT (amend D1) | — | no licensed WTC fugue in the catalog `[R]` | docs |
| Ornament signs in rung 4-5 scores | NICE | — | drills exist on technique.5/6 `[R]` | — |
| Dances, sonatina, miniatures, counterpoint, late rags | ALREADY | classical.3-9 (interpretation audit AGREE) | — | — |

### 2.5 chords-pop (7 units)

Endpoint kept: play from symbols, accompany, transpose, arrange. The upgrade is the by-ear route and the arranging decisions.

| Item | Class | Where | Evidence | Needs |
| --- | --- | --- | --- | --- |
| Finders agree with the lessons | MUST | stage-9.json:326, :332; stage-8.json:496; stage-7 "chord symbols printed" | `[V]` | data |
| Name the two starts of chords-pop.9 (finished arrangement to reverse-engineer; bare chart to arrange) | MUST | chords-pop.9 | `[R]` | text |
| Playing by ear from a recording: tonic, bass, progression, chord rhythm, melody (owner) | MUST | chords-pop.8 or 9 | absent; the named drill trains melody playback `[R]`; Berklee and RCM include harmonic hearing `[D]` | text (self-checked on the learner's own song; lab free play exists) |
| Texture by melody density and register; bass-line options (root, root-fifth, the stepwise line; walking in blues/jazz) | SHOULD | chords-pop.9 (and .5) | asked of the learner, never taught `[R]`; Berklee keyboard method `[D]` | text |
| Intros and endings beyond one sentence; countermelody; build and release | SHOULD | chords-pop.9 | `[R]`; D2 stage 9 promised them | text |
| Pop rhythmic comping (eighth-note patterns, syncopated attacks) | SHOULD | chords-pop.5 or 7 | absent; only a jazz swing study on .9 `[R]`; Berklee pop/rock `[D]` | text + exercise (generated comping family exists; a straight-eighths variant is a generator change) |
| Loop exercise on .4 or its mastery line moved | SHOULD | chords-pop.4 | `[R]` | data |
| Declare core 4.3 and theory.7 as prerequisites | SHOULD | chords-pop.4, .8 | `[R]` | data |
| Wording: "walking" at .4, "shapes" at .8, "lives on sevenths" at .5, "sounds like jazz" at .7 | MUST (correctness) | those lines | `[R]` | text |
| Slash chords as inversion versus added bass | SHOULD | chords-pop.4/6 | one descending line only `[R]` | text |
| Reconcile D2 to the lessons | SHOULD | docs/02 D2 | `[R]` | docs |
| A pop-rhythm and bass-line rung | REJECT (unless the owner asks) | — | the track stays coherent without it `[R]` | — |
| Voice leading, slash bass, sevenths, transposition in four keys, loop in twelve keys | ALREADY | .3, .4, .5, .6, .8 `[R]` | — | — |

Consumed 2026-10-05 from SOURCE-CHECK-technique-hymns-rock (§Rock / blues keyboard progression: OPIAN-220, Pop/Rock Keyboard): source-checked 2026-10-05 (technique-hymns-rock): confirmed. 'Pop rhythmic comping' (chords-pop#6): gate lifted for the category (comping, including modern-rock and New Orleans comping, is a foundational taught job); the eighth-note and syncopated pattern content is not supplied (G4 stays source-blocked on printed offsets). 'Texture by melody density and register; bass-line options' (chords-pop#4): partly lifted for bass-line vocabulary (shuffle, walking and boogie bass) and arpeggiated, voice-led parts; the texture-by-density half and the root, root-fifth and stepwise options stay gated. The sources do not authorise any one pattern merely because a course teaches the style.

Consumed 2026-10-05 from FAMILIAR-SONG-VERDICT: three familiar-song candidates are now carried in the ability map, none admitted: *Stand By Me* (C-major voice-plus-piano edition, `Qmf7ENREU9UngoF2LgRY1ZT9hAGDnCVBBYq8k3NeJUWBNt`) as a familiar accompaniment-transfer candidate after the chord-symbol rungs (map block A5.1); *Your Song* easy piano and *Someone Like You* easy piano (later, optional) in map block A10.2. State CANDIDATE, intake gate not yet run, personal-library admission possible, curriculum admission by a later brief; no row of this table changes.

### 2.6 blues-boogie (7 units)

Endpoint kept: a learner's own chorus over their own left hand. The upgrade is the ramp to it.

| Item | Class | Where | Evidence | Needs |
| --- | --- | --- | --- | --- |
| Scaffold: right hand improvises while the learner's own left hand keeps the groove | MUST | blues.7 or 8 | no improvisation task between blues.5 and blues.9 `[V]`; the lab and duet supply the app's bass `[R]`; Berklee weeks 8-10 `[D]` | text (a graded task: boogie LH, blue-note fragments over bars 1-4, then the form) + code if the lab has no bass-off setting (not checked) |
| 12 Bar Blues re-roled, not replaced | MUST | audit record, catalog role | `[V]` | data |
| Intro and ending paragraph; the stock blues turnaround named beside I-vi-ii-V | MUST | blues.5 or 7 | absent `[R]`; Berklee "intros, turnarounds, endings" `[D]` | text (+ generator for a I-IV-I-V variant: SHOULD) |
| Minor blues and the quick IV on a rung | MUST | blues.6, blues.4 | generated minor-blues exercises exist, placed nowhere `[R]`; St. Louis Blues bar 2 shows the quick IV `[R]` | exercise + text |
| Wording set (blues.7, .4, .6, .8 title, .9) | MUST (correctness) | listed in SYNTHESIS A13 | `[R]` | text |
| Shuffle versus straight versus 12/8 slow blues, said once | SHOULD | blues.4 or 6 | only framed as a mistake `[R]`; Berklee `[D]` | text |
| One historical lick to transcribe and transform | SHOULD | blues.9 | the only ear drill is a random diatonic tune `[R]` | search (a licensed two-bar lick) + text |
| Rhythmic phrasing variety as a task | SHOULD | blues.5/9 | pitch-class feedback only `[R]` | text |
| Form landmarks as retrieval cues; Blind on a twelve-bar form at blues.8 | SHOULD | blues.8 | blind opens a 97-bar piece `[R]` | data + text |
| Prerequisites: blues.4 on blues.3 and 4.5; blues.8 on theory.6 | SHOULD | stage JSON | `[R]` | data |
| A twelve-bar chorus in the Stage 8-9 repertoire | SHOULD | blues.8/9 | none of the five pieces is one `[R]` | search (dossier CIDs: Joe Turner, Jelly Roll, Farewell, New Orleans Blues; Carolina Shout's dump copy is empty) |
| New Orleans style, gospel-blues, tritone substitutions at blues.7 | NICE | — | D3 promised; lessons scoped them out `[R]` | docs |
| Blue notes, form and shuffle, walking bass construction, boogie patterns, stride, twelve keys as a task | ALREADY | blues.3-8 (interpretation audit) | — | — |

Consumed 2026-10-05 from SOURCE-CHECK-technique-hymns-rock (§Rock / blues keyboard progression, Berklee Online Blues and Rock Keyboard Techniques, OPIAN-220): source-checked 2026-10-05 (technique-hymns-rock): confirmed, for 'Intro and ending paragraph; the stock blues turnaround named beside I-vi-ii-V' (blues-boogie#3): intros, turnarounds and endings are taught as blues phrasing and vocabulary after bass lines, shuffle bass and comping. Gate lifted on that row for the category only. Not supplied: the turnaround formula and any intro or ending convention (still local). 'Shuffle versus straight versus 12/8 slow blues' (blues-boogie#6) stays gated: the course names shuffle bass and does not establish the distinction. No pattern from the course is authorised merely because it teaches the style.

Consumed 2026-10-05 from SOURCE-CHECK-parallel (§Blues / rock): source-checked 2026-10-05 (parallel): confirmed, §Blues / rock, for the row 'Scaffold: right hand improvises while the learner's own left hand keeps the groove': accompaniment, time feel and phrasing come before deeper vocabulary and improvisation. Gate lifted on that row. Left gated: 'Intro and ending paragraph; the stock blues turnaround' (the blues page does not establish the turnaround formula or a blues intro and ending convention) and 'Shuffle versus straight versus 12/8 slow blues' (the page names shuffles but does not establish the distinction).

### 2.7 jazz (7 units)

Endpoint: the soloing promise is kept (decided in section 0); general improvisation stays owned by improv.

| Item | Class | Where | Evidence | Needs |
| --- | --- | --- | --- | --- |
| Minor ii-V-i with shells, two or three keys, tied to theory.5/7 and 4.2 | MUST | jazz.6 (new section) | absent from every jazz lesson `[V]`; Berklee week 8 `[D]`; shipped Fly Me to the Moon carries it `[R]` | text + generator (minor form of `drill.jazz.ii-v-i-shells`, sourced definition: iiø7 V7 i) |
| Chord-tone then approach-note soloing step | MUST | jazz.8 (new section) or improv.6 as prerequisite of jazz.9 | no jazz lesson teaches improvising `[V]`; guide tones exist at improv.6 `[R]`; Berklee weeks 9-10, ABRSM Jazz Piano improvisation from Grade 1 `[D]` | text + data (prerequisite); no new generator (improv.6 exercises reused) |
| jazz.9 rewritten as one standard through learn and memorise, comp, walk or two-feel, solo, intro and ending, solo-piano pass | MUST | jazz.9 | four accompaniment passes `[R]`; dossier TRACK 7 | text (intros and endings by reference to chords-pop.9) |
| Say which jazz.9 options carry a chart and how to get the others' harmony | MUST | jazz.9 | three of six have no symbols `[R]` | text |
| Walking approach note either side; stride sentence; C13 wording; "exactly as well" | MUST (correctness) | jazz.6, 7, 8 | `[R]` | text |
| Lesson-to-drill mismatches (rootless on jazz.6, chord-scale on jazz.7, modes and sight-reading on jazz.8) | SHOULD | stage JSON or text | `[R]` | data or text |
| Learning and memorising a standard as a process (form, landmarks, several starts) | SHOULD | jazz.9 | drill rehearses it on a generated tune `[R]` | text (owner template from core 4.7) |
| Solo-piano arranging technique (harmonised melody; drop-2 later) | SHOULD | jazz.9 | one sentence `[R]`; Berklee weeks 11-12 `[D]` | text (harmonised melody); generator for a drop-2 drill is NICE |
| Bossa in a jazz context | SHOULD (owner: latin) | latin.5 teaches the pattern; jazz.8 references it | no jazz or latin lesson teaches a bossa pattern `[R]` | see latin |
| Historical listening and transcription | NICE | jazz.9 | no actor here hears; the shared transcription task covers it | text |
| Swing feel, triad comping, shells and ii-V-I, walking, rootless, tritone, extensions | ALREADY | jazz.3-8 (interpretation audit REVISE/AGREE) | — | — |

Consumed 2026-10-05 from SOURCE-CHECK-parallel (§Jazz and §Improvisation): source-checked 2026-10-05 (parallel): confirmed, §Jazz, for 'Minor ii-V-i with shells' (minor ii-V-i after basic comping and walking-bass work), and source-checked 2026-10-05 (parallel): confirmed, §Jazz and §Improvisation, for 'Chord-tone then approach-note soloing step' (the ABRSM Jazz Piano citation in that row was not read and stays gated for that citation) and, §Jazz, for 'Solo-piano arranging technique' (harmonising the melody, then arranging; drop-2 is NICE and is not required). Gates lifted on the three rows. Not supplied: voicings, key lists, counts and rung numbers.

### 2.8 ragtime (5 units)

Endpoint kept: a whole rag from memory. The upgrade is the bridge in, built from shipped and inspected material, with no new unit.

| Item | Class | Where | Evidence | Needs |
| --- | --- | --- | --- | --- |
| The oom-pah bridge on ragtime.5: generated control (the oom-pah exercises) → left-hand or duet excerpt: the Tyers edition of Harlem Rag, teaching window bars 5-16, where the bass-chord alternation is explicit and the surrounding material is more chromatic and ornamented → later a full two-hand rag | MUST | ragtime.5 | the first leap-bearing options are 85-148-bar works at 6.8+ `[V]` (ladder); Harlem Rag strain A verified by the reviewer `[R]`; Turpin 1897, public domain; the Tyers edition's CID is to be confirmed from the reviewer's dump: on origin only the De Lisle arrangement exists (`QmaUQo93TVPNaJ6UDzttTyksRcPDcyafR8Nxct8qXHeEsj`, on `origin/claude/xml-dump-2` and `origin/claude/candidate-packet`) | repertoire (excerpt cut, bars 5-16, from the Tyers edition) + exercise (oom-pah controls) |
| Existing control exercises placed where the lessons need them (`exercise.oompah.c/f.octave` on 5, `.tenth` on 6, `exercise.stride.c` on 7, `exercise.secondary-rag.c.4bar` on 8) | MUST | stage JSON | stride is on stage 7 (blues) and stage 9 only; oompah and secondary-rag on stage 9 only `[V]` | exercise (data) |
| School of Ragtime re-staged as the syncopation-over-steady-chords model and described as what it is | MUST | ragtime.5 and .6 | notation `[R]` | data + text |
| Lesson facts: "Not fast", 2/4 counting, Bethena keys, "single most characteristic", "no other cause" | MUST (correctness) | ragtime.5, 6, 7 | `[V]` lesson lines; dumps `[R]` | text |
| Whistling Rufus whole as a build-your-own-oom-pah application; Creole Belles bars 1-16 optional after its key signature is checked | SHOULD | ragtime.5 | `[R]` | repertoire |
| Strain-seam step in the memory method | SHOULD | ragtime.9 | `[R]` | text |
| A figure-specific rhythm control (16th-8th-16th) | SHOULD | ragtime.5 | no generic rhythm row writes it `[R]` | generator (small) |
| Stop-time: one passage or "awareness only" | SHOULD | ragtime.8 | named "not optional", no station `[R]` | search or text |
| A `ragtime.4` unit | REJECT (extend ragtime.5 instead) | — | the rung-5 lesson already holds the method `[R]` | — |
| Georgia Campmeeting file | REJECT | — | a transposing horn part `[R]` | — |
| Strain form, trio key change, flat-key reading, late rags, memory project | ALREADY | ragtime.6-9 `[R]` | — | — |

### 2.9 theory-ear (7 units)

Endpoint kept: hear and take down an eight-bar tune with its chords, and apply harmony to repertoire. The upgrade is production and application.

| Item | Class | Where | Evidence | Needs |
| --- | --- | --- | --- | --- |
| Fix the modulation dictation row | MUST | catalog.static.json | `[V]` | data |
| Say what the drill judges and what is self-checked (singing, naming, writing) | MUST | theory.3, 4, 5, 9 "How you'll know" | "identified at 80 %" over play-back drills `[R]` | text |
| Define Lydian, Phrygian, Locrian, the degree sign, V/ii before the drills that use them | MUST | theory.6, 7 | `[R]` | text |
| One real-piece application per rung (find the cadence in a hymn, I-vi-IV-V in a pop song, a V/V in a standard), self-checked | MUST | theory.3-9 | every rung has zero songs `[V]`; genre plan lists catalog pieces `[R]` | text + data (songOptions after confirming ids at HEAD) |
| Form names at theory.9 (ABA, AABA, 32-bar) | MUST | theory.9 | finder asks for them, lesson names none `[R]` | text |
| A key or tonic before melodic dictation and the tune drill | SHOULD | drill params | random pitches with no key `[R]`; RCM names the key `[D]` | generator |
| Minor-key progressions and numerals by ear; keys other than C | SHOULD | ear rows | all major, all C `[R]`; RCM progressions are major only at Level 5 and minor (i-iv-i, i-V-i) first appears at Level 6 [source-checked 2026-10-05, RCM 2022 syllabus: corrected] | generator |
| Descending and harmonic intervals; the tritone named | SHOULD | theory.3 drill and text | ascending only `[R]` | generator + text |
| Existing rhythm rows (eighths, dotted, six-eight) on theory.4/5 | SHOULD | stage JSON | rhythm dictation once, quarters and halves `[R]` | exercise (data) |
| Bass-line and function dictation; melody plus bass | SHOULD | theory.6/8 | `[R]`; dossier 2.4 | generator |
| "Inversions by ear" relabelled | MUST (correctness) | theory.4 | it is a slash-chord reading drill `[R]` | text |
| Singing with scale degrees (movable do) as a self-checked habit | SHOULD | theory.3, 5 | absent `[R]`; Berklee ear training `[D]` | text |
| Figured bass, species counterpoint, chromatic harmony as theory rungs | REJECT (reconcile D6) | — | enrichment; other tracks or none `[R]` | docs |
| Intervals, key signatures, cadences, sevenths, modes, numerals, secondary dominants, pivot modulation | ALREADY | theory.3-8 `[R]` (all checked correct) | — | — |

### 2.10 improv-compose (7 units)

Endpoint kept: a finished written piece. The upgrade makes composition recursive.

| Item | Class | Where | Evidence | Needs |
| --- | --- | --- | --- | --- |
| Harmonise your own eight bars | MUST | improv.5 or 6 | absent `[V]` (only reharmonising at improv.8); dossier | text (lab typed progression exists) |
| How to write it down, honestly, and consistent advice on recording | MUST | improv.5 and 9 | required with no method; contradictory lines `[R]` | text; notation entry is a scoped-out product feature |
| `unjudged` rules on improv.6-9 so the rung is not passed on exercise runs alone | MUST | stage JSON | `[V]` | data |
| Lab preset key lock and the ii-V-i numeral mismatch on improv.6; the "four answers recorded" requirement text | MUST (correctness) | improv.6, stage-4.json | `[R]` | data + text |
| Fourths "has no name"; black-key pentatonic "over anything"; one blues scale "that single fact"; "works everywhere", "any chord" | MUST (correctness) | improv.7, 4, 5, 8 | `[V]` for the first; `[R]` | text |
| A composition step between eight bars and a piece: a 16-bar binary or ABA miniature, written and harmonised | SHOULD | improv.7 | eight bars once, then a two-minute piece `[R]` | text |
| Motif development as a written task, not only improvised | SHOULD | improv.6 or 7 | `[R]` | text |
| Transcribe two bars of a real tune, vary one element, use it | SHOULD | improv.4 or 5 | absent `[R]`; Berklee `[D]` | text (shared template; repertoire from the catalog) |
| Models of composition in real music before writing | SHOULD | improv.5, 9 | no song options `[V]` | repertoire (genre plan lists candidates; confirm ids) |
| Revise after listening on improv.6-9 | SHOULD | those lessons | only improv.5 `[R]` | text |
| Chromatic approach notes; minor blues; supplied-motif improvisation | NICE | improv.6/7 | `[R]` | text |
| Call and answer, pentatonic, blues scale, guide tones, colour, reharmonising, ABA | ALREADY | improv.3-9 `[R]` | — | — |

Consumed 2026-10-05 from SOURCE-CHECK-parallel (§Improvisation): source-checked 2026-10-05 (parallel): confirmed, §Improvisation, for 'Transcribe two bars of a real tune, vary one element, use it': transcription and motivic development with variation are legitimate foundational improvisation work. Gate lifted on that row; the sources do not require Berklee's order or chromatic vocabulary at this stage.

### 2.11 hymns-gospel (5 units)

Endpoint: narrowed to Hymns & spirituals (decided in section 0); gospel rungs 7-9 are not added.

| Item | Class | Where | Evidence | Needs |
| --- | --- | --- | --- | --- |
| Jesus Loves Me "four parts" corrected | MUST | hymns.md:43-45 | `[V]` | text |
| The hymns.2 Joyful edition: label it, replace it, or drop it | MUST | hymns.2 | lowered third `[V]` | text or repertoire |
| Chord-count and "nearly everywhere" claims softened | MUST (correctness) | hymns.2, hymns.md, hymns.5 | `[R]` | text |
| Walk-up, passing-chord and plagal drills named on the Stage 3 unit | MUST | stage-3.json | drills two stages after first use `[R]` | exercise (data) |
| Accompanying a singer: choose the key, count in, keep tempo, one hymn in a second key | MUST | hymns.5 | absent `[R]`; the narrowed promise still says accompany `[D]` | text (reuses holiday.3 and chords-pop.8) |
| Build one arrangement yourself from a lead sheet | SHOULD | hymns.6 exit | reading only `[R]` | text |
| Rename to "Hymns & spirituals" with the description proposed in the record | MUST | 00-tracks.json, stage-3 unit title | `[R]` | data |
| Gospel rungs 7-9 | REJECT | — | not added now; a later extension if the owner wants the domain | — |
| Passing-chord definition acknowledges the dominant-chain usage | SHOULD | hymns.md, hymns.5 | sources differ `[R]` | text |
| Four-part reading, walk-ups, passing chords, arrangement reading | ALREADY | hymns.4-6 (interpretation audit AGREE) | — | — |

Consumed 2026-10-05 from SOURCE-CHECK-technique-hymns-rock (§Hymns / gospel, Berklee Online Gospel Music for Keyboard, OPIAN-410): source-checked 2026-10-05 (technique-hymns-rock): confirmed with a sequencing boundary, for 'Accompanying a singer: choose the key, count in, keep tempo, one hymn in a second key' (hymns-gospel#5). Gate lifted on that row for one proposition: accompanying a singer by ear is part of hymn and gospel keyboard competence beyond melody plus block chords. The course is advanced (prerequisites: scales, chords, jazz piano, blues or rock keyboard), so nothing from it loads the beginner hymn rungs, and the key, count-in, tempo and second-key tasks stay local choices. Later rows for traditional cadences, reharmonisation, call-and-response and ear-led accompaniment would have direct source support, but none is in this table; 'Gospel rungs 7-9' stays REJECT by the owner's narrowing (section 0), a later extension if the owner reopens it. The vamp between verses (holiday.3) is not covered and stays gated.

### 2.12 holiday (6 units)

Endpoint kept and stated honestly; use-case ladder; no Stages 8-9.

| Item | Class | Where | Evidence | Needs |
| --- | --- | --- | --- | --- |
| O Christmas Tree bar 32 chord symbol | MUST | song.pop.misc-christmas-o-christmas-tree.pdmx | `[V]` | repertoire (edition fix after reading the source) |
| "33 of 40 bars", Auld Lang Syne texture, "above the staff", range stated as a limit, pulse rule for a group only | MUST (correctness) | holiday.5, holiday.3 | `[R]` | text |
| Vamp or turnaround between verses; recovery when singers skip or repeat; simplify on the fly (pointer) | SHOULD | holiday.3 | absent `[R]`; accompanist sources `[D]` | text + exercise (attach `exercise.intro.*.4bar` or reword) |
| Choosing key and range as a practised task | SHOULD | holiday.3 | principle only `[R]` | text |
| Description widened to Stages 5-7 | SHOULD | 00-tracks.json | `[R]` | data |
| Hanukkah pieces: remove from D8 or add to the Library | SHOULD | docs/02, catalog | promised, not shipped `[R]` | docs or search |
| Medley design | NICE | — | finders avoid medleys `[R]` | — |
| Stages 8-9 | REJECT | — | use-case ladder `[D]` | — |
| Carols, playing for a room, arranging devices, carol as piano piece, concert carols, winter shelf | ALREADY | holiday.2-7 `[R]` | — | — |

### 2.13 latin (4 units)

Endpoint kept and the name's breadth stated: clave, tresillo and habanera, tumbao and montuno, printed tango left hands, showpieces; Brazilian styles as context. The lesson sequence must teach the distinctions, and the habanera needs its own stage.

| Item | Class | Where | Evidence | Needs |
| --- | --- | --- | --- | --- |
| A tresillo-and-habanera stage: the habanera bass taught directly as dotted eighth, sixteenth, eighth, eighth in 2/4, a distinct rhythmic cell, then compared with the tresillo (3+3+2); tango patterns derive from the habanera. The tresillo exercise (exists), a habanera bass drill from the sourced definition, Por Una Cabeza bars 1-14 and The Crave as the printed models, the habanera named in the lesson | MUST | new `latin.4` at Stage 4 | the habanera is printed in two shipped scores and named in none `[R]`; the learning need stands after the candidates failed; Wikipedia Tresillo and Habanera `[D]` | new rung + generator (small: one bass pattern, independent check by onset positions) + repertoire (excerpts of shipped scores) |
| Rumba and bossa clave defined where the exercises are | MUST | latin.3 | exercises listed, defined nowhere `[R]` | text |
| Say which tradition each rung's material belongs to (Cuban, Brazilian, Argentine) | MUST | latin.5, latin.6 | `[R]`; dossier and Berklee separate them `[D]` | text |
| Comp the tunes: apply the tumbao and montuno figures to the lead sheets' symbols (Insensatez, Só Danço Samba, Guantanamera) | MUST | latin.5 | no comping or application station `[R]` | text |
| "Neither is on the beat"; "arpeggiated"; Malagueña description | MUST (correctness) | latin.md, latin.7 | `[R]` | text |
| A bossa accompaniment pattern (the Brazilian half of the track; also serves jazz.8) | SHOULD | latin.5 | none in any lesson `[R]` | generator (sourced bossa LH pattern) + text |
| An arpeggiated guajeo as the second montuno step | SHOULD | latin.5 or 6 | drill is clave rhythm as chords `[R]` | generator |
| A listening or transcription example per rung (shared template) | SHOULD | latin.3-7 | none `[R]` | text |
| Modern tango: tango nuevo through ostinato, accent, articulation and texture, with the two-staff Piazzolla Libertango piano arrangement `QmakqtZzLrMc3CqFnwiqjyxmhrThav2Hmu15E6Jrg9oap2` as real transfer and project material (repeated accented bass ostinato, articulation, sustained rhythmic drive, changing upper harmony); excerpt choice refined after the El gordo triste dump | MUST | new `latin.8` at Stage 8 | both staged candidates rejected `[V]`; public export no (Piazzolla in copyright); personal-library and curriculum admission are separate decisions | repertoire + text; a generated control only if a sourced pattern is defined later |
| Generic exercises able to satisfy the latin.5 requirement | SHOULD | stage-5.json | six generic options `[R]` | data |
| `startsAtStage` 5 while latin.3 exists | SHOULD | 00-tracks.json | `[R]` | data |
| Clave, tumbao, montuno drills, tango accompaniment, showpieces | ALREADY | latin.3, 5, 6, 7 (interpretation audit) | — | — |

Consumed 2026-10-05 from SOURCE-CHECK-parallel (§Latin): source-checked 2026-10-05 (parallel): confirmed, §Latin, for 'A tresillo-and-habanera stage' (tango patterns derived from the habanera are a distinct category) and for 'Say which tradition each rung's material belongs to' (guajeo, montuno and tumbao, bossa and samba, and tango and habanera are distinct categories and are not one generic Latin accompaniment). Gates lifted on both rows. The Wikipedia citation in the first row and the printed-habanera primary check (the Bizet dump) are unchanged by this.

### 2.14 rock-metal (5 units)

Endpoint: extended with rock.8 and rock.9 (decided in section 0).

| Item | Class | Where | Evidence | Needs |
| --- | --- | --- | --- | --- |
| Texture count and description match the lessons | MUST | 00-tracks.json, rock.overview | five versus four `[R]` | data + text |
| Wording: distorted guitar "cannot"; Rachmaninoff and Moonlight III claims; figure's hand; "eight bars"; Annie's Song's real demonstration | MUST (correctness) | rock.4, 5, 7 | `[R]` | text |
| One reduction task with independence: reduce eight bars of a score the learner supplies to melody, bass and one texture, and write what was left out | MUST | `rock.8` | reduction taught once at Stage 3, unjudged `[V]` for the 0-song rungs; `[R]` | text (self-checked); the learner supplies the source |
| Register and density get a control; rock.7's required run becomes an excerpt | SHOULD | rock.7 | drills only volume; required pieces at 6.96-8.4 `[R]` | data + text |
| Greensleeves refit stated (3/4, A minor against 4/4 exercises) | SHOULD | rock.4 | `[R]` | text |
| Sus-chord framings reconciled across chords-pop.5/7 and rock.5 | SHOULD | rock.5 | `[R]` | text |
| Syncopated chord attacks and an off-beat rock comping pattern | SHOULD | rock.4 or 5 | absent; power-chord drill on beats 1 and 3 only `[R]`; Berklee `[D]` | generator (small) |
| `rock.8` transcribe and reduce 8-16 bars from a recording (bass, riff, melody, rhythmic engine; decide what survives) | MUST | new unit | dossier TRACK 14; no rock-idiom piano score in the catalog, four archive files rejected `[R]` | new rung, text; learner-supplied material; uses theory.9 |
| `rock.9` personal arrangement project (section map, textures by section, build and drop, memory, a recording) | MUST | new unit | dossier | new rung, text; chords-pop.9 and classical.9 methods by reference |
| Half-time and 6/8 feel, click and recording, low doublings promised by D8 | SHOULD | rock.6 | absent `[R]` | text |
| Odd metre | NICE | — | no repertoire needs it `[R]` | — |
| Reduction rule, power chord and ostinato, open voicings, arpeggio over pedal, build | ALREADY | rock.3-7 `[R]` | — | — |

Consumed 2026-10-05 from SOURCE-CHECK-technique-hymns-rock (§Rock / blues keyboard progression, OPIAN-220 and Pop/Rock Keyboard): source-checked 2026-10-05 (technique-hymns-rock): confirmed for the broad sequence only (accompaniment, time and harmonic vocabulary before fuller stylistic improvisation, then independent keyboard-part choices; country material by musical job, not as a separate track). 'Syncopated chord attacks and an off-beat rock comping pattern' (rock-metal#7) stays gated: the category (modern-rock comping) is named, the pattern and its offsets are not, so G16 stays source-blocked and no onset contract follows from the check.

### 2.15 jam (4 units)

Endpoint kept and sharpened: can function with another musician.

| Item | Class | Where | Evidence | Needs |
| --- | --- | --- | --- | --- |
| Lost-and-find protocol on the existing lab: sit out two bars while the bed runs, re-enter at bar 5 or 9, then with the chart covered | MUST | jam.5 | absent `[V]`; dossier recovery drill; ABRSM jazz piano solo section with a rhythm section that does not stop `[D]` | text, no code |
| Ending together: find the printed cues (Storyville bars 53-56, Riverside bar 36) and end on them; the tag sentence corrected | MUST | jam.7 | one wrong line, no task `[V]` | text |
| Lab verdict sentence removed or explained for the walking bass | MUST (correctness) | jam.6:44-48 | `[V]` | text |
| Count-in made unambiguous and practised at three tempos | MUST | jam.md | six beats for "two bars" `[R]` | text |
| Transposition by numerals: worked example on eight bars, or narrowed | SHOULD | jam.7 | no teaching, no tool `[R]` | text |
| A muted-bars lab setting that reads the re-entry bar | SHOULD | lab | mechanism half exists `[R]` | code |
| A real tune to comp behind and walk under at jam.5/6 | SHOULD | jam.5, 6 | zero songs `[V]`; genre plan lists catalog pieces `[R]` | repertoire (confirm ids) |
| Listening while playing, leaving space, role switching as tasks | SHOULD | jam.5, 7 | sentences only `[R]` | text |
| Bed drums wording; "1920" | MUST (correctness) | jam.5, jam.md, jam.7 | `[R]` | text |
| Trading eights; a `jam.8` | NICE | — | `[R]` | — |
| Form tracker, comping figures, walking bass construction, trading fours, charts with cues | ALREADY | jam.4-7 (interpretation audit GREEN) | — | — |

---

## 3. Final proposed curriculum shape

Unchanged unless marked. **(changed)** = lesson text, data or options change; **(new)** = a new unit.

- **core**: 0.1 (changed: posture), 0.2, 0.3, 0.4, 1.1 (changed: eighths sentence or edition), 1.2 (changed: eighths; transposition task; clap task), 1.3 (changed: LH edition), 1.4 (changed: two-or-three-time listening), 1.5, 2.1, 2.2 (changed: echo task), 2.3 (changed: key-signature sentence), 2.4 (changed), 2.5 (changed: key-signature sentence; transposition task), 3.1 (changed: natural sign), 3.2 (changed: I-IV-V7 in a second key), 3.3, 3.4 (changed: repeat, endings, fermata, staccato), 3.5, 3.6, 4.1, 4.2, 4.3, 4.4 (changed: sixteenth reading line), 4.5, 4.6 (changed: score-study routine; gate aligned), 4.7 (changed: one threshold; prerequisite 4.6). Reading rows: key signatures and 3/4 (generator).
- **practice**: 1 (changed), 2, 3 (changed), 4, 5 (changed); **practice.6 (new, Stage 4)** practising a whole piece.
- **technique**: 4 (changed), 5 (changed), 6 (changed), 7 (changed), 8 (changed: scope sentence). Sixteen contrary files regenerated.
- **classical**: 3 (changed: K.331 note), 4 (changed: cross-reference), 5 (changed: form task), 6 (changed: score study, phrase and cadence, rubato wording), 7, 8 (changed: étude option, pedal colour, speed recipe, cross-reference), 9 (changed: performance and recovery, memory requirement).
- **chords-pop**: 3, 4 (changed: wording; loop exercise; prerequisite), 5 (changed: wording; comping paragraph), 6, 7 (changed: finder), 8 (changed: finder; by-ear routine; wording; prerequisite), 9 (changed: finder; two starts; texture and bass decisions; intros and endings).
- **blues-boogie**: 3, 4 (changed: quick IV; wording; prerequisites), 5 (changed: turnaround named; intro and ending), 6 (changed: minor-blues exercises; wording), 7 (changed: wording; LH-groove scaffold), 8 (changed: title; wording; blind on a form; prerequisite), 9 (changed: wording; lick task).
- **jazz** (promise kept): 3, 4, 5, 6 (changed: minor ii-V-i section; approach-note wording; rootless exercise moved), 7 (changed: stride and "exactly" wording; chord-scale pointer), 8 (changed: soloing step; C13 wording; mode and reading pointers), 9 (changed: rewritten capstone).
- **ragtime**: 5 (changed: Harlem Rag excerpt, Whistling Rufus, School of Ragtime, oom-pah exercises, lesson facts), 6 (changed: oom-pah tenth; School of Ragtime description; "no other cause"), 7 (changed: stride exercise; Bethena; "most characteristic"), 8 (changed: secondary-rag exercise; stop-time decision), 9 (changed: strain seams).
- **theory-ear**: 3 (changed: self-check wording; interval drill), 4 (changed: wording; inversions label; rhythm rows), 5 (changed: wording; rhythm rows), 6 (changed: definitions; application piece), 7 (changed: definitions; application), 8 (changed: modulation row; application), 9 (changed: form names; application). Every rung gains one application piece.
- **improv-compose**: 3, 4 (changed: wording; transcription task), 5 (changed: harmonise; write-down; wording), 6 (changed: lab mismatch; unjudged rule; motif task), 7 (changed: fourths wording; 16-bar miniature; unjudged), 8 (changed: wording; unjudged), 9 (changed: write-down; revise after listening; unjudged).
- **hymns-gospel** (renamed Hymns & spirituals): 2 (changed: Joyful edition; chord-count wording), 3 (changed: Jesus Loves Me; drills named), 4, 5 (changed: singer and key task; "any chord" wording), 6 (changed: arrange exit). Track renamed **Hymns & spirituals** (00-tracks.json, stage-3 unit title); no rungs 7-9.
- **holiday**: 2, 3 (changed: range and pulse wording; vamp, skip recovery; intro exercise), 4, 5 (changed: numbers), 6, 7. O Christmas Tree edition fixed.
- **latin**: 3 (changed: rumba and bossa clave defined), **4 (new, Stage 4)** tresillo and habanera, 5 (changed: traditions named; comp the tunes; bossa pattern; wording), 6 (changed: habanera named; traditions), 7 (changed: Malagueña wording), **8 (new, Stage 8)** modern tango (tango nuevo; the Libertango arrangement).
- **rock-metal**: overview (changed: count), 4 (changed: wording; refit), 5 (changed: wording; sus framing), 6 (changed: half-time and 6/8 feel; click and recording; low doublings), 7 (changed: wording; register control; excerpt run), **8 (new)** transcribe and reduce from a recording, with the reduction task, **9 (new)** personal arrangement project.
- **jam**: 4 (changed: count-in; wording), 5 (changed: lost-and-find protocol; a tune; listening task), 6 (changed: verdict sentence; a tune), 7 (changed: endings; tag; transposition example).

---

## 4. Counts

Counted by `count_upgrade.py` (beside this file) over sections 2 and 3, not estimated; rerun it after any edit to either section.

| Measure | Count |
| --- | --- |
| Current denominator | 103 units |
| Existing units changed (any lesson, data or option change) | 80 of 103 carry a "(changed" marker in section 3 (the rock overview's marker is not on a unit and is not counted) |
| New units | 5: practice.6, latin.4, latin.8, rock.8, rock.9; hymns 7-9 not added |
| Proposed final denominator | 108 units |
| Recommendation rows in section 2 | 175: MUST 74, SHOULD 64, NICE 11, REJECT 9, ALREADY 17 |
| Rows needing lesson text | 108 |
| Rows needing data (stage JSON, catalog row, finder, requirement) | 31 |
| Rows needing a generator change | 16 (on MUST rows: contrary start; reading-row signatures and 3/4; minor ii-V-i shells; habanera bass drill; the blues I-IV-I-V turnaround variant, marked SHOULD inside its row) |
| Rows needing real repertoire or an edition fix | 11 |
| Rows needing an existing exercise placed | 7 |
| Rows needing a content search | 4 |
| Rows needing an external recommendation | 0 |
| Rows needing docs reconciled | 5 |
| Rows needing app code | 2 (jam muted-bars lab setting; blues lab bass-off if absent) |

A row can need more than one kind, so the needs sum to more than 175. Rung-count discipline: the dossier names about fifty abilities; this pass puts five of them in five firm new units (practice.6, latin.4, latin.8, rock.8, rock.9), and everything else inside existing rungs as tasks, requirements or sentences.

---

## 5. Owner decisions (decided in section 0; kept for the record of what each path would have changed)

1. **Hymns & gospel.** Decided: narrowed and renamed Hymns & spirituals; the singer-and-key task and the arrange exit land; gospel rungs 7-9 not added; 0 new rungs.
2. **Rock & metal.** Decided: extended with rock.8 (transcribe and reduce from a recording, with the reduction task) and rock.9 (personal full-song arrangement project); 2 new rungs.
3. **Jazz.** Decided: the soloing promise is kept; the minor ii-V-i section, the soloing step and the rewritten jazz.9 are MUST; 0 new rungs.

---

## 6. Sequence from here

1. This document reviewed (the outside reviewer; the owner's three decisions are recorded in section 0).
2. The content-hole review already begun on the candidate branches feeds section 2's *search* and *repertoire* rows; nothing else waits on it.
3. Consolidate: SYNTHESIS section H's batches are re-cut against this document: batch 1 the corrections (unchanged), batch 2 the MUST rows that need text, data and existing exercises, batch 3 the MUST rows that need a generator change or repertoire, then SHOULD rows by track. Each batch is one brief with its finish condition and its evidence lines; `content-mistakes.md` is checked before any push.
4. Implement, verify by what each seam touches, review.
5. Then the representative learner journey.
