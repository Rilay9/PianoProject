### Entry 172 — U105 — every tap that can start the sound asks for it through `withSound`, and a refused tap changes nothing and names its control; a piano key with the sound suspended refuses at once and says to tap ▶; a key on the screen asks, and is never fed back-dated (backlog U105, P2; G86a's follow-up; app only) (2026-09-30)

Base: `8f51d473` (origin's head at dispatch). `app/` is identical between the brief's `034d4039` and it, so the brief's line numbers held. Worktree `agent-a8afa8b653d73a23a`. The brief on this base has no *Reviewer's approval* section; the reviewer's approval as the dispatch quoted it (`responses/questions-bd7d303e.md`) governs, including its required correction on the keys. Source changed: `ScoreScreen.ts`, and `help.ts`'s `soundOff` (its parameter and its comment only). Browser runs on port 4773 through config copies under the worktree's `app/build/u105/` (gallery on 4783); nothing ran on 4173. Nothing committed, staged, stashed, reset or checked out.

## Judgement

**The refused summary at 342 × 740 (`pictures/u105/refused-summary-fixed.png`). *Unverified on a device*: no phone was used, nothing was heard, and this Chromium starts and resumes contexts without a gesture. *Unverified as copy*: the sentences are a judgement.**

- **After (observed).** A Keep tempo run to its summary, the context suspended by the page and its `resume` stubbed never to answer, then *Again*. After the bound the summary is still up, nothing runs, ▶ reads ▶, and the header's state line, above the sheet in the accent colour, reads *Sound did not start — tap Again*, whole (no overflow on the line in this browser). *Again* is one of the sheet's buttons in view, and it carries `data-sound-refused`. With the stub removed, the next *Again* starts the run and the sentence goes (the browser case).
- **Before (committed screen, same probe, `refused-summary-committed.png`).** *Again* closed the summary and started a run with the context still suspended: the count-in digits on the page, ▶ reading ⏸, the chrome folded. A run nobody could hear.
- **Sideways (740 × 342), a gap: `refused-summary-sideways-fixed.png`.** Sideways the header is not drawn and the line is mirrored into the bar, which the summary sheet covers. The probe read the sentence on `#score-status-side` inside the bar's box and the sheet's box over it. So a refused summary tap sideways shows nothing: the tap looks dead, where before it started a silent run. No surface built (the brief's rule, and `style.css` is U63's). **Question 1.**

**What each tap does refused, and which layer observed it.** Every row: nothing starts, the line names the control, the control is marked, ▶ reads ▶ and stays enabled.

| Tap | A refusal leaves | The line says | Layer |
|---|---|---|---|
| *Carry on from bar N* | the offer on screen, its stored record, no loop | *Sound did not start — tap Carry on again* | unit |
| *Start again* (⋯) | a demonstration playing goes on | *Sound did not start — tap Start again* | unit |
| a hand after *Nothing for the … hand* | the hand as it was, the refusal line | *Sound did not start — tap L again* (R, Both) | unit |
| a bar held down | no loop, no *Bar N, as written* | *Sound did not start — hold bar N again* | unit |
| *Try again* (a session's transition) | the summary up | *Sound did not start — tap Try again* | unit |
| summary *Again* | the summary up | *Sound did not start — tap Again* | unit, browser |
| summary *Slower* / *Faster* | the tempo unmoved (a retry moves it once) | *… tap Slower again* / *… tap Faster again* | unit |
| summary *Loop the weak bars* | no loop, the summary up | *Sound did not start — tap Loop again* | unit |
| a piano key (sound suspended) | no run, nothing asked, the note not kept | *Sound did not start — tap ▶* | unit |
| a key on the screen (start fails or never answers) | no run | *Sound did not start — tap ▶* | unit |

Each row, three ways in the unit layer: the start never answers (fake timers to the bound), it fails, it answers running (the handler runs once, as before). All thirteen sentences `soundOff` can now say fit whole on the line at 342 px in this browser (`probe-refused-summary-fixed.json`, `fitsOnTheLine`: scroll width equal to client width for each; the longest is *Carry on*'s, 40 characters).

**The keys: the reviewer's correction, as built.** *A piano key*: with the sound running (or no Web Audio) it starts the run and is its first note, at once, exactly as before. With the sound suspended it calls nothing (`ensureStarted` not called), starts nothing, keeps nothing, and the line says *Sound did not start — tap ▶* with ▶ marked; ▶ then asks and starts the run without that note. *A key on the screen*: running, as before. Suspended, it asks through `withSound` in its own event. Where the answer comes, the run starts; the key is **not** fed, because its time is from before the run began, and a Keep tempo run holding for its first note takes its clock from that note. The run then waits for the first note, as after ▶; the next key is fed with its own time. The mechanism: the act knows whether it runs inside the key's own event (`inTheKeysMoment`). No timestamp is compared or rewritten. Failed or never answered: no run. **Inferred, not observed:** in the HTML spec a touch's `pointerdown` is not itself an activation-triggering event (its `pointerup` is), and the strip starts a note on `pointerdown`. Whether Android honours `ensureStarted` there is platform behaviour, as with the long-press's timer. The gate reads the engine at the end, so the screen says what happened either way.

**The sentence for the keys names ▶ without *again***: *Sound did not start — tap ▶*. The reviewer's own words, and ▶ was not what the learner used. Brief item 5's rule (the sentence names ▶) holds for both keys. **Read back before landing.**

**The standing refusal (item 6), one rule.** `startRun` lets a standing refusal go exactly when the run it starts makes ▶ read ⏸ (`playReadsPause`, the same predicate `render` draws the glyph from). A restart held paused, or a demonstration, keeps it, still true, with ▶ reading ▶. So a sentence naming ▶ never stands with ⏸. **One case outside the rule, pre-existing, read in the code and exercised in the unit layer:** *Hear it* (G86a), or *Start again*, tapped over a run already playing on a sound the platform suspended while the page stayed visible, is refused with its own sentence while ▶ reads ⏸. That sentence names a control that still does what it says, so it does not contradict the glyph. Follow-up 2.

Pedagogical: not applicable. Nothing taught, judged or recorded changes. *Unverified as music*: nothing was heard.

## Done

1. **Closes U105 (item 1).** Every tap in the brief's table goes through the gate; the phone check stays *unverified on a device*; *a disabled ▶ may lose keyboard focus* stays recorded (`entry-165.md` Follow-up 5), not observed here.
2. **Hypothesis and refuting test (item 2). The premise holds.** Each tap called `startRun` directly. On the base, with the engine `suspended` and `ensureStarted` never settling, every row started a run at once. Red lines (`unit-red-base.txt`): *a run started against a sound that had not started: expected "vi.fn()" to be called +0 times, but got 1 times*; *a start that failed started a run: … 1 times, but got 2 times*; *the tap did not ask the sound to start: expected "vi.fn()" to be called 1 times, but got 0 times*. No tap in the table already routed through `withSound`, and each can begin audible playback; none dropped.
3. **One gate, every tap (item 3).** `ScoreScreen.ts`: each handler's whole body is `withSound`'s act. `Carry on` (re-checks that the offer still stands); `Start again`; the hand (`chooseHand`, gated only after a refusal with no run; the no-op re-press stays outside); `hearBar` → `hearBarNow` (asks only where the preview would play); *Try again*, *Again*, *Slower*, *Faster*, *Loop the weak bars* through `fromTheSummary`, which re-checks that the summary is still up with no sheet over it. `withSound`'s `tap` is a `SoundTap` (the control's id, its name, `verb`, `again`). Only `PLAY_TAP` sets `playWaiting`, so there is no new busy display, and a second tap in the wait does nothing (`startingSound`). `markRefused` puts `data-sound-refused` on the tapped control by id and takes it off everything else. It is called from `drawPlayHold` and after `drawResume`, which redraws the offer on every render.
4. **The sentence names the control (item 4).** `help.ts` gains no sentence. `soundOff(control, { verb?, again? })`: *again* is dropped for a label ending in *again*, `verb: 'hold'` covers the long-press, `again: false` covers the keys. The two G86a outputs are byte-identical, asserted literally (*G86a's two sentences are unchanged, byte for byte*) and by G86a's browser case. Short names: *Carry on*, *Slower*, *Faster*, *Loop* (the full *Loop the weak bars … again* is 50 characters). The bar is named by its printed number, as *Bar N, as written* names it.
5. **`startFromKey` (item 5)**, split as the reviewer required: see the Judgement. `keyMayStart()` holds T8's conditions and is re-checked in the act. A piano key in another tap's wait adds nothing.
6. **The standing refusal (item 6):** see the Judgement. Tested by *a start that makes ▶ read ⏸ lets the standing refusal go* (red on the base: *the refusal stood over a run that plays*) and *a restart held paused keeps it* (preserve; green on both).
7. **Deviations (item 7)** as the brief lists them: *Try again* gated in the Score screen's `tryAgain` closure, `sessionRunner.ts` untouched; the on-screen keys decided separately (the reviewer); the long-press's timer ask recorded as inferred. The builder's own are under *Deviations* below.

*Technical:* 60 cases in the unit file (35 new, 25 preserved unchanged), one browser case added, four mutants killed. *Pedagogical:* not applicable.

## Deviations, with reasons

- **The item-6 clear keys on ▶ reading ⏸, not only "a run not held paused".** The brief's own reason for keeping the refusal on a paused start (*still true; ▶ reads ▶*) applies equally to a demonstration, so a restarted demonstration keeps it.
- **The keys' sentence drops *again*** (the reviewer's wording): see the Judgement.
- **`data-sound-refused` is applied by id** (`markRefused`), because the offer's button is redrawn on every render and *Start again* can sit in a sheet on `body`.
- **The base dist for the red run was built with `vite build` alone.** `npm run build:app` runs `tsc -b`, which rejects the new tests against the base's narrower `soundOff` type; the base source compiled unchanged.
- **The gallery ran through a config copy on 4783** with `reuseExistingServer: false`, not `npm run states` on 4183: the stock config reuses any server on 4183, which on a shared machine can be another builder's dist. It served this worktree's fixed dist (built by `npm run build:app`, exit 0).

## Not done

- **The whole unit suite green:** 4 of 7,404 failed in the suite run (`unit-all-summary.txt`). The two `lessonClaimsAboutApp` CRLF claims (blues.3, 4.7) fail alone too. blues.3's text holds on the LF form of the changed `ScoreScreen.ts` (checked), the form git commits. `expectedNote` (a 5 s timeout) and `simonTurnCue` (a timing assertion) passed alone (`unit-failed-alone.txt`: 303 passed, only the CRLF pair red): load.
- **The map's 47 specs green in one run:** 332 passed, 4 failed. Three are `score.layout.spec.ts`'s landscape screenshots, which found no gitignored `-win32.png` reference in a fresh worktree and wrote one (deleted). The fourth, `wide.spec.ts`:582, spent its 30 s timeout before its first step, and its file passed whole alone (11 passed): load. `score.latch.spec.ts` (T8's key starts), `score.hearbar.spec.ts` (the long-press) and `score.states.spec.ts` (a hand the refusal named starts the run) passed in the run.
- **The state gallery green:** 2 of 60 cells broken, the same two, with the same readings, as G86a's record. No cell shows a refusal; no CSS changed.
- **The refusal sideways, with the summary up:** not visible (Question 1). Nothing built.
- **Carry on, Start again, the hands, the long-press, Try again, Slower, Faster, Loop and both keys in a real browser:** unit only. The brief asks one browser case, on *Again*.
- **A tablet width with the summary up:** not probed.
- **The device check:** no device here.

## Follow-ups (recorded, not fixed)

1. **P2, observed:** sideways, a refused summary tap shows no sentence (Question 1).
2. **P3, read in the code, unit-exercised:** *Hear it* or *Start again* refused over a run already playing silent (the platform suspended the sound with the page visible) shows its sentence with ▶ reading ⏸. That is true and names a working control, and is G86a's state for *Hear it*. It is unclassified whether it misleads.
3. **P3, read in the code, not observed:** under the summary the head is `inert`, and `#score-waiting` with it. An inert subtree is out of the accessibility tree, so a screen reader is unlikely to announce the refusal sentence while the sheet is up. `summaryUp` and `helpStrip` are unchanged here.
4. **P3, read in the code:** the ready line with a piano connected invites a key (*T8*). With the sound suspended, that key is now refused with *tap ▶*. The line and the refusal agree once read, and nothing was changed.

## Questions

1. **The sideways summary** (`pictures/u105/refused-summary-sideways-fixed.png`, `probe-refused-summary-sideways-fixed.json`): the sheet covers the bar where the line is mirrored. Is a visible cue there wanted, for example the mirrored line or the refused control's mark drawn above the sheet (a `style.css` rule, U63's file), or is the upright line enough? Nothing was built.
2. **The keys' sentence** *Sound did not start — tap ▶* (no *again*): confirm it, or say if it should read as G86a's ▶ sentence.

## Files

- `app/src/ui/screens/ScoreScreen.ts`: `SoundTap` and the tap constants; `PLAY_SOUND_WAIT_MS`'s and `startingSound`'s comments; `soundRefusedBy`'s type; *Carry on* and `drawResume`'s mark; *Start again*; the hands and `chooseHand`; `keyMayStart` and `startFromKey` with the key decision; `startRun`'s clear and `playReadsPause`; `toggleHear`'s tap; `withSound`'s tap and comment; `drawPlayHold`, `markRefused`, `refusedNow`; `hearBar` / `hearBarNow`; `tryAgain`; the summary's four through `fromTheSummary`; `soundOffLine`; `render`'s glyph through `playReadsPause`.
- `app/src/ui/help.ts`: `STATE_TEXT.soundOff`'s parameter and comment.
- `app/tests/unit/scoreSheetsCloseAndPlayStartsSound.test.ts`: header; the session double (feeds, finish handler, a loop, hands without notes, a paused start); the transition mock; the U105 table, the keys and the rule.
- `app/tests/unit/help.test.ts`: the join, ten U105 sentences.
- `app/tests/e2e/score.screen.spec.ts`: U105's case in U69's describe.
- `docs/04-ui-spec.md`, `docs/01-architecture.md`, `docs/08-test-map.md`: `

**Orchestrator's note at the landing (2026-09-29).** U105's worktree committed by name (f51e8010) and merged (265e319c). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/U105/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 1; e2e-targeted 1; e2e-rerun 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner — the targeted specs' failures passed alone (`e2e-rerun`); the note names them — the spec-existence step read an empty list because the map names the whole suite, and said so; `runs/U105/orchestrator-exit.txt`). Your ruling that U105 is real (`responses/970fd770.md`, `responses/d5508d7b.md`) and your approval of the brief with the piano-key correction (`responses/questions-bd7d303e.md`). Landed in one chain with G96 and U63 (the reviewer's batching note allowing it; merge range df275e8f..265e319c): map, typecheck, lint, the whole unit suite (only the known CRLF pair red), the app build, then the whole default browser suite because U63 touched style.css (the map names every spec; specs-exist's 'no specs named' is the guard misreading an empty list): 851 passed, 5 failed, of which four passed alone (mic, modes-play-the-tune, score.fill, wide: load) and one was U63's own waiting-for-reads case, fixed forward at 7a4e5605 after L120c, then today.spec.ts 21 of 21 alone on the merged main checkout.

## Doc rows`.
- `docs/prompts/pictures/u105/`: `refused-summary-{committed,fixed}.png`, `refused-summary-sideways-{committed,fixed}.png`.
- `docs/prompts/runs/U105/`: this entry and the run files named below; scripts not for `app/`: `scripts-playwright.u105-4773.config.ts` and `scripts-playwright.states-4783.config.ts` (run from `app/build/u105/`), `scripts-pictures.spec.ts` (from `app/build/u105/probe/`), `scripts-mutants.py`, `scripts-run-e2e.sh`.
- **Setup and cleanup.** `npm ci`, `parity_reference.py` and the content build (exit 0 each), with `build/cache`, `build/midi-real`, the three `build/*-cache.json` and `content/scores/imported/{kern,musetrainer,mutopia}` copied read-only from the main checkout. The build rewrote `SOURCES.md`, `inventory.md` and `rung-claims.md`; all three were restored from a snapshot taken first, and `git status` shows none of them. Deleted at the end: `app/node_modules`, `app/dist`, `app/test-results`, the config copies under `app/build/u105/`, the copied caches, the gallery and `wide` output, the three written `-win32.png` references, and the whole-suite log (about 890 KB; its summary is kept).

## Tests

| Test | Class | Old assumption |
|---|---|---|
| U105 table: 9 taps × (never answers, fails, answers running) | add | a tap other than ▶, Space or *Hear it* starts a run whatever the sound |
| piano key running / key on the screen running | add (preserve T8) | — |
| piano key suspended; key on the screen suspended then started; never answers or fails | add | a key starts a run whatever the sound, fed at its own time |
| a start that makes ▶ read ⏸ lets the refusal go / a restart held paused keeps it | add / add (preserve) | `startRun` never touched the refusal |
| G86a's two sentences byte for byte | add (preserve) | — |
| G86, U69, G86a cases (25) | preserve, unchanged (the session double gained `feed`, a finish handler, a loop for any bars, hands without notes and a paused start; none of the 25 reaches those, and all 25 pass on the base and after) | — |
| `help.test.ts` join | extend | — |
| `score.screen.spec.ts` U105 *Again* case | add | *Again* starts at once |

| Run | Where | Result | Exit |
|---|---|---|---|
| extended unit file, base | `unit-red-base.txt` | 31 failed, 28 passed (59; the byte-identity case added after) | 1 |
| extended unit file, fixed | `unit-green.txt` | 60 passed | 0 |
| four mutants | `mutants.txt` | 3, 2, 1, 1 failed, each killed | 1 ×4 |
| help join, base §5f / fixed | `help-join-red-base-spec.txt` / `help-join-green.txt` | 1 failed / 13 passed | 1 / 0 |
| unit group (4 files) | `unit-group.txt` | 123 passed | 0 |
| `npx vitest run` | `unit-all-summary.txt` | 7,394 passed, 4 failed (2 CRLF, 2 load), 5 skipped, 1 todo | 1 |
| the 3 failed files alone | `unit-failed-alone.txt` | 303 passed, 2 failed (CRLF) | 1 |
| `npx tsc -b --noEmit` / `npm run lint` | `tsc.txt` / `lint.txt` | clean / clean | 0 / 0 |
| `npm run build:app` | `build-app.txt` | built | 0 |
| browser case, base / U69 describe fixed | `browser-red-base.txt` / `browser-green.txt` | 1 failed / 3 passed | 1 / 0 |
| picture probe, base / fixed | `pictures-committed.txt` / `pictures-fixed.txt` | 2 passed each | 0 / 0 |
| `python tools/docs/checks_for_paths.py` (9 paths) | `checks-for-paths.txt` | 47 specs named, all present | 0 |
| state gallery, config copy on 4783, fixed dist | `states.txt` | 60 cells, 2 broken: `theme--light` (contrast 4.3:1 on `#score-waiting`, `#score-help-more`) and `rotation--bars1-real-phone` (§9.35), the same two with the same readings as `runs/G86a/states.txt`; no cell shows a refusal | 1 |
| the map's 47 specs, two workers, 4773 | `e2e-targeted-summary.txt` | 332 passed, 4 failed: `score.layout.spec.ts`'s three landscape screenshots (no gitignored `-win32.png` reference in a fresh worktree; the written files deleted) and `wide.spec.ts`:582 (the 30 s test timeout spent before its first step) | 1 |
| `wide.spec.ts` alone | `e2e-wide-alone.txt` | 11 passed: load | 0 |

## Doc rows

Written directly into today's text, as G86a's stood (`970fd770.md`:15):

- **`docs/04-ui-spec.md` §5** (the U69/G86a paragraph, :2015–2035 on the base): its sentence *A key on a connected piano … does not ask* removed; a new paragraph after it, **Every tap that can start the sound goes through that gate** (U105): the ten taps, what a refusal leaves, the long-press's timer ask as inferred, the piano key (as before when running; refused at once, nothing asked, *tap ▶*, when suspended), the screen key (asks; started late, not fed), the standing-refusal rule, and the sideways gap as the Question.
- **`docs/04-ui-spec.md` §5f**: the order sentence (:3144 on the base) now reads *a tap (or key) whose sound did not start (G86a, U105)*; the G86a bullet (:3168–3174) gains the U105 sentences, each printed whole (`help.test.ts`'s join holds them), the *again* and short-name rules, the keys' *tap ▶*, and the mark.
- **`docs/01-architecture.md`** §4.4 (:235–237 on the base): every other tap through the same gate with its whole action; the piano key refuses at once without `ensureStarted()`; the screen key asks and is not fed when answered after its own moment.
- **`docs/08-test-map.md`**: `score.screen.spec.ts` (:347) gains the U105 *Again* case; `scoreSheetsCloseAndPlayStartsSound.test.ts` (:596) gains the U105 table, the keys and the rule. No new spec file; `checks.json` untouched (`score.screen.spec.ts` is already mapped under `app/src/ui/screens/ScoreScreen.*`).
