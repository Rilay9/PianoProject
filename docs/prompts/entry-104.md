### Entry 104 — D3c: the rung page's automatic picks — *Start*, *Climb the ladder*, *Quick check* and the duet and blind tools' piece, named or the first song — each take the rung's next option that passes the one exported teaching-use admission, through one local helper, or are gone truthfully; Start's line calls its pick "the first thing on this rung" only when it is; the option rows keep every authored option; no second reading of the promise fact or the teaching bit (2026-09-28)

**Judgement.** The rung page no longer opens an unheard groove because a rung lists it first. I looked at `holiday.5` and `latin.3` on the phone at 342 × 740, before and after, from the DOM and from pictures, tapping each control. I checked every rung (109) through the real screen in a unit probe, and traced every place the page picks an item. Nothing was heard, and no teaching-use decision was made.

- **`holiday.5` before.** *Start*: "Opens “Ostinato over a pedal bass in A minor — broken minor triad”, the first thing on this rung", and it opened the ostinato. *Quick check* opened the ostinato too. There is no ladder, duet or blind tool on this rung.
- **`holiday.5` after.** *Start*: "Opens “E major arpeggio — 2 oct, both”." It opens the arpeggio, the rung's second listed exercise. *Quick check* opens the arpeggio. The ostinato is still the first row under *Exercise options*, with its ▶ (`pictures/after/rung-holiday.5.png`).
- **`latin.3` before.** *Start*: "Opens “Clave — son 2-3”, the first thing on this rung", and it opened the clave. *Quick check* opened the same clave. *Ways to play this* held *Play it as a duet*, which opened the son 3-2 clave over a quarter-note pulse, a groove.
- **`latin.3` after.** *Start*: "Opens “Cielito Lindo”." It opens the song, the rung's song ask. *Quick check* opens nothing and says "This lesson has no drill to check against yet." The duet button is gone, and with it the whole *Ways to play this* block. The duet names a groove, and a named item with no admission draws no button (no song is substituted). All five claves and the tresillo are still listed and tappable (`pictures/after/rung-latin.3.png`).
- **Across the curriculum.** On the committed code, **24 controls on 13 rungs** opened a music-promising generated item with no affirmative decision. That is *Start* and *Quick check* on the eleven rungs Entry 103 named (`latin.3`, `jazz.4`, `holiday.5`, `jam.5`, `jazz.6`, `blues.6`, `rock.6`, `jam.6`, `latin.6`, `blues.7`, `blues.8`), plus the duet on `latin` and on `latin.3`. After: **0**. Twenty of the 24 now open the rung's next admitted option. Four open nothing: the duets of `latin` and `latin.3`, and *Quick check* on `latin.3` and `latin.6`, whose every exercise is a groove. No *Start* is gone. Every one of the 1,021 option rows is still drawn (`runs/compare-probe.md`).
- **As music: unverified.** What a teacher would notice among the replacements:
  - A carol rung (`holiday.5`) now starts on a two-octave arpeggio, a level and a half above the ostinato.
  - `latin.6`'s *Start* opens a song titled *Tango La Cumparsita - Piano Solo (Tutorial Parte B)*.
  - `jam.5`'s *Quick check*, "a 2–3 minute measured test", now opens *Play the form with the chart*, a backing-track drill where nothing is judged (Follow-up 3).
  - Each is the rung's own authored option in the rung's own order.

Five things the reviewer should hear first:

