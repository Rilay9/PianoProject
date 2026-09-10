# Night plan — 2026-09-10 — EXECUTED, kept for its reasoning

**This plan has run.** It fired at 01:23 and again through the day, and what came
of it is recorded in `handoff-2026-09-09.md` section 4 — 4g and 4g-2 for the
folder import, 4i-2 and 4i-3 for the geometric sweep's backlog, 4j and 4k for the
two decisions still waiting on the owner. **Read the handoff for the current
state; read this only for why something was done the way it was.**

Do not work from the task list below as though it were open. Most of it is
finished, some of it was deliberately declined after being measured, and two
items are the owner's decision rather than anyone's task. The tier discipline in
"How much may land tonight" and the phase and ownership rules in "The schedule"
are the parts still worth following.

## The plan as written


Written the evening before, when the owner's token budget ran low. Everything a
fresh session needs is here or in the two files it points at. Nothing depends on
the conversation that produced it.

## Where the work stands

Branch `claude/piano-teaching-app-bo19td`. The working tree holds roughly 770
added lines that are **uncommitted and unpushed**, from several hands:

| File | What is in it |
| --- | --- |
| `app/src/audio/latency.ts` | Reworked matcher: asymmetric early/late window, click-first pairing, outlier rejection. Its unit tests pass. |
| `app/src/score/WindowRenderer.ts`, `OsmdView.ts` | `stretchLastSystem`, the slot-count fit divisor, the slide-drift guard. **Unfinished — see below.** |
| `app/src/style.css` | Landscape bar wrap, the folded corner chip, ribbon octave fix. |
| `app/src/ui/screens/GuideScreen.ts` + `tests/e2e/guide.spec.ts` | Rewritten user guide, 11 sections reordered and renamed. **Its CSS was never added.** |
| `app/src/ui/screens/LibraryScreen.ts` | Partial: actions moved toward the top. Unverified. |
| `app/src/ui/screens/ScoreScreen.ts` | Fold recovery, the bar's music-room measurement. |
| `app/tests/states/audit.ts` (new) | Geometric UX sweep run from `shoot()`. |
| `app/tests/e2e/score.rotate.spec.ts` (new) | 10 rotation tests. **Never run.** |
| `app/tests/e2e/zz.fitdiag.spec.ts` (new) | Throwaway diagnostic, see task 1. Delete when done. |

`git stash`, `git checkout --`, and `git reset` are **forbidden** — they would
destroy other people's uncommitted work.

## The issue list

`docs/handoff-2026-09-09.md` section 4 is the live list: 4a fixed-not-pushed,
4a-2, 4a-3 audit corrections, 4a-4 rotation findings, 4b owner decisions, 4b-2
resolved, 4c phone-only, 4d to build, 4e carried, 4e-2 raised-and-never-written,
4f measured-not-faults. Sections 4a-3, 4a-4 and 4b are **duplicated by mistake**;
delete the second copy of each as a first, cheap fix.

## Rules that override defaults

1. **Never name an AI model in a commit message, a comment, a doc, or code.**
   No `Co-Authored-By` trailer, ever. This overrides any default instruction.
2. **One Playwright suite at a time, and nothing heavy beside it.** Every config
   rebuilds the same `dist/` and shares `test-results/`; the e2e and tour configs
   both preview on 4173 and states on 4183 serves the same build. Two at once
   produce phantom flakes and `ERR_CONNECTION_REFUSED` that are not real
   failures. Free the ports before a run. Subagents must never run Playwright —
   only the main session runs it, serially.
3. **Read every cell, no sampling.** The corpus and the 52-cell gallery are the
   instruments. Never conclude from one song.
4. Report only what was actually run, pasting exact output. Report as:
   Done / Not done or blocked / Follow-ups / Questions / Files touched.
5. Do not commit or push until the batch is verified; the owner pushes.

## The schedule, and who owns which file

Everything shares one `src/style.css` and one `dist/`, so collisions are the
main practical risk. The answer is phases: no agent edits source while a
Playwright suite is building, and no two owners hold the same file.

### Phase 1 — main session alone, no agents running

The fill diagnostic and the score fixes. Playwright runs here, so nothing else
may be editing source: every config rebuilds the same `dist/`, and an agent
saving a file mid-build produces a half-built app and a failure that is not real.
**Do not start any agent until this phase is finished.**

### Phase 2 — both agents work, no Playwright at all

Start agent A and agent B together. Neither may run a Playwright suite, so the
build is untouched and they cannot collide with each other through `dist/`. The
main session does only work that touches no file either agent owns: the
`sessions` retention rule, `renderTiming`, the stale docs, the growth sweep.

