# 2026-09-05 — P4: PDF sheet music, scanned and displayed

The owner asked, alongside the P4 prompt: *"it may be worth exploring a mode
for scanning pdf sheet music, or at least displaying it in a mobile friendly
way that ties into the rest of the app."*

This is the exploration. It is two separable problems with very different
answers, so they are answered separately.

## 1. Displaying a PDF page usefully on a phone — worth building

A PDF of sheet music on a 6-inch screen is unreadable at page zoom and
unnavigable at note zoom. But the app already has the answer for its own
scores: show a window of a couple of bars and move it. The equivalent for a
PDF is to show one **system** at a time — one row of music across the page —
which is the unit a pianist reads anyway.

That needs two things:

- **Rendering.** `pdfjs-dist` (Apache-2.0, currently 6.3.289) renders a page
  to a canvas. It is a ~35 MB unpacked package, but the part that ships is the
  viewer-less core plus a worker, and it can be a lazily-loaded route the way
  `/dev/score` loads OpenSheetMusicDisplay today, so it costs nothing to a
  learner who never opens a PDF.
- **Cutting the page into systems.** This is the part that decides whether the
  idea works at all, so it is prototyped here:
  `app/src/pdf/systems.ts`, with tests in `app/tests/unit/pdfSystems.test.ts`.

  The method is a horizontal projection profile — count inked pixels per row —
  which is the standard first step of every optical music recognition system
  and needs no model and no network. Staff lines are the one thing on a page
  that is dark across nearly its whole width, so they appear as five evenly
  spaced spikes per staff. Staves group into systems by the brace and the
  barlines down the left edge; the gap sizes alone are not enough, because
  three evenly spaced staves could be an organ system or three lines of a lead
  sheet, and only the brace says which.

  The prototype handles thick lines from a high-resolution scan, a grey
  photographed background, note heads and lyrics between the staves, and
  refuses to guess on a blank page. It has no UI: nothing calls it yet.

**Recommendation:** build this in P7, alongside the import path that screen
already needs. Concretely: a catalog item whose `file` is a `.pdf`, a viewer
route that renders page by page and steps system by system, and the follow
modes that do not need note data — **timed** auto-advance at a tempo the
learner sets, **manual** tap-to-advance, and looping a system. Wait mode and
mic-follow are impossible on a PDF and should be hidden rather than disabled,
since there are no notes to match against.

The catalog schema needs one small change for this — `file` currently means "a
`.mxl`/`.musicxml` under `content/`" — and `docs/03` §4 should say what a PDF
item looks like. That is a schema change, so it belongs to whoever owns the
schema next rather than being made quietly here.

## 2. Scanning a PDF into notes (OMR) — not on the phone

Turning a scan into MusicXML is what would let the *follow* engine work on the
owner's own PDFs, which is the thing actually worth having. The state of the
open-source art:

| tool | licence | what it needs | quality |
|---|---|---|---|
| **Audiveris 5** | AGPL-3.0 | a JVM, a desktop | the best open-source OMR; good on clean engraving, needs correction on anything else |
| **oemer** | MIT | Python + TensorFlow, ~100 MB of models | end-to-end, decent on clean scans, weaker on piano grand staves |
| browser-side | — | — | nothing production-grade exists |

None of these can run on the phone, and none is accurate enough to trust
without review — OMR output always needs correcting in a notation editor.

**Recommendation:** treat OMR as an *offline, builder-side* step, not an app
feature. The owner runs Audiveris (or oemer) on a laptop, corrects the result
in MuseScore, and imports the MusicXML through the import path P7 builds. That
path already has to exist for legally-obtained MusicXML of copyrighted songs
(`docs/00` D10), so it costs nothing extra.

If it later seems worth automating, the right shape is a `tools/content/omr.py`
that shells out to Audiveris for a batch of PDFs and reports which ones came
out clean enough to keep — the pipeline is already built to run steps like
that and to record where each file came from.

## 3. What was actually built in P4

Only the spike: `app/src/pdf/systems.ts` and its tests. No dependency was
added, no screen was written and no schema was changed, because the P4 prompt
is the content pipeline and those belong to P6/P7. The spike exists so that
whoever builds the screen starts from a measurement rather than a hope.
