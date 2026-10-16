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
  least one case with the permissions a plain phone tab has.
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

## Running checks

- Committed checks: `npm run check:<name>` in `web/` (list in `web/tests/README.md`). Run the ones covering what
  changed, plus `check:notes` when anything about scores or drawing changed.
- A file swapped in with `page.route` is answered by the offline cache instead once the app has cached the real one:
  give such a case a context with `serviceWorkers: 'block'` (check:notes drew the real song, 2026-10-14).
- Browser checks: build (`npx vite build`), serve the build (`npx vite preview --port 5192 --strictPort`), drive it
  with Playwright from a script in the session scratchpad. Use `--strictPort` so a port already taken fails loudly
  instead of quietly testing another server.
- Throwaway scripts stay in the scratchpad and are listed in the session notes with what they check. A case worth
  keeping becomes a committed check, listed in `web/tests/README.md`.
- **Make the race happen, then show the check fails on the old build.** Slowing the CPU 20× did not reproduce the
  PDF open race or the double + Add; holding the big file's bytes back in the page, and blocking the offline cache
  (it answered before a slowed download ever ran), did. A check that also passes on the build before the fix proves
  nothing: build the old commit and run it there (`tests/browser.mjs --url`; 2026-10-14).
- Report what was run and what was not. Real phone, real keyboard, and anything heard are not covered by any of
  this; say so.
