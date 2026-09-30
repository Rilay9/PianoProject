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
| `[FOUND]` | **The owner himself, through a finder** (P15). Not fetched by anything: every rung and every concept carries a `finder` block, `tools/content/finder.py` turns it into a search line and a chat prompt at build time, and he goes and gets the file. | MusicXML / MXL / PDF | The app's import path — share sheet, file picker, or the lesson page's "Import for this rung" — then the assign sheet (`04` §4), which attaches it to the rung, levels it with the runtime port of `difficulty.py` (`app/src/score/difficulty.ts`) and stores it in IndexedDB. | **Never enters this repository.** It is the owner's own copy of music he found or bought, held on his phone and in his backup, and `curriculum/load.ts` overlays it onto the rung's `songOptions` at runtime — so it is one of the rung's practice options, and a qualifying run of it, judged by that rung, can count toward the rung's requirements, without the file ever being committed (2026-09-26, T52: this said it "counts towards finishing a rung"; since C5 the assignment itself is no evidence). This is the answer to `00` D10 and D18: copyrighted repertoire is reachable, and it arrives by import rather than by the pipeline downloading it. `validate.py` refuses any generated prompt that asks for a copyrighted transcription to be downloaded. |
| `[MIDI]` | **The owner's own playing** — and, since 2026-09-23, any MIDI file he picks. Two implementations of one converter: `tools/midi-cleanup/midi_to_musicxml.py` (a personal utility outside this pipeline, which `build.py` runs for one step only: since Q76 the `[MUTO]` import converts Mutopia's published MIDI files with it) and `app/src/import/midi/`, its port, which runs **in the browser** because nothing here runs on a server. | `.mid` in, MusicXML out | On the command line: `python tools/midi-cleanup/midi_to_musicxml.py take.mid`. In the app: the ordinary import picker takes `.mid` and `.midi` (`04` §4) and converts on the device. Both quantise to one grid per bar, write a swung performance straight with the marking, split a two-hand recording into a braced grand staff, and read back what they wrote — refusing to report a file as good if a note was lost or a bar does not add up. **Which hand a note is in is decided by the same rule in both**, and the rule is that the file is believed when it says: one note track is a recording of two hands and is split by voice-leading; **exactly two note tracks are an arrangement a person already gave hands to, and are kept as recorded — first track the upper staff, second the lower**; three or more are a voice per track, and the port merges them and splits, where the tool writes a part per track (its one difference, and it is forced: music21 writes an ensemble and this writer writes a piano). The port merged *everything* until 2026-09-23, which threw the arranger's hands away on exactly the files the owner downloads. | **Never enters this repository either.** The output arrives by the same `[FOUND]` door above. Three tests, three claims: `tests/e2e/converted-import.spec.ts` proves the door reads what the *command line* writes, `tests/e2e/midi-import.spec.ts` proves a `.mid` picked in the app converts, lands in the Library and walks the same number of steps as a real cursor, and `tests/unit/midiParity.test.ts` proves the port decides what the tool decides — note for note, duration for duration, hand for hand, on the three Disklavier recordings, two renderings of a committed exercise, and the two committed MIDI fixtures converted the way the app converts (`hands=auto`), which is what puts the hands rule itself under comparison. The reference for that last one is written by `tools/midi-cleanup/tests/parity_reference.py` into `build/midi-parity/`; `build/` is gitignored, so those tests skip with a message naming the script rather than passing quietly. **Parity proves the port, not the music** — nothing in any of it is heard. |
| `[MT]` | **GitHub** `musetrainer/library` (`scores/*.mxl`, 69 files) | MXL | `git clone --depth 1` | Public-domain MusicXML library used by the MuseTrainer app; contains Bach Minuet Anh 114, Musette-like pieces, Für Elise (3 editions), Canon in D (3), Gymnopédie 1 (2), Gnossienne 1, Clair de Lune (2), Moonlight 1 & 3, Pathétique 2, K.545, K.331 Rondo, WTC I Prelude 1 & 2, Chopin Preludes 4 & 20, Nocturnes 9/1, 9/2 (+easy), 20, Waltzes 64/2 & A minor, Ballade 1, Joplin Entertainer (2) & Maple Leaf Rag, Greensleeves (easy), Happy Birthday, Ode to Joy (easy variation), Carol of the Bells (2), Twinkle variations (Mozart K.265), Air on G, Ave Maria, Lacrimosa, Swan Lake, Sugar Plum Fairy, Waltz of the Flowers, Hungarian Dance 5, Liebestraum 3, La Campanella, Flight of the Bumblebee, Arabesque 1, Bella Ciao. **Check the repo's stated license per file** (`index.html`/README list) before use; treat as verified-PD arrangements from MuseScore contributors, and record each in SOURCES.md. |
| `[KERN]` | **GitHub** `craigsapp/*` Humdrum repos: `mozart-piano-sonatas`, `beethoven-piano-sonatas`, `chopin-preludes`, `chopin-mazurkas`, `scarlatti-keyboard-sonatas`, `joplin`, `bach-370-chorales`, `haydn-piano-sonatas` (all eight verified reachable; `bach-wtc` and `bach-inventions` do not exist under `craigsapp/`) | `**kern` | `tools/content/import_kern.py`, per-file table in `content/sources/kern.json` | **Measured, not assumed** (2026-09-05): five carry a `LICENSE.txt` stating CC BY-NC-SA 4.0 and every file repeats it in a `!!!YEM` record — bundled only under `--allow-nc` (`00` D10a). `beethoven-piano-sonatas`, `chopin-mazurkas` and `chopin-preludes` state **no licence at all**; the Chopin preludes carry a bare `!!!YEC` copyright line, which is a claim rather than a grant. Those three stay excluded whatever the flag says, and `import_kern.assert_excluded()` re-proves it on every build. |
| `[NIFC]` | **GitHub** `pl-wnifc/humdrum-chopin-first-editions` (512 files) and `pl-wnifc/humdrum-polish-scores` (8,918 files) | `**kern` | `tools/content/import_kern.py`, groups in `content/sources/kern.json` | The Fryderyk Chopin Institute's *Chopin Heritage in Open Access* encodings of the 19th-century first editions, **CC BY 4.0** — redistributable, so no `--allow-nc`, attribution carried in each item's `source` block. 191 solo-piano works after choosing one publisher per piece. This is what fills the Chopin rungs `craigsapp/chopin-preludes` and `chopin-mazurkas` cannot. The Polish-scores repository is the same licence and is opt-in in `fetch.py`; nothing in `02` asks for it yet. |
| `[PDMX]` | **Zenodo, on the owner's machine only** — `PDMX.csv` (254,077 rows) and `mxl.tar.gz`; `data.tar.gz`, `pdf.tar.gz` and `subset_paths` are not needed. Never fetched by CI, never committed. | MXL | `tools/content/pdmx/` — `shortlist.py` (CSV → shortlist; it was named `select` until that shadowed the standard library's module of the same name, P14), `extract.py` (streams the tar once), `quarry.py` (convert, round-trip, features, level estimate, render), `review.py` (a static page + `review.csv` the owner fills), `commit.py` (the `keep` rows → `content/scores/pdmx/*.mxl` + `content/sources/pdmx.json`; at most `MAX_EDITIONS` — two — editions of one work, the Zenodo record written into the table's header, and `convertedSha256` re-hashed *after* the copy into the repository, since that is the file the build verifies); the build's `import_pdmx.py` reads only the committed files and verifies their checksums; a row may carry its own `genre` and `tracks`, which win over the bucket's guess (2026-09-16 — the archive filed a Petzold minuet under pop) | **Measured 2026-09-05:** the CSV's `license` column is the uploader's claim about the *edition* (every row is `publicdomain` or `cc-zero`, including Yiruma and Billie Eilish arrangements). The composition test runs on `composer_name` against `content/sources/composers.json` and finds about 4,200 public-domain compositions among 36,150 deduplicated solo-piano rows (2,764 traditional, 191 Bach, 138 Beethoven, 135 Mozart, 91 Chopin, 37 Czerny, 13 Clementi, 4 Burgmüller, 1 *Frog Legs Rag*, 0 *Euphonic Sounds*). **Under `00` D23 the result is a label, not a gate**: the personal build takes any PDMX row the dataset marks public domain and the strict build takes only `compositionStatus: pd`. Ranking by rating and the per-band, per-genre quotas in the replan decision §2.2 do the selecting; the machine quality gates in §2.3 and a human review decide admission, and nothing is committed without a `keep`. Its best uses for this owner: the *reference* against which Part F folk tunes are authored (the verification P5 lacked), small-form classical at Stages 3–5, the well-rated easy pop and film arrangements, and the pieces wanted by name (the owner's requests and the *Beautiful* suggestions) by title. **Measured for real 2026-09-06 (P14):** 254,077 rows in, 37,499 past the gates. The dataset's own deduplication flag removes 142,078 of them — 56 % of the archive — and its licence-conflict flag another 19,582; most of the remainder are files with more than two tracks or a non-piano program. What survives is not the classical library the ladder was written around: the unmatched-composer list is dominated by the Scottish and Irish fiddle corpus (Marshall 353, Alexander Walker 170, the Gows, Skinner, O'Carolan) and by Densmore's ethnographic transcriptions. `composer_name` is `NA` for 59 of the 306 rows the quotas chose and every one of those has an `artist_name`, so the composition label falls back to it. Titles and composer strings in the archive can be mojibake — one row's composer is 坂本龍一 encoded twice. |
| `[MUTO]` | Mutopia Project (mutopiaproject.org; GitHub mirror `MutopiaProject/MutopiaProject`) | LilyPond (+PDF/MIDI) | `ly musicxml file.ly > out.xml` (python-ly) for simple pieces; else `lilypond --midi` → music21 from MIDI (lossy: loses articulation; acceptable for exercises only) | Has Anna Magdalena Notebook, Burgmüller op.100, Czerny, Clementi sonatinas, Beyer, Hanon, many Bach/Mozart/Beethoven. **Since Q76 (2026-09-29) an import step: `tools/content/import_mutopia.py`, the rows in `content/sources/mutopia.json`.** Measured on the Joplin folder, python-ly cannot convert a rag faithfully, so a row is taken from the MIDI file Mutopia publishes for the edition, through `tools/midi-cleanup/midi_to_musicxml.py`, with every note's spelling and the key changes read from the edition's `.ly`; the licence is the `.ly` header's (`license`, else `copyright`). One row today, *Pine Apple Rag*, on `ragtime.8`. See the paragraph on `[MUTO]` below. |
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

