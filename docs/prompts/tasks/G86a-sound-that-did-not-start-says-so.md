# G86a — ▶ that could not start the sound says so and starts nothing: where the wait ends with the audio still not running, the run is not started or carried on and *Hear it* is not ended, ▶ reads ▶ again, the state line says in one sentence that the sound is off and to tap ▶ again, and the next tap asks the engine again (the G86 review's required change, `responses/970fd770.md`:30–47; Entry 165; app only; the reviewer's required change, sent to the reviewer before dispatch; its builder starts only on the reviewer's word (the owner's rule of 2026-09-30: every brief reviewed first))

**Read first:**
- **Procedure.** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13.
- **The ruling.** `docs/review/responses/970fd770.md`: :30–47, the required change, quoted in item 1; :19–28, the gate's placement approved (keep it: real user activation, one gate for Play, Space and the *Hear it* return, the pause never waiting, nothing on visibility change, a bounded wait); :15, the lane's direct doc edits accepted; :49–51, U105 (not this lane's).
- **The seam this amends.** `docs/prompts/tasks/G86-sheets-close-with-the-screen.md`: item 5 (:11), *"then starts or resumes the run whether or not the start settled"*, the fail-open this reverses; its approval note (:29), *the bound is a fail-open UI bound, not evidence audio resumed*. `docs/prompts/entry-158.md`: :10–14 (what ▶ does now; :14, the never-answering start pictured, after which ▶ read ⏸, the run carried on and the context was still `suspended`), :56 (its Question 1, the sentence, which this lane answers), :50 (its Follow-up 2, now U105, `docs/prompts/views/backlog/U.md`:166).
- **The code at HEAD c5988012,** `app/src/ui/screens/ScoreScreen.ts`:
  - :204–215, `PLAY_SOUND_WAIT_MS` and its comment, whose last sentence (*"Past it the run starts or carries on as it did before this wait existed, silent until something starts the sound"*) this change makes false;
  - :424–431, `startingSound` (shared with *Hear it*) and `playWaiting`;
  - :2465–2493, `toggleHear`, U67's own gate: unbounded, sharing `startingSound`;
  - :2533, `endDemonstration` (the *Hear it* return is `'play'`);
  - :2761–2775, `togglePlay`; :2777–2798, `playNow` (:2788–2791, the *Hear it* return); :2801–2844, `withSound` (:2819, the at-once path; :2823, the guard; :2828–2838, `go`; :2839, the bound; :2840–2843, the start, whose `.catch(() => undefined)` turns a failure into an answer); :2846–2859, `drawPlayHold`;
  - :4137–4150, `drawWaitingFor`, the state line's order (paused, the first note, demonstrating, the note names, the ready line), written through `helpStrip.setNow`; :4165–4173, `pausedLine`; :4184–4190, `hearingLine`; :4410–4411, `render` calls it first; :4550–4557, ▶'s glyph and label from `playing`, then `drawPlayHold`;
  - :1162–1166, ▶ built; :5154–5180, Space (`spaceMayStart`, its own `withSound`).
- **How this screen shows a sentence today.** The state line, `#score-waiting` (:849–853), is the help strip's now line (:927–956; `app/src/ui/helpStrip.ts`:110–111, `role="status"`, `aria-live="polite"`; :176–185, `setNow`, `isDefaultNow`), written only by `drawWaitingFor`. Sideways, and with the chrome folded, it is mirrored into `#score-status-side` at the bar's left end and into the stage's corner (:1060–1098, `syncBarLeft`; :1093, a line the run wrote wins over the status line). `#score-status` (:824–826) is for messages that are not about the transport (:611–619). Upright the bar holds only controls (:1066–1068, *"the header is still the right place upright, where the bar is full"*). No toast: `app/src/ui/toastStack.ts` is used by `errorBoundary.ts` and `updateToast.ts` alone (a grep of `app/src`). A refused `⋯` row says why on its label, which ▶ has no room for.
- **The words.** `app/src/ui/help.ts`:440–485, `STATE_TEXT`, the state line's sentences, naming ▶ by its glyph (*"Paused — ▶ to carry on"*). `app/tests/unit/help.test.ts` from :144, the join: every `STATE_TEXT` sentence is printed in `04` §5f. `docs/04-ui-spec.md` §5f: :3128–3135, the state line's order; :3137–3156, *The run's own sentences*, and :3140–3141, *"at 342 px the state line holds about forty characters and cuts the rest with an ellipsis"*.
- **The engine.** `app/src/audio/AudioEngine.ts`:55–63 (`supported`; `state`, where anything but a running context reads `suspended`), :80–94 (`ensureStarted`: creates the context, awaits `context.resume()` where it is not running, rejects where there is no Web Audio), :158 (`onStateChange`).
- **The docs that state the fail-open.** `docs/04-ui-spec.md`:2013–2025 (*"then start or carry on whether or not it answered: a start that never answers leaves the run as silent as it was, never a button that did nothing"*); `docs/01-architecture.md`:231–235 (*"goes on whether or not the start answered"*); `docs/08-test-map.md`:15 (the Session row: *"or at `PLAY_SOUND_WAIT_MS` with `▶` busy until then"*), :346 (the spec's U69 case) and :595 (the unit file: *"act once it answers or at the bound"*).
- **Tests.** `app/tests/unit/scoreSheetsCloseAndPlayStartsSound.test.ts`: the header, :13–19 (*"act whether or not it settled"*); the engine double, :62–79 (`state` set by each test; `ensureStarted` resolves without moving `state`); the helpers, :231–270 (`open`, `byId`, `click`, `session`, `settle`, `pressSpace`); U69's cases, :353–479, of which :375–396 (*never answers … then the run carries on*) and :398–404 (*a start that fails still carries the run on*) assert what this lane reverses. `app/tests/e2e/score.screen.spec.ts`:1171–1215, U69's captured-context case. `docs/prompts/runs/G86/scripts-pictures.spec.ts`:37–93, G86's probe, whose `ctx.resume = () => new Promise<void>(() => undefined)` (:80) is the never-answering stub pictured as `pictures/g86/play-busy-fixed.png`. `app/tests/e2e/score.hearIt.spec.ts`:17–22 (this Chromium starts and resumes contexts without a gesture).

## What is decided

1. **The ruling, verbatim** (`responses/970fd770.md`:30–47):

   > ## REQUIRED CHANGE — do not continue silently when the bounded audio start fails
   >
   > The current timeout path still advances into playback after one second even if the AudioContext remains suspended. That reproduces the learner-visible failure in a quieter form: the UI says playback is happening while nothing can be heard.
   >
   > When the bound expires and audio is still not running:
   >
   > 1. **do not start/resume the musical run silently;**
   > 2. restore the Play control to its non-playing state;
   > 3. show one concise, actionable sentence at the control that caused the failure;
   > 4. a later user tap should retry the same `ensureStarted()` gate.
   >
   > The exact words belong in `help.ts` / the UI vocabulary, for example the semantic shape “Sound is off. Tap Play again to enable audio.” The final wording can differ, but it must tell the learner that sound did not start and what to do next.
   >
   > Do not turn a one-second timeout into proof that audio is unavailable forever, and do not automatically navigate or reset the run.
   >
   > Add an adversary with `resume()` never resolving: after the bound, the run has **not** started, the button is not in a playing state, and the message is visible.
   >
   > This blocks G86/U69 closure because silent continuation is the exact product failure this seam exists to prevent.

   The goal in this brief's words: ▶ never says a run is playing when nothing can be heard. Where the sound could not be started, the learner is told so at once, in one line, and the button that failed is the one that tries again.

2. **The mechanism, as a hypothesis with its test.** `withSound`'s `go` (:2828–2838) runs `act()` however the wait settles: at the bound (:2839), on the start answering, or on the start failing, which `.catch(() => undefined)` (:2842) turns into an answer. It never reads the engine's state. So a start that never answers, or fails, starts or carries on the run against a suspended context. G86 observed this in the browser (`entry-158.md`:14), and its unit cases assert it as intended (:375–404). The adversary (item 5a) decides. If it comes out green on the committed screen (no run after the bound), stop and report that the premise is false.

3. **The rule: one check where the wait settles.** When `withSound`'s wait settles, by whichever comes first of the bound, the start answering and the start failing, `act` runs only where `audioEngine.state === 'running'` at that moment. Otherwise:
   - **Nothing starts, carries on or ends.** No `startRun`, no `session.resume()`, and no `endDemonstration('play')`, so a demonstration under ▶ goes on. No `session.stop()`, no navigation, no reset. A paused run stays paused at its bar, and a ready screen stays ready.
   - **▶ reads its non-playing state:** `▶`, `aria-label` *Play*, enabled, no `aria-busy`, no `data-starting-sound` (`drawPlayHold`; `render`, :4550–4557).
   - **One sentence on the state line** (item 4). While it stands, ▶ carries a `data-` attribute (named by the builder), so a spec that meets a refusal says so.
   - **`startingSound` and `playWaiting` are clear,** so the next ▶ or Space tap passes the same gate and calls `ensureStarted()` again, inside that tap. Nothing records the engine as unavailable. Every tap asks, and a tap that finds the engine running acts at once, as today.

   **Why one check and not the bound alone.** The ruling's heading is the start *failing*. A rejected start leaves the run as silent as one that never answers. So does a start that answers with the context still not running, because the engine reads anything but `running` as `suspended` (`AudioEngine.ts`:59–63). The engine's state is the one fact every path shares. If the builder finds a path where the state reads `running` and nothing can be heard, or the reverse, it deviates and says so.

   **Unchanged.**
   - With no Web Audio (`!audioEngine.supported`), ▶ acts at once, as today: no tap can ever start that sound, so a sentence telling the learner to tap again would be false.
   - The pause never waits.
   - A second tap during the wait does nothing.
   - Leaving, or a new session, during the wait cancels.

   **The late answer.** A start that answers after the bound has refused comes after the tap's moment. Nothing starts: a run beginning by itself, after the learner was told it had not, would be a surprise of its own. But the sentence goes, because it is no longer true. The line is drawn only while the engine reads not running, and the screen redraws. The same holds where the sound starts by another path while the sentence stands (*Hear it*'s own gate): the next redraw drops it. How the late answer reaches a redraw is the builder's choice, and the entry says which: the pending start's continuation, or `audioEngine.onStateChange` (:158) with its unsubscribe in the disposer.

4. **The sentence, and where it stands.**
   - **Where.** On the state line, `#score-waiting`, which is where this screen already writes what the run is doing. It is first in `drawWaitingFor`'s order while the refusal stands, ahead of the paused line, so it is read over *Paused — ▶ to carry on…* and over *Playing it to you…*. Sideways, and with the chrome folded, it reaches the bar's left end beside ▶ and the stage's corner, by the mirror's own rule (:1093). A screen reader hears it through the line's polite live region.
   - **Not `#score-status`,** which is for messages that are not about the transport (:611–619).
   - **Not a new element beside ▶.** Upright the bar holds only controls (:1066–1068), and text added there is new layout on the screen the sheet is fitted to.
   - **How it meets "at the control".** The sentence names ▶, as every state-line sentence that asks for a tap does. Sideways it sits beside ▶. Upright it is the header's line over the notation, where *Paused — ▶ to carry on* already is. The picture judges whether a learner connects the sentence with the button. If the builder judges from the picture that they do not, that is a Question with the picture, not a new element built.
   - **The words.** A new `STATE_TEXT` entry in `help.ts`, in the reviewer's semantic shape: *the sound did not start; tap ▶ again*. ▶ is named by its glyph, as `STATE_TEXT` names it. What matters comes first, inside the forty-odd characters the line shows at 342 px before its ellipsis (`04` §5f :3140–3141). For example: *Sound is off — tap ▶ again to turn it on*. The final wording is the builder's, and the report says *unverified as copy*.
   - **The join.** One bullet in `04` §5f's *The run's own sentences* prints the sentence, and `help.test.ts`'s join gains it, so the two stay the same sentence. §5f's order sentence (:3132–3135) gains it at its head.

5. **Red first, unit** (extend `scoreSheetsCloseAndPlayStartsSound.test.ts`). The engine module is mocked, so the double's `ensureStarted` stands in for `resume()`.
   - **(a) The adversary.** The engine is `suspended`, `ensureStarted` never settles, and timers are fake. Press ▶ on a paused run and advance `PLAY_SOUND_WAIT_MS`:
     - `session.resume` is not called;
     - ▶ reads `▶` / *Play*, enabled, with no `aria-busy` and no `data-starting-sound`;
     - `#score-waiting` reads the new sentence.

     Then `ensureStarted` resolves and moves `state` to `running`, and ▶ is pressed again: `ensureStarted` has been called twice in all, the run carries on, and the sentence is gone. Red on the committed screen, where the run carries on at the bound; the red line is recorded.
   - **(b)** The same for a fresh start (`starts` not called) and for Space's start.
   - **(c)** ▶ over *Hear it*, refused: `data-hearing` stays `true`, and nothing is started.
   - **(d)** A failing start (`ensureStarted` rejects): refused, with the sentence.
   - **(e)** A start that answers with `state` still `suspended`: refused, with the sentence.
   - **(f)** The late answer: the bound refuses, then the start answers with `state` `running`. The sentence is gone, nothing has started, and ▶ reads ▶.
   - **(g)** The sideways mirror: `#score-status-side` carries the sentence.

   **Replaced, with the reason and the class (§11).** :375–396 becomes (a), and :398–404 becomes (d). Both asserted the fail-open the ruling reverses.

   **The double corrected.** The success cases (:365, :430, :445, :455) resolve `ensureStarted` without moving `state`, which the real engine never does: `ensureStarted` returns only after `resume()` has resolved, and a resolved resume leaves the context running. The double's resolve now sets `state = 'running'`, with the reason written in the file, so those cases keep asserting what they asserted. The header comment (:13–19) is rewritten.

   **Mutants,** a budget of three, each killed and recorded: the state check removed; the sentence not set; the waiting flags left set on a refusal.

6. **Browser, in `score.screen.spec.ts`** (U69's describe, :1187–1215).
   - **The case.** A second case, built on the first's captured context:
     1. the ordinary tap spends the first-gesture start;
     2. the page suspends the context;
     3. the context's `resume` is stubbed never to answer, as G86's probe did (`runs/G86/scripts-pictures.spec.ts`:80);
     4. press ▶;
     5. after the bound (poll; never a fixed sleep), assert: `section[data-screen="score"]`'s `data-running` is not `true`; `#score-play` reads `▶`, is not disabled and has no `aria-busy`; `#score-waiting` holds the sentence;
     6. remove the stub (`delete` the own property, so the prototype's `resume` answers) and press ▶ again: the context is `running`, `data-running` is `true`, and the sentence is gone.

     Red on the committed screen, where the run starts at the bound; then green.
   - **The picture.** The refused state at 342 × 740, in `docs/prompts/pictures/g86a/`, from a throwaway probe under the worktree's `build/` (G86's `scripts-pictures.spec.ts` is the shape). Say where the sentence stands relative to ▶, and whether the chrome had folded.
   - **What neither layer observes: a phone.** This Chromium starts and resumes contexts without a gesture (`score.hearIt.spec.ts`:17–22). Android's lock-screen suspend and its gesture rule stay *unverified on a device*.

7. **Fold in *Hear it* — the reviewer's word (`responses/questions-ecccffb7.md`: "Include the unbounded `toggleHear` start gate in G86a. The finding is the same mechanism and the same learner failure: a start attempt that never settles can leave the shared `startingSound` state wedged so Play cannot retry").** Apply the same bounded, checked start primitive to *Hear it* (`toggleHear`): if sound becomes running, *Hear it* proceeds; if the bound expires or the start fails while sound is not running, *Hear it* does not begin and the same actionable sentence appears; the shared waiting flags clear; the next real user tap retries; a late answer clears stale messaging but does not auto-start the demonstration. Red first: with `resume()` never resolving, after the bound *Hear it* has not begun, the sentence is visible, `startingSound` is clear and ▶ still responds (the deadlock the brief found: on the committed code ▶ stays dead). Not folded: the six unrelated U105 run-start controls.
8. **Not G86a's.** Each is recorded with its line.
   - **The six other on-screen taps** (U105, `views/backlog/U.md`:166) **and the MIDI start** (`startFromKey`). U105's own question, the sentence, is answered here. Its six taps still have to pass the gate, which they will inherit.
   - **`toggleHear`'s gate** (U67, :2465–2493). It is unbounded and shares `startingSound` with ▶. A *Hear it* start that never answers leaves the flag set, so every later ▶ returns at :2823: no busy state, no sentence, and no ask. The retry the ruling requires never happens after that tap. This is read in the code, not observed. The builder confirms it with a unit probe, kept in the run folder, and reports the result.

     **Question for the reviewer before dispatch.** Should G86a bound *Hear it*'s wait through the same gate? Its refusal would then say the same sentence and start no demonstration, which changes U67's *"With no sound to be had the demonstration still moves, silent"* (:2473–2474). Or is it left to U105? This brief builds neither until the reviewer rules. Absent a ruling, it is a Follow-up.
   - **Files not to touch:** `AudioEngine.ts`, `main.ts`, `helpStrip.ts`, `widgets.ts`, `style.css`, `ScoreScreen.css`, every other screen, `tools/**` and `content/**`.
   - **The device check.**

## Verification layers

**Unit.**
- Red first (item 5): the extended file on the committed screen, then green.
- Then `npx vitest run tests/unit/scoreSheetsCloseAndPlayStartsSound.test.ts tests/unit/help.test.ts tests/unit/scoreMidRunSettings.test.ts tests/unit/scoreSheetRows.test.ts tests/unit/scoreTourRoute.test.ts tests/unit/firstContactOnTheScore.test.ts`.
- Then the whole `npx vitest run`. The two `lessonClaimsAboutApp` line-ending claims fail on a CRLF checkout and pass on the runner (Entry 101's diagnosis); name them if they are the only red.

**The rest of the chain.** `npx tsc -b`; `npm run lint`; `npm run build:app`; `npm run states`.

**The map.** `python tools/docs/checks_for_paths.py app/src/ui/screens/ScoreScreen.ts app/src/ui/help.ts app/tests/unit/scoreSheetsCloseAndPlayStartsSound.test.ts app/tests/unit/help.test.ts app/tests/e2e/score.screen.spec.ts docs/04-ui-spec.md docs/01-architecture.md docs/08-test-map.md` prints those checks and an e2e line. At drafting it named tsc, lint, the whole unit suite, the app build, the state gallery and the e2e line; `ScoreScreen.ts` alone names most of the Score screen's specs.

**Browser.**
- The new case first, alone, on the committed screen (red), then green.
- Then every spec the map printed, each file checked to exist before the run (a path that resolves to no file is dropped silently), at two workers on port 4641, through a config copy under the worktree's `build/` that is not for the commit. No port 4173.

**The product layer.** The picture. Nothing is heard; the audio half is *unverified on a device*, and the sentence is *unverified as copy*.

## Rules and files

**You own:**
- `ScoreScreen.ts` at: `withSound` and the refusal it records; `drawPlayHold` (the refused `data-` mark); `drawWaitingFor`'s order (the sentence first); and the comments that state the fail-open (`PLAY_SOUND_WAIT_MS` :204–214, `withSound` :2801–2817);
- `help.ts`'s `STATE_TEXT` (one entry) and `help.test.ts`'s join (one line);
- `scoreSheetsCloseAndPlayStartsSound.test.ts`;
- the one case in `score.screen.spec.ts`;
- the picture;
- the doc rows that state the fail-open or the order. These are direct edits, as G86's were accepted (`responses/970fd770.md`:15), each listed in `## Doc rows`:
  - `docs/04-ui-spec.md`:2013–2025 (§5, *`▶` starts the sound as well as the run*);
  - §5f: :3132–3135 (the order), and one bullet in :3137–3156;
  - `docs/01-architecture.md`:231–235;
  - `docs/08-test-map.md`: :15 (the Session row), :346 (U69's spec case) and :595 (the unit file).

**Not yours:** the files item 7 names.

**Base.** Origin's head at dispatch (HEAD at drafting: c5988012), stated in the entry.

**Fresh-worktree setup,** as G86's (`tasks/G86-…md`:21):
- `npm ci` in `app/`;
- `python tools/midi-cleanup/tests/parity_reference.py`;
- `python tools/content/build.py --offline` (Q24), with `content/scores/imported/{kern,musetrainer,mutopia}` and `build/cache` copied read-only from the main checkout. If the build cannot produce `app/public/content`, copy that folder from the main checkout and say so.
- Snapshot `docs/prompts/inventory.md`, `docs/prompts/rung-claims.md` and `content/scores/imported/SOURCES.md` before the build, and restore them after; `git status` shows none of them.

**The rules.**
- Never name an AI model. Never assert a number measured on this machine.
- No commits, pushes, stashes, resets or checkouts. Never write in the main checkout.
- Temp state goes under the worktree's own gitignored `build/`.
- The disk is nearly full. When the run is over, delete the worktree's `app/dist`, `app/test-results` and `app/node_modules`, the copied caches (a copied `app/public/content` among them) and the config copy. Keep no log over 300 KB in the run folder: keep the summary and the failing names, and say the full log was not kept.
- Every item done, or an explicit not-done line.
- When a premise here is found wrong, say so and take the better path, recording why.

## Report

**Judgement first:**
- the refused state at 342 × 740: what the learner sees and reads, and where the sentence stands relative to ▶. *Unverified on a device* and *unverified as copy* go in the first lines;
- what ▶ now does on a start that never answers, fails, answers not running, or answers late, and which layer observed each;
- the reviewer's ruling on `toggleHear`, or the Follow-up.

**Then** Done / Not done / Follow-ups (`toggleHear`'s gate if not ruled in; U105; the MIDI start; the device check) / Questions / Files. After those:
- per fix: the mechanism, the discriminating test and its red line;
- the tests table, with each test's class (replace, preserve, add) and the old assumption;
- exit codes;
- what is unverified, beside what passes;
- `## Doc rows`.

State the technical and pedagogical verdicts separately. The pedagogical one is not applicable: nothing taught or judged changes, and the sentence's wording is a copy judgement. `operating-procedure.md` §11 and §12 apply.

**Entry 165.** Every run file goes under `docs/prompts/runs/G86a/`. The entry is `docs/prompts/runs/G86a/ENTRY.md`, starting `### Entry 165 — G86a`.

**Approved for dispatch 2026-09-30, Hear it folded in** (`responses/questions-ecccffb7.md`). The refusal semantics are right: after any bounded start attempt the musical action proceeds only if `audioEngine.state === 'running'`; a timeout, a rejection, or a start that resolves with the context still suspended refuses the run; Play returns to its ready state; one actionable state-line sentence says the sound did not start and that another tap retries; a late successful resume may clear the sentence but never surprise-starts the run; no-Web-Audio behaviour unchanged. The state line is the surface: no toast, no second transport element. The unbounded `toggleHear` start gate is folded in (item 7): the same mechanism and learner failure, a start that never settles wedging the shared `startingSound` state so Play cannot retry; the same bounded, checked primitive — running proceeds; an expired bound or a failed start with sound not running does not begin *Hear it* and shows the same sentence; the shared waiting flags clear; the next real tap retries; a late answer clears stale messaging without auto-starting the demonstration. The six unrelated U105 run-start controls stay out. Dispatched (Entry 165).