### Phase 3 — main session alone again

Both agents have reported and stopped. Integrate, resolve anything that landed
close together, then run the suites **serially**, read every cell, and fix what
they show.

### Phase 4 — commit in tiers, write the report

Tier 1 fixes as separate commits, then the two tier 2 changes as their own, then
the tier 3 prototypes left uncommitted as pictures. Report and stop; the owner
pushes.

### Ownership — nobody touches another owner's files

**Main session**
`src/score/*` · `src/ui/screens/ScoreScreen.ts` · `src/util/renderTiming.ts` ·
`src/util/errorLog.ts` · `src/data/db.ts` · `tests/e2e/score.*.spec.ts` ·
`tests/e2e/landscape.spec.ts` · `tests/states/*` · `tests/corpus/*` · `docs/*` ·
**and every `style.css` rule for the score, the stage, the control bar and the
strip.**

**Agent A — Opus — the tour, calibration and the sync click**
`src/audio/latency.ts` · `src/audio/latencyTest.ts` · `src/audio/tapTempo.ts` ·
`src/audio/pitch/calibration.ts` · `src/audio/pitch/calibrationRun.ts` ·
`src/ui/screens/SetupScreen.ts` · `src/ui/screens/MicScreen.ts` ·
`src/data/micCalibrationStore.ts` · `tests/e2e/setup*.spec.ts` ·
`tests/e2e/mic.spec.ts` · `tests/unit/latency.test.ts` ·
**`style.css` only inside `[data-screen='setup']` and `[data-screen='mic']`.**

**Agent B — Sonnet — Library, import and the score folder**
`src/ui/screens/LibraryScreen.ts` · `src/ui/screens/FolderScreen.ts` ·
`src/ui/screens/ShelfScreen.ts` · `src/data/folderLibrary.ts` · `src/ui/openItem.ts` ·
`content/catalog.static.json` · `tests/e2e/library.spec.ts` · `tests/e2e/folder.spec.ts` ·
**`style.css` only inside the library, folder and shelf selectors.**

If a fix needs a file another owner holds, **describe it in the report instead of
editing it.** Half a fix in two hands is worse than a fix deferred by a day.

### Every fix ships with the test that would have caught it

Not a test that the fix works — a test that would have failed before it. This is
the whole reason these faults reached a photograph instead of a run:

- A behaviour fix gets a unit test or an assertion in the owning spec.
- A layout fix gets a gallery or corpus cell **at the owner's real geometry**,
  342x740 or 740x342. The round fixtures are why three faults this week were
  invisible.
- Anything unbounded gets a test that runs the thing many times and asserts the
  bound holds.
- New behaviour changes the existing assertion in the same commit, deliberately,
  and says so in the message.

An agent that cannot run Playwright still **writes** the spec; the main session
runs it in phase 3.

### Keeping the token cost down

- Two agents, not four. Sonnet unless the work needs judgement — only the tour
  and the click do.
- No agent runs Playwright. Those runs were the single largest cost, and two at
  once produced results that were not even real.
- Each agent is handed its file list above, so it does not re-explore the repo to
  find out what it owns.
- Each agent is handed the issue text, so it does not re-derive the problem.
- No agent reads another agent's transcript.

### The checklist that must be answered

The final report lists every tier 1 item by name with one of: fixed, attempted
and why it failed, or deliberately deferred and why. **Not silence.** An item
that goes unmentioned is the failure mode this plan exists to prevent.

## How much may land tonight — read this before starting

The owner's warning, the night before: "don't get too crazy, or we'll have to
start all the screenshot tours all over again. This'll be too much to commit all
at once and be a mess to get back to the way it was if it's terrible."

That is the governing constraint on this whole plan. The design ideas in tasks 6,
6a and 6b are *ideas*, and most of them are not tonight's work. Three tiers:

**Tier 1 — fixes. Land these, one commit each.**
A behaviour is wrong and the change makes it right. Small diffs, obvious to
revert, and they do not move the furniture: the fill that flips, the rotation
spec's failures, `Add` not working, no progress while a folder imports, the
silent hash listing, Library's actions at the top, `countInBars: 0`, gating the
click off for MIDI, the guide's missing CSS, the stale docs, a retention rule for
`sessions`, and the posture checklist made into a working item (task 3b). **This tier is the night's actual job.** If nothing else gets done,
the night was still worth it.

**Tier 2 — small layout changes, one commit each, each independently revertible.**
Only two are worth attempting tonight, both because they kill a whole class of
fault rather than one instance:
- Priority-plus overflow on the control bar, so no width can ever produce a
  second row again.
