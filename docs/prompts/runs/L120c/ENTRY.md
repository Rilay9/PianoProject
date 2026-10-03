### Entry 156 — L120c — sixteenths have an owner: core 4.4 teaches the Hanon page's written sixteenths as four even notes to the quarter-note beat (a 38-word addition, true of Hanon 1–5 in 2/4 and of the app's click), `sixteenth-notes` maps to `rhythm.sixteenths`, ragtime.5 and technique.6 claim what their lessons teach, `taughtAt` is ["4.4"]; item 9's one repair is jazz.4's syncopation and its one stop-line Question is 2.2's compound time; the five pre-4.4 core sixteenth placements simplified, replaced or moved; the table re-run twice — 378 options and 618 pairs at the base, 221 and 461 after ownership, 218 and 453 after placement; the app's probe 379, 222, 219; B-mapping 67, 0, 0 (2026-09-29)

Base: origin's head **cd1429b3** (L120b landed, the brief on it). Worktree only, nothing committed.

**Judgement.** Nothing was looked at on a screen and nothing was heard. Every musical reading here comes from the notation (the built MusicXML, read bar by bar), the lessons' text and the build's facts. Every sentence added or changed below is learner-facing and **unverified as music**.

- **The words 4.4 gains** (`content/lessons/4.4.md`, a paragraph between the four rules and *What to do at the piano*), in full:

  > **Sixteenths.** Every note but the last is a sixteenth: four to a quarter-note beat, beamed in fours, two groups to a 2/4 bar. Count "1 e and a, 2 e and a", four even notes per metronome click.

  - **Checked against the files, as the reviewer's guard asks** (`responses/questions-bbd7f99a.md`). Hanon Nos. 1–5 as the app prints them (`app/public/content/scores/generated/exercise.hanon.0N.both.mxl`): time signature 2/4 in all five; every note a `16th` (duration a quarter of the quarter-note division) but the closing half note in each hand; the primary beam groups them four at a time, each group starting on a quarter-note beat (`test_sixteenths_owner.The4_4Addition`, two cases). The app's click: `prepareSession` counts beats in quarter notes (2/4 is two beats) and the Score screen's metronome takes its tempo from that beat and its bar from that count (`ScoreSession.startMetronome`), so one click is one quarter-note beat and four sixteenths fall to each click (a new `lessonClaimsAboutApp` row holds both). "Four even subdivisions of the quarter-note beat" is supported by the page and by the click, so nothing was taught around the file.
  - **Why 38 words.** `lessonShape.test.ts` holds every lesson to three minutes at 200 words a minute; 4.4 stood at 561 of 600. It now stands at 599. The rest of the lesson is not rewritten (Follow-up 3).
- **The other learner-facing words changed** (item 8, one fact in every place), in full:
  - 3.5 (*What to do at the piano*): "…broken-chord left hand with pedal, then *Greensleeves (waltz bass)* and Schumann's *Chorale* from the *Album for the Young*." and (*Tools for this rung*): "*Play it as a duet* opens Schumann's *Chorale* in Keep tempo with the right hand yours, …" (the rest of that paragraph unchanged).
  - 4.2: "Then a Grade 1 piece in a flat key or a minor key — *Bella Ciao* or the easy *Für Elise*."
  - 4.3: "Then a piece that uses broken chords — *Greensleeves*, or Schumann's *Melody* from the *Album for the Young*, whose left hand runs in eighths under the tune in nearly every bar."
- **What a learner now meets differently.** From the app's probe (every rung's own options asked of the one gate, the learner the session builds at the rung):
  - **Ownership (items 2–7 and 9): 157 options the gate stops refusing at their own rung.**
    - 4.4: Hanon Nos. 1–5, the rung's five exercises, all refused until now. 4.6 (3) and 4.7 (1) likewise.
    - The tracks that stand on 4.4: ragtime.5–9 (30), technique.5–8 (29), classical.5–9 (34), chords-pop.5–9 (16), jazz.7–9 (9), blues.5–9 (8), holiday.6–7 (8), latin.6–7 (7), rock.6–7 (4), hymns.6 (1). Each had sixteenths as its only untaught demand.
    - jazz.4: *Avalon* and *Margie*, whose syncopation jazz.4's comping lesson teaches (item 9).
  - **Placement (item 8), one decision per option** (evidence lines under Done 8):
    - 3.4 and 4.2: *Für Elise (beginner)* (3/8, sixteenths in 23 of 24 bars) is simplified to *Für Elise (easy)*: the same tune and key, in 3/4 with eighths for the sixteenths and a held left hand. Both settings carry the same incidental syncopation (2 located), so the gate still refuses the easy setting there until 4.5 teaches syncopation; what changed is that neither rung asks sixteenths.
    - 3.5: *Canon in D (easy)* is replaced by Schumann's *Chorale* (Op. 68 No. 4), four voices in half notes; the gate admits it at 3.5, where the Canon was refused (sixteenths, syncopation), and the duet opens it. The Canon stays at 4.6 and 4.7.
    - 3.6: the Canon moves off (the rung is song-optional); it stays at 4.6 and 4.7.
    - 4.3: the Canon is replaced by Schumann's *Melody* (Op. 68 No. 1), the gate admitting it; before, the gate refused all three of 4.3's songs, and now it admits one.
    - Net: 3 more options leave the probe (222 → 219); 2 syncopation pairs appear (the easy *Für Elise* at 3.4 and 4.2), the same demand the beginner setting carried there.
  - **Beyond a rung's own options** (inferred from the code, not measured here): the same gate reads swaps, the Library and the demand tier, so a sixteenth piece is admitted wherever 4.4 is behind the learner; at 4.4 `rhythm.sixteenths` becomes one of the demands the rung teaches, which the demand tier (`session.ts` strands' `edges`) and "something else like this" (`eligibility.targetDemandsFor`) read.
  - **Reading (item 7).** No reading row's held phrase changes (0 of the 15 rows listed on rungs; `after-placement/reading-rows.txt`). The reader can newly offer *add sixteenths*: at 4.4 on the level-2 row (the contract measured it made), and on the level 4–7 rows at technique.5, theory.6, jazz.8, chords-pop.8 and theory.9. At 4.5–4.7 the level-3 row's compound phrases cannot hold them (Deviation 1).
