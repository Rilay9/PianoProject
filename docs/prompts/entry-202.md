### Entry 202 — X45 — a rhythm card's first open judges nothing until its sound is running, says so where it is not, and then counts in as it always has (the reviewer's ruling, `responses/1a89de52.md`, "X45 — first-open start never answers"; app only) (2026-10-01)

Base: `e0802d75`, confirmed with `git log -1 --format=%h` before any edit. The brief is `docs/prompts/tasks/X45-a-rhythm-card-never-judges-before-its-pulse.md`, read from the main checkout (not on origin at dispatch); its line numbers held at the base. One source file and one test file changed: `app/src/ui/screens/DrillScreen.ts` (the rhythm branch of `advance()` and one new function beside it) and `app/tests/unit/drillLifecycle.test.ts` (five cases added after CL05b's). `special.ts`, `AudioEngine.ts`, `Metronome.ts`, `screenLifecycle.ts`, `suspendDrill`, `resumeDrill`, `resumeRhythmClick`, `whenSoundRuns`, the paused-card functions and every other drill kind are untouched.

## Judgement

**Layers.** Everything below was observed in the unit layer: jsdom, the real Drill screen, a faked clock, the real `Metronome`, and CL05b's audio double, unmodified (one case adds a spy on `ensureStarted` to read the engine's state at each call). No browser and no device were used. Nothing was heard, and no one in this process can hear. **Pedagogical verdict: not applicable.** This is an interaction and timing fix; the count-in it leads to is the card's existing one. The figures come from the faked clock. They are test inputs, not measurements.

**The proof card:** two bars of quarter notes at ♩=120 in 4/4, opened fresh — the set's first card, or the card *Again* opens.

**What a learner meets on a rhythm card's first open.**

- **Before (the base):**
  - With the sound running as the card opens, the usual case: one bar of count-in, then the first tap starts the pattern.
  - If the start the card asks for as it opens never answers: no count, nothing said, and every tap judged against the moment the card appeared. In the proof case, four taps on the beats from that moment and two keys after them were all scored, right or extra: 6 answers on a card no click had counted in.
  - If the start answers with the sound still suspended: the count-in is begun on a clock that is standing still, so nothing clicks, nothing is said, and every tap is refused. If the sound then comes back by itself, the count plays, but the downbeat it names was read off the standing clock and lies before the count's own clicks (in the double, by the whole wait).
  - Where only a tap can start the sound: the card never counts in. A tap on it asks for nothing.
  - *Again* opened its card the same way.
- **Now, with the sound running as the card opens:** as before — the count-in, then the first tap starts the pattern. CL05b's existing cases pin it, unmodified. The one difference is a tap in the instant between the card opening and its count being scheduled: it is refused now, not scored.
- **Now, until the sound is actually running:** nothing on the card counts. A tap on the screen keys or a MIDI key is neither right nor extra.
  - Where the sound is not running, the line under the card reads *Sound is paused — tap to continue.*, and the card itself is a button: a tap, a click, or Enter or Space once it has the focus. Its one job is to ask for the sound, inside that tap. It is the same sentence and the same card met on the return from a locked phone (CL05b). In the unit layer a key on the strip or the piano is never the way back; the app-wide first-tap start that `main.ts` arms is not in that layer and may make one so on a visit's first tap (follow-up 1).
  - Once the sound runs — by itself, or from the tap on the card — the sentence goes, the card is no longer a button, and the ordinary count-in plays: one bar of four clicks a beat apart, the downbeat a beat after the last, a tap during it a stray, and the first tap on the downbeat the pattern's start and its first judged onset.
  - The wait has no limit: a start that never answers holds the card, past the one-second bound, until the sound runs.
  - Hidden during the wait and back, the card is still waiting, and counts in from the top once the sound runs — after *Again* too.
