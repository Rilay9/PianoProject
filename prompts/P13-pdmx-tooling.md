# P13 — PDMX quarry tooling, built and tested without the archive  ·  Intended model: **Opus 5**  ·  Branch: `feat/p13-pdmx-tooling`

(Include `_COMMON-HEADER.md`. The default branch is `claude/piano-teaching-app-bo19td`; there is no `main`.)

Read: `docs/decisions/2026-09-06-p11-replan.md` §0, §2 (all), §7.7; `docs/03-content-pipeline.md`
§1–§3; `tools/content/licensing.py`, `import_kern.py` (the table-driven pattern to follow),
`convert.py`, `render_check.py`, `app/tests/e2e/content-render.spec.ts`;
`content/sources/kern.json` (the shape of a source table).

## Why

The archive lives on the owner's machine and can never reach CI, so the quarry is two
programs: the selector/extractor/quarry/reviewer that need the archive, and the build step
that needs only what they committed. This phase builds all of it against a **fixture** — a
30-row CSV and a tiny `mxl.tar.gz` made from the repo's own fixture scores — so the run in
P14 is a run, not a debugging session on a Windows laptop.

Runs in the container. Needs no PDMX. **Do not attempt to download PDMX** — Zenodo is
unreachable from here and the design does not want it here.

## Build / verify

1. **`tools/content/pdmx/` package** exactly as §2.1: `select.py`, `extract.py`, `quarry.py`,
   `review.py`, `commit.py`, plus `tools/content/import_pdmx.py` as a build step wired into
   `build.py` (fragment `catalog.pdmx.json`) and `content/scores/pdmx/` as a tracked
   directory (add a `.gitkeep`; add the line to `01` §2). `--pdmx-dir` / `PIANOPATH_PDMX_DIR`;
   a missing `PDMX.csv` or archive is a one-paragraph refusal naming the file and the two
   accepted layouts (`mxl.tar.gz` or unpacked `mxl/`). `extract.py` streams the tarball once
   (`tarfile.open(mode='r|gz')`) and writes only wanted members; test it on the fixture tar.
   Windows is the target machine: use `pathlib`, open the CSV with `encoding='utf-8',
   newline=''`, raise `csv.field_size_limit`, and never rely on a shell.
2. **`content/sources/composers.json`** (§2.2): canonical name, aliases, born, died, for
   every composer named in `02` Parts D–F plus the method-book composers listed in the
   decision doc; and three in-copyright decoys (Bartók, Kabalevsky, Shostakovich) that a test
   proves are labelled `in-copyright` and refused by `--strict-license`. `select.py`'s
   composer matcher: NFKD fold, strip "composed by", "arr.", bracketed years (parsed and
   checked against the table), match on alias; the traditional aliases set `traditional`.
   **The match is a label (`00` D23):** `compositionStatus` `pd` / `unknown` /
   `in-copyright` on every candidate; nothing is rejected for it. Print the top-200
   unmatched strings anyway (they grow the table, which improves the labels and the
   `composer` field). Tests for every normalisation rule with the real strings quoted in §0.
   **`--personal` flag:** add it to `build.py`, `validate.py` and `import_pdmx.py` as the
   owner's flag — it implies `--allow-nc` and admits `personal-build` items; `--strict-license`
   refuses them; `pages.yml` is unchanged (strict). `validate.py` prints the personal-build
   count every run. Apply the same admission to `content/sources/musetrainer.json`'s
   composition exclusions (the Senneville and Clayderman files become personal-build items
   rather than exclusions) — one mechanism, every source. Tests both ways.
3. **Gates and ranking** exactly as §2.2 and §2.3, each gate a named function with a test,
   each rejection recorded with its reason; per-band **and per-genre-bucket** quotas from a
   `--quota` table with the §2.2 defaults and the remainder rule; the **named wants** list
   (`content/sources/pdmx-wants.json`: the seven rock-module songs and the *Beautiful*
   suggestions, title + artist patterns) searched by folded title/artist match and admitted
   outside the quotas; over-quota candidates kept in `candidates.json` with their scores.
