### Entry 108 — F2: placement reconciled with the measured claims — a rung claims only what its options establish or says it introduces the concept (`introduces`, which grants no taught status), the practice track's first rungs hold what a Stage 1 hand plays, the options whose notes their rung has not taught leave it where a later rung already lists them, theory.9 and the Latin rungs stop promising what they do not draw, the rock track no longer described as existing for seven songs, and the validator holding the rule; seven of the nine unkept claims stopped with the evidence and two questions (2026-09-29)

**The base of this worktree, first.** The worktree was created at `87a84d6`, not on D4's merge (`da9d0e7`): D4's code and the brief's applied change (`87e4e89`) are not in this tree. A fast-forward to `da9d0e7` was refused by the session's permission check, so F2 is built on `87a84d6`. I read the approved brief from `87e4e89` and D4's hunks from `da9d0e7` only to keep clear of them. What follows from that:

- The brief's "combined build" is this tree's build without D4. `claims.py` reads none of D4's fields (`provenance.identity`, `transferOf`), so the report should be the same on the merged tree (inferred, not run).
- No hunk of mine overlaps D4's. In `docs/02`, D4 is at line 956 of the old file and mine end more than fifty lines before it or start after it. In `test_measured_truth.py`, D4 is at the docstring (line 20) and after `TestThePromiseFact` (line 301); mine are at 672, 718 and the file's end.
- The Today card and the diaries ran without D4's transfer offer. For a freshly placed learner with no proficient skill, D4 offers nothing (inferred).
- The orchestrator's chain on the merged tree is the verification of all of it.

**Judgement.** Read from four things: the report regenerated on this tree's build; the notation of the options the report calls unkept; the Today card, four rung pages and the Library's rock rows at 342 × 740, before and after, as pictures and as DOM records (`docs/prompts/pictures/f2/before|after`); and the three learners' thirty mornings. Nothing was played or heard. Every musical observation here is from notation, against the rules and the detectors' readings, and is unverified as music.

- **Today at 1.5.** Before, five rows: the 2nd-or-3rd ear drill (warm-up), *Steps and Skips in C* (review), **Hanon No. 1 (C major) — both, L4.4, "How to practise asks for it"** (new), *Old MacDonald* (repertoire), sight-reading level 1. After, the same five with a different new row: **C major five-finger pattern — right, L1.1, RH, "How to practise asks for it"**.
  - Against the rules: Hanon No. 1 hands together carries four things a learner at 1.5 has not met — sixteenths (taught nowhere), ledger lines (3.4), both hands beyond a five-finger position (2.5) and hands together (2.1). The five-finger pattern is 1.1's own material: one hand, inside C position.
  - It sits below the learner's level. That fits a rung about how to practise (the method applied to easy material). It repeats the C-position right hand the review row already gives that morning. Both are observations, unverified as teaching.
- **Today at 2.2.** Identical before and after, in the DOM record and in the picture: rhythm reading with eighths, *Rhythm: eighths — 4 bars*, *London Bridge* (new), *Merrily We Roll Along* (repertoire), sight-reading level 2, right hand. The practice track draws no row there on this build. London Bridge's one note past the hand (A above G) and Merrily's one skip (E to G) stay on their rungs with the report's warning, for the reasons in the table.
- **`practice.1`'s page.** Start opened "Hanon No. 1 (C major) — both", "the first thing on this rung". It now opens "C major five-finger pattern — right". The list is the five-finger pattern (right), *Steps and Skips in C* and the rhythm drill.
- **`latin.3`'s page.** The page drew no duet button before or after (D3c), but the lesson said *Play it as a duet* opens the son clave over a pulse. It now says that exercise, the one with two staves, opens from its own row, which the page draws (▶ on that row). No song fills the unmet exercise ask (Q57).
- **`blues.5`'s page.** The lesson says the walking bass is introduced here. The exercise is the line alone (the page labels it "Left hand"). None of the rung's six pieces has one: three are right hand only, and three are shuffles over the boogie bass. The next rung puts a right hand over the line. Checked against the exercise's notation: root–third–fifth–approach in quarters, left hand only (C E G B into C; C E G E into F).
- **`rock.4`'s page.** Unchanged, and already what D18 says: power chords, ostinatos over a pedal bass, the minor vamp, *Greensleeves* with chords — public-domain technique material, with no song placeholder on it.
- **The Library's rock rows.** Searching "Linkin Park" lists the three rows with "import needed". The sheet says how to get the MusicXML in, and under "Play this instead" offers Chopin's E minor Prélude, *Gnossienne No. 1* and an A minor broken chord for the left hand. The rows serve the import path the owner described ("a learner finds them in the Library"), so they stay. The same sheet prints "What it trains: import-only" and "Tracks: film-game", internal ids on screen (a follow-up, not F2's).

**The finding that shaped the seam.** Seven of the nine claims no option keeps cannot be resolved honestly by moving the concept to `introduces`, the brief's outcome (b):

- **Two are hand readings on the core path: 1.5's leap and 3.1's accidentals.** Introducing them leaves no core rung that teaches either demand.
  - Measured on this build (`runs/F2/question-1-scenarios.txt`): notated rows with an untaught demand go 253 → 359, with leaps untaught on 333 of them and notes outside the key on 242; generated combinations go 91 → 248.
  - The reading rows, which are held to what their rung has taught, would stop writing leaps and accidentals anywhere on the core.
  - That contradicts the brief's own item 4, which names both as taught there. **Stopped** under question 1. A cheap path is measured there: S4 names leaps at 2.1 and accidentals at 3.3.
- **Five are the detectors' every-bar rule on whole pieces:** the walking bass on `blues.6`, `blues.8`, `jazz.6` and `jam.6`, and the oom-pah on `ragtime.5`.
  - By each option's own per-bar reading (the bridge's every-bar places), the walking-bass exercise walks in 11 of its 12 bars (3 of 4 in F). The failing bar returns to a pitch it has left, like C E G E — E22's recorded misreading.
  - The Joplin pieces carry a left-hand pattern in 87 of 92, 80 of 85, 87 of 94 and 109 of 148 bars.
  - "No piece here practises it", the prose outcome (b) asks for, would be false.
  - Introducing the walk on all four rungs would leave `jazz.9` as the only teaching rung, kept by the stride exercise E22 records as a misreading. It would also take the walk out of row 7's phrases at `jazz.8`, reversing E0b.
  - **Deferred** in the validator with those reasons, under question 2.
- **`blues.5`'s claim was the one honestly unkept.** Its one walking-bass exercise is the line alone, and the demand is a walk under a right hand. It is introduced there now, and `blues.6` teaches it.

**The nine claims, one by one** (outcome (c) — an item placed on a candidate-rungs line with a current `goodTeachingUse: yes` — is "not placed, no decision" for all nine: no item in the tree has a `yes`).

1. **1.5 — a leap (`interval.leap`), from `taughtAt` (hand reading).**
   - Established on 0 of 9 checked options. *The Water Is Wide* has one leap, D up to G, which is incidental.
   - (a) No option keeps it. (b) Would take leaps off the core path. (c) Not placed, no decision.
   - **Stopped:** unchanged and warned; question 1.
2. **3.1 — a note outside the key (`pitch.chromatic`), from `taughtAt` (hand reading).**
   - Established on 0 of 11. The rung's pieces are in G and F, with no note outside their key signature.
   - (a) No. (b) Would take accidentals off the core. (c) Not placed, no decision.
   - **Stopped:** question 1. 3.3's lesson teaches the raised seventh that "appears as an accidental every time it is used", and 4 of its 7 checked options establish it; that is the recommended home.
3. **`blues.5` — a walking bass (`texture.walking-bass`), from its concept.**
   - Established on 0 of 11. Its walking-bass exercise has no right hand, and the demand is a walk under one.
   - **(b): moved to `introduces`.** The lesson now says the walk is introduced here, that no piece on the rung has one, and that the next rung puts a right hand over it. `taughtAt` is re-derived: `blues.6` teaches it on the blues path.
   - (c) Not placed, no decision.
4. **`ragtime.5` — the oom-pah (`texture.left-hand-pattern`, concept `oom-pah-bass`).**
   - Established on 0 of 9 by the whole-piece rule. By the per-bar reading, the Joplin pieces carry the pattern in all but their opening and closing bars, and the waltz-bass *Greensleeves* in 15 of 16.
   - (a) Not by the report's reading. (b) Would say the pieces do not practise what they practise in nearly every bar. (c) Not placed, no decision.
   - **Deferred**, question 2. No gate change either way: 3.6 teaches the pattern, and it is on `ragtime.5`'s path.
5. **`technique.5` — syncopation (skill concept).**
   - Established on 0 of 15. The lesson never teaches syncopation; it teaches ties across the bar line, which its `tied-across-bar` concept claims (`rhythm.ties`).
   - **(b): removed from `concepts`.** No sentence said the rung teaches syncopation, so no prose changed. No `taughtAt` change: 4.5 teaches syncopation, on its path.
   - (c) Not placed, no decision.
6. **`jazz.6` — a walking bass (concept; a teaching rung).**
   - 0 of 12 by the whole-piece rule; by the per-bar reading, 11 of 12 bars (C blues) and 3 of 4 (ii–V–I in F).
   - **Deferred:** it stays a teaching rung; question 2. (c) Not placed, no decision.
7. **`blues.6` — a walking bass (concept).**
   - 0 of 8; by the per-bar reading, its exercise walks in 11 of 12 bars under a right hand.
   - **Deferred.** It is now the blues path's teaching rung by the derivation, since `blues.5` introduces the walk. (c) Not placed, no decision.
8. **`jam.6` — a walking bass (concept; a teaching rung).**
   - 0 of 5; the A blues exercise walks in 11 of 12 bars, and the three intro exercises are the line alone.
   - **Deferred.** (c) Not placed, no decision.
9. **`blues.8` — a walking bass (concept).**
   - 0 of 6; the E-flat exercise walks in 11 of 12 bars, and its failing bar 4 (E♭ G B♭ G) returns to a pitch.
   - **Deferred.** (c) Not placed, no decision.

**The report, before and after, on this tree's build** (`runs/F2/before/`, `runs/F2/after/`):