- **No Web Audio at all:** unchanged. The card says *No metronome — the count-in is silent on this device. Your first tap starts it.* and carries on at once, with no *Sound is paused* line.
- **A start that fails outright on a browser that has Web Audio** (inferred from the code, not tested): the card is held and paused, and each tap on it asks again, where the base carried on silently with *No metronome — …*. This is the existing wait's own reading, as on CL05b's return and the Score screen's ▶ (G86a); put as question 1.
- **Unverified on a device:**
  - whether an ordinary first open shows the paused line for a moment while a context just created starts up (the double's sound reads `running` from the open; on a phone whose sound starts by itself the pause would last only until it runs);
  - whether a phone answers a start asked at the card's open, hangs, or answers still suspended;
  - whether a phone honours the ask inside the tap on the paused card.
- **Not looked at:** the card's look while paused. No style was added (CL05b's follow-up 4 stands).

**Counts.**
- **Tests:** 5 cases added; CL05b's 38 unmodified and green (`git diff` removes no line from the test file). The file holds 43.
- **Red at the base:** all 5 added cases (`unit-red-committed.txt`). The two guards are existing cases, green at the base by construction.
- **Mutants:** 8 applied, 8 killed (`mutants.txt`): the brief's four (the third in two forms) and three more.

## Mechanism

