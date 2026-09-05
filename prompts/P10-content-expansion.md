# P10 — Stages 5–9 content expansion  ·  Intended model: **Sonnet 5**  ·  Branch: `feat/p10-content-<n>` (repeatable)

(Include `_COMMON-HEADER.md`.)

Read: `docs/02-curriculum.md` Parts D, E, G; `docs/03-content-pipeline.md`.

Each run picks one track and one stage rung (state it), imports/authors every listed option
(sources per the tags; verify license and year; exclude with a note otherwise), writes the
lesson markdown for that rung, adds curriculum JSON, validates, renders, listen-checks 5
random items, reports counts. Also grow: sight-reading levels 5+, Hanon 21–60, Czerny op. 599
selections, theory lessons outlined from Open Music Theory with attribution lines.

## Now unblocked (2026-09-05)

The owner has confirmed the app is for him alone, so a personal build may bundle CC BY-NC
editions (`00` D10a, `03` §1). That re-opens the whole `[KERN]` tier P4 had to refuse — the
eight `craigsapp` Humdrum repositories: Mozart and Beethoven sonatas, Chopin preludes and
mazurkas, Scarlatti sonatas, Joplin rags, Haydn sonatas, 370 Bach chorales. `convert.py`
already handles `**kern` and is tested on it; what is missing is an importer like
`import_musetrainer.py` with a per-file table (title, level, tracks, concepts).

Take that as the first run of this phase. Two rules: build with `--allow-nc`, and check that
the three repositories with **no licence at all** (`beethoven-piano-sonatas`,
`chopin-mazurkas`, `chopin-preludes` — they carry a bare copyright notice) stay excluded;
`--allow-nc` relaxes NC, not silence.
