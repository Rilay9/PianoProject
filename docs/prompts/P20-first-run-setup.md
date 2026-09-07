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

**Two thirds of that particular sliver is now fixed and is not your job.** P19 narrowed the
strip from 88 keys to the ones the piece uses, and P21 found the other half: `--key-h` was a
constant 108 px inside a 72 px box, so the bottom 50 px of every key — the part of a white key
that is not hidden behind a black one — was drawn below the edge of the screen in both
orientations. The strip is now a keyboard you can aim at. What is still missing, and is yours,
is the part where *something tells him what it wants* before he is lost.

## What already exists (do not rebuild these — wire them together)

| Piece | Where | State |
|---|---|---|
| MIDI connect + device list | `#/settings/midi`, `app/src/ui/screens/MidiScreen.ts` | Works. `app/services.autoConnectMidi` reconnects silently once permission is granted. |
| Input-latency test | `#/settings/diagnostics`, `diag-latency-start` / `diag-latency-save` | Works: tap on N clicks, it reports ms and offers to save. |
| Mic calibration | `#/settings/mic`, `app/src/audio/pitch/calibration.ts`, `app/src/data/micCalibrationStore.ts` | Works: latency + noise floor, stored per device id. |
| Settings store | `app/src/data/settingsStore.ts` (`localStorage` key `pianopath.settings`, mirrored to IndexedDB) | ~40 keys, all with defaults. |
| PDF import + system detection | `app/src/pdf/systems.ts`, `#/pdf/<importId>` | Works; detects systems from the brace at the left edge. |
| Score screen, all four modes | `#/score/<itemId>` | Works. **Changed in P21:** the control bar is `⏮ ▶/⏸ mode R-L-Both tempo ⋯` and nothing else; everything else moved into the `⋯` sheet. A test that touches Input, Loop, Metronome, Bars, Size, Layout, Keys, Sound, Blind or Perform must open that sheet first — use `app/tests/e2e/scoreControls.ts` (`withScoreMenu`, `setTempoPercent`), which every existing score test now goes through. |
| Drill screen | `#/drill/<itemId>` | Works. The catalogue names **57** drill kinds; **19** have their own prompt and their own judging in `engine/drills/fromCatalog.ts` and `DrillScreen.ts`, and the other 38 fall through to `buildTechniquePattern` — demonstrate the pattern, play it back — which is one renderer wearing thirty-eight names. Step 6 wants one of the 19. |
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
2. **The whole keyboard.** Ask for the lowest key, then the highest. Store the real range as a
   settings key `keyboardRange: { low, high } | null` (`settingsStore.ts`, validated like the
   rest), and give it its two readers: `stripRange.ts`, as the fallback when there is no piece
   to take a range from (paper practice, a drill with no notation), and step 1's octave check,
   which can now say "your A0 arrived as A0". Use it to check the transpose setting
   (`data/midiSettings.ts`). An HP-130 is 88 keys; do not assume it.
3. **Latency.** Reuse the diagnostics test rather than writing a second one. Save the result to
   the input-latency setting.
4. **Sound.** Play a note back on the phone; ask whether he heard it. Then, if the piano exposes
   a MIDI output, play through the piano and ask which he prefers — that is the
   `playbackDestination` setting, which today defaults to `phone` and has never once been
   chosen deliberately.
5. **A test song.** Open a real bundled piece in Wait mode and have him play the first bar. This
   is the end-to-end proof: notation, cursor, keyboard strip, note colouring, advance. Say what
   it measured. Use `song.folk.mary-had-a-little-lamb`, always: level 1.1, right hand only,
   one position, so the first bar is four notes anyone can play and the check is about the
   cable, not the player. (`song.classical.petzold-minuet-g-bwv-anh114` is also bundled and
   public domain, but it is level 5.1 and both hands — a test that can fail for musical
   reasons is not a test of the phone.) Do not use
   `song.folk.suo-gan-welsh-traditional-lullaby.pdmx`: it is the piece that failed, and a setup
   step should not be a re-enactment.
