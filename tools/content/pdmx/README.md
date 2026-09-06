# Running the PDMX quarry

This is the one part of the pipeline that runs on **your machine and nowhere
else**. The archive is 209 MB of CSV and 1.9 GB of compressed MusicXML; it is
not in this repository, it is not in CI, and it never will be. What ends up in
the repository is the few hundred converted scores you keep, plus a table
describing them — so every later build, here and in CI, is deterministic and
needs none of the above.

Five steps, in order. Each one writes into `build/pdmx/`, which is ignored by
git, and each one can be re-run without redoing the one before it.

## Before you start

The archive folder needs two things in it:

    PDMX.csv        209,574,867 bytes, 254,077 rows
    mxl.tar.gz      1,894,335,797 bytes  ← leave it packed

An already-unpacked `mxl/` directory is accepted too, but there is no reason to
unpack it: that is 250,000 files and about 8 GB, and `extract.py` streams the
tarball once instead.

Point the tools at it once, and every command below picks it up:

```powershell
$env:PIANOPATH_PDMX_DIR = "C:\Users\yalir\repos\Piano Stuff"
```

…or pass `--pdmx-dir "C:\Users\yalir\repos\Piano Stuff"` to each command.

## 1. Select — about two minutes

```powershell
py -3.11 tools\content\pdmx\select.py --pdmx-dir "C:\Users\yalir\repos\Piano Stuff"
```

Reads the CSV once and writes `build/pdmx/candidates.json`. Prints how many
rows passed each gate, why the rest were rejected, the composition-status
split, the per-band and per-bucket fill, and — the useful one — the 200 most
frequent composer strings it did **not** recognise.

That last list is how `content/sources/composers.json` grows. A real composer
in it is worth a line in the table, with the death year, whichever side of 1930
it falls on. Add the names, then re-run this step; it is cheap.

To work one band at a time, which is how the run is meant to go:

```powershell
py -3.11 tools\content\pdmx\select.py --band 1-2
```

Add `--no-fingerprint` while you are iterating: hashing 209 MB takes a few
seconds and only matters for the run you actually commit.

**Measured on the real archive:** 254,077 rows read, 37,499 past the gates, 306
chosen by the quotas, 6 named wants found. The dataset's own deduplication flag
rejects 142,078 rows on its own — more than half the archive — so do not be
alarmed by the size of the rejection table.

## 2. Extract — seconds, not minutes

```powershell
py -3.11 tools\content\pdmx\extract.py
```

Streams `mxl.tar.gz` once, writing only the members `select.py` asked for into
`build/pdmx/raw/`. **Measured on the real archive: 306 members in 10.9 s, after
scanning 254,974 tar entries.** It stops as soon as it has them all, so a small
band is faster still, and files already extracted are skipped — a re-run after
a crash costs only what is missing.

## 3. Quarry — the slow one

```powershell
py -3.11 tools\content\pdmx\quarry.py
```

Six machine gates per file: convert and normalise, round-trip note for note,
structure, the P2 truncation scan, render in Chromium with cursor-step parity,
and duplicate detection against the catalog. Writes `build/pdmx/quarried.json`
and the converted files, and prints the rejection rate per band.

This needs music21 and a built app; the render step runs the same
`content-render.spec.ts` the content build uses, over copies staged into the
app's own content root. Add `--skip-render` to do everything except the browser
pass, which is much faster and is what to use while you are still adjusting the
selector.

Re-running is cheap. A verdict about the *file* — it would not convert, it did
not round-trip, its structure is wrong — is carried over from the previous run
when the source bytes are unchanged; only the browser's opinion is asked again,
because that one depends on the app build. `--no-reuse` forces everything.

**Measured on the real archive:** 306 candidates, about 25 minutes for the
music21 pass and the browser pass together.

**Stop rules** (replan §2.3):

- If a band's machine rejection rate is above about half, the selector is
  letting the wrong things through — look at the reasons before reviewing
  anything.
- If review (step 4) then drops more than **40 %** of what the machine passed
  in a band, stop, adjust `select.py` for that band, and re-run it. Do not
  commit that band first.

## 4. Review — you, with your ears

```powershell
py -3.11 tools\content\pdmx\review.py
start build\pdmx\review\index.html
```

Writes a static page — the two-bar preview, the facts, the flags, a link to the
MuseScore original — and `build/pdmx/review/review.csv`. Fill in the `decision`
column: `keep`, `drop` or `later`. `level_override` and `note` are optional.

Nothing here can tell you whether a transcription is any good. That is the
whole reason this step exists.

```powershell
py -3.11 tools\content\pdmx\review.py --check
```

lists what is still undecided. Re-running `review.py` keeps the decisions you
have already made, so growing the composer table and re-quarrying a band does
not cost you the work.

## 5. Commit

```powershell
py -3.11 tools\content\pdmx\commit.py --record 14648209
```

Copies the `keep` rows into `content/scores/pdmx/` and writes
`content/sources/pdmx.json`. A row with no decision stops it.

`--record` is the Zenodo record id the archive came from — `14648209` or
`15571083`. If you do not know which, leave it off: it records `unknown`, and
the CSV's sha256 and the archive's byte counts identify the archive well enough
to fill the id in later without re-running anything.

## Then the ordinary build

```powershell
py -3.11 tools\content\build.py --offline --render --personal
py -3.11 tools\content\validate.py --strict-license
```

The first is your build: it bundles everything, including pieces whose
*composition* is not public domain. The second is what the public Pages deploy
runs, and it will refuse those by name — which is the point. Both should be
green; the second's refusals are a list, not a failure of the first.

## What breaks first on Windows

Three things, in the order they are likely to bite. All three are handled here,
and all three are worth checking first if something looks wrong:

1. **Tar member names.** The CSV writes `./mxl/1/11/<cid>.mxl`; the tarball's
   members are `mxl/1/11/<cid>.mxl`, with no leading `./`. A mismatch extracts
   nothing at all and looks exactly like a corrupt archive. `select.member_name`
   normalises it and a test pins it.
2. **Encoding.** The CSV is UTF-8 and Windows' console is not. Every file here
   is opened with an explicit `encoding="utf-8"`, and `csv.field_size_limit` is
   raised because some rows carry a tag list several kilobytes long. If a
   console print explodes on an accented composer name, set `PYTHONUTF8=1`.
3. **Paths.** `pathlib` throughout, no shell anywhere, and a space in
   `C:\Users\yalir\repos\Piano Stuff` is the normal case rather than the odd
   one — quote it in PowerShell.
