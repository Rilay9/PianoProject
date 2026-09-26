# The red lines seen on the committed snapshot before C6 (2026-09-26)

```
 FAIL  tests/unit/alternativesShareASkill.test.ts > the tiers are claims, in order, and each option says which > the same lesson, a named stand-in, a shared target skill, a shared measured demand
    TypeError: tieredAlternatives is not a function
 FAIL  tests/unit/alternativesShareASkill.test.ts > the tiers are claims, in order, and each option says which > the repertoire tag, or any concept tag, matches nothing
    AssertionError: expected [ 'song.stand-in', …(5) ] to not include 'song.only-the-tag'
 FAIL  tests/unit/alternativesShareASkill.test.ts > the tiers are claims, in order, and each option says which > the sheet’s words name the tier: the same lesson, trains the same skill, carries the same demand
    TypeError: swapTierWords is not a function
 FAIL  tests/unit/alternativesShareASkill.test.ts > the swap sheet reads the same tiers > every option carries the tier it came from; the lesson’s own first
    AssertionError: expected undefined to be 'lesson' // Object.is equality
 FAIL  tests/unit/alternativesShareASkill.test.ts > the swap sheet reads the same tiers > a reading row’s swap offers the rows that share its skills, never one carrying what the learner’s lesson has not taught
    TypeError: Cannot read properties of undefined (reading 'id')
 FAIL  tests/unit/alternativesShareASkill.test.ts > the swap sheet reads the same tiers > with no lesson and nothing shared, the last resort is the same kind of exercise from the lessons reached, not a level window
    AssertionError: expected undefined to be 'kind' // Object.is equality
 FAIL  tests/unit/curriculumSelectors.test.ts > alternativesFor > falls back to items sharing a target skill, the nearest level first; a shared concept tag matches nothing
    AssertionError: expected 6 to be less than -1
 FAIL  tests/unit/fallbackOrder.test.ts > the order is stated once > the rung’s own option, the same target skill, the same demand, a prerequisite, exposure
    AssertionError: expected undefined to deeply equal [ 'rung', 'skill', 'demand', …(2) ]
 FAIL  tests/unit/fallbackOrder.test.ts > the warm-up walks the ladder one claim at a time, and the line names the claim > 1. the rung’s own option
    AssertionError: expected undefined to be 'rung' // Object.is equality
 FAIL  tests/unit/fallbackOrder.test.ts > the warm-up walks the ladder one claim at a time, and the line names the claim > 2. an item declaring the same target skill
    AssertionError: expected 'ex.near' to be 'ex.skill' // Object.is equality
 FAIL  tests/unit/fallbackOrder.test.ts > the warm-up walks the ladder one claim at a time, and the line names the claim > 3. an item carrying the same demand
    AssertionError: expected 'ex.near' to be 'ex.demand' // Object.is equality
 FAIL  tests/unit/fallbackOrder.test.ts > the warm-up walks the ladder one claim at a time, and the line names the claim > 4. a prerequisite rung’s item
    AssertionError: expected 'ex.near' to be 'ex.pre' // Object.is equality
 FAIL  tests/unit/fallbackOrder.test.ts > the warm-up walks the ladder one claim at a time, and the line names the claim > 5. an exposure choice
    AssertionError: expected 'ex.near' to be 'ex.expo' // Object.is equality
 FAIL  tests/unit/fallbackOrder.test.ts > the warm-up walks the ladder one claim at a time, and the line names the claim > then nothing: the row is dropped, never filled by a level window
    AssertionError: expected { kind: 'technique', minutes: 4, …(3) } to be undefined
 FAIL  tests/unit/fallbackOrder.test.ts > the warm-up walks the ladder one claim at a time, and the line names the claim > the trap at the stage’s level is never offered, at any step, in any slot
    AssertionError: repertoire at 30 min, gone : expected [ 'ex.near', 'song.near' ] to not include 'song.near'
 FAIL  tests/unit/parallelStrands.test.ts > four strands with unmet work, and the file order > the file’s order > the warm-up, the new piece and the repertoire do not all come from one strand
    AssertionError: [["technique",null],["review",null],["new",null],["repertoire",null],["sightreading",null]]: expected 0 to be greater than or equal to 2
 FAIL  tests/unit/parallelStrands.test.ts > four strands with unmet work, and the file order > the file’s order > the core path, the spine, keeps a slot: its 4.1 asks are on the card
    AssertionError: technique: Warm-up in the keys you are working in | review: Nothing due — keeping something warm | new: Lesson practice.1 — Chunking, and the loop | repertoire: Something to just play | sightreading: Read something you have never seen, 
 FAIL  tests/unit/parallelStrands.test.ts > four strands with unmet work, and the file order > the file’s order > a line a track asked for names the track; the core path’s says "this lesson"
    AssertionError: technique: Warm-up in the keys you are working in | review: Nothing due — keeping something warm | new: Lesson practice.1 — Chunking, and the loop | repertoire: Something to just play | sightreading: Read something you have never seen, 
 FAIL  tests/unit/parallelStrands.test.ts > four strands with unmet work, and the file order > the file’s order > the reading slot reads from the spine: 3.4’s row, not the level-one row before How to practise
    AssertionError: expected 'drill.reading.sight-reading-1' to be 'drill.reading.sight-reading-2' // Object.is equality
 FAIL  tests/unit/parallelStrands.test.ts > four strands with unmet work, and the file order > every stage’s tracks before its core units > the warm-up, the new piece and the repertoire do not all come from one strand
    AssertionError: [["technique",null],["review",null],["new",null],["repertoire",null]]: expected 0 to be greater than or equal to 2
 FAIL  tests/unit/parallelStrands.test.ts > four strands with unmet work, and the file order > every stage’s tracks before its core units > the core path, the spine, keeps a slot: its 4.1 asks are on the card
    AssertionError: technique: Warm-up in the keys you are working in | review: Nothing due — keeping something warm | new: Lesson practice.1 — Chunking, and the loop | repertoire: Something to just play: expected 0 to be greater than 0
 FAIL  tests/unit/parallelStrands.test.ts > four strands with unmet work, and the file order > every stage’s tracks before its core units > a line a track asked for names the track; the core path’s says "this lesson"
    AssertionError: technique: Warm-up in the keys you are working in | review: Nothing due — keeping something warm | new: Lesson practice.1 — Chunking, and the loop | repertoire: Something to just play: expected 0 to be greater than 0
 FAIL  tests/unit/parallelStrands.test.ts > four strands with unmet work, and the file order > every stage’s tracks before its core units > the reading slot reads from the spine: 3.4’s row, not the level-one row before How to practise
    AssertionError: expected undefined to be 'drill.reading.sight-reading-2' // Object.is equality
 FAIL  tests/unit/parallelStrands.test.ts > a project is not the next rung > at Stage 8, waiting on its reads, the new slot does not begin the project
    AssertionError: repertoire: Something to just play: expected 'song.project' not to be 'song.project' // Object.is equality
 FAIL  tests/unit/parallelStrands.test.ts > a project is not the next rung > at Stage 9 the project is offered as a piece to live with, never as a rung that asks
    AssertionError: expected 'Lesson classical.9 — A sonata to live…' to be 'A piece to live with in Classical: A …' // Object.is equality
 FAIL  tests/unit/progressStore.test.ts > learnedPieces > a piece passed or mastered is learned, with when it was last played
    TypeError: learnedPieces is not a function
 FAIL  tests/unit/progressStore.test.ts > learnedPieces > a piece never passed is not
    TypeError: learnedPieces is not a function
 FAIL  tests/unit/recommendRespondsToEvidence.test.ts > learners on 2.2: one failing everywhere, one misreading the skips, one who never read > the learner failing everywhere keeps the rung’s recipe, and the slot says it is not sure yet — not the rung’s 
    AssertionError: the never-read learner has no reading row: expected undefined to be defined
 FAIL  tests/unit/recommendRespondsToEvidence.test.ts > learners on 2.2: one failing everywhere, one misreading the skips, one who never read > the skip learner gets a different phrase from both: the same row by step only, and the slot says why
    AssertionError: expected undefined to deeply equal { …(2) }
 FAIL  tests/unit/recommendRespondsToEvidence.test.ts > learners on 2.2: one failing everywhere, one misreading the skips, one who never read > reads that differ only in reading move only the reading slot; every other slot says why it is there
    AssertionError: technique has no claim: expected undefined to be defined
 FAIL  tests/unit/recordTruth.test.ts > the repertoire window counts days where the learner lives > in Asia/Tokyo: played at 20:30, not due late on the window's last day, due the next morning
    AssertionError: expected undefined to be 'piece-retention' // Object.is equality
 FAIL  tests/unit/repertoireRetention.test.ts > a learned piece returns after the repertoire window, though every skill it carries was shown yesterday > at the window, the review is the piece, and the line is the piece’s
    RangeError: Invalid time value
 FAIL  tests/unit/repertoireRetention.test.ts > a learned piece returns after the repertoire window, though every skill it carries was shown yesterday > a day inside the window it is not due, and nothing claims it is
    RangeError: Invalid time value
 FAIL  tests/unit/repertoireRetention.test.ts > a learned piece returns after the repertoire window, though every skill it carries was shown yesterday > the window is its own named hypothesis, not the ladder’s retention span
    TypeError: actual value must be number or bigint, received "undefined"
 FAIL  tests/unit/repertoireRetention.test.ts > a learned piece returns after the repertoire window, though every skill it carries was shown yesterday > the old item calendar is gone: a piece passed yesterday is not "due for review today"
    AssertionError: the calendar still exported: expected true to be false // Object.is equality
 FAIL  tests/unit/repertoireRetention.test.ts > what counts as learned (progressStore.learnedPieces) > a piece passed or mastered on a measured run, with when it was last played
    TypeError: learnedPieces is not a function
 FAIL  tests/unit/repertoireRetention.test.ts > what counts as learned (progressStore.learnedPieces) > never a generated reading row, whatever an older build wrote on it, and never the learner’s word alone
    TypeError: learnedPieces is not a function
 FAIL  tests/unit/repertoireRetention.test.ts > what counts as learned (progressStore.learnedPieces) > and the session never offers a reading row as a piece to keep playable, even if it is handed one
    RangeError: Invalid time value
 FAIL  tests/unit/repertoireRetention.test.ts > neither reason is dropped for the other > a skill not shown for weeks and a piece past its window: Shuffle reaches both, each in its own words
    AssertionError: expected [ undefined ] to include 'skill-retention'
 FAIL  tests/unit/session.test.ts > buildSession > fills the template in order and never repeats an item
    TypeError: ids is not iterable
 FAIL  tests/unit/session.test.ts > buildSession > drops a row it cannot fill rather than showing an empty one
    TypeError: ids is not iterable
 FAIL  tests/unit/session.test.ts > buildSession > never offers a row you would have to import first
    TypeError: ids is not iterable
 FAIL  tests/unit/session.test.ts > buildSession > puts a learned piece past the repertoire window in the review row, in the piece’s words
    RangeError: Invalid time value
 FAIL  tests/unit/session.test.ts > buildSession > a different seed gives a different card
    TypeError: ids is not iterable
 FAIL  tests/unit/session.test.ts > swapOptions > offers the lesson’s other options first
    TypeError: ids is not iterable
 FAIL  tests/unit/session.test.ts > swapOptions > the "not a song" filter removes songs
    TypeError: ids is not iterable
 FAIL  tests/unit/session.test.ts > swapOptions > with no tier to offer, the same kind from the lessons reached, and nothing from no lesson
    TypeError: Cannot read properties of undefined (reading 'id')
 FAIL  tests/unit/sightReadingIsNotAPiece.test.ts > a reading row is not passed, mastered or put on the calendar > a reading row is never a learned piece, even one an old build marked passed
    TypeError: learnedPieces is not a function
 FAIL  tests/unit/sightReadingIsNotAPiece.test.ts > a reading row is not passed, mastered or put on the calendar > the pieces learned are pieces: a reading row an old build marked mastered is not one
    TypeError: learnedPieces is not a function
 FAIL  tests/unit/sightReadingIsNotAPiece.test.ts > “A piece you know” is said only of a piece the learner knows (L18, with S8) > a mastered piece the repertoire slot offers is "a piece you know"
    AssertionError: expected 'Something to just play' to match /^A piece you know — /
 FAIL  tests/unit/slotsFromEvidence.test.ts > A, day one: every slot claims only the rung > the warm-up is the lesson’s first exercise it asks for, never its reading row, and says the lesson asks for it
    AssertionError: expected 'drill.reading.sight-reading-2-right' to be 'drill.rhythm.eighths' // Object.is equality
 FAIL  tests/unit/slotsFromEvidence.test.ts > A, day one: every slot claims only the rung > the reading slot is the reader’s at Shuffle 0 (L65): the warm-up no longer takes the row
    AssertionError: expected undefined to be 'drill.reading.sight-reading-2-right' // Object.is equality
 FAIL  tests/unit/slotsFromEvidence.test.ts > A, day one: every slot claims only the rung > the new slot is the song the lesson asks for, the warm-up having taken its exercise
    AssertionError: expected 'exercise.rhythm.quarter-eighths.4bar' to be 'song.folk.london-bridge' // Object.is equality
 FAIL  tests/unit/slotsFromEvidence.test.ts > A, day one: every slot claims only the rung > review and repertoire fall to the rung’s own options, and the lines say nothing is due and where it is from
    AssertionError: expected undefined to be 'rung' // Object.is equality
 FAIL  tests/unit/slotsFromEvidence.test.ts > A, day one: every slot claims only the rung > no line is one of the old fixed sentences
    AssertionError: technique: “Warm-up in the keys you are working in”: expected [ …(6) ] to not include 'Warm-up in the keys you are working in'
 FAIL  tests/unit/slotsFromEvidence.test.ts > B: an exercise counted, the bass clef not shown for four weeks > the warm-up moves to the next lesson’s exercise, because this lesson’s is counted
    AssertionError: expected 'drill.reading.sight-reading-2-right' to be 'drill.chord.c-f-g' // Object.is equality
 FAIL  tests/unit/slotsFromEvidence.test.ts > B: an exercise counted, the bass clef not shown for four weeks > the review is skill retention: a phrase of the row the skill was shown on, and the line names the skill
    AssertionError: expected undefined to match object { kind: 'skill-retention', …(1) }
 FAIL  tests/unit/slotsFromEvidence.test.ts > B: an exercise counted, the bass clef not shown for four weeks > where the row does not write the skill’s demand into every phrase, the phrase is moved so it does
    AssertionError: expected undefined to match object { kind: 'skill-retention', …(1) }
 FAIL  tests/unit/slotsFromEvidence.test.ts > B: an exercise counted, the bass clef not shown for four weeks > the new slot is still this lesson’s song: the warm-up took the next lesson’s exercise
    AssertionError: expected 'exercise.rhythm.quarter-eighths.4bar' to be 'song.folk.london-bridge' // Object.is equality
 FAIL  tests/unit/slotsFromEvidence.test.ts > C: this lesson’s pieces counted, waiting on its reads; a learned piece not played for sixteen days > the review is repertoire retention, in the piece’s words and never a skill’s
    AssertionError: expected 'drill.dynamics.p-f' to be 'song.classical.ode-to-joy.ht' // Object.is equality
 FAIL  tests/unit/slotsFromEvidence.test.ts > C: this lesson’s pieces counted, waiting on its reads; a learned piece not played for sixteen days > the new slot begins the next lesson, and says this one waits for its reads
    AssertionError: expected undefined to match object { kind: 'asked', …(2) }
 FAIL  tests/unit/slotsFromEvidence.test.ts > C: this lesson’s pieces counted, waiting on its reads; a learned piece not played for sixteen days > the repertoire slot is this lesson’s music: a core-only learner has no style of their own to balance
    AssertionError: expected undefined to be 'rung' // Object.is equality
 FAIL  tests/unit/slotsFromEvidence.test.ts > D: nothing due, and a week without most of what the lessons have taught > the review row is the exposure rule: a kind of exercise taught and not played this week, said with when
    AssertionError: expected undefined to be 'exposure' // Object.is equality
 FAIL  tests/unit/slotsFromEvidence.test.ts > D: nothing due, and a week without most of what the lessons have taught > coordination, played eight days ago, is due too; Shuffle reaches it, with when it was last played
    AssertionError: expected 0 to be greater than 0
 FAIL  tests/unit/slotsFromEvidence.test.ts > the balance across the four cards (the plan’s rule; L26) > the rung’s intent, retention and exposure each choose a slot somewhere, and remediation alone chooses none
    AssertionError: expected [ undefined ] to include 'asked'
 FAIL  tests/unit/slotsFromEvidence.test.ts > the warm-up trains the unmet skill the evidence has shown least > picks the exercise for the skill with the fewest recent supported records, and the line names that skill
    AssertionError: expected 'ex.subdivision' to be 'ex.ties' // Object.is equality
 FAIL  tests/unit/slotsFromEvidence.test.ts > the asked line says what the requirement asks and what has counted > a count, none counted, and one counted
    TypeError: slotReason is not a function
 FAIL  tests/unit/slotsFromEvidence.test.ts > the asked line says what the requirement asks and what has counted > the items it names: this one and how many more
    TypeError: slotReason is not a function
 FAIL  tests/unit/slotsFromEvidence.test.ts > the asked line says what the requirement asks and what has counted > a performance, where the lesson asks for one
    TypeError: slotReason is not a function
 FAIL  tests/unit/slotsFromEvidence.test.ts > the exposure line keeps a family’s own name > a proper name keeps its capital after "Nothing due for review —"
    TypeError: slotReason is not a function

```