6. **A test drill.** One prompt from `drill.reading.grand-staff-flash` and one from
   `drill.ear.interval-2nd-3rd` — the second proves audio *out* the way the first proves MIDI
   *in*. Two prompts, not a set: this is a check, not a practice session. The drill screen runs
   sets of ten and is not what you want here; the engine underneath it is separable —
   `drillFromCatalog(item)` gives a `Drill` with `next()`, `feed()` and `result()`
   (`engine/drills/types.ts`), and the screen is only chrome around those three calls. Drive
   one `next()` each from your own card, with the same `KeyboardStrip` for input, and do not
   touch `DrillScreen` (it is moving under you; see Out of scope).
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
One live score screen, not three mounted side by side: open `#/score/<the step-5 song>` with a
strip of chips over it (`1 · 2 · 4 bars`, `Keys on · off`, `Names on · off`, and `Next`) and let
each tap re-render in place — `setBars`, the strip toggle and `showNoteNames` all already apply
live from the ⋯ sheet, so the chips call what the sheet calls. Three engravings at once is three
fit searches on a phone, and a picture a third of the size is not the size it will really be.
The whole reason this belongs in the setup is that a picture of notation is not the same as
notation at the size it will really be, on the phone it will really be on.

Three things to get right:

- **Sideways is a separate answer from upright**, and the app has one setting for both today.
  Make it two: `barsPerWindow` stays as the upright value and `barsPerWindowLandscape` is
  added (default 2, the same as today, so nothing changes until he chooses), and the score
  screen reads whichever matches `matchMedia('(orientation: landscape)')` at open and on
  resize. `barsPerWindowFor` keeps its rule for both. Say so in `docs/04-ui-spec.md` §7. Two
  values because the step asks him twice and one key cannot hold two answers. The
  measurements are in `docs/decisions/2026-09-07-the-ux-tour.md`, **and one of them was wrong
  in the first version of this prompt**. "A two-bar window sideways fills 98% of the screen" was
  the SVG *box*, not the ink. Measured again on 2026-09-07 with the ink:

  | | stage | SVG box | ink |
  |---|---|---|---|
  | sideways 780x360 | 780x194 | 100% w, 61% h | **61% w, 57% h** |
  | upright 360x780 | 360x614 | 100% w, 78% h | **95% w, 76% h** |

  Upright is genuinely full. Sideways the music inks 61% of a box that is 100% of the width —
  the other 39% is OSMD's own empty margin — inside a stage that is itself only 194 of the 360
  px, once the header, the control bar and the keyboard have taken theirs. So sideways the
  trade-off is still partly about wasted space, and you should show him what the sizes actually
  look like rather than what this paragraph used to claim. The fit-to-ink work is mine (see Out
  of scope); if it lands before you reach step 9 the numbers will be better and you should
  re-measure rather than trust either version of this table.
- **A choice made here is his, and nothing may quietly override it.** `barsPerWindowFor` in
  `app/src/ui/tablet.ts` already draws that line — a number he has set beats any default — and
  whatever you build has to keep it.
- **Skipping leaves the defaults alone.** This step is the least important in the run and the
  most tempting to make compulsory; it must be the easiest to walk past.

`npm run choices` in `app/` builds a page at `build/tour/choices.html` that puts these four
questions side by side as pictures. It was built before this step existed, and **`build/` is
gitignored, so the page is not in the repository — run the script to see it.** Treat what it
shows as the content for step 9: the four questions and their pairings are right. Do not
delete it — `app/tests/tour/**` is off limits below, and the `choices` script in
`app/package.json` goes with it. Put "delete `choices.spec.ts`, the `choices` and `review`
scripts and the second page in `scripts/open-tour.mjs` once step 9 ships" under
**Follow-ups** for whoever owns the tour.

## §B — The bundled test PDF

He asked for one to be included ("there's a million online for free"). Two honest options:

- **A page of real public-domain sheet music.** Best test — a real engraving is what his own
  imports will look like. It must be genuinely PD and its provenance must be recorded the way
  every other bundled item's is (`source.name`, `url`, `license`, `pd_region`) and pass
  `tools/content/validate.py`. IMSLP scans of pre-1929 engravings are the obvious source.
- **Generate one from a score already bundled**, the way
  `app/tests/fixtures/imports/make-two-systems-pdf.py` generates its fixture — no toolchain, no
  new licence question, and the provenance is already settled.