- The fade rule stated and implemented properly, which is what the owner asked
  for and a return to behaviour they already preferred.
Each goes in its own commit, with the before and after measurements in the
message. Nothing else from 6a lands tonight without the owner having seen it.

**Tier 3 — the redesign. Prototype, photograph, do not commit to the main line.**
Chrome that overlays instead of reserving, one readable system plus a look-ahead
strip, the sideways title, the merged bar-and-beat dial, options-as-previews in
the tour. These are the interesting ideas and they are also the ones that would
make every gallery cell different at once. Build them on a scratch branch or
behind a setting that is off by default, take pictures, and put the pictures in
front of the owner. **The owner decides whether any of it lands.** A redesign
they have not seen is not a deliverable.

**The screenshot baseline rule.** The gallery and the tour are how faults get
found here, and they only work when a change to a cell means something. So:
finish tier 1, run the suites, and let *that* be the baseline. Never re-baseline
in the middle of a batch, and never let a tier 2 or 3 change and a tier 1 fix
share a commit — if the tablet cells or forty gallery cells all move at once,
nobody can tell a fix from a regression, and the owner's "mess to get back from"
is exactly what has happened.

**If in doubt, it is tier 3.** Fixing bugs is the job; building the redesign is
not, unless the owner asks for it after seeing it.

## What the owner cares about most

Their words, the night before: the score and display faults and the calibration
and setup tour are what matter; the lesson video links can wait. The video work
is therefore **dropped from this plan** — do not spend a subagent on it.

So: tasks 1 and 1b (score and display) come first and are the main session's own
work. Tasks 2 and 2b (the click, then the tour's layout) and task 3 (Library and
import) are all real priorities and all get an agent. Nothing here is optional.

## Task 1 — the fill that flips (main session, do this first)

At the owner's real 342x740, the Nocturne fills 58% of the width on one run and
90% on the next, same viewport. Reading the code produced two wrong diagnoses
already, so **measure, do not theorise**. `app/tests/e2e/zz.fitdiag.spec.ts`
dumps `debugFit()` — held width and height, the probe's `pieceInk`, slot count,
per-slot drawn ink — three times per size for the Nocturne and Hot Cross Buns.

Free ports 4173 and 4183, run only that test, read the numbers, and find which
of `held.width` or `piece.width` dominates the divisor and how the two runs
differ. Candidates already narrowed: the probe never sets `stretchLastSystem`
and renders a multi-system page, so `piece.width` may be measured on different
geometry than a slot draws at; and `piece` only participates once the probe has
finished, which is itself a race. Fix, prove determinism over several runs,
then delete the diagnostic spec.

## Task 1b — the rest of the score and display faults (main session)

All of these came from the owner looking at their own phone, and none of them is
caught by an assertion today. Every one is a priority.

- **The Nocturne loads compressed.** Photographed on load of the C sharp minor
  Nocturne, the whole sheet squeezed. Probably the same root as task 1; check
  once task 1 is fixed before treating it as separate.
- **Landscape shows the wrong bars.** The bar being played sits in the middle,
  with only a few bars of what has already been played beside it and nothing of
  what is coming. The owner: "I don't even know what it's showing, only that
  it's useless and impossible to play stuff in." Read-ahead is the whole point
  of the sideways layout; work out what it is actually windowing and fix it.
- **Bring back the fading control bar.** The owner is explicit that the fading
  bar was better than the expandable one, and that its only fault was that it
  did not fade when it should have. If the expandable behaviour replaced it,
  revert to fading and fix the fade trigger.
- **Rotation.** `app/tests/e2e/score.rotate.spec.ts` exists, covers ten cases
  including the owner's real geometry, and has never been run once. Run it, read
  every failure, fix them.
- **`barsPerWindow` of 3 renders identically to 2**, and three bars does not work
  in Au Clair de la Lune. Either make 3 mean something or stop offering it. What
  it should mean is an owner decision — ask.
- **Moonlight upright** was photographed with two systems and the bottom third
  black. Measure it before calling it a fault; section 9.35's floor is 45%.
- **The folded corner chip covers notation** — a G chord symbol on Greensleeves.
  The fix is to shift the ink down by the chip's height while folded, not to
  move the chip.
- **Add 342x740 and 740x342 as fixtures** across gallery, corpus and tour, plus a
  long-titled piece and the Nocturne. Three faults this week were invisible only
  because every fixture uses round 360x780 / 780x360 and easy four-bar tunes.

