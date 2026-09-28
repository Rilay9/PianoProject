### Entry 103 — D3b: the session card's rows drawn straight from a rung's list pass the gate's own teaching-use admission, exported once from `eligibility.ts` and read in `session.usable`, the one filter every slot chooses through; a music-promising generated item with no affirmative decision reaches no automatic row, the row filled by the slot's next admitted candidate or the ladder's next step, a refused ask left unmet and never said to be met; the Library, exploration and the swap sheet untouched (2026-09-28)

**Judgement.** The card no longer offers an unheard groove because a rung lists it. I checked it on the phone at 342 × 740. I read it from the DOM and compared it row for row with the unit probe. I checked it across the whole curriculum with the unit probe. I also traced the code at every place a slot takes an item. Nothing was heard, and no teaching-use decision was made.

- **At `jam` and at `holiday.5`, before.** A fresh learner with every track on (D3a's probe setting), at 30 and at 60 minutes, got this warm-up: *Ostinato over a pedal bass in A minor — broken minor triad*, "Holiday asks for it — not counted yet", L3.4.
- **After.** The warm-up is *E major arpeggio — 2 oct, both*, with the same line, "Holiday asks for it — not counted yet", now at L5.1. The line is still true: `holiday.5` asks for a run of any one of its exercises, and the arpeggio is one. Every other row is unchanged at both lengths. The DOM equals the unit probe's card for both rungs, both lengths, before and after (`runs/compare-dom.txt`; `pictures/before/card-jam-30.png` and the rest, against `pictures/after/…`).
- **As music: unverified.** The replacement is a two-octave arpeggio, hands together, a level and a half above the ostinato. It is inside a stage-5 rung's band, and it is the rung's own listed exercise.
- **Across the curriculum.** D3a's probe looked at 30 rungs at two lengths. Widened to every rung (109), every length (15, 30, 60, 120), a fresh learner, every track on, the committed code put an unapproved music-promising generated item on **146 rows on 59 rungs' cards**. That is 44 warm-ups the rung "asks for", 50 reviews "Nothing due for review — more from …" and 52 jams. D3a's own scope inside it is 23 rows, reproduced exactly. After: **0**.
  - **Every one of the 146 was filled, none dropped.** 44 took the ask's next admitted exercise under the same line. 50 took the rung step's next admitted option: the stride became *Turnaround in F — iii-VI-ii-V*, the pinetop boogie *Turnaround in C — I-vi-ii-V*, the E♭ walking bass *Ninth chords*, the secondary rag *Play back a tune — eight bars* or *Search-Light Rag*. 52 took the next admitted option of a reached jam rung: comping became *Play the form with the chart* or *add9 voicings in E♭*, the walking bass *Twelve-bar blues shuffle in E* or *I-V-vi-IV in D*.
  - **Knock-on changes.** 116 cards change, every one a card that held such a row. Sixteen knock-on rows moved on them, each because the replacement took an item another slot would have had (`runs/compare-cards.txt`, `runs/changes-grouped.md`).
- **What a teacher would notice among the replacements.** The jam slot and the rung step take a rung's options in list order. With the grooves out, a few non-chord items now sit under "Chords, form and feel": `chords-pop.7`'s second jam at two hours is *Transposition — a harder page, further away*, and `theory.8`'s jam is *Play back a tune — eight bars*. `ragtime.9`'s review is the same ear drill, under "more from Ragtime". These are the rungs' own authored options. That is a property of the jam slot and the rung step that the grooves used to hide (Follow-up 3), not something this seam invents.
- **Two asks cannot be filled until a person decides.** Every exercise `latin.3` lists is a clave or the tresillo, and every one `latin.6` lists is a tumbao, a montuno or a Latin groove. Their exercise asks stay unmet.
  - **`latin.3`, for a learner with only the core path and Latin on.** Its new slot moves from *Clave — son 2-3* ("Latin asks for it") to *Cielito Lindo*, the rung's song ask, with the same line.
  - **`latin.6`.** Its warm-up moves from *Tumbao — latin bass in G minor* ("Latin asks for it") to *Rhythm: syncopated — 4 bars*, "From Clave, tumbao and montuno, which this lesson builds on" (the ladder's prerequisite step). Its review moves from the montuno to *The Crave* or *Por Una Cabeza*.
  - **No row says either ask is met or waits for review** (`runs/compare-focus.txt`). The Latin track cannot be met past `latin.3` through the card until a groove there has a `yes` (Question 2).

Five things the reviewer should hear first:

- **`usable()` is the single filter, and the jam slot already goes through it.** The brief's premise was that the jam slot picks from a lesson's options directly. It does not: `jam` filters by `usable(ctx, item, 'any')` (`session.ts`, the jam function). So one line in `usable` covers the `runs`, `done` and `measure` offers, the ladder's `choose`, the exposure rule and the jam slot. `usable` serves no display-only path; every caller is card candidate selection (table below). The binding answer's deviation therefore did not arise, and no second call site was needed.
- **Pool and offer: what I found and what I did.** `if (pool.length === 0) continue` tests the pool, and I kept it that way. A want's `pool` is never chosen from. It is read only for whether the rung asks something (the `wants.length` tests in `warmup` and `fresh`) and for `fresh`'s `served()` ordering. Every row comes from `pick(want.offer, …)`, and `offer` passes `usable`.
  - A want whose offer is empty after admission produces no row. Its existence routes the slot to the fallback ladder and holds back the next lesson's asks. That is how the code already treats an unplayable candidate, and it is the brief's "the requirement stays unmet … the row falls to the next step of the fallback order".
  - Filtering the pool instead would drop the want. The warm-up would then go to the next lesson's ask under "The next lesson asks for it", a claim whose definition is "this one's asks of this kind are met". That is false. The `pool` mutant shows exactly this (`red/mutant-pool.txt`: the warm-up becomes `ex.next`, `asked`, rung `R2`), and the regressions' `claimsNext` check holds it out.
- **One reading, two askers.** `admittedForTeaching(item)` is `unapprovedMusic(item) === undefined`. `unapprovedMusic` stays the only reading of the promise fact and the teaching bit, and `eligibleFor` still uses it for the verdict with the stored bit. A new case shows the gate's `teaching-use-not-approved` and the admission refuse exactly the same items on the built catalogue, and both agree with the contract table, the oracle independent of the build. Another shows `session.ts` reads neither `facts.promise` nor `review.teaching`.
- **The per-path mutants split the 146 rows by path, with none left over.** Taking the admission off the want's offer brings back 44 rows. Off the ladder, 50. Off the jam slot, 52. Off exposure, none on the built catalogue for these learners, though every constructed card that falls to exposure goes red. Each path's own constructed case goes red under its own mutant, and a `false` read as approval turns every path's `false` iteration red.
- **Nothing learner-facing was added.** There is no "waiting for review" row and no new string (the binding answer). The swap sheet, `selectors.ts`, the gate's logic, the rung lists and the Library are untouched.

## The mechanism, and the test that told it apart

**Cause.** D3a put the teaching-use check inside `eligibleFor`, and every path that asks the gate refuses. The card's own rows never ask the gate for an item a rung lists: a rung's list is taken as the rung's authored ask. Those rows are the `runs`, `done` and `measure` offers, the ladder's rung and prerequisite steps, the jam slot and the exposure rule. They choose through `usable`, which checked playability, the card and reading rows, and nothing else.

**Alternative.** Some other path puts the grooves on the card, such as the repertoire claim or skill retention.

**Test.** The widened probe classifies each of the 146 rows by slot and claim: technique/asked 44, review/rung 50, jam/jam 52. The per-path mutants bring back exactly those counts. Every row is a `usable` path, and admission in `usable` turns every case green.

## Every path by which the card takes an item, where the admission applies, and the want it serves

| Path (`session.ts`) | Where its candidates come from | Admission | The claim it serves |
| --- | --- | --- | --- |
| `wantsOf` `runs` → `offer` | the rung's exercises, songs or both (its named `items`), not yet counted | `offer: pool.filter(usable)` | warm-up and new: *… asks for it*; the next lesson's (`next`) |
| `wantsOf` `done` → `offer` | the item the requirement names | the same | *… asks for it* |
| `wantsOf` `measure` → `offer` | the rung's exercises of the measured drill kind | the same | *… asks for it* |
| `wantsOf` `skill` → `offer` | the rung's exercises the gate passes for the requirement | the gate (D3a) and `usable` | *Trains …, for this lesson* |
| `fallbackStep` `rung` | the strand rung's options | `choose()` → `usable` | *From this lesson* · *Nothing due for review — more from …* · *More music from …* |
| `fallbackStep` `skill`, `demand` | taught items the gate passes | the gate (D3a) and `choose()` → `usable` | *Trains … which this lesson asks for* · *Has …* |
| `fallbackStep` `prerequisite` | a prerequisite rung's options | `choose()` → `usable` | *From …, which this lesson builds on* |
| `exposure` (kinds, songs) | reached rungs' options, by family | `usable` at the family filter and at the item pick | *…, from your lessons* · *For variety: …* |
| `jam` | reached jam-track rungs' options | `.filter(usable)`, already there (the brief's premise corrected) | *Chords, form and feel: from …* |
| `review`, repertoire retention | learned pieces | `usable(…, 'only')` | *Keeping this piece playable* (songs only; all 208 music-promising items are exercises, so none reaches it) |
| `repertoire` claim | the whole catalogue, songs | `usable(…, 'only')` and the gate (D3a) | *A piece with …* (songs only, already gated) |
| `review`, skill retention | reading rows the skill was shown on | none added | *…: not shown in …* — reading rows only (`isReadingRow`) |
| `readingSlot` / the daily read (`readingOffer` → `anchorFor`) | the rung's reading row | none added | the reader's — reading rows only |
| `swapOptions` tiers and last resort; `playInstead` | the gate (D3a) | unchanged | the swap sheet; "play this instead" |
| `strandsOf` last played, exposure's `last`/`latest`, `countedOnStrands`, `fresh`'s `served` | read for ordering only | n/a | nothing offered |

- **Reading rows.** They are runtime drills that carry no promise fact (D3a's `TestThePromiseFact`, fourth case). The new built-catalogue case also shows every item without a contract row admitted. So the three reading-row paths admit them by construction, and I added no call there (Not done, 1).
- **Outside the session card.** The rung page's *Start*, *Climb the ladder*, *Quick check* and duet picks (`LessonScreen`) read a rung's list without the admission. That file is not D3b's; see Follow-up 1.

## The rungs whose rows change, on the merged build (`runs/changes-grouped.md`; every card in `runs/compare-cards.txt`)

A fresh learner is placed at each rung, with every track on, at each length. "(knock-on)": a row that moved because the replacement took its item.

| Row | Before | After | Where (rung: minutes) |
| --- | --- | --- | --- |
| technique | Ostinato over a pedal bass in A minor — broken minor triad — *Holiday asks for it — not counted yet* | E major arpeggio — 2 oct, both — *Holiday asks for it — not counted yet* | `theory.4`, `improv.4`, `jam`, `technique.4`, `rock.4`, `hymns.4`, `classical.5`, `chords-pop.5`, `blues.5`, `jazz.5`, `holiday.5`: 15, 30, 60, 120 |
| jam | Comping — charleston on triads in E | Play the form with the chart (same line: *from Comping behind somebody else*) | `technique.4`, `rock.4`, `hymns.4`, `classical.5`, `chords-pop.5`: 60, 120 |
| jam 2 | Comping — charleston on triads in A | Twelve-bar blues backing track (*from Turnarounds, blue notes and walking bass*) | the same five: 120 |
| review (knock-on) | Twelve-bar blues backing track | Twelve-bar left-hand patterns (*more from Blues & boogie*) | the same five: 120 |
| review | Boogie — pinetop in C, both hands | Turnaround in C — I-vi-ii-V (*Nothing due for review — more from Blues & boogie*) | `jazz.5`, `holiday.5`, `ragtime.5`, `theory.5`, `improv.5`, `latin`, `technique.5`, `rock.5`, `jam.5`, `hymns.5`, `classical.6`, `ragtime.6`, `technique.6`, `jazz.6`, `holiday.6`, `blues.6`: 120 |
| jam | Walking bass over a 12-bar blues in E | Twelve-bar blues shuffle in E (*from Walking bass, when there is no bass player*) | `hymns.5`, `classical.6`, `ragtime.6`, `technique.6`, `jazz.6`: 60, 120 |
| jam 2 | Walking bass over a 12-bar blues in A | I-V-vi-IV in D — with inversions | the same five: 120 |
| jam, jam 2 (knock-on) | Stride in F; Turnaround in F | Turnaround in F; ii-V-I in F — shell | `chords-pop.6`: 60, 120; 120 |
| review | Boogie — pinetop in E♭ | Boogie (easy, for beginners) | `chords-pop.6`: 120 |
| review | Stride in F, both hands | Turnaround in F — iii-VI-ii-V (*more from Blues & boogie*) | `theory.6`, `improv.6`, `rock.6`, `jam.6`, `hymns.6`: 120; `latin.6`, `classical.7`, `ragtime.7`, `technique.7`, `jazz.7`, `holiday.7`: 30, 60; `blues.7`: 15 |
| review | Walking bass over a 12-bar blues in E♭ | Ninth chords (*more from Blues & boogie*) | `chords-pop.7`, `theory.7`, `improv.7`, `rock.7`, `latin.7`, `jam.7`, `classical.8`, `ragtime.8`, `technique.8`, `jazz.8`, `blues.8`: 15 |
| jam; jam 2 | Walking bass in E♭; Boogie — walking eighths in B♭ | Ninth chords; Transposition — a harder page, further away | `chords-pop.7`: 60, 120; 120 |
| jam 2; repertoire (knock-on) | Walking bass in F; Stumbling | Stumbling; Black Bottom Stomp | `chords-pop.8`: 120 |
| jam; jam 2 and review (knock-on) | Comping — anticipated in C; Play back a tune | Play back a tune; add9 voicings in E♭, Harmonic dictation — music that changes key | `theory.8`, `improv.8`, `classical.9`: 60, 120 |
| jam; jam 2 (knock-on) | Comping — anticipated in C; add9 voicings in E♭ | add9 voicings in E♭; ii-V-I in F — shell | `jazz.9`, `blues.9`, `chords-pop.9`, `theory.9`: 60, 120; `improv.9` jam 2: 120 |
| review; jam 2 | Secondary rag in C — three sixteenths against four; Comping — anticipated in C | Play back a tune — eight bars; the same | `ragtime.9`: 15, 30, 60; 120 (Search-Light Rag at 120) |

**The requirements the card cannot fill until a decision exists** (`runs/unfillable.txt`, read from the built catalogue as `wantsOf` reads a pool). Two:

- `latin.3`'s `runs` of one exercise. Its exercises are the son 2-3, rumba 3-2, bossa and son 3-2 pulse claves, and the tresillo.
- `latin.6`'s `runs` of one exercise. Its exercises are the G tumbao, the D three-note montuno and the D Latin groove.

Rows before and after for a learner with only the core path and Latin on, placed there (`runs/compare-focus.txt`):

- **`latin.3`.** New: *Clave — son 2-3* → *Cielito Lindo*, with the same line, "Latin asks for it — not counted yet" (the song ask).
- **`latin.6`.** Warm-up: *Tumbao — latin bass in G minor* ("Latin asks for it") → *Rhythm: syncopated — 4 bars* ("From Clave, tumbao and montuno, which this lesson builds on"). Review: *Montuno — 3 notes on son 3 2 in D minor* → *The Crave* at 30 and 60 minutes, *Por Una Cabeza* at 15.

The rung options now kept off the card until a decision: 71 options on 30 rungs, the same set D3a counted (listed per rung in `runs/unfillable.txt`).

## The red lines

Seen before the change each proves, on the committed code or on a mutant. The source was never left changed: every mutant and every HEAD-session run swapped the bytes back and checked them.

- **`red/red-consumers-committed-code.txt`: the new cases on the committed code.** 11 of the 12 fail, exit 1.
  - `runs`, `done`, `measure` and the ladder's rung step: `teaching null: expected [ 'ex.groove', 'ex.pre' ] to not include 'ex.groove'`.
  - The prerequisite step: `expected [ 'ex.groove', 'ex.expo' ] …`.
  - The jam slot: `expected [ 'ex.c', 'song.c', 'ex.groove', …(1) ] …`.
  - The exposure rule: `expected [ 'ex.groove', 'song.r' ] …`.
  - The predicate, and the one-reading case: `TypeError: admittedForTeaching is not a function`.
  - `session.ts`'s source: `expected '/**\r\n * Building today's practice …' to match /admittedForTeaching\(/`.
  - The sweep: `146 rows: expected [ …(12) ] to deeply equal []`.
  - The twelfth is green on both, by design. It is the positive case: approved, the rungs' own grooves come back.
- **`red/mutant-null-only.txt`: a `false` read as approval.** 8 red, each path at `teaching false: …` and the predicate at `expected true to be false`.
- **`red/mutant-wants-offer.txt`: the admission off the want's offer.** 4 red: `runs`, `done`, `measure`, and the sweep at "44 rows".
- **`red/mutant-ladder.txt`: off the fallback's `choose`.** 6 red: the rung and prerequisite steps, the three asks' only-candidate cases (which fall to the rung step), and the sweep at "50 rows".
- **`red/mutant-jam.txt`: off the jam slot.** 2 red: the jam case and the sweep at "52 rows".
- **`red/mutant-exposure.txt`: off the exposure rule.** 7 red: every constructed path case, because each card's review falls to exposure. The sweep stays green: on the built catalogue no fresh learner's card reaches an exposure family holding one.
- **`red/mutant-pool.txt`: the admission on the want's pool instead of its offer.** 3 red: `runs`, `done`, `measure`, each `expected { kind: 'technique', … } to match { item: { id: 'ex.pre' }, … }` with `ex.next`, `asked`, rung `R2` received. That is "The next lesson asks for it" while R's ask waits.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `gateAtTheConsumers.test.ts` › *the session card's rows drawn straight from a rung's list pass the same admission (D3b)* (9) | add | — | Constructed rungs, each path: `runs`, `done`, `measure`, the ladder's rung step, its prerequisite step, the jam slot and the exposure rule. For `teaching: null` and `false`, not offered. For `true`, offered, and the card is exactly the card for the same item with no promise. A generated drill (promise `drill`, bit `null`) and a notated song beside it are offered as before. The only-candidate row is filled by the next valid step or dropped (jam, exposure), and no row claims the refused ask or offers the next lesson as if it were met. Plus the predicate on a groove at each bit, a drill, a notated song, a runtime reading row and a bare item; and `session.ts` reading neither the fact nor the bit while calling the admission. |
| `gateAtTheConsumers.test.ts` › *the card on the built catalogue offers no music-promising generated item without an affirmative teaching-use decision (D3b)* (3) | add | — | The gate's `teaching-use-not-approved` and the admission refuse the same items, and both agree with the contract table. For every rung, a fresh learner placed there, every track on, every length: no row is one. Approved: `holiday.5`'s warm-up is the ostinato "asked", `jazz.9`'s jam the comping, `ragtime.9`'s review the rag. |
| `gateAtTheConsumers.test.ts` module docstring and imports | revise (text; imports added) | — | names D3a and D3b; imports `admittedForTeaching`, `eligibleFor`, `BuildInput`, `RungReading` |
| `gateAtTheConsumers.test.ts` › every E0 and D3a case (13), the swap sheet's among them | preserve | — | green, unchanged |
| `session.test.ts`, `fallbackOrder.test.ts`, `slotsFromEvidence.test.ts`, `eligibility.test.ts`, and every session consumer (`alternativesShareASkill`, `curriculumSelectors`, `levelSource`, `importOverlay`, `firstThirtyDays`, `firstThirtyDaysOnTheLadder`, `recommendRespondsToEvidence`, `skillActivationBoundary`, `help`, `taughtByAncestry`, `assignmentIsNotEvidence`, `parallelStrands`, `recordTruth`, `repertoireRetention`, `sightReadingIsNotAPiece`, `sightReadingSlot`, `todayCardRanking`) | preserve | — | green, unchanged: no constructed item there carries a music promise, and no built-catalogue assertion there names a groove on the card |
| every other test | preserve | — | green, except the two recorded CRLF worktree reds (below) |

## Checks (unpiped; exit codes read)

Every run's output is under `runs/` (the red captures under `red/`), with the exit code as its last line.

**Setup:**
- `npm ci`: 0.
- The parity reference: 0. Its three real-MIDI inputs are absent and skipped, as the script allows.
- Copies from the main checkout (`runs/copy.txt`): `kern` and `musetrainer` without their version-control folders, `build/cache/convert`, `build/demands-cache.json`, `build/notation-cache.json`. Robocopy's 1 means "files copied".

**Content:**
- `build.py --offline` on the committed tree: 0, with 2085 items, validation OK, and the same reports line as D3a (`592 checkable claims on 1021 options: 356 not established, 9 kept by no option; 784 works, 813 arrangements`).
- `SOURCES.md` restored with `git checkout --` on that one file. `rung-claims.md` and `inventory.md` got HEAD's line endings back (their text was HEAD's; `runs/restore-reports.txt`).
- No content file changed, so there was no second build.

**App:**
- `npx tsc -b`: 0, 0.
- `npm run lint`: 0, 0.
- The consumer file, red run: 1 (above). After: 0, 25 passed.
- The named and session-consumer files: 0, 22 files, 276 passed. After the last comment edit, the four named files: 0, 77 passed.
- Vitest in full: 1, with 6524 passed, 2 failed, 5 skipped. The two are `lessonClaimsAboutApp` › blues.3 and › 4.7, which match a literal LF (`menuRow(\n    'Rhythm only'`) in `ScoreScreen.ts` and `style.css`. Both files are CRLF in this worktree and untouched: D0's, E0's and D3a's recorded worktree reds.
- `npm run build:app` with HEAD's `session.ts` swapped in for the before app: 0, restored byte for byte. On the tree: 0. No preview was running for either.

**Probes (vitest scratch files, run once in the worktree and removed):**
- The widened card probe: committed tree 0, D3b 0. Rerun with HEAD's `session.ts` swapped in: 0, and byte-identical to the committed-tree run.
- The focused-learner probe: HEAD's session 0, D3b 0.
- `compare_cards.py` on each pair: 0 ("no unapproved row after; every changed card had one before").
- `unfillable.py`: 0.
- `compare_dom.py`: 0.

**Browser (port 4193; free before and after; configs copied into `app/` for the run and removed):**
- The card look (`pw/probe/cardAt.spec.ts`, `pw/playwright.d3b-probe-4193.config.ts`, one worker): 0 before, 2 passed; 0 after, 2 passed.
- The Today spec (`pw/playwright.d3b-today-4193.config.ts`, two workers, the committed spec unchanged): **0, 16 passed**.

## Unverified, beside what passes

1. **Nothing heard, no decision made.** The replacements are unverified as music. That includes the arpeggio's level against the ostinato's, and the jam slot now holding a transposition page or an ear drill on a few rungs.
2. **The probe's learners are fresh**, placed at a rung with no runs. A learner with history reaches different slots (retention, counted items). The constructed cases, not the probe, cover those paths' logic.
3. **The phone look covers two rungs at two lengths** (`jam`, `holiday.5`; 30 and 60 minutes), read through the DOM and screenshots, not by a person on a phone. The "full page" pictures equal the viewport because the app scrolls inside its own container, so the 60-minute cards' last row is cut. The DOM JSON has every row.
4. **The rung page's picks were counted by my reading of `isPlayable` and `targetFor`**, not run (Follow-up 1).
5. **CI has not run this tree.**

## Not done

1. **No admission call at the reading slot, the daily read or skill retention.** They take reading rows only. A reading row is a runtime drill with no promise fact (D3a's build case), and the new built-catalogue case shows every item without a contract row admitted. A call there would be a second guard on a fact the build already holds, and a test for it would need a reading row that carries a music promise, which the build cannot make. If a generated reading row ever carried one, those three paths would need the call.
2. **`LessonScreen` untouched.** It is not a session-card path and not in the brief's files (Follow-up 1).
3. **No learner-facing "waiting for review" row or string**, by the binding answer. A refused ask stays unmet in the rung state (`evidence/rungState`, untouched), and the card takes the next valid step or drops the row.
4. **No rung list, gate logic, `selectors.ts`, swap sheet, build or record touched.**
5. **The browser look ran at the two rungs the brief names, not all 59.** The unit probe covers every rung, and the DOM equals the unit probe on all four cards checked.

## Follow-ups

1. **P1: the rung page's picks read a rung's list without the admission.** In `LessonScreen`, *Start* opens "the first thing on the rung that can be played", *Climb the ladder* the first exercise that opens as a score, and *Quick check* and the duet pick similarly. By my reading of the built catalogue, *Start* opens an unheard groove at `latin.3`, `jazz.4`, `holiday.5`, `jam.5`, `jazz.6`, `blues.6`, `rock.6`, `jam.6`, `latin.6`, `blues.7` and `blues.8`. *Climb the ladder* does the same there and at `jazz.9` and `blues.9`. Whether a rung page's *Start* is an automatic offer is Question 1. If it is, the fix is the same predicate at `startItem` and the ladder pick, falling to the next admitted option.
2. **P1: the Latin track stalls at `latin.3` (and `latin.6`) until a groove there has a `yes`.** Every exercise those rungs list promises music. The card will not claim their exercise asks, so a learner cannot meet them through the card (Question 2).
3. **P3: the jam slot and the rung step take a rung's options in list order.** With the grooves out, "Chords, form and feel" can be a transposition page (`chords-pop.7`, two hours) or an ear playback drill (`theory.8`, `improv.8`, `classical.9`, `ragtime.9`). Whether a jam should prefer chord and feel material is a jam-slot question (F's or the session's), not this seam's.

## Questions

1. **Is the rung page's *Start* (and *Climb the ladder*, *Quick check*) an automatic offer inside D3a's contract?** The reviewer's contract says every automatic offer, and these pick the item for the learner. They sit on the rung page, not the card, and outside this brief. My reading is yes, and the fix is one call per pick of the same predicate.
2. **`latin.3` and `latin.6` cannot be met through the card until a decision exists.** Is that acceptable as it stands (the reviewer's "never bypass"), or does F give each an admitted exercise until then? Either is F's or D2's to decide. Nothing here asks the owner.

## Files

In the worktree `C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-aaa20169ef5952602`, nothing committed, nothing staged:

- `app/src/curriculum/eligibility.ts`: `admittedForTeaching` exported over `unapprovedMusic`, and one sentence in the module note naming it.
- `app/src/curriculum/session.ts`: `usable` reads `admittedForTeaching` (the import, one condition, its note). The `Want` note says only `offer` is chosen from and what an empty offer means. The jam note says its options pass `usable`.
- `app/tests/unit/gateAtTheConsumers.test.ts`: the two D3b blocks, the docstring line, the imports.
- `docs/04-ui-spec.md` §2: the bullet *An automatic row is an offer, and passes the teaching-use admission*, and the swap-sheet paragraph's "a groove a rung lists can still be the card's own row" corrected.
- `docs/08-test-map.md`: the D3b row, the D3a row's last cell pointing to it, and the `gateAtTheConsumers.test.ts` file line.
- `docs/02-curriculum.md`: one sentence in the study note (Part E), naming the latin asks.

Outside the brief's list: none. Beside this entry (`…\scratchpad\D3b\`):
- `red/`: the red run and the six mutants.
- `runs/`: every run with its exit code, the probes' JSON, the comparisons, `unfillable.txt`, `changes-grouped.md`, `changes-table.md`.
- `pictures/before/`, `pictures/after/`: the card at `jam` and `holiday.5`, 30 and 60 minutes, 342 × 740, with each card's DOM rows as JSON.
- `pw/`: the two port-4193 configs, the storage state and `probe/cardAt.spec.ts`.
- `scripts/`: the two vitest probes, `mutate.py`, `probe_on_head.py`, `build_on_head.py`, `compare_cards.py`, `compare_dom.py`, `summarise_probe.py`, `table_changes.py`, `group_changes.py`, `unfillable.py`, `restore_reports.py`.
- `d3b.diff`.

**Orchestrator's note at the merge (2026-09-28).** Merged clean (main held only record commits since the dispatch). No content code changed, so the merged checkout's catalogue is D3a's chain build with the promise fact. The orchestrator's chain: tsc 0, the consumer, session, fallback-order, slots and eligibility files 0 (105 passed, the built-catalogue sweep among them), app build 0, the builder's card look rerun on the merged build at `jam` and `holiday.5` 0 (2 passed; under `runs/D3b/look/`). The orchestrator read the builder's pictures of the `jam` card at 30 minutes before and after: the warm-up row's title changes from the A-minor ostinato to the E major arpeggio under the same "Holiday asks for it" line, and the other rows are the same. Nothing heard; the replacements are the rungs' own listed options, unverified as music.