- **One helper, four picks, one predicate.** `firstOffered(ids, valid)` in `LessonScreen.ts` walks the rung's options in order and returns the first that passes the control's own condition and `admittedForTeaching`. It is the only admission call on the page. Every pick goes through it: `startItem`, the ladder, *Quick check*, `scorePiece`'s named `tool.item` and `scorePiece`'s song fallback. `valid` is the control's existing question, asked of `openItem`'s helpers (`isPlayable`, `targetFor`) or read off the item (`drill || file`, `type === 'song'`). `openItem.ts` is untouched and holds no admission. A test holds both files to that.
- **Premise corrected: *Climb the ladder* changes nowhere.** Entry 103's Follow-up 1 said the ladder "does the same there and at `jazz.9` and `blues.9`". The ladder tool is on seven rungs only (`4.1`–`4.4`, `technique.4`, `.6`, `.7`; `ladderTool.test.ts`). None of them lists a refused exercise ahead of an admitted one, so no ladder control changes on the build. *Quick check*, which Entry 103 did not count, changes on the same eleven rungs as *Start*. The brief's "the eleven rungs' Start among them" for the controls that vanish is also corrected: every one of the eleven has an admitted next option, so none vanishes.
- **Start's line had to change with the pick.** "Opens “E major arpeggio”, the first thing on this rung" sits right above a list whose first row is the ostinato. That line is false. The line now keeps *the first thing on this rung* only when the pick is the rung's first listed option. Otherwise it reads *Opens “X”.* No new string and no "waiting for review" (the D3b ruling). On the build this changes exactly the eleven rungs' lines and no other (`runs/compare-probe.md`: the Start line changes only where Start moved).
- **The option rows are the learner's choice and are untouched.** Every refused groove is still listed with its ▶, and the tests say so literally: the refused row is drawn and tapping its ▶ opens it, while no automatic control resolves to it (the reviewer's constraint on the brief).
- **Written for E1a to broaden without reopening this.** No test or helper here says which kinds the predicate refuses.
  - The constructed refused item is a generated groove. Each case first asks the predicate what it says of it, and never infers it.
  - The sweep asks the predicate of whatever each control resolves to.
  - The "picked exactly as before" case uses a plain notated song (type `song`), not an excerpt.
  - The named list of gone controls is today's catalogue. No rung lists an excerpt, so E1a's extension changes nothing on the rung page today.

## The mechanism, and the test that told it apart

**Cause.** D3a put the teaching-use check in `eligibleFor`, and D3b put the same predicate into `session.usable` for the card's rows. The rung page asks neither. Its four controls pick from the rung's lists by position and by the item's shape (playable, opens as a score, has a drill or a file, is a song). An authored placement is not a teaching-use decision, so a groove the rung lists first is what Start and Quick check opened. The same goes for a groove a duet names.

**Alternative.** Some other path on the page opens the grooves, such as the option rows or the Simon tool. Or the grooves reach a control indirectly, for example Start through an import overlay.

**Test.** The rung-page probe, through the real screen on the built catalogue, lists all 24 offending controls: Start 11, Quick check 11, the named duet 2. Each changed pick's before-item is one the predicate refuses. None is explained any other way (the sweep's third case, and `compare_probe.py`'s check). The Simon tool opens only runtime drills with no promise fact (`runs/simon-check.txt`: three drills, none carrying one). The option rows are the learner's choice by the reviewer's ruling. With the admission in `firstOffered`, the count is 0. Each per-path mutant brings back its own path's red.

## Every pick on the rung page, where the admission sits, and what it opens at the named rungs

