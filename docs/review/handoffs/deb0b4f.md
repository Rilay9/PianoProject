# Reviewer handoff — U67, Hear it after a reload (its own seam)

Implementation HEAD: deb0b4f (U67's commit on its worktree branch, merged as 0358768; `ScoreSession.ts` at the audio pair, `ScoreScreen.ts` at the session's construction and the Hear it handler, a count module and one line each in `Piano.ts` and `Metronome.ts`, the test hooks, one spec, one unit file, docs/04 §5, docs/08)

## What changed

- **The mechanism, at the mechanism.** `ScoreSession` takes an optional provider `audio: () => { context, destination }` and reads the pair together at each of its four scheduling points — playback scheduling, the latch, the click's start and the click on resume. `ScoreScreen` passes the engine's current context and master gain; `toggleHear` awaits `audioEngine.ensureStarted()` when the context is not running and then runs the old toggle body unchanged; it runs at once when the context already runs, when there is no Web Audio, or when the tap is a stop; a second tap during the wait is ignored and nothing happens after a teardown. The session never creates a context; without a provider it behaves as before, so the microscope and the existing session doubles are untouched.
- **Provider, not setter — the builder's call, with its reason:** the setter was built first and failed 13 tests in four files whose hand-written session doubles have no `setAudio`; the brief required the doubles to keep working unchanged, and a provider is a construction option they already ignore. Your conditions hold: the gesture awaits `ensureStarted()` first, and the pair is read atomically at every boundary.
- **The resume paths:** the red case proved ▶ in Listen by address silent too; with the provider, ▶ and both `session.resume()` sites read the live pair. ▶ does not await `ensureStarted()` — it keeps the app-level first-gesture start, because an asynchronous core practice button could do nothing if a resume never settles (U69 records the phone-suspend case that leaves open).
- **The count** lives in `app/src/audio/audioStarts.ts`, writes only into `__pianopath.audioStarts.{piano,metronome}`, does nothing if the hooks are not installed, is fresh at each page load and only read by tests; one counting line each in `Piano.ts` and `Metronome.ts` (outside the brief's list: the click count is what proves the metronome path your change was about).
- **The mechanism told from the alternatives:** not an unloaded piano (the control scheduled notes, and the click cases scheduled 0 clicks though the metronome needs no piano); not a suspended context (a probe captured the app's own context as it was made and read it `running` before any tap).

## As a learner meets it

Before: a learner who reloads on a piece, or opens a link straight to one, taps Hear it and nothing is scheduled — 0 piano notes after a 30 s wait, 0 clicks with the click on, and ▶ in Listen just as silent. After: all four cases schedule notes, and clicks where the click is on, within the wait; the control (a tap on another screen first) schedules notes on both builds. These are the relationship between cases in one run, read from the app's own count, not a product figure. The orchestrator's targeted run on the merged checkout reran the spec (its count lines: [('piano', '8'), ('piano', '8')]). **Nothing heard by a person.** A phone's refusal to start audio before a tap was not exercised: this Chromium ran the app's context before any tap even with `--autoplay-policy=document-user-activation-required`, so the awaited path is reasoned from the code.

## Files to inspect, in order

1. `docs/prompts/entry-98.md` — the judgement, the mechanism and its discriminating probes, the provider decision, the resume paths, the red lines, exit codes, unverified.
2. `docs/prompts/runs/U67/` — `red-e2e-committed-screen.txt`, `red-unit-committed-session.txt`, `red-unit-context-only-mutant.txt` (your concern proven: the click routed past the live master), `probe-autoplay-document-activation.txt`, the runs, the orchestrator's chain.
3. `app/src/score/ScoreSession.ts` (`audioNow()` and its four call sites), `app/src/ui/screens/ScoreScreen.ts` (`toggleHear` → `toggleHearNow`), `app/src/audio/audioStarts.ts`.
4. `app/tests/e2e/score.hearIt.spec.ts` (four cases), `app/tests/unit/scoreSession.audio.test.ts` (cold-then-live with the destination pair; a fixed live pair; a pair that never goes live).

## Verification

- The builder in its worktree, unpiped: npm ci 0; parity reference 0; tsc 0; lint 0; the named unit file with `docsConsistency` 7 passed; the 22 unit files touching the changed modules 601 passed with the two worktree reds (the CRLF case; `taughtByAncestry` without `build/rung-claims.json`); the whole unit suite 6,393 passed with those two and two load timeouts (23 of 23 alone); app build 0; the new spec plus `score.density.spec.ts` 7 passed, 1 skipped (a density case skipped before this change) on port 4173.
- The orchestrator on the merged checkout, targeted: tsc 0, the session's two unit files 43 passed (0), app build 0, the Hear-it and density specs 7 passed, 1 skipped (0). CI is the full run — and other specs that open the score by address now run sessions that schedule real notes and clicks where before they were silent; the builder ran only the two specs, so CI's full run is the check for the rest.
- Unverified: nothing heard by a person; a phone's first tap after a reload (the awaited path) has no test; the long-press bar preview and the Space key pick up the live pair by construction with no by-address case.

## Follow-ups recorded, not fixed here

- **U69 (P2):** ▶ never asks the engine to resume — after a phone suspends the context, a run starts against it until another gesture resumes it. Inferred from the code.
- **U70 (P3):** on a gated phone the samples load only at the first tap after a reload, so a demonstration's opening notes can be skipped; the gesture rule needs an init-script stand-in for a browser case.

## Questions for the reviewer

1. ▶ kept synchronous with the app-level first-gesture start, the phone-suspend case left as U69 — agree, or should ▶ await the engine's resume now with a bounded wait?
2. Does this close U67?

## Do not re-review

D2 (`responses/7e148e0.md`), the U67 brief (`b2a55d0.md`), D1 (`b15758e.md`; D1a building), E0a (`5bfe6d2.md`; E0b building), every closed seam. D2a gets its own handoff when it lands.
