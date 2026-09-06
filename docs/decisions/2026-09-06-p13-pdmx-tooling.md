# P13 — the PDMX quarry tooling, built without the archive

Date: 2026-09-06 · Branch: `feat/p13-pdmx-tooling` (from `feat/p12b-harmony-ear`)

## What this is

Everything the quarry needs, built and tested against a fixture, so that P14 —
which runs on the owner's machine with 4 GB of archive on disk — is a run and
not a debugging session. Nothing here has seen the real PDMX; the fixture is a
30-row CSV using the archive's real column headers and a tarball of scores
written for the purpose.

## Decisions

### 1. Two programs, one line between them

`select` / `extract` / `quarry` / `review` / `commit` need the archive and run
once, on one machine, with a person watching. `import_pdmx.py` needs nothing but
the repository and runs on every build, everywhere. What crosses the line is the
**converted, normalised** `.mxl` plus a table of checksums — so CI builds a
catalog containing quarried scores without ever seeing the 4 GB they came from,
and the build stays deterministic.

### 2. Composition status is a label, and `--personal` is one flag

`docs/00` D23. `select.py` records `pd` / `unknown` / `in-copyright` on every
candidate and rejects nothing for it; `--strict-license` refuses anything that is
not `pd`, which is what the public Pages deploy runs.

`--personal` replaces `--allow-nc` as the owner's flag and covers both questions
— the edition *and* the composition — because a build that admitted one and not
the other is a distinction nobody asked for. One mechanism, every source: the six
MuseTrainer files excluded for their composition (Mariage d'Amour under three
names, the Luo Ni arrangement under two, the Clayderman) are items now, tagged
`personal-build`. An exclusion about the *edition* stays an exclusion; no flag
can grant a right nobody granted.

### 3. Three facts read off the archive rather than guessed

The archive is on this machine, so its first line and its first few tar members
were read. That is not downloading it and it is not quarrying it; it is checking
three assumptions that would each have cost P14 an evening:

- **`tracks` is `"0-0"`** — a dash-separated MIDI program list, not JSON. Read as
  JSON it yields nothing and every two-staff file is rejected as unreadable.
- **The tar members have no `./`.** The CSV writes `./mxl/1/11/<cid>.mxl`; the
  tarball's members are `mxl/1/11/<cid>.mxl`. A mismatch extracts *nothing at
  all* and looks exactly like a corrupt archive.
- **The licence column says `publicdomain` and `cc-zero`.** `licensing.py` read
  both as "unclear", which would have refused every row in the dataset. Those are
  the dataset's own enumeration, not free text somebody typed, and they are
  recognised now.

### 4. Monotone signs are enforced by dropping, not clamping

`difficulty.fit` removes a feature whose fitted weight comes out backwards and
refits, rather than clamping it to zero in place. A clamped coefficient leaves
the other features carrying its variance, and the report then describes a model
nobody would write down. The dropped features are listed in the report.

The acceptance bar for using a fitted model at all is replan §2.4's: Spearman
≥ 0.8 and leave-one-out median absolute error ≤ 0.7 stages. `level-model.json`
ships with `fitted: false` and the coarse fallback table, so the file exists
before P14 fits it and `estimate` says which of the two it used.

### 5. Least squares without numpy

Twenty features on two hundred points, solved by Gaussian elimination on the
ridge-regularised normal equations, written out in `difficulty.py`. Adding numpy
so that a 20×20 system can be solved once a year is not a trade worth making
when the pipeline's only heavy dependency is music21.

## What the fixture proves, and what it cannot

Proved, by `tools/content/tests/test_pdmx.py` (50 tests):

- every selector gate, on the row written to fail it
- every composer-normalisation rule, on strings the archive actually contains
- the three decoys are labelled `in-copyright`, and every decoy in the table is
- the quarry's structure, truncation and single-line gates, on scores built to
  trip them
- the whole chain end to end into a temp directory, and the resulting fragment
  validating as a personal build and as a strict one
- a tampered file failing the build by name

Not proved, and it is worth being plain about it: **nothing here has met the real
archive.** The fixture is 30 rows chosen by me to exercise code I wrote. The real
CSV is 254,077 rows written by strangers, and the things it will contain that
this does not are exactly the things nobody thought of. The rejection counts, the
unmatched-composer list and the per-band rates that `select.py` prints are the
instruments for that, and reading them is the first hour of P14.

### The three things expected to break first on Windows

In order, and all three already handled — which is why they are worth checking
first when something looks wrong:

1. **Tar member names** (see §3). Extracting nothing reads like a corrupt
   archive.
2. **Encoding.** The CSV is UTF-8; the Windows console is not. Every file is
   opened with an explicit encoding and `csv.field_size_limit` is raised, because
   some rows carry a tag list several kilobytes long. A console print that
   explodes on an accented composer name wants `PYTHONUTF8=1`.
3. **Paths.** `pathlib` throughout and no shell anywhere, because the archive
   lives in `C:\Users\yalir\repos\Piano Stuff` and the space in it is the normal
   case rather than the odd one.

## Follow-ups

- The composer table is 88 entries and will be wrong about somebody. P14 grows it
  from the unmatched list; the death year is what matters, whichever side of 1930
  it falls.
- `content/scores/pdmx/` currently holds one seeded score from the fixture, so
  the precache test has something to find. P14 replaces it.
