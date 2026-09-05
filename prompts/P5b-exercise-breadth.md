# P5b — Exercise breadth, alternatives, offline-first content  ·  Intended model: **Sonnet 5** (Opus for the fingering rules)  ·  Branch: `feat/p5b-exercises`

(Include `_COMMON-HEADER.md`.)

Read: `docs/02-curriculum.md` Part E, **Part E2**, Part G; `docs/03-content-pipeline.md`
§3–§4; `docs/00-overview.md` D20 and D21; `docs/01-architecture.md` §5–§7;
`docs/04-ui-spec.md` §2, §7, §7b; `docs/05-score-follow-engine.md` §7;
`content/catalog.schema.json`, `content/curriculum.schema.json`.

## Why this phase exists

P5 measured two holes and did not fix them. Both are owner priorities (`00` D21):

1. The generator is a conservatoire technique syllabus — 96 scales, 60 Hanon, 24 arpeggios —
   and has **nothing** for the skills Stages 1–3 are actually made of. Unit 3.6 is entirely
   about accompaniment patterns and has zero generated exercises. Units 2.1, 2.5, 3.2 and 3.5
   have runtime drills and no notation.
2. Eleven of 55 units offer fewer than three song options, and several units are about skills
   no song tests, while Part G still demands a song to complete a lesson.

Do not treat this as tidying. **A skill with no exercise is a skill the app cannot teach.**

## Build

### 1. Generator families (`tools/content/generate_exercises.py`)

Build every family in `02` **Part E2**. Per family: correct standard fingering in
`<fingering>` elements, a sensible level, `tracks`, `concepts`, and a `drill` block where the
runtime needs parameters. Notes on the ones with traps:

- **`five-finger` hands separately** — `make_five_finger()` already takes `hands`; `default_plan`
  only ever passes `"both"`. One line, and it unblocks units 1.1 and 1.3. Do it first so the
  cheap win is in.
- **`coordination`** — LH whole or half note under an RH five-finger walk, and a variant where
  the LH alternates C and G each bar. This is unit 2.1's entire content.
- **`cadence`** — per key, twice: root position, then the voice-led version keeping common
  tones (C → F/C → G7/B → C). Print both so the lesson can show the difference.
- **`accompaniment`** — broken chord (root-5th-3rd-5th), Alberti (low-high-mid-high) and waltz
  bass, over a I–IV–V–I sequence, in C G F Am at minimum; LH alone *and* hands-together with an
  RH scale over the top, because independence is the skill.
- **`rhythm` with a meter parameter** — `make_rhythm` hardcodes 4/4 and `RHYTHM_PATTERNS` are
  4/4 lengths. Make the meter a parameter and add 3/4 and 6/8 patterns; unit 1.4 needs 3/4 and
  4.5 needs 6/8 and neither exists.
- **`interval-reading`** — deterministic from a seed so a lesson can name a specific one; fixed
  hand position; intervals restricted to 2nds and 3rds.
- **`shuffle`** — straight eighths on the page with the word "Shuffle" as a direction, the way
  a real chart does it. Do not write triplets.
- **`pedal`** — a chord sequence with pedal marks, matching what the `pedal` drill scores
  (`05` §7).

Keys, hands and octave counts follow the existing conventions. Say in the report how many
items each family produced.

### 2. Alternatives (`content/`, schema, `validate.py`)

- Add optional **`alternatives: string[]`** to `content/catalog.schema.json` — other catalog
  ids that train the same thing. `validate.py` MUST check every reference resolves, exactly as
  it does for `variantOf`.
- Populate it where it earns its place: the **seven rock-module import placeholders** point at
  the public-domain vehicle each technique brief already names in prose (Seize the Day →
  Moonlight I and Chopin op. 28 no. 4, and so on — read the briefs, do not invent).
- Add **`songOptional: boolean`** to the lesson object in `content/curriculum.schema.json`.
- **`validate.py` enforces `00` D21**: every lesson has ≥ 3 `exerciseOptions`, and ≥ 3
  `songOptions` *unless* `songOptional` is true, in which case ≥ 3 options in total. Make the
  failure message name the unit and say how many it has.

### 3. Backfill the curriculum

- Mark song-optional the units whose skill no song tests: 1.5, 2.5, 3.6, and every
  `theory-ear.*` and `improv-compose.*` rung.
- Bring the eleven thin units up to three, using the new exercises: 1.4, 2.2, 2.4, 2.5, 3.1,
  3.5, 3.6, 4.4, 4.5.
- Wire the new families into the units they were built for. Every new exercise should be
  reachable from at least one lesson; report any that is not.

### 4. Files that also change — do not stop at the generator

The owner asked for this explicitly. Work through all of them:

- `docs/02` Part G — the mastery wording is already updated; make the data match it.
- `docs/06-build-plan.md` — this phase's entry, and §3 "definition of done" if the counts move.
- `tools/content/tests/` — **a unit test per new family**, asserting what actually matters:
  the fingering on the notes that carry a position change, the meter, the bar count, and the
  hand a hands-separate item is on. `test_generator.py` is the pattern to follow.
- `tools/content/tests/test_validate.py` — new tests for the three-alternatives rule and for
  an `alternatives` reference that does not resolve. Add the file if it does not exist.
- `app/` — the curriculum selectors read `songsRequired`; teach them `songOptional`, and add
  unit tests. Do not build the "Swap this" UI here — that is P7 (`04` §2) — but the selector
  it needs (`alternativesFor(itemId, lessonId)`) belongs in this phase with its tests.
- `docs/04` §7b Diagnostics lists "any lesson whose options fall below the three-alternative
  rule". Emit the data the screen needs from the content build (a line in the validate output
  and a field in the built `curriculum.json` is enough); P7 renders it.

### 5. Offline (`00` D20) — verify, do not assume

The whole library is precached, so this phase's job is to keep that true as it grows:

- Re-measure the content payload and record it in `01` §6 next to the existing 6.0 MB figure.
- Confirm `vite-plugin-pwa`'s `maximumFileSizeToCacheInBytes` is raised past the soundfont's
  size. Workbox's 2 MB default silently drops files, and the soundfont is 2.6 MB — check this
  even if the app appears to work online.
- One e2e: load, go offline with `context.setOffline(true)`, reload, and open a score, a
  generated exercise, and a lesson. All three must work.

## Acceptance

- `python3 tools/content/build.py --out app/public/content --skip-fetch --strict-license
  --render` clean; every new item renders; report the preview review with exclusions.
- `python3 -m unittest discover -s tools/content/tests -t .` green, including the new tests.
- `npm run typecheck && npm test && npm run lint` green.
- `validate.py` passes with the three-alternatives rule **on**, which means no unit is thin.
- Report: items per new family, total catalog size before and after, payload MB, the list of
  units that changed, and any exercise not reachable from a lesson.
