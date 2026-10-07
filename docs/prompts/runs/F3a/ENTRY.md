### Entry 157 — F3a — the audited lesson sentences say only what the app does, what the page shows, or a teacher's heuristic said as one: flat fingers no longer "the main reason", practice strategies no longer laws, interleaving without its superlative, the blues without its universals and its unsourced history, Classical conventions as starting points, no "most pop piano", no "oldest way" on the ear-tune tip, and the three sentences that contradicted the app (1.5, ragtime.6, ragtime.7) brought to the app's own facts (T34, T36, T37, T42, T44, T45, T52, T55; T43 and T47 confirmed) (2026-09-29)

Built on base `f6d36ee9` in the worktree `agent-afcfb0e95fe66221d`, under the brief `docs/prompts/tasks/F3a-lesson-sentences-at-their-truth.md` (copied into this tree unchanged). The brief's line numbers were read at `ee481854`; `git diff ee481854 f6d36ee9` touches none of the lessons, the tip or the two test files, so they held. Every capture is in `docs/prompts/runs/F3a/`. Each run's `.txt` starts with its command and ends with `exit=<code>`; logs over 300 KB are summarised (the red run, 303 KB, as `red-unit-committed-lessons.txt`). Nothing was committed, staged, stashed or checked out. **Nothing was heard.** No picture was taken: every replacement is a sentence swapped inside its paragraph, with no paragraph, list item or heading added or removed, so each was read as text only (below).

## Judgement

