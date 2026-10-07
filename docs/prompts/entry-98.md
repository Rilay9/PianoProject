### Entry 98 — U67: `Hear it` sounds after a reload — the Score screen's session asks for the audio context and its master gain, as one pair, at every start, frame, latch and resume instead of keeping the none it was built with before the first tap; the first tap awaits the engine's start where the context is not running; a browser case opened by address counts sounds at `Piano.start` and the metronome's click, red on the committed screen (2026-09-27)

**Judgement.** A learner who reloads on a piece, or opens a link straight to one, and presses `Hear it` once: on the committed screen no piano note was scheduled (`Received: 0` after a 30 s wait), and with the click on, no click either; `▶` in Listen was as silent. After a tap on another screen first, notes were scheduled on both builds. After U67 all four cases schedule notes (and clicks, where the click is on) within the wait, opened by address. Read from the app's own count at the scheduling boundary (`window.__pianopath.audioStarts`), in the Chromium the suite drives. **Nothing heard by a person**, and no screen looked at beyond what the cases assert. Not exercised anywhere: a phone's refusal to start audio before a tap. This Chromium ran the app's context before any tap even under `--autoplay-policy=document-user-activation-required` (a probe that captured the app's own context as it was made, `probe-autoplay-document-activation.txt`), so the tap's wait for the sound to start is reasoned from the code.

## The mechanism, and the test that told it from the alternatives