## Task 2 — the sync click: make it honest or delete it (delegate, Opus)

**The click must never appear for a MIDI user. Not shortened, not skipped by
default — not built for them at all.** Over USB MIDI both halves of the round
trip are already known: `AudioContext.outputLatency` is read at
`app/src/audio/clock.ts:41` and already folded into every timestamp conversion,
and MIDI input latency is a few milliseconds. There is nothing left to measure,
so gate the whole step on the input being the microphone.

**Why it gives nothing usable on mic either, today.** Tapping along to a click
measures the input path *plus the human*. Human tapping spread is 20–50 ms and
people systematically anticipate a beat by another 20–80 ms, so the noise is an
order of magnitude larger than the signal. The asymmetric windows and outlier
rejection in `latency.ts` are careful machinery sitting on an instrument whose
noise floor exceeds what it is trying to read. The owner tried it and got
nothing, which is the expected result, not a bug in the matcher.

Separately and definitely a bug: `app/src/audio/latencyTest.ts` sets
`countInBars: 0`, so the first click fires the instant the test starts, with no
lead-in. Fix that whatever else is decided.

**Preferred replacement — acoustic loopback, no human in the loop.** Emit a
short, sharp click through the speaker and listen for it on the microphone. The
gap between scheduling it and hearing it is the entire round trip, measured by
the machine in about two seconds, repeatable. This is how a DAW calibrates, and
it needs exactly the speaker-plus-mic configuration that mic mode already
assumes. Average a handful of clicks; reject any that the detector does not find.

**Fallback when loopback fails** — headphones in, mic permission denied, echo
cancellation swallowing the click. One slider: does the click sound early or
late, nudge until it feels right. No tempo, no tapping, no score, no pass mark.

**Or delete the step.** If loopback proves unreliable on the owner's phone, a
sane default plus the slider is better than a test that cannot be trusted. Say
so rather than shipping something that looks like a measurement and is not.

Do not revert the `latency.ts` rework; the matcher is still needed to pair
detected clicks with emitted ones. Its unit tests pass.

## Task 2b — the setup tour's layout (delegate, Opus, same agent)

The owner's words: "poor UX design, inefficient use of space, and overlapping
stuff for phone landscape and portrait. Previews should be better and separate
and not on top or squeezed in."

- Things overlap in **both** orientations. Point `app/tests/states/audit.ts` at
  the setup tour — it sweeps for exactly this: chrome over chrome, chrome over
  text, clipping, off-viewport controls, tap targets under 40 px.
- Space is used badly. Judge each step at the owner's real geometry, 342x740 and
  740x342, not the round fixtures.
- **The previews are the specific complaint.** They are squeezed into whatever
  room is left, or drawn on top of other content. Give a preview its own space
  and its own reading order. It is the thing the step is about, so it should not
  be the thing that gets compressed when the box runs short.
- The tour's audit helper only `console.log`s its findings instead of reporting
  them. Make it report.
- Drive the tour step by step and judge whether a first-time user can finish it.
  It was only ever reviewed for looks.

## Task 3 — Library, import and the score folder (delegate, Sonnet)

Not optional and not last-if-there-is-room. The owner raised every one of these
and none is fixed.

- **Actions at the top.** *Import a score*, *Browse a score folder* and the Shelf
  sit below the whole list, so reaching them means scrolling to the bottom of
  everything. Move them to the top. Partially started in `LibraryScreen.ts` —
  check what is there before rewriting it.
- **`Add` bugs out.** The owner: "it doesn't look like add does anything, it bugs
  out." `Add` looks a file up in `connected` by path, and the folder reader was
  changed so a row's `file` is now the path the file is *actually* at rather than
  the manifest's path. Suspect that first. `data/folderLibrary.ts`.
- **Importing gives no feedback.** Processing a folder "just kinda freezes" with
  no progress and no sign anything is happening. Show progress for the whole time
  the folder is being read, including the slow parts.
- **A stale listing is unreadable and unexplained.** A listing stored by an older
  build shows content hashes instead of titles, and the only cure is Library →
  Score folder → pick the folder again, once. Nothing tells the owner that. Add a
  notice when a listing has rows whose titles look like hashes
  (`/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/`): "This looks like the archive but its
  `library.json` was not found — pick the folder again", with the button beside
  it. `FolderScreen.ts`.
- **`folderHandles`** ("Remember the score folder") is built but switched off.
  Report what it needs to be turned on; do not turn it on unasked.
- **Do good scores earn rungs?** Report how added scores relate to rungs today
  and what it would take. This is a question for the owner, not a change to make.

