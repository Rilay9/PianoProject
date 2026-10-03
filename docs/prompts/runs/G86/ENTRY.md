### Entry 158 — G86 + U69 — the Score screen's ⋯ and tempo sheets close when the screen is left, so Back no longer leaves a sheet over the next screen with that screen inert; and ▶ (and Space) ask the audio to start inside the tap, wait at most `PLAY_SOUND_WAIT_MS` with ▶ dimmed and busy, then go on (2026-09-29)

Base: `f6d36ee9` (origin's head at dispatch). `app/src` and `app/tests` are unchanged between the brief's `ee481854` and it, so the brief's line numbers held. One source file changed (`ScoreScreen.ts`).

**Judgement — G86, the Library after Back with the ⋯ sheet open, 342 × 740.** The score was reached from the Library, ⋯ opened, then the browser's Back.

- **Before (committed screen, observed: `pictures/g86/library-after-back-committed.png`, `library-after-back-committed.json`):** the Score screen's **Controls** sheet stays over the Library: *Start again*, *Input*, *Rhythm only*, *Loop*, *Metronome*, *Bars in window*, all rows of a screen that has gone, and the Library's heading and links visible above it. The probe counts 1 sheet and 1 inert child of `body` (which child was not recorded; `isolate` makes every child but the sheet inert), so what is behind the sheet cannot be reached, and the sheet's rows call the disposed screen's handlers (read in the code, not exercised). A learner who pressed Back to leave a piece lands on a screen they cannot use until they find *Close* on a sheet that belongs to the screen they left.
- **After (observed: `pictures/g86/library-after-back-fixed.png`, `library-after-back-fixed.json`):** the Library alone, its search, filter and rows in reach. 0 sheets, 0 inert children of `body`. The same holds for the tempo sheet (browser case and unit case; not pictured).

**Judgement — U69, what ▶ now does on a suspended engine. *Unverified on a device*: no phone was used, nothing was heard, and neither test layer applies Android's lock-screen suspend or its rule that only a tap may resume audio.** Where the app's audio is not running (suspended, or never created), ▶ calls `audioEngine.ensureStarted()` inside the tap, holds itself dimmed with `aria-busy="true"` and `data-starting-sound="true"`, waits for the start at most `PLAY_SOUND_WAIT_MS` (1 s, chosen, the reason beside it), then starts the run, carries on the paused one, or ends *Hear it* for the run asked for, whether or not the start answered. Space's start does the same. The pause never waits. Where the audio is running or there is no Web Audio, ▶ acts at once exactly as before. What observed it:

- **Unit (the screen's calls and the bound, engine mocked):** `ensureStarted` called in the tap and the resume or start only after it answers; with a start that never answers, ▶ busy until the bound and the run carried on at it; nothing asked where the engine runs or is unsupported.
- **Browser (a real Chromium context):** the page's `AudioContext`, captured by wrapping its constructor in an init script (no app hook), running after one ordinary tap had spent the first-gesture start, then suspended by the page: after ▶ it stays `suspended` on the committed screen and is `running` on the fixed one. This Chromium starts and resumes contexts without a gesture (`score.hearIt.spec.ts`'s header), so what it shows is that ▶ now asks, not that a phone would honour the ask.
- **The busy state as a learner sees it:** in the ordinary browser path the busy attribute came and went (a MutationObserver saw it once, `play-busy-fixed.json` `ordinaryBusy: 1`), too brief to picture. Pictured instead with the context's `resume` stubbed never to answer (`pictures/g86/play-busy-fixed.png`): ▶ dimmed at the bar's left, the rest of the bar as it was, the state line still *Paused — ▶ to carry on…*. After the bound ▶ read ⏸, the run carried on, and the context was still `suspended`, silent, exactly the pre-fix outcome, which is what the bound promises. Whether a learner reads a dimmed ▶ for up to a second as "starting" rather than "unavailable" is a judgement from the picture, not a measurement; there are no words for the case where the bound expires with the sound still off (Question 1).

Pedagogical: nothing here touches what is taught or judged; the screen behaves as a person expects on Back, and ▶ does what it can to make the run audible. *Unverified as music*: nothing was heard.

## Done

1. **G86's mechanism, tested (item 1). The premise holds.** `openStashedSheet` pushed a closer that nothing read, the disposer did not close the sheet, the sheet lives on `body` outside the `main` AppShell clears, and `isolate` keeps the app root inert until the sheet's own close runs. The browser case on the committed screen: after `page.goBack()` the Library's heading shows and `#score-more-sheet` / `#score-tempo-sheet` still exist (`browser-red-committed.txt`: *the sheet left over the Library, Expected: 0, Received: 1*, both sheets). The alternative, something else closing a sheet on a route change, is refuted by that result.
2. **G86's fix (item 2).** `ScoreScreen.ts`: the disposer drains `openSheets` first, before anything that could throw (`for (const close of openSheets.splice(0)) close();`, :5191). Each closer moves the rows back to their stash and closes the sheet if it is still connected (projectSheet's `isConnected` shape). A closer leaves the list when its sheet goes by Close, the backdrop or Escape: the existing `MutationObserver` now calls a shared `restore` that also splices the closer out (:1943–1964). So the list holds open sheets only. `widgets.ts`, `projectSheet.ts` and every other screen are unchanged.
3. **G86 red first (item 3).** Browser, `score.screen.spec.ts` › *Back with a sheet open takes the sheet with it (G86)*: the ⋯ sheet, and the tempo sheet (opened from `#score-tempo-label` with a 5 s click timeout); a score reached from the Library; Library heading, sheet count 0, no inert child of `body` read through `page.evaluate`. Red on the committed screen, green after. Unit, the new file: dispose with ⋯ open, and with the tempo sheet open (no `.sheet`, no inert child, rows back in their stash); Close, open again, dispose (the closed sheet's `close` never called again, the open one's once); Close and dispose in the same moment, before the observer's microtask (nothing thrown, nothing closed twice). Red on the committed screen (4 of 4), green after.
4. **U69's mechanism, tested (item 4). The premise holds.** `togglePlay` called `startRun()`, `session.resume()` (the practice engine's, `ScoreSession.ts:615`) or `session.pause()`, and no branch touched `audioEngine`. A grep of `app/src/**/*.ts` for `.resume()` and `ensureStarted()` finds the Score screen's only engine starts at `toggleHear` and at load through `getPiano()` (services.ts:69); `smplr`'s `resume()` is its own player's, not the context's. The unit case on the committed screen: `ensureStarted` not called and the resume at once (`unit-red-committed.txt`: *nothing on ▶'s path asked the sound to start: expected 1 times, got 0*). The browser case: the context still `suspended` after ▶ (*the context after ▶, Expected "running", Received "suspended"*). The request's *"togglePlay calls only session.resume()"* was imprecise, as the brief said: it also starts runs, and that resume is not an audio resume.
5. **U69's fix (item 5).** `ScoreScreen.ts`: `togglePlay` (:2766) pauses at once when a run is playing and otherwise hands `playNow` (:2783) to `withSound` (:2818). `playNow` holds ▶'s sound-making branches, evaluated when they run, and never pauses (a key may have started a run during the wait). Space's handler (:5166) re-checks `spaceMayStart()` when its wait ends. `withSound` acts at once where `!audioEngine.supported || audioEngine.state === 'running'`. Otherwise it returns if a tap is already waiting (`startingSound`, shared with `Hear it`, so neither button starts anything during the other's wait), calls `ensureStarted()` in the tap, and settles once on whichever comes first, the start answering (or failing) or `PLAY_SOUND_WAIT_MS` (:215, a named constant with its reason: chosen, not measured). Leaving or a new session cancels (`leaving || session !== tapped`). `drawPlayHold` (:2850, also called from `render`) shows the wait: `disabled`, `aria-busy="true"`, `data-starting-sound="true"`, beside the transfer offer's hold. No words added. The row's alternative, a resume on `visibilitychange`, is not taken: it is not a user activation, and `AudioEngine.ts:4–5` records that Android ignores a resume made outside one. MIDI key starts unchanged (Follow-up 2).
6. **U69 red first (item 6).** Unit, engine mocked (`supported`, `state` set per case, `ensureStarted` a spy; `getPiano` held so the load never calls it): ▶ on a paused run; a start that never answers, fake timers (busy until `PLAY_SOUND_WAIT_MS − 1`, resumed at the bound, busy cleared; a second tap and Space in the wait do nothing); a failing start still carries on; running and unsupported act at once; the pause never waits; a fresh start (with Space and *Hear it* pressed during its wait, neither asking again); Space's start; ▶ during *Hear it*; leaving in the wait. Red on the committed screen: 6 of 9 (the three guards, failure, running/unsupported and pause, pass on both, as they should). Browser, `score.screen.spec.ts` › *▶ after the sound was suspended (U69)*: built; the init-script capture reached the context without an app change. Red, then green.
7. **Not this lane's (item 7):** `widgets.ts`, `projectSheet.ts`, `help.ts`, `AudioEngine.ts`, `main.ts`, `ScoreSession.ts`, `style.css` and the other screens untouched; their sheets are listed under Follow-ups with lines.

