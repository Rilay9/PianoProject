# Content pipeline

Everything the app shows as sheet music is produced here. The runtime reads
only what this writes into `app/public/content/`: `catalog.json`,
`curriculum.json`, `scores/**/*.mxl` and `lessons/**/*.md`.

The rules the pipeline enforces are in `docs/03-content-pipeline.md`; this file
is how to run it.

## The one command

```bash
python3 tools/content/build.py                 # fetch, build, validate
python3 tools/content/build.py --offline       # no network; uses what is already cloned
python3 tools/content/build.py --quick         # a small generator subset, for a fast loop
python3 tools/content/build.py --render        # …and render every item in Chromium (slow)
```

`app`'s `npm run build` runs the full `build.py` through `prebuild`, every time.
It used to run `--if-missing`, which skipped the rebuild whenever a catalog
already existed — so an edited source stayed silently stale in the built app
(replan §7.9). The conversion cache below makes a no-change build cheap enough
that always running it is the simpler correct thing; `--no-cache` forces every
source back through music21.

## The steps, and when you would run one on its own

| script | what it does |
|---|---|
| `fetch.py` | Clones the sources in `docs/03` §2 that it can reach; writes `content/scores/imported/SOURCES.md`. `--only musetrainer,kern`, `--offline`, `--force`, `--list`. |
| `convert.py` | Any source format → one compressed MusicXML with a single piano part and two staves. `--batch DIR --out DIR --pattern '**/*.krn'` for a whole repository. |
| `import_musetrainer.py` | The `[MT]` library → catalog entries, one licence decision per file from `content/sources/musetrainer.json`. |
| `generate_exercises.py` | Scales, arpeggios, inversions, five-finger patterns, the chromatic scale, rhythm drills and Hanon 1–20. |
| `author.py` | `content/scores/authored/*.abc` and `*.py` → scores plus catalog entries. |
| `validate.py` | Schemas, cross-references, licences, durations, unique ids. `--strict-license` also refuses anything not redistributable. |
| `render_check.py` | Loads every item in a real browser, asserts it yields a ScoreModel step, writes `build/previews/*.png`, and puts the measured durations back in the catalog. |

Two more are run only when the encoding is questioned, because their output is
committed:

| script | what it does |
|---|---|
| `extract_hanon.py` | Re-reads Hanon 1–20 from the Mutopia edition into `content/sources/hanon-mutopia.json`. |
| `extract_fingering.py` | Re-reads Clementi Op. 42's scale fingerings into `content/sources/clementi-op42-fingering.json`. |

Both need `python3 tools/content/fetch.py --only mutopia` first — Mutopia is
opt-in because it is a large clone.

## Adding a tune

Write `content/scores/authored/<name>.abc` with a `%%pianopath` header:

```
%%pianopath id=song.folk.example level=2.1 hands=both tracks=core,classical
%%pianopath concepts=4/4,I-IV-V license=CC0
```

`id`, `level` and `tracks` are required; everything else has a default. Then
`python3 tools/content/build.py --offline`. Fingering goes in as `!1!`…`!5!`
before a note and chord symbols in double quotes; both survive into the score.

For something ABC says awkwardly, write a module instead: define `PIANOPATH`
(the same keys) and `build()` returning a music21 `Score`. See
`content/scores/authored/blues-12-bar-c.py`.

## Tests

```bash
python3 -m unittest discover -s tools/content/tests -t tools/content
```

They cover the converter on a sample of every input format, the licence gate,
the ABC preprocessor, the authored sources, and the two encodings read from
published editions.