| | Before | After | Why |
| --- | --- | --- | --- |
| Rung options | 1,021 | 1,015 | six option listings left rungs (the five-finger pattern off 1.1 and 1.3, the inversions, the A minor arpeggio, *10,000 Reasons*, row 7 off `theory.9`) and `practice.1`/`practice.2` swapped Hanon and the scale for the floor |
| Option-claim pairs / checkable | 687 / 592 | 637 / 546 | `blues.5`'s, `latin`'s and `technique.5`'s concept claims gone; 1.1's steps moved from the `taughtAt` reading to its concept; the options above |
| Established / not established | 236 / 356 | 232 / 314 | four established pairs gone: `latin`'s walking-bass claim, established on the walking-bass exercise it lists, left with the concept; the both-hands five-finger pattern established 1.1's steps and 1.3's bass clef (demand and skill) and left both rungs |
| Rung claims kept by no option | 9 | 7 | `blues.5` introduced, `technique.5` removed; the seven left are the two stopped hand readings and the five deferrals |
| Concepts introduced | — | 1 | `blues.5`'s walking bass, established on 0 of 11 |
| Measured options establishing none of their rung's claims | 156 | 146 | |
| Notated rows untaught on the earliest rung | 252 | 253 | −1 *10,000 Reasons*; +2 *Steps and Skips in C* on `practice.1` and `practice.2`, whose path runs through 0.4 only (the practice rungs carry no prerequisites: L109's data half) |
| Generated combinations untaught on their rung | 124 | 91 | 34 gone (Hanon ×18 on the two practice rungs, the level-4.1 scale ×7, the both-hands five-finger ×4, the inversions ×3, the arpeggio ×2), 1 new (the five-finger right on `practice.2`); D0's record rewritten from the report's functions and matching |

## The mechanism

**What was wrong.** The report measured each rung's claims, and nothing tied the curriculum to it. A rung could name a measurable concept that none of its options practises, and the build warned and went on. The first marker the brief proposed was a lesson's word that a promise is "not yet kept", read only by the validator. The reviewer's objection (`responses/12af708.md`): `taughtAt` is derived from `concepts`, and the gate reads `taughtAt`, so such a marker lets the report pass while the learner's gate still treats the demand as taught.

**The structural marker.** `introduces` sits beside `concepts` in the stage files, and its semantics are fixed across the derivation and every consumer:

- `claims.teaching_rungs` reads `concepts` alone, so an introduced concept never makes its rung a teaching rung.
- `claims.introduced_of` lists it in the report as *introduced*, which is no claim.
- `validate.taught_at_findings` refuses a listed rung that only introduces the demand, even where a `taughtAtNote` reads it by hand.
- The evidence gate's requirement check reads `targetSkills`, so an introduced skill meets no requirement.
- The app reads `taughtAt` and never a lesson's lists.

**The rule the validator holds** (`validate.concept_claim_findings`, over the report's one reading of "establishes"):

- It **fails** where a rung's `concepts` name a measurable skill or demand that no checkable option establishes, where a concept sits in both lists, and where a deferral no longer describes the build.
- It **warns** for each deferral, with its reason, and where an option establishes a concept the rung only introduces: it belongs in `concepts`.
- The 467 claims no detector can measure stay a warning (`rung_claims_warning`).
- This proves the rungs agree with the report, not that either is true (Part 10's permanent rule).

**Discriminating tests.**

- A fixture rung naming a demand its option lacks fails; the same concept under `introduces` passes; the same with an establishing option passes, and under `introduces` it is warned back.
- A fixture path where the earlier rung only introduces a walk leaves a later option untaught; the same rung naming it in `concepts` teaches it. This is checked through the build's derivation and `untaught_on`, and in the app through `taughtAtRung` and the swap sheet.
- A `taughtAt` listing an introducing rung fails even with a hand-reading note.
- A required skill that the rung only introduces, with no declaring option, fails the evidence gate as it did before.
- On the shipped data: `blues.5` is untaught for the walk and `blues.6` taught (red on the committed vocabulary).
- Per claim, the per-bar reading tells a whole-piece artefact from a real absence: blues.5's exercise walks in 0 of 12 bars (no right hand), where blues.6's walks in 11 of 12.

**Placement rule applied, in one line** (the brief's goal: "no option is added to any rung without a current teaching-use decision on its identity"; the dispatch: nothing placed without a current `yes`).

- An option whose notes its rung has not taught was **moved only by leaving that rung**, where a later rung on the same track already lists it and teaches everything it carries.
- The report's other destinations are named per row as proposals (code A in the table) and question 3.
- The practice floor lists items the Stage 1 core rungs already list, none of which D3a's admission holds for a decision: a generated five-finger drill, two runtime drills and the authored steps-and-skips study. D21's three-exercise minimum made a replacement for Hanon necessary.

## Done

1. **Claims reconciled (item 1).**
   - Technically: 49 rung claims are kept by at least one option and stay under (a). Their unestablished pairs are options that do not carry the claim, which is diagnostic and, in the reviewer's words, "not a license to call music unsuitable without review".
   - `blues.5`'s walking bass is (b), introduced; `technique.5`'s syncopation is (b), removed.
   - Seven are stopped or deferred with the evidence above. (c) placed nothing, as no item has a `yes`.
   - Pedagogically: the two changed lessons say what the rung does. `blues.5` introduces the line hands separately and the next rung puts it under a right hand, which is a common order of teaching a walking bass. That ordering is the curriculum's, read from the notation, and unverified as music.
2. **Untaught on the earliest rung, per option (item 2).** All 353 rows are in the table below: moved 4 and removed for the floor 4; the other 345 stay with the report's warning, each with its reason. By code: N 193 (a demand taught nowhere, all but a handful sixteenths), A 80, P 52, L 13, I 5, D 1, T 1. The practice floor adds 4 new rows, explained.
   - Moved: the both-hands five-finger pattern off 1.1 (and off 1.3, where it was untaught too; 2.1 keeps it), the inversions (level 4.3) off 2.3 (4.3 keeps them), the two-octave A minor arpeggio (level 5.1) off 3.3 (3.6 keeps it), and *10,000 Reasons* (level 5.69) off the Stage 3 `hymns` rung (`hymns.6` keeps it).
   - Left, by judgement against the rules:
     - Merrily's one skip, the G five-finger pattern's printed but never-played F sharp, London Bridge's one note past the hand and the swing pair's shift are incidental.
     - 2.3's voice-led cadence would leave 2.3 two exercise options.
     - *Careless Love*, 3.2's G cadence, *What a Friend* and ten more are named by their lessons.
     - The A minor ostinato's only later listings are on other tracks.
3. **The practice track's floor (item 3; L104).**
   - `practice.1` now lists the right-hand five-finger pattern, *Steps and Skips in C* and the rhythm drill, which are the brief's three kinds.
   - `practice.2` now lists the right-hand five-finger walk, the five-finger pattern and the steps-and-skips study.
   - Hanon No. 1 stays on 4.4, `technique.4` and `classical.4`. The level-4.1 hands-together scale left `practice.2` and is on no rung (it stays in the Library).
   - The Today card at 1.5 changed as above, and the new row is the five-finger pattern (right).
4. **Concepts named where taught (item 4; L110).**
   - 1.1 names `steps`, and its claim is established on 9 of 9.
   - `latin` no longer names walking-bass; its lesson teaches a tumbao. `taughtAt` was re-derived and is unchanged there, since `latin` was never listed; the build's warning for it is gone.
   - `theory.9`'s sentence now describes the level-6 row it lists: keys up to four sharps or flats, triplets, a left hand in broken chords.
   - Row 7 left `theory.9`. Held to theory.9's path, it wrote no walking bass, and that was the one thing parting it from the level-6 row. It stays on `jazz.8`.
   - `PROMISED_OFF_THE_PATH` is empty, with the reason.
   - 1.5's leap and 3.1's accidentals are stopped (question 1).
5. **The Latin lessons (item 5; L111, Q57).**
   - `latin.3` and `latin` carry no duet tool, and their paragraphs name none. Each tells the learner the two-staff exercise opens from its own row.
   - The exercise asks stay unmet, and no song is substituted.
   - `lessonClaimsAboutApp`'s two duet rows are revised to hold that no duet is claimed while the groove has no decision.
6. **The rock promise unwound (item 6; I4).**
   - No rung lists a `song.rock.*` id: the stage files and `docs/02` were searched. Part D's paragraph and Part F's list are rewritten to the owner's decision and D18.
   - `pdmx-wants.json`'s note no longer calls the songs "the reason the rock track exists at all".
   - The seven rows stay, because the Library draws them usefully (above). Their `editionNotes` no longer say a module points at them. `test_pdmx`'s want check is unchanged, because the placeholders remain; it passes.
7. **The validator holds the rule (item 7).** As above, with the introduced-versus-taught path tests in `test_taught_at.py` and `taughtByAncestry.test.ts`, and the requirement regression in `test_validate_claims.py`.
8. **Record (item 8).**
   - `docs/02`: Part C 1.1 and the practice floor (D8a); Part D's blues table rows 5 and 6 and the rock paragraph; Part E2's ancestry note and a new F2 note; Part F's import list; and Part G's placement rule in the reviewer's words.
   - Regenerated: the rung-claims report and inventory, and `docs/generated/ladder.md` (the validator refused the stale one).
   - D0's record was rewritten from the report's functions, after a byte round-trip check.
   - The three learners' diaries were rerun and compared (below). The `docs/08` rows are at the end.

## Not done

- **1.5's leap and 3.1's accidentals (items 1 and 4).** Stopped: the brief's premise fails there (question 1).
- **The walking bass on `blues.6`, `blues.8`, `jazz.6`, `jam.6` and the oom-pah on `ragtime.5` (item 1).** Deferred by the validator, not resolved (question 2).
- **The 80 option rows whose report destination does not list them (item 2, code A).** Moving them would add an option to a rung, which no teaching-use decision covers. The destination is named per row (question 3).
- **`practice.3`–`practice.5`.** Their lists still hold items above Stage 1: the both-hands five-finger pattern on `practice.3` and `practice.4`, and the level-4.1 contrary scale and G five-finger both on `practice.5`. The brief named "the early practice rungs" and the two Hanon rungs were those. This is a follow-up.
- **2.3's voice-led cadence in C.** Not moved: 2.3 would fall below D21's three exercise options.
- **`docs/08`.** Not edited (it is E2's file); the rows are below.
- **The combined tree.** D4 is not in this worktree (above); the merged run is the orchestrator's.

## Follow-ups

- **P1, curriculum data (L109's data half):** the practice rungs carry no `prerequisites`, so the ancestry model opens each after Stage 0. The floor's steps therefore read as untaught on `practice.1` and `practice.2`, and every Stage 1 practice rung's steps are untaught in the report.
- **P1, detectors (E22 with the density owner):** the walking-bass and left-hand-pattern rules demand every bar of a whole piece, and the walking-bass rule refuses a bar that returns to a pitch. That refuses the root–third–fifth–approach walk the app generates, and a rag's introduction fails the oom-pah. Reading these two demands on a whole piece as a share of bars (as E1's cut rule already reads a passage) would settle question 2 without a curriculum change, and would expose the deferrals as stale.
- **P1, vocabulary (L101):** sixteenths are taught at no rung, so 193 option rows stay untaught wherever they are listed, Hanon among them.
- **P2, an app consumer of `concepts` that `introduces` bypasses:** `rungState.carriedExposures` (`app/src/evidence/rungState.ts`) turns a carried-over rung's `concepts` into exposure events. An exposure is an introduction, exactly what `introduces` means. A learner who carried `blues.5` over from before C5 therefore no longer gets a walking-bass exposure, nor `technique.5`'s syncopation or `latin`'s walking bass (the last two correctly, since those lessons never taught them). The fix is to read `introduces` there too; it is the app's code, not F2's, and it changes no requirement or evidence. `assignSheet`'s default concepts read `concepts` alone as well.
- **P2, the Library sheet (no ids on screen):** the rock placeholders print "What it trains: import-only" and "Tracks: film-game".
- **P2, wording outside my files:** `docs/03` line 72 ("the rock-module and *Beautiful* wish-list songs", E2's file) and `app/src/curriculum/session.ts` line 1562 ("A rock-module song you have not imported") still use the old frame.
- **P2, placement proposals:** the 80 code-A rows are the report's own destinations, ready for a teaching-use decision; `practice.3`–`practice.5` as above.
- **P3:** `theory.9`'s "the only way sight-reading can be practised at all" is an absolute for F3's voice pass. On `practice.1`'s page the rhythm drill's row reads "Hands together" (the runtime drill's `hands` field).

## Questions

1. **Where are leaps and notes outside the key taught on the core?**
   - The brief's item 4 names 1.5 and 3.1. Items 1 and 7 with the reviewer's semantics make a claim no option keeps an introduction, never taught. On these two, that takes the demand off the whole core path: S1, notated untaught rows 253 → 359 and generated combinations 91 → 248, with the reading rows no longer writing leaps or accidentals on the core.
   - Recommendation, **S4**: 1.5 and 3.1 introduce them, 2.1 names `leaps`, and 3.3 names `accidentals`.
     - 2.1's left hand moves C–F–G and 6 of its 10 checked options establish leaps; its lesson would need a sentence.
     - 3.3's lesson already teaches the raised seventh as an accidental, and 4 of its 7 options establish it.
     - Measured: notated untaught rows 253 → 254, with leaps untaught on 16 and accidentals on 19; generated combinations 91 → 95.
   - It changes what the gate and the reading rows count as taught on the core between 1.5 and 2.1 and between 3.1 and 3.3. It is pedagogy, so it is not decided here.
2. **The five deferred claims.**
   - Keep the deferrals until the detector or density owner reads every-bar demands on whole pieces as a share of bars (then the claims are kept as they stand), or apply (b) now.
   - (b) now: the walking bass taught only at `jazz.9` by the stride misreading, the walk gone from row 7's phrases at `jazz.8`, and prose that would have to avoid the false "no piece here practises it".
   - Is a validator deferral with its reason, which grants no taught status and fails once stale, acceptable against the reviewer's required change? The report still lists these as claims no option keeps; only the build passes.
3. **May item 2 add an admitted option to a rung that does not list it?** The brief's item 2 reads "move it to the earliest rung whose ancestry has taught every demand it carries". Its goal and the dispatch read "no option is added to any rung without a current teaching-use decision". I took the second: 4 moves by removal, 80 proposals named. For items the admission takes without a decision (generated drills, notated songs), the first reading would allow more.
4. **The base.** This worktree is `87a84d6` plus F2, and D4 (`da9d0e7`) is not in it. The merge onto `da9d0e7` should be clean by the hunk positions (above); the chain there is the first run of F2 with D4.

## Files

In the worktree (`C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-ac73b3099fb819fef`), nothing committed and nothing added to the index:

- **Changed:**
  - Stage files: `content/curriculum/stage-1.json`, `stage-2.json`, `stage-3.json`, `stage-5.json` and `stage-9.json`, re-serialised after a byte round-trip check (indent 2, UTF-8, CRLF kept).
  - Vocabulary and schema: `content/curriculum/vocabulary/demands.json` and `content/curriculum.schema.json`, spliced as text.
  - Lessons: `content/lessons/blues.5.md`, `latin.3.md`, `latin.md` and `theory.9.md`.
  - Rock unwinding: `content/sources/pdmx-wants.json` (the note) and `content/catalog.static.json` (the seven rows' `editionNotes`, spliced).
  - Code: `tools/content/claims.py` (`introduced_of`, the report's introduced rows and section) and `tools/content/validate.py` (`concept_claim_findings`, `DEFERRED_CONCEPT_CLAIMS`, the introducing-rung refusal in `taught_at_findings`, `introduces` in `unknown_concepts`, the wiring in `main`).
  - Tests and fixture: `tools/content/tests/test_taught_at.py`, `test_measured_truth.py` and `fixtures/untaught_on_rung.json`; `app/tests/unit/taughtByAncestry.test.ts`, `sightReadingPromises.test.ts`, `helpers/promises.ts`, `lessonShape.test.ts` and `lessonClaimsAboutApp.test.ts`; `app/tests/e2e/today.spec.ts`.
  - Docs: `docs/02-curriculum.md`; `docs/prompts/rung-claims.md`, `docs/prompts/inventory.md` and `docs/generated/ladder.md` (regenerated).
- **New:** `tools/content/tests/test_validate_claims.py`.
- **Outside the brief's list, and why:**
  - `content/curriculum.schema.json`: `introduces` documented beside `concepts`. The lesson schema accepts unknown keys, so this adds nothing a build needs.
  - `lessonShape.test.ts`: it pins theory.9's sentence to the generator's table.
  - `docs/generated/ladder.md`: the validator refuses a stale one after options move.
- **Not changed:** the app's code; the detectors and the density file; `build.py`; E2's files; the record and the contracts. `content/scores/imported/SOURCES.md` was restored to HEAD's bytes after each build.
- **Captures:**
  - Runs: `docs/prompts/runs/F2/` — `*.txt` summaries with exit codes beside short `*.log`s, `before/` and `after/` report markdown, `diaries-before/`, `diaries-after/`, `diaries-compared.txt`, `question-1-scenarios.txt`, `record-moves.txt`, and `red-content.txt`, `red-app.txt`, `red-e2e-today.txt`.
  - Pictures: `docs/prompts/pictures/f2/before|after/` — Today at 1.5 and 2.2, the four rung pages, the Library's rock rows, each as a picture, a full-page picture and a DOM record.
  - The Playwright override and the look spec: `app/.probe/playwright.f2-4193.config.ts` and `app/.probe/look.spec.ts` (gitignored).

## The red lines

Each was seen before the change it proves, for its reason. The captures are in `runs/F2/red-content.txt`, `red-app.txt` and `red-e2e-today.txt`.

- **Content, on the baseline build and the committed `claims.py` and `validate.py`:**
  - `test_validate_claims.py`: 10 of 11 red. `module 'validate' has no attribute 'concept_claim_findings'` ×8. The unknown `introduces` concept not refused: `False is not true : []`. The introducing rung accepted in `taughtAt`: `a hand-reading note must not make an introducing rung a teaching rung`. The requirement pin is green by design; it holds a rule that already existed.
  - `test_taught_at.py`: 4 red. `['blues.5', 'latin', 'jazz.6', 'jam.6'] != ['blues.6', 'jazz.6', 'jam.6']`; `['blues.5', 'jazz.6', 'jam.6'] != ['blues.6', 'jazz.6', 'jam.6']`; `4 != 2` (the four E0b warnings); `[] != ['texture.walking-bass']` at `blues.5`. The fixture path cases are green by design, since the committed derivation already ignored an unknown key.
  - `test_measured_truth.py`, selected: 15 failures and 2 errors. `DEFERRED_CONCEPT_CLAIMS` missing; Hanon still on `practice.1` and `practice.2`; the level-4.1 scale on `practice.2`; `drill.reading.sight-reading-7` on `theory.9`; "module" in the placeholders' `editionNotes`; `'texture.walking-bass' not found in []` for `blues.6`'s coverage; each moved option still on its rung.
- **App, on the baseline build and data:** 7 F2 reds (and the two CRLF reds).
  - `taughtByAncestry`: `texture.walking-bass at blues.5, which introduces it: expected true to be false`; `expected [] to deeply equal [ 'texture.walking-bass' ]` (the demand tier at `blues.6`); `blues.5’s introduces list names the walking bass`.
  - `sightReadingPromises`: `drill.reading.sight-reading-7 (jazz.8, theory.9) at theory.9: a walking bass in 0 of 40 phrases: expected +0 to be 40`, with `PROMISED_OFF_THE_PATH` emptied.
  - `lessonShape`: `theory.9.md no longer says this`.
  - `lessonClaimsAboutApp`: the `latin.3` and `latin` no-duet rows.
- **Browser, on the baseline build (port 4193):** the Today spec's F2 case, `expect(locator).toHaveCount(expected) failed — Expected: 0, Received: 1` (a Hanon row on the 1.5 card); 16 others passed.
- **Reds after the change, fixed forward:**
  - `test_taught_at`'s `test_two_paths_two_rungs` and `test_jazz_6_naming…` listed `blues.5`, which the new rule refuses; revised to `blues.6`.
  - `lessonShape`'s reading time: `blues.5.md says 3 min for 601 words` after the first wording. The paragraph was tightened, not the cap.
  - `test_measured_truth`'s moved list named the 2.3 cadence I had not moved; corrected.
  - The derivation order `['jazz.6', 'blues.6', 'jam.6']`: `taughtAt` rewritten in the curriculum's order, as E0b wrote it.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `tools/content/tests/test_validate_claims.py` | add | — | a concept no option establishes fails in `concepts` and passes under `introduces`; kept by an option passes; a rung with nothing checkable is not judged; an introduced concept an option establishes is warned back; both lists fail; a deferral warns with its reason and fails once stale; an introduced skill meets no requirement (the evidence gate, pinned); `taughtAt` may not name an introducing rung whatever its note; an unknown `introduces` concept is refused |
| `test_taught_at.py` › `TestIntroducedIsNeverTaught` (2), `test_blues_5_introduces_it_and_blues_6_teaches_it` | add | — | the fixture path, introduced against taught, through `teaching_rungs` and `untaught_on`; the shipped `blues.5`/`blues.6` |
| `test_taught_at.py` › `test_the_committed_lists_are_the_lessons_readings` | revise | four warnings (1.1's steps, 1.5's leap, 3.1's accidentals, `latin`) | two: 1.5's leap and 3.1's accidentals, the stopped hand readings |
| `test_taught_at.py` › `test_the_walking_bass_is_taught_on_three_paths`, `test_the_rungs_whose_concepts_name_a_demand_one_per_path` | revise | `blues.5` teaches the walk; the derivation gives `latin` too | `jazz.6`, `blues.6`, `jam.6`, in the curriculum's order; the `latin` exception gone |
| `test_taught_at.py` › `test_two_paths_two_rungs`, `test_jazz_6_naming_the_walking_bass_must_make_the_list` | revise | `blues.5` may be listed | `blues.6`: an introducing rung may not be |
| `test_measured_truth.py` › `TestPlacementReconciled` (7) | add | — | every claim no option keeps is introduced, deferred or a stopped hand reading, and nothing else; the validator's rule holds on the build; `blues.5` introduced; the concepts where taught and dropped where not; the moved options gone and taught where they stay; the practice floor from the Stage 1 core lists; no rung lists a rock placeholder and the Library keeps them; `theory.9` promises no walk and the Latin rungs no duet |
| `test_measured_truth.py` › `test_a_demand_taught_on_two_paths…` | revise (one line) | the inventory's `blues.5` teaches the walk | `blues.6` does, `blues.5` does not |
| `fixtures/untaught_on_rung.json` | revise | 124 combinations | 91, rewritten by the report's functions after a round-trip check (34 gone, 1 new, `record-moves.txt`); 307 lines removed, over the diff-growth hook's threshold by design |
| `app/tests/unit/taughtByAncestry.test.ts` › `a demand a rung only introduces is not taught (F2)` (3) | add | — | constructed: A.5 introduces, nothing listed, the walk refused on A.6's sheet; A.5 teaches it, offered; shipped: `blues.5` introduces, is not listed, is untaught; `blues.6` taught |
| `taughtByAncestry.test.ts` › *the walking bass is taught at blues.6…*, the demand tier line | revise | `blues.5` teaches it | `blues.6` does; `blues.5` introduces |
| `sightReadingPromises.test.ts` › `PROMISED_OFF_THE_PATH` | revise | row 7's walk at `theory.9` promised off the path | empty: row 7 left `theory.9`; the list stays to name the next one |
| `helpers/promises.ts` › `PROMISED_BY_RUNG['theory.9']` | revise | level 7, "a walking bass" | the level-6 sentence: a key with four sharps or flats, triplets, a left-hand pattern |
| `lessonShape.test.ts` › the theory.9 quote | revise | level 7's `leftHand: 'walking'` | level 6's `leftHand: 'broken'` |
| `lessonClaimsAboutApp.test.ts` › the `latin.3` and `latin` duet rows | revise | the rung carries a duet naming its two-staff groove | no duet tool, the groove music with no decision, the songs on one staff |
| `app/tests/e2e/today.spec.ts` › *the practice track’s floor (F2)* | add | — | placed at 1.5, no Hanon row, the practice row the five-finger pattern (right), at 342 × 740 |
| every other test | preserve | — | see the runs |

## Checks (unpiped; exit codes read; `runs/F2/`)

| Run | Exit | What it said |
| --- | --- | --- |
| `npm ci` (app) | 0 | — |
| the copies (kern, musetrainer, `build/cache/convert`, the three caches, `build/midi-real`) | robocopy 1 each | "files copied" |
| `python tools/midi-cleanup/tests/parity_reference.py` | 0 | seven reference files, after `build/midi-real` was copied (a first run skipped the three real inputs) |
| `python tools/content/build.py --offline`, baseline | 0 | 2,090 items; reports "592 checkable claims on 1021 options: 356 not established, 9 kept by no option"; the markdown identical to the committed apart from line endings |
| the diaries, baseline (`C4C_DIARY`, `C6_DIARY`) | 0 | 25 passed |
| `npm run build:app`, baseline | 0 | — |
| the Today spec, baseline, port 4193 | 1 | 16 passed, 1 failed: the F2 case (red line) |
| the look, baseline | 0 | 7 passed |
| content reds (`test_validate_claims`, `test_taught_at`, `test_measured_truth` selected) | 1, 1, 1 | the red lines |
| app reds (the four files) | 1 | 9 failed: 7 F2's, 2 CRLF |
| the build, first F2 build | 1 | `docs/generated/ladder.md is stale`; then `ladder_report.py` 0 and `validate.py` 0 |
| `build.step_reports` alone, three times around the record rewrite | 0 each | "546 checkable claims on 1015 options: 314 not established, 7 kept by no option" |
| content suites, first run after | 1, 1, 0, 0, 0 | the fixed-forward reds above |
| `npx tsc -b` | 0 | — |
| `npx eslint` on the six touched TypeScript files | 0 | — |
| `python tools/content/build.py --offline`, final | 0 | the same counts; validation OK |
| `test_measured_truth`, `test_taught_at`, `test_validate*`, `test_pdmx`, `test_measured_demands`, final | 0 each | 50 OK, 18 OK, 106 OK, 123 OK (1 skipped), 8 OK |
| `python tools/content/validate.py`, final | 0 | OK; warnings: the two hand readings, the rung-claims line, the five deferrals |
| `taughtByAncestry`, `sightReadingPromises`, `lessonClaimsAboutApp`, `lessonShape`, final | 1 | 378 passed, 2 failed: `lessonClaimsAboutApp` › `blues.3` and › `4.7`, which match a literal LF in `ScoreScreen.ts` and `style.css`, both CRLF in this checkout and untouched (E0, E0a and E0b recorded the same) |
| the diaries, final | 0 | 25 passed |
| `npm run build:app`, final (nothing on 4193) | 0 | — |
| the Today spec, final, port 4193 | **0** | **17 passed** |
| the look, final | 0 | 7 passed; nothing left on 4193 |

## The three learners' diaries

**No morning changed:** 0 of 90, and the five files are byte-identical (`runs/F2/diaries-compared.txt`). Every move is accounted for:

- The three learners run the core track alone (`activeTracks: ['core']` in both diary files), so the practice floor never reaches them.
- The one moved option they meet, the two-octave A minor arpeggio, appears on 3.6's card and in 4.3's and 4.6's swap sheets. Those rungs keep it. It never reached the intermediate's card or sheets on 3.3 (day 3's review row was the minor chord changes), because the gate refused it there as untaught.
- None walks the blues, Latin, hymns or theory tracks.
- The swap-sheet lines are unchanged too, because every option that left a core rung was one the gate already refused there.

The learner-facing change is on the Today card at 1.5, where the practice track is on by default. The Today spec and the pictures show it.

## Unverified, beside what passes

1. **Nothing was heard.** The walking-bass exercises "walk" by their notation and the detector's per-bar reading; the Joplin pieces' oom-pah is the per-bar reading. The five-finger pattern as the 1.5 practice row, and every lesson sentence changed here, are unverified as music and as teaching.
2. **The per-bar counts are the detector's own readings of each bar** (the bridge's every-bar places, E1), not a musician's.
3. **The merged tree with D4 was not built or run here** (above).
4. **The Today card at 2.2 and every rung page other than the four named were not looked at.** The unit and browser checks cover the gate's behaviour, not the screens.
5. **Question 1's S4 numbers are the report's functions on a modified curriculum in memory.** The lesson sentence 2.1 would need is not written, and the reading rows' behaviour under S4 was not generated.

## The per-option table: every option untaught on its earliest rung

- **M** — moved: removed here; stays at the rung named, whose path teaches all it carries
- **R** — removed for the practice floor (item 3)
- **N** — left: a demand it carries is taught nowhere (taughtAt [])
- **A** — left: no later rung on its path lists it; the report's reading would move it to the rung named, which does not list it (adding it needs a teaching-use decision)
- **P** — left: no rung on its path teaches all it carries
- **I** — left: the untaught demand is present only below the useful density
- **L** — left: its rung's lesson names it
- **D** — left: the rung would fall below D21's three exercise options
- **T** — left: the only later listings are on other tracks

Before: 353 rows (A 80, D 1, I 5, L 13, M 4, N 193, P 52, R 4, T 1); new after: 4.

| Rung | Option | Untaught demands | Outcome | Detail |
| --- | --- | --- | --- | --- |
| 0.3 | `song.folk.hot-cross-buns` | interval.step, interval.skip, rhythm.eighths, rhythm.shorter-than-quarter | A | 2.2 |
| 1.1 | `exercise.five-finger.c-major.both` | clef.bass, texture.hands-together | M | 2.1 (also removed from 1.3, where it was untaught too) |
| 1.1 | `exercise.five-finger.g-major.right` | key.signature | I | key.signature: the G position's five notes never play its F sharp |
| 1.1 | `exercise.riff.c.falling` | interval.skip | A | 1.5 |
| 1.1 | `song.folk.mary-had-a-little-lamb` | interval.skip | A | 1.5 |
| 1.1 | `song.folk.merrily-we-roll-along` | interval.skip | I | one skip, E to G inside C position, read by letter name as 1.1 teaches |
| 1.1 | `song.folk.au-clair-de-la-lune` | interval.skip | A | 1.5 |
| 1.1 | `song.folk.kum-ba-yah.pdmx` | interval.skip, interval.leap, range.beyond-position | A | 2.5 |
| 1.2 | `song.folk.lightly-row` | interval.skip | L | the lesson names it; also listed at 1.5, where it is taught |
| 1.2 | `song.holiday.jingle-bells.rh` | interval.skip, interval.leap | L | the lesson names it; also listed at holiday, where it is taught |
| 1.2 | `song.folk.twinkle.rh` | interval.leap, range.beyond-position | A | 2.5 |
| 1.2 | `song.folk.frere-jacques` | pitch.ledger, interval.skip, interval.leap, rhythm.eighths, rhythm.shorter-than-quarter, range.beyond-position | A | 3.4 |
| 1.2 | `song.classical.ah-vous-dirais-je-maman.pdmx` | interval.leap, range.beyond-position | A | 2.5 |
| 1.3 | `exercise.five-finger.g-major.left` | pitch.ledger, key.signature | A | 3.4 |
| 1.3 | `song.folk.hot-cross-buns.lh` | pitch.ledger, interval.skip, rhythm.eighths, rhythm.shorter-than-quarter | A | 3.4 |
| 1.3 | `song.folk.mary-had-a-little-lamb.lh` | pitch.ledger, interval.skip | A | 3.4 |
| 1.3 | `song.classical.ode-to-joy.lh` | pitch.ledger | A | 3.4 |
| 1.4 | `song.folk.when-the-saints.alternating` | interval.skip, interval.leap, rhythm.syncopation | A | latin.3 |
| 1.5 | `song.folk.old-macdonald` | range.beyond-position | A | 2.5 |
| 1.5 | `song.folk.the-water-is-wide.pdmx` | rhythm.eighths, rhythm.shorter-than-quarter, rhythm.dotted-quarter, rhythm.ties, rhythm.syncopation, key.signature, range.beyond-position | A | 4.5 |
| practice.1 | `exercise.hanon.01.both` | clef.bass, pitch.ledger, interval.step, interval.skip, interval.leap, rhythm.shorter-than-quarter, rhythm.sixteenths, range.beyond-position, texture.hands-together | R | Hanon stays on 4.4, technique.4 and classical.4; sixteenths are taught nowhere |
| practice.1 | `exercise.five-finger.c-major.both` | clef.bass, interval.step, texture.hands-together | R | hands together is 2.1's; stays on 2.1, practice.3 and practice.4 |
| practice.1 | `song.classical.ode-to-joy.rh` | interval.step | P |  |
| practice.2 | `exercise.hanon.01.both` | clef.bass, pitch.ledger, interval.step, interval.skip, interval.leap, rhythm.shorter-than-quarter, rhythm.sixteenths, range.beyond-position, texture.hands-together | R | as on practice.1 |
| practice.2 | `exercise.scale.c-major.1oct.similar.both.2` | clef.bass, interval.step, rhythm.eighths, rhythm.shorter-than-quarter, range.beyond-position, texture.hands-together, texture.left-hand-pattern | R | level 4.1, hands together in eighths; on no other rung, in the Library |
| practice.2 | `song.classical.ode-to-joy.rh` | interval.step | P |  |
| practice.3 | `exercise.five-finger.c-major.both` | clef.bass, interval.step, texture.hands-together | P |  |
| practice.3 | `song.folk.mary-had-a-little-lamb` | interval.step, interval.skip | P |  |
| practice.4 | `exercise.five-finger.c-major.both` | clef.bass, interval.step, texture.hands-together | P |  |
| practice.4 | `exercise.five-finger.c-major.right` | interval.step | P |  |
| practice.5 | `exercise.five-finger.g-major.both` | clef.bass, pitch.ledger, interval.step, key.signature, texture.hands-together | P |  |
| practice.5 | `exercise.scale.c-major.1oct.contrary.both.2` | clef.bass, interval.step, rhythm.eighths, rhythm.shorter-than-quarter, range.beyond-position, texture.hands-together, texture.left-hand-pattern | P |  |
| practice.5 | `song.classical.ode-to-joy.rh` | interval.step | P |  |
| 2.1 | `exercise.coordination.g.hold` | key.signature | A | 3.1 |
| 2.1 | `exercise.ostinato.a.fifths` | rhythm.eighths, rhythm.shorter-than-quarter, range.beyond-position | A | 2.5 |
| 2.1 | `song.folk.twinkle.ht` | range.beyond-position | A | 2.5 |
| 2.1 | `song.folk.simple-gifts.pdmx` | rhythm.eighths, rhythm.shorter-than-quarter, rhythm.dotted-quarter, range.beyond-position | A | 2.5 |
| 2.2 | `exercise.swing-pair.c` | range.beyond-position | I | range.beyond-position present only incidentally |
| 2.2 | `song.folk.london-bridge` | range.beyond-position | I | one note past the five-finger position (incidental); the only later listing is 4.5 |
| 2.2 | `song.pop.michael-row-the-boat-ashore.pdmx` | rhythm.dotted-quarter, rhythm.syncopation, range.beyond-position | A | latin.3 |
| 2.2 | `song.folk.sakura.pdmx` | pitch.ledger, rhythm.ties, range.beyond-position | A | 3.4 |
| 2.2 | `song.folk.danny-boy-c-major.pdmx` | pitch.ledger, rhythm.dotted-quarter, rhythm.syncopation, range.beyond-position | A | 4.5 |
| 2.2 | `song.folk.alouette.pdmx` | rhythm.ties, metre.compound, key.signature, range.beyond-position | A | 4.5 |
| 2.2 | `song.folk.anonymous-swing-low-sweet-chariot.pdmx` | rhythm.dotted-quarter, rhythm.syncopation, key.signature, range.beyond-position | A | 4.5 |
| 2.3 | `exercise.inversions.c-major.both` | pitch.ledger, range.beyond-position, texture.left-hand-pattern | M | 4.3 |
| 2.3 | `exercise.cadence.c.root` | pitch.ledger, range.beyond-position | A | 3.4 |
| 2.3 | `exercise.cadence.c.voice-led` | range.beyond-position | D | 2.3 would fall to two exercise options; 3.2 teaches the smooth version |
| 2.3 | `song.folk.happy-birthday.simple` | rhythm.syncopation, range.beyond-position | A | latin.3 |
| 2.3 | `song.folk.happy-birthday` | pitch.chromatic, range.beyond-position | A | 3.1 |
| 2.3 | `song.holiday.jingle-bells.g` | pitch.ledger, key.signature, range.beyond-position | A | 3.4 |
| 2.3 | `song.folk.was-wollen-wir-trinken.pdmx` | rhythm.dotted-quarter, rhythm.syncopation, rhythm.triplets, range.beyond-position | A | 4.5 |
| 2.3 | `song.folk.dark-eyes.pdmx` | rhythm.dotted-quarter, rhythm.ties, rhythm.syncopation, rhythm.triplets, key.signature, pitch.chromatic, range.beyond-position | A | 4.5 |
| 2.3 | `song.folk.auld-lang-syne.pdmx` | pitch.ledger, rhythm.dotted-quarter, rhythm.syncopation, key.signature, range.beyond-position | A | 4.5 |
| 2.3 | `song.folk.skip-to-my-lou.pdmx` | pitch.ledger, key.signature, range.beyond-position | A | 3.4 |
| 2.4 | `exercise.rhythm.six-eight-long-short.4bar` | metre.compound | A | 4.5 |
| 2.4 | `song.folk.greensleeves.simple` | rhythm.syncopation, pitch.chromatic, range.beyond-position | A | 4.5 |
| 2.4 | `song.folk.greensleeves` | pitch.ledger, rhythm.syncopation, rhythm.triplets, pitch.chromatic, range.beyond-position | L | the lesson names it; also listed at chords-pop.5, where it is taught |
| 2.4 | `song.folk.greensleeves.chords` | pitch.ledger, rhythm.syncopation, pitch.chromatic, range.beyond-position | A | 4.5 |
| 2.4 | `song.folk.ga-je-mee-op-zoek-naar-het-koningskind.pdmx` | pitch.ledger, rhythm.syncopation, key.signature, pitch.chromatic, range.beyond-position | A | 4.5 |
| 2.4 | `song.folk.streets-of-laredo.pdmx` | rhythm.syncopation, key.signature, range.beyond-position | A | 4.5 |
| 2.4 | `song.pop.careless-love-blues.pdmx` | pitch.ledger, key.signature, range.beyond-position | L | blues.3's lesson names it; the only listing that teaches all it carries is blues.4, another track |
| 2.5 | `exercise.position-shift.c.left` | pitch.ledger | A | 3.4 |
| 2.5 | `exercise.position-shift.g.right` | pitch.ledger, key.signature | A | 3.4 |
| 2.5 | `exercise.pentatonic.a.pentatonic` | pitch.ledger | A | 3.4 |
| 2.5 | `song.classical.ode-to-joy.full` | pitch.ledger | L | the lesson names it; also listed at 3.5, where it is taught |
| 2.5 | `song.classical.beethoven-ode-to-joy.easy` | pitch.ledger, key.signature, pitch.chromatic | L | the lesson names it; also listed at 4.1, where it is taught |
| holiday | `exercise.cadence.c.root` | pitch.ledger, range.beyond-position | A | holiday.4 |
| holiday | `song.classical.1818-franz-xaver-gruber-silent-night.pdmx` | rhythm.eighths, rhythm.shorter-than-quarter, rhythm.sixteenths, rhythm.ties, metre.compound, range.beyond-position | N | rhythm.sixteenths |
| holiday | `song.pop.misc-christmas-traditional-music-jolly-old-saint-nicholas.pdmx` | rhythm.eighths, rhythm.shorter-than-quarter, key.signature, range.beyond-position | A | holiday.4 |
| holiday | `song.pop.misc-christmas-good-king-wenceslas.pdmx` | key.signature, range.beyond-position | A | holiday.4 |
| holiday | `song.classical.1863-rev-john-henry-hopkins-we-three-kings-of-orient-are.pdmx` | rhythm.eighths, rhythm.shorter-than-quarter, metre.compound, key.signature, range.beyond-position | A | holiday.5 |
| hymns.2 | `exercise.cadence.c.root` | pitch.ledger, range.beyond-position | P |  |
| hymns.2 | `song.folk.be-thou-my-vision.pdmx` | rhythm.eighths, rhythm.shorter-than-quarter, rhythm.syncopation, key.signature, range.beyond-position | P |  |
| hymns.2 | `song.classical.beethoven-ludwig-van-beethoven-joyful-joyful-we-adore-thee.pdmx` | pitch.ledger, rhythm.eighths, rhythm.shorter-than-quarter, rhythm.dotted-quarter, range.beyond-position | P |  |
| hymns.2 | `song.folk.anonymous-swing-low-sweet-chariot.pdmx` | rhythm.eighths, rhythm.shorter-than-quarter, rhythm.dotted-quarter, rhythm.syncopation, key.signature, range.beyond-position | P |  |
| 3.1 | `exercise.pentatonic.a.blues` | pitch.ledger | A | 3.4 |
| 3.1 | `song.folk.when-the-saints.f` | rhythm.syncopation | A | 4.5 |
| 3.1 | `song.folk.loch-lomond.pdmx` | pitch.ledger, rhythm.syncopation | A | 4.5 |
| 3.1 | `song.folk.scarborough-fair.pdmx` | rhythm.syncopation | A | 4.5 |
| 3.2 | `exercise.cadence.g.voice-led` | pitch.ledger | L | 3.2's lesson assigns 'the smooth version in C, G and F' |
| 3.2 | `exercise.cadence.f.voice-led` | pitch.ledger | A | 3.4 |
| 3.2 | `exercise.cadence.g.root` | pitch.ledger | A | 3.4 |
| 3.2 | `song.folk.oh-my-darling-clementine.pdmx` | rhythm.syncopation | A | 4.5 |
| 3.2 | `song.pop.misc-tunes-yankee-doodle.pdmx` | pitch.ledger | A | 3.4 |
| 3.3 | `exercise.scale.a-harmonic-minor.1oct.similar.both.2` | pitch.ledger, texture.left-hand-pattern | L | the lesson names it; also listed at 4.2, where it is taught |
| 3.3 | `exercise.arpeggio.a-minor.2oct.both` | pitch.ledger, texture.left-hand-pattern | M | 3.6 |
| 3.3 | `exercise.ostinato.a.arpeggio` | pitch.ledger | T | its later listings are holiday.5 and rock.6, other tracks; ledger lines are 3.4's, the next rung |
| 3.3 | `exercise.power-chord.a` | pitch.ledger, texture.left-hand-pattern | A | 3.6 |
| 3.4 | `song.classical.beethoven-fur-elise.beginner` | rhythm.sixteenths, rhythm.syncopation, metre.compound | N | rhythm.sixteenths |
| 3.5 | `song.classical.pachelbel-canon-d.easy` | rhythm.sixteenths, rhythm.syncopation | N | rhythm.sixteenths |
| 3.5 | `song.folk.greensleeves.waltz` | rhythm.syncopation | L | the lesson names it; also listed at ragtime.5, where it is taught |
| 3.6 | `exercise.tresillo.c` | rhythm.syncopation | A | 4.5 |
| classical.3 | `exercise.scale.g-major.1oct.similar.both.2` | texture.left-hand-pattern | A | classical.4 |
| classical.3 | `exercise.accompaniment.alberti.c-major.both` | texture.left-hand-pattern | A | classical.4 |
| classical.3 | `song.classical.bach-menuet-in-d-minor-bwv-anh-132.pdmx` | rhythm.sixteenths, texture.left-hand-pattern | N | rhythm.sixteenths |
| classical.3 | `song.classical.bach-menuet-bwv-anh-113.pdmx` | rhythm.sixteenths, rhythm.triplets | N | rhythm.sixteenths |
| classical.3 | `song.classical.beethoven-ludwig-van-beethoven-ecossaise.pdmx` | rhythm.syncopation | A | classical.5 |
| chords-pop.3 | `song.classical.foster-oh-susanna-simple-lead-sheet.pdmx` | rhythm.syncopation | A | chords-pop.5 |
| chords-pop.3 | `song.pop.tom-dooley.pdmx` | rhythm.syncopation | A | chords-pop.5 |
| blues.3 | `song.classical.st-louis-blues.pdmx` | pitch.ledger, rhythm.syncopation | P |  |
| blues.3 | `song.blues.st-james-infirmary` | rhythm.sixteenths, rhythm.syncopation | N | rhythm.sixteenths |
| blues.3 | `song.blues.wabash-blues` | rhythm.syncopation | P |  |
| blues.3 | `song.blues.tishomingo-blues` | rhythm.syncopation | P |  |
| hymns | `exercise.slash-bass.c` | pitch.ledger, texture.left-hand-pattern | A | hymns.4 |
| hymns | `exercise.loop4.c.inversions` | pitch.ledger | A | hymns.4 |
| hymns | `song.folk.amazing-grace-satb.pdmx` | pitch.ledger, rhythm.syncopation | A | hymns.5 |
| hymns | `song.classical.abide-with-me-william-henry-monk.pdmx` | pitch.ledger | L | the lesson names it; also listed at hymns.4, where it is taught |
| hymns | `song.classical.rock-of-ages-cleft-for-me.pdmx` | pitch.ledger, rhythm.syncopation | A | hymns.5 |
| hymns | `song.folk.what-a-friend-we-have-in-jesus.pdmx` | pitch.ledger | L | the hymns lesson names What a Friend |
| hymns | `song.pop.misc-tunes-come-thou-fount-of-every-blessing.pdmx` | rhythm.sixteenths, rhythm.syncopation | N | rhythm.sixteenths |
| hymns | `song.classical.jesus-loves-me.pdmx` | pitch.ledger, rhythm.sixteenths, rhythm.syncopation | N | rhythm.sixteenths |
| hymns | `song.pop.martin-j-nystrom-as-the-deer-piano.pdmx` | pitch.ledger, texture.left-hand-pattern | L | the lesson names it; also listed at hymns.5, where it is taught |
| hymns | `song.folk.just-a-closer-walk-with-thee-easy-piano.pdmx` | rhythm.syncopation | I | rhythm.syncopation present only incidentally |
| hymns | `song.folk.10000-reasons-matt-redman.pdmx` | pitch.ledger, rhythm.syncopation | M | hymns.6 |
| hymns | `song.classical.simple-gifts-2-part-round.pdmx` | rhythm.syncopation | A | hymns.5 |
| rock.overview | `exercise.accompaniment.broken.a-minor.left` | pitch.ledger | A | rock.4 |
| rock.overview | `song.classical.pachelbel-canon-d.easy` | pitch.ledger, rhythm.sixteenths, rhythm.syncopation, key.signature, pitch.chromatic | N | rhythm.sixteenths |
| rock.overview | `song.folk.scarborough-fair.pdmx` | rhythm.syncopation, key.signature | A | rock.5 |
| latin.3 | `exercise.clave.son-3-2.pulse` | pitch.ledger, texture.left-hand-pattern, texture.walking-bass | P |  |
| latin.3 | `exercise.tresillo.c` | texture.left-hand-pattern | P |  |
| latin.3 | `song.pop.guantanamera.pdmx` | pitch.ledger, key.signature | P |  |
| latin.3 | `song.folk.so-danco-samba.pdmx` | pitch.ledger, rhythm.triplets, pitch.chromatic | P |  |
| holiday.3 | `exercise.cadence.g.root` | pitch.ledger, key.signature | P |  |
| holiday.3 | `exercise.cadence.f.root` | pitch.ledger, key.signature | P |  |
| holiday.3 | `song.classical.mason-lowell-mason-handel-joy-to-the-world.pdmx` | key.signature | P |  |
| holiday.3 | `song.pop.misc-christmas-traditional-music-first-noel.pdmx` | rhythm.syncopation, key.signature | P |  |
| holiday.3 | `song.classical.mendelssohn-felix-mendelssohn-hark-the-herald-angels-sing.pdmx` | key.signature | P |  |
| holiday.3 | `song.classical.1803-1856-adolphe-adam-o-holy-night.pdmx` | metre.compound, key.signature, pitch.chromatic | P |  |
| holiday.3 | `song.pop.misc-christmas-o-christmas-tree.pdmx` | rhythm.syncopation, key.signature | P |  |
| holiday.3 | `song.pop.misc-christmas-traditional-music-angels-we-have-heard-on-high.pdmx` | pitch.ledger, rhythm.syncopation, key.signature | P |  |
| holiday.3 | `song.pop.misc-christmas-traditional-music-god-rest-ye-merry-gentlemen-gw.pdmx` | rhythm.syncopation, key.signature | P |  |
| jazz.3 | `song.pop.ray-henderson-bye-bye-blackbird.pdmx` | pitch.ledger, rhythm.syncopation | P |  |
| jazz.3 | `song.classical.alexander-s-ragtime-band.pdmx` | pitch.ledger, rhythm.sixteenths, rhythm.syncopation | N | rhythm.sixteenths |
| jazz.3 | `song.blues.ole-miss` | rhythm.syncopation | P |  |
| 4.1 | `song.classical.beethoven-fur-elise.easy` | rhythm.syncopation | L | the lesson names it; also listed at 4.6, where it is taught |
| 4.2 | `song.folk.bella-ciao` | rhythm.syncopation | A | 4.5 |
| 4.4 | `exercise.hanon.01.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| 4.4 | `exercise.hanon.02.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| 4.4 | `exercise.hanon.03.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| 4.4 | `exercise.hanon.04.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| 4.4 | `exercise.hanon.05.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| 4.5 | `exercise.clave.son-3-2.pulse` | texture.walking-bass | A | jazz.6 |
| 4.6 | `song.folk.uti-var-hage-swedish-traditional-song.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.4 | `exercise.hanon.01.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.4 | `exercise.hanon.02.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.4 | `song.pop.sonatina-in-g.pdmx` | rhythm.syncopation | A | classical.5 |
| classical.4 | `song.classical.bach-march-in-d-major.pdmx` | rhythm.sixteenths, rhythm.syncopation | N | rhythm.sixteenths |
| classical.4 | `song.classical.mozart-w-a-mozart-minuet-in-g-major-k1e.pdmx` | rhythm.sixteenths, rhythm.syncopation, rhythm.triplets | N | rhythm.sixteenths |
| classical.4 | `song.classical.gurlitt-cornelius-gurlitt-op-82.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.beethoven-fur-elise.easy` | rhythm.syncopation | P |  |
| classical.4.shelf | `song.classical.satie-gymnopedie-1` | rhythm.syncopation | P |  |
| classical.4.shelf | `song.classical.bach-air-on-g-string` | rhythm.sixteenths, rhythm.syncopation | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.chopin-prelude-op28-7.nifc` | rhythm.sixteenths, rhythm.syncopation | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.chopin-prelude-op28-20.nifc` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.chopin-prelude-op28-6.nifc` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.chopin-nocturne-op9-2.easy` | rhythm.sixteenths, rhythm.syncopation | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.satie-erik-satie-gnossienne-n1.pdmx` | rhythm.syncopation | P |  |
| classical.4.shelf | `song.classical.mozart-mozart-minuet-in-f-major-k2-easy.pdmx` | rhythm.syncopation, rhythm.triplets | P |  |
| classical.4.shelf | `song.classical.debussy-clair-de-lune-easy.pdmx` | rhythm.syncopation, metre.compound | P |  |
| classical.4.shelf | `song.beautiful.hungarian-sonata` | rhythm.sixteenths, rhythm.syncopation, rhythm.triplets | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.grieg-morgenstimmung.pdmx` | rhythm.sixteenths, metre.compound | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.elgar-salut-d-amour-edward-elgar-love-s-greeting.pdmx` | rhythm.sixteenths, rhythm.syncopation | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.elgar-elgar-enigma-variations-xi-nimrod.pdmx` | rhythm.syncopation, rhythm.triplets | P |  |
| classical.4.shelf | `song.classical.puccini-o-mio-babbino-caro-for-solo-piano.pdmx` | rhythm.sixteenths, rhythm.syncopation | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.mascagni-cavalleria-rusticana-intermezzo.pdmx` | rhythm.sixteenths, rhythm.syncopation | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.anonymous-romance-anonimo-romanza.pdmx` | rhythm.triplets | P |  |
| classical.4.shelf | `song.classical.beethoven-beethoven-symphony-7-2nd-movement-allegretto-simple-piano-arrangement.pdmx` | rhythm.sixteenths, rhythm.syncopation | N | rhythm.sixteenths |
| classical.4.shelf | `song.beautiful.mariage-damour` | rhythm.sixteenths, rhythm.syncopation, metre.compound | N | rhythm.sixteenths |
| classical.4.shelf | `song.beautiful.merry-christmas-mr-lawrence` | rhythm.syncopation | P |  |
| classical.4.shelf | `song.classical.across-the-violet-sky-violet-evergarden-emotional-anime-on-piano-vol-2.pdmx` | rhythm.sixteenths, rhythm.syncopation | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.bennet-rosemary-s-waltz.pdmx` | rhythm.syncopation, rhythm.triplets | P |  |
| classical.4.shelf | `song.classical.bizet-overture-to-carmen-for-piano-solo-by-georges-bizet.pdmx` | rhythm.sixteenths, rhythm.syncopation, rhythm.triplets | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.chopin-nocturne-20.alt` | rhythm.sixteenths, rhythm.syncopation, rhythm.triplets | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.chopin-prelude-op28-4.nifc` | rhythm.sixteenths, rhythm.syncopation, rhythm.triplets | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.chopin-waltz-op64-2` | rhythm.sixteenths, rhythm.syncopation, rhythm.triplets | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.djawadi-light-of-the-seven.pdmx` | rhythm.sixteenths, rhythm.syncopation | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.einaudi-questa-notte.pdmx` | rhythm.sixteenths, rhythm.syncopation, rhythm.triplets, metre.compound | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.glass-dead-things.pdmx` | rhythm.syncopation, rhythm.triplets | P |  |
| classical.4.shelf | `song.classical.holst-jupiter-theme-arranged-for-piano-gustav-holst.pdmx` | rhythm.sixteenths, rhythm.syncopation | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.hurwitz-the-armstrongs-first-man.pdmx` | metre.compound | P |  |
| classical.4.shelf | `song.classical.mahler-symphony-no-5-4th-movement-excerpt-piano-solo.pdmx` | rhythm.sixteenths, rhythm.syncopation, rhythm.triplets | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.palmer-days-in-the-sun.pdmx` | rhythm.syncopation, rhythm.triplets | P |  |
| classical.4.shelf | `song.classical.rachmaninoff-rachmaninoff-piano-concerto-no-2.pdmx` | rhythm.syncopation, rhythm.triplets | P |  |
| classical.4.shelf | `song.classical.s-awecki-super-mario-land-2-ending-theme-as-played-by-tom-brier.pdmx` | rhythm.sixteenths, rhythm.syncopation, rhythm.triplets | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.sakamoto-shining-boy-and-little-randy-ryuichi-sakamoto.pdmx` | rhythm.sixteenths, rhythm.syncopation, rhythm.triplets | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.schubert-liszt-standchen` | rhythm.sixteenths, rhythm.syncopation, rhythm.triplets | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.spiteri-travelling.pdmx` | rhythm.sixteenths, rhythm.syncopation | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.uematsu-at-zanarkand-ffx-hd-remaster.pdmx` | rhythm.syncopation | P |  |
| classical.4.shelf | `song.classical.vivaldi-spring-vivaldi.pdmx` | rhythm.sixteenths, rhythm.syncopation | N | rhythm.sixteenths |
| classical.4.shelf | `song.classical.zimmer-maestro-the-holiday.pdmx` | rhythm.triplets | P |  |
| classical.4.shelf | `song.classical.zimmer-time-hans-zimmer-inception.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.4.shelf | `song.beautiful.g-minor-bach` | rhythm.sixteenths | N | rhythm.sixteenths |
| chords-pop.4 | `song.pop.scarborough-fair.pdmx` | rhythm.syncopation | A | chords-pop.5 |
| chords-pop.4 | `song.folk.traditional-music-shenandoah.pdmx` | rhythm.syncopation | A | chords-pop.5 |
| chords-pop.4 | `song.folk.hallelujah-easy.pdmx` | rhythm.syncopation, metre.compound | A | chords-pop.5 |
| chords-pop.4 | `song.classical.alexander-s-ragtime-band.pdmx` | rhythm.sixteenths, rhythm.syncopation | N | rhythm.sixteenths |
| blues.4 | `exercise.rhythm.syncopated.4bar` | rhythm.syncopation | A | blues.5 |
| blues.4 | `song.classical.st-louis-blues.pdmx` | rhythm.syncopation | A | blues.5 |
| blues.4 | `song.blues.hesitating-blues` | rhythm.syncopation | A | blues.5 |
| jazz.4 | `exercise.comping.f.off-beats.intro` | rhythm.syncopation | P |  |
| jazz.4 | `song.pop.avalon.pdmx` | rhythm.syncopation | P |  |
| jazz.4 | `song.pop.margie.pdmx` | rhythm.syncopation | P |  |
| holiday.4 | `song.folk.we-wish-you-a-merry-christmas.pdmx` | rhythm.syncopation | A | holiday.5 |
| holiday.4 | `song.classical.away-in-a-manger.pdmx` | rhythm.syncopation | A | holiday.5 |
| technique.4 | `exercise.hanon.01.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.4 | `exercise.hanon.01.left` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.4 | `exercise.hanon.01.right` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.4 | `song.classical.lemoine-etude-op-37-no-1.pdmx` | rhythm.syncopation | A | technique.5 |
| technique.4 | `song.classical.lemoine-etude-op-37-no-35.pdmx` | rhythm.syncopation, metre.compound | A | technique.5 |
| hymns.4 | `song.classical.beethoven-joyful-joyful-we-adore-thee.pdmx` | rhythm.syncopation | A | hymns.5 |
| hymns.4 | `song.classical.bach-o-sacred-head-johann-sebastian-bach-on-a-tune-by-hans-leo-hassler.pdmx` | rhythm.sixteenths, rhythm.syncopation | N | rhythm.sixteenths |
| classical.5 | `exercise.hanon.06.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.5 | `exercise.hanon.07.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.5 | `song.classical.clementi-sonatina-no1-2-muzio-clementi.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.5 | `song.classical.burgmuller-burgmuller-arabesque-op-100-no-2.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| chords-pop.5 | `song.folk.your-song-elton-john-easy-piano.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| blues.5 | `exercise.tremolo-third.c.right` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.5 | `exercise.rhythm.sixteenths.4bar` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.5 | `song.ragtime.joplin-entertainer` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.5 | `song.ragtime.joplin-augustan-club-waltz` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.5 | `song.ragtime.joplin-rose-bud-march` | rhythm.sixteenths | N | rhythm.sixteenths |
| latin | `exercise.walking-bass.c.ii-v-i` | texture.walking-bass | P |  |
| technique.5 | `exercise.hanon.11.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.5 | `exercise.hanon.11.left` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.6 | `exercise.hanon.12.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.6 | `exercise.hanon.14.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.6 | `exercise.hanon.16.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.6 | `song.classical.bach-wtc1-prelude-1` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.6 | `song.classical.chopin-prelude-op28-4` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.6 | `song.classical.chopin-prelude-op28-7.nifc` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.6 | `song.classical.chopin-waltz-a-minor` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.6 | `song.classical.beethoven-fur-elise` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.6 | `exercise.hanon.11.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.6 | `song.ragtime.joplin-school-of-ragtime` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.6 | `song.ragtime.joplin-easy-winners` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.6 | `song.ragtime.joplin-peacherine-rag` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.6 | `song.ragtime.joplin-swipesy-cakewalk` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.6 | `song.ragtime.joplin-sunflower-slow-drag` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.6 | `exercise.repeated-notes.c.4x.left` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.6 | `exercise.rotation.c.left` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.6 | `exercise.syncopation.sixteenth` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.6 | `exercise.trill.c.4pb.left` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.6 | `song.classical.czerny-the-school-of-velocity-op-299-no-1.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.6 | `song.classical.czerny-the-school-of-velocity-op-299-no-3.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.6 | `song.classical.czerny-the-school-of-velocity-op-299-no-4.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| holiday.6 | `song.holiday.carol-of-the-bells` | rhythm.sixteenths | N | rhythm.sixteenths |
| holiday.6 | `song.folk.o-holy-night-piano-solo.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| holiday.6 | `song.pop.misc-christmas-joy-to-the-world-piano-solo.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| blues.6 | `song.folk.boogie-woogie.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| chords-pop.6 | `song.pop.abba-dancing-queen.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| chords-pop.6 | `song.pop.toby-fox-fallen-down-reprise-undertale-easy.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| rock.6 | `song.classical.chopin-prelude-op28-20.nifc` | rhythm.sixteenths | N | rhythm.sixteenths |
| rock.6 | `song.classical.beethoven-moonlight-i` | rhythm.sixteenths | N | rhythm.sixteenths |
| hymns.6 | `song.folk.amazing-grace-in-g-major-for-piano-breezepiano.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| latin.6 | `song.folk.por-una-cabeza-carlos-gardel.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| latin.6 | `song.jazz.the-crave` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.7 | `exercise.hanon.18.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.7 | `exercise.hanon.20.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.7 | `song.classical.mozart-k545-i` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.7 | `song.classical.beethoven-moonlight-i` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.7 | `song.classical.beethoven-pathetique-ii` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.7 | `song.classical.chopin-mazurka-op7-1.nifc` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.7 | `song.classical.bach-invention-no-1-in-c-major-bwv-772.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.7 | `song.classical.bach-invention-no-4-in-d-minor-bwv-775.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.7 | `exercise.hanon.15.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.7 | `song.ragtime.joplin-maple-leaf-rag` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.7 | `song.ragtime.joplin-elite-syncopations` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.7 | `song.ragtime.joplin-solace` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.7 | `song.ragtime.joplin-heliotrope-bouquet` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.7 | `song.ragtime.joplin-sugar-cane` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.7 | `exercise.broken-octaves.a.1oct.left` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.7 | `exercise.broken7.a-dominant7.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.7 | `exercise.tremolo.c.left` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.7 | `exercise.broken-octaves.a.1oct.right` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.7 | `exercise.broken7.a-flat-dominant7.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.7 | `song.classical.czerny-the-school-of-velocity-op-299-no-5.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.7 | `song.classical.czerny-the-school-of-velocity-op-299-no-8.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.7 | `song.classical.czerny-the-school-of-velocity-op-299-no-10.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| jazz.7 | `song.jazz.james-pierpont-jingle-bells-jazz-piano.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| jazz.7 | `song.jazz.vince-guaraldi-skating.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| holiday.7 | `exercise.rotation.c.left` | rhythm.sixteenths | N | rhythm.sixteenths |
| holiday.7 | `exercise.repeated-notes.c.4x.left` | rhythm.sixteenths | N | rhythm.sixteenths |
| holiday.7 | `exercise.stride.c` | texture.walking-bass | P |  |
| holiday.7 | `song.classical.tchaikovsky-waltz-flowers` | rhythm.sixteenths | N | rhythm.sixteenths |
| holiday.7 | `song.classical.tchaikovsky-sugar-plum` | rhythm.sixteenths | N | rhythm.sixteenths |
| holiday.7 | `song.jazz.vince-guaraldi-skating.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| chords-pop.7 | `song.pop.coldplay-fix-you-coldplay.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| chords-pop.7 | `song.pop.anson-seabra-welcome-to-wonderland-by-anson-seabra.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| chords-pop.7 | `song.pop.blonde-redhead-for-the-damaged-coda-blonde-redhead.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| chords-pop.7 | `song.folk.scarborough-fair-piano-solo.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| chords-pop.7 | `song.folk.wake-me-up-avicii.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| rock.7 | `song.classical.grieg-in-the-hall-of-the-mountain-king.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| rock.7 | `song.classical.beethoven-moonlight-iii` | rhythm.sixteenths | N | rhythm.sixteenths |
| latin.7 | `exercise.repeated-notes.g.4x.right` | rhythm.sixteenths | N | rhythm.sixteenths |
| latin.7 | `exercise.rotation.g.left` | rhythm.sixteenths | N | rhythm.sixteenths |
| latin.7 | `song.classical.el-choclo-piano.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| latin.7 | `song.classical.albeniz-asturias.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| latin.7 | `song.classical.lecuona-malaguena-by-ernesto-lecuona.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.8 | `exercise.hanon.19.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.8 | `exercise.hanon.17.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.8 | `song.classical.mozart-rondo-alla-turca` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.8 | `song.classical.debussy-clair-de-lune` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.8 | `song.classical.beethoven-moonlight-iii` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.8 | `song.classical.chopin-waltz-op64-2.nifc` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.8 | `song.classical.chopin-nocturne-op9-1` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.8 | `exercise.hanon.20.both` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.8 | `song.ragtime.joplin-pine-apple-rag` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.8 | `song.ragtime.joplin-gladiolus-rag` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.8 | `song.ragtime.joplin-cascades` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.8 | `song.ragtime.joplin-new-rag` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.8 | `song.classical.scott-frog-legs-rag.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.8 | `exercise.scale.a-flat-major.4oct.similar.both.1` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.8 | `exercise.scale.a-major.4oct.similar.both.1` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.8 | `exercise.scale.b-flat-major.4oct.similar.both.1` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.8 | `exercise.scale.b-major.4oct.similar.both.1` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.8 | `exercise.scale.c-major.4oct.similar.both.1` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.8 | `exercise.scale.d-flat-major.4oct.similar.both.1` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.8 | `exercise.scale.d-major.4oct.similar.both.1` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.8 | `exercise.scale.e-flat-major.4oct.similar.both.1` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.8 | `exercise.scale.e-major.4oct.similar.both.1` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.8 | `exercise.scale.f-major.4oct.similar.both.1` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.8 | `exercise.scale.g-flat-major.4oct.similar.both.1` | rhythm.sixteenths | N | rhythm.sixteenths |
| technique.8 | `exercise.scale.g-major.4oct.similar.both.1` | rhythm.sixteenths | N | rhythm.sixteenths |
| jazz.8 | `song.jazz.tom-brier-uncle-ben-s-cakewalk-tom-brier.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| jazz.8 | `song.jazz.hoagy-carmichael-stardust-hoagy-carmichael.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| blues.8 | `song.jazz.chevy-chase` | rhythm.sixteenths | N | rhythm.sixteenths |
| blues.8 | `song.blues.black-bottom-stomp` | rhythm.sixteenths | N | rhythm.sixteenths |
| chords-pop.8 | `song.pop.toby-fox-undertale-undertale-piano.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| chords-pop.8 | `song.pop.hiroyuki-sawano-levi-s-choice-thanksat-t-kt-attack-on-titan.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| chords-pop.8 | `song.pop.kevin-macleod-if-i-had-a-chicken.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.9 | `song.classical.chopin-ballade-1` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.9 | `song.classical.liszt-la-campanella` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.9 | `song.classical.chopin-fantaisie-impromptu.nifc` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.9 | `song.classical.chopin-polonaise-op53.nifc` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.9 | `song.classical.chopin-etude-op10-4.nifc` | rhythm.sixteenths | N | rhythm.sixteenths |
| classical.9 | `song.classical.chopin-sonata-2-3.nifc` | rhythm.sixteenths | N | rhythm.sixteenths |
| jazz.9 | `song.jazz.the-dave-brubeck-quartet-take-five.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| jazz.9 | `song.jazz.fats-waller-ain-t-misbehavin.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| jazz.9 | `song.jazz.vince-guaraldi-linus-and-lucy-fixed-piano-only.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| jazz.9 | `song.jazz.louis-armstrong-o-when-the-saints-go-marching-in.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| blues.9 | `song.jazz.stumbling` | rhythm.sixteenths | N | rhythm.sixteenths |
| blues.9 | `song.blues.handful-of-keys` | rhythm.sixteenths | N | rhythm.sixteenths |
| chords-pop.9 | `song.pop.camille-le-festin-piano-arr-kno.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| chords-pop.9 | `song.pop.harry-styles-falling-by-harry-styles.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| chords-pop.9 | `song.pop.billy-joel-rousseau-billy-joel-piano-man.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| chords-pop.9 | `song.pop.wowaka-vocaloid-rolling-girl-aa1-4aaa3aa1-4a.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| chords-pop.9 | `song.pop.takeru-kanazaki-fire-emblem-three-houses-apex-of-the-world.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.9 | `exercise.secondary-rag.c.4bar` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.9 | `exercise.stride.c` | texture.walking-bass | P |  |
| ragtime.9 | `song.ragtime.joplin-original-rags` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.9 | `song.ragtime.joplin-breeze-from-alabama` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.9 | `song.ragtime.joplin-chrysanthemum` | rhythm.sixteenths | N | rhythm.sixteenths |
| ragtime.9 | `song.classical.joplin-search-light-rag.pdmx` | rhythm.sixteenths | N | rhythm.sixteenths |
| practice.1 | `exercise.five-finger.c-major.right` | interval.step | new | listed by the practice floor; practice rungs carry no prerequisites, so their path runs through 0.4 only (L109's data half) |
| practice.1 | `exercise.reading.steps-and-skips-c` | interval.step, interval.skip | new | listed by the practice floor; practice rungs carry no prerequisites, so their path runs through 0.4 only (L109's data half) |
| practice.2 | `exercise.five-finger.c-major.right` | interval.step | new | listed by the practice floor; practice rungs carry no prerequisites, so their path runs through 0.4 only (L109's data half) |
| practice.2 | `exercise.reading.steps-and-skips-c` | interval.step, interval.skip | new | listed by the practice floor; practice rungs carry no prerequisites, so their path runs through 0.4 only (L109's data half) |

**Orchestrator's note at the landing (2026-09-29).** F2's worktree was cut from origin's head of the time (`87a84d6`), so the builder worked without D4 and read the approved brief from the main checkout; it committed by name (b41e19e) and merged clean (0482243) over D4a, D5, E2 and D4 — the first tree with F2 and D4 together. The chain on that merged main checkout, by what a content seam touches: the offline content build, the validator, the record check, the content suites the seam touched (measured truth, taught-at, the validator's claims check and its siblings, pdmx, the review record), typecheck, lint, the promise, lesson-claims, ancestry and lesson-shape unit files with the gate's consumers and D4's offer, the two diary files, the app build, the Today and start-and-return specs on the default port (content-build 0; content-validate 0; review-check 0; content-tests 0; tsc 0; lint 0; vitest-targeted 1; vitest-diaries 0; build-app 0; vitest-picks-rerun 0; e2e-today 0; `runs/F2/orchestrator-exit.txt`; the build left these files modified:  M docs/prompts/inventory.md,  M docs/prompts/rung-claims.md). The one non-zero step, the targeted unit run, held three reds: the two `lessonClaimsAboutApp` line-ending assertions recorded since D0 on this checkout (green in CI), and one real one — D3c's `lessonPagePicksPassTheAdmission.test.ts` pins the controls that open nothing on the built catalogue (`GONE`), and F2 took the duet tool off `latin` and `latin.3` (L111), so those two controls are no longer gone but absent. The orchestrator revised the pin to the two Quick checks with the reason in its comment (a *revise* row: the pin's old assumption was that the duet controls existed and were refused), and the file reran green (`vitest-picks-rerun exit=0`); the builder had not run that file because its brief did not name it — a consumer of the rung lists the next content brief should name. The regenerated reports on the merged tree (`inventory.md`, `rung-claims.md`) are committed as the merged tree's truth. The builder's captures beside this entry (`runs/F2/`: the summaries, the report before and after, the diaries compared, the question-1 scenarios, the moves, the red lines; `pictures/f2/before` and `after`); the entry's test-map rows spliced into `docs/08` in this record commit. The four questions go to the reviewer as the handoff's questions: where leaps and accidentals are taught on the core (the builder's measured S4), whether a validator deferral with its reason may stand in for the five every-bar claims until the detectors read whole pieces as a share of bars, whether item 2 may add an admitted option to a rung that does not list it, and the base. Follow-ups recorded as G70 (`rungState.carriedExposures` reads `concepts` and not `introduces`), U75 (ids on the Library sheet), E45 (the old rock frame in `docs/03` and `session.ts`), L112 (the eighty placement proposals and `practice.3`–`practice.5`), and notes on L109, E22 and L101. Nothing heard; unverified as music, in the entry's words. The cadence measurement for this seam: dispatched 2026-09-28 about 22:38 local, the builder's report about 00:21 local (about an hour and three quarters of wall clock, the longest of the four, with up to three other builders overlapping), merged and chained within the hour; review pending. Meters at this landing, read once and never subtracted: see the next reading in the plan's log.


## Test map rows for docs/08

A new row in the state-machine table, after E0b's:

| **A rung claims only what its options establish, or introduces it** (F2; the reviewer's required change on the F2 brief, `responses/12af708.md`): `introduces` beside `concepts`, which grants no taught status: `claims.teaching_rungs` reads `concepts` alone; `claims.introduced_of` and the report's *introduced* rows; `validate.taught_at_findings` refuses an introducing rung; `validate.concept_claim_findings` fails a concept no checkable option establishes, passes it under `introduces`, warns one an option establishes back to `concepts`, and names the claims whose failure is a detector's every-bar reading in `DEFERRED_CONCEPT_CLAIMS`, failing a stale deferral; the practice floor; options moved by leaving the rung their notes are untaught at | a lesson promising a demand no piece on its rung practises while the build passes; a "not yet kept" marker read only by the validator letting the report pass while the gate treats the demand as taught; an introduction meeting a requirement; a deferral outliving its reason; Hanon No. 1 hands together handed to a learner at 1.5 as the practice row; a lesson naming a button its rung does not draw (`latin.3`, `latin`); `theory.9` promising a walking bass its path never teaches | `tools/content/tests/test_validate_claims.py` (added: the rule on fixture rungs, the deferrals, the requirement pin, the introducing rung in `taughtAt`, the unknown concept), `test_taught_at.py` (added: introduced against taught on a fixture path, `blues.5` introduces and `blues.6` teaches; revised: the committed lists give two warnings, the walking bass at `jazz.6`, `blues.6`, `jam.6`), `test_measured_truth.py` (added: `TestPlacementReconciled`; revised: the inventory's `blues.6` teaches the walk), `fixtures/untaught_on_rung.json` (rewritten, 124 → 91), `app/tests/unit/taughtByAncestry.test.ts` (added: the constructed and shipped introduced-versus-taught cases; revised: `blues.6`), `sightReadingPromises.test.ts` and `helpers/promises.ts` (revised: `PROMISED_OFF_THE_PATH` empty, `theory.9` the level-6 row), `lessonShape.test.ts`, `lessonClaimsAboutApp.test.ts` (revised: theory.9's quote; the Latin rows hold no duet), `tests/e2e/today.spec.ts` (added: the practice floor at 1.5) | done (F2, 2026-09-29) with two questions open: 1.5's leap and 3.1's accidentals stay hand readings, warned; the walking bass on `blues.6`, `blues.8`, `jazz.6`, `jam.6` and the oom-pah on `ragtime.5` deferred with their per-bar readings; nothing heard |

File lines, revised or added:

- `taughtByAncestry.test.ts` — append: "since F2 a demand a rung only introduces is not taught (a constructed path and the shipped `blues.5`, with `blues.6` the blues path's teaching rung)".
- `sightReadingPromises.test.ts` — replace "with row 7's walking bass at `theory.9` named as a promise off its path" by "`PROMISED_OFF_THE_PATH` empty since F2, row 7 having left `theory.9`".
- `test_taught_at.py` — append: "since F2 an introduced concept never makes a teaching rung, and the walking bass is `jazz.6`'s, `blues.6`'s and `jam.6`'s (`blues.5` introduces it)".
- `test_validate_claims.py` (new line, after `test_validate_tools.py`) — "a rung claims only what its options establish, or introduces it (F2): the rule, the deferrals and their staleness, the requirement an introduction never meets, the introducing rung `taughtAt` may not list".
- `test_measured_truth.py` — append: "and since F2 every claim no option keeps accounted for (introduced, deferred or a stopped hand reading), the moved options, the practice floor, the rock placeholders on no rung".
- `today.spec.ts` — append: "and the practice track's floor at 1.5 (F2): no Hanon row, the practice row the right-hand five-finger pattern".

**Addendum at Q47's landing (2026-09-29).** `add_technique_units.py`'s table still listed syncopation for `technique.5` after F2's claim 5 removed it from the stage file; `test_technique_units`'s second-run case, running from the root for the first time after Q47's path fix, caught it. The orchestrator removed the one word from the table (a source-backed correction under the accepted claim; the lesson never taught syncopation), reran the test green, and notes it here; F2's handoff stands.