| Control | Its own condition (unchanged) | Where the admission sits | When nothing passes | `holiday.5` before → after | `latin.3` before → after | Changes on the build (every rung) |
| --- | --- | --- | --- | --- | --- | --- |
| *Start* (`startItem`, `drawStart`) | the first **playable** option, exercises then songs (`isPlayable`) | `firstOffered([...exerciseOptions, ...songOptions], isPlayable)` | the block is not drawn (as for an all-import rung) | the ostinato → the E major arpeggio; the line loses "the first thing on this rung" | the son 2-3 clave → *Cielito Lindo*; the same line change | 11 rungs move; none gone |
| *Climb the ladder* (`toolButton` `ladder`) | the first exercise that **opens as a score** (`targetFor === 'score'`), only where the rung names the tool | `firstOffered(exerciseOptions, targetFor === 'score')` | the button is not drawn; the block hides if it was the only tool | no tool | no tool | none: the seven ladder rungs list no refused exercise first |
| *Quick check* (`#lesson-check`) | the first exercise with a **drill or a file** | `firstOffered(exerciseOptions, drill \|\| file)` | the button stays; the tap says "This lesson has no drill to check against yet." (the existing sentence) | the ostinato → the E major arpeggio | the son 2-3 clave → the sentence | 11 rungs: 9 move, `latin.3` and `latin.6` say the sentence |
| Duet and blind, a **named** `tool.item` (`scorePiece`) | one of the rung's own options, and **opens as a score** | `firstOffered([tool.item], targetFor === 'score')` | no button, exactly as a name that is not the rung's own; never the song instead | no tool | the son 3-2 clave over a pulse → gone (and *Ways to play this* with it) | `latin`'s duet (the Latin groove) and `latin.3`'s: gone |
| Duet and blind, **no** item: the first song (`scorePiece`) | the first **playable song** | `firstOffered(songOptions, isPlayable && type === 'song')` | no button | no tool | (named, above) | none: no built song is refused |
| *Simon* (`toolButton` `simon`) | the named drill or the stage's: not a pick from the rung's list by position | none (not one of the four; the brief's scope) | — | — | — | none: its three drills are runtime drills with no promise fact |
| Option rows (`optionRow`) | every authored option, ▶ where playable | **none, by ruling**: an explicit learner choice like the Library | — | all 7 rows, the ostinato first | all 8 rows, the claves first | none: 1,021 rows before and after |

## The sweep: every control that changes (`runs/compare-probe.md`, from the probe through the real screen)

| Rung | Control | Before | After |
| --- | --- | --- | --- |
| `latin.3` | Start | Clave — son 2-3 | Cielito Lindo |
| `latin.3` | Quick check | Clave — son 2-3 | says: This lesson has no drill to check against yet. |
| `latin.3` | Play it as a duet | Clave — son 3-2 over a quarter-note pulse | gone (button not drawn) |
| `jazz.4` | Start, Quick check | Comping — charleston on triads in F | Rhythm: shuffle eighths — 4 bars |
| `holiday.5` | Start, Quick check | Ostinato over a pedal bass in A minor — broken minor triad | E major arpeggio — 2 oct, both |
| `latin` | Play it as a duet | Latin groove — tumbao and montuno on son 3 2 in C minor | gone (button not drawn) |
| `jam.5` | Start, Quick check | Comping — charleston on triads in E | Play the form with the chart |
| `jazz.6` | Start, Quick check | Comping — charleston in C | ii-V-I in C — shell (root, 3rd, 7th) |
| `blues.6` | Start, Quick check | Boogie — pinetop in C, both hands | Turnaround in C — I-vi-ii-V |
| `rock.6` | Start, Quick check | Ostinato over a pedal bass in A minor — broken minor triad | Broken chord in A minor — hands together |
| `jam.6` | Start, Quick check | Walking bass over a 12-bar blues in E | Twelve-bar blues shuffle in E |
| `latin.6` | Start | Tumbao — latin bass in G minor | Tango La Cumparsita - Piano Solo (Tutorial Parte B) |
| `latin.6` | Quick check | Tumbao — latin bass in G minor | says: This lesson has no drill to check against yet. |
| `blues.7` | Start, Quick check | Stride in F, both hands | Turnaround in F — iii-VI-ii-V |
| `blues.8` | Start, Quick check | Walking bass over a 12-bar blues in E♭ | Ninth chords |

**The controls gone** (the literal list in the test, `GONE`): `latin duet`, `latin.3 check`, `latin.3 duet`, `latin.6 check`.

**Start's line**, on the eleven rungs where Start moved and nowhere else: *Opens “X”, the first thing on this rung.* becomes *Opens “Y”.*

## The red lines

Seen before the change each proves, on the committed code or on a mutant. The source was never left changed: every mutant and every HEAD run swapped the bytes back and checked them by hash.

- **`red/red-committed-code.txt`, rerun as `red-committed-code-final.txt` after a lint-only edit to the test's mock holder.** On the committed code, 23 of the new file's 30 cases fail, exit 1.
  - Each pick at `null` and `false`:
    - Start: `expected 'ex.groove' to be 'ex.next'`, and `… to be 'song.a'`.
    - Ladder: `expected 'ex.groove' to be 'ex.scale'`, and `expected <button …> to be null`.
    - Quick check: `expected 'ex.groove' to be 'drill.prompt'`, and `… to be null`.
    - The named duet: `expected 'ex.groove' to be null`.
    - The song fallback: `expected [ 'song.refused', 'song.refused' ] to deeply equal [ 'song.b', 'song.b' ]`, and `expected <button …> to be null`.
  - The option-rows case: `expected [ 'ex.groove', 'ex.groove', …(3) ] to not include 'ex.groove'`.
  - The source case: `expected '/**\r\n * The lesson page …' to match /admittedForTeaching\(/`.
  - The sweep: `24 controls: expected [ …(24) ] to deeply equal []` twice, and `expected [] to deeply equal [ 'latin duet', 'latin.3 check', …(2) ]`.
  - The seven green on both, by design: the five `teaching: true` cases, the drill-and-song case, and the sweep's precondition.
- **`red/red-e2e-before-build.txt`: the new browser case on the committed build.** Exit 1, `Error: Start still opens the unapproved groove the rung lists first`. The spec's other 11 cases pass.
- **`red/mutant-start.txt`: the admission off Start.** 7 red: the four Start cases, the option-rows case, and the sweep's first two cases.
- **`red/mutant-ladder.txt`: off the ladder.** 5 red: the four ladder cases and the option-rows case. The sweep stays green, because no ladder rung changes on the build.
- **`red/mutant-check.txt`: off Quick check.** 8 red: the four Quick check cases, the option-rows case, and the three sweep cases (the gone list loses `latin.3 check` and `latin.6 check`).
- **`red/mutant-duet-named.txt`: off the named duet item.** 6 red: the two named cases, the option-rows case, and the three sweep cases.
- **`red/mutant-duet-song.txt`: off the song fallback.** 4 red: the four song-fallback cases. The sweep stays green, because no built song is refused.
- **`red/mutant-helper.txt`: off the helper itself (every path).** 23 red, the committed code's set.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `lessonPagePicksPassTheAdmission.test.ts` › *each automatic pick on the rung page takes the next admitted option, or is gone truthfully (D3c)* (20) | add | — | The real screen on constructed rungs. Each pick at `null`, `false` and `true`: skipped, skipped, taken, and the predicate asked first. The next admitted option is taken, or the control is gone truthfully: no Start; no ladder, duet or blind button, with the block hidden; *Quick check*'s sentence and no navigation. The named duet item gives no button, never the song. The song fallback is checked for duet and blind. A generated drill and a notated song are picked exactly as with no provenance at all. Every authored option stays listed and its ▶ opens it, while no control resolves to the refused one. Start's line has the clause only when the pick is first. `LessonScreen.ts` reads neither the fact nor the bit and calls the admission; `openItem.ts` holds none. |
| the same file › *every rung of the built curriculum, on the built catalogue …* (4) | add | — | Every rung mounted with the built catalogue. The refused items are there to find. No control resolves to an item the predicate refuses. Each control equals the rung's next admitted option for its own condition, or is gone only where there is none. Every change is a refused first choice. The gone controls are named. |
| `start-and-return.spec.ts` › *Start is an offer: it passes over a listed groove …* | add | — | At `holiday.5`, the ostinato is still the first exercise row with its ▶. Start names another listed option, without "the first thing on this rung", and tapping it lands on that item. |
| `start-and-return.spec.ts` (the other 11), `lesson-tools.spec.ts` (4), `modes-ladder.spec.ts` (4) | preserve | — | green, unchanged |
| `modes-duet.spec.ts` (5) | preserve | — | Four green. *A rung whose duet names an exercise* is intermittent: its helper reads the option rows before the page draws them, a race shown on both builds (below; Not done 2) |
| `ladderTool.test.ts`, `lessonPageReadsTheEvidence.test.ts`, `chartDoor.test.ts`, `labToolFields.test.ts`, `lessonSongEmpty.test.ts`, `lessonVideos.test.ts`, `lessonPaperBookPicker.test.ts`, `gateAtTheConsumers.test.ts` (D3a, D3b and E0 cases), `eligibility.test.ts` | preserve | — | Green, unchanged. Their constructed items carry no promise fact, and `ladderTool`'s built-catalogue rows ask `targetFor` only. |
| `lessonClaimsAboutApp.test.ts` | preserve | — | Green except its two recorded CRLF worktree reds, `blues.3` and `4.7`. They match a literal LF in `ScoreScreen.ts` and `style.css`, both untouched (the D0, E0, D3a and D3b record). |

## Checks (unpiped; exit codes read)

Every run's output is under `runs/` (the red ones under `red/`), with the exit code as its last line.

**Setup**
- `npm ci`: 0.
- The parity reference: 0. Its three real-MIDI inputs are absent and skipped, as the script allows.
- Copies from the main checkout (`runs/copy.txt`): `kern` and `musetrainer` without their version-control folders, `build/cache/convert`, `build/demands-cache.json` and `build/notation-cache.json`. Robocopy's 1 means "files copied".

**Content**
- `build.py --offline`: 0. 2090 items, validation OK, reports line `592 checkable claims on 1021 options: 356 not established, 9 kept by no option`.
- `SOURCES.md` restored with `git checkout --`.
- `rung-claims.md` and `inventory.md` given HEAD's line endings back; their text was HEAD's (`runs/restore-reports.txt`, 0).
- No content file changed.

**App**
- `npx tsc -b`: 0, and 0 again after the change.
- `npm run lint`: 1 on the first run, for one unnecessary type assertion in the new test's mock holder (`runs/lint-first.txt`). Rewritten; then 0.
- The new file: 1 on the committed code (above), 0 after with 30 passed.
- The named lesson-screen and admission files (11): 1, with 428 passed and 2 failed, the two recorded CRLF reds.
- Vitest in full: 1, with 6581 passed, 2 failed (the same two) and 5 skipped.
- The six mutants: each 1. Driver 0; source restored byte for byte.
- `npm run build:app`: before 0, after 0. No preview was running for any build (port 4193 checked free before each).
- The two builds with HEAD's `LessonScreen.ts` swapped in, for the race check: 0 each, restored.

**Probes**
- The rung-page probe (a vitest scratch file, copied in for one run and removed): before 0, after 0.
- `summarise_probe.py`: before 24 offending controls, after 0; both 0.
- `compare_probe.py`: 0 ("every changed control's before-item refused, no after-item refused, every option row still drawn").

**Browser** (port 4193; configs and specs copied into `app/` for each run and removed; port free after)
- The look (`pw/probe/rungPage.spec.ts`, `pw/playwright.d3c-probe-4193.config.ts`, one worker): before 0, 2 passed; after 0, 2 passed.
- `start-and-return.spec.ts` and `lesson-tools.spec.ts` (`pw/playwright.d3c-lesson-4193.config.ts`, two workers):
  - Before build: 1, 11 passed, the new case red.
  - Final after build: **0, 12 passed**.
- `modes-duet.spec.ts` and `modes-ladder.spec.ts`: after, 1 with 8 passed and 1 failed. The failure is *a rung whose duet names an exercise*: "technique.7's duet opened something the rung does not offer: #/score/exercise.independence.c.2v3…", which is the rung's own named option (unchanged by D3c, as the probe shows).
  - Repeated alone: after 7 of 8 and 3 of 4 passed; before 8 of 8.
  - The discriminating probe (`pw/probe/duetRace.spec.ts`) reads the rows at the spec's moment, then again once the duet button shows. The rows were 0 at the spec's moment in 3 of 8 runs after and in 8 of 8 runs before. They were 16, the named exercise among them, once the button showed, every time on both builds.
  - The spec's helper reads `offered` the instant the lesson section is visible, before the page's async load draws the rows. The race is the spec's and exists on both builds. How often it lands depends on load timing, and this sample does not explain the different pass rates.

## Unverified, beside what passes

1. **Nothing heard, no decision made.** The replacements are unverified as music: the arpeggio on a carol rung, *La Cumparsita (Tutorial Parte B)* as `latin.6`'s Start, a backing loop as `jam.5`'s *Quick check*.
2. **The sweep runs the real screen in jsdom, not a browser.** The browser look covers `holiday.5` and `latin.3`, read from the DOM and pictures, not by a person on a phone.
3. **Fresh learner, default settings.** With strict prerequisites on, `open` asks one confirmation first. The pick is the same, because the lock does not enter `firstOffered`.
4. **Imports are not in the sweep.** In the app `allItems` overlays the learner's imports. An imported item carries no promise fact and is admitted by construction; no constructed case covers one.
5. **The `modes-duet` race's rate difference between builds is not explained by the samples.** The mechanism (rows read before drawn) is shown on both builds.
6. **CI has not run this tree.**

## Not done

1. **No admission on the option rows**, by the reviewer's ruling: they are a learner's explicit choice. **No admission at Simon**: not one of the four, and its drills carry no promise fact.
2. **`modes-duet.spec.ts`'s race not fixed.** The fix is one line in `duetFromTheRung`: wait for the first option row before reading `offered`. The file is outside the brief's list, and the fault is the spec's (Follow-up 2).
3. **`latin.3`'s and `latin`'s lesson prose not changed.** Lessons are not D3c's files (Follow-up 1).
4. **No new learner-facing string.** Start's shorter line is the existing one without its clause, and *Quick check*'s sentence is the existing one. No "waiting for review".
5. **No rung list, gate, `eligibility.ts`, `session.ts`, `openItem.ts`, swap sheet, build or record touched.**

## Follow-ups

1. **P2 (content; F's or the content owner's): two lessons name a button the page no longer draws.** The *Tools for this rung* paragraph of `latin.3` says *Play it as a duet* opens the son clave over a pulse, and `latin`'s says it opens the tumbao-and-montuno groove. Both named items are refused until a teaching-use yes, so neither rung draws the button, and at `latin.3` the whole *Ways to play this* block is gone. `lessonClaimsAboutApp` does not catch it, because the rung's authored `tools` still carry the duet. Either a decision on the two grooves or a prose change closes it; nothing here should substitute a song.
2. **P3: `modes-duet.spec.ts` reads the option rows before they are drawn.** The race is shown on both builds (`runs/duet-race-*.txt`). The one-line fix is under Not done 2. `lesson-tools.spec.ts`'s duet case does not race: it waits on the tools block, which is drawn in the same pass as the rows.
3. **P3: *Quick check*'s condition (`drill || file`) admits a drill that judges nothing.** At `jam.5` the next admitted option is *Play the form with the chart*, a backing-track drill ("Nothing here is counted"), under a button whose spec calls it "a measured test". The groove hid this, as the card's grooves hid Entry 103's jam-slot thinness (G61's family). It is a Quick check selection question, not an admission one.