**The `[MUTO]` import (Q76, 2026-09-29), and why it reads MIDI.** The owner asked for the public
build's rags from Mutopia (public domain first): on the licence-strict build every craigsapp Joplin
edition is a placeholder, and `ragtime.8`'s stride bass was practised by no bundled piece. The Joplin
folder at revision `2144afd6` holds 16 single-file editions and two multi-file ones (*Bethena*,
*Solace*, `\include`d part files); every header states "Public Domain" in `license` or `copyright`.
The raw files were fetched at that pinned revision (not a clone: the folder is 38 small files, and a
pinned revision is what a checksum can hold) into `content/scores/imported/mutopia/ftp/JoplinS/`
(the measurement's copy). Through python-ly 0.9.10 — the `convert.parse_lilypond` path this row
names, and the newest python-ly on PyPI — **none converts to a score that is right**:

- every one of the 16 uses `\repeat volta … \alternative`, and python-ly's writer does not implement
  `\alternative`: it writes both endings one after the other, with no `<ending>` and with the repeat
  marks doubled, so a converted rag plays both endings on every pass (*Maple Leaf Rag*: every bar of the
  source written, 85, where the piece has 145 played bars);
- 10 of the 16 are refused outright, by python-ly itself (*Eugenia*, *Peacherine*; *Elite
  Syncopations* comes out with no notes) or by music21, because a voice overflows its bar (*Pine Apple
  Rag*, *Magnetic Rag*, *Wall Street Rag*, *Something Doing*, *Sun Flower Slow Drag*, *The Strenuous
  Life*, *The Easy Winners*);
- with python-ly's own `rel2abs` and `rhythm_explicit` run first and every repeat unfolded, *Maple
  Leaf Rag* comes out at its played length, but the two `ragtime.8` rags still fail: on *Pine Apple Rag*
  the writer closes the left hand's first bar after a quarter, pushes the notes of a chord that ends a
  bar into the next bar, and writes the bar after a two-voice block into the same measure
  (`docs/prompts/runs/Q76/pyly-mechanisms.txt`). No converted rag keeps the left-hand pattern in every
  bar except *Maple Leaf Rag* as python-ly writes it unaltered, which is the wrong score above.

`lilypond` is not on this machine, so no LilyPond-backed conversion was run. What was run is the
reviewer's first fallback (`docs/review/responses/questions-400e69c8.md` §2): **the MIDI file Mutopia
publishes for the same edition** (the piece page links it beside the `.ly`; the published `.ly` is
byte-identical to the mirror's, line endings aside), converted by `tools/midi-cleanup/midi_to_musicxml.py`
— the converter the `[MIDI]` row describes, which `build.py` runs for this step only. A MIDI file
carries notes and times and no spelling, voices or repeat signs, so `import_mutopia.py`:

- refuses a conversion the converter's own read-back refuses (a note lost or gained, a bar that does not
  add up), or whose note tracks are not one per staff, or whose metre is not the table's;
- spells every note as the edition spells it: the edition's pitches per staff (python-ly's `rel2abs`,
  `rhythm_explicit` and every repeat unfolded, so they come in the order the MIDI plays them) aligned
  with the converted notes by pitch class, each note taking the edition's letter and accidental; a note
  left unspelled, or spelled in a way the edition never spells its pitch class, refuses the row — the
  converter's own key-based guess wrote D flat for the edition's C sharp in *Pine Apple Rag*'s first bar;
- inserts the key changes the MIDI's key-signature events place, at the bar they fall on.

