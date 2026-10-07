# Curriculum Repertoire Audit Control

Purpose: persistent state for the PianoProject curriculum score audit so the chat does not need to retain the queue, rubric, or prior decisions.

## Authorities

- Repository: `Rilay9/PianoProject`
- Readable learner-facing score branch/commit: `claude/readable-scores` / `c1556d70`
- Readable-score manifest:
  `docs/prompts/runs/readable-scores/MANIFEST.md`
- Readable score path pattern:
  `docs/prompts/runs/readable-scores/<song-id>.musicxml`
- Optional machine summary:
  `docs/prompts/runs/readable-scores/<song-id>.dump.txt`
- Earlier rung-level Fable review index:
  `docs/prompts/runs/research-for-fable/READABLE-SCORES-REVIEW-INDEX.md`
  at commit `596c0c4f5da58ea7946a4bfb5fe968d76f9234eb`
- Detailed audit ledger produced in this chat:
  `Curriculum Repertoire Verification.md`

The MusicXML is the authority for musical judgements. The dump and catalog are navigation/evidence aids only.

## Review order

1. Review exactly **5 unique scores per batch**.
2. Walk the curriculum **backward from the final rung**.
3. Within a rung, walk its `songOptions` backward.
4. If a score appears on more than one rung, inspect the score once, but judge **every curriculum placement**.
5. Do not count a duplicate placement as another reviewed score.
6. When a rung has fewer than five remaining unique scores, continue backward into the preceding rung to complete the batch.
7. After every batch, update this file's cursor and completed ledger.

## What to judge for every score

### A. File / edition truth
- Is the readable MusicXML the exact learner-facing score?
- Is it actually piano material?
- Correct part/staff structure?
- Empty, malformed, corrupt, bizarre reduction, misleading instrument metadata, or wrong arrangement?
- Is the edition itself sensible for the learner-facing use?
- Do not substitute a different edition merely because it is the same composition.

### B. Actual musical burden
Read the notation, not the title or tags:
- pitch range and hand span
- clefs / ledger lines / position changes
- key signature, chromaticism, accidentals
- meter and rhythmic vocabulary
- tempo and tempo changes
- texture, voicing, chords, accompaniment
- hand independence / leaps / repeated notes / ornaments
- articulation, dynamics, pedal
- density, length, repeats and form

Judge the **interaction** of those demands rather than adding tags mechanically.

### C. Placement / pedagogical role
Ask what the learner is actually meant to do on this rung.

Distinguish:
- **INTRO / PRIMARY** — unusually controlled first encounter
- **PRACTICE** — reinforces the target with modest variation
- **TRANSFER** — authentic music with established extra demands
- **STRETCH** — worthwhile but intentionally harder
- **PROJECT / INTEGRATION** — several established skills combined
- **EXCERPT** — only a musically coherent passage fits
- **LEAD-SHEET / TASK SUBSTRATE** — learner creates accompaniment, improvises, transposes, arranges, etc.

A score containing a concept does not automatically teach or certify it.

### D. Curriculum-context checks
- Compare against everything already taught before that placement.
- Flag surprise demands that are genuinely premature.
- A later-stage/project piece is allowed to be complex.
- A simple score may still be wrong if it does not perform the job the lesson assigns it.
- If the learner action is the target (arrange, improvise, transpose, memorise, trade fours), verify the **workflow/substrate**, not whether the static score contains the future learner action.
- If the score itself is supposed to contain something (power chord, Alberti bass, walking bass, shell voicing, montuno, pedal mark, dominant 9, etc.), require visible score evidence.
- Genre/title/metadata are weak evidence. What the pianist actually plays is decisive.
- Automated detectors are evidence, not authority.

### E. Comparative judgement
Do not ask only “is this acceptable?”
- Is another existing option clearly better as the primary?
- Is this better moved to transfer/stretch/project?
- Are several options redundant versions of the same musical experience?
- Would one authentic excerpt do the job better than the whole work?

## Verdict vocabulary