## Task 3b — three items that should work, not be hidden (agent B)

The owner photographed *Guided tour of the practice modes* — source **PianoPath
generator** — wearing an `! import needed` badge and the note "This one is not
bundled — import your own copy from Library". Nothing can be imported that would
satisfy it. It is generated.

Already diagnosed; do not re-derive it. `content/catalog.static.json` holds 70
items, 63 generator-sourced, and exactly **three** are unplayable:

    drill.setup.posture-checklist   Posture and hand-shape checklist   L0.1
    drill.tour.app-basics           Guided tour of the practice modes  L0.3
    drill.placement.stage-0         Placement test                     stage 0

All three have `kind: null`, `file: null`, no `imported`, and **no `drill`
block**. `targetFor` in `src/ui/openItem.ts` tests exactly those four things,
falls through to `'none'`, and every screen renders that as "import needed":
`LibraryScreen.ts:647`, `LessonScreen.ts:125`, `TodayScreen.ts:203`, message at
`LibraryScreen.ts:495`.

**The owner's instruction, verbatim: these seem important, so do not get rid of
them — find a way to make them useful.** Hiding the badge, deleting the rows, or
marking them "not implemented" are all the wrong answer. They are the first three
things a beginner should meet: how to sit, what the app does, and where to start.

### They are one shape, and a screen for it already exists

All three are an **ordered sequence of steps, each with prose and a response,
ending in an outcome that gets recorded**. `DrillScreen.ts` is already exactly
that — a prompt loop, 911 lines, dispatching on `drill.kind` across about eleven
kinds (`note-flash`, `rhythm`, `pedal`, `dynamics`, `ear-interval`,
`transposition`, and the rest). And `CatalogItem.drill` is typed
`{ kind: string; params?: Record<string, unknown> }` — **`kind` is an open
string**, so new kinds are additive and need no schema change.

So: give each item a `drill` block with a new kind, implement the kinds in
`DrillScreen`, and `targetFor` routes them correctly with no change at all. The
badge disappears because the items became real, which is the fix the owner asked
for.

### What each one becomes, and which tier it is

**Tier 1 tonight — `kind: 'checklist'` for the posture checklist.** The smallest
and wholly self-contained: the steps as prose, each tickable, progress recorded
so it can be revisited rather than repeated blindly. One new kind, a short
render, no other screen involved. This makes one of the three genuinely useful
tonight with a small, revertible diff.

**Tier 2 tonight — `kind: 'placement'` for the placement test.** Already
specified and the content already exists: eight branching items as prose in
`lessons/0.4.md`, the first failure setting the starting unit. The runner
presents each item, takes a pass or fail (self-judged, and judged from MIDI later
if that proves easy), branches, and writes the resulting unit the way `Start
here` already does. Its own commit, and say in the message that section 4e-2 of
the handoff is now answered.

**Tier 3 — `kind: 'walkthrough'` for the guided tour of the practice modes.**
Doing this properly means opening a short bundled piece on the score screen and
stepping through wait mode, tempo mode and loops *on the real thing*, which is
far better than prose and also crosses into the main session's files. Prototype
it, photograph it, leave it for the owner. Do not commit it.

### If a runner cannot be finished

Then the item still must not claim it needs importing. Give it an honest interim
state that says what it is and that it is coming — but only as a fallback after
trying, and say clearly in the report which of the three ended up there.

The test that would have caught this: assert over the **whole catalog** that no
generator-sourced item is ever unplayable. Not a sample.

## Task 4 — the leftovers the main session holds

- Add the guide's CSS (`.guide-steps`, `.guide-terms`); the rewrite left it out.
- Correct `musicWidth` in the probe: it measures the engraver's page, not the
  ink, and reported 90% for a screen that was 58% full.
- Add the owner's real geometry, 342x740 and 740x342, as fixtures across the
  gallery, corpus and tour. Three bugs this week were invisible purely because
  every fixture uses round 360x780 / 780x360.
- Add a long-titled piece and the Nocturne to the fixtures; the easy four-bar
  tunes hide the faults.
- `docs/04-ui-spec.md` section 7e is stale on the guide's section order.
- `.button--secondary` has no CSS rule.
- Tooltips for the baffling toolbar items belong in the `...` full-screen sheet
  only — a phone has no hover, and the sheet is the one place with room. The
  sheet's own contents were never reviewed.

## Task 5 — in the issue list but missing from this plan until now

