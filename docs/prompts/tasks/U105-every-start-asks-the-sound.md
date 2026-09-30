# U105 — every tap that starts the sound asks for it through `withSound`, and a refusal names the control tapped (backlog U105, P2; a G86a follow-up, Entry 165; app only; to the reviewer before dispatch)

**Read first:**
- **Procedure.** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13.
- **The row and its rulings.** `docs/prompts/backlog-2026-09-25.md`:166 (U105). `docs/review/responses/970fd770.md`:49–51: *"Any genuine user-activated path that can begin audible playback should eventually share the same audio-start gate. MIDI input remains different because it is not a browser user activation."* `responses/questions-ecccffb7.md`:30 (the six kept out of G86a). `responses/d5508d7b.md`:13–26 (keep the control-specific sentence), :41–46 (the phone check stays the owner's), :50 (U105 real; G86a not reopened).
- **What G86a built,** `app/src/ui/screens/ScoreScreen.ts` at 034d4039:
  - :436–444 `soundRefusedBy` (`'play' | 'hear'`); :493–497 `stopWatchingSound` (the sound starting clears it);
  - :2859–2896 `withSound(act, tap)`: at once where running or no Web Audio, clearing the refusal (:2860–2862); a second tap returns (:2865); the old refusal cleared as it asks (:2870); refused where not `running` (:2885–2886); the bound :2893; the ask :2895;
  - :2904–2918 `drawPlayHold` (`data-sound-refused` on ▶ or *Hear it*); :2921–2923 `refusedNow`; :4201–4217 `drawWaitingFor` (the sentence first); :4228–4232 `soundOffLine`;
  - gated today: ▶ :2798, *Hear it* :2516, Space :5251–5262 (its act re-checks `spaceMayStart`, :5258).
  - `app/src/ui/help.ts`:495, `soundOff: (control: '▶' | 'Hear it')` → *Sound did not start — tap {control} again*; `app/tests/unit/help.test.ts`:165–166, the join; `docs/04-ui-spec.md`:2026–2030 (§5), :3144 and :3168–3169 (§5f); `docs/01-architecture.md`:235; `docs/08-test-map.md`:347, :596.
- **The taps that start without the gate, at 034d4039.** The row's lines have moved; each calls `startRun` directly.

| Control (id) | Lines | What it starts |
|---|---|---|
| *Carry on from bar N* (`score-resume-go`) | :1030–1044 | sets `loopBars` from the stopped bar to the end, forgets the unfinished record, hides the offer, then a run (:1041) |
| *Start again* (`score-restart`; the ⋯ row :1826) | :1172–1186 | ends a demonstration if one plays, then a run from bar 1 (:1184) |
| a hand after *Nothing for the … hand* (`score-hands-{id}`; the refusal :2255–2264) | :1327–1346 | sets the hand, then a run (:1344) |
| long-press a bar | timer :2985–2999; `hearBar` :3022–3031 | a one-bar preview, `startRun({ preview: true })` |
| *Try again* (`session-try-again`, `app/src/ui/sessionRunner.ts`:338) | :3730 | a run again. **Not in the row.** |
| summary *Again / Slower (−10%) / Faster (+10%)* | :4003–4013 | a run; Slower and Faster change `tempoPct` first |
| summary *Loop the weak bars* (`summary-loop`) | :4045; `loopWeakBars` :4161–4173 | a two-bar loop on the worst bar, then a run (a section repeat) |
| `startFromKey` | :2077–2091, from `feedNote` :2047 | a run, the key fed as its first note where there is no count-in (:2087–2090). Reached from a MIDI key and from the on-screen keys (:2116; `app/src/midi/ScreenKeyboardSource.ts`:60–64, as a touch begins) |

- **The interaction G86a read and did not run** (`docs/prompts/entry-165.md`:54). `startRun` (:2151–2191) never touches `soundRefusedBy`, and `refusedNow` shows the sentence while the engine is not running. So a direct start under a standing refusal leaves *tap ▶ again* up while ▶ reads ⏸, and a tap on ⏸ pauses.
- **Not U105's.** Each restarts a run already going or holds it paused, so none begins sound from silence: `restartForOption` :2607–2622, the ladder :2434–2436, `endDemonstration` :2557–2593 (its `'play'` is ▶'s, already gated).

## What is decided

1. **Closes U105.** The row's question (the sentence) was answered by G86a. The phone check stays *unverified on a device*. The row's *a disabled ▶ may lose keyboard focus* stays recorded (`entry-165.md`, Follow-up 5); not this lane's unless observed.