**Recommendation: the second**, and there is a real engraving to be had without a toolchain:
the app engraves. A Playwright script under `app/scripts/` (`make-setup-pdf.mjs`, run by hand,
not in CI) opens the built app at `#/dev/score` with the Petzold Minuet, layout `scroll`,
strip off, and calls `page.pdf({ format: 'Letter', printBackground: true })` — Chromium
prints the SVG as vectors, so the page is a real engraving of a real piece, the brace is at the
left edge where `systems.ts` looks for it, and the provenance is the item's own `source`
block. Write that provenance into the PDF's `Title`/`Subject` metadata and into a sentence on
the step. It is a setup asset, not a catalog item, so it lives at
`app/public/content/setup/petzold-minuet.pdf` and needs no `validate.py` entry; say in
`docs/03-content-pipeline.md` that it exists and how it is remade. The first option only if
this cannot be made to detect systems, and then only with the licence certain.
`app/tests/fixtures/imports/two-systems.pdf` is a *fixture* — blank staves, drawn by hand to
exercise brace detection — and is not good enough to show a person. Whichever you choose, it
ships in `app/public/`, is precached, and the setup step must work with the phone in aeroplane
mode.

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

  Two things about it changed in P21 and both apply to any scene you add. Every scene takes a
  fifth argument — a selector or a predicate that must hold before the shutter opens — and a
  scene that cannot prove itself is recorded as a gap rather than photographed; and every
  picture is hashed, so two scenes that come back with the same picture under different captions
  are printed as a finding. Thirteen of the tour's pictures were lying that way before this
  existed. A run that ends with a gap or an identical pair is a run that found something.

  The current baseline, so you know what you changed: 325 pictures, **0 gaps, 0 identical**,
  1,436 unit tests, 281 e2e, and the seven mechanical audit checks reporting nothing. The four
  rules of `04` §0 do report — R2 density is 112 rows over budget and is a known open question,
  not something you broke.

## Out of scope — being done in parallel, do not touch

**Because it is parallel, work on a branch**: `feat/p20-setup` off the current head of
`claude/piano-teaching-app-bo19td`, rebased onto it before merging. The files both sides will
touch are `router.ts` (`SUB_IDS`), `SettingsScreen.ts`, `TodayScreen.ts`, `style.css` and
`package.json`; keep your additions to those append-only and in their own blocks, so the
rebase is mechanical. The common header's branch line still names the target; this is where
the work happens until it is merged.

- `app/tests/tour/**` and `app/playwright.tour.config.ts` (the screenshot tour and the choices
  script) — mine.
- Landscape and portrait layout of the **score screen** — mine. If a setup screen looks wrong
  sideways, fix that screen; leave `ScoreScreen`, `WindowRenderer`, `KeyboardStrip`, `autoFit`
  and `tablet.ts` alone.
- `barsPerWindow` in landscape: an open question with the owner, decided from screenshots.
- Three things starting now, so you know they will move under you: **fitting the engraving to
  the ink** rather than to the SVG box (`WindowRenderer`), **a landscape layout for the drill
  screen** (`DrillScreen`, `.drill-stage` and the 23 prompt cards), and the clipped system
  brace at the left edge of a grand staff. Build your own screens; if one of these gets in your
  way, say so in the report rather than working around it.

## Questions to answer in the report, not to block on

1. Does the setup offer itself on Today, or only in Settings? (Recommendation: both — a card on
   Today until it is done, and a permanent row in Settings.)
2. Does step 5 use a bundled song or the same song for everyone every time? (Recommendation: the
   same one every time. A setup that varies is a setup you cannot compare against last week's.)
3. Where does the setup record live — a new IndexedDB store or a settings key? Say which and why.
4. **Sideways, the notation gets about a fifth of the screen.** Of 360 px of height the header
   takes 40, the control bar 48 and the keyboard strip 72, leaving a 194 px stage of which the
   music inks 57%. Every one of those four is defensible on its own. You will have had the
   phone's real proportions in front of you at step 9 in a way nobody else has — so: is that
   the right split, and if not, which of the four gives way first? An answer in the report, not
   a change to the score screen, which is mine.
