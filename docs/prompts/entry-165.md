### Entry 165 — G86a — a tap that could not start the sound says so and starts nothing: where ▶'s (or Space's) wait ends with the audio still not running, no run starts or carries on and *Hear it* is not ended, ▶ reads ▶ again, the state line says *Sound did not start — tap ▶ again*, and the next tap asks the engine again; `Hear it`'s own wait goes through the same bounded gate, so a start there that never answers no longer leaves ▶ dead (the G86 review's required change, `responses/970fd770.md`:30–47, and the reviewer's word folding in *Hear it*, `responses/questions-ecccffb7.md`; app only) (2026-09-29)

Base: `6cf1daff` (origin's head at dispatch, holding G86 and this brief with the *Hear it* gate folded in). `app/src` is unchanged between the brief's `c5988012` and it (only `app/tests/unit/transferOffer.test.ts` differs), so the brief's line numbers held. One source file changed (`ScoreScreen.ts`), plus one entry in `help.ts`.

**Judgement — the refused state at 342 × 740. *Unverified on a device*: no phone was used and nothing was heard; this Chromium starts and resumes contexts without a gesture (`score.hearIt.spec.ts`:17–22), so Android's lock-screen suspend and its tap rule are not observed. *Unverified as copy*: the sentence's words are a judgement, not a measurement.**

- **After (observed, `pictures/g86a/refused-fresh-fixed.png`; the context's `resume` stubbed never to answer, as G86's probe did):** ▶ dims for up to the bound, then reads ▶ again, enabled, not busy. Nothing moves and no count-in runs. The header's state line, in the accent colour, reads *Sound did not start — tap ▶ again*, whole: the probe read no overflow on the line in this browser at this width. Upright the sentence is the header's second line, over the notation, and ▶ is the first control on the bar at the bottom left, with the stage between them. The sentence names ▶ by the glyph the button wears, and no other ▶ is on the screen, which is how *Paused — ▶ to carry on* already works. On a paused run (`refused-paused-fixed.png`) the same sentence stands over the dimmed notation. Three seconds into the pause the chrome folds, as in any pause, and the sentence is then in the stage's corner beside the bar count, *bar 1 / 4 · Sound did not start — tap ▶ again* (`refused-paused-folded-fixed.png`), with ▶ one tap on the stage away. Sideways (740 × 342, `refused-sideways-fixed.png`) it sits at the bar's left end, immediately before ▶.
- **Before (committed screen, the same probe, observed, `refused-fresh-committed.png`, `refused-paused-committed.png`):** after the bound ▶ read ⏸, the run started (the count-in digits on the page) or the paused run carried on, the state line read the mode's standing line *The count-in clicks, then play along.*, and the context was still `suspended`: a run nobody could hear.
- **Does the learner connect the sentence with the button?** Judged from the pictures: yes, through the glyph, as with the paused line; sideways they are side by side. No new element was built, and this is not a Question.

**What ▶ now does, and which layer observed it.**

- **A start that never answers:** refused at the bound. Observed in the unit layer (a paused run, a fresh start, Space's start, ▶ over *Hear it*) and in the browser (a fresh start: no run, ▶ at rest, the sentence; then with the stub removed, the next ▶ brings the context to `running` and the run starts).
- **A start that fails** (`ensureStarted` rejects): refused at once, with the sentence. Unit only.
- **A start that answers with the context still not running:** refused, with the sentence. Unit only.
- **A start that answers after the bound refused:** nothing starts by itself, ▶ stays ▶, and the sentence goes (the paused line comes back). Unit only. The same where the sound comes on some other way while the sentence stands.
- **Where the sound is running, or there is no Web Audio:** at once, as before. Unit.

**`Hear it` (the reviewer's ruling: folded in).** It goes through the same gate: bounded, a refusal starts no demonstration and says *Sound did not start — tap Hear it again*, the shared flags clear, the next tap asks, and a late answer clears the sentence without starting the demonstration. With no Web Audio it still plays at once, silent. The deadlock is confirmed on the committed screen by a unit probe (`probe-hear-it-deadlock.test.ts`, green there): twenty minutes of fake time after a `Hear it` start that never answers, ▶, Space and `Hear it` each did nothing and asked nothing. After the fix the probe is red (*a later tap asked the engine: expected 1 times, got 2*), as it should be. Unit only; no browser case drives `Hear it`'s refusal.

Pedagogical: not applicable. Nothing taught or judged changes. The sentence's wording is a copy judgement, *unverified as copy*. *Unverified as music*: nothing was heard.

## Done

1. **The ruling (item 1)** is met in the brief's own words: ▶ never says a run is playing when nothing can be heard. Where the sound could not be started, the learner is told so at once, in one line, and the control that failed is the one that asks again.
2. **The mechanism, tested (item 2). The premise holds.** `withSound`'s `go` ran `act()` however the wait settled, and `.catch(() => undefined)` turned a failure into an answer. The adversary on the committed screen: *the run carried on against a sound that had not started: expected "vi.fn()" to not be called at all, but actually been called 1 times* (`unit-red-committed.txt`). The alternative, a path that already refused, is refuted by that result.
3. **The rule, one check where the wait settles (item 3).** `ScoreScreen.ts` `withSound` (:2859). Whichever comes first of the bound, the start answering and the start failing (`ensureStarted().then(settle, settle)`), `settle` clears `startingSound` and `playWaiting`. It then runs `act` only where `audioEngine.state === 'running'`. Otherwise it records `soundRefusedBy` (:444) and calls `render()`. So nothing starts, carries on or ends: no `startRun`, no `session.resume()`, no `endDemonstration`, no stop, no navigation. ▶'s glyph and label come from `render` (not playing, so ▶ / *Play*), and `drawPlayHold` (:2904) clears `disabled`, `aria-busy` and `data-starting-sound` and marks the refused control with `data-sound-refused="true"`. Nothing records the engine as unavailable: every tap clears the old refusal and asks inside itself. Unchanged: no Web Audio acts at once, the pause never waits, a second tap in the wait does nothing, and leaving or a new session cancels. Where the state reads `running` and nothing can be heard, or the reverse, was not found. The check reads the engine's state because the three failures share it (`AudioEngine.state` reads anything but a running context as `suspended`).
   - **The late answer:** through `audioEngine.onStateChange` (:493, `stopWatchingSound`). When the state becomes `running` with a refusal standing, it clears the refusal and redraws; it never calls `act`. It is unsubscribed in the disposer directly, not through `unsubscribers`, which `attachInput` empties. `soundOffLine` and the mark also read the engine (`refusedNow`, :2921), so a line that has stopped being true is never drawn.
4. **The sentence (item 4).** `STATE_TEXT.soundOff` in `help.ts`:495 (text below). It is first in `drawWaitingFor`'s order (:4210), ahead of the paused line, the first-note line and *Playing it to you*. It is on `#score-waiting`, the help strip's polite live region, and mirrored sideways and into the corner by the mirror's own rule. It is not on `#score-status`, and no new element was added. `04` §5f's order sentence gains it at its head, a bullet prints both sentences, and `help.test.ts`'s join lists both.

   > `soundOff: (control: '▶' | 'Hear it'): string => \`Sound did not start — tap ${control} again\``
   >
   > *Sound did not start — tap ▶ again* (after ▶ or Space) · *Sound did not start — tap Hear it again* (after `Hear it`). **Unverified as copy.**

   **A deviation, and why:** the brief asked for one sentence naming ▶. With *Hear it* folded in, *tap ▶ again* after a refused `Hear it` would start a run the learner did not ask for, not the demonstration. So the sentence names the control whose tap asks again. The shape is the reviewer's: what happened, then what to do. *Did not start* rather than *is off*, because *Sound is off* reads as a setting to go and find, and the line is about this tap, not a verdict that the phone has no sound (the ruling: *do not turn a one-second timeout into proof that audio is unavailable forever*). The ▶ sentence showed whole at 342 px in this browser. The `Hear it` sentence is 39 characters to the ▶ one's 33, inside §5f's forty-odd, but it was not rendered in a browser.
5. **Red first, unit (item 5).** `scoreSheetsCloseAndPlayStartsSound.test.ts`, a new block of 14 cases: (a) the adversary; (b) a fresh start, and Space's start; (c) ▶ over *Hear it*; (d) a failing start; (e) an answer with the state still suspended; (f) the late answer, and the sound coming on some other way; (g) the sideways mirror and the corner; plus *Hear it*'s five cases below (item 7). 12 of 14 are red on the committed screen. The two that pass on both, as they should, are *Hear it* whose start answers running and *Hear it* with no Web Audio. Replaced, with the reason in the file: U69's *never answers … then the run carries on* (→ (a)) and *a start that fails still carries the run on* (→ (d)), class replace. **The double corrected:** by default `ensureStarted` now moves `state` to `running` and publishes it before it resolves, as the real engine does. Every preserved case passes on the committed screen with the corrected double, so they still assert what they asserted. The header comment is rewritten. **Mutants** (`mutants.txt`), all killed: the state check removed, 12 cases red; the sentence not set, 12 red; the waiting flags left set on a refusal, 9 red.
6. **Browser (item 6).** `score.screen.spec.ts`, U69's describe, a second case built on the first's captured context. The ordinary tap spends the first-gesture start, then the page suspends the context and stubs its `resume` never to answer, and ▶ is pressed. The sentence on `#score-waiting` is polled for up to 10 s, with no fixed sleep. After it: `data-running` is not `true`, `#score-play` reads ▶, enabled, with no `aria-busy`, it carries `data-sound-refused`, and the context is still `suspended`. Then the own `resume` is removed (`Reflect.deleteProperty`) and ▶ is pressed again: the context is `running`, `data-running` is `true`, and the sentence and the mark are gone. Red on the committed screen (`browser-red-committed.txt`), green after (`browser-green.txt`, with U69's first case). The picture probe is described in the judgement; its measurements are `probe-out-*.json`.
7. **`Hear it` folded in (item 7).** `toggleHear` (:2510) stops at once while hearing (a stop needs no sound), and otherwise calls `withSound(toggleHearNow, 'hear')`. The unbounded U67 wait and its own `startingSound` handling are gone. Red first: *Hear it with a start that never answers*. On the committed screen it failed three ways, the missing sentence, the missing mark and *▶ left dead behind Hear it's wait: expected "vi.fn()" to be called 2 times, but got 1 times*; it is green after. Added: *Hear it* whose start answers running begins; fails then answers suspended, no demonstration either time, with the sentence; answered after the bound, the sentence goes and no demonstration starts by itself; no Web Audio plays at once. U67's comment and `04` §5's `Hear it` paragraph say it. The six U105 controls are not touched.
8. **Not G86a's (item 8)**, each recorded under Follow-ups: the six U105 taps and `startFromKey`; the device check. Brief item 8's `toggleHear` line and its Question are superseded by item 7, the reviewer's word. `AudioEngine.ts`, `main.ts`, `helpStrip.ts`, `widgets.ts`, `style.css`, `ScoreScreen.css`, every other screen, `tools/**` and `content/**` are untouched.

*Technical:* 25 cases in the unit file (14 new, 2 of U69's replaced by them), 2 browser cases in U69's describe, 3 mutants killed, and the probe confirmed then refuted by the fix. *Pedagogical:* not applicable.

## Not done

- **The whole unit suite green:** 6 of 7,315 failed in the suite run (`unit-all-summary.txt`). Two are `lessonClaimsAboutApp.test.ts`'s CRLF claims (blues.3 reads `ScoreScreen.ts`, 4.7 reads `style.css`). Both fail alone too. The blues.3 text holds on the LF form of the changed file (checked), the form git commits and CI checks out: Entry 101's diagnosis. Four others passed when run alone (`unit-failed-alone.txt`: 323 passed, only the two CRLF claims red): `expectedNote` and `unmeasuredConceptsSaySo` (5 s timeouts), `simonTurnCue` (a timing assertion), and `firstContactOnTheScore` (*Play it to me writes one hearing*, a 1 s `waitFor`). They are load in a fully parallel suite. `firstContactOnTheScore` runs on the real engine, which is unsupported in jsdom, so its `Hear it` goes through the at-once path this change leaves as it was; it also passed in the targeted group.
- **The state gallery green:** `npm run states` broke 2 of 60 cells (`states.txt`): `theme--light` (contrast on `#score-waiting` and `#score-help-more`) and `rotation--bars1-real-phone` (§9.35). They are the same two cells, with the same readings, that G86's record shows on the committed screen (`runs/G86/states-committed.txt`), and that U82's record shows. The comparison is against those records; no committed dist was photographed here. No gallery cell shows a refusal, and this change touches no CSS.
- **The map's 47 specs green:** 331 passed, 4 failed (`e2e-targeted-summary.txt`). Three are `score.layout.spec.ts`'s landscape screenshots, which found no gitignored `-win32.png` reference in a fresh worktree and wrote one; the written files were deleted. The fourth is `projects.spec.ts`:110. It read the sessions count right after the summary showed, and got a row written a moment later (*Expected: 0, Received: 1* at :130). The spec file passed whole on its own on the same dist (`e2e-projects-alone.txt`, 7 passed), so this is load, not this change. Its run had started and finished through ▶ both times. Follow-up 6.
- **Failure, late answer and answered-suspended in a real browser:** unit only. The browser case drives the never-answering start alone, as the brief asks.
- **`Hear it`'s refusal in a real browser:** unit only.
- **The device check:** not done, no device here. Follow-up 2.

## Follow-ups (recorded, not fixed)

1. **U105, unchanged in scope:** the six on-screen taps that start a run without the gate (*Carry on*, *Start again*, a refused hand, `hearBar`, the summary's *Again / Slower / Faster*, *Loop the weak bars*), and `startFromKey`, a MIDI key, which is not a user activation. U105's question, the sentence, is answered here, and the six can pass `withSound(act, 'play')` and inherit it. One interaction to carry into that lane, read in the code and not exercised: while a refusal's sentence stands, a run started by one of those paths keeps the sentence, which stays true about the sound. But ▶ then reads ⏸, so *tap ▶ again* first pauses, and the second tap asks.
2. **The device check** (U69's, now with G86a's words): lock the phone mid-run and press ▶. Does ▶ dim briefly and the click come back, or, if the audio will not start, does the sentence appear with the run still paused? The same for `Hear it`. Someone holding an Android phone.
3. **P3, adjacent, read in the code, not observed:** `attachInput` (called at load when the input is MIDI or the on-screen keys) empties `unsubscribers` through `detachInput`. That list also holds the sideways mirror's `disconnect` (`ScoreScreen.ts`:1130) and the resize removers for `fitBarControls` and `applyModeLabels` (:1309–1310). So the first input attach disconnects the mirror's observer and removes the mode-label resize listener. `render` re-syncs the mirror and re-fits the bar on every resize, so the visible effect is at most the mode selector's short and long labels not following a width change after load. The anonymous `resize → render` listener (:1306) is never removed. Unclassified whether any learner sees it. This is why `stopWatchingSound` is not on that list.
4. **P3, pre-existing, observed in both pictures:** on a run paused during its count-in, the count-in digits stay on the dimmed page (`refused-paused-committed.png` and `-fixed.png` alike). Folded, the corner line overlaps the top staff's fingering numbers (`refused-paused-folded-fixed.png`), as any long run line would. Neither is this change's; whether either reads as a fault is for the next Score-screen pass.
5. **Keyboard focus while ▶ waits** (from U105): unchanged, not observed.
6. **P3, test timing:** `projects.spec.ts`:113 reads `sessionsBefore` as soon as the summary is visible. The run's record can land after that under load, which is what failed once in the suite run. The fix is to wait on the stored row before counting, not a sleep. The test's file, not this lane's.

## Questions

None. The sentence's naming of the tapped control is a deviation recorded under Done 4, not a question; the reviewer may overrule the words.

## Files

- `app/src/ui/screens/ScoreScreen.ts`: `PLAY_SOUND_WAIT_MS`'s comment; the `startingSound` comment; `soundRefusedBy`; `stopWatchingSound` (the late answer); `toggleHear` through the gate; `withSound` (one check where the wait settles) and its comment; `drawPlayHold` (the refused mark); `refusedNow`; `drawWaitingFor`'s order; `soundOffLine`; `render`'s hold comment; the Space start's comment; the disposer's unsubscribe.
- `app/src/ui/help.ts`: `STATE_TEXT.soundOff`.
- `app/tests/unit/scoreSheetsCloseAndPlayStartsSound.test.ts`: the header; the engine double (listeners, the corrected default start); helpers; two U69 cases replaced; the G86a block.
- `app/tests/unit/help.test.ts`: the join, the two sentences.
- `app/tests/e2e/score.screen.spec.ts`: the G86a case in U69's describe.
- `docs/04-ui-spec.md`, `docs/01-architecture.md`, `docs/08-test-map.md`: see `

**Orchestrator's note at the landing (2026-09-29).** G86a's worktree committed by name (d5508d7b) and merged (4afc3ac0). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/G86a/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/G86a/orchestrator-exit.txt`). Your one required change on G86 (`responses/970fd770.md`) and your approval of the brief with *Hear it* folded in (`responses/questions-ecccffb7.md`). Landed in one chain with U102 (Entry 162), the reviewer's batching note allowing it: the chain's merge range 2da6b8ef..a0a8039b covers both merges, its minimum the union of both merges' map rows; the whole unit suite showed only the known CRLF pair; 459 browser cases passed over the union.

## Doc rows`.
- `docs/prompts/pictures/g86a/`: `refused-fresh-{committed,fixed}.png`, `refused-paused-{committed,fixed}.png`, `refused-paused-folded-{committed,fixed}.png`, `refused-sideways-{committed,fixed}.png`.
- `docs/prompts/runs/G86a/`: this entry.
  - Unit: `unit-red-committed.txt`, `unit-green.txt`, `unit-group.txt`, `mutants.txt`, `unit-all-summary.txt` (the log of about 890 KB summarised, not kept), `unit-failed-alone.txt`, `probe-hear-it-deadlock.test.ts`, `probe-hear-it-deadlock-committed.txt`, `unittest-checks-for-paths.txt`.
  - Chain: `checks-for-paths.txt`, `tsc.txt`, `lint.txt`, `build-app.txt`, `build-app-committed.txt`, `states.txt`.
  - Browser: `browser-red-committed.txt`, `browser-green.txt`, `pictures-committed.txt`, `pictures-committed-sideways.txt`, `pictures-fixed.txt`, `probe-out-*.json` (six, the probe's measurements), `e2e-targeted-summary.txt` (the full log not kept), `e2e-projects-alone.txt`.
  - Scripts, not for `app/`: `scripts-playwright.g86a-4583.config.ts` (run from `app/build/g86a/`), `scripts-pictures.spec.ts` (from `app/build/g86a/probe/`), `scripts-mutants.py`, `scripts-run-e2e.sh`, `scripts-summarise.py`.

## Mechanism, test, red line

| Fix | Mechanism | Discriminating test | Red line (committed screen) |
| --- | --- | --- | --- |
| ▶ / Space refuse without the sound | `withSound`'s `go` ran `act` at the bound, on an answer and on a failure (`.catch(() => undefined)`), never reading the engine | unit (a)–(g), engine mocked; browser, `resume` stubbed never to answer | unit (a) *the run carried on against a sound that had not started: expected "vi.fn()" to not be called at all, but actually been called 1 times*; browser *the state line after the bound — Expected: "Sound did not start — tap ▶ again", Received: "The count-in clicks, then play along."* |
| `Hear it` through the gate | U67's wait was unbounded and shared `startingSound`; a start that never answered left it set, and every later ▶ returned before asking | unit *Hear it with a start that never answers*; the probe | *▶ left dead behind Hear it's wait: expected "vi.fn()" to be called 2 times, but got 1 times*; probe green on the committed screen (the deadlock), red after |

## Tests

Browser runs on port 4583 through a config copy under the worktree's `app/build/g86a/` (gitignored). It is not under the root `build/`, because a config there cannot resolve `@playwright/test` from `app/node_modules`. It uses two workers and a storage state copied for the port, and its server only previews a dist built before each run. Nothing ran on 4173. The dispatch named port 4583; the brief's 4641 was not used. The gallery ran on its own port 4183 with one worker, after checking that port was free. The whole unit suite ran after every code and test change.

| Test | Class | Old assumption |
| --- | --- | --- |
| U69 *never answers … then the run carries on* → G86a (a) | replace | the run starts or carries on at the bound |
| U69 *a start that fails still carries the run on* → G86a (d) | replace | a failure is an answer, and the run goes on |
| U69 *on a paused run*, *a fresh start the same*, *Space's start the same*, *▶ during Hear it the same* | preserve (the double corrected) | `ensureStarted` resolved without moving `state`, which the real engine never does |
| U69 *running or no Web Audio*, *the pause never waits*, *leaving in the wait cancels*; G86's four sheet cases | preserve | — |
| G86a (b) ×2, (c), (e), (f) ×2, (g); *Hear it* ×5; (a)'s busy and second-tap assertions kept from U69 | add | — |
| `help.test.ts` join: `STATE_TEXT.soundOff('▶')`, `('Hear it')` | add | — |
| `score.screen.spec.ts` G86a case | add | — |

| Run | Where | Result | Exit |
| --- | --- | --- | --- |
| extended unit file, committed screen | `unit-red-committed.txt` | 12 failed, 13 passed | 1 |
| the `Hear it` probe, committed screen | `probe-hear-it-deadlock-committed.txt` | 1 passed (the deadlock confirmed) | 0 |
| unit file + probe, fixed | `unit-green.txt` | 25 passed; the probe 1 failed (the deadlock gone) | 1 |
| three mutants, unit file | `mutants.txt` | each red (12, 12, 9 failed) | 1, 1, 1 |
| the brief's unit group (6 files) | `unit-group.txt` | 106 passed | 0 |
| `npx vitest run` (whole) | `unit-all-summary.txt` | 7,303 passed, 6 failed (2 CRLF claims, 4 load), 5 skipped, 1 todo | 1 |
| the 5 files that failed, alone | `unit-failed-alone.txt` | 323 passed, 2 failed (the CRLF claims) | 1 |
| `python -m unittest tools.content.tests.test_checks_for_paths` | `unittest-checks-for-paths.txt` | 27 passed | 0 |
| `npx tsc -b` | `tsc.txt` | clean | 0 |
| `npm run lint` (rerun once the config copy and the probe had left `app/build/`) | `lint.txt` | clean | 0 |
| `npm run build:app`, fixed / committed screen | `build-app.txt` / `build-app-committed.txt` | built | 0 / 0 |
| `npm run states` | `states.txt` | 60 cells, 2 broken (the two G86 recorded on the committed screen); Playwright 1 failed | non-zero (the wrapper's exit line printed `$?` literally, so the code itself was not captured) |
| the new browser case, committed screen | `browser-red-committed.txt` | 1 failed | 1 |
| U69's describe (2 cases), fixed | `browser-green.txt` | 2 passed | 0 |
| picture probe, committed / fixed | `pictures-committed*.txt` / `pictures-fixed.txt` | 3 pictures each (committed sideways rerun after the title fix) | 1 then 0 / 0 |
| the map's 47 specs (each file checked to exist), fixed | `e2e-targeted-summary.txt` | 335 tests: 331 passed, 4 failed (3 missing `-win32` references; `projects.spec.ts`:110, load) | 1 |
| `projects.spec.ts` alone, fixed | `e2e-projects-alone.txt` | 7 passed | 0 |

Unverified beside what passes: the audio half on a device; anything heard; the words as copy; the screen reader's reading of the sentence (the polite live region is the existing one, not exercised); failure, answered-suspended, the late answer and `Hear it`'s refusal in a real browser.

## Doc rows

- `docs/04-ui-spec.md` §5, **`▶` starts the sound as well as the run** (:2015–2035): the fail-open sentence is replaced. It now starts or carries on only if the sound is running. Where the wait ends with it off, nothing starts, carries on or ends, ▶ reads ▶, the state line says so, and the next tap asks. A late answer starts nothing and takes the sentence away. `Hear it` goes through the same gate with its own sentence. No Web Audio still acts at once.
- `docs/04-ui-spec.md` §5, the `Hear it` paragraph (U67, :1919–1925): one sentence, the tap waits through ▶'s gate and a refusal starts no demonstration. Not in the brief's list; a consumer of item 7.
- `docs/04-ui-spec.md` §5f: the order sentence (:3143–3146) gains the refusal at its head; a bullet under *The run's own sentences* (:3168–3174) prints both sentences, *unverified as copy*.
- `docs/01-architecture.md` §4.4 (:231–237): `goes on whether or not the start answered` replaced by the one gate, the state check, the sentence, the retry and the late answer.
- `docs/08-test-map.md`: the **Session** row (:15), G86a in *what can go wrong* and the unit and browser cases in *proved by*; the `score.screen.spec.ts` entry (:346), the G86a case; the unit file's entry (:595), *act once it answers or at the bound* replaced.