What stays the converter's is said on the catalogue row: the repeats are written out and, where the edition
writes two voices in one hand, they are merged into chords. The row's provenance (`source: mutopia`) names
the edition, the published MIDI by URL and sha256, the `.ly` its spelling came from, and the converter by
name and version; its tempo is the edition's `\tempo` where the edition has one (*Pine Apple Rag*'s "Slow
March tempo", 4 = 100), and otherwise marked inferred. Both files are fetched by the step itself — only the
files the table names, the `.ly` from the GitHub mirror at the pinned revision, the `.mid` from
mutopiaproject.org — into `content/scores/imported/mutopia/published/`, verified against their pinned
sha256, and cached by bytes under `build/cache/mutopia/`; an offline build uses what is there, and a row
whose files are missing or not the pinned ones is a placeholder that says so. The runner fetches the two
files of each row on its first build. *Magnetic Rag* was tried by the same route and is not taken: the
import refuses it, because notes of its upper staff are left that the edition's spelling cannot be found
for; with the converter's own spelling its left hand leaves the pattern in the closing bars, and its MIDI
tempo is LilyPond's default (`notTaken` in the table). The findings, per edition, are `docs/prompts/runs/Q76/muto-verdicts.txt`; the MIDI route's,
`docs/prompts/runs/Q76/midi-route.txt`.

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
   ones whose composition is not public domain; a strict build placeholders them. A row's
   own `levelSource` reaches the catalog (2026-09-23); it used to be the constant `estimated`
   on the grounds that `difficulty.py` computed the level, which was true of every row the
   quarry writes and made the field unwritable — a level a person had judged could be spliced
   onto a pdmx row and the built catalog would still call it an estimate. `estimated` when the
   row is silent, and anything that is neither word fails the build in `catalog_item`.
4a. **import [MUTO]** (`import_mutopia.py`, Q76) — the rows of `content/sources/mutopia.json`: each
   edition's published MIDI and its `.ly`, fetched at pinned places unless the build is offline or
   `--skip-fetch`, checked against their sha256, converted by the MIDI converter and spelled and keyed
   from the `.ly` (§2 on `[MUTO]`). Public domain, so both flavours bundle the same file; a row whose
   files are missing or not the pinned ones is a placeholder that says why. Its level is the level
   model's estimate for the written file (`estimated`). Lettered, as 7a is, so the step numbers other
   documents cite stay true.
5. **generate [GEN]** (`generate_exercises.py`) — scales, arpeggios, Hanon-style cells, harmony
   families, rhythm rows, levelled from one table (`02` Part E amendment); how many there are
   is in `docs/generated/ladder.md`. Since D3 also the generated studies (`study.py`, `02` Part
   E2): each composed from its recipe and refused, stopping the build with the reason, where no
   candidate keeps the hard layer and clears the musical floor. Every item passes two gates as
   it is written — the physical (`confirm_physical`, D0) and, for a family whose contract names
   an evaluator, the musical (`confirm_musical`, D3), which reads the written page again. The
   studies are measured by step 7's attach step like every generated item and listed on no rung;
   `python tools/content/study.py --candidate-rungs <catalog.json> <curriculum.json>` writes the
   candidate-rungs report from a build's output (the rungs whose taught set holds every demand a
   study carries and whose claims its notes establish), for the placement decision that is F's.
6. **author [AUTH]** (`author.py`) — the hand-written ABC and music21 sources, with metadata
   from each file's YAML front-matter.
7. **merge catalog** — the fragments into one `catalog.json`, with `content/sources/sections.json`
   attached as `teaching.sections`. This is also where `settle_key_signatures()` decides what
   the Library prints over "Key" for a score that states a signature and no mode, where
   `attach_demands()` writes every bundled score's measured demands (E0, §4 below) and
   `attach_provenance()` writes every row's provenance (E0, §4a), its two review bits and
   `reviewed` facts read from the human review record (D2, §4b). Since E1, after the parents'
   files exist and before the notation, demands and provenance steps, `excerpts.attach_excerpts()`
   cuts every approved row of `content/sources/excerpts.json` out of its parent's built file into
   `scores/excerpts/<id>.mxl` and adds the excerpt's catalogue row (§4c), which those steps then
   treat as any other file; a row the cutter refuses (a range across a repeat sign, a first-or-
   second ending or a jump; a parent that is gone) stops the build with the bars named, and a
   parent this build does not bundle gives no cut. `attach_demands` keeps the bridge's positions
   per printed bar in `build/positions-cache.json`, beside the counts' cache, for the proposer.
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
8a. **reports** (`step_reports`, E0) — the rung-claims report and the inventory, from the catalog
   and curriculum this build just wrote (`tools/content/claims.py`): as JSON in `build/`, and as
   `docs/prompts/rung-claims.md` and `docs/prompts/inventory.md` for the default build only, so a
   `--out` or `--quick` build never rewrites what the reviewer reads. `validate.py` prints the
   report's count as a warning, never a failure, until the reviewer says otherwise. Since D2 the
   priority rungs' tables carry a teaching-review column (the current teaching-use decision and
   its basis), and the same step writes the builder's microscope data (§4b) — the queue, each
   item's contract verdicts and rung claims, and the record's events — to
   `app/public/dev/review/microscope.json`: a builder-only `dev/` root beside the built content,
   not inside it (D2a), gitignored and left out of the precache (`vite.config.ts` `globIgnores`),
   so no learner downloads it and every file under `content/` stays precached (`offline.spec.ts`,
   P19). A `--out DIR` build writes it under `dev/` beside `DIR`.
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
and the Pages deploy run and turns the rest into placeholders. They differ in the rows the
strict build does not bundle — each a placeholder, with no `file` and an `importHint` — and in
what a missing file makes of those rows: `demands` and `measurement` unmeasured (*no notation
is bundled*), the provenance's demands fact saying so, and no excerpt cut from such a parent
(the public build's placeholders, below). (Q77, Doc-splice-2: this said they differ "in four
fields — `file`, `importHint`, `tags` and `source.checksum` — and in nothing else, which is
checked"; since E0 a bundled score is measured and a placeholder is not, and the one check
found, `test_pdmx.py`, holds a PDMX placeholder's file, hint and tag, not that nothing else
differs.)

**The rest of `tools/content/`**, which the steps above do not name, one line each so nothing
in the directory is a mystery:

- `common.py` — shared plumbing (paths, hashing, the provenance ledger, the catalog writer),
  dependency-free so the parts that need no music21 keep working without it.
- `licensing.py` — the §1 rules as code: `license_verdict` for the edition, `composition_verdict`
  for the composition; called by the importers and `validate.py`.