2. **Hypothesis and refuting test.** Each tap in the table calls `startRun` directly, not through `withSound`. So with the audio still suspended it starts a run nobody hears, and ▶ reads ⏸. The discriminating test, per tap: engine `suspended`, `ensureStarted` never settling. On the base the run starts at once (red); after the fix nothing starts (green). If a tap already routes through `withSound`, or cannot begin audible playback, it is not U105's: say which, and drop it.

3. **One gate, every tap.** Each tap runs its **whole handler** as `withSound`'s act, not `startRun` alone, so a refusal changes nothing the tap would have changed: *Carry on*'s offer and record stay; Slower and Faster leave the tempo (changed first, a retry would lower it twice); no loop is set; the hand is unchanged; the summary stays up; a demonstration under *Start again* goes on. The named control is still on screen to tap again. The act re-checks its own precondition when it runs, as Space's does (:5258). `withSound`'s `tap` widens to name the control, `soundOffLine` names it, and the tapped control carries `data-sound-refused` while the refusal stands. No new busy display: only ▶'s tap shows one (G86a), and a second tap in the wait does nothing. The no-op re-press of the chosen hand (:1333–1336) stays outside the gate.

4. **The sentence names the control tapped** (`d5508d7b.md`:15–22). `help.ts` gains no sentence. `soundOff`'s parameter widens, and its output for ▶ and *Hear it* stays byte-identical. The template does not fit two cases as it stands:
   - Labels ending in *again* would read *tap Start again again*, *tap Try again again* and *tap Again again*. One fix: drop the trailing *again* for them.
   - The long-press is not a tap. Find honest words for a hold inside the same sentence; the verb may travel with the control.

   Use short names where a label would pass the forty-odd characters the line shows at 342 px (`04` §5f): *Slower*, not *Slower (−10%)*. The copy stays *unverified as copy*.

5. **`startFromKey`.** Not a browser user activation (the ruling above); the row's *"an ask there would be ignored"* is inferred and platform-dependent. Decide from the code. The engine runs there when an earlier gesture started it and nothing suspended it since; `withSound`'s at-once path then runs the act synchronously and the key is still fed as the first note. Where it is not running, choose and record: **(a)** `withSound(act)` as it is (the ask comes outside a transient activation, and an act that runs feeds a key up to `PLAY_SOUND_WAIT_MS` old, :2089); or **(b)** the same state check without the ask or the wait, refusing at once. This brief leans (b). Either way the sentence names ▶, whose tap can start the sound; if neither fits, record why not. The on-screen-keys route (:2116) is decided the same way.

6. **The standing refusal: one rule.** The sentence never stands while ▶ reads ⏸. A tap through the gate clears the old refusal as it asks (:2861, :2870) and sets its own if refused; any start that begins playing clears it, in one place covering every start (for example `startRun`, for a run not held paused); a start held paused keeps it (still true; ▶ reads ▶).

7. **Deviations from the row, with reasons.** Seven taps, not six: *Try again* (:3730) starts a run from a tap; gate it in the Score screen's `tryAgain` closure, `sessionRunner.ts` untouched. `startFromKey` is also reached from the on-screen keys. The long-press asks from a timer 400 ms after `pointerdown`, before a touch lifts (:2985–2999): whether the platform honours it is inferred, and the gate reads the state at the end, so it is honest either way. The row's lines have moved (the table). The builder's own deviations go in the entry with their reasons.

## Verification layers

**Unit, red first on the base.** Extend `app/tests/unit/scoreSheetsCloseAndPlayStartsSound.test.ts`, which has the engine double and helpers, or add a file with its `08` line. `scoreSummaryTruth.test.ts`:528 reaches the summary's buttons, and `sessionTransition.test.ts`:157 shows *Try again*. One table, a row per control (how to reach it, how to tap it, what a refusal leaves unchanged), three cases a row:
- **never answers** (fake timers, `ensureStarted` never settles, advance `PLAY_SOUND_WAIT_MS`): no run, the row's unchanged facts, the sentence naming the control, `data-sound-refused` on it. Red on the base; record the red line;
- **fails** (`ensureStarted` rejects): the same;
- **answers `running`**: the handler runs once, as before.

**`startFromKey`**: engine running, the key starts the run and is fed at once (preserved); not running, the chosen rule's outcome. **The rule (item 6)**: a refusal standing, another path starts a run: the sentence and ⏸ never together; a restart held paused keeps it. **Preserved**: G86a's cases (:431–770) and `help.test.ts`:165–166, unchanged and green.