## Questions

1. **Is a runtime backing-track drill outside the music-promise contract?** `drill.jam.form-tracker` (`backing-track`, runtime, no promise fact) is admitted by construction and is now `jam.5`'s *Start* and *Quick check*. Its generator plays a bass-and-drums loop to improvise over. It sets no material for the learner to play, and nothing is judged. I read it as a tool like the accompaniment lab, not generated music presented to be learned, so I did not stop under the brief's provenance clause. If the reviewer reads a backing loop as a music promise, it is that clause's provenance defect for the build (D2's or the contract table's), not a rung-page special case.
2. **Start's shorter line**, *Opens “X”.* where Start passes over the rung's first option, is my wording. It is the existing sentence without the clause that would be false there, and nothing is added. Say if the page should explain the skip instead. Any such text would have to avoid "waiting for review" (the D3b ruling).

## Files

In the worktree `C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-a465c0bc54863c9b3`, nothing committed, nothing staged:

- `app/src/ui/screens/LessonScreen.ts`:
  - the `admittedForTeaching` import;
  - `firstOffered` and its note;
  - the five picks through it (`startItem`, the ladder, *Quick check*, `scorePiece`'s named item and its song fallback), with their notes;
  - Start's line, which keeps the clause only when the pick is first.
- `app/tests/unit/lessonPagePicksPassTheAdmission.test.ts` (new): the constructed cases, the source case and the built-catalogue sweep.
- `app/tests/e2e/start-and-return.spec.ts`: the one new case at `holiday.5`.
- `docs/04-ui-spec.md`:
  - §3e: Start's line, and the new bullet *Every pick this page makes for the learner is an offer …*;
  - §3d: the duet or blind piece, and the ladder's exercise, each passing the admission;
  - §3's Quick check parenthesis;
  - §2's D3b bullet pointing to §3e.
- `docs/08-test-map.md`: the D3c row, the D3b row's last cell pointing to it, and the new unit file's line and `start-and-return.spec.ts`'s line.

Outside the brief's list: none. Beside this entry (`…\scratchpad\D3c\`):
- `red/`: the committed-code runs, the browser red and the six mutants.
- `runs/`: every run with its exit code, both probes' JSON, `compare-probe.md`, the race probe's output, the Simon check.
- `pictures/before/`, `pictures/after/`: `holiday.5` and `latin.3` at 342 × 740, the first screenful and the actions view, each with its DOM and landings as JSON.
- `pw/`: the two port-4193 configs, the storage state, `probe/rungPage.spec.ts` and `probe/duetRace.spec.ts`.
- `scripts/`: `zzD3cRungPageProbe.test.ts`, `summarise_probe.py`, `compare_probe.py`, `expect_after.py` (a planning aid, never a test), `mutate.py`, `red_on_head.py`, `build_on_head.py`, `restore_reports.py`, `read_trace.py`, `simon_check.py`, `tools_list.py`.
- `d3c.diff` (the tracked files; the new test is untracked and not in it).

**Orchestrator's note at the merge (2026-09-28).** Merged clean (main held only record commits since the dispatch; E1a is building beside it on `eligibility.ts`, which D3c does not touch). The orchestrator's chain on the merged checkout, the catalogue E1's chain build: tsc 0, the new unit file with the consumer, gate and ladder files 0 (148 passed, the built-catalogue sweep among them), app build 0, the lesson-page specs 0 (12 passed at two workers on the default port), the builder's rung-page look rerun on the merged build at `holiday.5` and `latin.3` 0 (2 passed; under `runs/D3c/look/`). The orchestrator read the builder's picture of `latin.3` after the change (the first screenful at 342 × 740): Start reads "Opens “Cielito Lindo”." with no "first thing on this rung" clause, Quick check is drawn, and the claves stay listed under *Exercise options* with their play buttons; the builder's DOM record says the *Ways to play this* block with the duet button is gone, below the first screenful. The shared consumer and whole-catalogue sweeps run once more on the combined tree when E1a lands (the reviewer's constraint on E1a). Nothing heard; the replacements are the rungs' own listed options, unverified as music.