- **Counts, measured the same way at each run** (the table over the offline build; the probe from `app/.probe`):

  | | base (= L120b's final, `base-equals-L120b.txt`) | after ownership | after placement |
  | --- | --- | --- | --- |
  | table: options, pairs | 378, 618 | 221, 461 | 218, 453 |
  | A / B-claim / B-mapping | 3 / 42 / 67 | 3 / 40 / 0 | 3 / 40 / 0 |
  | C-later / C-elsewhere / C-nowhere | 238 / 128 / 140 | 259 / 159 / 0 | 251 / 159 / 0 |
  | sixteenth pairs / syncopation pairs | 207 / 125 | 52 / 123 | 47 / 120 |
  | app's probe `untaught` | 379 | 222 | 219 |
  | only the probe has | 2.2's reading row | 2.2's reading row | 2.2's reading row |

- **The hypothesis held** (item 12). After ownership B-mapping is 0 and every sixteenth pair on a rung with 4.4 on its path left (155; `after-ownership/difference.txt`: 0 remain). `taughtAt` derives 4.4 alone. No pair of another demand moved but jazz.4's two, item 9's repair. One part of the brief's picture was narrower than the line: what remains for sixteenths is not only `classical.4.shelf`, `classical.4` and `technique.4` but every Stage 1–4 track, whose path takes the core only to the stage before (holiday, hymns, hymns.4, blues.3, jazz.3, classical.3, chords-pop.4, rock.overview), and those whose later rung stands on 4.4 read C-later, not C-elsewhere (classical.4 and technique.4 among them). After placement no core option before 4.4 asks sixteenths; 47 track pairs remain, the later placement lane's.

## Done

1. **The order (item 1).** Items 2–7 and item 9 were built and tested red then green, then the build, the probe and the table ran (`after-ownership/`). Item 8 followed on that table, then the three ran again (`after-placement/`). Each run has `difference.txt` (pair by pair, by demand and rung, each rung marked with whether 4.4 is on its path, and the tool against its probe), `catalog-diff.txt` (no row's demands, located counts or established set moved in either run), the three report diffs and `restore.txt`.
2. **The concept and its mapping (item 2).** `concepts.json` gains `sixteenth-notes` ("Sixteenth notes"; finder: "playing four even notes to the beat", "sixteenth notes in groups of four", "a steady pulse", avoiding triplets and syncopation; level words from its three rungs' stages, 4 to 6), in its alphabetical place, and the comment's list of concepts that are demands in v0 names it. `claims.CONCEPT_DEMANDS` gains `"sixteenth-notes": "rhythm.sixteenths"`, the one row, with a comment.
3. **4.4's addition (item 3).** The paragraph above; `sixteenth-notes` in 4.4's concepts. The claim rule holds: Hanon Nos. 1–5 establish `rhythm.sixteenths` (464, 448, 448, 448, 448 located). Technically done; pedagogically unverified as music.
4. **technique.6 claims it (item 4).** `sixteenth-notes` in its concepts, its text unchanged. Established by the repeated-notes, rotation, sixteenth-syncopation and trill exercises and the three Czerny studies. Also in `add_technique_units.py`'s table for technique.6 (Deviation 3).
5. **ragtime.5 claims it (item 5).** `sixteenth-notes` in its concepts, its text unchanged. Established by the sixteenths rhythm exercise and *The Entertainer*.
6. **No other claim (item 6).** latin.7, holiday.7 and 3.5 are untouched; `test_the_claims_are_4_4_ragtime_5_and_technique_6_and_no_other` pins it.
7. **`taughtAt` follows the lessons (item 7).** `rhythm.sixteenths` is `["4.4"]`, the derivation (`claims.teaching_rungs`): ragtime.5 and technique.6 stand on 4.4. The `taughtAtNote` is rewritten; its old clause about the level-7 row writing sixteenths on jazz.8 and theory.9 was stale (that row's params set `sixteenths: false`). The validator's derivation warning is clean for every demand (`checks: content-validate`, no "taught at" line). The other readers: `readingOptions` (no held phrase moves), `readingMoves` (five track rows and 4.4 may offer the move), the generator contract (Deviation 1), `targetDemandsFor` and the demand tier (above).
8. **The pre-4.4 core placements (item 8)**, after the ownership run named exactly five (`after-ownership/difference.txt`, "the sixteenth pairs that remain"):
   - **3.4, *Für Elise (beginner)* → *Für Elise (easy)*, simplified.** Notation: 3/8, marked 53 quarters a minute, sixteenths in 23 of 24 bars in both hands, 30 pedal marks; the easy setting is 3/4, 22 bars, eighths and quarters, the left hand in half notes, the same A minor tune. 3.4 teaches ledger lines; its lesson names no *Für Elise*; its ledger-line claim is kept by the two Minuets (30 located each; 2 options establish it now, 3 before). The beginner setting stays in the Library, where 4.6's lesson already points ("a beginner setting of *Für Elise* is in the Library too").
   - **3.5, *Canon in D (easy)* → Schumann's *Chorale*, replaced.** Notation: the Canon's sixteenths are its fifth variation, bars 37–44, twelve to a bar in the right hand at 100 quarters a minute, and the file carries no pedal marks; the Chorale is 32 bars of four voices in half notes, two to a staff, G major, level 4.96 (inside the stage's reach). 3.5 teaches legato pedalling ("change the pedal just *after* the new chord sounds"); the Chorale moves in half-note chords (bars 1–3 change chord on each half note), and `classical.4`'s lesson already names it "all legato". Moving alone was not open: 3.5 requires a song run and three song options (`validate.thin_lesson_errors`, D21). The gate admits the Chorale at 3.5 (`scripts-candidates.py`, `candidates-3.5.txt`: 73 songs admitted there, 2 with pedal marks in the file, neither on a rung below Stage 5).
   - **3.6, the Canon, moved.** 3.6 is song-optional and its lesson does not name the Canon; 4.6 and 4.7, the nearest core rungs on 4.4's path, already list it.
   - **4.2, *Für Elise (beginner)* → *Für Elise (easy)*, simplified.** 4.2 wants "a Grade 1 piece in a flat key or a minor key"; the easy setting is the same A minor with its G sharps. The lesson's "beginner" became "easy".
   - **4.3, the Canon → Schumann's *Melody*, replaced.** 4.3 requires three song options, so a replacement was needed. Of the songs the gate admits at 4.3 whose left-hand pattern the detector establishes, *Melody* (Op. 68 No. 1, C major, 20 bars, level 5.03) keeps its left hand in eighths in every bar, eight to the bar in 16 of 20 (bar 1: C G F G E G C E), under a right hand in quarters. It is the one piece this lane places that no rung listed before (Question 2).
   - One fact in every place: the stage files, the three lessons, `validate.CORE_REACH_PLAN` (the Canon's two exemptions at 3.5 and 3.6, which `test_validate_reach` holds to be on their rungs), `docs/generated/ladder.md` (regenerated: the validator fails on a stale one), the `lessonClaimsAboutApp` duet row and the `lessonClaimsAboutMusic` 4.3 row (Deviation 2). `docs/02`'s Stage 3–4 song lines are a doc row below.
   - Technically done. Pedagogically each choice is read from the notation and the lessons and is **unverified as music**; the two replacements are curation the reviewer may overturn (Question 2).
9. **The other ownership lines (item 9).** Every B-claim group at L120b's head (42 pairs) classified at the lesson text (the list below). One repair: **jazz.4 claims `syncopation`**. Its lesson teaches comping "in the gaps" over a bass that "keeps the time" — "The Charleston: beat one and the 'and' of two", "Off-beats: only on the 'ands'" — the vocabulary's syncopation (a note off the beat, or after a rest on the beat, against a pulse that keeps going), and its off-beats exercise establishes the demand. Its path leaves the core at 3.6 through chords-pop.3 and chords-pop.4, so neither 4.5 nor latin.3 is on it; the core's first teaching rung stays 4.5. `rhythm.syncopation`'s `taughtAt` is `["4.5", "latin.3", "jazz.4"]` and its note is rewritten (its stale "technique.5" clause dropped: technique.5 names no syncopation). The one candidate that would move a first core teaching rung earlier is Question 1, not built.
10. **The nineteen stay (item 10).** `READ_NOT_TEACHING` is untouched and no edit here touches a listed (rung, demand): the lessons edited are 3.5 (its listed pair is syncopation, "syncopated pedalling", whose sentence is unchanged), 4.2, 4.3 and 4.4.
11. **The table, its pin and the record (item 11).**
    - Two runs, `after-ownership/` and `after-placement/`, each the offline build, the probe and the table with its difference file.
    - The pin: `test_untaught_options.PROBE` is `runs/L120c/after-placement/probe-refusals.txt` (219). `RECORDED_DIFFERENCES` is still 2.2's reading row alone; the docstring says the snapshot was re-run and how.
    - D0's record (`untaught_on_rung.json`) goes from 82 rows to 57, none added (`d0-edit.txt`). Out: every sixteenth row whose rung stands on 4.4 — hanon on 4.4 ×5, classical.5–8 (2, 3, 2, 2), ragtime.6–8 (1 each), technique.5 ×2; broken_seventh, octave_scale and tremolo_octaves on technique.7; scale on technique.8 ×12; repeated_notes and rotation on technique.6, latin.7 and holiday.7; syncopation and trill on technique.6; rhythm on ragtime.5; secondary_rag on ragtime.9; tremolo_octaves on blues.5 — and comping on jazz.4 (syncopation, the off-beats exercise). Kept, as the brief expected: hanon on classical.4 ×2 and technique.4 ×3, their `taughtAt` now `["4.4"]`; the syncopation rows on 3.6 and blues.4 carry the new list.
12. **The hypothesis (item 12):** held, above.
13. **Not L120c's (item 13):** nothing of it touched but the one app line in Deviation 1.

**Deviations** (§13; each where the line refuted a premise or a consumer needed it):

1. **`app/src/engine/readingControls.ts`, one entry in `UNREALISABLE_AT`** (the brief puts `app/src/**` out of bounds). `generatorContract.test.ts` holds that list to exactly the moves the reading curriculum can ask and the generator cannot make. With sixteenths taught from 4.4, the move *add sixteenths* becomes askable at 4.5–4.7, where the level-3 row writes compound time and the generator refuses sixteenths there for its stated reason ("Compound time at levels 1–4 is written in its three first figures…"). The contract went red (`checks/generatorContract-after-ownership.txt`: "undoable, and not declared: 4.5 rhythm.sixteenths on, …"). The entry declares it with that reason. Behaviour does not move: `readingMoves` already declines the move (`unrealisable` gives a new reason), so this is the contract's record catching up with the curriculum. It pulls 13 more browser specs into the map's minimum. If the orchestrator would rather route it through an app lane, the contract stays red until then.
2. **App tests, the consumers of the lesson words:** a `lessonClaimsAboutApp` row for 4.4's addition (2/4, the quarter-note click); the 3.5 duet row revised (class revise: it opened the Canon); the `lessonClaimsAboutMusic` 4.3 row replaced (class replace: it held the Canon's left hand, a sentence that left 4.3 with the Canon).
3. **`tools/content/add_technique_units.py`,** the generator table for the technique rungs' concepts: technique.6 gains `sixteenth-notes` there too. `test_technique_units.test_running_it_again_changes_nothing` went red without it (one fact, three places).
4. **`tools/content/validate.py`,** `CORE_REACH_PLAN` loses the Canon at 3.5 and 3.6 (Done 8).
5. **Content tests that encoded the replaced model** (§11), each revised with its reason: `test_taught_at`'s derivation assertion for syncopation; `test_measured_truth`'s moved-options case, which skipped Hanon because "sixteenths are taught at no rung" (it now holds Hanon taught at 4.4); `test_untaught_options.TheSubclasses`' mapping-gap case and S1, which used sixteenths as the demand no concept maps: each now takes the `sixteenth-notes` row out for its length (`mock.patch.dict`), and a new case holds the shipped reading (B-claim when a lesson names them, C-nowhere when none does).
6. **The e2e port** is the orchestrator's 4574, not the brief's 4475.

## Not done

- **Question 1's claim (2.2, compound time).** Held at the stop line; nothing built.
- **The committed reports.** The build rewrote `rung-claims.md`, `inventory.md` and `SOURCES.md`; each was restored from the snapshot and its diff kept (`after-*/report-*.diff`). `test_measured_truth.TestTheReports.test_the_committed_markdown_is_this_catalogues` is red on the two reports until the landing commits the regenerated ones, and passes with them in place (`checks-reports-with-regenerated.txt`, then restored). `SOURCES.md`'s diff is fetch dates.
- **The syncopation on the pre-4.4 core.** After item 8, 3.4 and 4.2 still carry a refused *Für Elise* (syncopation, incidental) and 3.6 has no song the gate admits; the placement lane's.
- **Anything heard or seen.** No screen was opened.

## Follow-ups

1. **P2, a lesson sentence the app cannot keep (adjacent, not fixed).** 4.4 says "Hanon 1 to 5 … from 40 to 108 bpm" and "at 80 bpm at 97 % accuracy". Hanon's file is marked a quarter of 60 and the Score screen caps tempo at 130 % (`ScoreScreen.ts`: `tempo.max = '130'`, `setBpm` clamps), so 78 bpm is the most it plays them at; the rung's own mastery asks 80 % of the written tempo (`minTempoPct` 0.8, a quarter of 48).
2. **P2, the Stage 3–4 core songs and syncopation.** 3.6's one song and two of 4.2's three are refused for syncopation (incidental at 3.6 and on the easy *Für Elise*, established on *Bella Ciao*). On both *Für Elise* settings the two located syncopations may be their two-note pickups (bars 1 and 14 of the easy setting); inferred from the bar layout, not from the detector's locations.
3. **P3.** 4.4 reads in 599 of its 600 words; any addition there must trim.
4. **P3.** `levelBand` stays [3.6, 5.1] at 3.6, whose one song is now 3.6.
5. **P3.** jazz.4's syncopation claim is established by the off-beats exercise, which the gate refuses before the coping question (teaching use not approved), so a learner there is not yet offered the exercise that keeps the claim.
6. **P3.** The table's rendered title still says "(L120a)" (L120b's Follow-up 7).
7. **P3, process.** A demand's `taughtAt` has consumers in app code (`UNREALISABLE_AT`, the contract) that a content lane cannot see from the content files; a lane that moves a `taughtAt` should name `generatorContract.test.ts` in its brief.

## Questions

1. **The stop line: 2.2 and compound time.** 2.2's lesson, under "Two more things on this rung": "*Alouette* has eighth notes too, but in 6/8, where the eighth is the counting unit and they come three to a beat … Count that one '1 2 3 4 5 6' rather than '1 and 2 and' — an 'and' splits a beat in two, and here a beat holds three." It gives a counting instruction for one piece, and *Alouette* establishes `metre.compound` (62 located), so the claim rule would hold. A `6/8` claim at 2.2 would move compound time's first core teaching rung from 4.5 to 2.2. It would free 9 table pairs, 2 options leaving the table entirely (`question-2.2-compound.txt`):
   - 2.2 *Alouette* (still refused for another demand);
   - 2.4 *Rhythm: six eight long short — 4 bars* (leaves);
   - holiday.3 *O Holy Night*;
   - chords-pop.4 *Hallelujah (easy)*;
   - classical.4.shelf *Clair de Lune (easy)*, *Questa Notte*, *Morgenstimmung*, *The Armstrongs – First Man* (leaves);
   - technique.4 Lemoine *Étude, Op. 37 No. 35*.

   Beyond the table it would let the reader write compound time on the core rows from 2.2 to 4.4. My reading: the paragraph describes the metre of one piece and how to count it, which is short of teaching compound time as a skill (4.5 does). Not built.
2. **The two replacements.** Schumann's *Chorale* at 3.5 and *Melody* at 4.3 are this lane's curation, forced by the three-song rule where the Canon left. For 3.5, of the 73 songs the gate admits there, only two carry pedal marks in the file (*Annie's Song*, *Lavender's Blue*), both on Stage 5–6 rungs; the rest were not read one by one. For 4.3 it admits the *Humming Song* (Op. 68 No. 3, left hand in eighths over a repeated G) and *As the Deer* (on hymns and hymns.5, a left hand of root–fifth–octave broken chords; a modern worship song whose public-domain claim is the PDMX uploader's). The lists are `candidates-3.5.txt` and `candidates-4.3.txt`. Keep, or choose another?
3. **Two borderline readings left without a claim.** blues.3 teaches the blue notes (E flat, B flat, F sharp in C) by ear and hand, and hymns teaches chromatic walk-ups the player adds. Neither teaches reading an accidental, the `accidentals` skill that copes with `pitch.chromatic`. Confirm no claim?

## Item 9: every B-claim group at L120b's head, classified at the lesson text

- **`interval.leap`, 14 pairs** (1.5 ×2, holiday ×7, hymns.2 ×5): the rung at or below that names it is 1.5, "A leap is a 4th or wider: this rung only introduces it, since the songs here have just the odd one, and the next rung practises it". It introduces, and F2a made that an `introduces`. **No claim.** Placements, recorded, not moved (holiday's and hymns.2's paths leave the core at 1.5).
- **`metre.compound`, 11 pairs:**
  - 2.2, 2.4, holiday.3, classical.4.shelf ×4, chords-pop.4: 2.2's *Alouette* paragraph. **Question 1, not built.**
  - holiday ×2 (*Silent Night*, *We Three Kings*): holiday's "It is written in 6/8: six quick counts in a bar, felt as two slow ones", a description of one carol's metre. **No claim.**
  - technique.4 (Lemoine): read as not teaching in `READ_NOT_TEACHING` ("one étude described as in 6/8"). **Unchanged.**
- **`pitch.chromatic`, 15 pairs:**
  - 3.1 (the A blues scale): "the accidental is only introduced here, and you practise it in the lesson on A minor". **No claim.**
  - chords-pop.3: the rung at or below that names it is 3.1. **No claim.**
  - blues.3 ×6: "Where the blue notes are. In C: the flat third, E flat, … the flat seventh, B flat; and … F sharp", taught by ear and hand. **No claim** (Question 3).
  - hymns ×4: "walk from one chord's root to the next by step or by chromatic step — C, D, D♯, E", a note the player adds. **No claim** (Question 3).
  - jazz.3 ×3: `READ_NOT_TEACHING` ("a piece's runs described as climbing chromatically"). **Unchanged.**
- **`rhythm.syncopation`, 2 pairs** (jazz.4 *Avalon*, *Margie*): jazz.4's comping, quoted under Done 9. **Claim made.**
- **B-mapping, 67 pairs:** all sixteenths, resolved by items 2–7 (0 after).

## Files

- **Changed:**
  - content: `content/curriculum/concepts.json`, `content/curriculum/stage-3.json`, `content/curriculum/stage-4.json`, `content/curriculum/stage-5.json`, `content/curriculum/stage-6.json`, `content/curriculum/vocabulary/demands.json`, `content/lessons/3.5.md`, `content/lessons/4.2.md`, `content/lessons/4.3.md`, `content/lessons/4.4.md`;
  - tools: `tools/content/claims.py`, `tools/content/validate.py`, `tools/content/add_technique_units.py`;
  - tools, tests: `tools/content/tests/fixtures/untaught_on_rung.json`, `tools/content/tests/test_measured_truth.py`, `tools/content/tests/test_taught_at.py`, `tools/content/tests/test_untaught_options.py`;
  - app: `app/src/engine/readingControls.ts` (Deviation 1), `app/tests/unit/lessonClaimsAboutApp.test.ts`, `app/tests/unit/lessonClaimsAboutMusic.test.ts`;
  - docs: `docs/generated/ladder.md`.
- **Added:** `tools/content/tests/test_sixteenths_owner.py`.
- **The run folder `docs/prompts/runs/L120c/`:** this entry; `parity-reference.txt`, `copy.txt`, `content-build-base.txt`, `restore-base.txt`, `base-equals-L120b.txt`; `base/`, `after-ownership/`, `after-placement/` (each: `content-build.txt` where built, `probe-refusals.txt`, `probe-uncoped.txt`, `probe.txt`, `untaught-options.txt`, `untaught-options-run.txt`, `difference.txt`, `catalog-diff.txt`, `restore.txt`, `report-*.diff`; `after-placement/` also `reading-rows.txt`, `ladder-report.txt`); `question-2.2-compound.txt`, `candidates-3.5.txt`, `candidates-4.3.txt`, `d0-edit.txt`; `red-green/`; `mutants.txt`; `checks-for-paths.txt`, `chain-checks-exit.txt`, `e2e-exit.txt`, `checks-reports-with-regenerated.txt`; `checks/` (the logs under 300 KB); the scripts `scripts-chain-setup.ps1`, `scripts-rerun.ps1`, `scripts-chain-checks.ps1`, `scripts-e2e.ps1`, `scripts-table-diff.py`, `scripts-question-frees.py`, `scripts-candidates.py`, `scripts-mutants.py`, `scripts-zzL120cProbe.test.ts`, `scripts-vitest.l120c.config.ts`, `scripts-zzL120cReading.test.ts`, `scripts-vitest.l120c-reading.config.ts`.
- **Not to commit (restored):** `content/scores/imported/SOURCES.md`, `docs/prompts/inventory.md`, `docs/prompts/rung-claims.md`; the regenerated versions' diffs are in the run folder.
- **Gitignored, outside the record:** removed at the end: `app/.probe/` (the probes, kept here as `scripts-*`), `app/node_modules`, `app/dist`, the copied Kern, MuseTrainer and Mutopia caches, `build/cache`, `build/midi-real` and the e2e output; kept: `build/` (the snapshot, the three builds' catalogues and tables, the edit scripts, the raw logs, the e2e config copy and its storage state) and `app/public/content`.

## The red lines

From `red-green/`, each red on the code before its change:

- `red-test_sixteenths_owner.txt` (L120b's head, before any edit): 9 failed of 11 — the mapping (`None != 'rhythm.sixteenths'`), the concept entry, the three claims (`[] != ['4.4', 'ragtime.5', 'technique.6']`), the derivation (`[] != ['4.4']`), `taughtAt`, the paths (`['rhythm.sixteenths'] != []` at ragtime.5), the lesson words, the claim rule at 4.4, and the table ("Hanon No. 1 at 4.4 is still refused untaught"). The two Hanon notation cases pass: they pin the files the words are about, and hold already.
- `red-test_taught_at-jazz4.txt` (stage-4 and the vocabulary at cd1429b3): 3 failed — `untaught("jazz.4")` gives `['rhythm.syncopation'] != []`; the derivation `['latin.3', '4.5'] != ['latin.3', '4.5', 'jazz.4']`.
- `red-test_measured_truth-hanon.txt` (the vocabulary at cd1429b3): the revised moved-options case, 2 failed subtests: Hanon No. 1 at 4.4 `['rhythm.sixteenths'] != []`.
- `red-test_sixteenths_owner-placement.txt` (the ownership run's build): 2 failed — the five pre-4.4 lines (`'3.4 song.classical.beethoven-fur-elise.beginner'`, … `'4.3 song.classical.pachelbel-canon-d.easy'`) and "3.4: the beginner setting's sixteenths need 4.4".
- The contract, before Deviation 1: `checks/generatorContract-after-ownership.txt`, "undoable, and not declared: expected [ '4.5 rhythm.sixteenths on', …(2) ] to deeply equal []".
- The content suite's first run (`checks/content-tests.txt`): `test_technique_units` ("stage 6: a second run would change the rung", before Deviation 3) and the two `TheSubclasses` cases (`'B-claim' != 'B-mapping'`, before Deviation 5).

## The mutants

`mutants.txt`, `scripts-mutants.py`. Each mutant is one change to a working file; `test_sixteenths_owner`, `test_taught_at` and D0's `TestTheRungTheItemSitsOn` run against it; the file is restored byte for byte. The control (unmutated) turns nothing red. 9 mutants, 0 survived; a tenth is the contract's red line before Deviation 1.

| Mutant | Reds beyond the control (examples) |
| --- | --- |
| the mapping row removed (`claims.py`) | 2: the mapping; the derivation |
| `taughtAt` back to [] | 7: the paths, the derivation, the committed lists, D0's "no recorded combination has a teaching rung on its path", the table's Hanon line |
| a second teaching rung on 4.4's path (ragtime.5) | 6: one per path, the committed lists, the validator clean for it, D0's |
| 4.4's claim removed, `taughtAt` kept | 4: the claims, the derivation, the committed lists |
| latin.7 claims it too | 1: the claims are 4.4, ragtime.5, technique.6 and no other |
| technique.6's claim removed | 1: the same |
| 4.4's paragraph removed | 1: the lesson's words |
| jazz.4's claim removed, `taughtAt` kept | 3: jazz.4's case, the committed lists, the derivation |
| jazz.4 dropped from syncopation's `taughtAt` | 6: jazz.4's two cases, the committed lists, the derivation, D0's two |
| (the contract) `UNREALISABLE_AT` without the 4.5–4.7 entry | `generatorContract.test.ts`: "undoable, and not declared" (`checks/generatorContract-after-ownership.txt`) |

Not a mutant here: the two placements' lesson words, held by `lessonClaimsAboutApp` (the 3.5 duet) and `lessonClaimsAboutMusic` (4.3's *Melody*), and the placements themselves, held by `TheCoreBefore4_4` (red on the ownership build, above).

## Tests

| Step | Exit | Note |
| --- | --- | --- |
| `parity_reference.py` (`parity-reference.txt`) · copies (`copy.txt`) · `npm ci` | 0 · 1 each (robocopy: copied) · 0 | the fresh-worktree steps; the three MAESTRO recordings absent, skipped |
| `build.py --offline --out <abs>`, base (`content-build-base.txt`) | 0 | probe and table identical to L120b's final (`base-equals-L120b.txt`) |
| red runs (`red-green/`) | 1 each | as listed above |
| `build.py --offline --out <abs>`, after ownership | 0 | every file re-measured (`demands.json` is in the fingerprint); no row's demands moved but the stamps; validation OK |
| probe · table, after ownership | 0 · 0 | 222 · 221 options, 461 pairs |
| `generatorContract.test.ts`, after ownership (`checks/generatorContract-after-ownership.txt`) | 1 | the red line for Deviation 1; a first attempt did not start its worker and was rerun |
| `test_sixteenths_owner.py` after ownership (`red-green/green-…`) | 0 | 11 tests |
| `build.py --offline --out <abs>`, after placement, first | 1 | the validator: `docs/generated/ladder.md` stale; regenerated (`after-placement/ladder-report.txt`), then built again |
| `build.py --offline --out <abs>`, after placement | 0 | validation OK |
| probe · table, after placement | 0 · 0 | 219 · 218 options, 453 pairs |
| the reading-row probe (`after-placement/reading-rows.txt`) | 0 | 15 rows listed on rungs; 0 held phrases moved; 5 rows gain *add sixteenths* |
| mutants (`mutants.txt`) | 0 | 9 of 9 killed beyond the control |
| `checks_for_paths.py` (`checks-for-paths.txt`) | 0 | 24 of 24 paths matched: content-build, content-validate, review-check, content-tests, tsc, lint, unit, build-app, e2e (21 specs, 13 of them for `readingControls.ts`) |
| `validate.py --allow-nc --personal` (`checks/content-validate.txt`) | 0 | "218 rung-own options on 43 rungs … (453 option-demand pairs: A 3, B-claim 40, B-mapping 0, C-later 251, C-elsewhere 159, C-nowhere 0)"; no "taught at" warning |
| `review.py --check` (`checks/review-check.txt`) | 0 | — |
| `unittest discover -s tools/content/tests -t tools/content`, first (`checks/content-tests.txt`) | 1 | 1,547 tests, 4 skipped, 5 failures: the committed-reports pair (the restore protocol), `test_technique_units` (fixed, Deviation 3), the two `TheSubclasses` cases (revised, Deviation 5) |
| the same, second (`checks/content-tests-2.txt`) | 1 | 1,548 tests, 4 skipped; only the committed-reports pair fails (the restore protocol) |
| `TestTheReports` with the regenerated reports in place (`checks-reports-with-regenerated.txt`) | 0 | 9 tests; the committed reports then restored |
| `npx tsc -b` · `npm run lint` | 0 · 0 | — |
| `npx vitest run` (`checks/unit-summary.txt`) | 1 | 3 failed of 7,305: the recorded `lessonClaimsAboutApp` line-ending pair (blues.3, 4.7; Entry 101) and `expectedNote`'s every-black-key case; the new and revised rows and the contract pass |
| the failing files alone, with the contract and the music claims (`checks/unit-failures-alone.txt`) | 1 | only the recorded pair; `expectedNote` passes alone, read as load |
| `npm run build:app` (`checks/build-app.txt`) | 0 | — |
| the map's 21 e2e specs, 2 workers, port 4574, config copy under `build/l120c-e2e` (`checks/e2e.txt`) | 0 | 200 passed. Two earlier starts never loaded the copy (outside `app/` it loads as CommonJS: `import.meta`, then the chromium fixture imported both ways; `e2e-exit.txt`); the fixture's override is empty off the CI image, so the copy leaves it out |

Unverified:
- every musical reading, as music, and 4.4's words as teaching;
- the two replacements as repertoire for their rungs;
- the reading that jazz.4's comping teaches syncopation, beyond the vocabulary's sentence.

## Doc rows

- **`docs/02`, after *The reading and the gate corrected (L120b)*.** A new paragraph:

  > **Sixteenths have an owner (L120c, 2026-09-29).** Core 4.4 teaches written sixteenths as four even notes to the quarter-note beat, over Hanon Nos. 1–5 in 2/4 at the metronome (the reviewer's Question 3 on L120a, `responses/0bcd3be0.md`). The concept `sixteenth-notes` names `rhythm.sixteenths` (`claims.CONCEPT_DEMANDS`); 4.4, ragtime.5 and technique.6 name it, and `taughtAt` is 4.4 alone: ragtime.5 and technique.6 stand on it. latin.7 and holiday.7 inherit it; 3.5 teaches the pedal. jazz.4 names the syncopation its comping teaches, a teaching rung on a path that reaches neither 4.5 nor latin.3. The pre-4.4 core options that asked sixteenths were simplified (*Für Elise*, easy setting, at 3.4 and 4.2), replaced (Schumann's *Chorale* at 3.5, his *Melody* at 4.3) or moved (the easy *Canon* off 3.6; it stays at 4.6 and 4.7). The table went from 378 options (618 pairs, B-mapping 67) to 221 (461, 0) to 218 (453, 0).

  And in Part D, the Stage 3–4 song lines: 3.4 *Beethoven — Für Elise (easy)* for *(beginner)*; 3.5 *Schumann — Album for the Young, Op. 68 No. 4 "Chorale"* `[PDMX]` for *Pachelbel — Canon in D (easy)*; 3.6 without the Canon; 4.2 *Für Elise (easy)* for *(beginner)*; 4.3 *Schumann — Melody, Op. 68 No. 1* `[PDMX]` for the Canon.
- **`docs/03`, §3 step 8a (reports).** Append: "Since L120c `sixteenth-notes` is in `CONCEPT_DEMANDS`, and a `taughtAt` change reaches app code: `readingControls.UNREALISABLE_AT` declares every reading move the curriculum can ask that the generator cannot make, and `generatorContract.test.ts` holds it exact."
- **`docs/05` §8** (the table of undoable reading moves, rung by rung): 4.5–4.7 gain *sixteenths on, generator* ("Compound time at levels 1–4 is written in its three first figures…"); 4.4 makes it.
- **`docs/08`.** A new row:
  - Row name: **Sixteenths have an owner** (L120c).
  - What it covers: the mapping, the three claims and no others, `taughtAt` derived as 4.4 alone, taught on the paths through 4.4 and not off them, 4.4's words against the Hanon files and the click, the pre-4.4 core placements, the table's B-mapping at 0; jazz.4's syncopation claim.
  - What it guards against: the mapping removed; `taughtAt` reverted or given a second rung on 4.4's path; a claim added at latin.7, holiday.7 or 3.5, or removed at 4.4 or technique.6; the paragraph removed; a sixteenth placement returning before 4.4; jazz.4's claim or its `taughtAt` entry dropped.
  - Tests: `tools/content/tests/test_sixteenths_owner.py` (13); `tools/content/tests/test_taught_at.py` (`TestJazz4TeachesSyncopationOnItsOwnPath` 2); `app/tests/unit/lessonClaimsAboutApp.test.ts` (the 4.4 row); `app/tests/unit/generatorContract.test.ts` (4.5–4.7 declared).
  - Status: done (L120c); pinned by 9 mutants and the contract; unverified as music.

  And the file line: "`test_sixteenths_owner.py` — `sixteenth-notes` maps to `rhythm.sixteenths`, taught at 4.4 and on its paths, 4.4's words true of the Hanon files, no pre-4.4 core option asks sixteenths (L120c)"; `test_untaught_options.py`'s line becomes "pinned to L120c's final probe (219), the runtime reading row the one recorded difference".