- **KEEP** — current score and role are sound.
- **KEEP / RECLASSIFY** — good score; role should change.
- **MOVE** — useful, wrong current placement.
- **STRETCH** — useful but should be explicitly harder/later.
- **EXCERPT** — retain a coherent passage rather than whole piece for this job.
- **REPLACE FILE** — composition/role may be right, edition/file is wrong.
- **REJECT** — not useful for the curriculum score role.
- **DUPLICATE** — redundant edition/placement without distinct pedagogical value.
- **NEEDS EXACT-EDITION CHECK** — source/parallel edition was inspected but learner-facing readable score still needs direct verification.

Borderline calls should say why they are borderline.

## Earlier direct-read map: what deserves special attention

This is not a substitute for the fresh score review. It is a risk map from the earlier Fable pass.

### Core
- `1.1` RED — Kum Ba Yah poor first-position fit; Hot Cross Buns introduced eighths.
- `1.2` RED — Twinkle range/leap and Frère Jacques eighths complicate the stated job.
- `1.3` AMBER→GREEN after one fix — check premature eighths in Hot Cross Buns LH.
- `1.4` RED — Lightly Row was RH-only despite alternating-hands role.
- `1.5` AMBER — distinguish primary from transfer; Water Is Wide carries later notation.
- `2.1` GREEN after removal — verify Simple Gifts does not count as hands-together if no LH.
- `2.2` RED — only some options actually contain the target eighth-note reading burden cleanly.
- `2.3` RED — Happy Birthday is the clean target; verify C/F/G blocks and G vs G7 truth.
- `2.4` RED/AMBER — distinguish tie transfer from over-hard Greensleeves versions.
- `2.5` AMBER — authored Ode may be better target than imported “easy” Ode.
- `3.1` AMBER — verify major-key claim against modal/minor pieces.
- `3.2` GREEN/AMBER — Saints/Jingle strong; Clementine likely much harder.
- `3.3` GREEN but repetitive — three Greensleeves versions may inflate variety.
- `3.4` AMBER — Petzold/Für Elise are stretch, not gentle first ledger-line examples.
- `3.5` RED for pedal notation — verify whether any score actually prints pedal.
- `3.6` RED/AMBER — Greensleeves waltz strong; literal Alberti and ordinary broken-chord examples still need separation.
- `4.1–4.4` AMBER — many real pieces are transfer/stretch rather than acquisition.
- `4.5` GREEN/AMBER — compound-meter examples strong; inspect fingering/edition quality.
- `4.6–4.7` PROJECT/AMBER — several full works are too large for first-read acquisition.

### Style branches
- `blues.3` TRANSFER — genre repertoire is not isolated blue-note acquisition.
- `jazz.3` TRANSFER — standards are context; phrase-back/feel is learner action.
- `latin.3` TRANSFER — clave is task/context unless literally present.
- `classical.3` GREEN/PROJECT — judge musical suitability rather than detector purity.
- `chords-pop.3` GREEN/AMBER — lead sheets may be exactly right for chord-symbol playing.
- `hymns.4` GREEN — four-part Amazing Grace is positive-control SATB writing.
- `blues.4` RED — prior file titled 12 Bar Blues reportedly had 11 measures.
- `jazz.4` RED — prior candidates were one-staff lead sheets, not written triad comping/swing notation.
- `rock.4` RED — Greensleeves triads are not power chords.
- `technique.4` GREEN — Lemoine studies are plausible real technique repertoire.
- `holiday.4` SHELF/TRANSFER — ordinary file/difficulty review.

### Stage 5
- `classical.5` GREEN — Clementi/Burgmüller/Schumann generally honest repertoire.
- `chords-pop.5` AMBER — accompaniment textures and seventh-symbol reading are separate jobs.
- `blues.5` RED for walking bass — prior songs were lead sheets with no written LH walk.
- `jazz.5` RED for shell voicing — lead sheets useful as transfer but do not write shells.
- `ragtime.5` AMBER — needs small written syncopated-rag primary; full Joplin is stretch.
- `latin.5` RED for named techniques — no literal montuno+tumbao+clave primary had been established.
- `technique.5` GREEN/AMBER — Duvernoy good transfer; repeated-note physical technique may need focused work.
- `rock.5` GREEN — Annie's Song had literal open root–fifth–octave shapes.
- `hymns.5` GREEN/AMBER — check bass walk-down and non-diatonic-symbol roles separately.

