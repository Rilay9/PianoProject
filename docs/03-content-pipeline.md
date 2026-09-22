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
   **Fourth amendment 2026-09-12 (owner: *"just forget about the personal flag thing. It
   should always treat the app as my personal app"*):** `build.py` treats `--personal` as
   its **default**, so the owner's build needs no flag at all. `--no-personal` opts out, and
   `--strict-license` — or `PIANOPATH_STRICT_LICENSE=1`, which is how the Pages workflow asks
   for it inside `npm run build` — is the public build. `--allow-nc` survives as the
   narrower older spelling. The sentences above that call the flag opt-in describe the
   dates they carry.
2. Every catalog item has a `source` block. The schema (`content/catalog.schema.json`)
   requires `name`, `license` and `pd_region` (`worldwide` / `US`); `url`, `fetchedAt` and
   `checksum` are carried where the source has them — an importer records the checksum of
   the file it shipped, a generated exercise has no URL. `tools/content/validate.py` rejects
   an item with no licence and, under `--strict-license`, one whose shipped file is not
   redistributable; it reads nothing else out of the block.
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
| `[FOUND]` | **The owner himself, through a finder** (P15). Not fetched by anything: every rung and every concept carries a `finder` block, `tools/content/finder.py` turns it into a search line and a chat prompt at build time, and he goes and gets the file. | MusicXML / MXL / PDF | The app's import path — share sheet, file picker, or the lesson page's "Import for this rung" — then the assign sheet (`04` §4), which attaches it to the rung, levels it with the runtime port of `difficulty.py` (`app/src/score/difficulty.ts`) and stores it in IndexedDB. | **Never enters this repository.** It is the owner's own copy of music he found or bought, held on his phone and in his backup, and `curriculum/load.ts` overlays it onto the rung's `songOptions` at runtime — so it counts towards finishing a rung without ever being committed. This is the answer to `00` D10 and D18: copyrighted repertoire is reachable, and it arrives by import rather than by the pipeline downloading it. `validate.py` refuses any generated prompt that asks for a copyrighted transcription to be downloaded. |
| `[MIDI]` | **The owner's own playing**, through `tools/midi-cleanup/midi_to_musicxml.py` — a personal utility outside this pipeline, which `build.py` neither runs nor knows about. | `.mid` in, MusicXML out | Run by hand: `python tools/midi-cleanup/midi_to_musicxml.py take.mid`. It quantises to one grid per bar, writes a swung performance straight with the marking, splits a one-track two-hand recording into a braced grand staff, and reads back what it wrote — refusing to report a file as good if a note was lost or a bar does not add up. | **Never enters this repository either.** The output arrives by the same `[FOUND]` door above, and `tests/e2e/converted-import.spec.ts` is what proves that door reads it: the file imports, engraves, and walks the same number of steps as a real cursor. Its own harness is `tools/midi-cleanup/tests/`; the three Disklavier performances it was developed against live under `build/`, which is gitignored, so those tests skip when the files are absent rather than passing quietly. |
| `[MT]` | **GitHub** `musetrainer/library` (`scores/*.mxl`, 69 files) | MXL | `git clone --depth 1` | Public-domain MusicXML library used by the MuseTrainer app; contains Bach Minuet Anh 114, Musette-like pieces, Für Elise (3 editions), Canon in D (3), Gymnopédie 1 (2), Gnossienne 1, Clair de Lune (2), Moonlight 1 & 3, Pathétique 2, K.545, K.331 Rondo, WTC I Prelude 1 & 2, Chopin Preludes 4 & 20, Nocturnes 9/1, 9/2 (+easy), 20, Waltzes 64/2 & A minor, Ballade 1, Joplin Entertainer (2) & Maple Leaf Rag, Greensleeves (easy), Happy Birthday, Ode to Joy (easy variation), Carol of the Bells (2), Twinkle variations (Mozart K.265), Air on G, Ave Maria, Lacrimosa, Swan Lake, Sugar Plum Fairy, Waltz of the Flowers, Hungarian Dance 5, Liebestraum 3, La Campanella, Flight of the Bumblebee, Arabesque 1, Bella Ciao. **Check the repo's stated license per file** (`index.html`/README list) before use; treat as verified-PD arrangements from MuseScore contributors, and record each in SOURCES.md. |
| `[KERN]` | **GitHub** `craigsapp/*` Humdrum repos: `mozart-piano-sonatas`, `beethoven-piano-sonatas`, `chopin-preludes`, `chopin-mazurkas`, `scarlatti-keyboard-sonatas`, `joplin`, `bach-370-chorales`, `haydn-piano-sonatas` (all eight verified reachable; `bach-wtc` and `bach-inventions` do not exist under `craigsapp/`) | `**kern` | `tools/content/import_kern.py`, per-file table in `content/sources/kern.json` | **Measured, not assumed** (2026-09-05): five carry a `LICENSE.txt` stating CC BY-NC-SA 4.0 and every file repeats it in a `!!!YEM` record — bundled only under `--allow-nc` (`00` D10a). `beethoven-piano-sonatas`, `chopin-mazurkas` and `chopin-preludes` state **no licence at all**; the Chopin preludes carry a bare `!!!YEC` copyright line, which is a claim rather than a grant. Those three stay excluded whatever the flag says, and `import_kern.assert_excluded()` re-proves it on every build. |
| `[NIFC]` | **GitHub** `pl-wnifc/humdrum-chopin-first-editions` (512 files) and `pl-wnifc/humdrum-polish-scores` (8,918 files) | `**kern` | `tools/content/import_kern.py`, groups in `content/sources/kern.json` | The Fryderyk Chopin Institute's *Chopin Heritage in Open Access* encodings of the 19th-century first editions, **CC BY 4.0** — redistributable, so no `--allow-nc`, attribution carried in each item's `source` block. 191 solo-piano works after choosing one publisher per piece. This is what fills the Chopin rungs `craigsapp/chopin-preludes` and `chopin-mazurkas` cannot. The Polish-scores repository is the same licence and is opt-in in `fetch.py`; nothing in `02` asks for it yet. |
| `[PDMX]` | **Zenodo, on the owner's machine only** — `PDMX.csv` (254,077 rows) and `mxl.tar.gz`; `data.tar.gz`, `pdf.tar.gz` and `subset_paths` are not needed. Never fetched by CI, never committed. | MXL | `tools/content/pdmx/` — `shortlist.py` (CSV → shortlist; it was named `select` until that shadowed the standard library's module of the same name, P14), `extract.py` (streams the tar once), `quarry.py` (convert, round-trip, features, level estimate, render), `review.py` (a static page + `review.csv` the owner fills), `commit.py` (the `keep` rows → `content/scores/pdmx/*.mxl` + `content/sources/pdmx.json`; at most `MAX_EDITIONS` — two — editions of one work, the Zenodo record written into the table's header, and `convertedSha256` re-hashed *after* the copy into the repository, since that is the file the build verifies); the build's `import_pdmx.py` reads only the committed files and verifies their checksums; a row may carry its own `genre` and `tracks`, which win over the bucket's guess (2026-09-16 — the archive filed a Petzold minuet under pop) | **Measured 2026-09-05:** the CSV's `license` column is the uploader's claim about the *edition* (every row is `publicdomain` or `cc-zero`, including Yiruma and Billie Eilish arrangements). The composition test runs on `composer_name` against `content/sources/composers.json` and finds about 4,200 public-domain compositions among 36,150 deduplicated solo-piano rows (2,764 traditional, 191 Bach, 138 Beethoven, 135 Mozart, 91 Chopin, 37 Czerny, 13 Clementi, 4 Burgmüller, 1 *Frog Legs Rag*, 0 *Euphonic Sounds*). **Under `00` D23 the result is a label, not a gate**: the personal build takes any PDMX row the dataset marks public domain and the strict build takes only `compositionStatus: pd`. Ranking by rating and the per-band, per-genre quotas in the replan decision §2.2 do the selecting; the machine quality gates in §2.3 and a human review decide admission, and nothing is committed without a `keep`. Its best uses for this owner: the *reference* against which Part F folk tunes are authored (the verification P5 lacked), small-form classical at Stages 3–5, the well-rated easy pop and film arrangements, and the rock-module and *Beautiful* wish-list songs by title. **Measured for real 2026-09-06 (P14):** 254,077 rows in, 37,499 past the gates. The dataset's own deduplication flag removes 142,078 of them — 56 % of the archive — and its licence-conflict flag another 19,582; most of the remainder are files with more than two tracks or a non-piano program. What survives is not the classical library the ladder was written around: the unmatched-composer list is dominated by the Scottish and Irish fiddle corpus (Marshall 353, Alexander Walker 170, the Gows, Skinner, O'Carolan) and by Densmore's ethnographic transcriptions. `composer_name` is `NA` for 59 of the 306 rows the quotas chose and every one of those has an `artist_name`, so the composition label falls back to it. Titles and composer strings in the archive can be mojibake — one row's composer is 坂本龍一 encoded twice. |
| `[MUTO]` | Mutopia Project (mutopiaproject.org; GitHub mirror `MutopiaProject/MutopiaProject`) | LilyPond (+PDF/MIDI) | `ly musicxml file.ly > out.xml` (python-ly) for simple pieces; else `lilypond --midi` → music21 from MIDI (lossy: loses articulation; acceptable for exercises only) | Has Anna Magdalena Notebook, Burgmüller op.100, Czerny, Clementi sonatinas, Beyer, Hanon, many Bach/Mozart/Beethoven. |
| `[IMSLP]` | imslp.org | PDF, some MusicXML/MIDI | manual: only take files explicitly tagged MusicXML with a CC/PD edition license | Slow and manual — last resort. |
| `[AUTH]` | our own | ABC (`content/scores/authored/*.abc`) or music21 tinyNotation in `authored/*.py` | `music21.converter.parse(abcText)` → MusicXML; add fingering/lyrics/chord symbols in ABC (`"C"` chord symbols, `!1!` fingering) | For folk/hymn/holiday/lead sheets (Part F of the curriculum). ABC is 1–10 lines per tune; an agent can author 60–100 of these in one session. |
| `[GEN]` | `tools/content/generate_exercises.py` | music21 streams | run at build time | scales, arpeggios, chords/inversions, Hanon 1–20, five-finger patterns, rhythm drills (4/4, 3/4, 6/8, 5/4, 7/8 and 12/8), the Part E2 lesson skills, the harmony families (voicings, ii–V–I, loops, walking bass, comping, stride, turnarounds, boogie, blues scale), latin (clave with or without a pulse, tumbao, montuno, groove), and the genre families added 2026-09-16 — oom-pah, secondary rag, walk-up, passing chord, four-bar introduction, power chord, ostinato — plus sight-reading generator *seeds* (the app also has a runtime sight-reading generator in TS that emits MusicXML directly — see 05 §8) |

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

*Rewritten 2026-09-06 (P19) from the steps `build.py` actually runs. The seven-step list that
stood here was the plan before the importers and the drill content existed, and it put the
render check in the wrong place.*

In order, each writing its own catalog fragment so that a duplicate id between two sources is
caught by the merge rather than by whichever wrote last:

1. **fetch** (`fetch.py`) — clone or download the sources into
   `content/scores/imported/<source>/`. Idempotent; `--offline` skips it, and a source that
   cannot be reached is a smaller build rather than a failed one.
2. **import [MT]** (`import_musetrainer.py`) — the MuseTrainer library, against the table in
   `content/sources/musetrainer.json`. Normalises through `convert.py` where the file needs
   it. A file whose *composition* is not public domain is bundled under `--personal` and is a
   placeholder otherwise; both builds carry the same ids (P19).
3. **import [KERN]** (`import_kern.py`) — Humdrum `**kern` editions (Sapp's Joplin, the Chopin
   first editions) via music21. CC BY-NC editions are bundled only with `--allow-nc`.
4. **import [PDMX]** (`import_pdmx.py`) — the reviewed slice of the PDMX quarry from
   `content/sources/pdmx.json`, checksummed against what was reviewed. `--personal` bundles the
   ones whose composition is not public domain; a strict build placeholders them.
5. **generate [GEN]** (`generate_exercises.py`) — scales, arpeggios, Hanon-style cells, harmony
   families, rhythm rows, levelled from one table (`02` Part E amendment); how many there are
   is in `docs/generated/ladder.md`.
6. **author [AUTH]** (`author.py`) — the hand-written ABC and music21 sources, with metadata
   from each file's YAML front-matter.
7. **merge catalog** — the fragments into one `catalog.json`, with `content/sources/sections.json`
   attached as `teaching.sections`. This is also where `settle_key_signatures()` decides what
   the Library prints over "Key" for a score that states a signature and no mode.
7a. **score checks** (`score_checks.py --gate`, added 2026-09-22) — the seven checks of
   `08-test-map.md`'s own row (key consistency, grace density, truncation, bar duration,
   containment, title structure, repeat structure) over the catalog this build just wrote,
   handed to it as `--catalog <out>/catalog.json`. **It is a gate**: a `high` row with no
   entry in `content/score-checks.allow.json` — which carries a reason per row — stops the
   build naming it, and the medium and low rows are reported. `--no-analysis` because the
   music21 key pass is the minutes in that tool and produces nothing that can fail a build.
   Lettered rather than numbered so that the step numbers this document's own scripts cite
   in their docstrings stay true. (`build.py`'s `step_score_checks`, between `merge_catalog`
   and `copy_curriculum`.)
8. **curriculum, lessons, tips** — copied through from `content/`, with the schemas and the
   level model.
9. **validate** (`validate.py`) — everything in §4 and more: schemas, every referenced file
   present, every curriculum option in the catalog, the three-alternative floor, finders, tips
   files, section bar numbers, track definitions, orphan exercises, licences, the committed
   ladder report, and — since 2026-09-22 — **every lesson video URL against
   `content/video-index.json`** (§6b). It also writes each rung's `needs` block into the built
   curriculum. This is the step that fails a build on the *content*; step 7a is the one that
   fails it on the *score files*. (Until 2026-09-22 validate was the only gate and this line
   said so.)
10. **render check** (`render_check.py`, only with `--render`) — opens every item in a real
    Chromium through the app's own loader, compares the cursor's step count against the model's,
    captures the console, records the printed bar count and the measured duration, and
    remembers what it measured so the next build engraves only what changed. Because it writes
    durations back into the catalog, **validate runs again after it**.

Output is `app/public/content/`: `catalog.json`, `curriculum.json`, `scores/**.mxl`,
`lessons/**.md`, `tips/*.md`, `level-model.json`, `audio/<soundfont>`.

Two flavours come out of the same table (`00` D10a, D23): the personal build — the default
since 2026-09-12, §1 — is the owner's and carries everything; `--strict-license` is what CI
and the Pages deploy run and turns the rest into placeholders. They differ in four fields —
`file`, `importHint`, `tags` and `source.checksum` — and in nothing else, which is checked.

**The rest of `tools/content/`**, which the steps above do not name, one line each so nothing
in the directory is a mystery:

- `common.py` — shared plumbing (paths, hashing, the provenance ledger, the catalog writer),
  dependency-free so the parts that need no music21 keep working without it.
- `licensing.py` — the §1 rules as code: `license_verdict` for the edition, `composition_verdict`
  for the composition; called by the importers and `validate.py`.
- `difficulty.py` — `features(score)` and `estimate(...)`: the one levelling model, ported to
  `app/src/score/difficulty.ts` for imports on the phone.
- `fit_level_model.py` — fits `content/sources/level-model.json` on the songs a person levelled.
- `export_levelling_fixture.py` — writes what `difficulty.py` makes of the score fixtures, so
  `app/tests/unit/difficulty.test.ts` can hold the two implementations to one formula.
- `finder.py` — turns a lesson's `finder` block into the search line and chat prompt (`04` §3).
- `ladder_report.py` — writes `docs/generated/ladder.md`; `validate.py` fails a build whose
  committed copy is stale.
- `add_technique_units.py` — the one-off that gave the technique track a rung per stage (P12a);
  not part of the build.
- `truncation_scan.py` — the grace-16th truncation scan over every converted file (P2 §8).
- `bisect_render.py` — narrows a score OSMD refuses down to the measure that breaks it.
- `abc_tools.py` — the `%%pianopath` header and the inline-voice fix for ABC (§5).
- `notation.py` — reads a converted score into the `notation` block every catalog row
  carries: key, mode, metre, staves, bars, chord-symbol count, final bass. It is the one
  measured description of a piece, and it is what `validate.py`'s `notation_requirements`
  and the app's chart door read instead of guessing from a title (`00` §1a).
- `score_checks.py` — the seven checks of step 7a, on their own (`--item <id>` for one row,
  `--gate` for the build's verdict); writes `build/score-checks.md` and `.json`.
- `rung_audit.py` — reads every rung and reports what is thin, shared or pointing at no
  mode. It is advice rather than a gate and the build does not run it.
- `dump_score.py` — prints a committed `.mxl` bar by bar, staff by staff, for a person
  deciding what a piece is. It does **not** print ties, tuplets or grace notes, which is
  written down here because two entries in `pending-review.md` were wrong from reading it.
- `candidates.py` — searches the *built catalog* for pieces that fit a rung's finder.
- `archive_search.py`, `archive_notation.py` — the same two questions asked of the
  unbuilt PDMX archive instead: a title search over `PDMX.csv`, and the notation of one
  archive file without converting it.
- `blues_forms.py` — the twelve-bar blues built once and transposed for the authored blues exercises.
- `extract_hanon.py`, `extract_fingering.py` — read Hanon 1–20 and Clementi's scale fingerings
  out of the Mutopia editions, so neither comes from memory.
- `python.cjs` — finds a Python that answers (`py -3.11` on Windows, `python3` elsewhere) for
  `npm run content:build`.
- `pdmx/` — beside the five programs in §2's table: `paths.py` (where the archive is, and the
  refusal when it is not), `composers.py` (a free-text composer string → a composition label),
  `index.py` (every candidate past the gates as one browsable page), `manifest.py` (writes
  `library.json` into a folder of scores and, with `--zip`, the archive for the phone).

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

The manifest's key is the file's sha256 **and the installed OpenSheetMusicDisplay version**
(`OSMD_VERSION` in the spec, read from the installed package rather than `package.json`'s
range, so a lockfile bump that resolves differently invalidates too) — an engraver upgrade
therefore re-renders everything by itself. What still leaves every remembered result standing
is a change in the ScoreModel extractor or in the browser, because no score file and no
package moved; `render_check.py --full` ignores the manifest and closes that, either locally
or through `.github/workflows/render-full.yml`, which is dispatched by hand.

`build.py --if-missing` used to skip the whole content build whenever a catalog already
existed. It is gone: it made an edited source silently stale in `npm run build`, and with
the cache the build is cheap enough to always run.

### 3b. The note-loss gate (step 2, inside `convert.py`)

Nothing in the pipeline counted notes, so two ways of losing them ran unseen: music21's
Humdrum parser drops most of a file whose spines split *inside* a split, and
`collapse_to_two` used to drop every note of a third part while reporting "merged N parts
into 2 staves by register". A score can lose a hand and still open, still render, still
pass every schema — it is simply no longer the piece. `convert_file` therefore counts both
sides and compares them.

**What is counted.** A *note event*: a chord is one event, a rest is none, a tied note is
one per written note. The source is counted from its own bytes, without music21, by
`source_note_events`:

- `.krn` — data tokens in the `**kern` spines. Spine paths (`*^`, `*v`) are followed so
  that a `**dynam` or `**text` column, whose tokens are full of the letters a–g, is never
  counted; a rest may carry a position letter (`8rff`) and is still a rest.
- `.xml`, `.musicxml`, `.mxl` — every `<note>` that is neither a `<rest/>` nor a `<chord/>`
  continuation. An `.mxl` is read through its container's rootfile.
- `.abc`, `.ly`, `.mid` — **unknown**, and therefore never gated. ABC's count depends on how
  its voices and repeats are read, LilyPond arrives through a converter of its own, and MIDI
  has no notion of a written note.

The output is counted from the normalised score, excluding `harmony.ChordSymbol` — which
music21 files under "notes" but is a letter name printed over the staff, not something the
source counted. `ConversionResult.notes` keeps its old meaning (chord symbols included,
read by the PDMX quarry); the gate uses the new `note_events` beside it.

**The decision** is `note_loss(source_notes, note_events)`, a pure function returning
`ok`, `warn` or `refuse`:

- a **gain** is `ok`. Normalisation splits a tie that crosses a barline into two written
  notes, so a number of imported scores honestly come out with a few more events than they
  went in with.
- a loss **at or under `NOTE_LOSS_LIMIT`** (2 %) is a warning appended to
  `result.warnings`, naming both counts. This is the file that loses a note or two at a
  spine split.
- a loss **above** it raises `ConversionError`. The limit sits in an empty gap: when it was
  chosen, every ordinary kern import lost well under one percent and the two real
  mechanisms lost a third of the file and more, with nothing in between.

**What refusal means to each importer** — none of them needed changing, because all three
already treat a `ConversionError` as "this file does not ship":

| Importer | On refusal |
| --- | --- |
| `import_kern.py` | excludes the item, recording the gate's sentence as the reason |
| `import_musetrainer.py` | falls back to copying the original file unconverted |
| `import_pdmx.py` (quarry) | records the row as having failed the `convert` gate |

The gate is not free of its own blind spot: a source format it cannot count is never gated,
and a conversion that keeps every note but puts it in the wrong bar still passes. It answers
one question only — is all the music still here.

### 3c. Lengths the writer cannot name (step 2, `settle_durations`)

The gate above runs *after* a step that exists because the PDMX re-run lost its best
classical admissions at the export end rather than the parsing end. music21's MusicXML
writer raises rather than guessing when it is handed a length it cannot name, and the
three sentences the re-run collected — `Cannot convert "2048th" duration to MusicXML`,
`Cannot convert inexpressible durations`, and a bare `KeyError` out of `makeTies` — are
one fault seen from three sides.

The fault is an editor's arithmetic. MusicXML counts time in integer ticks
(`<divisions>`, commonly 480 to the quarter) and an irregular tuplet does not divide
evenly into them, so the editor writes each note of the run as the nearest whole tick.
Fourteen notes of 103 ticks come to 1,442 where the run is three quarters, 1,440. The
engraving is right and the arithmetic is two ticks out — so the last note of the run
overhangs the barline, `makeTies` ties it across, and the sliver left over is a length no
printed note value expresses. Sometimes that sliver is written as a 2048th, sometimes as a
tuplet *of* 2048ths, and sometimes the tie lands in a voice number the next bar does not
have and `makeTies` looks it up anyway.

`settle_durations` therefore takes each note at its own printed word: value, dots and
tuplet ratio stay exactly as the editor wrote them and the sounding length is made to
agree with them. It is not a quantisation onto a grid of our choosing — no pitch is
touched, no note is added or dropped, and each length moves by less than a 1024th, the
shortest note MusicXML can name. Within a bar the notes after a corrected one move with
it, which is what makes the bar add up again; a bar is taken across both staves at once,
because a cadenza run can be written twenty-two notes in the right hand and seventeen in
the left. The count goes into `result.warnings` as "N durations quantised to the printed
note value", and the note-loss gate still runs afterwards.

Two things it will not do. It will not push a voice **past** the end of its bar when the
voice did not already reach it: a bar a tick short is written and filled silently, while a
bar a tick long is tied across the barline, which is the whole fault. And it will not
round a length that has no printed value at all — the shortest MusicXML can name is a
1024th, so a sliver can only be rounded *up*, which moves a barline. Those are refused by
`refuse_unwritable` with a sentence naming the bar and the length, rather than left for
the writer to raise on with a measure number and no way back.

What it does **not** fix, and what still costs the re-run its Ballades: a bar that
genuinely holds more than its time signature — a written-out cadenza — which `makeTies`
splits at the notional barline whatever the lengths are. That is a bar-length fault, not a
duration one, and it is still open. The other half of that fault — a bar that holds
**less** than its time signature — is §3d.

### 3d. A bar the edition wrote short (step 2, `drop_seam_bars`, `declare_partial_bars`)

music21's MusicXML writer fills every measure out to the length its time signature says
*before* it writes a note of it: `GeneralObjectExporter` calls
`makeRests(timeRangeFromBarDuration=True, fillGaps=True)` on the copy it exports. A bar an
edition wrote short therefore comes back with a rest on the end, the bar is now a full bar
long, and every note after it in the file is late by what was added. Nothing warns. The
score simply says something the edition does not, and the fault is invisible to every
check that counts notes rather than placing them — the note-loss gate above passes it,
because none of the notes are missing.

`**kern` writes a change of strain exactly that way. In craigsapp's Joplin edition,
*Cleopha*'s bar 54 is `4F FF / 8FF FFF / =|| / *k[b-e-] / 8r 8f / =55!|:` — a 2/4 bar whose
last eighth stands *after* a mid-bar double barline as the pickup into the next strain,
with the key change at the double bar. music21 reads the page as written: a bar of three
eighths, then an unnumbered bar of one. Filled out, those two became four beats where the
edition has two, and the whole second half of the rag played a bar late behind a beat and a
half of silence Joplin never wrote.

What says otherwise is the `paddingLeft`/`paddingRight` pair that already makes an opening
anacrusis survive the writer, and the two cases are the same case. `declare_partial_bars`
sets it per *bar*, across both staves at once, and only when the bar is short in all of
them: one hand resting through the end of a bar the other hand fills is not a short bar,
and the rest the writer adds there is the right engraving and moves nothing. A bar shorter
than the shortest note MusicXML can name is left alone for the same reason — there is no
rest to draw. A count goes into `result.warnings` as "N bar(s) shorter than the time
signature kept as written".

Which side of the bar is missing is a reading of what the bar is, and `makeBeams` asks:
`paddingLeft` beams the notes as the *end* of a bar, `paddingRight` as its beginning. So
the first bar of a piece, and the remainder of a bar split in two, are short at the front;
everything else — a closing bar that completes the opening anacrusis, a bar an editor wrote
irregular — is short at the end. The remainder of a split bar is also marked
`implicit="yes"` — when the parser numbered it 0, which is what music21 does with the
unnumbered bar after a mid-bar barline — because an engraver gives it no number and the
alternative was a "0" printed in the middle of the piece.

The same `=||` falls *on* a barline as often as inside one — `4a 4b / =|| / *k[d-] /
=70!|:` — and then what stands between the two records is a measure holding no note, no
rest, nothing but the barline: a seam between two strains rather than a bar of silence,
since silence is written with rests. `drop_seam_bars` removes it, moving whatever it
carried into the bar it introduces and its barline to whichever neighbour has none, so the
piece does not grow a silent bar at every change of strain. Only a seam **both** staves
agree on is dropped: the two are written into one `<part>` measure by measure at the end,
so a bar removed from one hand and not the other would set the hands a bar apart. It runs
before the key signatures are deduplicated, because the signature a seam hands forward may
meet one the next bar already has — which is exactly what happens in Chopin's op. 18 waltz,
where the turn to D flat sits at a seam.

A third thing Humdrum states between two bars is the new strain's key signature itself, and
music21 hands *that* back in the part, outside every measure, at the offset the record
stood at. The MusicXML writer has one rescue for a loose attribute and only one:
`fixupNotationMeasured` lifts them into the **first** measure, so an opening signature
survives and every later one is dropped without a word. What reached the page was a strain
engraved in the key of the strain before it — *Cleopha*'s second half printed with one flat
where Joplin wrote two, every B flat of it spelled out as an accidental, which is the fault
`drop_superseded_key_signatures` was written for arriving by the other door. So
`place_loose_attributes` puts each loose key signature, time signature or clef into the
measure that holds its offset, at the offset it has inside that measure — a mid-measure
`<attributes>` tag if that is where it falls — on every staff, because the signature is
printed on both. A record standing exactly on a barline belongs to the bar it opens rather
than the one it closes, so a measure that *starts* there is preferred; one falling past the
last barline has no bar to go in and is left where it is. It runs before the signatures are
deduplicated, so one placed into a bar that already states the same thing is settled by the
same-instant rule that was already there. Where a placed signature lands away from the
barline, the writer states it once per staff instead of once for the part: identical tags at
one instant, which set the same key twice and change nothing on the page.

Merging a split pair into one full bar with the double barline drawn inside it was the
other candidate, and MusicXML can express a mid-measure `<barline>`. music21 cannot write one:
its `MeasureExporter` lists `Barline` in `ignoreOnParseClasses` and emits only a measure's
own left and right barlines, so Joplin's double bar and the repeat sign after it would have
been dropped on the way out. Keeping the two measures keeps both.

Two neighbouring faults this does not touch, both found while measuring it:

- A bar that holds **more** than its time signature *in one staff and not the other*. The
  staves then disagree about where the next bar starts, and joining them back into one
  `<part>` pads both — which moves notes, exactly as the short bar did. Every case seen is
  a source contradicting itself: the PDMX copy of *Jimbo's Lullaby* backs up past the start
  of bar 12 and then runs a `<forward>` past its end, and the PDMX copy of *El Choclo*
  writes both hands in one `<voice>` whose cursor runs a bar and a half past the barline.
  Whether to refuse those with a sentence naming the bar, or to leave them, is a catalogue
  decision and is still open.
- A bar holding an irregular tuplet ends a tick or two short of its own barline in the
  written file, because MusicXML counts in whole ticks and eleven notes do not divide into
  them (§3c is the same arithmetic, seen in the source instead of on the way out). Nothing
  audible or visible moves — it is a thousandth of a quarter — but it moves *every*
  instant after it, so a comparison of where notes fall will report most of such a piece as
  displaced. Read the size of the displacement, not the count, before believing it.

## 4. Catalog and curriculum schemas

Authoritative JSON Schemas are `content/catalog.schema.json` and
`content/curriculum.schema.json` in this repo. Keep them in sync with `01-architecture.md` §5.

## 5. Authoring conventions for `[AUTH]` ABC files

**Bars are numbered from 1.** music21's ABC reader numbers a tune's first full bar 0, and the
engraver prints that number at the head of the first system; `convert.renumber_measures` puts
the numbering right for every source, and leaves a real pickup — a first bar shorter than the
time signature — at 0, which is what a pickup is called (P21e A4).

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

Front-matter: `title`, `stage`, `unit`, `videos[]` (`{label, url, teacher}`), `readingTime` —
which is computed from the body at 200 words a minute, not written by hand.
It used to be written by hand and meant nothing: across the lessons that existed then it
implied anywhere from 43 to 272 words a minute, and no code has ever read it.

**Two of those five have a reader and three do not**, which is worth knowing before writing
one. `videos[]` is read by `LessonScreen`, and `readingTime` by `lessonShape.test.ts`.
`title`, `stage` and `unit` are read by nothing: two searches — every call site of
`parseFrontMatter` in `app/src`, and a grep for the keys over `app/src` and `tools/` — find
only the `videos` read. **The rung's title on every screen is the curriculum's**
(`LessonScreen.ts` sets the `h1` from `lesson.title`), so a front-matter `title` that says
something else is a second name for one thing rather than a heading anybody sees. This
section also listed `concepts[]`, which **no lesson carries**: a rung's concepts are in
`content/curriculum/stage-*.json`, where `SkillsScreen` and `validate.py` read them.

Body: **read in three minutes or less** (600 words at that rate), written for an adult
engineer who is a musical beginner:
define every term the first time (e.g. "a *triad* is three notes stacked in thirds — every
other letter name"), give the intuition, then the rule, then "what to do at the piano".
Include one "Common mistake" and one "How you'll know you've got it".

This was "≤ 400 words" from the repository's first commit, written before any lesson
existed, with no reason recorded and nothing enforcing it — seven lessons had been over it
for as long as they had existed. Three minutes is the same intent measured in the unit the
line above it already carries: a lesson is read once before you play, not studied. Two
lessons are longer and named in `lessonShape.test.ts`, both because their rung is several
ideas rather than one: `ragtime.6` (a whole rag, with a trio and a key change) and
`classical.6` (voicing, rubato and pedalling across six Romantic miniatures). *(Corrected
2026-09-22: this said "twenty-one Romantic miniatures", which was the classical Stage 6 rung
before the rungs were cut to a few chosen pieces each — `02` Part A item 5, 2026-09-15. It
offers six songs and nine exercises in the built curriculum.)* `ragtime.6` is the one real
outlier in the corpus: at six minutes it reads about two and a half times the length of the
median lesson and more than half again the length of `classical.6`, the next longest.

### 6a. Drill tips (`content/tips/<kind>.md`, P17)

One file per runtime drill kind, plus optional variants `<kind>.<variant>.md`.
Front-matter: `kind`, and on a variant a `when:` block of `param: value` pairs
matched against the item's `drill.params`. Body: **exactly** the four headings
*What it's for · How to practise it · Common mistake · How you'll know you've
got it*, in that order, ≤ 250 words, in the lesson voice.

`validate.py` checks all of it, and reads the kind list out of
`RUNTIME_DRILL_KINDS` in `app/src/engine/drills/fromCatalog.ts` rather than
holding a copy — the list went from twelve to nineteen in P12b, and a copy here
would have gone stale without anything noticing. It also refuses a `when:` key
that no catalog drill carries, because such a variant never matches and looks
like nothing at all.

The build copies the directory and writes `content/tips/index.json` (which
variants exist, and their `when:` blocks) so the app makes one request for the
index and one for the file it wants.

### 6b. Lesson videos, and the index that says they exist (T21, 2026-09-22)

`videos[]` is `{label, url, teacher}` and the URL is a canonical
`https://www.youtube.com/watch?v=<11 chars>` and nothing else — no channel page,
no playlist, no `youtu.be`. `lessonVideos.test.ts` has enforced the shape since
88 lessons were found pointing at channel *home pages*; what nothing enforced is
that the link resolves.

**`tools/content/video_check.py` asks, and `content/video-index.json` is the
committed answer.** It reads every lesson's `videos:`, fetches YouTube's oEmbed
endpoint for each distinct URL, and writes `url → {title, author, status, http,
checked}`. `validate.py` (step 9, `video_index_errors`) then fails the build on
any lesson URL that is not in the index with a `live` status and a checked date,
so **a newly added link fails the build until somebody has run the fetch once**.

Run it by hand after adding or changing a link:

```bash
python tools/content/video_check.py            # fetch and rewrite the index
python tools/content/video_check.py --check    # offline: index against the lessons
python tools/content/video_check.py --url <watch url>   # one URL, print and exit
```

**The fetch never runs in the build**, which is what keeps `build.py --offline`
offline; the build only reads the file. Rows for URLs no lesson names any more
are dropped on the next fetch, so the index is the corpus and not a graveyard.

**What it cannot tell you.** The index holds the title the uploader typed.
Nothing in this repository has watched a video, so a *live link to the wrong
video* passes every check here. `lessonVideos.test.ts` asks the weaker
mechanical half — that the oEmbed title shares a word with the rung's title, its
concepts, its track, or one of five written-down synonyms — and that rule
catches a title with nothing of the rung in it and nothing else. Whether a video
suits the **stage** is a person's judgement: three videos pitched at beginners
sat on Stage 9 rungs and passed everything mechanical until somebody read them
(`pending-review.md` Entry 46).
