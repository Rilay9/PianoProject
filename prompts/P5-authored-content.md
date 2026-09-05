# P5 — Authored tunes, lessons, curriculum data  ·  Intended model: **Sonnet 5**  ·  Branch: `feat/p5-content`

(Include `_COMMON-HEADER.md`.)

Read: `docs/02-curriculum.md` (all — this is your spec); `docs/03-content-pipeline.md` §1, §5, §6;
`content/curriculum.schema.json`.

Work in three passes and commit after each.

## Pass 1 — Tunes (`content/scores/authored/*.abc`)
Author every entry in curriculum Part F as ABC with `%%pianopath` metadata, correct key/time,
melody with fingering hints at position changes, a `simple` LH and where the table says so a
`full` LH (broken chords / waltz / Alberti), chord symbols in quotes. Public-domain melodies
only; write the arrangement yourself (license CC0). For the jazz/blues/latin lead sheets:
melody + chord symbols + a simple written LH (roots and shells) — verify the composition's
publication year ≤ 1930 and put it in the metadata; skip anything you cannot verify. Render
each with `author.py` and fix errors. Then listen-check 10 random tunes in the P2/P3 dev
route (Listen mode) for wrong notes.

## Pass 2 — Lessons (`content/lessons/<lessonId>.md`)
One file per lesson in Stages 0–4 and per track rung 3–5, following `03` §6 (≤ 400 words,
define terms, intuition → rule → what to do, one common mistake, one "you'll know"). Find the
actual free video URLs for the teachers named in the curriculum (Bill Hilton's beginner
playlist, Hoffman Academy, Lypur, Josh Wright, Aimee Nolte, Open Studio, Piano With Jonny…);
record `label`, `teacher`, `url`. Do not copy their text.

## Pass 3 — Curriculum JSON (`content/curriculum/*.json`)
Encode Stages 0–4 (all units/lessons with ≥ 2 exercise options and ≥ 3 song options each,
mastery per Part G) and tracks to Stage 5, referencing catalog ids from P4 + Pass 1 + the
generator. Run `validate.py` until clean.

## Acceptance
`build.py` clean; every lesson's options resolve; counts reported (tunes, lessons, lessons per
stage); list of tunes skipped with reasons.
