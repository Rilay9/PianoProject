### Entry 88 — F1: the eleven F0 deferrals classed "F's voice rewrite" — the most common rhythm error, almost every beginner, the first real piece, most learners, no edition, almost every heavy part, the most-used gesture, the clearest example, most film music since 1960, ten minutes, the oldest trick — each sentence keeps its advice and drops the uncounted claim; no count put in a count's place; twelve rows red first (2026-09-27)

**Judgement.** Eleven sentences (twelve superlatives: F0's row 46 holds two in chords-pop.5) no longer state as fact what nobody counted, and none of them now states a different fact in its place. The three where the advice was hardest to keep, as a learner now reads them:

1. *3.4, the Petzold:* "…then the Petzold *Minuet in G*, whose right hand ranges well above the staff." The ranking is cut, not replaced. Both replacements on offer were new factual claims, and one of them is false. The brief's candidate, "the first piece here written for both hands at once", fails on the plan itself: rung 2.1 already offers four hands-together settings on two staves (the curriculum's `songOptions` for stages 0–3 read against the built catalog, `songs-before-3.4.txt`; T12's 2.1 row says the same). Reader 1's "the first piece in the plan written to be played rather than arranged down to a few notes" is another "first in the plan", resting on the provenance of every earlier song. The brief's fallback, "a good first piece", invites the same ranking again, since the learner has been playing tunes in *Keep tempo* since 1.2. What is left is the clause the rung is about, and I checked it. The right hand's highest note is B5; 11 of its 129 notes are written above the staff's top line (G5 and up), and 4 of those sit on or above the first ledger line (A5, B5). There is no 8va in the file (read from the built `.mxl` by staff position, `petzold-range.txt`). "Well above" is generous for B5, but it is the lesson's word, not the named claim, so it stays and is listed under Follow-ups.
2. *chords-pop.5, sus4:* "Play sus4 then the plain triad and you have a pop-piano gesture." The superlative was the only reason the sentence gave, so what survives is thin: the instruction and the style label. That is the honest amount. Reader 1's "a gesture pop piano uses constantly" swaps an uncounted superlative for an uncounted frequency, which the reviewer's rule forbids.
3. *blues.4, the flat spellings:* "…the flattened fifth of F is C flat, of B flat is F flat, of E flat is B double flat — names that are awkward to read." The survey of every edition had been standing in for the reason the flat spelling "runs out". The reason is now the teacher's (the names are awkward to read), not a claim about print. Reader 1's "which is why nobody writes it that way" was the same absolute in other words.

As a teacher's reading: every one is a sentence a teacher could say without "well, actually". The two style pointers left for G (rock.4, "one that heavy piano parts are built from"; jazz.7, "it turns up in film music too") are for G to judge: I kept the pointer and removed the count, and nothing more. Nothing was heard. Nothing here needed hearing to decide it, but the four style pointers (rock.4, jazz.7, and chords-pop.5's two) are **unverified as music**.

**No sentence was deferred as a contested fact.** In each of the eleven, the advice does not depend on the absolute being true. Counting through a rest, checking the subdivision, playing the Petzold for its ledger lines, starting on the Attwood, spelling the blue note as a raised fourth, holding the power chord and the ostinato, playing sus4 into the triad, weighting the Prelude's chords, practising quartal stacks, choosing one long piece, thinning the ending for the intro: none of it rests on the claim that was removed.

## Done