### Stage 6
- `classical.6` PROJECT/SHELF — performance interpretation rather than narrow acquisition.
- `ragtime.6` GREEN — School of Ragtime is authentic pedagogical material.
- `technique.6` AMBER — physical instructions such as rotating wrist/voicing must be taught, not inferred.
- `jazz.6` RED for written comping/walking — prior standards were lead sheets.
- `blues.6` GREEN — real boogie/walking-bass material established.
- `chords-pop.6` GREEN/AMBER — do not call patterned/arpeggiated bass “walking” by default.
- `rock.6` GREEN/AMBER — Moonlight I strong literal arpeggio-over-sustained-bass example.
- `hymns.6` GREEN/PROJECT — real substantial arrangements exist.
- `latin.6` RED/AMBER — tango accompaniment established; literal clean montuno remained weak.

### Stage 7
- `classical.7` PROJECT/SHELF — authentic advanced repertoire; edition defects still matter.
- `ragtime.7` PROJECT/SHELF — full rags as destinations.
- `technique.7` RED for pedal-half / AMBER otherwise — previous Czerny files had pedal count 0.
- `jazz.7` RED/AMBER — advanced harmony transfer, but literal rootless/tritone primary weak.
- `blues.7` GREEN/AMBER — leaping-LH primary established.
- `chords-pop.7` RED — current options did not clearly teach named sus/add9/ninth vocabulary.
- `rock.7` PROJECT/GREEN — Mountain King build is genuine; likely excerpt/reference due difficulty.
- `latin.7` PROJECT/GREEN — genuine showpieces; don't over-purify.
- `jam.7` GREEN as task substrate — lead sheets are correct format.
- `holiday.7` SHELF — ordinary file/difficulty review.

### Stage 8
- `jazz.8` AMBER/RED for acquisition — rich transfer; compact extension primary may still be missing.
- `blues.8` RED for primary — giant advanced works are not a clean dominant-9 acquisition source.
- `chords-pop.8` TASK/AMBER — transposition is learner action; prefer short clear substrate.
- `ragtime.8` PROJECT/SHELF — late-rag repertoire.

### Stage 9
- `classical.9` PROJECT/SHELF — edition/correctness/difficulty, not demand isolation.
- `jazz.9` GREEN/PROJECT — real two-staff textures; solo/walk may be learner passes.
- `blues.9` TASK/PROJECT — improvisation is learner action; prefer explicit/simple form as substrate.
- `chords-pop.9` RED/AMBER workflow mismatch — current lesson uses full arrangements as models to reverse-engineer; finder language that asks for lead-sheet-only inputs conflicts with that workflow.
- `ragtime.9` PROJECT/SHELF — whole authentic rags are appropriate.

## Completed / partial direct verification in the new backward pass

| score | placement | state | current call |
|---|---|---|---|
| `song.ragtime.joplin-original-rags` | ragtime.9 | reviewed from exact source notation; learner-facing converted file still worth spot-checking | KEEP |
| `song.ragtime.joplin-breeze-from-alabama` | ragtime.9 | reviewed from exact source notation | KEEP |
| `song.ragtime.joplin-chrysanthemum` | ragtime.9 | reviewed from exact source notation | KEEP |
| `song.classical.joplin-search-light-rag.pdmx` | ragtime.9 | source-equivalent reviewed; exact readable PDMX edition pending | KEEP / NEEDS EXACT-EDITION CHECK |
| `song.pop.takeru-kanazaki-fire-emblem-three-houses-apex-of-the-world.pdmx` | chords-pop.9 | lesson/workflow inspected; exact readable MusicXML musical review pending | NEEDS EXACT-EDITION CHECK |

## Current cursor

Direction: backward.

`ragtime.9` has been consumed for the new pass.  
The last option of `chords-pop.9` (Apex of the World) was used to complete the first five-score batch.

## Batch 2 results — exact readable-score review

