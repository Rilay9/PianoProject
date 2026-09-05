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
| `[PDMX]` | **GitHub README, data on Zenodo** `pnlong/PDMX` — 250k+ public-domain MusicXML from MuseScore with a metadata CSV | MusicXML | download the subset; filter `instrument == piano`, `license in (CC0, CC BY, PD)`, title match | Best source for Burgmüller, Clementi, Czerny, Beyer, Schumann op.68, Tchaikovsky op.39, Bach Inventions, Kuhlau, Gurlitt etc. — but quality varies; render-check each file. |
| `[MUTO]` | Mutopia Project (mutopiaproject.org; GitHub mirror `MutopiaProject/MutopiaProject`) | LilyPond (+PDF/MIDI) | `ly musicxml file.ly > out.xml` (python-ly) for simple pieces; else `lilypond --midi` → music21 from MIDI (lossy: loses articulation; acceptable for exercises only) | Has Anna Magdalena Notebook, Burgmüller op.100, Czerny, Clementi sonatinas, Beyer, Hanon, many Bach/Mozart/Beethoven. |
| `[IMSLP]` | imslp.org | PDF, some MusicXML/MIDI | manual: only take files explicitly tagged MusicXML with a CC/PD edition license | Slow and manual — last resort. |
| `[AUTH]` | our own | ABC (`content/scores/authored/*.abc`) or music21 tinyNotation in `authored/*.py` | `music21.converter.parse(abcText)` → MusicXML; add fingering/lyrics/chord symbols in ABC (`"C"` chord symbols, `!1!` fingering) | For folk/hymn/holiday/lead sheets (Part F of the curriculum). ABC is 1–10 lines per tune; Sonnet can author 60–100 of these in one session. |
| `[GEN]` | `tools/content/generate_exercises.py` | music21 streams | run at build time | scales, arpeggios, chords/inversions, Hanon 1–20, five-finger patterns, rhythm drills, sight-reading generator *seeds* (the app also has a runtime sight-reading generator in TS that emits MusicXML directly — see 05 §8) |

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