1. **The eleven sentences** (decided 1, 2), every one in the table below, lesson text only, and only at the named sentences. The reason column of F0's table was followed row by row. For 3.4, I checked Reader 1's rewrite and the brief's candidate, and cut the claim instead of taking either. rock.4 and jazz.7 lost the count only. classical.9 says nothing precise: "minutes of music".
2. **Not the contested-fact pass** (decided 3): rows 1, 22, 83 and every other F0 deferral are untouched. Neighbouring absolutes in the same paragraphs were left alone and are listed under Follow-ups.
3. **`readingTime` rechecked** (decided 4), counted the way `lessonShape.test.ts` counts (body split on whitespace, ceil(words / 200)): all eleven stay at 3. The tightest are blues.4 at 599 and jazz.7 at 599 against the 600-word cap; the lowest is 3.4 at 409, above the 400 at which it would drop to 2. Before and after in `wordcount-before.txt` and `wordcount-after.txt`:

   | lesson | words before | after | readingTime |
   | --- | --- | --- | --- |
   | 1.2 | 451 | 447 | 3 → 3 |
   | 2.2 | 512 | 504 | 3 → 3 |
   | 3.4 | 419 | 409 | 3 → 3 |
   | classical.4 | 539 | 538 | 3 → 3 |
   | blues.4 | 598 | 599 | 3 → 3 |
   | rock.4 | 577 | 573 | 3 → 3 |
   | chords-pop.5 | 507 | 502 | 3 → 3 |
   | rock.6 | 596 | 587 | 3 → 3 |
   | jazz.7 | 598 | 599 | 3 → 3 |
   | classical.9 | 507 | 506 | 3 → 3 |
   | chords-pop.9 | 472 | 466 | 3 → 3 |

4. **The claims rows** (decided 4): no row in either claims file held any of the eleven sentences. A search of the whole worktree for the eleven removed phrases found them in the lessons, in docs and in one generator comment, and in no test. A second, broader search of `app/tests`, for the pieces' and ideas' names (Petzold, Attwood, Prelude No. 20, power chord, quartal), found tests that name them (the ladder, evidence, videos, the arrange race, the harmony namer, the rock.6 row that holds "thirteen bars"), and none of those reads the sentences changed here. So all twelve rows are **added**. Old assumption: none, since no test held these sentences, and the lint listed six of them without pinning anything. They sit in `lessonClaimsAboutMusic.test.ts` as one block after F0a. None of the eleven states what the app does; 3.4's "in the plan" and rock.6's "in the library" were rankings of pieces, which is the music file's subject.
5. **The lint rerun** (decided 4): `lint-before.md` has 600 occurrences in 109 lessons and `lint-after.md` has 592. Compared by (lesson, word, sentence), ignoring line numbers (`lint-compare.txt`), exactly 8 are gone and 0 are new, across all 109 lessons: 1.2 *most*, 2.2 *every* ×2, chords-pop.5 *most* ×2, classical.4 *most*, jazz.7 *most*, rock.4 *every*. The lint only ever listed six of the eleven. The other five (3.4 "first real", blues.4 "no edition", rock.6 "clearest", classical.9 "ten minutes", chords-pop.9 "oldest") carry none of its eleven words, so the F1 rows are the only check on those five. Every other row the lint prints for these eleven lessons is unchanged, apart from line numbers one lower after the edit in 3.4 and in chords-pop.9, each of which lost a source line.
6. **The table** (decided 5), below; the layer is a teacher's judgement for every row.

Technical verdict: the build and the validator pass. `lessonClaimsAboutMusic` (152/152) and `lessonShape` (21/21) pass. `lessonClaimsAboutApp` has 282 of 284 passing; its 2 failures are this worktree's CRLF checkout, known since Entry 84, in rows that read two source files I did not touch (Checks). Pedagogical verdict: each sentence still gives the learner the same instruction and claims less. The chords-pop.5 sus4 sentence is the one that lost the most colour, and I judge that correct: the colour was the claim.

## Not done

- **Nothing in the brief is left undone.** One item is narrower than it may read: "the lint rerun to show the eleven gone from its output". The lint could only ever show six of the eleven. The other five were never in its output, and the rows cover them (item 5).
- The Petzold's right-hand range, which 3.4 now leans on alone, was **observed, not pinned**: no row asserts it. Adding one would be a new fact row, beyond "the absolute is gone". I left it out and say so here.

## Follow-ups (classified; none done here: outside the eleven sentences or outside my files)