**Mutants** (`mutants.txt`, the new unit file against each; all red): the disposer's drain removed, 4 cases fail; the bound's timer removed, the never-answering case fails; the waiting guard removed, the fresh-start case fails (`ensureStarted` twice). The closer's self-removal from the list is not separately observable: the `isConnected` check also keeps a stale closer from closing a closed sheet, and the unit case asserts that observable contract.

*Technical:* 13 unit cases, 3 browser cases, 3 mutants red. *Pedagogical:* none applies.

## Not done

- **A new session during ▶'s wait cancelling:** implemented (`session !== tapped`, the `toggleHear` precedent), not tested; leaving during the wait is.
- **The full unit suite green:** 3 of 7,201 failed on this machine, none in this lane (`unit-all-summary.txt`). `expectedNote.test.ts` timed out at 5 s under load and passes alone (`unit-expectedNote-alone.txt`). Two `lessonClaimsAboutApp.test.ts` claims (blues.3, 4.7) compare source text joined by `\n` against a working copy checked out with CRLF (`core.autocrlf=true`): 4.7 reads `style.css`, untouched here; blues.3's text is in the committed LF blob and in this change normalised to LF (checked). A checkout-line-ending artefact that CI's LF checkout does not have.
- **The state gallery green:** `npm run states` exited 1 on 2 of 60 cells, `theme--light` (contrast of `#score-waiting` and `#score-help-more` at 4.3:1) and `rotation--bars1-real-phone` (§9.35, music 39 % of the stage). The same two cells, same values, on a dist built from the committed screen at this base (`states-committed.txt`) and in U82's record. Not this change.
- **Three targeted browser failures:** `score.layout.spec.ts`'s three landscape screenshots found no reference at `…-e2e-win32.png` and wrote one. The `-e2e-` comes from the config copy's project name, and the snapshots are gitignored, so there was no reference to compare against. An artefact of this run's config; the written files were deleted.
- **The device observation** (lock the phone mid-session, press ▶, listen): not done, no device here. Follow-up 3.