- `difficulty.py` — `features(score)` and `estimate(...)`: the one levelling model, ported to
  `app/src/score/difficulty.ts` for imports on the phone. **What counts as a note** is two
  filters, both added 2026-09-22 after `pending-review` Entry 51 found the instrument
  measuring things nobody plays, and both with a test in `tools/content/tests/test_difficulty.py`
  proved red without them:
  - `sounding()` drops `harmony.Harmony` — music21's `ChordSymbol` subclasses `chord.Chord`,
    so a lead sheet's printed `C` or `G7` arrived from `recurse().notes` as a sounding chord.
    129 of the 798 songs with a file that parse carry symbols; one sixteen-bar melody was
    reading four simultaneous right-hand notes and a twenty-one-semitone leap. There is no
    `chordSymbols` feature: what a player invents over a symbol is not measured here at all.
  - `voice_lines()` splits a staff into its voices, so a melodic leap is measured *within* a
    voice. `recurse().notes` yields voice 1 of a bar entirely before voice 2, which made every
    bar joint of a two-voice staff a leap; 418 of the 798 have a measure carrying more than
    one voice, and the correction moves `maxLeapRight` on 191 of the 542 quarried rows. The
    split is by **staff**, matching the comment in `app/src/score/difficulty.ts`, not by the
    hand `extractScoreModel` infers — the two ports have to agree within 0.2 of a stage.
  A stored `features` block is read by `import_pdmx.concepts_for`, which hands the catalog
  `hand-crossing` and `wide-span`; 35 quarried rows were carrying one of those off a chord
  symbol.

  **Both filters reached the port on 2026-09-23** and `app/tests/fixtures/levelling.json` was
  regenerated with them, which is what the agreement test had been failing over. They do not
  land the same way on the two sides, and the difference is written into the port rather than
  smoothed over: the chord-symbol rule holds there **by construction**, because OSMD parses
  `<harmony>` into a chord symbol container on the source measure and never into a voice
  entry, so a symbol cannot reach `printedNotes` at all — measured on a lead sheet carrying
  three symbols over five melody notes, which yields five notes, no hand span and no
  simultaneity. The voice split is a real change to `handStats`, which had been grouping every
  note on a staff by its onset: two voices sounding together read as a chord, and the melodic
  line stepped out of one voice into the other. The crossing floor has no counterpart on that
  side, because the port reports `handCrossings` as the constant zero.

  **A voice id on both staves is three different things, counted 2026-09-23** over the 799
  songs with a file (`pending-review` Entry 56). music21 sees 168 such scores and 233 voice
  ids, which is Entry 53's number reproduced. Read off the MusicXML rather than the object
  model, 137 of the 233 are a **separate run** — the edition restarting its `<voice>`
  numbering on the lower staff — 28 are two lines **sounding together** under one id, which
  an SATB hymn does in every bar, and 61 are a real **crossing**: one line stepping between
  the staves, never sounding against itself. Per-staff measurement is right for the first two
  and it is a choice for the third, where it hides the step at the crossing point — up to 65
  semitones. It was left alone: MusicXML records the staff a note is printed on and never the
  hand that plays it, so nothing in these files can tell a hand's leap from a change of staff,
  and moving one of the two ports alone would break the 0.2 agreement.