4. **`tools/content/difficulty.py`** (§2.4): `features(score)` returning every listed
   feature; `estimate(features, model)`; `fit(samples)` with monotone signs, leave-one-out
   Spearman and MAE reporting; `content/sources/level-model.json` seeded with the coarse
   fallback table so the file exists before P14 fits it. Tests: features on the generated
   fixtures (a scale has span 0 per hand and one voice; a chord exercise has max simultaneous
   3), fit recovers a known linear model from synthetic samples.
5. **Quality gates in `quarry.py`** (§2.3 items 1–6): round trip, structure, the P2
   truncation scan, render via the existing spec pointed at `build/pdmx/converted/` (add a
   `CONTENT_ITEMS_JSON` env so the spec can take an explicit item list rather than a catalog),
   cursor-step parity, duplicate detection against the catalog; the per-band rejection rate
   printed and written to the run header.
6. **`review.py`** writes the static `index.html` (preview PNG, facts, flags, MuseScore link)
   and `review.csv`; `--check` lists undecided rows; `commit.py` copies `keep` rows to
   `content/scores/pdmx/<id>.mxl`, writes `content/sources/pdmx.json` (header fingerprint:
   CSV sha256 and row count, archive byte sizes, Zenodo record id from `--record`), assigns
   ids (`song.classical.<composer>-<slug>.pdmx`, `song.folk.<slug>.pdmx`,
   `song.pop.<artist>-<slug>.pdmx`, and for a named want the existing placeholder's id so
   the personal build's item replaces it), sets `levelSource: "estimated"`,
   `compositionStatus` (the reviewer may correct it in the CSV), the `personal-build` tag
   where the status is not `pd`, `alternatives` both ways for `duplicateOf`, and refuses a
   row with no decision. `import_pdmx.py` verifies every checksum, fails naming the file,
   and under `--strict-license` emits the strict-build placeholder for a personal-build row
   (the `import_kern.py` two-builds-one-table pattern).
7. **Fixture end to end:** `tools/content/tests/fixtures/pdmx/` with a 30-row CSV (real
   column headers; rows covering every gate and label: no mxl, wrong program, conflict,
   draft, unknown composer, traditional, a PD composer with bracketed years, a decoy
   composer, a pop title matching a named want, lyrics, two-track piano) and a tar built
   from `app/tests/fixtures/scores/**`. A test runs select → extract → quarry (render step
   mocked behind a flag) → review → commit into a temp dir and asserts the catalog fragment
   validates under `--personal` **and** under `--strict-license` (with the personal-build
   rows turned into placeholders).
8. **Precache:** the one-line test in `offline.spec.ts` that a file under
   `content/scores/pdmx/` is in the precache manifest (§7.7) — put a fixture-sized real
   `.mxl` there so the test has something to find, and remove it in P14 when real files land.
9. **Owner's-machine readiness:** a `tools/content/pdmx/README.md` with the exact commands in
   PowerShell form (`py -3.11 tools\content\pdmx\select.py --pdmx-dir "C:\...\Piano Stuff"`),
   what each step writes, how long to expect (the CSV pass is ~20 s; the tar stream is
   minutes), and the stop rules from §2.3.

## Acceptance

- Python tests green including the fixture end-to-end; paste the run.
- `build.py --offline` green with an empty `content/scores/pdmx/` and with the fixture file;
  `validate.py --strict-license` green both ways.
- `npm run e2e` green with the precache test.
- Report: the gate list with its test name beside each, the composer table size, the
  fallback level table as seeded, and the README's command list.

**Cannot be checked in the container:** any behaviour against the real archive. Say so, and
list the three things you expect to break on Windows first (paths, encoding, tar member
names) so P14 looks there first.
