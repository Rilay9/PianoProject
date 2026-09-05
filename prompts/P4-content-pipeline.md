# P4 — Content pipeline  ·  Intended model: **Sonnet 5** (escalate convert.py edge cases to Opus)  ·  Branch: `feat/p4-content-pipeline`

(Include `_COMMON-HEADER.md`.)

Read: `docs/03-content-pipeline.md` (all); `content/*.schema.json`; `tools/content/generate_exercises.py`;
`docs/02-curriculum.md` Parts D–F for which sources are needed.

## Build

1. `fetch.py`: clone `musetrainer/library` and the `craigsapp` kern repos named in `03` §2
   (probe which exist), download PDMX metadata if reachable; `--offline` flag; provenance rows
   appended to `content/scores/imported/SOURCES.md`. Network may be restricted to GitHub —
   handle failures gracefully and report which sources were skipped.
2. `convert.py`: kern/ABC/LilyPond(simple)/MusicXML → normalised 2-staff MXL (merge two parts
   into one part with `<staff>`; keep fingering, harmony, tempo; add default tempo; strip
   lyrics unless flagged; compressed output). Unit tests on small samples of each format.
3. `author.py`: compile `content/scores/authored/*.abc` (with `%%pianopath` metadata) and
   `*.py` (music21) → MXL + catalog entries.
4. Extend `generate_exercises.py`: verify VERIFY fingerings against a published scale
   fingering chart and document the source; add chromatic scale, dominant-7th and
   diminished-7th arpeggios, five-finger patterns in all 12 keys, rhythm drills (one-line
   staff), Hanon 2–20 encoded from a public-domain edition (IMSLP/Mutopia; encode each as cell
   offsets and unit-test the first two bars and the first descending bar against the print).
5. `validate.py` + `render_check.py` (Playwright: load each MXL in OSMD headless, assert ≥ 1
   step via the P2 extractor, screenshot first 2 bars to `build/previews/`). `build.py`
   orchestrates everything into `app/public/content/`.
6. Import the `[MT]` library: create catalog entries (title, composer, level estimate using the
   curriculum's ABRSM mapping, tracks, concepts, source block with license as stated by the
   repository), exclude any file that fails render or has an unclear license.

## Acceptance
`python tools/content/build.py` runs clean from a fresh clone; catalog validates; every item
renders; preview PNGs reviewed (list the ones excluded and why). CI runs the content build.