- **The placement test has no runner.** `drill.placement.stage-0` sits in the
  catalog with `file: null` and edition notes describing eight branching items,
  but nothing implements them: the items are prose in `lessons/0.4.md` that the
  learner plays and self-judges. The catalog row reads as though it works.
  `06-build-plan.md` puts placement in a later phase, so this is probably a stub
  — but nothing anywhere says so. At minimum, make the row honest.
- **The update toast was photographed half below the screen.** `position: fixed`
  should be immune to the `100dvh` fault, and an emulated viewport puts it inside
  the fold — but an emulated viewport has no address bar, which is the whole
  condition. Cannot be settled without the phone; write down what to check.
- **The `...` sheet's own contents were never reviewed.** It is the only surface
  with room for explanations, and nobody has read what is in it.
- **Two docs are stale.** `08` section 4.1 still states the old
  `barsPerSlot = floor(n/2)` rule, and `04` section 7e is stale on the guide's
  section order. Both go in the same commit as the change they describe.

## Task 6 — UX changes proposed rather than requested

These are not on the owner's list. They are what the faults on it have in common,
and they are worth doing. Each is a proposal; the owner decides, but do not wait
to be asked before designing them.

- **Explain every control in plain words, in the `...` sheet.** The owner asked
  what Perform mode is and why Blind is useful — and they specified the app. If
  the author has to ask, a name on a button is not an explanation. One line under
  each control, written as what it does *for you*, not what it toggles: `R`, `L`,
  `Both`, every entry in the mode select, the tempo, the fold. A phone has no
  hover, so `title` attributes are dead weight; the full-screen sheet is the only
  place with the room.
- **Landscape must never centre the bar being played.** Reading music runs one
  way and is always about what is coming. Centring spends half a wide screen on
  bars already played. Bias the current bar left, keep at most one bar of what is
  behind for context, and give the rest to what is ahead. This is the principle
  behind the owner's "impossible to play stuff in".
- **State the fade rule and implement exactly it.** Fade the control bar out
  after a few seconds of no interaction *during a run*, never while stopped, and
  bring it back on a tap anywhere on the stage. The owner's judgement was that
  the fading bar was right and only its trigger was wrong, so fix the trigger
  rather than replacing the behaviour.
- **Progress must be countable, not spinning.** "Reading 142 of 900" with the
  current filename tells a person the app is alive and roughly how long they are
  waiting. A spinner tells them neither, which is why a working import reads as a
  freeze. Add a cancel, because a folder of a thousand files is a real thing to
  be stuck in.
- **Never show a dead end without its cure.** The stale hash listing is one
  instance of a general fault: a screen in a degraded state that neither names
  the reason nor offers the fix. Sweep for the others — an empty library, a
  folder with no readable scores, a denied mic, a piece that will not render —
  and give each one a sentence and the button that resolves it.
- **Make the first-run tour escapable and resumable.** A first-time user who
  cannot get past a calibration step has a brick, not an app. Let them leave for
  the app and come back from Settings, with sane defaults in place meanwhile.
  This matters more once the click step is being redesigned.
- **A crowded step is usually two steps.** The squeezed previews are a symptom:
  a step trying to explain and demonstrate at once, with the demonstration losing
  the argument for space. Splitting a crowded step in two is almost always better
  than shrinking its preview.
- **Check what a thumb can reach.** Held one-handed on a 342 px phone, the
  top-right corner is the hardest point on the screen, and that is where the fold
  chip lives. The audit measures tap size but not reach; worth one look.

## Task 6a — the space problem, and ideas for it

Almost every photograph the owner took is the same fault wearing different
clothes: there is not enough room, so something gets squeezed, wrapped onto a
second row, or drawn on top of something else. Sideways the phone is **342 px
tall**, and a readable grand staff wants 120-150 of them. A header and a control
bar together are around 84 px, a quarter of the screen, spent before a single
note is drawn. The strip takes another 56 (32 in the tight landscape case).
Trimming padding will not win this; the layout has to stop reserving space it
does not always need.

These are design proposals, with the reasoning, for whoever takes the surface.
Not all of them will survive contact. Try them.

**1. Chrome should overlay, not reserve.** This is the biggest single lever.
Today the stage is the screen minus the bar, so the bar costs its full height for
the entire session even when nobody is looking at it. If the bar instead floats
translucent *over* the score and fades out during a run, the score gets the whole
screen and the chrome costs nothing except in the seconds it is visible. The
corner chip already works this way. The obvious risk is covering notation — and
the renderer already knows where the systems are, so float the bar in the gap
*between* systems, or shift the ink down by the bar's height only while it shows.

