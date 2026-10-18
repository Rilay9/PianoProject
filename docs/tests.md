# Testing: what reviews keep finding that our checks missed

Read this before writing or running a check, and give it to any reviewer in their brief. It is a list of the
kinds of bug that got past our own checks and were found later by a reviewer, with what would have caught each. It
is not a list of rules or a quota of tests (owner: no testing hell). Use judgement on how much each change needs.
When a review finds a new kind of miss, add it here in the same commit as the fix.

What each committed check covers, case by case, is in `web/tests/README.md`.

## Before writing a check, ask

1. **What does the learner see or get?** Measure that, not a number inside the code. The PDF split check measured
   ink on the slanted page the detector reads, so it passed while the split shown on the straightened page cut
   through notes (2026-10-14). Measure the canvas, the saved file, the export, the sound schedule: the output.
2. **Can this check fail?** Run it once against the old code or a deliberately broken input and see it fail. Then
   make it confirm the action happened: a drag check passed with nothing moved, because the drag grabbed a different
   handle (2026-10-14). Assert the before and after, not just the end state.
3. **Are the inputs as messy as real ones?** Tidy generated files hide the real cases. What real files have: a
   cover page or text first, one or two pages, scans stored as JPEG 2000, tilt, very long files, a file that won't
   open, a piece with repeats, pickups, several voices, grace notes, a lead sheet with no left hand, a MIDI channel that
  changes instrument partway, a one-track MIDI file named for the song (review 2026-10-15).
4. **Is the screen tested, or only the module under it?** Most bugs live in the glue between a module and the
   screen: when things are read, rebuilt and redrawn, and what is saved. A module test can't see those.

## Kinds of bug that slipped through

- **Sequences, not single actions.** Each step works alone; the bug is in the order. A place saved, then lines
  changed on an earlier page, then the phone turned, went back a line. Walk: start, interrupt, change something
  elsewhere, turn the phone, close, reopen, and check the place, the result and the saved state after each.
- **Things read later than the first draw.** A page read in the background after the screen was built never
  updated it. Wherever something loads lazily (pages, samples, a catalogue), check what is on screen when it arrives
  late and when it fails. Also what an action does before it arrives: ▶ tapped while a MIDI piece's band was still
  being read played the first run without it (review 2026-10-15).
- **Async starts and stale results.** A guard set only after an `await` (double taps start twice); nothing cancelling
  a start when the user stops or closes mid-load; an older draw finishing after a newer one; a result shown after
  the chart, step or loop changed. Use a session counter checked after every await, and tag results with what they
  belong to.