**Hypothesis (D2's):** `ScoreScreen` built the session as the piece loaded with `audioContext: audioEngine.contextOrNull` and `destination: audioEngine.masterGain`, both null before any gesture, and the session read those construction options at every boundary for the whole visit. The immediate cause is an ordering inside one function: the session was built at line 4258 and `getPiano()`, which creates the context through `ensureStarted()`, was called at 4336, just after. **Alternatives:** the piano never loaded after a reload; the context existed but was suspended. **Test:** the browser case counts calls at `Piano.start` with the samples loaded. By address it read 0 while the control, a tap on another screen first, read above zero in the same build. The two cases with the click on read 0 clicks, and the metronome needs no piano, so an unloaded piano does not explain them. A probe that captured the app's own context as it was made read it as `running` before any tap (`probe-autoplay-document-activation.txt`), so a suspended context does not explain them in this browser either. What was left was the missing context in the session, and the fix removes it.

**The change.** `ScoreSession` takes an optional `audio: () => SessionAudio` provider. Every boundary (`schedulePlayback`, `onLatched`, `startMetronome`, `startMetronomeOnGrid`) reads the context and the destination together from `audioNow()`, one call for both. The Score screen passes `() => ({ context: audioEngine.contextOrNull, destination: audioEngine.masterGain })`. `ScoreSession` never makes or owns a context. Without a provider, the static `audioContext`/`destination` options are read as before, so the microscope and the existing tests are unchanged. `toggleHear` awaits `audioEngine.ensureStarted()` before the toggle where the context is not running. It runs at once, as before, where the context is running, where there is no Web Audio, or when the tap is a stop. A second tap during the wait is ignored, and a screen torn down during the wait does nothing.

**Provider, not setter (the brief left it to me).** I built the setter first (`setAudio({ context, destination })`, called at every `startRun` and before both `session.resume()` sites). The full unit run then failed 13 tests in `scoreMidRunSettings`, `scoreSummaryTruth`, `scoreTourRoute` and `observationsFromRun` (`run-vitest-all.txt`, "setAudio is not a function" 30 times): their hand-written session doubles have no such method. The brief requires that test doubles keep working unchanged. A provider is a construction option the doubles already ignore, and it meets the brief's condition for one: the gesture still awaits `ensureStarted()` first, and each boundary reads the pair in one call.

**Item 3, the resume sites and the Play path.** The red case proved the ordinary ▶ path silent too: the session held null whichever button started it, so the app-level first-gesture start alone never reached the session. With the provider, ▶, both `session.resume()` sites, the long-press bar preview and every other start read the live pair. Nothing else resumes or creates a context: `AudioEngine` remains the one owner. ▶ does not await `ensureStarted()`. It keeps the app-level first-gesture contract, and making the core practice button asynchronous risked a ▶ that does nothing when a resume never settles. On a first tap the context may be suspended for a moment; a count-in covers that moment for notes.

## The red lines

- **`red-e2e-committed-screen.txt`** — the new spec on the committed screen and session, with only the count hook added: 3 failed, 1 passed. `opened by address, one tap on Hear it`: "piano notes scheduled after one tap on Hear it, opened by address — Expected: > 0, Received: 0". The click-on case: "metronome clicks … Received: 0". ▶ in Listen: "metronome clicks scheduled after ▶ … Received: 0". The control passed. The file also carried a probe test (`new AudioContext().state` inside `evaluate`), since removed. It was likely unsound, because Playwright may run `evaluate` as a user gesture, and it was replaced by the capture probe above. `red-e2e-committed-screen-phone-rule.txt` is the same red under `--autoplay-policy=user-gesture-required`, which proved not to gate.
- **`red-unit-committed-session.txt`** — the new unit file on the committed `ScoreSession`: 2 failed, 2 passed. "the opening note handed to the piano: expected [] to include 60". "the click picked up on the resume: expected "start" to be called 1 times, but got 0 times".
- **`red-unit-context-only-mutant.txt`** — the fixed session with `startMetronome` taking the context from the provider and the destination from the options (the reviewer's concern): 2 failed. "the click routed to the live master, not past it … Received: the context's own output at 5", and the same on the resume.

## Tests touched

| Test | Class | Old assumption | Now |
| --- | --- | --- | --- |
| `app/tests/e2e/score.hearIt.spec.ts` | add | — | by address, one tap on `Hear it`: piano notes; the control after a tap elsewhere; by address with the click on: notes and clicks; by address in Listen, ▶: notes and clicks |
| `app/tests/unit/scoreSession.audio.test.ts` | add | — | built cold, the pair live later: notes on the live clock, the click on the live master, at start and on resume; a fixed live pair as before; never live: nothing |
| `scoreSession.test.ts`, `keyRibbonSpelling.test.ts`, the screen unit files with session doubles, `score.density.spec.ts` | preserve, untouched | — | green (density: one case skipped, as committed) |

## Checks (unpiped; exit codes read)

From `app/`: `npm ci` 0 (`run-npm-ci.txt`); from the root, `python tools/midi-cleanup/tests/parity_reference.py` 0. The main checkout's `app/public/content/` was copied in. Then `npx tsc -b` 0 (`run-tsc.txt`) and `npm run lint` 0 (`run-lint.txt`). `npx vitest run tests/unit/scoreSession.audio.test.ts tests/unit/docsConsistency.test.ts`: 0, 7 passed (`run-unit-final.txt`). Every unit file that imports the changed modules (22 files): exit 1, 601 passed, 2 failed (`run-vitest-affected.txt`). Both failures are the worktree's own: `lessonClaimsAboutApp` 4.7 reads `style.css` for `\n`, and this checkout has CRLF; `taughtByAncestry` reads `build/rung-claims.json`, which is absent here. Neither file is touched. `npx vitest run`, the whole suite on the final code: exit 1, 6,393 passed, 4 failed, 5 skipped (`run-vitest-all-final.txt`). Two of the failures are those two. The other two, `competenceSurvivesPruning` (1) and `legacyStorage`'s Skills case, timed out at 5 s while I ran lint alongside; alone they pass, exit 0, 23 tests (`run-vitest-timeouts-alone.txt`). `npm run build:app`: 0 (`run-build-app.txt`). Then, with no preview running, `npx playwright test tests/e2e/score.hearIt.spec.ts tests/e2e/score.density.spec.ts --workers=2` on port 4173: exit 0, 7 passed, 1 skipped (`run-e2e.txt`).

## Unverified, beside what passes

1. **Nothing heard by a person.** The count is of notes and clicks handed to the audio clock, not of sound reaching a speaker.
2. **A phone's first tap after a reload** (the context suspended until a gesture) was not exercised: the awaited path in `toggleHear` has no case, because this Chromium would not gate audio.
3. **The long-press bar preview and the Space key** read the live pair by construction; no by-address case covers them.
4. **Other specs that open the score by address** now run sessions that schedule real notes and clicks where they were silent. Only the new spec and `score.density` were run; CI's full run is the check.

## Not done

Every decided item is done: the pair read together at every boundary, with the gesture awaiting `ensureStarted()` first (item 1); the regression red first with the unit case (item 2); both resume sites reviewed and the Play path routed through the same pair once the red case proved it silent (item 3). **Not done:** a browser case under a gesture-gated policy (not reachable with a launch switch here; recorded).

## Follow-ups

- **P2, audio lifecycle (Score screen).** ▶ never asks the engine to resume. After the platform suspends the context (a screen lock, a call), ▶ runs against a suspended context until some other gesture calls `ensureStarted()`; `startOnFirstGesture` is one-shot. Inferred from the code (no other `ensureStarted` on the screen); unverified.
- **P3, the piano on a gated phone.** `getPiano()`'s `ensureStarted()` pends until the first tap, so after a reload the samples begin to load at that tap, and a demonstration's opening notes can fall before they are ready (`schedulePlayback` skips notes while there is no piano). Inferred; not exercised here.
- **P3, test infrastructure.** Exercising the gesture rule needs a stand-in for the platform policy in an init script: a context suspended until activation, and pending resumes settled later. That is a larger piece than this seam.
- **Record.** The U67 backlog row, `pending-review.md`, the reviewer handoff: the orchestrator's.

## Questions

None blocking.

## Files

In the worktree (`C:\Users\yalir\repos\Piano Stuff\PianoProject\.claude\worktrees\agent-a4f66cdb3e68c2012`):

- **New:** `app/src/audio/audioStarts.ts` (the count; writes only into `window.__pianopath.audioStarts`, inert without the hooks), `app/tests/e2e/score.hearIt.spec.ts`, `app/tests/unit/scoreSession.audio.test.ts`.
- **Changed:** `app/src/score/ScoreSession.ts` (`SessionAudio`, the `audio` option, `audioNow()`, four boundaries); `app/src/ui/screens/ScoreScreen.ts` (the provider at construction; `toggleHear` awaits the start, `toggleHearNow` is the old body unchanged; `startingSound`); `app/src/app/testHooks.ts` (`audioStarts`, fresh at page load); `docs/04-ui-spec.md` (§5, the `Hear it` paragraph); `docs/08-test-map.md` (the Session row, both new files).
- **Outside the named list, and why:** `app/src/audio/Piano.ts` and `app/src/audio/Metronome.ts`, one counting call each. The reviewer placed the count at the real `Piano.start` boundary, and the click count is what lets the browser prove the metronome path the reviewer's change was about. The count lives in a module of its own so the audio modules do not import the storage modules `testHooks.ts` pulls in.

Beside this entry: the red lines above; `run-*.txt`; `probe-autoplay-document-activation.txt`; `run-vitest-all.txt` (the setter version, superseded); the patch scripts (`patch-*.py`).
