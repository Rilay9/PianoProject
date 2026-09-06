# P6 — the Score screen

Date: 2026-09-06 · Phase: P6 (`feat/p6-score-screen`) · Status: accepted

## Shape

`score/ScoreSession` owns the run; `ui/screens/ScoreScreen` is chrome around it. The split
matters because everything that can drift apart lives on one side of it: the renderer, the
practice engine, the piano and the metronome are joined inside `ScoreSession`, and the screen
holds no timing, judging or scheduling at all.

The four rules the Opus review pass in the prompt asks about, and where they are kept:

1. **Nothing renders on the input path.** `feed()` calls the engine and returns; the engine's
   events set a `dirty` flag and stash the pending step; `paint()` runs in the animation
   frame. Colouring a note inside the MIDI handler would put layout between the key and the
   sound.
2. **Cursor updates are rAF-batched.** One `showStep` and one `setNoteStates` per frame,
   whatever arrived. The frame loop runs in *every* mode, not only the clock-driven ones —
   Wait mode has nothing to advance but everything to paint.
3. **The window pre-render is used**, because `WindowRenderer.showStep` already prepares the
   next window and the session never bypasses it.
4. **Every engine event is consumed.** The `switch` in `handle()` is exhaustive with a `never`
   default, so adding an event kind is a compile error rather than silence.

Playback is scheduled ahead on the AudioContext clock from `PreparedStep.tMs` — the same table
the cursor follows — so audio and notation cannot separate however busy the main thread is.

## Decisions taken here, with the reasoning

**The control bar floats over the notation and auto-hides only during a run.** `04` §5 says it
"auto-hides after 3 s", which means while you are playing: that is when the notation needs the
room. Hiding it while the learner is still choosing a mode made every control a two-tap
affair, and a hidden bar is `pointer-events: none`, so the taps landed on the score instead. It
also scrolls sideways rather than wrapping — a layout test measured a wrapped bar of twenty
controls taking half a landscape phone screen.

**The screen does not wait for the piano.** The soundfont is 2.6 MB and the score used to sit
blank until it loaded. `ScoreSession.setPiano` attaches it when it arrives; playback simply
starts working. This also removed most of the e2e flakiness, which was the symptom that found
it.

**Playback of "the non-focused hand" plays nothing when no hand is focused.** With hands set to
both there is no non-focused hand, and playing the learner's own part under their fingers is
the fastest way to stop hearing your own mistakes.

**`#/score/<id>` carries no tab.** Opening a piece from inside the app keeps the tab it was
opened from, so Back returns there; a link straight into a piece has no "where I came from"
and Back goes to Today. Ids are validated against the catalog id shape before anything fetches
them, and `..` is rejected outright.

**The metronome can be switched on mid-piece**, with the score still showing, which is the
owner's explicit requirement and has its own e2e test. Turning it on restarts the run rather
than splicing a click into a running scheduler: the count-in and the first downbeat have to
agree, and a click that starts half a bar late is worse than a restart.

## Two bugs the tests found

- **`WindowRenderer.create` prepares its buffers but draws nothing.** The first `showStep` is
  what puts notes on the screen; without it the stage is two empty divs. The dev harness always
  called `goToStep(0)` and so had never noticed.
- **A hash with `..` in it passed the id check.** `song.folk.x` and `..` have the same shape
  under a naive character-class pattern. Now the id must start with a letter and may not
  contain `..`.

## Not built here

**All three were built in P18** (`docs/decisions/2026-09-06-p18-carry-overs.md`): the amber
state is a fourth `NoteState` and now also paints the keyboard strip, which showed no
judgements at all before; 60 named sections across 22 pieces at Stages 1–5 feed a section
picker on the loop control; and the tablet side panel arrived with the bars-per-window default.
The original entries follow, unchanged.

- The mic **amber** colour for an uncertain note: `ScoreSession` deliberately does not paint
  uncertain judgements at all rather than painting them red, which is the safe half of
  `05` §11.1. A third `NoteState` is a `WindowRenderer` change and belongs with the CSS for it.
- **Named sections** for looping: `teaching.sections` exists in the catalog schema but no item
  carries any yet, so the loop is set by double-tapping bars only.
- The **tablet side panel** (`04` §7a): the breakpoint belongs with the Plan and Library
  screens it also affects, which is P7.