## Follow-ups (recorded, not fixed)

1. **P2: the other screens' sheets, and the Score screen's help sheets, are not closed on leaving.** A grep of each opener's module for `onScreenDispose` and a close in it, with the app intercepting no back navigation (`router.ts` listens to `hashchange` only). Only `projectSheet` (with `owner`, from Progress and the Score screen) closes on leaving. Each is `openSheet` on `body` with the rest inert, like G86 before this change:
   - the Score screen's own first-sight card, `helpStrip.ts:268` via `ScoreScreen.ts:1184`, `:5012` (a first visit to a mode) and `:953`; **observed in the unit harness**: disposing the screen with it open left a `.sheet` in the document (the new unit file's first run, before it marked the cards seen as the browser specs' storage state does). The same card opens on the Drill screen, `DrillScreen.ts:349`, `:354`.
   - the help strip's `?` sheet, `helpStrip.ts:141`, on every screen with a strip.
   - Library: `LibraryScreen.ts:724` (detail), `:890` (edit), `:956` (open as…), `importSheet.ts:302` via `:448`.
   - Lesson: `LessonScreen.ts:520` (which book?), `finderSheet.ts:90` via `:360`. Skills: `finderSheet.ts:90` via `SkillsScreen.ts:289`.
   - Plan: `PlanScreen.ts:662` (tracks; its disposer at `:847` is empty). Today: `TodayScreen.ts:392` (swap).
   - Folder: `FolderScreen.ts:1105` (detail), `assignSheet.ts:133` via `:1276`. Pdf: `PdfScreen.ts:303` (Timed). Shelf: `ShelfScreen.ts:88`, `:349`.
   One shape would serve them all (an owner on `openSheet`, closed by `disposeScreen`), but that is `widgets.ts`, outside this lane.