| score | placement | finding | verdict |
|---|---|---|---|
| `song.pop.wowaka-vocaloid-rolling-girl-aa1-4aaa3aa1-4a.pdmx` | `chords-pop.9` | Exact XML is one genuine Piano part with two staves, 4/4 and two sharps. The score is long (144 bars) and uses recurring accompaniment/bass machinery, layered voices, ties and sixteenths. Its repetition actually makes the arrangement logic comparatively legible: a learner can identify what stays fixed, what thickens, and what can be stripped out. | **KEEP — model arrangement** |
| `song.pop.billy-joel-rousseau-billy-joel-piano-man.pdmx` | `chords-pop.9` | Exact XML is a genuine two-staff Piano solo. It is enormous (273 bars), starts with a freely played ornamented introduction, then settles into much more transparent bass-plus-chord construction. Harmony/form are recoverable despite the decorative surface. | **KEEP — strong model, explicitly teach reduction** |
| `song.pop.electric-light-orchestra-elo-mr-blue-sky-hard-piano.pdmx` | `chords-pop.9` | Exact XML is genuine two-staff Piano, 4/4, one-flat signature, q=160 and explicitly marked Swing. Dense chordal texture and fast surface writing make it much less transparent than Falling or Piano Man, but that makes it useful later for the specific job of thinning a busy arrangement. | **KEEP / STRETCH MODEL** |
| `song.pop.harry-styles-falling-by-harry-styles.pdmx` | `chords-pop.9` | Exact XML names Harry Styles and arranger May Quach, one Piano part, two staves, E major, 4/4. The opening is unusually clear: repeated melodic eighth-note cell against plainly voiced E-major-family triads, then the same harmonic skeleton is thickened later. This is excellent material for seeing how an arrangement is built and then making a different one. | **KEEP — strongest first model in this set** |
| `song.pop.camille-le-festin-piano-arr-kno.pdmx` | `chords-pop.9` | Exact XML is genuine two-staff Piano. It begins in 9/8, moves to 3/4, uses a wide register, many tuplets/grace notes and rich chordal/figurational writing across 159 bars. Musically valuable, but considerably more opaque as an arranging-analysis substrate. | **KEEP / STRETCH MODEL** |

### `chords-pop.9` conclusion so far

The lesson's *actual* workflow is defensible: inspect/play a finished arrangement, recover its harmonic skeleton and texture decisions, then make a new arrangement. The finder language should be changed to match that workflow; “lead sheet only” / “avoid fully written arrangements” contradicts what the lesson deliberately asks the learner to study.

Best sequencing for the arranging-analysis job among these five:
1. **Falling**
2. **Piano Man**
3. **Rolling Girl**
4. **Mr. Blue Sky**
5. **Le Festin**

This is not a general difficulty ranking; it is specifically about how clearly each score exposes arrangement decisions.

## Cursor after Batch 2

Direction remains backward from Stage 9.

One item from Batch 1 still lacks the exact readable-MusicXML pass:
`song.pop.takeru-kanazaki-fire-emblem-three-houses-apex-of-the-world.pdmx`.

### NEXT BATCH — exactly 5 files

1. `song.pop.takeru-kanazaki-fire-emblem-three-houses-apex-of-the-world.pdmx`
   - placement: `chords-pop.9`
   - inspect: finish exact-edition review; arrangement transparency, section/texture changes, harmonic recoverability, burden, distinct value versus the five models already reviewed.

2. `song.blues.handful-of-keys`
   - placement: `blues.9`
   - inspect: exact score/form; whether it is a useful improvisation/project substrate versus primarily a written virtuoso performance; how much room the learner has to make a chorus their own.

3. `song.blues.black-bottom-stomp`
   - placement: `blues.9`
   - inspect: form clarity, written-out density, call/response or chorus structure, whether the score supports improvisation work or belongs mainly as stretch/integration repertoire.

4. `song.jazz.stumbling`
   - placement: `blues.9`
   - inspect: actual blues/form relationship, left-hand texture, improvisation affordance, and whether it honestly belongs on the blues final project rather than another stylistic track.

5. `song.jazz.louis-armstrong-o-when-the-saints-go-marching-in.pdmx`
   - placement: `jazz.9`
   - inspect: actual score type and texture; whether it gives enough harmonic/form space for comping, walking and soloing as learner actions; distinguish useful standard substrate from a fixed arrangement.

After these five, continue backward through the remaining `jazz.9` options.

## Interpretation-audit correction — Fable score facts vs lesson intent

Random cross-checking found Fable's direct notation reads to be generally reliable, but exposed a systematic pedagogical-interpretation error:

> Do **not** require the static repertoire score to literally contain a technique when the lesson explicitly teaches the learner to *apply* that technique to a substrate score.