**Hypothesis (the brief's), confirmed:** `advance()`'s rhythm start (`:1664` at the base) treated "`ensureStarted()` settled" as enough to arm the latch, and nothing held either the drill's latch or the screen's `rhythmJudgedFromMs` gate while that start was pending or answered with the context not running. Quoted red at the base: *a tap was judged against the moment the card opened: expected 6 to be +0* (Part A); *a count-in was begun with the sound suspended: expected "start" to not be called at all, but actually been called 1 times* and *the downbeat is not a beat after the count's last click: expected +0 to be close to 1600* (Part B); *the tap did not ask for the sound, once, inside itself: expected [] to deeply equal [ { inGesture: true, running: false } ]* and *never happened: the count-in began from its first click* (Part C); *the held card does not say the sound is paused: expected '' to be 'Sound is paused — tap to continue.'* (Parts A suspended, B, C and *Again*).

**What changed, in `DrillScreen.ts`:** `advance()` calls `openRhythmCard(drill)` where it called `startCountIn(drill)`.
- With no Web Audio, `openRhythmCard` calls `startCountIn` at once, as before: premise 8's guard at the new call site.
- Otherwise it records a `top` hold (`rhythmHold`), closes the gate (`rhythmJudgedFromMs = +Infinity`, read by `onNote` for the rhythm card alone), and calls `whenSoundRuns(target, () => startCountIn(target))`.
- `whenSoundRuns` reads the engine's state at once, on the start's answer or failure, at the 1 s bound and on every `statechange`; it shows the paused card while the state is not `running` and takes it down when the wait ends. `startCountIn` then plays the ordinary count and, once the drill's own latch refuses strays, releases the hold and the gate (`:1340` at the base, unchanged).
- With the sound already running the first reading goes at once, so `startCountIn` runs inside `advance()` exactly where it did. The gate stays closed only until `startCountIn`'s start answers.

**Direct reuse, not a shared helper.** What the two paths share is two calls: close the gate, then `whenSoundRuns`. A helper would rewrite `resumeRhythmClick`, CL05b's approved function, for no change in behaviour. Reused as it stands, `resumeRhythmClick` stays byte-identical, and a reviewer can read the new path as eight lines beside it.

**Why the hold is recorded, not only the gate.** On a hide during the wait, `suspendDrill` keeps a hold whose gate is still closed, and `resumeRhythmClick` keeps an existing hold. Without one it rebuilds the hold from `countInDownbeatKnown` (`:1453`), which is reset only in `startCountIn` (`:1320`). After *Again* it still reads the last card's `true`. The card would then have come back as a `downbeat` hold through `countInAgain`, its latch never armed, and its first tap scored without starting the pattern. The *Again* case pins this, killing `first-open-hold-not-recorded`.

**Premises found wrong.**
- *Part A's base expectation "`firstTapAt` is not `null`"* (brief, refuting test). At the base the judged taps never set it: `firstTapMs` is written only inside the latch branch (`special.ts:166`), and the latch was never armed. The red line is the judged count alone. The assertion stays in the case, green at the base and after.
- *Part A's paused-line assertion, with the brief's setup* (`holdStarts`, the engine left `running`). The real engine cannot be running with a start unanswered: a running context skips `resume()` (`AudioEngine.ts:89–90`), so `ensureStarted()` answers at once. And with the engine reading `running`, *Sound is paused* would be false. It is built as two cases:
  - Part A as written, which asserts nothing about the line;
  - Part A with the engine suspended — CL05b's own shape for an unanswered start — which carries the line, the role, the tabindex and the label.
- *Premise 5's "nothing on this path ever rechecks the engine's state … indefinitely", and Part B's base red "after `resumeAudio()` alone the card is still stuck, with no count-in ever begun".* Both are wrong in the double. At the base the metronome begun on the standing clock keeps polling, so once the clock runs the count plays, and the first tap after it starts the pattern; Part B's base run reached *Count-in — 1*. What is wrong at the base is that downbeat: it was placed through the clock reading taken on the standing clock, and no count click was heard in the two seconds before it. The premise's other half held: no tick fires while the clock stands still (the line never read *Count-in* during the suspension), and every tap was refused. The hang is indefinite only where the sound needs a tap and nothing asks inside one (Part C at the base).
- *Premise 7's "`resumeRhythmClick` already reconstructs a `{ from: 'top' … }` hold whenever `firstTapAt === null`, which is exactly a first-open hold's state".* Wrong at `:1453` after *Again*, as above. `openRhythmCard` records the `top` hold itself, the shape the brief allowed. Neither `suspendDrill` nor `resumeDrill` changed.
- *Premises 1, 2, 3, 6 and 8* held at the lines. Premise 1's other `advance()` callers are `endFeedback` (`:1738`, the same drill, whose `next()` returns `null`) and `startGoingOver` (`:3281`, `PromptDrill` only).

**Part C's "asks exactly once".** The double fires `statechange` synchronously inside the tap's start, so `startCountIn`'s own `ensureStarted()` — on a context already running — is recorded inside the same gesture. A real context reports `statechange` later, outside it. The case therefore counts the starts asked while the sound was not running (exactly one, inside the tap) through a spy on `ensureStarted` that reads the engine's state as each call is made. The double is unmodified.

## Tests and exit codes

| Case | Class | The old assumption it refutes | Red at the base |
| --- | --- | --- | --- |
| **Part A**, the start never answers (engine reading `running`, as the brief sets it): taps on the grid from the moment the card opened, a key and a MIDI key past the 1 s bound — none judged, no count begun; the start answers; the ordinary count-in leads to the first judged onset | add | the drill may judge before its start has answered | *a tap was judged against the moment the card opened: expected 6 to be +0* |
| **Part A with the sound suspended:** the card says the sound is paused and is a keyboard-reachable button; the same taps judge nothing, past the bound; the sound runs; the sentence and the button go; the ordinary count-in leads to the first judged onset | add | a card's first open needs no pause and no way back | the four paused-card assertions (*expected '' to be 'Sound is paused — tap to continue.'*, *expected null to be 'button'*, *expected null to be '0'*, the label); *expected 6 to be +0* |
| **Part B**, the start answers with the sound still suspended: past a count's length, no count begun, no tap taken, the card paused; the sound comes back by itself with no gesture; the count-in follows — four clicks a beat apart, the downbeat a beat after the last — and the first tap on it is the first judged onset | add | a start that answers is a clock that runs | the four paused-card assertions; *a count-in was begun with the sound suspended*; *the count-in is not a bar of clicks a beat apart: expected [] to deeply equal [ 500, 500, 500 ]*; *the downbeat is not a beat after the count's last click: expected +0 to be close to 1600* |
| **Part C**, only a tap can start the sound: a key, even as a tap, wakes nothing and is not judged; a tap on the card asks once, inside the tap, while the sound is not running; the sentence and the button go; a second tap asks nothing; the ordinary count-in leads to the first judged onset | add | the sound comes back without anyone asking for it | the four paused-card assertions; *the tap did not ask for the sound, once, inside itself*; *the tap did not wake the sound: expected 'suspended' to be 'running'*; *never happened: the count-in began from its first click* |
| ***Again*** opens its card the same way: held and paused with the sound suspended, judging nothing; hidden during the wait and back, still paused; the sound runs; it counts in from the top, and its first tap starts the pattern | add | *Again*'s card opens with its sound running, and a hide during its wait comes back from where the last card's count left off | the four paused-card assertions (*expected 'Tap the rhythm on any key — your firs…' to be 'Sound is paused — tap to continue.'*) |
| **Guard, sound running:** CL05a's and CL05b's rhythm cases through `openRhythm()`/`intoALiveRhythm()` | preserve | — | green, unmodified |
| **Guard, no Web Audio:** "with no Web Audio there is no sound to wait for" (opens its card with none) | preserve | — | green, unmodified; kills `first-open-holds-without-web-audio` |
| CL05b's other cases (38 in all with the two guards) | preserve | — | green, unmodified |

**Mutants, 8 of 8 killed** (`mutants.txt`). Each was applied to the final source and the file of 43 was run; then the source was restored and byte-compared.

| Mutant | The change | Killed by |
| --- | --- | --- |
| `first-open-unheld` (brief) | `advance()` calls `startCountIn` directly: the base | all five added cases (*a tap was judged against the moment the card opened: expected 6 to be +0*) |
| `first-open-proceeds-on-start-answer` (brief) | the first-open wait goes ahead when the start answers, the state not read again | Part B (*a count-in was begun with the sound suspended*; the paused card gone); Part C; *Again* |
| `first-open-affordance-missing` (brief) | the gate holds and the wait goes on, but the pause is taken down at once | Part A suspended, Part B, Part C, *Again* (the paused-card assertions; *the tap did not ask for the sound*) |
| `first-open-surface-inert` (brief, second form) | the sentence shows, but the card has no role, tabindex or listeners | Part A suspended, Part B, Part C, *Again* (*expected null to be 'button'*; *the tap did not ask for the sound*) |
| `first-open-holds-without-web-audio` (brief) | no `supported` guard at the new call site | the no-Web-Audio guard (*expected 'Sound is paused — tap to continue.' to contain 'No metronome'*) |
| `first-open-gate-open` | the wait with the gate left open | Parts A, A suspended, B, C, *Again* (*a tap was judged with the sound suspended: expected 8 to be +0*) |
| `first-open-fast-path-when-running` | `withSound`'s shape: a running engine starts the count at once, ungated, before its start has answered | Part A (*expected 6 to be +0*) |
| `first-open-hold-not-recorded` | gated and waiting, but no hold recorded | *Again* (*the first tap after the count did not start the pattern: expected null to be …*) |

**Exit codes** (`chain.txt`):

| Step | Exit | Result |
| --- | --- | --- |
| `npx vitest run tests/unit/drillLifecycle.test.ts`, the untouched base | 0 | 38 of 38 |
| The same, with the extended test file on the committed source (red) | 1 | 5 failed, 38 passed |
| The same file, on the final tree (green) | 0 | 43 of 43 |
| `npx tsc -b`, final tree | 0 | |
| `npm run lint`, final tree | 0 | |
| Mutants, final tree | 0 | 8 killed |
| `npx vitest run`, the whole unit suite, final tree, built content copied read-only | 1 | 5 failed in 4 files, none touched here |
| The non-environment failures run alone | 1 | 2 failed (`lessonClaimsAboutApp` blues.3, 4.7); `expectedNote` passed |
| The same with the base `DrillScreen.ts` swapped in | 1 | the same 2 failed |
| `checks_for_paths.py` over the two paths | 0 | |
| `npm run build:app`, final tree | 0 | |
| Playwright | not run | no mutant survived jsdom |

The whole-suite failures, each named in Entry 196 as unrelated to this seam:
- **A fresh worktree's environment:** `midiParity` (no reference) and `taughtByAncestry` (no `build/rung-claims.json`).
- **Passes alone:** `expectedNote` (a 5000 ms timeout under the suite's load).
- **Fail alone, and the same with the base `DrillScreen.ts`:** `lessonClaimsAboutApp` blues.3 and 4.7, the line-ending claims Entry 101 diagnosed.

Entry 196's `lessonClaimsAboutMusic` blues.5/rock.7 and `demandsOfFiles` failures did not recur. Inferred, not checked: the main checkout's built content changed since.

## What passes, and what is unverified beside it

- **Passes:** the 43 cases in jsdom, with the real `Metronome` and a faked clock; the 8 mutants; typecheck, lint and the app build.
- **Unverified on a device:** what a phone's start does at a card's open; whether the paused line shows for a moment on an ordinary first open; whether a phone honours the ask inside the tap. The double models the first and the last; none was observed on a device. The hold is built so that each of them holds the card rather than judging it.
- **Unverified in a browser:** the six specs the map names were not run (no jsdom survivor). Two of them open a rhythm card by URL and wait for *Count-in* (`feedback-placement.spec.ts:48`, `:65`). Inferred, not run: they still pass. The base's count can tick there only if the context runs, and a context that runs lets the wait go ahead, on its first reading or on the `statechange` that reports it.
- **Not heard:** nothing. No musical claim is made.

## Done

1. **The refuting test, red first:** Part A as the brief sets it, Part A with the sound suspended, Part B and Part C, plus the *Again* entry point. Five cases, all red at the base; the hypothesis is confirmed.
2. **The two guards:** the sound already running (CL05a/CL05b's rhythm cases) and no Web Audio (CL05b's case, which opens its card with none). Both are green and unmodified.
3. **`openRhythmCard`:** CL05b's `whenSoundRuns`, `showSoundPaused`/`hideSoundPaused`/`wakeSound`/`wakeSoundByKey` and the gate, reused directly, with the `supported` guard and a recorded `top` hold.
4. **The four brief mutants,** each killed by a named case, plus four more (the third brief mutant in two forms).
5. **CL05b's 38 cases** unmodified and green.
6. **The chain:** `npx tsc -b`, `npm run lint`, the whole unit suite (failures named, the same on the base source), `checks_for_paths.py` and `npm run build:app`.
7. **This entry and the kept logs.**

## Not done

- **The six browser specs the map names:** not run, per the dispatch, since no mutant survived jsdom. They stay with the landing chain.
- **The device check:** there is no device here.
- **The doc rows:** proposed below, not written. Neither file is owned here, and CL05/CL05a/CL05b's rows are still unwritten: `docs/08-test-map.md` has no `drillLifecycle` row, and `docs/04-ui-spec.md` has no R7 or *Sound is paused* (both searched by grep).

## Follow-ups (observations, attached to this cluster; recorded, not built)

1. **The app-wide first-tap start can make a key the way back on a first open.** `main.ts:34` arms `audioEngine.startOnFirstGesture(window)`, a one-shot `pointerdown`/`keydown`/`touchstart` listener. On a first open with no tap yet in the visit (a reload, or a link straight into a drill), it is still armed, so a key on the screen strip or the computer keyboard also asks for the sound. The key is refused, not judged, but it wakes the sound, where CL05b says a key asks for nothing. Inferred from the code; the jsdom cases do not run `main.ts`. Neither file is owned here.
2. **With the microphone listening, the paused sentence can be overwritten.** If the microphone is listening and *Again* opens a card whose sound is not running (rare: an open microphone means a running context), `playPrompt`'s muted-playback line replaces the paused sentence while the card stays a button. `advance()` calls `playPromptWithHelp` after the rhythm start. Inferred, not tested.
3. **X43 is inherited, unchanged.** The first-open count is the same `startCountIn`, so the click still stops on the downbeat. Not created or fixed here.

## Questions

1. **A start that fails outright on a browser that has Web Audio: hold, or carry on?**
   - **What is built:** the card holds — paused, judging nothing, each tap on the card asking again — because the existing wait reads a failure through the same state check (`whenSoundRuns`, `.then(check, check)`).
   - **Precedents:** this matches CL05b's return and the Score screen's ▶ (`responses/970fd770.md`: "do not continue silently when the bounded audio start fails … a later user tap should retry").
   - **The base:** carried on silently, *No metronome — …*, with the first tap starting the pattern.
   - **Why it is a question:** the reviewer's question-1 ruling (`responses/1a89de52.md`) names two cases, no Web Audio capability (carry on) and a context that is suspended or unanswered (hold). It does not name a start that fails.
   - **The cost of overturning:** one branch in `openRhythmCard` on the start's rejection, and one case. Nothing is blocked meanwhile.

**Orchestrator's note at the landing (2026-10-01).** X45's worktree committed by name (02094a2e) and merged (037e2bfb). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/X45/map-min.txt`), typecheck, lint, the whole unit suite, the app build, the spec names checked, then the specs the map's minimum names on the default port (map-tests 0; map-min 0; tsc 0; lint 0; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/X45/orchestrator-exit.txt`). The reviewer's own ruling on CL05b keeping this gap as its own row (`responses/1a89de52.md`, “X45 — first-open start never answers”): “Keep X45 as its own row, P1 … It owns the first-open latch/start boundary and should prove the same principle there: no judged rhythm timing against an inaudible/unestablished pulse … Do not fold X45 back into this fast-path seam now; CL05b's return-from-hidden invariant is correctly closed.” The brief (`X45-a-rhythm-card-never-judges-before-its-pulse.md`) is pre-reviewed and dispatched, not a fast-path required change; what it decides — a first-open rhythm card holds until `audioEngine.state` reads running, the same held-card resume affordance when a gesture is needed, no Web Audio carries on at once — is settled by the orchestrator under the entailed-decision rule (`operating-procedure.md` §11), since it is CL05b's own already-approved rule for the identical principle, read one edge earlier, not a new product choice. Dispatched at `e0802d75` (`git log -1 --format=%h` in the worktree before any edit).. a rhythm card never judges before its pulse; shared landing chain with U118

## Doc rows (proposed, not written)

**`docs/04-ui-spec.md` §0 R7**, after CL05b's proposed sentence:

> A rhythm card's first open — the set's first card or *Again*'s — is held the same way: nothing is judged until its sound is actually running, the card says *Sound is paused — tap to continue.* and is the one way back while it is not, and then its ordinary count-in plays. With no Web Audio it carries on at once (X45).

**`docs/08-test-map.md`, CL05's proposed row *A practice screen while hidden*.**
- What it guards adds: *a rhythm card's first open judged before its sound runs, or counted in on a standing clock; the paused card missing there, or reachable by a key; an unsupported browser held*.
- Its tests cell becomes `drillLifecycle.test.ts` (43: … 9 CL05b, 5 X45), red first; 8 more mutants caught (X45, Entry 202).

## Content

Nothing under `content/` or `scores/` changes, and no copy is added or changed. `SOUND_PAUSED` is CL05b's string, unchanged; it is now also shown on a first open whose sound is not running. That is the timing and interaction itemised under *Judgement*, not new text.

## Files

- `app/src/ui/screens/DrillScreen.ts`
- `app/tests/unit/drillLifecycle.test.ts`
- `docs/prompts/runs/X45/` (this entry, `unit-red-committed.txt`, `unit-green.txt`, `mutants.txt`, `chain.txt`)