2. **P2: other taps that start a run without asking the audio to start.** `startFromKey` (`ScoreScreen.ts:2050`): a MIDI key is not a user activation to the platform, so an ask would be ignored there anyway. The one-shot hook covers only the visit's first gesture. The on-screen taps that start a run directly, each a user activation that could ask as ▶ does, outside the brief's list: *Carry on from bar N* (`:1014`), *Start again* (`:1157`), a refused hand tapped (`:1317`), the long-pressed bar (`hearBar`, `:2966`), the summary's *Again*, *Slower*, *Faster* (`:3939`–`:3948`), *Loop the weak bars* (`:4108`).
3. **P2: the device observation U69's row asks for.** Lock the phone mid-run (Keep tempo, with the click on), unlock, press ▶: does the click come back, does ▶ dim for a moment, and does anything play if it did not answer within the bound. Someone holding an Android phone.
4. **P3: keyboard focus while ▶ waits.** Disabling a focused ▶ may drop its focus in some browsers, so a keyboard user may have to Tab back to it after the wait. Not observed here; the wait is at most the bound and only when the audio is not running.

## Questions

1. **A sentence when the bound expires with the sound still off?** Today the run goes on silent and nothing says so. A line such as *No sound yet: tap ▶ again* would need `help.ts` and `04` §5f's words, outside this lane, and the right trigger (`audioEngine.state` still not `running` when the bound fires) is available. Product words, so not built: the owner's or the next brief's.

## Files

- `app/src/ui/screens/ScoreScreen.ts`: `PLAY_SOUND_WAIT_MS`; `playWaiting` and the `startingSound` comment; `openStashedSheet`'s closer and its removal; `togglePlay`, `playNow`, `withSound`, `drawPlayHold`; `render`'s hold; Space's `spaceMayStart` and wait; the disposer's drain.
- `app/tests/unit/scoreSheetsCloseAndPlayStartsSound.test.ts` (new): 13 cases.
- `app/tests/e2e/score.screen.spec.ts`: two describes at the end, three cases.
- `docs/04-ui-spec.md` §5, `docs/01-architecture.md` §4.4, `docs/08-test-map.md` (see Doc rows).
- `docs/prompts/tasks/G86-sheets-close-with-the-screen.md` (the brief, copied unchanged).
- `docs/prompts/pictures/g86/library-after-back-committed.png`, `library-after-back-fixed.png`, `play-busy-fixed.png`.
- `docs/prompts/runs/G86/`: this entry; `checks-for-paths.txt`; `unit-red-committed.txt`, `unit-group-green.txt`, `mutants.txt`, `unit-all-summary.txt` (the 890 KB log summarised), `unit-expectedNote-alone.txt`, `unit-docs-readers.txt`, `unittest-checks-for-paths.txt`; `tsc.txt`, `lint.txt`, `build-app.txt`, `vite-build-committed.txt`; `states.txt`, `states-committed.txt`; `browser-red-committed.txt`, `browser-green-and-pictures.txt`, `pictures-committed.txt`, `e2e-targeted.txt`; `library-after-back-committed.json`, `library-after-back-fixed.json`, `play-busy-fixed.json`; `scripts-playwright.g86-4483.config.ts` (the config copy, run from `app/` as `playwright.g86-4483.config.ts`, moved here after the runs; not for `app/`), `scripts-pictures.spec.ts` (run from `app/build/g86-probe/`), `scripts-mutants.py`, `scripts-run.ps1`.

## Per fix