**What changed.** Thirty-seven before/after pairs, in `docs/prompts/runs/F3a/sentences.md` with the layer and evidence for each. They cover nineteen lessons and the ear-tune tip, at the sentences the rows name. Two sentences just outside a named sentence but inside its lines were changed with it, because they were the same fault: practice.2's "At speed you cannot correct anything" (:18–19) and classical.4.shelf's "applied constantly" (:49–50). **Kept after checking:** practice.3's review intervals (code), classical.4's "typically" texture sentence (my judgement: it already carries the hedge), classical.4's trill definition, which "never below" is (source S16 and notation), and classical.6's rubato description (F0's S12 rewrite, word for word).

**The product read, sentence by sentence as a learner meets it.** I read every pair in full in the lesson around it.

- **Practice lessons** (practice.1, .2, .3, .5; 0.1; 1.1). Each strategy is still there as a thing to do: chunk and loop, restart the count after a mistake, slow down, climb in small notches, interleave, come back, change one variable. Each is now said as one way, a common starting point, or a rough guide, and none claims to be the only thing that works. A competent teacher would accept these as honest; I see nothing a teacher would call wrong. The practice.2 Tools paragraph still describes the app exactly, and its back-reference now points at "the ladder" rather than "the rule".
- **Interleaving** (practice.3, T37). It is said as a heuristic, "It can still help what you keep a week later, and what carries over to other music", with no source. Nothing in F0's list covers it, disposition row 9 says the music evidence is mixed, and I read no source for it. Its layer is teacher's heuristic, not sourced.
- **Blues** (blues.4, .5, .6, .8). The chord fact, the call-and-response activity and the pieces stay. The universals ("every other style", "never resolves, which is the point", "mostly space") and the history ("recorded it in 1928 and every boogie bass since…") are gone. The replacements say what the page shows ("Here the seventh on the I…"), point at the lesson's own activity, or name the pattern after the player without a history. *Unverified as music* for the blues.4 and blues.5 pairs: "part of its colour … listen to it as home" is a stylistic reading of this form, said as "here".
- **The raised fourth** (blues.4, T55). The paragraph now tells spelling from pitch. It says one key has two names (the sentence at :43, unchanged), that the app spells the note as a raised fourth (code), and that a raised fourth can be written in every key, a few with a double sharp. It never says any key lacks the note, as the reviewer's constraint requires. The `F1_VOICE` blues.4 row is revised in the same change and keeps its forbidden "no edition prints".
- **Classical** (classical.3, .4.shelf, .5, .6; technique.6). Articulation, the upper-note trill, pedalling, voicing and the rubato test are now starting points, or tests scoped to what the lesson describes. The trill has a source I read (S16, §"In baroque music": the default "through the time of Mozart", the exception after the upper neighbour, "only rules of thumb"). Every one of these pairs is *unverified as music*: they are performance judgements, reworded so that none is stated as a law, and nobody here has played or heard them.
- **The three contradictions** (T52). 1.5 names no pace for a tune the app plays at the converter's default. ragtime.6 no longer calls *The Easy Winners* "the most work … and the most rewarding", which its levels (7.0, 7.0, 7.1) do not carry; it names the page's fact instead, the most flats of the three. ragtime.7 compares *Sugar Cane* with Maple Leaf at no pace. That one needed more than the brief expected: the catalogue gives both 100, but the app's tempo reader plays Maple Leaf at 120 after its first beat (below).
- **Where word budget cost the brief's full intent.** classical.3 and classical.5 sit at the three-minute cap (597 and 598 words; 600 is the ceiling). So "interpretation as an informed choice among style, score, instrument, edition and listening" is carried by "One common starting point" in classical.3, whose previous sentence already says "articulation is your decision", and by "often … unless" in classical.5. The edition, instrument and listening are not named in either lesson (follow-up 1).

**The mechanism.** The rows' shared hypothesis was T49's pattern: each sentence stated more certainty than its evidence carried. **The test that could refute it**, per sentence, was whether the code, the built catalogue, the notation or an allowed source carries the claim as written. It refuted it four times: the review intervals, classical.4's two sentences and classical.6's rubato description are kept. It confirmed it for the rest. Along the way it found three premises wrong at the file:

1. **A Python test does read lesson prose.** `tools/content/tests/test_generator.py:659–667` asserts "starts on the **upper** note" in classical.5 and "on the note *above* the main one, and on the main note last" in technique.6. Both phrases are kept, and the test passes.
2. **The app does not play Sugar Cane and Maple Leaf at one tempo.** Maple Leaf's file writes `<sound tempo="120">` beside its quarter = 100 mark at measure ordinals 1 and 51. `tempoFromXml` takes the sound, and the engine's map is placed from it (`extractScoreModel.ts:375`). So the catalogue and the opening agree on 100, and the playback after the first beat does not (`probe-tempo-events.txt`). The ragtime.7 row therefore holds both facts, and the lesson makes no pace claim. Maple Leaf's 120 is a score's tempo and not this lane's (follow-up 2).
3. **"Here the ornaments arrive inside the pieces"** (classical.5, inside the named lines) was false. None of the rung's six files prints a trill, a mordent or a turn; only the Beethoven sonatina has grace notes (8). The sentence now says a trill in a piece is a sign. A rung that teaches trills with none in its pieces is follow-up 3.

## The sentences

Every pair, in full, with its layer and evidence: `docs/prompts/runs/F3a/sentences.md`, rows 1–37 (33 in `lessonClaimsAboutMusic` › F3a, one `F1_VOICE` revision, three in `lessonClaimsAboutApp` › F0). The same file carries the kept-and-verified list and S16, the one source read in this lane.

**Confirmations** (read only):

- **T43, *most 1920s bridges*:** removed by F0 in `b8f713c6` and pinned absent by `lessonClaimsAboutApp` › F0 › jazz.8 (green). The row's other items stand where they are: the chord-scale assignments (T39, F0), swing against shuffle (T41, F0), and jazz.7's stride (T54, outside expert).
- **T45:** *almost every heavy piano part* was rewritten by F1 in `a94baee9` and is pinned by `F1_VOICE` › rock.4 (green). *The sound of most pop piano* was still in chords-pop.7 and is changed here (row 33).
- **T47:** the phrase *nothing can sound wrong* was rewritten by F0 in `b8f713c6`. The claim is **still present under other words, hedged**, at improv.4:14–17: "a scale with no note that sounds wrong over most diatonic progressions. It is the reason the black keys alone (an F sharp pentatonic) sound good over almost anything." Left for G (*refine, not rebuild*).

## Done

Items 1–5 of *What is decided*, each done:

1. **The correction rule** is applied to every sentence in item 2. Each replacement is code, notation, source (S12, F0's; S16, read here, with its sections) or a teacher's heuristic said as one. None ranks causes, counts without evidence, puts "usually" or "most" in a count's place, or makes a historical claim without a source. The advice, activity and check under each are kept. Where the only correction would have been an ear's judgement, the claim was removed rather than replaced: "slow" (1.5), "gentler pace" (ragtime.7), "most rewarding" (ragtime.6), "for warmth" (classical.5).
2. **The sentences, by row.**
   - **T34:** 0.1 (row 1) and 1.1, both clauses (rows 2 and 3).
   - **T36:** practice.1 (rows 4 and 5); practice.2 (rows 6–10, plus 11, the back-reference only, as the constraint asks); practice.3 (row 14); practice.5 (rows 15–17), with the title kept because the body still offers three changes. The review intervals are verified and unchanged.
   - **T37:** practice.3 (rows 12 and 13), with the check at :48–49 kept.
   - **T42:** blues.4 (18), blues.5 (21), blues.6 (22) and blues.8 (23).
   - **T44:** classical.3 (24), classical.4.shelf (25 and 26), classical.5 (27–29), classical.6 (30 and 31) and technique.6 (32). classical.4's two sentences are verified and kept, and classical.6's rubato description is confirmed.
   - **T45:** chords-pop.7 (33), with rock.4 confirmed.
   - **T43 and T47:** confirmed, as above.
   - **T52:** 1.5 (35), ragtime.6 (36) and ragtime.7 (37).
   - **T55:** the tip (34), and blues.4's paragraph (19 and 20, with `F1_VOICE` revised).
3. **Not F3a's** (T54's list, 0.1:47–49, the ear-needing rows, T45's and T47's reviews, a score's tempo, and other sentences in the touched lessons): untouched, and listed under Follow-ups where the lint or a read found something.
4. **Red first, unit.**
   - `F3A_SENTENCES` (33 rows) sits beside `F1_VOICE` in `lessonClaimsAboutMusic.test.ts`, in its shape. The tip is read through `f3aTip`, beside `f0mText`.
   - `F1_VOICE` › blues.4 is revised: class *revise*, with its reason in a comment beside it.
   - The three T52 rows are in `F0_APP` in `lessonClaimsAboutApp.test.ts`, each joined to the app's fact: `tempo-defaulted`; the three levels and the keys; the catalogue's tempo against the tempo reader's map.
   - All 37 were seen red on the committed lessons, and every one of the 53 phrases that must be gone was found there (the red lines, below). All 37 are green after the edits.
5. **Deviations**, each at its item: the three refuted premises above, and the two sentences inside named lines (practice.2:18–19 and classical.4.shelf:49–50).

**The line counts behind `lessonShape`.** No lesson's `readingTime` changed: every touched lesson's word count stays inside its minute band (`words-after`, in the tests table). The tip has 177 words against `MAX_TIP_WORDS` 250, with its four headings unchanged.

**The absolutes lint, before and after** (information only; `lint-absolutes-before-after.txt`).

- **Gone from the touched sentences:** *the main reason* (0.1); *exactly*, *the reason* (1.1); *only* ×2, *never* (practice.2); *most*, *only* (practice.3); *always*, *only*, *every* (practice.5); *every*, *never* (blues.4:23–25); *every* (blues.6, blues.8); *most* (chords-pop.7); *most* ×2 (ragtime.6).
- **Kept, and why:**
  - practice.2:40 *every* ×2: the app moves "after every pass", which is the code.
  - blues.4:46 *every*: "A raised fourth can be written in every key", the spelling fact of the reviewer's finding.
  - classical.5:39 *the reason*: "the reason to settle a starting point now", a teacher's reason, not a causal claim.
  - technique.6:29 *only*: "not the only one", which is the hedge itself.
  - ragtime.6:82 *most*: "the most flats of the three", counted from the keys.

## Not done

- **Pictures:** none. The brief asked for a picture only where a replacement changes a paragraph's emphasis or structure. None adds, removes or reorders a paragraph, list item or heading. practice.3's bold lead-in changes words ("One way to shape a session."), but not its place or weight. So every pair was read as text only.
- **Naming the edition, instrument and listening in classical.3 and classical.5** (T44's "informed choice"): not done inside the three-minute cap. It needs a cut elsewhere in those lessons, which is outside the named sentences (follow-up 1).
- **Anything heard:** nothing. Every musical pair is *unverified as music*.
- **The whole browser suite:** not run. The map names six specs for these paths; those ran (tests table).
- **Sourcing interleaving:** not done. No allowed source covers it, so it is a teacher's heuristic.

## Follow-ups (recorded, not fixed)

1. **classical.3 and classical.5 at the cap.** T44 asks for interpretation as a choice among style, score, instrument, edition and listening. Both lessons are within three words of 600, so naming those needs a cut elsewhere in the lesson or a `KNOWN_LONG` decision (a product choice).
2. **Maple Leaf's tempo.**
   - The file: `song.ragtime.joplin-maple-leaf-rag` (MuseTrainer) writes `<sound tempo="120">` beside a quarter = 100 `<metronome>` at measure ordinals 1 (offset ¼) and 51 (`read-built-scores.txt`, `probe-tempo-events.txt`).
   - What the app does: `tempoFromXml` lets the sound win, so after its first beat the app plays Maple Leaf at 120, while the catalogue (`tempoBpm` 100) and the printed mark say 100.
   - Why it matters: ragtime.7:52–54 warns against a fast Maple Leaf.
   - A score's tempo, not this lane's. The ragtime.7 row fails when either fact moves.
3. **classical.5 teaches trills and mordents, and none of its six pieces prints one.** Only the Beethoven sonatina has grace notes (8). A rung-curation question: F's or the rung's owner's.
4. **ragtime.6:77–78** "The easiest way in, because the form is the only thing that is new" (lint *only*, :77). *The Entertainer* is the highest of the three levels (7.1 against 7.0 and 7.0).
5. **ragtime.6:80–81** "Gentler syncopation than *The Entertainer* but a harder key". The keys are E flat (−3) against C (0). "Gentler syncopation" needs an ear.
6. **practice.2:12** "almost nobody does it slowly enough": an uncounted frequency. The lint does not list "almost nobody".
7. **tips/ear-tune.md:14** "will take five times as long" (a precision nobody measured); **:17** "a phrase is usually two bars" and **:19** "Most phrases are mostly steps" (lint *most*): uncounted.
8. **practice.3's title**, "Interleaving, and what a session should look like" (front matter), against the paragraph that now says "One way to shape a session". Also **:27–28** "is where the learning happens" and **:31** "Ending on failure teaches you to dread the piano stool": causal absolutes.
9. **practice.5:21 and :27** "The fix is…" (lint *the fix*): the diagnosis's fixes are still stated as the fix.
10. **practice.1:12** "Most practice is spent playing the parts you can already play" (lint *most*).
11. **classical.3:20** "hearing those landings is most of playing it well" (lint *most*); **:28** "Baroque keyboard music has almost no marks in the original" (unsourced history); **:31** "A little space between phrases is worth more than any dynamic".
12. **1.5:36–39** "the single most valuable practice tool in the app" (lint *most*) and "does more for reading than an hour on a piece you know": an uncounted superlative and comparison. **1.5:50** "Scottish" is the catalogue's composer field ("Traditional (Scottish)"), kept.
13. **ragtime.7:21** "There is no shortcut and nobody has ever found one"; **:39** "the single most characteristic ragtime device" (lint *most*); **:52–53** "Those rolls were cut fast and often sped up in transfer" (unsourced history); **:47** "a rag in the Maple Leaf mould", kept (a style claim for G's review; the keys differ: B flat to E flat against A flat to D flat).
14. **blues.8:20–23** "every one of them takes a ninth without asking" (lint *every*) and "is what you hear on records"; **:37–39** the dates for Blake (1914) and Morton (1926) and "the hardest page here": unchecked here.
15. **chords-pop.7:22–23** "a ninth chord has the seventh in it and sounds like jazz": a genre association, for T45's style review (G).
16. **classical.6:20** "The fix is physical, not mental" (lint *the fix*); **:44** "You will always be playing into familiar ground" (lint *always*).
17. **classical.4.shelf:16** "most of them sit above this stage" (lint *most*): countable, not counted here.
18. **`generate_exercises.py:2509–2511`**, a comment, says classical.5 tells the learner "A Classical trill begins on the note above". The lesson now says "often". The comment is `tools/**` and not this lane's; the test beside it passes.
19. **T47:** improv.4:14–17 still claims it under other words (quoted above), for G.
20. **`song.folk.old-french-song.pdmx` is also `tempo-defaulted`** (96, the converter's). No sentence in classical.5 gives it a pace after this change; other lessons were not searched.

## Questions

None that block. The one product choice is follow-up 1 (a cut or a `KNOWN_LONG` exception to fit T44's full wording into classical.3 and classical.5), and it can wait for F's next pass.

## Files

Changed:
- `content/lessons/0.1.md`, `1.1.md`, `1.5.md`, `practice.1.md`, `practice.2.md`, `practice.3.md`, `practice.5.md`, `blues.4.md`, `blues.5.md`, `blues.6.md`, `blues.8.md`, `classical.3.md`, `classical.4.shelf.md`, `classical.5.md`, `classical.6.md`, `technique.6.md`, `chords-pop.7.md`, `ragtime.6.md`, `ragtime.7.md`
- `content/tips/ear-tune.md`
- `app/tests/unit/lessonClaimsAboutMusic.test.ts`: `F3A_SENTENCES`, `f3aTip`, and `F1_VOICE` › blues.4 revised
- `app/tests/unit/lessonClaimsAboutApp.test.ts`: three rows in `F0_APP`, and imports of `mxlToMusicXml` and `tempoEvents`

Added:
- `docs/prompts/tasks/F3a-lesson-sentences-at-their-truth.md` (the brief, unchanged)
- `docs/prompts/runs/F3a/ENTRY.md`, `sentences.md`, and the captures listed in the tests table

Read only, unchanged: `improv.4.md`, `jazz.8.md`, `rock.4.md` and `classical.4.md` (verified, no edit).

Not for the commit, deleted before the end: `app/playwright.f3a-4493.config.ts` (the port-4493 copy) and `app/tests/unit/zzF3aTempoProbe.test.ts` (the probe; a copy is kept as `docs/prompts/runs/F3a/scripts-zzF3aTempoProbe.test.ts`). Also deleted at the end: `app/test-results`, `app/dist`, `app/playwright-report`, the copied `content/scores/imported/{kern,musetrainer,mutopia}` and the copied `build/cache`. The built `app/public/content`, `app/node_modules` and my scratch under `build/f3a/` remain; all three are gitignored.

## The red lines

From `red-unit-committed-lessons.txt`: the new rows on the committed lessons. 39 failed; 37 are this lane's, and 2 were already failing before any change (`baseline-committed-tests.txt`: `blues.3` and `4.7` in the 2026-09-19 block, which read `"\n"` in source that this Windows checkout holds as CRLF). One line per row:

- **The three `F0_APP` rows (T52)** each failed with `expected false to be true`. Vitest printed that one error for all three. On the committed lessons, the failing clauses are the text ones: 1.5's sentence has "slow"; ragtime.6's entry has "most work" and "most rewarding", which the levels (7.0, 7.0, 7.1) do not carry; ragtime.7's sentence has "gentler pace". Each row's replacement was also absent. Their fact clauses hold: the same facts are read in the green run, where all three pass.
  - `1.5: The Water Is Wide is named with no pace, while the app plays it at convert.py's default because the upload has no tempo of its own`
  - `ragtime.6: The Easy Winners is ranked by no effort the three levels do not carry, and is named for the flats its file has most of`
  - `ragtime.7: Sugar Cane is likened to Maple Leaf at no pace, while the catalogue gives the two one tempo and the app's tempo map does not`
- `F1_VOICE › blues.4: the flat spellings get awkward, with no claim about every edition` — expected ' The blues is a form before it is a s…' to contain 'The app spells it as a raised fourth,…'
- **The 33 `F3A_SENTENCES` rows.** Each line gives the first assertion, and how many of the row's phrases that must be gone were found in the committed lesson; 53 in all, every one:
  - `0.1: T34: flat fingers are a habit to reset…` — not to contain 'the main reason' (1 of 1 found)
  - `1.1: T34: one finger for each key is C position's own rule…` — not to contain 'exactly one finger' (2 of 2)
  - `1.1: T34: printed fingering is the edition's advice…` — not to contain 'it is not a suggestion' (2 of 2)
  - `practice.1: T36: several right in a row…` — not to contain 'five times correct in a row' (2 of 2)
  - `practice.1: T36: the check is the target the learner set…` — not to contain 'five times running' (1 of 1)
  - `practice.2: T36: about half the speed is a common starting point…` — not to contain 'usually about half' (1 of 1)
  - `practice.2: T36: slow practice gives time to be accurate on purpose…` — not to contain 'cannot correct anything' (2 of 2)
  - `practice.2: T36: slow practice makes tension easier to notice…` — not to contain 'the only way to notice tension' (1 of 1)
  - `practice.2: T36: three clean then a small notch…` — not to contain 'three clean repetitions, then up one notch' (2 of 2)
  - `practice.2: T36: the ladder avoids grinding…` — not to contain 'much faster than the alternative' (1 of 1)
  - `practice.2: T36: the Tools paragraph points back at the ladder…` — not to contain 'the rule above made quicker' (1 of 1)
  - `practice.3: T37: forty minutes on one thing…` — not to contain 'least efficient' (2 of 2)
  - `practice.3: T37: interleaving can help…` — not to contain 'markedly better retention' (2 of 2)
  - `practice.3: T36: the session is one way to shape one…` — not to contain 'what a session looks like.' (2 of 2)
  - `practice.5: T36: three causes worth checking…` — not to contain 'almost always one of three' (1 of 1)
  - `practice.5: T36: rebuilding can take a while…` — not to contain 'it takes a week' (2 of 2)
  - `practice.5: T36: the diagnosis is a rough guide…` — not to contain 'if the mistakes move around, it is one' (2 of 2)
  - `blues.4: T42: the seventh on the I is colour here…` — not to contain 'in every other style' (3 of 3)
  - `blues.4: T55: the raised fourth can be written in every key…` — not to contain 'runs out' (2 of 2)
  - `blues.5: T42: leave the space…` — not to contain 'the blues is mostly space' (1 of 1)
  - `blues.6: T42: the pattern carries Smith's name…` — not to contain 'every boogie bass since' (2 of 2)
  - `blues.8: T42: the piece is named with the date its catalogue row carries…` — not to contain 'every boogie bass since' (2 of 2)
  - `classical.3: T44: stepwise legato and detached leaps are a common starting point…` — not to contain 'the convention that works' (1 of 1)
  - `classical.4.shelf: T44: the three skills are the ones this lesson picks…` — not to contain 'what romantic piano writing asks for' (1 of 1)
  - `classical.4.shelf: T44: pedal where the page marks it or you add it…` — not to contain 'applied constantly' (2 of 2)
  - `classical.5: T44: the upper-note start is what a Classical-period trill often does…` — not to contain 'a trill in classical style starts' (1 of 1)
  - `classical.5: T44: a trill in a piece is a sign…` — not to contain 'memorise the rule' (2 of 2)
  - `classical.5: T44: neither score marks pedal…` — not to contain 'both want the pedal' (2 of 2)
  - `classical.6: T44: the melody often sits on top of the right hand…` — not to contain 'usually holds' (2 of 2)
  - `classical.6: T44: the metronome tests the kind of rubato the lesson describes…` — not to contain 'rubato survives a metronome' (1 of 1)
  - `technique.6: T44: the written-out trill is one common Classical way…` — not to contain 'the classical convention rather than a house rule' (1 of 1)
  - `chords-pop.7: T45: add9 is a sound you will hear in pop piano…` — not to contain 'the sound of most pop piano' (1 of 1)
  - `tips/ear-tune: T55: working by ear puts the ear first…` — not to contain 'oldest way to learn music' (2 of 2)

Two edits came after the red run, and neither changes what it showed.

- The replacement string of `classical.5: … a trill in a piece is a sign` was shortened, to fit the three-minute cap. It was absent from the committed lesson in both forms.
- The ragtime.6 row's three `item()` calls were unrolled from a destructured `map`, for `tsc -b`'s unchecked-index rule. The logic is the same.

## Tests

Every capture is under `docs/prompts/runs/F3a/`. Unit counts are from vitest's summary lines. Nothing in this table is a measurement of the app.

| Step | Command | Result | Exit | Capture |
| --- | --- | --- | --- | --- |
| Fresh worktree: parity reference | `python tools/midi-cleanup/tests/parity_reference.py` | 5 reference files written; the 3 real-MIDI files skipped (not fetched) | 0 | `parity-reference.txt` |
| Fresh worktree: `npm ci` | `(cd app) npm ci` | installed; 0 vulnerabilities | 0 | `npm-ci.txt` |
| Content build, before any edit | `python tools/content/build.py --offline`, with the caches copied read-only from the main checkout | built `app/public/content`; `SOURCES.md`, `inventory.md` and `rung-claims.md` restored from snapshots | 0 | `content-build-offline-initial.txt` |
| Catalogue and scores re-read in this build | `build/f3a/facts.py`, `build/f3a/scan.py` | the levels, keys, tempos and tags the sentences rest on; the scores' marks; `scan.py` identical on the main checkout's build | 0 | `read-built-catalogue.txt`, `read-built-scores.txt` |
| Tempo probe (not for the commit) | `(cd app) npx vitest run tests/unit/zzF3aTempoProbe.test.ts` | Maple Leaf's events 100, 120, 120; Sugar Cane 100; Water Is Wide 96 | 0 | `probe-tempo-events.txt`, `scripts-zzF3aTempoProbe.test.ts` |
| Baseline: the committed claim tests | the committed `lessonClaimsAboutApp` and `lessonClaimsAboutMusic` (copied to `zzBase*`), `lessonClaimsNeverTeachWrong`, `lessonShape`, `lessonClaims` | 2 failed, 466 passed: `blues.3` and `4.7`, which read `"\n"` in CRLF source | 1 | `baseline-committed-tests.txt` |
| **Red:** new rows, committed lessons | the five named files | 39 failed, 465 passed: the 37 new or revised rows and the same 2 | 1 | `red-unit-committed-lessons.txt` |
| Absolutes lint, before and after | `tools/content/lint_absolutes.py` (`findings`, per touched lesson) | diagnostic | 0 | `lint-absolutes-before-after.txt` |
| Word counts and `readingTime`, before and after | `build/f3a/words.py` | no band crossed; the tip has 177 words (≤ 250) | 0 | `words-before-after.txt` |
| Content build after the edits | `python tools/content/build.py --offline` | rebuilt; the three files restored | 0 | `content-build-offline-after-edits.txt` |
| **Green:** the five named files | `(cd app) npx vitest run tests/unit/lessonClaimsAboutMusic.test.ts tests/unit/lessonClaimsAboutApp.test.ts tests/unit/lessonClaimsNeverTeachWrong.test.ts tests/unit/lessonShape.test.ts tests/unit/lessonClaims.test.ts` | 2 failed, 502 passed. All 37 of this lane's rows pass; the 2 failures are the baseline's, unchanged | 1 | `green-unit-named-files.txt` |
| Typecheck | `(cd app) npx tsc -b` | clean. The first run (exit 2) caught the ragtime.6 row's destructured `map` under unchecked indexing, fixed as noted under the red lines | 0 | `tsc.txt` |
| Lint | `(cd app) npm run lint` | clean; run after the port-4493 config copy and the probe were deleted | 0 | `lint.txt` |
| Content validation | `python tools/content/validate.py --allow-nc --personal` | "content validation OK" (2,092 catalogue items); views regenerated, 0 stale | 0 | `validate.txt` |
| Review check | `python tools/content/review.py --check` | passes | 0 | `review-check.txt` |
| Content suite | `python -m unittest discover -s tools/content/tests -t tools/content` | 1,477 tests OK, 4 skipped. Includes `test_generator.py`'s `test_the_lessons_still_say_what_this_builds`, which reads classical.5 and technique.6 | 0 | `content-tests.txt` |
| Whole unit suite | `(cd app) npx vitest run` | 3 failed, 7,215 passed, 5 skipped, 1 todo. The failures are the baseline's 2, and `expectedNote.test.ts` › "every black key in every fixture…" timing out at 5,000 ms under the full parallel run | 1 | `vitest-all.txt` |
| … that timeout, alone | `(cd app) npx vitest run tests/unit/expectedNote.test.ts` | 12 passed. Load, not F3a: the file reads score fixtures, not lessons | 0 | `vitest-expectedNote-alone.txt` |
| App build | `(cd app) npm run build:app` | built | 0 | `build-app.txt` |
| The map | `python tools/docs/checks_for_paths.py <the changed paths>` | names content-build, content-validate, review-check, content-tests, tsc, lint, unit, build-app, and six browser specs | 0 | `checks-for-paths.txt` |
| Browser: the map's six specs | `(cd app) npx playwright test tests/e2e/lesson-flow.spec.ts tests/e2e/lesson-tools.spec.ts tests/e2e/plan.spec.ts tests/e2e/side-panel-prose.spec.ts tests/e2e/start-and-return.spec.ts tests/e2e/tips.spec.ts --config=playwright.f3a-4493.config.ts --workers=2` (all six files checked to exist first; port 4493; never 4173) | 53 passed: lesson-flow 1, lesson-tools 4, plan 28, side-panel-prose 4, start-and-return 8, tips 8 | 0 | `e2e-map-specs-4493.txt` |

**Unverified, beside what passes:**
- Every musical pair (rows 1, 18, 21, 24, 26, 27, 30, 31 and 32 in `sentences.md`) is *unverified as music*. Row 29 is notation: neither file marks pedal. The tests prove that the words changed and that the app's facts hold under them, not that the new sentences are good teaching.
- Interleaving (rows 12 and 13) is a teacher's heuristic with no source.
- Nothing was heard.

## Doc rows

- **`docs/08-test-map.md` :137, the *Never teach wrong* row.**
  - Third column: after "…the notes-per-second comparisons)," insert "and the F3a blocks (Entry 157): `lessonClaimsAboutMusic` › F3a, thirty-three sentences from T34, T36, T37, T42, T44, T45 and T55, each with the words that stated its certainty gone and its replacement as written, the ear-tune tip read through `f3aTip`; `F1_VOICE` › blues.4 revised to spelling against pitch; and three `F0_APP` rows for T52, joined to the app's fact — 1.5 and `tempo-defaulted`, ragtime.6 and the three levels and keys, ragtime.7 and the catalogue's tempo against the tempo reader's map,".
  - Second column: append "; a practice strategy stated as the only thing that works; a pace or effort word the app's facts do not carry, or one true of the catalogue and false of the engine's tempo map".
  - Last column: append "; F3a (Entry 157): 37 sentences, each seen red on the committed lessons; nothing heard, the musical ones unverified as music".
- **`docs/08-test-map.md` :500, the `lessonClaimsAboutApp.test.ts` line.** Append: "; F3a's three T52 rows (1.5 names no pace for a `tempo-defaulted` tune; ragtime.6 ranks no rag by effort its levels do not carry and names the flats its keys have; ragtime.7 compares *Sugar Cane* at no pace while the catalogue gives it Maple Leaf's tempo and `tempoFromXml` gives Maple Leaf 120 after its first beat)".
- **`docs/08-test-map.md` :501, the `lessonClaimsAboutMusic.test.ts` line.** Append: "; `F3A_SENTENCES` (Entry 157), F1_VOICE's shape, for thirty-three audited sentences and the ear-tune tip (`f3aTip` reads `content/tips`)".
