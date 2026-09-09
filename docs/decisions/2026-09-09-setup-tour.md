# The setup tour

2026-09-09. The owner asked for "the comprehensive calibration and user preference/display
options and modes tour on first start, and an option to redo it in settings".

## What was built

A sub-screen at `#/settings/setup` (`ui/screens/SetupScreen.ts`, loaded on demand because it
carries the engraver), eight steps: welcome, the piano, latency, sound, the screen, the four
modes, practice, a summary. The first launch of a fresh install lands on it — a launch only,
never a deep link. Skip and Finish are both remembered (`data/setupStore`, persisted like a
setting); after either, the tour is the first row of Settings with the date.

Three decisions worth writing down:

1. **Every control writes straight through.** There is no "apply" at the end. Leaving at step
   three keeps what steps one and two set, and Settings shows it. A tour with its own draft
   state is a second settings screen that can disagree with the first.
2. **The display step draws the real thing.** "Show fingering" means nothing until the
   fingering is on the screen in front of the person deciding, so the step runs the real
   engraver over *Hot Cross Buns* and redraws on every change. One system whatever the
   orientation — `WindowRenderer` gained `arrangement: 'single'` for a host whose stage is a
   card, not a screen. Building it found that **show chord symbols had never reached the
   engraver**: a stored value nothing read, listed in `04` §7c as built. It reaches it now.
3. **The routines are shared, not copied.** The latency test moved out of the Diagnostics
   screen into `audio/latencyTest`, the guided calibration out of the Microphone screen into
   `audio/pitch/calibrationRun`, the track chips into `ui/trackChips`, the MIDI recovery text
   into `midi/errorHelp`. A number measured in the tour is the number measured on the screen
   it came from.

## The tests

`tests/e2e/setup.spec.ts` starts from an empty origin, which is a first launch, and walks all
eight steps with the spoofed piano, then checks Settings shows what the tour set. Every other
spec starts with the tour already skipped: the Playwright config seeds `pianopath.setup`
through `storageState`, and the three specs that clear localStorage themselves put the flag
back. Without that, every `goto('/')` in the suite would have landed on the tour.
