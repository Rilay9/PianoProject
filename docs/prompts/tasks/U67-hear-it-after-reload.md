# U67 — Hear it plays after a reload: the score screen's session gets its audio context at the tap, never the null it was built with (a small independent seam, 2026-09-27, on the reviewer's word; for the pre-dispatch gate)

**Read first:** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13; `docs/review/responses/7e148e0.md` (LATER WAVE — U67: "fix the Score screen's direct-load Hear-it failure as a small independent seam before relying on Hear it in learner-facing verification"); the matrix row U67 (`docs/prompts/views/backlog/U.md`); `docs/prompts/runs/D2/probe-score-hear.txt` (the probe: 0 sample starts after Hear it when the screen is opened by address, 5 after a tap) and the probe spec under the D2 scratch folder if still present; `app/src/audio/AudioEngine.ts` (one `AudioContext` for the whole app, created lazily; `contextOrNull` at line 66; `ensureStarted()` at 80, which creates and resumes the context and is the thing a user gesture must call; its header comment on why a `resume()` from a timer is silently ignored); `app/src/ui/screens/ScoreScreen.ts` near 4258 (`const context = audioEngine.contextOrNull; session = new ScoreSession({ …, audioContext: context, destination: audioEngine.masterGain, … })` — the session is built when the screen loads, with whatever the engine has then, and keeps it) and the Hear it handler (the tap that starts playback; find it, and the two `session.resume()` sites at 2309 and 2524); `app/src/engine/ScoreSession.ts` (how it holds and uses `audioContext` — a field set once, or read per play); `app/src/ui/screens/DevMicroscopeScreen.ts` near 527 (D2 builds its session inside the first tap, after `ensureStarted`, and so does not share the fault — the pattern to reuse, not copy); `docs/04-ui-spec.md` §2 or wherever Hear it is specified; `docs/08-test-map.md` (the score-screen specs).

## The goal, in the orchestrator's words

A learner who reloads the page on a piece, or opens a link straight to one, presses Hear it and hears nothing: the screen built its session before any gesture, with a null audio context, and the session keeps it. After U67 the session always plays through a context that exists — obtained inside the Hear it gesture, as the microscope does — and a browser test that opens the screen by address, taps Hear it once and counts scheduled sample starts is red on the committed screen and green after. Nothing else about Hear it changes.

## What is decided

1. **The mechanism:** the session resolves its audio context at play time, not at construction. Either `ScoreSession` takes a provider (`() => AudioContext | null`, or the engine itself) and calls `ensureStarted()`-derived context on each play, or the Hear it handler awaits `audioEngine.ensureStarted()` and hands the context to the session through a setter before playing — the builder picks the one that keeps `ScoreSession`'s other callers (the microscope, the dev score screen, any test double) working unchanged, and says why. A session built with a null context and later given one plays; a session built with a live one behaves exactly as today.
2. **The regression, red first:** `app/tests/e2e/score.hearIt.spec.ts` (or the existing score spec's file, the builder's call): open `/#/score/<a bundled song>` by address with no prior tap, tap Hear it once, and assert sample starts (the probe's measure — a hook on the audio engine or the session that counts scheduled sources, exposed only under the test hooks) are greater than zero; a second case after a prior tap as the control. Red on the committed screen with the count. A unit case on `ScoreSession` for item 1's two states.
3. **Both `session.resume()` sites** reviewed: if either can run before a gesture, it goes through the same path.
4. **Not U67's:** the audio engine's design, the practice engine's audio, the microscope, any other screen, latency, the sound itself.

## Verification layers

- Unit: `ScoreSession` with a null context that is later provided plays; with a live one unchanged.
- Browser: item 2's two cases on port 4173, two workers, after `npm run build:app` with no preview running.
- The orchestrator opens a piece by address on the built app and presses Hear it once, and reads the count from the same hook; nothing is heard by a person, and the record says so.

## Rules and files

You own `app/src/engine/ScoreSession.ts` at the context's handling, `app/src/ui/screens/ScoreScreen.ts` at the session's construction and the Hear it handler, the test hook that exposes the count (under the existing `__pianopath` test hooks, never in a learner path), the new spec and unit file, `docs/04` at the Hear it sentence if it changes, `docs/08`. Never name an AI model. Never assert a number measured on this machine. Every change red first; every touched test classified. Runs unpiped: from `app/` (`npm ci`, `python tools/midi-cleanup/tests/parity_reference.py` first) `npx tsc -b`, `npm run lint`, the named unit file, `npm run build:app`, the new spec and `score.density.spec.ts` (a neighbour that opens by address) on port 4173 with two workers. Copy the main checkout's `app/public/content/` into the worktree before the app build. No commits, no push, no stash, never `git add`. Your entry as `ENTRY.md` in your scratch folder, headed "### Entry NN — U67: …" with the number given at dispatch, short, in the shape of Entry 91.

## When to deviate

If the count hook cannot be exposed without touching a learner path, count through `AudioContext`'s state and a scheduled-source spy in the test only, and say so. If `ScoreSession` is constructed in more places than the two named, list them and route each the same way.

## Report

Judgement first: a learner who reloads on a piece and presses Hear it, before and after; then Done / Not done / Follow-ups / Questions / Files; the red line; exit codes; unverified beside what passes.