**Browser: one case, for the most-used tap, the summary's *Again*.** It follows every judged run, whereas *Start again* takes two taps and *Carry on* comes once a visit. In `score.screen.spec.ts`'s U69 describe (:1187), on its captured context and G86a's never-answering stub (:1217–1228): finish a run (the file already reaches `summary-again`); suspend, stub `resume`, tap *Again*; after the bound (poll, never a fixed sleep) `data-running` is not `true`, `#score-summary` still shows, `#score-waiting` is visible above the sheet naming *Again*; remove the stub, tap *Again*: running, the sentence gone. Red on the base. If the line is not visible with the sheet up, stop and raise a Question with the picture; build no new surface. (`summaryUp`, :4135, makes the head inert, not hidden; `.summary-sheet`, `style.css`:3420, is a bottom sheet at most 72 % high.) **The picture:** the refused summary at 342 × 740, in `docs/prompts/pictures/u105/`.

**Mutants,** each killed and recorded: one tap left ungated (Slower), by its never-answers row; the sentence naming the wrong control (▶ for *Carry on*), by the table's sentence assertion; the refusal not cleared (item 6's clear removed), by the rule case (if no start reaches that clear once every tap is gated, the mutant is equivalent: say so and why).

**Chain.**
- `npx vitest run` on the touched unit files, then the whole suite. The two `lessonClaimsAboutApp` CRLF claims may fail on this checkout; name them if they are the only red.
- `npx tsc -b`; `npm run lint`; `npm run build:app`; `npm run states`.
- `python tools/docs/checks_for_paths.py <every touched path>`, then every spec it prints. Check each spec file exists before the run. Two workers, port 4773.

No new spec is planned: the case lives in `score.screen.spec.ts`, which `docs/prompts/checks.json`:46 already maps under `app/src/ui/screens/ScoreScreen.*`. A new spec file needs its row there and its `08` file line.

## Rules and files

**You own:**
- `ScoreScreen.ts`: the taps above, `withSound`'s `tap`, `soundOffLine`, the mark and the clear;
- `help.ts`: `soundOff`'s parameter and its comment, nothing else;
- `help.test.ts`'s join;
- the unit file, the one browser case and the picture;
- direct doc edits, as G86a's stood (`970fd770.md`:15): `04` §5 (:2026–2030) and §5f (:3144, :3168–3169), `01`:235, and `08`:347 and :596. List each under `## Doc rows`.

**Not yours.** Lanes in flight: U32 `WindowRenderer.ts`; G96 `projectStore`, `projectSheet`, `widgets.ts`, `LibraryScreen`; U63 `TodayScreen`, `style.css`. Also `AudioEngine.ts`, `main.ts`, `sessionRunner.ts`, every other screen (an ungated start found there is a Follow-up), `tools/**` and `content/**`.

**Harness.**
- Own worktree from origin's head (HEAD at drafting 034d4039; state the base), set up as G86a's (`npm ci`, `parity_reference.py`, the content build with caches copied read-only, `inventory.md`, `rung-claims.md`, `SOURCES.md` snapshotted and restored); never commit, push, stash, reset or checkout; never write in the main checkout.
- Port 4773 through a config copy under `app/build/u105/` with an absolute `storageState` path, never 4173; temp under the worktree's `build/`; no log over 300 KB (keep the summary and failing names); at the end delete `app/dist`, `app/test-results`, `app/node_modules`, the copied caches and the config copy.

**The rules.** Never name an AI model. Never assert a number measured on this machine. Every item done, or an explicit not-done line. When a premise here is wrong, say so, take the better path and record why.

## Report

**Judgement first:** the refused summary at 342 × 740, what the learner reads and where, with *unverified on a device* and *unverified as copy* in the first lines; per control, what a refused tap does and which layer observed it; the `startFromKey` choice and why; the standing-refusal rule. **Then** Done / Not done / Follow-ups / Questions / Files; per fix the mechanism, the discriminating test and its red line; the tests table with each class (add, preserve, replace) and the old assumption; exit codes; the unverified beside what passes; `## Doc rows`. Technical and pedagogical verdicts separately (pedagogical: not applicable). Every run file goes under `docs/prompts/runs/U105/`. The entry is `docs/prompts/runs/U105/ENTRY.md`, starting `### Entry 172 — U105`, with the number the dispatch gives.