| Fix | Mechanism | Discriminating test | Red line (committed screen) |
| --- | --- | --- | --- |
| G86 | closers on `openSheets` never read; the sheet on `body` outside what AppShell clears; `isolate` keeps the app root inert | Back from a Library-reached score with a sheet open; unit dispose | `the sheet left over the Library — Expected: 0, Received: 1` (both sheets); unit `a sheet left over the next screen: expected <div class="sheet"…> to be null` |
| U69 | no ▶ branch calls the engine; the first-gesture start is one-shot | a captured context suspended by the page, then ▶; unit with the engine mocked | `the context after ▶ — Expected: "running", Received: "suspended"`; unit `nothing on ▶'s path asked the sound to start: expected "vi.fn()" to be called 1 times, but got 0 times` |

## Tests

Browser runs on port 4483 through the config copy, two workers; nothing on 4173 or 4413–4473. The gallery on its own port 4183, one worker. The whole unit suite ran before the doc edits and before two assertions (Space and *Hear it* in a fresh start's wait) were added to the new file; the new file, the Score group and every unit file that reads the edited docs were run again afterwards, as below. The browser runs used the screen as it stands; only the unit file changed after them.

| Run | Where | Result | Exit |
| --- | --- | --- | --- |
| new unit file, committed screen | `unit-red-committed.txt` | 10 failed, 3 passed (the guards) | 1 |
| new unit file + `scoreMidRunSettings`, `scoreSheetRows`, `scoreTourRoute`, `firstContactOnTheScore` | `unit-group-green.txt` | 5 files, 81 passed | 0 |
| three mutants, new unit file | `mutants.txt` | each red (4, 1, 1 failed) | 1, 1, 1 |
| `npx vitest run` (whole) | `unit-all-summary.txt` | 7,192 passed, 3 failed (load timeout; two CRLF-checkout text claims), 5 skipped, 1 todo | 1 |
| `expectedNote.test.ts` alone | `unit-expectedNote-alone.txt` | 12 passed | 0 |
| the unit files that read the edited docs (`docsConsistency`, `help`, `labHelp`, `progressHistoryLines`, `sightReadingFromReadingState`), after the doc edits | `unit-docs-readers.txt` | 5 files, 44 passed | 0 |
| `python -m unittest tools.content.tests.test_checks_for_paths` | `unittest-checks-for-paths.txt` | 27 passed | 0 |
| `npx tsc -b` | `tsc.txt` | clean | 0 |
| `npm run lint` (config copy moved out) | `lint.txt` | clean | 0 |
| `npm run build:app` | `build-app.txt` | built | 0 |
| `npm run states` | `states.txt` | 60 cells, 2 broken | 1 |
| gallery on the committed screen's dist (`states:only`) | `states-committed.txt` | the same 2 cells, same values | 1 |
| new browser cases, committed screen | `browser-red-committed.txt` | 3 failed | 1 |
| new browser cases and the picture probe, fixed | `browser-green-and-pictures.txt` | 5 passed | 0 |
| the map's 41 specs (each file checked to exist), fixed | `e2e-targeted.txt` | 272 tests: 269 passed, 3 failed (missing `-e2e-win32` screenshot references) | 1 |

Unverified beside what passes: the audio half on a device; anything heard; the screen-reader reading of `aria-busy`; the new-session cancel.

## Doc rows

- `docs/04-ui-spec.md` §5, the stash paragraph (*The controls are moved into the sheet and back…*): **The sheet goes with the screen** (G86): leaving closes an open ⋯ or tempo sheet and gives the page back; why it used to stay.
- `docs/04-ui-spec.md` §5, after *A paused run says so*: **`▶` starts the sound as well as the run** (U69): the branches, Space, the bound and its reason, the dimmed busy ▶, the pause never waiting, why not on visibility change, the MIDI start, *unverified on a device*.
- `docs/01-architecture.md` §4.4: a bullet. The one-shot first-gesture start, a platform suspend published by `watchState`, the taps that start the engine again (`Hear it`, `▶` / `Space`), the bound, nothing on `visibilitychange`.
- `docs/08-test-map.md`: the **Session** row (U69 in *what can go wrong*; the new unit file and the browser case in *proved by*, not a phone); a new row, **The Score screen's own sheets on leaving** (G86); the unit file list (`scoreSheetsCloseAndPlayStartsSound.test.ts`); the `score.screen.spec.ts` entry (G86 and U69 cases).
