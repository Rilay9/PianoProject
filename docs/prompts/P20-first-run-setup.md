# P20 — First run: the setup the owner should never have had to do by hand

## Common header (unchanged, applies to everything below)

Work on the branch `claude/piano-teaching-app-bo19td`. Commit early and often, conventional
commit messages. **Never name an AI model in a commit message, a comment, a doc or code.**
Verify by commands you actually ran and paste the exact output — do not claim something works
because it should; `docs/prompts/verifying.md` is the concrete version of that rule, and is
short. Keep scope; anything you notice and do not do goes under **Follow-ups**.
Where a decision has no obvious default, pick the simpler option and say that you did. Report
as **Done · Not done/blocked · Follow-ups · Questions for the owner · Files touched**. Any
deviation from the docs gets a note in `docs/decisions/<date>-<topic>.md`.

## The ask, in the owner's words

> "put an option in the settings that runs a script once MIDI connected to test everything and
> set defaults (a test pdf (include a test one, there's a million online for free), a test song,
> a test drill) and all the calibration. it should be the first step."

So: **a first-run setup that proves the phone, the cable and the piano actually work together,
and leaves the app calibrated** — instead of the owner discovering on his own, note by note,
which parts were never set.

He installed the real build on a Galaxy S25 with a Roland HP-130 on 2026-09-07. What came back
is written up in `docs/decisions/2026-09-07-first-run-on-the-phone.md`; the short version is
that the app was *correct* and *unusable*: it was waiting for F♯4, and F♯4 was one of 88 slivers
on a 360 px keyboard strip. Nothing told him what it wanted. That is the class of problem this
phase exists to make impossible on day one.

## What already exists (do not rebuild these — wire them together)

| Piece | Where | State |
|---|---|---|
| MIDI connect + device list | `#/settings/midi`, `app/src/ui/screens/MidiScreen.ts` | Works. `app/services.autoConnectMidi` reconnects silently once permission is granted. |
| Input-latency test | `#/settings/diagnostics`, `diag-latency-start` / `diag-latency-save` | Works: tap on N clicks, it reports ms and offers to save. |
| Mic calibration | `#/settings/mic`, `app/src/audio/pitch/calibration.ts`, `app/src/data/micCalibrationStore.ts` | Works: latency + noise floor, stored per device id. |
| Settings store | `app/src/data/settingsStore.ts` (`localStorage` key `pianopath.settings`, mirrored to IndexedDB) | ~40 keys, all with defaults. |
| PDF import + system detection | `app/src/pdf/systems.ts`, `#/pdf/<importId>` | Works; detects systems from the brace at the left edge. |
| Score screen, all four modes | `#/score/<itemId>` | Works. |
| Drill screen, 23 kinds | `#/drill/<itemId>` | Works. |
| Diagnostics report | `#/settings/diagnostics`, "Copy debug report" | Works — this is how the 2026-09-07 report reached me. |

Read before you design: `docs/04-ui-spec.md` §7 (the settings list), §7b (Diagnostics), §7c
(what actually shipped), `docs/00-overview.md` D17 and D19–D21, and
`docs/decisions/2026-09-07-first-run-on-the-phone.md`.

## §A — The setup itself

Build a **setup run**: a short, ordered, resumable sequence with one thing on screen at a time.

**Where it lives.** `#/settings/setup` (a new `SubId`), plus a card on Today that offers it
while it has never been completed. **It offers itself the first time a MIDI input appears** —
that is the "runs once MIDI connected" the owner asked for. Offer, never hijack: a banner or a
card he taps, not a modal that takes the screen away from someone who only wanted to play.
Re-runnable from Settings for ever after, and every step individually re-runnable, because the
one thing worse than no calibration is a calibration he cannot redo after moving rooms.

**The steps, in this order.** Each one ends in a plain sentence saying what it found and what it
set, and each can be skipped:

1. **The piano is there.** Name the connected input. Ask for one note; show which note arrived,
   by name and by octave. This alone would have shortened 2026-09-07 by forty minutes: it proves
   the cable, the permission, the transpose and the octave in one gesture.
2. **The whole keyboard.** Ask for the lowest key, then the highest. Store the real range. Use
   it to check the transpose setting and to pick a sensible default for anything that has to
   guess at a range later. An HP-130 is 88 keys; do not assume it.
3. **Latency.** Reuse the diagnostics test rather than writing a second one. Save the result to
   the input-latency setting.
4. **Sound.** Play a note back on the phone; ask whether he heard it. Then, if the piano exposes
   a MIDI output, play through the piano and ask which he prefers — that is the
   `playbackDestination` setting, which today defaults to `phone` and has never once been
   chosen deliberately.
5. **A test song.** Open a real bundled piece in Wait mode and have him play the first bar. This
   is the end-to-end proof: notation, cursor, keyboard strip, note colouring, advance. Say what
   it measured. Use `song.folk.mary-had-a-little-lamb` or
   `song.classical.petzold-minuet-g-bwv-anh114` — both bundled, both public domain, both with a
   real `file`. Do not use `song.folk.suo-gan-welsh-traditional-lullaby.pdmx`: it is the piece
   that failed, and a setup step should not be a re-enactment.
6. **A test drill.** One prompt from `drill.reading.grand-staff-flash` and one from
   `drill.ear.interval-2nd-3rd` — the second proves audio *out* the way the first proves MIDI
   *in*. Two prompts, not a set: this is a check, not a practice session.
7. **A test PDF.** Import a bundled PDF, show the system detection, and let him step through it.
   See §B.
8. **The microphone, optional and last.** Only if he says he wants to practise away from the
   piano. Skipping it must cost nothing.
9. **How he wants it to look.** See §B2 — the taste settings, chosen by looking rather than
   guessed at.
10. **What it decided.** One screen listing every value the run set, each with the step that set
    it and a way to change it. Then "Done" — and it never asks again unless he asks it to.

**What it may write.** Settings the steps measured — input latency, playback destination, the
detected key range, mic calibration, MIDI input device — and, in step 9 only, the four taste
settings he has just picked by looking at them. **Nothing else, and nothing silently.** Zoom and
strictness are his and are not asked about here. `00` D19 is one owner and one phone; that is a
licence to be direct, not a licence to decide for him.

**Storage.** A `setup` record — version, completedAt, per-step outcome, what each step set.
Versioned, so a later phase adding a step can offer just that step rather than the whole run
again. IndexedDB is at version 5; a new store or a settings key is your call, but say which and
why.

## §B2 — The taste settings, chosen by looking

The owner asked for this directly: rather than a separate page of choices, **the setup should
show him the options and let him pick.** He is right, and it is a better idea than the page that
exists — the run already has a real piece open in front of him, so showing it three ways costs
him nothing extra and answers with his eyes rather than his imagination.

Four settings, none of which has ever been chosen deliberately. Each is a matter of *his*
reading and none has a correct answer:

| Setting | What to show |
|---|---|
| `barsPerWindow`, upright | The same bar of the test song at 1, 2 and 4 bars in the window. |
| `barsPerWindow`, sideways | The same three, with the phone turned. Ask him to turn it. |
| `keyboardStrip` | The score with the on-screen keys and without. With the piano plugged in they are a picture of what he has just played, and they cost about a fifth of the height. |
| `showNoteNames` | Wait mode with and without *Waiting for F♯4* under the title. This is the one that would have saved him forty seconds hunting for that F sharp. |

**Live, not mock-ups.** Draw the real screen at each setting and let him tap the one he wants.
The whole reason this belongs in the setup is that a picture of notation is not the same as
notation at the size it will really be, on the phone it will really be on.

Three things to get right:

- **Sideways is a separate answer from upright**, and the app has one setting for both today.
  Whether that becomes two is your call; if it does, say so in `docs/04-ui-spec.md` §7. The
  measurements are in `docs/decisions/2026-09-07-the-ux-tour.md`: a two-bar window sideways now
  fills 98% of the screen, so the trade-off is genuinely about how far ahead he wants to read,
  and no longer about wasted space — which is what it was about when the question was first
  written down.
- **A choice made here is his, and nothing may quietly override it.** `barsPerWindowFor` in
  `app/src/ui/tablet.ts` already draws that line — a number he has set beats any default — and
  whatever you build has to keep it.
- **Skipping leaves the defaults alone.** This step is the least important in the run and the
  most tempting to make compulsory; it must be the easiest to walk past.

There is a page at `build/tour/choices.html` that already puts these four questions side by side
as pictures, built before this step existed. **Treat it as the content for step 9, not as
something to keep**: once the setup asks them properly the page has no reason to exist, and
`app/tests/tour/choices.spec.ts` and the `choices` script in `app/package.json` should go with
it.

## §B — The bundled test PDF

He asked for one to be included ("there's a million online for free"). Two honest options:

- **A page of real public-domain sheet music.** Best test — a real engraving is what his own
  imports will look like. It must be genuinely PD and its provenance must be recorded the way
  every other bundled item's is (`source.name`, `url`, `license`, `pd_region`) and pass
  `tools/content/validate.py`. IMSLP scans of pre-1929 engravings are the obvious source.
- **Generate one from a score already bundled**, the way
  `app/tests/fixtures/imports/make-two-systems-pdf.py` generates its fixture — no toolchain, no
  new licence question, and the provenance is already settled.

**Recommendation: the second**, if you can get a real engraving out of it; the first only if you
are certain of the licence. `app/tests/fixtures/imports/two-systems.pdf` is a *fixture* — blank
staves, drawn by hand to exercise brace detection — and is not good enough to show a person.
Whichever you choose, it ships in `app/public/`, is precached, and the setup step must work with
the phone in aeroplane mode.

## §C — Prove it

**Read `docs/prompts/known-problems.md` first.** The suite has two or three flaky tests that
are nothing to do with you, one of which is a real bug in the app worth understanding before
you touch the engine. Chasing them is a day you will not get back.

Not "it should work". Paste what you ran.

- Unit tests for every decision the run makes: which step comes next, what a skip does, what a
  re-run of one step does, and what each step writes.
- An end-to-end test that walks the whole setup with the MIDI mock
  (`app/tests/e2e/fixtures/midiMock.ts`, `installMidiMock(page, { permission: 'granted' })`),
  including the skip path and the resume-after-reload path.
- A test that the offer appears on a first MIDI connection and never again after completion.
- `npm run lint`, `npm run test`, and `CI=1 npx playwright test` from `app/` — the `CI=1` matters,
  it changes which Playwright tests run.
- Then run `npm run tour` (`app/tests/tour/`) and **look at the pictures** of your own screens in
  both orientations before you call it done. That harness exists now; use it.

## Out of scope — being done in parallel, do not touch

- `app/tests/tour/**` and `app/playwright.tour.config.ts` (the screenshot tour and the choices
  script) — mine.
- Landscape and portrait layout of the **score screen** — mine. If a setup screen looks wrong
  sideways, fix that screen; leave `ScoreScreen`, `WindowRenderer`, `KeyboardStrip`, `autoFit`
  and `tablet.ts` alone.
- `barsPerWindow` in landscape: an open question with the owner, decided from screenshots.

## Questions to answer in the report, not to block on

1. Does the setup offer itself on Today, or only in Settings? (Recommendation: both — a card on
   Today until it is done, and a permanent row in Settings.)
2. Does step 5 use a bundled song or the same song for everyone every time? (Recommendation: the
   same one every time. A setup that varies is a setup you cannot compare against last week's.)
3. Where does the setup record live — a new IndexedDB store or a settings key? Say which and why.
