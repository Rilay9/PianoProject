### Entry 81 — T52: import truth — assigning a piece to a rung makes it one of the rung's practice options, never progress; the sheet and the owner guide say so, the two historical comments say what they mean, and one test proves the boundary from both sides (2026-09-26)

**Judgement.** Yes for E21's copy half. The assign sheet no longer tells the learner that assigning a piece "counts towards finishing the rung"; it says what C5 made true, in the reviewer's words. The implementation was already right: a test through the app's own doors (the sheet's Save, the curriculum loader, `recordRun`, `loadRungStates`, on the built curriculum) shows assignment writes no run and moves no rung, and only a run built to 2.2's songs requirement and judged by 2.2 meets that requirement. Two things the reviewer should hear first:

1. **The learner still meets the same false claim in two other places I do not own:** the folder screen's toast after *Assign* (`FolderScreen.ts:1275`, *"… is on 2.2 — it counts towards that rung now."*, which also prints the rung's id) and the in-app guide (`GuideScreen.ts:238`, *"A piece on a rung counts towards finishing it …"*). Both listed below with proposed words; the toast is asserted by `folder.spec.ts:243` and has to change with it.
2. **Not seen on a screen.** No browser in this task. The sentence was read as the learner meets it only through the real sheet mounted in jsdom (the test's first case). As a teacher's reading: the sentence is true and does not teach the old model; "qualifying" is not explained on the sheet itself, and the lesson page's *What the app counts* is where a learner finds what qualifies. Unverified as a screen.

**The sentence, before and after** (`app/src/ui/assignSheet.ts:72`):

- Before: *Assigning it to a rung makes it one of that rung’s song options — it counts towards finishing the rung, and it turns up when you ask for something else to play.*
- After: *Assigning it to a rung makes it one of that rung’s practice options. The app can suggest it there, and qualifying practice can count toward that rung’s requirements.*

These are the decided words. The only change is the apostrophe: the brief has ASCII `'` and the file's copy uses the typographic `’` throughout, so `’` is kept. `docs/OWNER-GUIDE.md` (was line 401–403) says the same under its existing bold lead: *It makes the piece one of that rung's practice options. The app can suggest it there, and qualifying practice can count toward that rung's requirements.*

## Done

1. **Copy** (decided 1). `assignSheet.ts:72` and `OWNER-GUIDE.md` as above. No test asserted the old sheet sentence (searched `app/tests` for "song options", "finishing the rung", "counts towards").
2. **The two comments** (decided 2).
   - `load.ts:151`, *"it cannot count for a rung"*. Ambiguous: "it" is the piece, so it reads as item identity, and the next sentence's *"With it the piece is an option of the rung"* could be read as assignment counting. Rewritten: *it is no rung's option, so no run of it can count toward a rung's `runs` requirement … With it the piece is an option of the rung, and only that: the assignment is not a run and counts for nothing by itself*. The downstream list now says `rungState` counts *a qualifying run of it opened from the rung and judged by it*. The clause is scoped to `runs` on purpose: a `skill` requirement reads evidence from any run, whichever rung judged it (`rungState.ts:18–22`), so "no run of it can count toward a rung's requirements" would be broader than the code.
   - `importOverlay.test.ts:5`, *"could not complete a rung"*. Pre-C5 model (a piece completing a rung) and item identity. Rewritten: *no run of it could count for a rung*, plus one sentence saying the overlay makes the piece an option and nothing more.
3. **The regression** (decided 3). New file `app/tests/unit/assignmentIsNotEvidence.test.ts`, jsdom, fake IndexedDB, built content served to the loader's own `fetch` (as `legacyStorage.test.ts` does), `estimateImport` mocked (OpenSheetMusicDisplay, as `folderAssign.test.ts` does).
   - *Words:* the sheet's first paragraph is the new sentence, and nothing on the sheet matches `counts? towards|finishing the rung`.
   - *Boundary, one test, two halves.* Preconditions read from the built curriculum: 2.2's `requirements[1]` is `{ kind: 'runs', from: 'songs', count: 1 }` (the requirement named), its standard is 0.9 at 0.85, and "require 2 songs" is off by default. **First half:** an import added through `addImport`, then assigned to 2.2 through `openAssignSheetFor` → Save. The loader now lists it among 2.2's songs, so the assignment took effect and the check is not vacuous. The sessions store holds no run (`walkSessions`), the piece's progress row is untouched (`new`, 0 attempts, no pass), and every rung's status and every requirement's reading equal their values before. **Second half:** two runs of it that miss the predicate meet nothing: one opened from 2.2 at 80 % tempo (the Settings pair's tempo, under 2.2's own 85 %), and one at 2.2's standard opened from the Library (no `lessonId`). Then one run built to the predicate: Keep tempo, measured, 90 % at 85 %, opened from 2.2. It meets `requirements[1]` (`holds: true, have: 1, items: [the import]`), the other two requirements still do not hold, and the rung is not met. No assertion says that any run of an assigned import counts.
4. **The search** (decided 4). The hits and what happened to each are listed below.
5. **Test map.** `docs/08-test-map.md`: a line for the new file in the unit list, and the C5 row's failures and tests cells extended.
6. **Ownership extension (the coordinator's message).** `folderAssign.test.ts` revised in prose only: the title and the header's paraphrase of `load.ts`. `todayOpensWithItsRung.test.ts` left alone. `folder.spec.ts` not done (see Not done).

## The test's red lines

- **Seen red first: the wording assertion** (the brief's first option). `assignmentIsNotEvidence.test.ts:152`, `expect(said).toBe(…)`. It received the committed sentence *"… song options — it counts towards finishing the rung, and it turns up when you ask for something else to play."* It is red because the copy was wrong. The boundary test passed on the committed code, as it should: the implementation was already right. Capture: `red-wording.txt`.
- **The boundary against a deliberately wrong stub.** A temporary `vi.mock` of `importStore.updateImport` made Save also record a qualifying run judged by each assigned rung: the old copy's model, where assigning counts. Red at the run-count assertion (clean-file line 179; 195 in the stubbed copy): `assigning wrote a run: expected 1 to be +0` (`red-boundary-wrong-stub.txt`). With that assertion and the progress one removed, the "no rung moved" comparison (clean line 184) is red on its own: 2.2's songs requirement `holds: true, items: ['import.my-piece']`, status `in progress` against `not started` (`red-boundary-wrong-stub-standing.txt`).
- **The second half.** The qualifying run moved to 84 % tempo, one under 2.2's standard: line 202 red, `holds: false, have: 0` (`red-second-half-84.txt`).
- The stub and the 84 % edit were made to the new file only. It was restored from a copy taken beforehand, and `cmp` confirmed it byte-identical.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `assignmentIsNotEvidence` › tells the learner it becomes one of the rung’s practice options, and nothing about finishing the rung | add | — | the sheet's sentence, and no "counts towards" or "finishing the rung" on the sheet |
| `assignmentIsNotEvidence` › gives no evidence and moves no rung; a run built to the rung’s songs requirement and judged by it meets that requirement | add | — | both halves, as above |
| `folderAssign` › reaches the assign sheet from the folder, and then is one of the rung’s options (was *… and then counts towards the rung*) | revise: title and header comment only, no assertion changed | assignment counts toward finishing the rung | assignment makes the piece one of the rung's options; only a qualifying run judged by the rung can count |
| `importOverlay` (the file's header comment) | preserve: no test changed | — | the comment, per decided 2 |
| `todayOpensWithItsRung` › listed by several and offered from none: no rung judges it, so it counts towards none | preserve, untouched | — | about a curriculum item several rungs list, not about assignment; a true C5 statement |

## The search's other hits and their disposition

Scope: `grep -rn -i` for "counts towards" and for "finishing the rung" over `app/src` and `docs/`. Tests were searched separately at the coordinator's request.

**`app/src`**
- `ui/assignSheet.ts:72`: corrected.
- `ui/screens/FolderScreen.ts:1275`: **learner-facing, the same false claim**. The toast after *Assign* on the folder screen reads `${title} is on ${rungs.join(', ')} — it counts towards that rung now.`, and it also prints rung ids (`00` §1). Not owned, so listed. P0 (never-teach-wrong copy). Proposed: *"`<title>` is one of `<rung title>`'s practice options now."*, with the rung's title and not its id. `tests/e2e/folder.spec.ts:243` asserts the old toast and changes with it.
- `ui/screens/GuideScreen.ts:238`: **learner-facing, the same false claim** (*"A piece on a rung counts towards finishing it, turns up in swaps, and can be picked for a session …"*). Not owned, so listed. P0. Proposed: *"A piece on a rung is one of that rung's practice options: the app can suggest it there, and qualifying practice can count toward that rung's requirements; a piece with no rung is still playable, the plan just does not know about it."* The `app/tests` search found no test asserting this sentence.
- `data/progressStore.ts:206`, `engine/drills/simon.ts:288`, `evidence/ladder.ts:58`, `score/WindowRenderer.ts:4284`: code comments about mastery, the ladder and system layout. Unrelated meaning; left.
- "finishing the rung": only `assignSheet.ts:72`.

**`docs/`**
- `OWNER-GUIDE.md:402`: corrected.
- `04-ui-spec.md:1364`: **the screen contract for this sheet** (*"so it counts towards finishing the rung, turns up in swaps, and can be chosen by the session builder"*). Owner-facing, not owned, so listed. The spec now disagrees with the code, so it should change with this. Proposed: *"… appends it to that lesson's `songOptions` at load, so it is one of the rung's practice options: it turns up in swaps and the session builder can choose it, and a qualifying run of it, judged by that rung, can count toward the rung's requirements; the assignment itself is not evidence."* P3.
- `03-content-pipeline.md:67` (*"so it counts towards finishing a rung without ever being committed"*): spec prose, not owned, so listed. P3.
- `08-test-map.md:87` (a Saturday counting towards next week) and `lesson-audit/batch-2.md:204, 206` (Simon's chain and mastery): unrelated meaning; left.
- Records quoting the old sentence to describe the fault, left as history: `prompts/audit-2026-09-25-outside.md:2289`, `prompts/backlog-2026-09-25.md:486`, `prompts/plan-2026-09-25.md:485`, `prompts/tasks/T52-import-truth.md:7, 14`, `prompts/views/audit/part-21.md:4`, `prompts/views/backlog/E.md:83`. The same files, less `T52`, are the "finishing the rung" hits.
- Inventory rows, dated records, left: `prompts/test-inventory-2026-09-26.csv:57` (folder.spec's toast, already classed *revise* there) and `:310`, and `.md:696` (folderAssign's old title).
- `prompts/traces/2026-09-25-sight-reading.md:623` (a pre-C5 trace line): historical; left.

## Checks (from `app/`, unpiped, on the final tree)

- `npx tsc -b`: exit 0.
- `npm run lint`: exit 0.
- `npx vitest run`: exit 0. 253 files; the new file's 2 tests included.
- No browser, no build. `folder.spec.ts` was not run and not changed.

## Not done

- **`app/tests/e2e/folder.spec.ts:243`** (the coordinator's extension). The premise is not true at the line: the assertion is of the folder screen's toast, `FolderScreen.ts:1275` (*"… — it counts towards that rung now."*), not the assign sheet's sentence. Revising the assertion without the toast would turn the spec red. The toast is not in my files. If `FolderScreen.ts:1275` is given to an owner, the toast and this assertion change together.

## Follow-ups

- **P0.** `FolderScreen.ts:1275` and `GuideScreen.ts:238`: the same false claim in learner-facing copy (above). The toast also prints rung ids.
- **P3.** `04-ui-spec.md:1364` and `03-content-pipeline.md:67`: spec prose stating the old claim (above).
- **P2, inferred from the code, not tested.** On a rung with no `runs` requirement over its songs (in stages 0–3, the only stages listed: 1.5, 2.5, 3.6, the practice track, `theory.3`, `improv.3`, `rock.overview`), an assigned import's runs can meet no `runs` requirement there. The sheet's "can count" is true in general, but the sheet offers every rung without saying so. This belongs to Part 21 §D ("decide where and why it belongs"), not to a sentence.
- **P3, inferred from the code, not tested.** *"The session builder cannot pick it"*, said of a piece on no rung, is kept in `load.ts` and in `folderAssign.test.ts`'s paraphrase, and `OWNER-GUIDE.md` says *"the plan does not know about it"*. Since C6 these may be stale. The review slot's repertoire retention reads `learnedPieces` over every progress row (`session.ts:1111`, `TodayScreen.ts:632`), and `usable(…, 'only')` accepts any playable song, imports included (`playable`: `item.imported`). So a Library-passed import on no rung could come back in review after the window. Left: not the decided phrase.
- **P3.** `importOverlay.test.ts`'s header still says *"these are the four things"*, and the file has more cases than four. Left.
- **P3.** `folderAssign.test.ts:140` names `lessonComplete` (deleted in C5) among the readers of `songOptions`. Left; the extension covered the sentence, not the file.

## Questions

None.

## Files

- `app/src/ui/assignSheet.ts` (the text only)
- `app/src/curriculum/load.ts` (the comment only)
- `app/tests/unit/importOverlay.test.ts` (the header comment only)
- `app/tests/unit/folderAssign.test.ts` (title and header comment; the coordinator's extension)
- `app/tests/unit/assignmentIsNotEvidence.test.ts` (new)
- `docs/OWNER-GUIDE.md`
- `docs/08-test-map.md`
- Red-line captures beside this entry: `red-wording.txt`, `red-boundary-wrong-stub.txt`, `red-boundary-wrong-stub-standing.txt`, `red-second-half-84.txt`. The full-suite log is `vitest-full.txt`.

#### Fix-forward (the toast and the Guide)

The coordinator widened the files to the two learner-facing hits, the e2e assertion on the toast, and the two spec sentences, all in the same tree before the commit.

**Judgement.** Both learner-facing sentences are now true, and the folder's line no longer prints a rung id. As before, I read them only as mounted screens in jsdom, not in a browser. As a teacher's reading, neither sentence teaches the old model.

**Sentences, before and after**

- **Folder screen, the line after Save** (`app/src/ui/screens/FolderScreen.ts:1275`, now in `assignOne`)
  - Before: *`<title>` is on `<rung ids>` — it counts towards that rung now.* On 2.2 the learner read *My piece is on 2.2 — it counts towards that rung now.*
  - After: *`<title>` is now one of the practice options for `<rung title>`.* On 2.2: *My piece is now one of the practice options for Eighth notes and counting “1 and 2 and”.*
  - **Deviation from the wording I was given**, which was *"<title> is one of <rung title>'s practice options now."* (my own earlier suggestion). Real rung titles make the possessive unreadable: this one would read *… counting “1 and 2 and”’s practice options*, and *Classical: Grade 1 pieces and articulation’s* is another. The "for" form says the same thing and reads with any title. Veto it if you want the exact words; the change is one template string plus the e2e line.
  - The curriculum is loaded once before the sheet opens, which the sheet does anyway. The screen's existing `curriculum` cache is reused, so the save callback stays synchronous. Several rungs are joined with "and". A rung whose title is not found reads *… for its rung.* and never shows an id.
  - This touched `assignOne` beyond the one line: the load before the sheet, plus a `findLesson` import.
- **The Guide, the section on adding scores** (`app/src/ui/screens/GuideScreen.ts:238`)
  - Before: *A piece on a rung counts towards finishing it, turns up in swaps, and can be picked for a session; a piece with no rung is still playable, the plan just does not know about it.*
  - After: *A piece on a rung is one of that rung’s practice options: the app can suggest it there, and qualifying practice can count toward that rung’s requirements; a piece with no rung is still playable, the plan just does not know about it.*
- **`docs/04-ui-spec.md` (was 1363–1365).** It now says the piece turns up in swaps and can be chosen by the session builder, and that a qualifying run of it, judged by that rung, can count toward the rung's requirements. The assignment itself is no evidence and meets no rung. The spec quotes the sheet's sentence and the folder's line, with a dated note: *2026-09-26, T52: both said the piece counted towards finishing the rung, which C5 made false; the folder's line also printed the rung's id.*
- **`docs/03-content-pipeline.md:67`.** *so it counts towards finishing a rung without ever being committed* became *so it is one of the rung's practice options, and a qualifying run of it, judged by that rung, can count toward the rung's requirements, without the file ever being committed*, with a dated note.

**The search of the tests** (unit and e2e) for the old Guide sentence ("counts towards finishing it", "turns up in swaps", "can be picked for a session") and the old toast ("counts towards that rung now", "towards that rung"): one hit, `tests/e2e/folder.spec.ts:243`. `guide.spec.ts` and `guide-shots.spec.ts` assert no Guide sentence and compare no screenshots.

**Red lines.** Two cases were added to `assignmentIsNotEvidence.test.ts`, which mount the real screens. I swapped the committed `FolderScreen.ts` and `GuideScreen.ts` in, ran the file, then put my versions back (`cmp` confirmed them identical). Capture: `red-fixforward-toast-guide.txt`.
- The folder case, red at line 269: it received *My piece is on 2.2 — it counts towards that rung now.*, with the id and the claim both on screen.
- The Guide case, red at line 278: the section held the old sentence.
- Both pass on the fixed screens.

**Tests table additions**

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `assignmentIsNotEvidence` › the score folder names the rung by its title after Save, and says the piece is one of its options | add | — | the folder's line after Save: the rung's title, not its id; no "counts towards" |
| `assignmentIsNotEvidence` › the Guide’s section on adding scores says a piece on a rung is one of its practice options | add | — | the Guide's sentence; no "counts towards" or "finishing" in that section |
| `folder.spec.ts` › assigning it on the folder screen makes the row say so, without a reload (line 243) | revise; not run (no browser in this task), revised unseen, for the orchestrator's chain to run | assignment counts toward finishing the rung, and the line may name the rung by its id | the line reads *is now one of the practice options for <title>*, the title taken from the chosen option's label minus its `Stage N · ` prefix |

**Checks** (from `app/`, unpiped, on the fix-forward tree)
- `npx tsc -b`: exit 0.
- `npm run lint`: exit 0.
- `npx vitest run`: exit 0, 253 files; the new file now has 4 tests.
- The test map's line was extended after the run. No test reads the test map.

**Record.** `docs/08-test-map.md`: the unit line and the C5 row cell for `assignmentIsNotEvidence.test.ts` now name the folder line and the Guide.

**Not done.** None. The first delivery's Not done (`folder.spec.ts:243`) is now done, but not run.

**Follow-ups (new).**
- **P3.** `FolderScreen.ts:618–622` has a comment quoting `load.ts`'s old words (*"it cannot complete a rung, it never appears in a swap, and the session builder cannot pick it"*). It was outside the one toast line I was given; left.

**Files (fix-forward):**
- `app/src/ui/screens/FolderScreen.ts` (the line after Save and what it needs: the curriculum loaded before the sheet, the `findLesson` import)
- `app/src/ui/screens/GuideScreen.ts` (line 238)
- `app/tests/e2e/folder.spec.ts` (the assertion at 243, and reading the option's label)
- `app/tests/unit/assignmentIsNotEvidence.test.ts` (two cases)
- `docs/04-ui-spec.md`
- `docs/03-content-pipeline.md`
- `docs/08-test-map.md`

#### Third round (a piece on no rung and the review)

**Judgement.** The coordinator's reading holds, with no guard in the way. Since C6, a passed import on no rung comes back in Today's review as piece retention. So "the plan does not know about it" and "the session builder cannot pick it" were wrong, both on screen and in the comments. The sentences now say what the code does: a piece on no rung is never offered as a lesson's work, but once passed, the review can bring it back when it has gone unplayed for a while. As before, I read this through jsdom and a built session, not in a browser. As a teacher's reading: bringing back a piece the learner learned from the Library, to keep it playable, is sound practice. The sentence is now true about it.

**Mechanism, at the lines**
- `review()` (`session.ts:1111`) walks `ctx.learned`, built from `progressStore.learnedPieces`: every passed or mastered row, less generated reading rows and self-passes.
- It admits a piece through `usable(ctx, item, 'only')` (`session.ts:653`). That checks the item is playable, unused, not a reading row, and a song. It never asks about rungs.
- The warm-up, the new piece, the repertoire fallback, the fallback ladder and the exposure rule choose only among options listed by reached rungs (`fallbackStep`'s `taught` and `own`, and `exposure`'s walk of `ctx.reached`).
- The repertoire claim reads `ctx.input.items`, but needs measured `demands`, which no import carries.
- So in code, the review's repertoire retention is the one path by which a piece on no rung reaches Today's card. That is inferred from these lines; the test observes it only for the warm-up and the new piece, and for which slots carry the piece.

**The test.** New case: `assignmentIsNotEvidence.test.ts` › *a piece on no rung and Today* › *passed and then unplayed past the window, it comes back in the review to keep it playable, and is never a lesson’s work*.
- Setup: an import added through `addImport`, then a run recorded through `recordRun` from the Library (no `lessonId`), passed, at `REPERTOIRE_WINDOW_DAYS + 1` days before the test's day. It checks that no rung of the loaded curriculum lists the piece.
- Today's inputs are built as `TodayScreen` builds them: `loadCurriculum`, `allItems`, `indexCatalog`, `allProgress` → `learnedPieces` with Today's `isSightReading` predicate, `loadRungStates`, `rungRows`, `activeTracksFor(getPlan())`, 30 minutes.
- Over Shuffle seeds 0–7:
  - the review slot is the piece, with claim `piece-retention` and the reason *Keeping this piece playable — last played …*;
  - the `technique` (warm-up) and `new` slots never hold it;
  - the review is the only slot that holds it.
- **Scope:** one otherwise fresh learner on the built curriculum and catalog, a 30-minute card, eight seeds.
- **Which kind of check (asked):** asserted against the current code to document the behaviour, and also seen red against a deliberately wrong stub that filters imports out of the learned pieces. Red at line 341: `seed 0: the review: expected undefined to be 'import.my-piece'`; the review had no item at all once the import was filtered out. Capture: `red-third-round-filter-stub.txt`. The file was restored from a copy and `cmp` confirmed it identical.

**Sentences, before and after**
- **Guide** (`GuideScreen.ts:238`, the clause after the semicolon)
  - Before: *a piece with no rung is still playable, the plan just does not know about it.*
  - After: *a piece with no rung is still playable and never offered as a lesson’s work, but once you have passed it, Today’s review can bring it back when it has gone unplayed for a while, to keep it playable.*
  - The Guide case now asserts this clause and the absence of *does not know about it*. Red first at line 289 against the old Guide (`red-third-round-guide.txt`), green after.
- **`docs/OWNER-GUIDE.md`** (was 403–405)
  - Before: *A piece with no rung is just a file in your library — still playable, but the plan does not know about it.*
  - After: *A piece with no rung is a file in your library — still playable, and never offered as a lesson's work, but once you have passed it, Today's review can bring it back when it has gone unplayed for a while, to keep it playable.*
- **`load.ts:153`**, comment: *the session builder cannot pick it* became *the session builder offers it as no lesson's work. (Once it has been passed, the review's repertoire retention can still bring it back: that reads every learned piece, `progressStore.learnedPieces`, and asks nothing about rungs.)*
- **`FolderScreen.ts:618–623`**, comment: *it cannot complete a rung, it never appears in a swap, and the session builder cannot pick it* became *no run of it can count toward a rung's `runs` requirement, it never appears in a swap, and the session builder offers it as no lesson's work; only the review can bring it back, once it has been passed*.
- **`folderAssign.test.ts`**
  - The header paraphrase now says the same as `load.ts`.
  - **Beyond the list, the same claim in the same file:** the comment at 139–143 said `lessonComplete`, `alternativesFor` and `buildSession` "cannot see it". It now names the readers of a rung's options (a rung's `runs` requirement, `alternativesFor`, the session builder's lesson work) and says the review's repertoire retention can see it once passed. It also drops `lessonComplete`, deleted in C5; that was a P3 follow-up in the first round, now closed.
- **Beyond the list, flagged: `folder.spec.ts:186–189`**, a header comment I found with the same search. It quoted `load.ts`'s old words (*"cannot complete a rung … the session builder cannot pick it"*) and now paraphrases the corrected comment. The file was already mine for line 243; comment only, no assertion changed, not run.
- **Left:** `importOverlay.test.ts:6`, *"Before this, … the session builder could not pick it."* It is past tense about the time before the overlay and was true then.

**Search.** `plan does not know`, `plan just does not know`, `session builder cannot`, `cannot pick it`, `could not pick it`, `builder cannot see`, `therefore cannot see it`, over `app/src`, `app/tests` and `docs` (`.ts` and `.md`, less `pending-review.md` and `docs/prompts/`). After the edits it returns only this test's own quotations and `importOverlay.test.ts:6`.

**Tests table additions**

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `assignmentIsNotEvidence` › a piece on no rung and Today › passed and then unplayed past the window, it comes back in the review to keep it playable, and is never a lesson’s work | add; documents current behaviour, and red against an import-filtering stub | — | the review's repertoire retention reaches a passed piece on no rung; the warm-up and the new piece do not |
| `assignmentIsNotEvidence` › the Guide’s section on adding scores … | revise, my own case from the fix-forward: two assertions added | a piece on no rung is one the plan does not know about | the corrected no-rung clause, and no *does not know about it* |
| `folderAssign` (comments at 5–13 and 139–143) | preserve: no assertion changed | the session builder cannot see a piece on no rung | comments only |
| `folder.spec.ts` (header comment 186–189) | preserve: no assertion changed, not run | the same | comment only |

**Checks** (from `app/`, unpiped, third-round tree)
- `npx tsc -b`: exit 0.
- `npm run lint`: exit 0.
- `npx vitest run`: exit 0, 253 files; the new file has 5 tests.
- The test map's line was extended after the run; no test reads it.

**Record.** `docs/08-test-map.md`: the unit line for `assignmentIsNotEvidence.test.ts` names the third round.

**Not done.** None. No guard was found that keeps the import out; the review reached it on every seed tried.

**Follow-ups (new).**
- **P2, a question for the product, not a fault.** Should a piece the learner put on no rung on purpose ("No rung — just put it in my library") come back in Today's review at all? The sentences now describe that it does; whether it should is a product choice. It belongs to repertoire retention (C6's owner) or Part 21 §D, and I did not act on it.
- **P3.** The repertoire slot's "a piece you know" (`session.ts:1258`, `known`) reads `ctx.learned` too, for a mastered piece the slot has chosen. The slot chooses only rung-listed items, so a piece on no rung cannot reach it. Inferred, not tested.

**Files (third round)**
- `app/tests/unit/assignmentIsNotEvidence.test.ts` (the new case, the imports it needs, and two assertions in the Guide case)
- `app/src/ui/screens/GuideScreen.ts` (line 238)
- `docs/OWNER-GUIDE.md`
- `app/src/curriculum/load.ts` (comment)
- `app/src/ui/screens/FolderScreen.ts` (comment at 618–623)
- `app/tests/unit/folderAssign.test.ts` (comments)
- `app/tests/e2e/folder.spec.ts` (header comment; beyond the list, flagged)
- `docs/08-test-map.md`