1. **P2, a neighbouring absolute that is not quite true** (blues.4:46, the next sentence after mine): "A raised fourth works in every key." On a tonic of C sharp, G sharp, D sharp or A sharp the raised fourth is a double sharp (F double sharp on C sharp, where the flat spelling, G natural, is the plain one). That is the problem the paragraph blames on the flat spelling, from the other side. For every tonic from C flat round to F sharp the sentence holds. Whether any bundled blues material sits on one of those four tonics was not checked. The lint lists it (*every*). For F.
2. **For F's voice pass, uncounted superlatives in the same lessons, not in F0's eleven:** classical.9:16 "The single most common way to waste a year is to start four large pieces and finish none" (the same class as 1.2's; the lint lists it); rock.6:49 "*Play it as a duet* is worth more here than almost anywhere" (the lint does not see it, because "almost anywhere" is not one of its words).
3. **One fact, three places (record hygiene, P3, not learner-facing):** `tools/content/generate_exercises.py:5340` (a comment) still says the flat spellings are ones "no edition prints", and `:4204-4205` (the quartal family's docstring) says quartal voicings are the sound "of a great deal of film music". `app/src/audio/backingLoop.ts:122` calls root-and-fifth bass "the oldest accompaniment there is". The generator and app code are not mine.
4. **Learner-facing, not a lesson:** `content/tips/ear-tune.md:7`: "It is the oldest way to learn music and it is the one that most reliably produces players who can actually hear what they are doing". That is two uncounted superlatives, the same kind as chords-pop.9's. Tips are not mine. For F.
5. **P3, 3.4's kept clause:** "whose right hand ranges well above the staff". The right hand reaches B5, with 4 of its 129 notes on or above the first ledger line, so "well" is generous. It is not the named claim and was left as it was. For F, if F wants it exact ("climbs above the staff").
6. **Record, stale after this entry:** `docs/prompts/f0-disposition-85.md` rows 5, 14, 18, 29, 34, 41, 46, 63, 70, 85, 87 still read "deferred to F"; `docs/prompts/lint-absolutes-2026-09-26.md` still lists the eight rows now gone; `docs/lesson-audit/batch-*.md` keeps the eleven boxes unticked. Process hygiene, for the orchestrator. Not mine.

## Questions

- None that block. One for the reviewer, because it decides how far F's voice pass goes: is an existence-only style pointer ("one that heavy piano parts are built from", "it turns up in film music too", "a pop-piano gesture") the right floor for G to review? The alternative is to cut the pointer until G has judged it. I kept the pointers because each one tells the learner where the sound lives, and none of them counts anything.

## Files

Changed: `content/lessons/` 1.2, 2.2, 3.4, classical.4, blues.4, rock.4, chords-pop.5, rock.6, jazz.7, classical.9, chords-pop.9 (the named sentences only; `lessons.diff`); `app/tests/unit/lessonClaimsAboutMusic.test.ts` (the F1 block appended, 104 lines; nothing above it changed).
Not touched: `app/tests/unit/lessonClaimsAboutApp.test.ts` (no row reads these sentences), `help.ts`, the generator, the curriculum, the evidence and session code, every other lesson, the docs.
Not tracked, in this worktree only: `content/scores/imported/kern`, `content/scores/imported/musetrainer` and `build/cache/convert`, copied from the main checkout (which was only read) so that the offline build could run. All three are gitignored, and none appears in `git status`. The offline fetch rewrote no tracked file: `git status --short` was empty after the first build (before any edit) and listed only my twelve files after the second.

## Every changed sentence, before and after

Layers: as Entry 82 defines them. **Teacher** means a teacher's judgement, written as advice or a plain pointer, never as a count. Every row here is teacher; none is source or code. Line numbers are the lesson's lines now, with the old audit's line in brackets. "Before" and "after" are the lesson's words with emphasis marks dropped; "…" marks words left as they were.

| # | Lesson and line (F0 row) | Before | After | Reason | Layer |
| --- | --- | --- | --- | --- | --- |
| 1 | 1.2:28-29 [audit :26] (5) | A rest is not a pause — it is a beat that happens to be silent, and letting it run long is the most common rhythm error there is. | A rest is not a pause — it is a beat that happens to be silent, and it is easy to let it run long. | A ranking of every rhythm error, uncounted. The warning stays, as an easy mistake rather than the commonest one (Reader 1's rewrite, in substance). | teacher |
| 2 | 2.2:20-21 (14) | Almost every rhythm problem a beginner has is a subdivision problem, and almost every fix is to count the "ands" out loud. | When a rhythm goes wrong, check the subdivision first: count the "ands" out loud. | Two frequencies over all beginners. The advice stays as an order of checking, not a frequency. The brief's example "the usual suspect" was not used: "usual" is a smaller uncounted frequency. | teacher |
| 3 | 3.4:39-40 [audit :40] (18) | … then the Petzold Minuet in G — the first real piece in the plan, and one whose right hand ranges well above the staff. | … then the Petzold Minuet in G, whose right hand ranges well above the staff. | The ranking is cut. The brief's candidate ("first … written for both hands at once") is false of the plan (2.1's four hands-together settings); Reader 1's is a new "first in the plan"; "a good first piece" re-invites the ranking. The kept clause is observed: the right hand reaches B5. | teacher |
| 4 | classical.4:41-42 [audit :42] (29) | Five options: Attwood's Sonatina in G, the first sonatina most learners meet; C. P. E. Bach's … | Five options: Attwood's Sonatina in G, the one to start on; C. P. E. Bach's … | A survey of learners, unsourced. F0's "useful half is start here" is kept (Reader 1's words). It agrees with the rest of the app: the Tools paragraph's duet opens it as "the first of those five", classical.5 calls it "the gentler one to go back to", and its catalog level is the lowest of the rung's five (levels are asserted, so that is agreement, not proof). | teacher |
| 5 | blues.4:44-46 [audit :44] (34) | … of E flat is B double flat — and no edition prints those. | … of E flat is B double flat — names that are awkward to read. | An absolute over every edition; the old audit says such spellings appear in some editions, though it names none. The arithmetic stays, and the reason is now a readability judgement, not a survey. Reader 1's "nobody writes it that way" was the same absolute. | teacher |
| 6 | rock.4:13-16 [audit :9] (41) | This is the first rock texture under your hands, and it is the one almost every heavy piano part is built from: … | This is the first rock texture under your hands, and one that heavy piano parts are built from: … | The count is removed and no other put in, because authenticity is G's (decided 2). Reader 1's "usually built from" was not used: a smaller uncounted frequency. | teacher (style pointer left for G) |
| 7 | chords-pop.5:26-27 [audit :27] (46) | Play sus4 then the plain triad and you have the most-used gesture in pop piano. | Play sus4 then the plain triad and you have a pop-piano gesture. | A superlative over an uncounted repertoire. The instruction and the style label stay. Reader 1's "uses constantly" was not used. | teacher |
| 8 | chords-pop.5:30-31 [audit :29] (46) | … closer under the hand, and the one you will hear in most modern ballad writing. | … closer under the hand, and one you will hear in modern ballad writing. | "The one … in most" is a share of modern ballads; "one you will hear" is a pointer with no share. Reader 1's "tends to reach for" was not used. | teacher |
| 9 | rock.6:42-44 [audit :39] (63) | Chopin's Prelude No. 20 is thirteen bars of block chords and is here because it is the clearest example in the library of weight placed rather than struck — … | Chopin's Prelude No. 20 is thirteen bars of block chords and is here for weight placed rather than struck — … | A superlative over the whole library, never surveyed. Why the piece is on the rung stays, and so does its measured basis ("thirteen bars", held by the rock.6 row in `CLAIMS`). Shorter than Reader 1's rewrite because of the word cap. | teacher |
| 10 | jazz.7:21-23 [audit :24] (70) | … the sound is not a chord with a name — it is modal jazz, and most film music written since 1960. | … the sound is not a chord with a name — it is modal jazz, and it turns up in film music too. | A share of a medium, plus a date as fake precision. The listening pointer stays as plain existence: no share, no date (decided 2, G's). Reader 1's "turns up constantly" was not used, because "constantly" is the count. | teacher (style pointer left for G) |
| 11 | classical.9:12-14 [audit :13] (85) | These are pieces to live with — ten minutes of music, several months of work, and a result that keeps changing for years afterwards. | These are pieces to live with — minutes of music, several months of work, and a result that keeps changing for years afterwards. | Fake precision (gate 4): one figure for pieces of 83 to 262 bars (catalog `notation.bars`, read this session). The contrast of minutes, months and years is the point, and it stays. Reader 1's "a few minutes" undersells the Ballade. The brief's "pieces that run several minutes" is still a duration claim, and nobody here timed the six. | teacher |
| 12 | chords-pop.9:20-21 [audit :20] (87) | Steal the intro from the last eight bars. The oldest arranging trick there is: whatever you do at the end, do a thinner version of it at the start, and the song sounds designed. | Steal the intro from the last eight bars. Whatever you do at the end, do a thinner version of it at the start, and the song sounds designed. | A historical superlative with no advice under it, so it is cut (decided 1). The advice after the colon now stands alone. Reader 1's "the plainest arranging trick there is" is still a superlative. | teacher |

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `lessonClaimsAboutMusic.test.ts` › *F1: the voice rewrite — each sentence keeps its advice and drops the uncounted absolute* (12 rows) | add | none: no row held these sentences, and the lint listed six of them without pinning anything | per row, soft assertions: each removed absolute is absent from the lesson (case-insensitive, emphasis dropped, whitespace flattened by F0's `f0mText`), and the rewritten words are present word for word |
| `lessonClaimsAboutMusic.test.ts`, every earlier block | preserve | — | passes unchanged: the old file is an exact byte prefix of the new one, with 104 lines appended (`test-append-check.txt`) |
| `lessonClaimsAboutApp.test.ts` | preserve (not touched) | — | no row reads these sentences; 282/284 pass, and the 2 failures are the worktree's CRLF checkout (Checks), not this change |
| `lessonShape.test.ts` | preserve (not owned) | — | passes: its reading-time and three-minute tests held every edit |

## The red line

`red-f1-rows.txt`: the new block run against the unchanged lessons (`-t "F1:"`, exit 1), with **12 of 12 rows red and 26 of 26 assertions red**. Every removed phrase was still present, and every rewritten sentence was missing. First assertion of each row:

- 1.2: `expected ' so far you have counted notes that l…' not to contain 'most common rhythm error'`
- 2.2: `… not to contain 'almost every rhythm problem'`, then `'almost every fix'`
- 3.4: `… not to contain 'first real piece'`
- classical.4: `… not to contain 'most learners meet'`
- blues.4: `… not to contain 'no edition prints'`
- rock.4: `… not to contain 'almost every heavy piano part'`
- chords-pop.5: `… not to contain 'most-used gesture'`; second row `… not to contain 'most modern ballad writing'`
- rock.6: `… not to contain 'clearest example'`
- jazz.7: `… not to contain 'most film music'`, then `'since 1960'`
- classical.9: `… not to contain 'ten minutes'`
- chords-pop.9: `… not to contain 'oldest arranging trick'`

Each row's last assertion failed too, in the form `expected ' Triads are three notes …' to contain 'Play sus4 then the plain triad and yo…'`. Green after the edit: see Checks.

## Checks (unpiped: output to files in this folder, exit codes read)

| Run (from the worktree root unless marked app/) | Exit | Note |
| --- | --- | --- |
| copy of `content/scores/imported/{kern,musetrainer}` and `build/cache/convert` from the main checkout (read-only there) | 0 | all gitignored in the worktree (`git check-ignore`) |
| app/ `npm ci` (node_modules absent) | 0 | `run-npm-ci.txt` |
| `python tools/content/build.py --offline`, unchanged lessons | 0 | 2061 items, validation OK, 109 lessons (`run-build-before.txt`); `git status --short` empty afterwards, so no tracked file was rewritten |
| `python tools/content/lint_absolutes.py`, and `--out lint-before.md`, unchanged lessons | 0, 0 | 600 occurrences (`run-lint-before-summary.txt`, `lint-before.md`) |
| app/ `npx vitest run tests/unit/lessonClaimsAboutMusic.test.ts -t "F1:"`, unchanged lessons | 1 | **the red line**: 12 of 12 red, 140 skipped (`red-f1-rows.txt`) |
| the eleven edits (`edit_lessons.py`: exact splices, one match each or nothing written, CRLF kept) | 0 | `lessons.diff` |
| `python tools/content/lint_absolutes.py`, and `--out lint-after.md` | 0, 0 | 592 occurrences; `lint-compare.txt`: 8 gone, 0 new, across all 109 lessons |
| `python tools/content/build.py --offline`, edited lessons | 0 | 2061 items, validation OK, 109 lessons (`run-build-after.txt`); the built `jazz.7.md` carries the new sentence; `git status --short` lists only my twelve files (`git-status-after-build.txt`) |
| `python tools/content/validate.py --allow-nc --personal` | 0 | content validation OK, 2061 catalog items (`run-validate.txt`) |
| app/ `npx vitest run tests/unit/lessonClaimsAboutMusic.test.ts tests/unit/lessonClaimsAboutApp.test.ts tests/unit/lessonShape.test.ts` | **1** | 455 of 457 passed; 2 failed, both in `lessonClaimsAboutApp` and neither caused by this change (below) (`run-vitest-three.txt`) |
| app/ `npx vitest run tests/unit/lessonClaimsAboutMusic.test.ts` | 0 | 152/152, the twelve F1 rows included (`green-music-file.txt`) |
| app/ `npx vitest run tests/unit/lessonShape.test.ts` | 0 | 21/21: reading time and the three-minute cap (`green-lessonShape.txt`) |
| app/ `npx vitest run` over the four other unit files that read lessons (`lessonVideos`, `lessonClaimsNeverTeachWrong`, `lessonClaims`, `tablet`), a consumer check the brief did not ask for | 0 | 28/28 (`run-vitest-other-lesson-readers.txt`) |

**The two failures in `lessonClaimsAboutApp`** are *blues.3: the rung carries two tool buttons, the lab and Simon, and Rhythm only is not one of them* (test line 1568) and *4.7: blind hides the score and the cursor and leaves the count-in and the beat dot* (line 1778). They are the same two Entries 84 and 85 recorded.
- Mechanism: each searches a source file for a literal `\n` sequence. This worktree checked both files out with CRLF (`core.autocrlf = true`).
- Evidence (`crlf-evidence.txt`): in `app/src/ui/screens/ScoreScreen.ts` and `app/src/style.css` the searched text is present in its CRLF form and absent in its LF form, and `git diff --quiet` exits 0 for both, so I did not touch either file.
- Neither row reads a lesson I changed (blues.3's tools and 4.7's CSS).
- H0 owns suite reliability; not mine.

## Unverified, beside what passes

- The build, the validator, `lessonClaimsAboutMusic` and `lessonShape` pass. `lessonClaimsAboutApp` fails 2 of 284 on the worktree's CRLF checkout, in rows that read nothing this change touched. Those checks show that the absolutes are gone, that the rewritten words are there and that the reading times hold. They do not show that the rewrites are good teaching. That judgement is mine, as a teacher's reading, and has not been checked by a second reader.
- **Unverified as music:** "a pop-piano gesture" (chords-pop.5), "one you will hear in modern ballad writing" (chords-pop.5), "one that heavy piano parts are built from" (rock.4) and "it turns up in film music too" (jazz.7). These are existence-only style pointers, for G. Nothing was heard.
- "Names that are awkward to read" (blues.4) and "the one to start on" (classical.4) are teacher's judgements. Neither has been read by an outside teacher.
- The full vitest suite, tsc, lint and every e2e spec were not run: the brief asks for the three files. The four other unit files that read lessons were run once as a consumer check (Checks). No screen was looked at (no browser in this task). The changed sentences are shorter or one word longer, inside paragraphs that already rendered.