The decisive question is the lesson contract:
- If the score is presented as an **example of the target**, the target must be visibly/aurally present in the score.
- If the score is presented as a **vehicle/substrate**, the score must supply what the learner needs to perform the instructed transformation, comping, pedalling, improvisation, transposition, arrangement, etc.
- If the target is taught in a drill/exercise and then applied to repertoire, lack of literal notation in the repertoire is not by itself a curriculum defect.

### Confirmed Fable interpretation corrections

1. **3.5 sustain pedal**
   - Fable index: RED for pedal notation because the repertoire pool prints no pedal marks.
   - Current lesson explicitly says: “Many editions of the pieces here have none at all, and then the rule is: change with the harmony.”
   - The learner practises pedal timing in a pedal-change drill, then applies pedal to Greensleeves/Schumann.
   - **Correction:** not RED merely because the pieces lack printed pedal marks. Printed-pedal reading is explanatory context, while the assessed/practised target is clean legato-pedal timing. The repertoire can validly be an added-pedal substrate.

2. **jazz.4 comping on plain triads**
   - Fable index: RED because Avalon/Whispering/Margie are lead sheets and do not write LH triad comping or swing notation.
   - Lesson explicitly says all three are lead sheets and instructs: “Play the tune with the right hand and comp one pattern with the left from the symbols, then change the pattern.”
   - Comping rhythms and swing are taught in exercises.
   - **Correction:** lead-sheet format is not a defect; it is the intended substrate. Review should instead ask whether the chord symbols/harmony are suitable for the rung and whether the learner can realistically execute the assigned comping task.

3. **jazz.5 shell voicings**
   - Fable index: RED because the standards are lead sheets and do not literally write shell voicings.
   - Lesson explicitly teaches shell construction and ii–V–I in drills, then gives four lead-sheet standards to comp with those shells.
   - It even states that none of the pieces prints swing/accent marks and that placement/accent are therefore for the learner's ear.
   - **Correction:** lead sheets are exactly the correct substrate. Do not demand pre-written shell voicings from them.

4. **blues.5 walking bass**
   - Fable index: RED for walking-bass coverage because the repertoire songs have no written LH walking bass.
   - Lesson explicitly states: “The exercise is the line alone, left hand only; none of this rung's pieces has one yet, and the next rung puts a right hand over it.”
   - **Correction:** this is intentional sequencing, not missing coverage. Judge the walking-bass exercise itself; judge the repertoire for the other stated blues tasks on this rung.

5. **rock.4 power chords / ostinato**
   - Fable index: RED because the only repertoire score, Greensleeves with chords, literally writes full triads rather than power chords.
   - Lesson explicitly calls it “a vehicle rather than a rock song” and says to **ignore the written left hand entirely**, play power chords under the melody from the printed symbols, then replace them with the ostinato.
   - **Correction:** the fact that the original written LH contains thirds is irrelevant to the assigned task. What matters is that the melody + chord symbols form a simple enough vehicle for the learner-applied textures.

6. **chords-pop.9 arrangement project**
   - Fable index: RED/AMBER because the six choices are finished arrangements rather than chord-chart inputs.
   - The lesson deliberately uses finished arrangements as **models to reverse-engineer**: derive the harmonic skeleton from the notes, then create a different arrangement.
   - Direct reads show several are useful for this, especially Falling; others are better treated as stretch models.
   - **Correction:** keep the model-arrangement workflow; fix contradictory finder language rather than replacing the repertoire with lead-sheet-only inputs.

### Rule for continuing the audit

Fable's raw score observations can be reused unless something looks suspicious.
Fable's rung-level RED/AMBER/GREEN verdicts must be re-evaluated against the **actual lesson text and task workflow**.

High-priority recheck categories:
- any Fable complaint of “no written X” where X could be learner-applied;
- lead sheets criticized for not containing realized accompaniment;
- repertoire criticized for not containing improvisation/transposition/arrangement outcomes;
- pedal/articulation/dynamics criticized where the lesson explicitly asks the learner to add them;
- project/shelf material judged by acquisition-purity rules.

Conversely, keep Fable's strictness where the lesson claims the **score itself demonstrates** a named figure/style/notation feature.