- **Platform paths no script walks.** Android Back (history), keyboard focus (Enter on a focused button),
  offline (files fetched only for some inputs, like pdf.js's decoders, missing from the offline list), turning the
  phone, a dialog open while keys arrive, a mouse let go off the on-screen keys (2026-10-15: the key stayed down).
  A stand-in MIDI keyboard for these is in `tests/browser.mjs` (`window.__key`). Each screen: try Back at every level, Tab plus Enter, offline after
  saving, and both orientations.
- **Extremes of size.** A unit taller than the screen, an empty page, one line, eighty pages, a long piece (a 190-bar
  song's one-line strip is 28,720 px wide: its hidden source, parked 10,000 px off screen, painted over it; 2026-10-15),
  a tablet, a phone sideways. Check that nothing is cut off with no way to see it, and that one odd item doesn't change the layout for
  the rest of the visit.
- **Two coordinate frames, or two clocks.** Positions read in one frame and shown in another (slanted versus
  straightened page). Times judged on the page's clock instead of the keyboard's, or a fixed millisecond window
  applied to speed-scaled song time. Or two identities for one key: a name-only drill matched a C5 to the written C4
  and then looked up how long the *C4* was held (2026-10-15). Decide which frame, clock or key each number lives in.
  The same for where a drawing lives: the score's one-line layout (a phone sideways) shows its music through `<use>` from
  `#score-src`, outside `#score`, so a check counting marks under `#score` found none there while they showed (2026-10-16).
- **Evidence that doesn't prove the skill.** Notes in a window counted as a chord without being down together;
  silent rounds counted as played; a stopped half-round counted as a round; a Simon chain finished from the miss on
  saved as a best of the whole chain; a run whose hands changed half way judged and logged as the new hands
  (2026-10-15). Ask what each result is evidence of.
- **A check against the code's own intermediate, not the truth.** The MIDI converter's read-back check passed on
  232 of 235 ASAP score files while a pickup put every barline in the wrong place and 32nds were moved, because it
  compares the score with the notes *after* the converter placed them (2026-10-14). Compare with an independent
  answer (a published score, a file the app did not make), and first run the comparison on a perfect input to show
  it scores that as perfect: two bugs of the comparison's own (a tempo lookup, a pickup at negative time) made the
  converter look worse than it was.
- **One state, several ways in.** A lesson step reached from the lesson page kept its address through a reload; the
  same step reached from the result's Again or Next did not, and reopened as a bare piece (review 2026-10-15). List
  every way into a state (buttons, links, Back, reload, Carry on) and check each, not only the main one.
- **Progress read from where the marker stopped.** Wait for me judged a run by the marker's last place: a loop gone
  round ends where it began ("nothing played"), one note ends past the start ("done"), review 2026-10-15. Count what
  happened during the run, not the end state.
- **Events sent straight to an element skip what lies on top of it.** The on-screen keys passed every check because
  the checks dispatched pointer events at the key itself; on the phone the bottom bar lay over the keys and took the
  taps (one even pressed A+), and Wait for me never started without MIDI permission, which the checks always granted
  (owner, 2026-10-15). Tap by position (the mouse at the place, or the event sent to `elementFromPoint`), and run at
  least one case with the permissions a plain phone tab has. And a tap at a key's exact centre hits even a key too narrow
  for a finger (14 px black keys passed that way): tap where a finger lands, off centre too (lesson 1, 2026-10-16: ±12 px
  for keys meant to be about 30 px wide).
- **The key that starts something, swallowed.** A tap that starts a run must also count as its first note wherever the
  run is waiting for one: Wait for me on the screen's keys (fixed 2026-10-15) and then Drills (owner, 2026-10-16: "Make
  sure to start on the first tap. You made that mistake last time") both dropped it, and the checks started every run
  with Start or a separate key. Check a run started by a single positioned tap and count that tap in its result (one tap
  fewer than the notes leaves the last missed, not the first); and a tap on a result or a Ready screen does what the
  screen says.
- **Readers that accept more than they handle.** Content files with typos or unsupported features loaded silently.
  Refuse with the reason; test the refusals. Check the nested objects and the value types too, not only the top-level
  keys: a set's `"octave": "five"` hung the app, `"together": "false"` read as together, a chart's `improvise: { scales }`
  was ignored, and no check read the sets, the lab's files or the song list at all (interfaces review, 2026-10-15:
  `tests/content.mjs`). Every content folder needs a check that reads each shipped file with the app's own reader.
- **A record written from the state at its end, not its start.** A Drills set left by choosing another set was logged
  under the new set, level and (ended) lesson tag, because the log read them when it wrote (final review 2026-10-15,
  F06). Keep with a run what it is played as when it starts; check by changing each of them part way.
- **The reviewer's device, not a lookalike.** The "has 2 parts" warning on Home showed only in a context with
  `isMobile` (as the tour ran), whose first layout fires a resize; the same check at the same size without it passed on
  the broken build (2026-10-15). And don't bend a check around a bug: that check's "where it opens" half used a plain
  context because the phone's relayout cleared the message, which hid that bug (the first message after opening lost on
  every phone) until it was named as a loose end (2026-10-15). Run a reported case the way it was reported before calling it fixed or unreproduced.
- **A name switched before the data it names.** An id set at once while the data it names arrives later: any save in
  between files one item's data under another's (a PDF opening saved the previous PDF's lines under its own name, review
  2026-10-15). Switch the name and its data together, and keep saves off in between.
- **A passing failure kept as the answer.** A fetch that failed once (offline, a timeout) stored as "none" for the rest
  of the visit. Keep only answers that came from the real thing; let a failed fetch be tried again.