- `fit_level_model.py` — fits `content/sources/level-model.json` on the songs a person levelled.
  Refitted 2026-09-22 on the corrected features: 163 judged songs, Spearman 0.878,
  leave-one-out median absolute error 0.400 stages, against 0.858 and 0.440 for the same 163
  and the same fitter on the features as they were measured before. Twelve weights survive the
  monotone-sign check and `ledgerRatio` is no longer one of them — on today's calibration set
  its weight comes out backwards, with the old features as well as the new, so the feature the
  model once leaned on hardest (P14's +1.06, fitted on 173 songs) now earns nothing.
- `export_levelling_fixture.py` — writes what `difficulty.py` makes of the score fixtures, so
  `app/tests/unit/difficulty.test.ts` can hold the two implementations to one formula. Re-run
  it whenever `difficulty.py` or `level-model.json` changes: after the 2026-09-22 refit and
  before the 2026-09-23 port, 18 of its 49 comparisons were failing.
- `finder.py` — turns a lesson's `finder` block into the search line and chat prompt (`04` §3).
  Since E2a the build (`copy_curriculum`) passes a concept entry its own id, so the seed list of
  teaching repertoire (`content/sources/teaching-repertoire.json`) names its works among the concept
  prompt's examples where it knows the concept, within the prompt's limit — a proposal for the
  owner's search, never an admission. A lesson's `concepts` are deliberately not passed: a rung's
  finder states a key, a metre, a genre and a level the seed's works carry none of, and wired, most
  of the seeded lesson examples contradicted the rung's own constraints (Entry 111). Held by
  `test_finder.TestTheBuildPassesTheSeedConcepts`.
- `ladder_report.py` — writes `docs/generated/ladder.md`; `validate.py` fails a build whose
  committed copy is stale.
- `deploy_guard.py` — the Pages deploy's guard (Q88): refuses to publish a catalogue holding a
  placeholder whose reason is this build's fetch (`validate.unfetched_placeholders`), naming
  each; exit 0 publishes, 1 refuses, 2 cannot read the catalogue. Run by `pages.yml` only.
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
music21. The written file carries no encoding date (E50a): music21 writes the day it ran as
`<encoding-date>`, unconditionally, so until the converter removed it (`convert.without_encoding_date`,
beside the minted ids and the zip times in `normalise_archive`) a miss on another day wrote other
bytes than a hit, and the claim above was false for every converted file. Nor does it carry the
machine it was written on: `zipfile` records a creating system in every entry (0 on Windows, 3
elsewhere), so the laptop and CI's runner wrote two files for one score until `normalise_archive`
pinned it to 3 (`convert.ZIP_SYSTEM`, E50a's second part, on the reviewer's required correction).

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

**The public build's placeholders, which no cache changes (Q75, 2026-09-29).** The Pages
deploy builds the content strict (`PIANOPATH_STRICT_LICENSE=1`, §1); CI's content build is
the personal one. The strict build writes a placeholder — the id, the title, an
`importHint`, no file, `measurement.status: "unmeasured"` — for every Sapp Joplin rag
(`craigsapp/joplin`, CC BY-NC-SA; the other Kern rows are the Chopin Institute's CC BY first
editions, bundled), every PDMX row whose composition is not public domain (`personal-build`),
and the MuseTrainer rows likewise (six *Beautiful* pieces), and it cuts no excerpt from a
parent it does not bundle. The eight
rows that are placeholders in every build stay so (the seven rock import rows and the
Op. 25 no. 7 étude, `importHint` in the table). The runners' logs of 2026-09-29 show the
split: the Pages run (strict, no cache) reads KERN 116 imported, 47 placeholders, excluded 73,
and PDMX 367 imported, 175 placeholders, 2,089 items with demands measured on 1,783 and 235
unmeasured; CI's run (personal, cache restored) reads KERN 162 imported, 1 placeholder,
excluded 73, and PDMX 542 imported, 175 personal-build, 2,090 items with 2,011 measured and 8
unmeasured. None of that difference is the cache's: the Pages run converted its 116 Kern
files cold with CI's 73 exclusions, a strict build with every conversion cached writes the
same counts, and every source is one any runner fetches (the Sapp and Chopin Institute
repositories, MuseTrainer) or one the repository commits (the PDMX slice); the cache is
written only on runners (CI's job, and `render-full.yml` when dispatched), never seeded from
the owner's machine. The owner's phone runs the Pages
build, so it shows those placeholders for as long as the deploy is strict (§1: until the
repository is private). `pages.yml` restores CI's cache without saving one, for speed only.
The claim rule counts a placeholder neither as an option that keeps a claim nor as one that
refutes it (`validate.concept_claim_findings`, `claims.CHECKED`): on the strict build 2.4's
tie and ragtime.8's stride bass, each established on the personal build only by an option the
strict build placeholders, are warned as not judged there, not failed.

**The public build is not published without what it could not fetch (Q88, 2026-09-29; the
reviewer's Q86 ruling).** The validator warns a build's own fetch placeholder and passes (§3
step 9, Q80); the deploy does not. `pages.yml`'s step *Guard the deploy*, after the build and
before `configure-pages` and the upload, runs
`tools/content/deploy_guard.py --dir app/dist/content`, which asks
`validate.unfetched_placeholders` of the catalogue the artifact publishes. A row whose
`importHint` carries this build's fetch reason (today `import_mutopia`'s *file was not
fetched* and *is not the pinned file*; any reason Q82 or a later step adds to
`UNFETCHED_REASONS`) fails the build job, naming each id and reason, so nothing is uploaded,
`deploy-pages` does not run and the previous deployment stays live. Licence placeholders,
import-only rows and runtime drills pass; a catalogue it cannot read is refused. A deliberate
removal is judged by the catalogue and the ladder report, not here. While a fetch keeps
failing, every push's deploy is refused, whatever else it carries.
`tools/content/tests/test_deploy_guard.py` holds the guard and the step's place; the runner's
refusal is unverified until a Pages run with a failed fetch is read.

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

**Vocabulary v0 (2026-09-26, C2)** lives in `content/curriculum/vocabulary/`: `skills.json`
and `demands.json`, each beside its schema, in a folder of their own because `build.py`
reads every JSON file at the top of `content/curriculum/` as a stage file. They are not
copied into `public/content`; nothing at runtime reads them yet. `validate.py` checks their
shape and references (`vocabulary_errors`), refuses a `targetSkills` or `demands` id on a
catalog row that v0 does not define, and runs the evidence gate (`evidence_gate`, `02`
Part H) over every rung's `requirements` (C5), printing the lesson rules the app does not judge
(`unjudged` requirements) on every build; nothing is waived. The
catalog schema gained three optional item fields: `targetSkills`, `demands` and `role`.

**A demand has one definition, and it is the app's.** The detectors are TypeScript
(`app/src/demands/detect.ts`) and read the score model OSMD makes of a file, so the build
does not keep a Python copy: `tools/content/demands.py` hands score files to
`app/tests/unit/demandsOfFiles.test.ts` through Vitest, the way `render_check.py` hands them
to Playwright, and reads back the demand ids per file. The cost of the alternative choices
was measured on the built catalog (`pending-review` Entry 71).

**Every bundled score carries its measured demands (E0, 2026-09-27).** `build.attach_demands`
sends every score file the build ships — authored, PDMX, Kern, MuseTrainer and generated —
through `demands.measure_each` and writes on the row `demands` (the ids, in the vocabulary's
order) and `measurement`: the located count of each demand, the bars, steps and notes, the
definitions it was measured under (`EVIDENCE_DEFINITIONS` and a fingerprint of the files that
decide a measurement, `demands.DEFINITION_FILES`), and `established` — the demands the item
provides at a useful density, which is what the app's one gate reads
(`app/src/curriculum/eligibility.ts`). The density rule is one file,
`content/sources/opportunity-density.json`: a per-demand minimum count and count per bar, each
a hypothesis with its reason, never one universal percentage; a generated item may also
establish a demand by its family contract where the contract states a density for it (a
presence-only rule establishes nothing — the tie drill). It is cached in
`build/demands-cache.json` on each file's sha256 and on the fingerprint, so a detector change
measures everything again and a changed score measures only itself. A file the app cannot
load, a non-notation file, or a piece whose notation is not bundled carries `demands:
"unmeasured"` with the reason in `measurement.reason` — never an empty list that reads as "no
demands"; a runtime drill has no `demands` and `measurement.status: "runtime"`. A reader that
fails on more than a tenth of the files stops the build (a broken bridge, not a library). An
imported score is measured the same way in the app, by `importStore.measureImport`, at import
and again whenever the learner corrects its hands (`correctImportHands`).

### 4a. Provenance on every content object (E0; R35, R15, R11, Part 21 §B)

`build.attach_provenance` writes `provenance` on every catalog row, and the import path on every
imported score (`importStore.importProvenance`):

- **`source`**: `authored`, `pdmx`, `kern`, `musetrainer`, `generated` (with D0's identity in
  `generator`: family, version, seed), `runtime` (a drill the app makes when it opens),
  `placeholder` (not bundled), or `imported-midi` / `imported-musicxml` / `imported-pdf`.
- **Identity** (R15): `edition` (the PDMX upload's CID, or the source file's sha256),
  `arrangement` (the item; a PDMX duplicate edition shares the arrangement of the upload it
  duplicates) and `composition` (an authored variant names its tune by `variantOf`; otherwise
  `work_key` of the title and composer, the PDMX identity function — conservative, so it is
  labelled `inferred`). A generated item or runtime drill is identified by its `generator`
  and names no composition: an exercise is not a work (the inventory counts none).
- **`converter`**: `convert.py` by its tool fingerprint, `author.py`, or the app's MIDI converter
  by `MIDI_CONVERTER_VERSION` — owned since E2 by the converter itself (`app/src/import/midi/convert.ts`,
  re-exported by `importStore.ts`; E26). The command-line converter (`tools/midi-cleanup/midi_to_musicxml.py`)
  keeps its own `CONVERTER_VERSION` and writes it into every file it emits as
  `<software>tools/midi-cleanup/midi_to_musicxml.py v.N</software>` in the MusicXML `<encoding>` block,
  beside music21's own (the element may repeat there, so no comment is needed); an import of such a
  file names that converter and version in `converter`, and its `hands` and `key` facts are
  `inferred` — the staves and the key are that converter's decisions, and the file does not say
  whether it kept the tracks or split one line. The two converters are separate programs and
  their versions move separately.
  `CONVERTER_STAMPS` lists each recognised converter's stamp and what it converted from; any other
  MusicXML keeps its staves and signature authored, and the `via` names what the encoding block
  names and says the door does not know whether an edition or a converter from MIDI wrote them.
  MuseScore's name is not a stamp: its exports carry it however the score was made (E42).
- **`facts`**: each fact with how it is known — `measured` (the detectors, with their
  definitions; the key a song's signature and final bass give), `inferred` (the converter's
  default tempo, a level estimate, a hand split, a key guess, an identity key), `authored`
  (written by the edition, the generator's recipe, this repository, or the learner's
  correction), `reviewed` (a person's decision), `unmeasured`, `runtime`. Where the tempo is
  inferred, the tempo-sensitive demands (the density file's `tempoSensitive`: notes shorter
  than the beat) are listed `untrusted` beside the measured ones: measured in the notation,
  their difficulty resting on a tempo the converter supplied. Never flattened into one field.
  (The import path wrote no `untrusted` list until E2, so an import whose file states no tempo was
  the one notated candidate whose inferred tempo the gate could not see; it writes the build's
  rule now, at import, at a hand correction and at the launch's measurement below.)
- **`facts.measuredUnder`** (an import, E2; E25): `value` is the app's converter version in force
  when the row's notes were measured — an unmeasurable verdict included — and absent on a row
  measured before E2, which reads as version 1, the only one there was. It is not the converter
  that wrote the notes; that stays `converter`. On each launch (`main.ts`, after the first screen,
  one row per idle slice) `importStore.measureStoredImports` measures once, through the store,
  every stored import that is due (`measurementDue`): never measured (imported before E0), measured
  where there was no document to parse it in, unmeasurable under an older version than the one in
  force, or converted by an older version of the app's converter and not measured since. A PDF is
  never handed to the detectors, and its verdict is written with the version, so it is tried again
  only when the version moves. The MIDI file is not stored, so an older converter's score is
  measured again, never converted again. Each row is written in one transaction onto the row as it
  is then, only if its score is still the one measured: the learner's corrected score, its
  correction provenance, its level and its rungs are never overwritten. A row imported before E0
  gets the provenance its stored file shows, with no `hands` or `key` fact unless a converter's
  stamp says whose they are, because a converted MIDI file is stored as MusicXML too and the door
  it came through is not on the row.
  For a score the detectors measured, `value` is `"<converter version>;<measuring fingerprint>"`
  (E40); the fingerprint is `app/src/data/measuringFingerprint.ts`'s (the detectors, the model, the
  vocabulary, the density file, the engraver's release), never compared with the build's. The
  launch also measures a measured row under other definitions or none (`definitions`), and one
  whose tempo is inferred with a tempo-sensitive demand and no untrusted list (`untrusted`, E41); a
  PDF or an unreadable file follows the version alone.
- **An import's tempo** (E32, E48): where the file writes no `<sound tempo>` or `<metronome>`, a
  words direction that is only a metronome mark is read at import (E32; the glyph mapped from
  SMuFL's code point, the metre's beat in x/4 or x/2 where the glyph is missing) and written as a
  measure-level `<sound tempo>` beside it; `facts.tempo` authored, quoting the mark. The learner
  states a tempo through `importStore.stateImportTempo` (E48), which writes it into the first bar,
  measures again, names the learner in `facts.tempo`, clears only the untrusted entries the tempo
  resolves and never loses to a launch measurement.
- **The build's tempo printed as text** (E50): the content converter reads the same mark before it
  inserts its default (`convert.tempo_printed_as_text`, in `normalise`'s default branch, E32's rule
  ported: `TEXT_MARK` verbatim, SMuFL's metronome glyphs, the metre's beat in x/4 or x/2 where the
  glyph is missing, 20–400) where it stands before any note sounds (X31a's opening rule), and writes it
  as the score's `<metronome>` with a `<sound tempo>` in quarters, the words removed; a mark after a
  note has sounded stays as words and the conversion's warnings name it. The seven bundled PDMX
  scores that printed `= N` were re-converted with it and their `pdmx.json` rows respliced
  (`tempoDefaulted: false`), so their tempo fact is authored, via the upload. One rule, two
  definitions (the door's TypeScript, the converter's Python); one shared definition is the later
  ingestion seam.
- **`facts.promise`** (D3a, 2026-09-28): on every generated item, its family's promise for its
  recipe — `{kind: "authored", via: "family_contracts.json (the rule matching the recipe)",
  value: "music" | "drill"}` — resolved by `review.promise_of`, the microscope's reading: the
  first of the row's rules whose `when` the recipe matches (`family_contracts.selected`), never the
  row's first rule, so the `meter` family's 5/4 walk is `drill` and its 12/8 blues `music`. The
  app's one gate reads it beside `review.teaching` and refuses a `music` item for every automatic
  offer until that bit is `true` (`docs/02` Part E2's study note); nothing at runtime reads the
  contract table. A runtime drill (the nine reading rows among them) and a notated item carry no
  promise fact. `test_measured_truth.TestThePromiseFact` holds it on the built catalogue.
- **`review`**: R42's two decisions as separate bits, `score` (usable, faithful) and `teaching`
  (a good teaching use for its claimed role), filled since D2 from the human review record (§4b):
  each dimension's current decision on the item's current identity, `yes` true, `no` and `fix`
  false, `null` where no person has decided — with, per current decision, a `reviewed` fact
  (`reviewedScore`, `reviewedTeaching`) carrying the value, the basis (`inspected`, `notation`,
  `heard`), the date and the event id. A PDMX row's quarry `keep` is recorded as `quarryKeep` (the
  decision; the reviewer's note, working prose with no source, stays in `pdmx.json`) and is
  neither bit (Part 12 §14).
- **`physical`**: a generated item's declared large-hand voicing, with its prerequisite and
  alternative (D0 finding 5); the gate recommends no such item until the alternative reaches
  the learner.
- **`excerpt`** (E1, with `source: excerpt`): the definition the item was cut from (`of`,
  `fromBar`, `toBar`, `selection`, its `targets` and approving `event`), `cutVersion`,
  `parentSha256` (the parent's built file at cut time), `parentEdition` and `key` (sha256 over the
  parent's bytes, the range, the selection and the cut version); `stale` where the row was
  approved on parent bytes the parent no longer has. The parent's `composition` and
  `arrangement` are carried down; the `edition` is the parent's; the `converter` is
  `tools/content/excerpts.py` by its cut version; the facts say the demands were measured on the
  cut, the level estimated on the cut, the hands and the boundary authored by the approved row.
  `approvedCutVersion` (the cutter the approval was merged under; below `cutVersion`, stale by cut
  version, carried to nothing) and `dropped` (the edition's texts the cutter left out) are in the
  block too (E33).
  §4c has the rest.
- **An import's identity** (G1): the build keys none, and the catalogue row an import becomes
  carries no bytes, so `material.materialOfItem` answers `none` for it; where the Score screen
  loads the stored score it hashes the text (`material.textIdentity`: the sha256 of its UTF-8
  bytes) and the import's runs and encounters carry `{kind: 'file', sha256}` — a duplicate import
  under a new id is the same material. An excerpt's `fromBar`/`toBar` also scope what the learner
  met: the encounter query normalises an excerpt's bars into its parent's by them
  (`encounterStore.familiarityIn`).
- **The one gate over these facts, and the contact it reads** (E2a; the E2 review's required
  change, `docs/review/responses/2532022.md`). Every automatic offer asks `eligibility.eligibleFor`,
  which since E2a is the material gate (`candidates.eligibleForMaterial`) asked of the want as the
  simplest requirements over the candidate contract; the established questions — the teaching-use
  admission over `facts.promise` and `review.teaching`, the coping and opportunity questions over
  the measurement, the `untrusted` marker — are one private core (`eligibilityCore.ts`) that only
  the material gate asks and that imports neither gate. A row whose demands are unmeasured (a
  placeholder, a score imported before E0 until the launch measures it, a PDF) is refused for an
  automatic want as `unknown-forbidden`, naming the demands it cannot rule out, wherever the learner
  is not prepared for every demand, and stays open to exploration; every other verdict is the one
  it was. A row the card takes straight from a rung's own list (an authored placement, or the
  learner's assignment of an import) asks the teaching-use admission alone, as before. Novelty,
  where a requirement asks it, reads the row's material identity (`provenance.identity` through
  D4's `material.materialOfItem`: an excerpt's cut, never its parent; an import `none`, read by its
  id, and the verdict says so) against D4's contact reading (`progressStore.contactIn`) over the
  stored runs the caller passes (`candidates.contactFromRuns`): the gate reads no store, and no
  caller asks for novelty yet. A row whose file the converter wrote without a date also carries
  `provenance.formerIdentities` (E50a): the historical dated identities of that file's music while
  music21's `<encoding-date>` was written. They come from `tools/content/former_identities.json`,
  historical compatibility data and never a rolling window: every dated music21 file identity in the
  catalogues able to store a learner's material, from D4's (the first to carry `provenance.identity`)
  to the laptop's last deployable one before E50a, generated by
  the former-identities generator kept beside Entry 166 (`docs/prompts/runs/E50a/`) and never edited by hand; a dated identity an
  installed catalogue shows outside it is added deliberately (its `--check` and `--add`). Each entry
  keeps the creating system its machine's `zipfile` wrote (the laptop's 0), because the history is
  what that machine wrote; the converter now writes one system everywhere. The build records an entry
  for a row only where removing the entry's date gives the row's file and putting it back, zipped
  under the entry's system, gives the entry's bytes (`convert.former_identities`), so a musical change
  drops them. Beside them, since E50, the old identity each reviewed musical repair names
  (`tools/content/repaired_identities.json`, generated by the repaired-identities generator kept beside
  Entry 163, `docs/prompts/runs/E50/`, never edited by hand): an entry of the table above, related to the
  repaired file, recorded for a row only where the row's file with the repair's restore lines put back,
  then the old date, zipped under the old system, is the old file's bytes. Since E50b the same table
  holds, under `cuts`, the one derived repair relationship the build produced — the approved Wabash
  cut re-cut from its repaired parent, never a rule for other descendants — recorded for the cut's
  row only where the cut's definition and cutter are the relation's, the parent's repair still
  re-proves on the parent, the cut zipped under the relation's creating system is the new cut it
  recorded (the cutter's zip writer stamps the platform's system, E55), and the cut with the parent
  repair's restore lines put back, zipped under that system, is the old cut the laptop served
  (`excerpts.former_cut_identities`; written by the repaired-cut generator kept beside Entry 181,
  `docs/prompts/runs/E50b/`, which re-cuts the rebuilt old parent to prove it, never by hand). Every relation says `tempoChanged`, and the build lists
  those old identities again as `provenance.tempoRepairedFrom`: a run of one measured its percentage
  of the old tempo, so the app's rung reading refuses its tempo channel (`material.tempoNotComparable`,
  `rungState.meetsStandard`). A stored
  run, encounter, pruned run's summary or project that names one names this row's material; the app
  resolves it at read (`material.learnerMaterial`) and rewrites nothing. Learner continuity only: D2's
  record, an excerpt's `parentSha256`, the committed-file checks and the render, cache and checksum keys
  read exact bytes and never this list.

### 4b. The human review record and the merge (D2; R42, G28, G29, E16)

`content/review/decisions.jsonl` is what a person decided about an item: one JSON event per
line, append-only, never re-serialised; `content/review/README.md` lists the fields. The short
form:

- **One dimension per event** — `usableScore` or `goodTeachingUse` — each with its own `value`
  (`yes`, `no`, `fix`), `reason`, `category`, `basis`, reviewer, time and a stable event id.
  `basis` is `inspected` (the facts), `notation` (the page read) or `heard` (complete playback,
  both hands sounding, at the item's intended tempo; hand-alone or partial playback stays
  `notation`).
- **Bound to the item's identity**: a generated item's `drill.generator` triple and its recipe
  (`drill.params` with the hands, and the tempo — the seed is `null` on every deterministic
  family, so the triple alone does not name an item); a notated item's built file (its sha256,
  `attach_demands`' cache key); `none` for an item with no file, shown as weaker. A moved version,
  a changed recipe or a changed file makes every earlier event on the item stale.
- **Current values per item and dimension**: triage lines (`by: "triage"`) and stale events never
  participate; the latest valid human event (`at`, then the later line) supersedes the earlier;
  an event on one dimension never touches the other.

Decisions are made on the builder's microscope (`#/dev/microscope/<item id>`, which reads
`app/public/dev/review/microscope.json`, written by §3's reports step — builder-only, never
precached, and outside `content/` since D2a) and leave the device as an exported file, merged by
`python tools/content/review.py --merge <file>`: a line that is malformed, names an item the
built catalogue does not have, or names an identity it does not have is refused with its line
number; an event id already in the record is skipped when identical and refused when not, so a
rerun appends nothing. No server writes the record (the reviewer's decision, `docs/review/
responses/7ab175a.md`). `review.py --check` lists the queue — the music families' canonical items,
then the not-judged families', then the options a rung lists for a claim no detector checks, then
the rest — with what is decided, and exits 1 only for a fault in the record.

**What the microscope prints of the gate and the contract** (D5, 2026-09-29; G55, G56, G60). `review.microscope_data` carries, per generated item, the musical gate's answer (`musical`, from `review.musical_verdict`). A drill has `applies: false`. A music family whose row names no evaluator gets the gate's "not evaluated" words. The study gets the evaluator's verdict — `passes`, `total`, `floor`, `wrong`, `parts` and the gate's `why` — with `evaluator`, the evaluator's contract `version` and a `source`. The version is `musical_evaluator.VERSION`, bumped in the same change as anything that can move a total or a wrong cadence; it is provenance for the displayed assessment, never part of the material identity and never a hearing. The `source` is `carried` when the item holds a verdict the build persisted (`drill.study.verdict`; no build step writes one yet) and `recomputed` when the projection ran the same gate on the built file, which is every study today, at a cost within the build's noise. The data's top-level `evaluator` names the version the projection recomputes with, and the screen says so when a carried verdict was written under another. Each generated item also carries `requires` (the rules `family_contracts.selected` picks for its recipe) and `missing` (those its measured demands lack). The screen prints `missing` as "Contract requires but the notes lack" and reads no rule's `when` itself. The screen's provenance list prints each fact's `value` beside its kind and `via`, as the record holds it (a promise's `music` or `drill`; a decision's `yes`, `no` or `fix`, with its basis, date and event), and "no decision" for a review dimension nobody has decided, each on its own line. The browser computes no verdict, and "unheard" follows every musical promise.

`family_contracts.json`'s `heard` stays a hand-maintained declaration; `test_family_contracts.py`
holds that a family marked `heard: true` has at least one `heard` decision on a current item.
`review.py` and `app/src/review/record.ts` implement the contract; `tests/fixtures/
review_cases.json` holds both to it.

### 4c. The excerpt (E1; Part 24, R5, R7, R15, R35, R40, R42)

An excerpt is a catalogue item of its own type (`type: 'excerpt'`), never a bar range on its
parent: a passage cut by the build from the parent's **built** file into a file of its own, so the
measurement (§4), the provenance (§4a), the review record's identity (§4b), the one gate and the
screens all read the passage and nothing of the piece around it. A named section
(`sections.json`, `teaching.sections`) is a different thing — a loop over bars of a whole item —
and nothing here touches one.

- **The definition** is a row of `content/sources/excerpts.json`: `of`, `fromBar`/`toBar` (printed
  bars, 1-based, the pickup counted as bar 1, as `sections.json` counts), `selection` (`both`,
  `right`, `left`), `targets` (vocabulary skill or demand ids), `label`, `note`, `parentSha256`
  (the parent's built bytes the approval was made on) and the approving `event`, `by`, `at`;
  rejections beside them in `rejected`, with their reasons. `validate.py` checks every row beside
  the sections: a parent that exists and is a notated item with a built file, a range inside its
  printed bars, a selection its staves allow, targets the vocabulary has, a derived id no other
  row or item shares, no repeat sign, ending or jump inside the range; a row approved on other
  parent bytes is warned as stale.
  `cutVersion` is recorded by the merge (E33); `validate.py` also warns a row merged under an older
  cutter and a target the built cut does not establish (E29), naming the count.
- **The id and the key.** `excerpt.<parent id without its leading "song.">.b<from>-<to>`, with
  `.rh` or `.lh` for one hand: the definition and nothing else, never a title. The key (above)
  makes a moved endpoint or the other hand another excerpt, leaves a renamed one or a parent
  whose catalogue metadata changed the same, and makes a parent whose file changed detectable.
  The cut file's own sha256 is the item's identity in the review record, and what a run of it
  writes into its evidence context as `material`.
- **The cut** (`excerpts.cut`): music21 by printed position; the clef, key, time and tempo in
  force at the cut carried into its first bar; a pickup kept where the row starts at bar 1; a tie
  into the first bar severed to a plain note, a tie out of the last dropped; a repeat sign at
  either edge neutralised (the passage is presented once); layout and severed slurs dropped; the
  unselected staff of a one-hand cut silenced and left out by `convert.drop_silent_staves` through
  `convert.normalise`; the header normalised — the excerpt's id as the work title, no credits, no
  encoding date, the archive's entry named after the excerpt — so the bytes depend on the notes
  and the definition alone. The parent's attribution is in the excerpt's catalogue `source`
  (the parent's, whole), which the Library's Source and Licence rows and the lesson row show.
  The edition's texts that are not the music are left out — a copyright or licence line, a swing
  the app does not play, a direction to other players — each listed in `dropped` (E33, cut version
  2). The renderer draws SMuFL's private-use accidentals and metronome notes in an edition's text
  as their Unicode characters, in a cut and in every other score it loads (`OsmdView.load`, E31);
  the file is unchanged.
- **The row.** `excerptOf`, `hands` (the selection), `level` estimated by `difficulty.py` on the
  cut, `tracks` and `source` the parent's, the licence tags the parent's (a cut of a personal-build
  or CC BY-NC edition is one too; a build that does not bundle the parent gives no cut),
  `concepts` the targets' where the vocabulary names them once (the left-hand pattern, one
  detector for seven concepts, names none), `keySig` the parent's where the parent has one key and
  the cut prints it (settled once the notation is read). An excerpt establishes a demand by the
  **window rule** — the density file's `perBar` and `minInWindow` in place of the whole-piece
  `min` — written as `measurement.window`.
- **Proposed, never created.** `python tools/content/excerpts.py propose --for <skill or demand>
  [--rung R] [--of ID] [--bars 4..8]` (`excerpt_proposer.py`) scores every window of every
  measured song from the bridge's positions and the parent's notation: the target at the window
  rule's density and recurring through the bars, a phrase start, an ending that resolves or leads
  onward, the pickup included, the hands as the parent has them, a useful length — each a pure
  function with its weight — and three gates: nothing the judging rung has not taught, nothing a
  family contract forbids, D0's physical limits. Nothing reads a level. Left-hand windows are not
  offered while the detectors read a one-staff bass-clef part as treble. It writes
  `build/excerpts/candidates.json` and the builder-only `app/public/dev/review/excerpts.json`,
  which the microscope's excerpt view (`#/dev/microscope/excerpts`) reads: the parent drawn with
  the cut marked, played from two bars before the cut to two after, the boundaries moved a bar at a
  time and re-scored from the proposer's own table, and a decision — approve, adjust and approve,
  reject with a reason — exported and merged by `python tools/content/excerpts.py --merge <file>`,
  idempotently by event id (a range approved twice is refused with the row named). A rejection of
  an approved range withdraws the approval, current or stale, so the build stops cutting it; both
  decisions are kept, the approval whole in the file's `superseded` list with the rejection as the
  event that replaced it, the rejection in `rejected` with its reason, and a later approval of the
  range, with its own event, is a new decision (E54, Entry 174). For the PDMX
  workflow this is the step after `commit.py` and before the build (`tools/content/pdmx/README.md`).
- **Unplaced.** An approved excerpt is in the Library and on no rung. `python
  tools/content/excerpts.py --candidate-rungs` writes, from a built catalogue, the rungs whose taught
  set holds every demand each excerpt carries and whose claims its notes establish, a claim one
  detector answers for several concepts marked † with the concepts named. Placement is
  F's, on a stated gate: that line established on the combined build **and** a current
  `goodTeachingUse: yes` on the cut's identity in D2's record by a named reviewer stating their
  basis. No automatic offer in the app reaches an unplaced excerpt; its runs mark the parent
  neither passed nor performed, and the repertoire lifecycle keeps to songs.
- **The teaching-use bit is the cut's (E1a, 2026-09-28).** `review.fill_reviewed` fills an
  excerpt's `provenance.review.teaching` only from a decision on its current identity, the cut
  file's sha256 (§4b): a `yes` recorded on an earlier cut of the same definition — the parent's
  file changed and the cut rebuilt under the same id — is stale, and the bit stays `null`
  (`test_review_record.py` › `TestAStaleDecisionOnAnOlderCutAdmitsNothing`). The app's one
  admission (`eligibility.admittedForTeaching`) reads that bit for an excerpt as it reads it for a
  music-promising generated item: without `true`, no automatic offer takes the cut, whatever a
  rung lists; the Library and exploration do not ask. A moved endpoint or the other hand is
  another id, so a decision on the old range names an item the catalogue no longer has.
- **An import later** (E2 with X): nothing here assumes a bundled parent except where it reads the
  parent's built file; an import's excerpt would need its stored score's bytes as the parent's,
  its own measurement of the cut at import (`importStore.measureImport`), and a definition kept on
  the device rather than in `excerpts.json`.

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
