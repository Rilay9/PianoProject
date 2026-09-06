# 03 — Content pipeline, sources, licensing

Everything the learner sees as sheet music passes through `tools/content/`. The runtime app
only ever reads `app/public/content/catalog.json`, `curriculum.json`, `scores/**/*.mxl`, and
`lessons/**/*.md` produced by that pipeline.

## 1. Licensing rules (hard rules — a builder MUST NOT bend them)

1. **Bundle only** works whose *composition* is public domain in the US (published 1930 or
   earlier as of 2026 — the year advances by one each January; or traditional/anonymous) **and**
   whose *edition/arrangement* is public domain or CC-licensed (CC0, CC BY, CC BY-SA; **not**
   CC BY-NC/ND for redistribution inside an app we might later share). Arrangements we write
   ourselves are ours; mark them `license: "CC0"`.
   **Amendment 2026-09-05 (owner, `00` D10a):** the app is for one person, so a *personal*
   build may include **CC BY-NC** editions — `python3 tools/content/build.py --allow-nc`.
   It is off by default and every NC item is tagged `nc-personal-build` in the catalog, so a
   deploy can be checked. ND stays excluded outright: it forbids the normalisation this
   pipeline performs. A build made with `--allow-nc` must not be published to a public URL.
   **Second amendment 2026-09-05 (owner, `00` D19):** the repo goes private and the app ships
   as an APK on the owner's own phone, so the finished build is not published anywhere and the
   *edition* licence stops constraining it. When that happens, `--allow-nc` becomes the
   default and ND may be admitted too. **Until the repo is private, nothing changes**: CI
   deploys to a public Pages URL and that deploy is a publication. Whoever flips the default
   must flip the Pages workflow to `--strict-license` in the same commit, or delete it.
   Two things are *not* relaxed by any of this, because neither is about redistribution:
   a source that states **no licence at all** still gets recorded as such in the ledger, and
   **transcriptions of copyrighted songs are never downloaded** (rule 3 below, `00` D18).
   **Third amendment 2026-09-06 (owner, `00` D23):** the second of those is relaxed for
   **PDMX only**. The dataset is already on the owner's disk under its own licence; for his
   personal build every file it marks `publicdomain` or `cc-zero` is a candidate whatever
   the composition's status. The composition test still runs and its answer is recorded on
   the item as `compositionStatus` (`pd` / `unknown` / `in-copyright`); items that are not
   `pd` are tagged `personal-build`, admitted only by `build.py --personal` (which replaces
   `--allow-nc` as the owner's flag and implies it), and refused by `--strict-license`.
   The Pages deploy keeps `--strict-license` until the repository is private, exactly as
   for NC editions.
2. Every catalog item has a `source` block: `name`, `url`, `license`, `pd_region`
   (`worldwide` / `US`), `fetchedAt`, and `checksum`. `tools/content/validate.py` rejects
   items without it.
3. **Teaching videos are links** (`media[]` entries), never downloaded, never embedded beyond
   a YouTube link opened in the browser. Course PDFs (e.g. Bill Hilton's notes) are linked too.
4. Text quoted from **Open Music Theory** (CC BY-SA 4.0) or **Wikipedia** (CC BY-SA 4.0) must
   carry an attribution line in the lesson markdown. Prefer writing our own prose.
5. `[IMPORT]` items are catalog entries with `file: null` and an `importHint`; the app shows
   them greyed with "Import your own copy".
6. Keep `content/scores/imported/SOURCES.md` as the provenance ledger (one line per file).

## 2. Sources (in priority order) and how to fetch them

Egress note: the AI build environment may only reach GitHub (raw.githubusercontent.com),
npm, and PyPI. The sources marked **GitHub** work in that case; the others need a normal
network (a Codespace, the owner's laptop, or a session with open egress). `fetch.py` must
degrade gracefully: skip unreachable sources with a warning and continue.

| Tag | Source | Format | How | Notes |
|-----|--------|--------|-----|-------|
| `[MT]` | **GitHub** `musetrainer/library` (`scores/*.mxl`, 69 files) | MXL | `git clone --depth 1` | Public-domain MusicXML library used by the MuseTrainer app; contains Bach Minuet Anh 114, Musette-like pieces, Für Elise (3 editions), Canon in D (3), Gymnopédie 1 (2), Gnossienne 1, Clair de Lune (2), Moonlight 1 & 3, Pathétique 2, K.545, K.331 Rondo, WTC I Prelude 1 & 2, Chopin Preludes 4 & 20, Nocturnes 9/1, 9/2 (+easy), 20, Waltzes 64/2 & A minor, Ballade 1, Joplin Entertainer (2) & Maple Leaf Rag, Greensleeves (easy), Happy Birthday, Ode to Joy (easy variation), Carol of the Bells (2), Twinkle variations (Mozart K.265), Air on G, Ave Maria, Lacrimosa, Swan Lake, Sugar Plum Fairy, Waltz of the Flowers, Hungarian Dance 5, Liebestraum 3, La Campanella, Flight of the Bumblebee, Arabesque 1, Bella Ciao. **Check the repo's stated license per file** (`index.html`/README list) before use; treat as verified-PD arrangements from MuseScore contributors, and record each in SOURCES.md. |
| `[KERN]` | **GitHub** `craigsapp/*` Humdrum repos: `mozart-piano-sonatas`, `beethoven-piano-sonatas`, `chopin-preludes`, `chopin-mazurkas`, `scarlatti-keyboard-sonatas`, `joplin`, `bach-370-chorales`, `haydn-piano-sonatas` (all eight verified reachable; `bach-wtc` and `bach-inventions` do not exist under `craigsapp/`) | `**kern` | `tools/content/import_kern.py`, per-file table in `content/sources/kern.json` | **Measured, not assumed** (2026-09-05): five carry a `LICENSE.txt` stating CC BY-NC-SA 4.0 and every file repeats it in a `!!!YEM` record — bundled only under `--allow-nc` (`00` D10a). `beethoven-piano-sonatas`, `chopin-mazurkas` and `chopin-preludes` state **no licence at all**; the Chopin preludes carry a bare `!!!YEC` copyright line, which is a claim rather than a grant. Those three stay excluded whatever the flag says, and `import_kern.assert_excluded()` re-proves it on every build. |
| `[NIFC]` | **GitHub** `pl-wnifc/humdrum-chopin-first-editions` (512 files) and `pl-wnifc/humdrum-polish-scores` (8,918 files) | `**kern` | `tools/content/import_kern.py`, groups in `content/sources/kern.json` | The Fryderyk Chopin Institute's *Chopin Heritage in Open Access* encodings of the 19th-century first editions, **CC BY 4.0** — redistributable, so no `--allow-nc`, attribution carried in each item's `source` block. 191 solo-piano works after choosing one publisher per piece. This is what fills the Chopin rungs `craigsapp/chopin-preludes` and `chopin-mazurkas` cannot. The Polish-scores repository is the same licence and is opt-in in `fetch.py`; nothing in `02` asks for it yet. |
| `[PDMX]` | **Zenodo, on the owner's machine only** — `PDMX.csv` (254,077 rows) and `mxl.tar.gz`; `data.tar.gz`, `pdf.tar.gz` and `subset_paths` are not needed. Never fetched by CI, never committed. | MXL | `tools/content/pdmx/` — `select.py` (CSV → shortlist), `extract.py` (streams the tar once), `quarry.py` (convert, round-trip, features, level estimate, render), `review.py` (a static page + `review.csv` the owner fills), `commit.py` (the `keep` rows → `content/scores/pdmx/*.mxl` + `content/sources/pdmx.json`); the build's `import_pdmx.py` reads only the committed files and verifies their checksums | **Measured 2026-09-05:** the CSV's `license` column is the uploader's claim about the *edition* (every row is `publicdomain` or `cc-zero`, including Yiruma and Billie Eilish arrangements). The composition test runs on `composer_name` against `content/sources/composers.json` and finds about 4,200 public-domain compositions among 36,150 deduplicated solo-piano rows (2,764 traditional, 191 Bach, 138 Beethoven, 135 Mozart, 91 Chopin, 37 Czerny, 13 Clementi, 4 Burgmüller, 1 *Frog Legs Rag*, 0 *Euphonic Sounds*). **Under `00` D23 the result is a label, not a gate**: the personal build takes any PDMX row the dataset marks public domain and the strict build takes only `compositionStatus: pd`. Ranking by rating and the per-band, per-genre quotas in the replan decision §2.2 do the selecting; the machine quality gates in §2.3 and a human review decide admission, and nothing is committed without a `keep`. Its best uses for this owner: the *reference* against which Part F folk tunes are authored (the verification P5 lacked), small-form classical at Stages 3–5, the well-rated easy pop and film arrangements, and the rock-module and *Beautiful* wish-list songs by title. |
| `[MUTO]` | Mutopia Project (mutopiaproject.org; GitHub mirror `MutopiaProject/MutopiaProject`) | LilyPond (+PDF/MIDI) | `ly musicxml file.ly > out.xml` (python-ly) for simple pieces; else `lilypond --midi` → music21 from MIDI (lossy: loses articulation; acceptable for exercises only) | Has Anna Magdalena Notebook, Burgmüller op.100, Czerny, Clementi sonatinas, Beyer, Hanon, many Bach/Mozart/Beethoven. |
| `[IMSLP]` | imslp.org | PDF, some MusicXML/MIDI | manual: only take files explicitly tagged MusicXML with a CC/PD edition license | Slow and manual — last resort. |
| `[AUTH]` | our own | ABC (`content/scores/authored/*.abc`) or music21 tinyNotation in `authored/*.py` | `music21.converter.parse(abcText)` → MusicXML; add fingering/lyrics/chord symbols in ABC (`"C"` chord symbols, `!1!` fingering) | For folk/hymn/holiday/lead sheets (Part F of the curriculum). ABC is 1–10 lines per tune; Sonnet can author 60–100 of these in one session. |
| `[GEN]` | `tools/content/generate_exercises.py` | music21 streams | run at build time | scales, arpeggios, chords/inversions, Hanon 1–20, five-finger patterns, rhythm drills, sight-reading generator *seeds* (the app also has a runtime sight-reading generator in TS that emits MusicXML directly — see 05 §8) |

**Easy arrangements (2026-09-06).** When a ladder asks for an "easy arr." of a public-domain
piece and no source has one, an authored simplification under `[AUTH]` satisfies the rung.
The ABC file's `%%pianopath` header names the edition or PDMX CID it was checked against.

**Pipeline additions from P11 (2026-09-06):** conversions are cached under `build/cache/`
by source checksum, converter version and music21 version; the render check keeps
`build/render-manifest.json` and renders only files whose checksum it has not seen
(`--full` renders everything; run it whenever the renderer or converter moves); `validate.py` checks catalog and
unit tracks against `content/curriculum/00-tracks.json` (the schema enum is gone), requires
`levelSource` on every item, and reports orphan exercises. The per-item render report
carries console errors, cursor-step parity, a duration-per-bar sanity flag, a hands check and
the grace-16th truncation scan.

Finding more: `humdrum-tools/humdrum-data` is an index of 75 Humdrum collections and is the fastest way to see what exists. Checked from it and **refused**, with reasons recorded in `content/sources/kern.json` under `checkedAndRefused`: `humdrum-tools/bach-wtc` and `humdrum-tools/inventions` (they exist — this answers the "verify names" note above — but every file says *"Rights to all derivative electronic formats reserved"*), `craigsapp/hummel-preludes` and `craigsapp/art-of-the-fugue` (bare copyright, no grant).

Also worth knowing about `[MUTO]`: its Joplin folder holds 18 rags and each `.ly` header states `license = "Public Domain"` — a stronger licence than the CC BY-NC-SA `craigsapp` edition the ragtime tier currently uses. The clone in `content/scores/imported/mutopia` is a **sparse checkout** limited to Hanon and Clementi; `git sparse-checkout` opens the other 322 composer directories.

## 3. Pipeline steps (`tools/content/build.py` orchestrates)

1. `fetch.py` — clone/download sources into `content/scores/imported/<source>/` (idempotent;
   respects `--offline`).
2. `convert.py` — every non-MusicXML input → MusicXML via music21 / python-ly; normalise:
   - ensure a **single piano part with two staves** (`<staves>2</staves>`); if the source has
     two parts (RH/LH as separate parts), merge into one part with `<staff>` numbers;
   - unroll nothing (repeats stay; OSMD's cursor unrolls at runtime);
   - keep `<fingering>`, `<harmony>` (chord symbols), `<sound tempo>`; add a default
     `<sound tempo>` from `tempoBpm` metadata if missing;
   - strip lyrics for instrumental items unless `keepLyrics: true`;
   - write compressed `.mxl`.
3. `generate_exercises.py` — produce `[GEN]` items + their catalog entries.
4. `author.py` — compile `authored/*.abc` and `*.py` into MusicXML, attach metadata from the
   YAML front-matter of each ABC file.
5. `validate.py` — schema-check `catalog.json`/`curriculum.json`; every referenced file
   exists; every curriculum option id exists in the catalog; every item renders in OSMD
   headless (Node + jsdom or Playwright) without exceptions and yields ≥ 1 ScoreStep;
   duration sanity (5 s – 20 min); license present.
6. `render_check.py` — Playwright screenshot of the first 2 bars of every item to
   `build/previews/*.png` for eyeballing (Sonnet reviews them in batches, flags broken ones).
7. Output to `app/public/content/`: `catalog.json`, `curriculum.json`, `scores/**.mxl`,
   `lessons/**.md`, `audio/<soundfont>`.

### 3a. What the build remembers between runs (P11)

Steps 2 and 6 were the whole cost of a build, and almost none of their work changes from
one run to the next. Both now remember what they did. Neither cache can change an answer,
only when it is computed, because each key covers every input to that answer.

**The conversion cache** — `build/cache/convert/`, written by `convert.cached_convert()`.
The key is the sha256 of the source bytes, a sha256 of `convert.py` + `abc_tools.py`, the
music21 version, and the conversion options (a forced tempo, `keep_lyrics`, an overridden
title — all of which change the written file, so keying without them would hand two callers
one another's score). Each entry is the `.mxl` plus a JSON sidecar holding the
`ConversionResult`, so a hit reconstructs everything a caller reads. Both are written
through a temporary name and renamed, so a run killed mid-write leaves a miss rather than a
truncated file the next run would trust. A cache that cannot be written is not an error.
`--no-cache` on `build.py` (or any of the three importers) forces every source back through
music21.

**The render manifest** — `build/render-manifest.json`, written by
`app/tests/e2e/content-render.spec.ts`. One entry per *output file* sha256, holding what
that render measured: ok, steps, measures, duration, tempo, time and key signature, hands,
cursor steps, render time, console output, and any error. A run engraves only files whose
hash it has not seen and reuses the recorded numbers for the rest, so `apply_durations`
still writes a complete catalog. It is flushed every 20 fresh renders, so a run that
crashes half way through costs at most twenty rather than everything.

The manifest has one blind spot by construction: a change in OpenSheetMusicDisplay, in the
ScoreModel extractor or in the browser leaves every remembered result standing, because no
score file moved. `render_check.py --full` ignores the manifest, and
`render_check.py --full` closes it, either locally or through
`.github/workflows/render-full.yml`, which is dispatched by hand.

`build.py --if-missing` used to skip the whole content build whenever a catalog already
existed. It is gone: it made an edited source silently stale in `npm run build`, and with
the cache the build is cheap enough to always run.

## 4. Catalog and curriculum schemas

Authoritative JSON Schemas are `content/catalog.schema.json` and
`content/curriculum.schema.json` in this repo. Keep them in sync with `01-architecture.md` §5.

## 5. Authoring conventions for `[AUTH]` ABC files

```
X:1
T:Amazing Grace
C:Traditional (New Britain, 1835)
%%pianopath id=song.hymn.amazing-grace.simple level=2.3 hands=both tracks=chords-pop,hymns-gospel concepts=3/4,I-IV-V,block-chords
%%pianopath license=CC0 arranger=PianoPath
%%score {1 2}
L:1/8
M:3/4
Q:1/4=84
K:G
V:1 clef=treble
V:2 clef=bass
[V:1] D2 | "G"G4 (B/G/) | B4 A2 | G4 E2 | D4 D2 | "G"G4 (B/G/) | B4 A2 | "D7"d6- | d4 |]
[V:2] z2 | G,,2 [B,,D,]2 [B,,D,]2 | ... 
```

- `%%pianopath` lines carry metadata parsed by `author.py` (key=value, comma lists).
- Fingering: `!1!`…`!5!` before a note. Chord symbols in double quotes. Lyrics via `w:`.
- Two versions per song where the curriculum says so: `…simple` and `…full`.
- Always test-render with `music21` → OSMD; ABC voices must align bar-for-bar.

## 6. Lesson text conventions (`content/lessons/<lessonId>.md`)

Front-matter: `title`, `stage`, `unit`, `concepts[]`, `videos[]` (`{label, url, teacher}`),
`readingTime`. Body: ≤ 400 words, written for an adult engineer who is a musical beginner:
define every term the first time (e.g. "a *triad* is three notes stacked in thirds — every
other letter name"), give the intuition, then the rule, then "what to do at the piano".
Include one "Common mistake" and one "How you'll know you've got it".