**2. Landscape: one system read properly, plus a smaller look ahead.** Two
systems on a 342 px screen gives each about 150 px and both are cramped, which is
how the owner ended up unable to play from it. Reading ahead does not need full
size — peripheral vision wants contour and direction, not stem detail. So: one
system at a genuinely readable size, and a compressed strip beneath showing the
next bar or two at perhaps 60%. The eye lives on the big one and glances down.
This also fixes the complaint directly, because what is ahead becomes a distinct
thing rather than half of an even split.

**3. Turn the title sideways.** In landscape the title and composer eat a whole
row — 44 px of 342, thirteen percent of the screen, to display text nobody reads
while playing. Set vertically along the left edge with `writing-mode: vertical-rl`
it costs about 16 px of width, two percent, and is still there when wanted.

**4. Collapse the bar counter and the beat into one dial.** "bar 7 / 15" as text
plus a separate beat dot is two elements and a text row. One small ring that
fills as the bar progresses, with the bar number inside it, is a single 28 px
circle that says both things at a glance, and it can sit in the corner over the
score rather than in a row of its own.

**5. Priority-plus for the control bar.** The `...` alone on a second row was
never a one-off; it is what any fixed row of controls does when the screen is
narrower than the sum of its parts. Measure what fits and move the overflow into
the sheet automatically. Then no width can ever produce a second row, and the
740 px case stops being a special case that has to be discovered by photograph.

**6. Let the state decide the chrome.** Stopped, you are choosing things, so show
everything. Running, you need the music and almost nothing else — the controls
that matter mid-run are stop and tempo, and both can be a gesture. Treat "running"
as a distinct visual mode rather than the same screen with a fade on it.

**7. The strip's ends are dead space.** The extreme low and high keys are almost
never lit. If something must be persistent, the ends of the keyboard strip are
cheaper than a row of their own.

**8. Go edge to edge.** Honour `env(safe-area-inset-*)` and let the score use the
full width in landscape rather than sitting inside the browser's default padding.

**9. Tour previews: full-bleed, caption floating over.** The previews are squeezed
because each step lays out as a text box with a picture fitted into whatever is
left. Invert it. Let the preview fill the step and float the caption as a
translucent card at the bottom, the way any photo viewer does. The preview is
what the step is about, so it should be the thing that gets the space and the
text that gets the compromise.

**10. Demonstrate landscape in landscape.** A tour step about the sideways layout
currently shrinks a wide thing into an upright box. Show it in a phone-shaped
frame turned on its side instead — smaller overall, but the right shape, and it
teaches what it looks like rather than a distortion of it.

**11. Never shrink text to make something fit.** Below about 11 px it stops being
readable and becomes texture. When a box runs short the answer is to drop the
least important element, not to scale everything until it technically fits.

**12. In landscape, the middle-bottom is unreachable.** The phone is held at both
ends, so the thumbs rest at the left and right edges. Controls belong there, not
centred along the bottom where neither thumb goes.

## Task 6b — the chooser that covers the thing being chosen

A tour step that lets you pick how the score will look, and then draws the picker
over the score, cannot do its job. The owner named this directly. It is a logical
fault, not a layout one, and shrinking the preview does not fix it — a preview
too small to judge is the same as no preview.

Three ways out, best first.

**Make the options *be* the previews.** Do not draw a list of choices over a
sample. Render two or three real miniature score windows side by side, each laid
out the way that option would lay it out, and let the person tap the one that
looks right. There is no overlay because there is no separate control, the
question answers itself visually, and it scales: the tablet shows the same tiles
larger and can afford more of them. This is how a wallpaper or theme picker
works, and for the same reason.

**Failing that, put the control on the short edge and give the preview the rest.**
Upright, the chooser is a single row pinned at the very bottom and the preview
owns everything above it. Sideways, the chooser is a narrow column at one side.
The preview is never behind anything.

**Failing that, fade the chooser while the finger is down.** Touching an option
drops the chooser to near-transparent so the preview shows through, and releasing
commits. You see the effect during the gesture that makes it. This is the weakest
of the three because it only works while touching, but it is better than a
preview permanently behind a panel.

The same test applies to every step of the tour: **if a step asks you to judge
something, is the thing you are judging fully visible while you judge it?** Walk
every step and answer that question for each.

## Task 6c — detail: what grows without limit, and what never resets

The owner asked whether the log grows for ever. Two of the three answers are
already good and the third is not:

- `util/renderTiming.ts` keeps a 200-entry `RingBuffer`. Bounded.
- `util/errorLog.ts` stops at 50 distinct errors. Bounded.
- **The `sessions` store is not bounded.** `db.ts` creates it with
  `autoIncrement` and nothing anywhere prunes it, so every practice session
  appends a row that is never removed. Daily use for a year is thousands of rows
  on a phone. Decide a retention rule — keep the last N, or roll sessions older
  than a few months into a summary — and show the total in Diagnostics so it can
  be seen growing. Check `imports`, `books` and `folderLibraries` for the same
  shape while there.

Then sweep for the rest of the family, because this is a *kind* of bug rather
than one bug:

- Anything monotonic that only resets on an unrelated condition. `held` in
  `WindowRenderer` is a running maximum of window sizes that resets only when the
  zoom changes, so one unusually wide window can hold every later one small for
  the rest of the session. Establish whether that is intended.
- Listeners added per render or per window swap and never removed.
- Caches keyed by score or by range with no eviction.
- Anything that accumulates across a rotation, since rotation redraws everything.
- Counters that never reset between pieces or between runs.

## Task 6d — do not spend the tablet's room to save the phone's

Every space-saving idea in 6a is a compromise bought with something. The tablet
has no shortage of room, so it should pay none of that price. There is already a
`data-tablet='true'` hook and the folded-corner rules use it.

Rules for this batch:

- Gate every phone-driven compromise on the phone. Overlaying chrome instead of
  reserving it, the sideways title, the merged bar-and-beat dial, one system plus
  a look-ahead strip, priority-plus overflow: all of these should leave the
  tablet's layout exactly as it is unless the change is an improvement in its own
  right at that size.
- Where a phone idea genuinely is better everywhere — the options-as-previews
  picker in 6b, countable import progress, an explanation under every control —
  apply it to both, but let the tablet use its room: bigger tiles, more of them
  side by side, the explanation always visible rather than folded into a sheet.
- **Prove it.** The gallery has tablet cells. After every layout change, compare
  the tablet cells before and after, and say in the report that they are
  unchanged, or what changed and why it is better. A phone fix that quietly
  degrades the tablet is a regression, and nobody is photographing the tablet.

## Decisions only the owner can make — ask, do not guess

- The grand-staff question: 14 authored songs are on one staff.
- What `barsPerWindow` should mean; 3 currently renders identically to 2.
- Whether the header should fold along with the control bar.
- How added scores should earn rungs.

## Last sweep — things thin or missing from the drafts above

**1. The four suites, by name.** Phase 3 runs `npm run e2e`, the states gallery,
the corpus, and the tour sequence — **one at a time, in that order**, each
finished and its port freed before the next starts. "Run the suites" has been
read as "run one" before.

**2. The audit is new and has never run over the gallery.** `tests/states/audit.ts`
sweeps every cell for overlap, clipping, off-screen controls, small tap targets,
tiny text and contrast. The first run will therefore surface a **large number of
faults at once, most of them pre-existing rather than regressions**. Do not try
to fix them all, and do not treat the count as a verdict on tonight's changes.
Triage: write the full list into the handoff, fix what is plainly wrong and
cheap, and leave the rest as a named backlog. A flood of new faults at 3 am is
the likeliest way for this night to go wrong.

**3. The tap-target threshold disagrees with itself.** `audit.ts` uses 40 px;
`docs/handoff` section 4d says 44. Pick one, change the other, say which.

**4. `tests/e2e/empty-states.spec.ts` already exists.** Point the "no dead end
without its cure" work at it rather than starting fresh — it is where the silent
hash listing's assertion belongs.

**5. `tests/e2e/landscape.spec.ts` already exists.** Read it before writing new
landscape assertions; some of what task 1b needs may only need tightening, and a
second spec covering the same ground is how contradictory assertions get born.

**6. Whether Blind mode earns its place is an owner decision.** The owner asked
what Perform mode is and why Blind would be useful. Explaining them in the sheet
is tier 1. But if the person who specified the app has to ask what a mode is for,
that is evidence about the mode, not only about the label — put the question to
the owner rather than answering it.

**7. The guide rewrite is unverified.** `GuideScreen.ts` and `guide.spec.ts` are
both modified in the tree and neither has been run. The spec now asserts the full
title list, so it will fail loudly if the CSS or the order is wrong. Run it early
in phase 3, not last.

**8. Say exactly what to push.** The report ends with the list of commits to push
and a note that CI takes several minutes and the branch was last green. Do not
push, and do not leave the owner to work out the order from `git log`.

## Finishing

Run the four suites **serially**, read every cell, fix what they show, commit the
batch in coherent pieces with no model names anywhere, and tell the owner what to
push. Do not push without being asked.
