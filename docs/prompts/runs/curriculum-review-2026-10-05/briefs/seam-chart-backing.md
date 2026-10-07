# Brief CB1: the Chord chart's bass and drums run without its comp

Lane CB1. A narrow app seam under FABLE §10: the design was decided by the reviewer (`docs/review/responses/a7b1-bluebossa-design.md` §4) and reproduced by the Blue Bossa probe (`docs/pending-review.md` Entry 266, Station 4; evidence `docs/prompts/runs/BB1/chart-backing.json`). It lands before its artefact review, so the six conditions of FABLE §10's narrow-seam rule hold and a breach of any is a stop. Read `docs/prompts/operating-procedure.md` §13 and §14 for the harness. Never name an AI model in any file. Do not commit, push, stash, reset or checkout; the orchestrator lands your work.

## Decision rationale

- **Learner problem.** A7b.1 step 11 asks the learner to comp Blue Bossa's chart in shells with the app's bass and drums under them and no app chord comp. Today the app cannot do that: turning Comp off with Bass + drums on silences the bass and drums too, while the Bass + drums toggle still reads pressed.
- **Mechanism, verified at the code.** `app/src/ui/screens/ChordChartScreen.ts`: `onBeat` calls `compBar()` only while `comping` is true (line 229); `compBar()` plays the chord and then calls `scheduleBacking()` (lines 233-244), so the backing is scheduled only through the comp. The Bass + drums toggle forces Comp on (lines 384-397); its comment says the bass needs the comp to know the chord, which is false: `scheduleBacking` takes the bar's pitch classes, which `onBeat` can read from `bars[bar]` directly.
- **Solution classes.** (a) Schedule the backing from `onBeat` whenever `backing` is on, independent of `comping`, and make `compBar` voice the chord only. (b) Keep the coupling and add a "backing only" mode. (a) is chosen: it is the reviewer's ruling, it removes a false dependency rather than adding a mode, and it touches one function.
- **What would reverse it.** A reason in the code, other than the comment, why the backing must follow the comp (for example the comp's audio context start). Report it and stop.
- **Real problem, not a proxy.** The probe measured scheduled audio events in all four toggle states; the fix is judged on the same counts.
- **Uncertainty.** Nothing heard. The counts show what is scheduled on the audio clock, never how it sounds.

## The change

1. **Red first.** A browser spec that reproduces the probe's four cases on Blue Bossa's chart (`#/chart/song.jazz.kenny-dorham-blue-bossa.pdmx`), counting bass and drum events per bar and the app's piano starts. Adapt the probe's instrumentation in `docs/prompts/runs/BB1/chart-backing.probe.spec.ts`; it classified drum and bass starts by audio-node construction. Case B (Bass + drums on, then Comp off) must fail on the current code before any change.
2. **The fix, in `ChordChartScreen.ts` only.** At each new bar, `onBeat` comps the chord if `comping` is on and schedules the backing from that bar's chord if `backing` is on. `compBar` voices the chord and no longer schedules backing. The forced Comp in the Bass + drums toggle is deleted with its comment. Nothing else in the screen changes.
3. **The pins that state the old coupling are rewritten, never deleted.** `app/tests/e2e/carry-overs.spec.ts` "offers bass and drums, and turning it on turns the comp on" asserts the forced Comp; it becomes the new behaviour (Bass + drums on leaves Comp as it was). Search every spec, unit test, `docs/04-ui-spec.md` and `docs/08-test-map.md` for any other statement of the coupling and list each one with what you changed.
4. **The record.** A `docs/08-test-map.md` row for the new spec. `docs/prompts/checks.json` reader lists if the spec reads a shared helper (see how `score.loop-by-bar.spec.ts` was added).

## Acceptance

- Case A (Bass + drums on, Comp on): bass, drum and piano events as before the fix.
- Case B (Bass + drums on, Comp off): the same bass and drum counts as case A over the same window, and no piano starts. Red before the fix, green after.
- Case C (Comp on, Bass + drums off): piano starts, no bass or drum events, as before.
- Case D (both off): clicks only, as before.
- **Before-and-after differential.** The four cases run on the code before and after; only case B's counts change. Any other change is a stop, reported, never explained after the fact.
- Unit suite (`npx vitest run`), `npx tsc -b`, `npm run lint`, and the chart's browser specs (`chart.spec.ts`, `carry-overs.spec.ts`, the two `modes-chart-*` specs, the new spec) pass. One Playwright run at a time, two workers at most.

## Blast radius, declared

`ChordChartScreen.ts`; the new spec; `carry-overs.spec.ts`; `docs/08-test-map.md`; `docs/prompts/checks.json` if needed; a `docs/04-ui-spec.md` sentence only if it states the coupling. A change to any other file is a stop.

## Stop conditions

- Case B is green before the fix: the probe's finding does not reproduce; report and stop.
- The fix changes cases A, C or D.
- The backing needs state that only the comp sets.

## Report

Each acceptance case with its counts before and after; the list of statements of the coupling found and what became of each; every file changed; every item done or an explicit not-done line.