- **Removing or editing the wrong item.** Controls that act only on the last item, or indexes that shift when an item
  in the middle disappears (a thin line silently dropped shifted every later line's splits). Or an edit to one item
  that quietly redoes the others: + line found every line's split again, losing the ones placed by hand
  (2026-10-14). After changing one item, check the others are as the learner left them.
- **A permission prompt nobody answers.** Checks either allow MIDI or have no MIDI; a real browser can leave the
  prompt unanswered, and `requestMIDIAccess` then never resolves nor fails. Simon and Drills awaited it and never opened,
  with no word (ChatGPT's live review of lesson 1, 2026-10-16; its cloud browser did exactly this). Wherever the app
  awaits a permission or a device, check the third case: asked and never answered (a stub that returns a promise that
  never settles), and answered later.
- **The main buttons' path skips what the page teaches.** A result's Next went straight to the next activity, past the
  explanation and picture before it (lesson 1, 2026-10-16). Follow the most prominent button at each step, as a learner
  would, and check what they actually get to read.
- **A summary of the last run, not the one meant.** A step's result headline was its last run ("Longest chain 0 · 2 runs"
  beside "Target met", a chain of 3 played before), and "the misses again" was logged "stopped early" and headed the
  result; Drills' card counter counted a card again while Again replayed it ("Card 6 of 5"). The beginner walk-through
  found both (2026-10-16); the checks had each run alone. Play two runs of different worth (and a retry) and check which
  one the summary names.
- **One slip marked twice.** On the pad a new tap ends the one before, so a note tapped early also cut the note before it,
  which was then "let go early" too (2026-10-16). Where one input can end another (the pad, one key struck again), check
  that a slip is marked on the note that made it only.
- **A cover over the screen takes the first tap.** "Tap anywhere to start" took the tap meant for the pad, so a reloaded
  drill started only on the second tap (2026-10-16), the kind of bug "the key that starts something, swallowed" names,
  from a layer the checks always tapped away first. Tap the real target through the cover.
- **A word read in one moment.** The count-in said "0" for its first 30 ms; a check that read the status once never saw
  it (2026-10-16). Sample a changing line all the way through, not once.
- **More drawn than the words count.** A find set's keys C3–B5 were rounded out to the next C, so a C6 showed above "a C,
  higher up", which counts C5 (the highest C of the set's keys): a learner pressing the highest C drawn was wrong. The
  check allowed it (`hi >= 83`). Where words name a place among things on screen (highest, lowest, middle), check that
  what is drawn or reachable is exactly what the words count, at its ends too (2026-10-17).
- **Help that shows more than its level.** Hear it gave every help level help 1's way (music, sound, lit keys), so by ear
  it drew the staff and lit the keys; a by-ear card's result drew its music and named its notes; the 8 s hint lit keys at
  every level (owner, 2026-10-17: "the whole entire mode at a certain level is cohesive for that level"). The checks had
  looked at a level's main state only. Walk each level through every state (given, Hear it / Show me, a miss, the result,
  Keep going) and record what is drawn, lit, marked and named (tests/exercise.mjs and `--only lesson1caps`).
- **Where you are, rewritten by every visit.** Drawing a lesson page made it "the lesson you are on", so finishing a lesson
  and pressing Next put the finished lesson back on Home ("Again · lesson 1") (2026-10-16). After a lesson's last step,
  check Home, Path's Carry on and Switch as a learner would come back to them.

## Running checks

- Committed checks: `npm run check:<name>` in `web/` (list in `web/tests/README.md`). Run the ones covering what
  changed, plus `check:notes` when anything about scores or drawing changed.
- A file swapped in with `page.route` is answered by the offline cache instead once the app has cached the real one:
  give such a case a context with `serviceWorkers: 'block'` (check:notes drew the real song, 2026-10-14).
- A second worktree running checks at the same time: `PIANO_PORT=5294 npm run check:browser` serves on that port instead of 5194 (2026-10-16).
- Browser checks: build (`npx vite build`), serve the build (`npx vite preview --port 5192 --strictPort`), drive it
  with Playwright from a script in the session scratchpad. Use `--strictPort` so a port already taken fails loudly
  instead of quietly testing another server.
- Throwaway scripts stay in the scratchpad and are listed in the session notes with what they check. A case worth
  keeping becomes a committed check, listed in `web/tests/README.md`.
- **Make the race happen, then show the check fails on the old build.** Slowing the CPU 20× did not reproduce the
  PDF open race or the double + Add; holding the big file's bytes back in the page, and blocking the offline cache
  (it answered before a slowed download ever ran), did. A check that also passes on the build before the fix proves
  nothing: build the old commit and run it there (`tests/browser.mjs --url`; 2026-10-14).
- **A tap on the "Tap anywhere to start" cover reaches what is under it** (since 2026-10-16 the first tap is played as well as
  starting the sound). A check that taps the cover and then taps Start can find Start already gone, when the cover's tap
  landed on it; and the cover shows only sometimes in a headless browser, so the check crashes now and then (2026-10-17,
  walkfix 12). Tap a button only while it shows, or tap the cover away from the button you mean.
- Report what was run and what was not. Real phone, real keyboard, and anything heard are not covered by any of
  this; say so.
