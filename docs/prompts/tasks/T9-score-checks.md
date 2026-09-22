# T9 — Checks that catch wrong score files, run over every file

**Read `docs/prompts/working-rules.md` first, then `docs/00-invariants.md`, then the
checklist in `CLAUDE.md` ("Before reporting any piece of work"). A hook puts that checklist
in front of you before your turn can end; answer it honestly and say what it caught.**

## Why

Seven score files are known to be wrong (`docs/lesson-audit/README.md`, "Score files that
are wrong"). Every one was found by a person reading a file that a lesson happened to
mention. 800 songs and 1,183 exercises are in the catalog; 110 of the 292 songs on a rung
are named in no lesson, and the 508 Library-only songs were never opened. The owner has
said (2026-09-21, `docs/pending-review.md` standing context 5) that he is not the gate:
**checks the build runs** have to find these, not a reader.

`docs/prompts/working-rules.md` §2.8: make the correction mechanical. This task is that,
for the seven shapes already seen.

## The seven faults, and the check each needs

| known fault | item | the check |
|---|---|---|
| titled "in G major", written in F | `song.classical.beethoven-ludwig-van-beethoven-ecossaise.pdmx` | **key-consistency**: a key named in the title vs the key signature and mode; the key signature vs a pitch-class analysis of the notes (music21 `analyze('key')`) vs `finalBass`; flag disagreement with the analysis confidence |
| 72 grace notes, no key signature, tempo 40 | `…joyful-joyful-we-adore-thee.pdmx` | **grace density**: grace notes as a share of all notes above a threshold you set from the corpus distribution; and a tempo far below the corpus for its metre |
| only the first 16 bars | the *G minor Minuet* (find its id in the catalog) | **truncation against the archive**: for a `.pdmx` item, its bar count against the other archive copies of the same title in `build/pdmx-genres/candidates.json` / `tools/content/archive_notation.py`; flag when far below their median. For non-archive items, a final bar that is not a full bar and carries no final barline |
| bar 10 holds six beats in 4/4 | `song.folk.so-danco-samba.pdmx` | **bar duration**: per bar, per voice, the sum of durations against the time signature, handling `<backup>`/`<forward>`, a pickup first bar, and a final bar that completes the pickup; flag over- and underfull bars |
| K. 1e contains all of K. 1f as its Trio | the two Mozart minuets on `classical.4` | **containment and duplication**: a per-bar fingerprint (pitch classes and durations per staff); one item's bar sequence contained in another's, and near-duplicate pairs by shared-bar ratio. Also finds the same piece imported twice under two ids |
| "second and third movements" holds one | the Clementi item on `classical.5` | **title against structure**: a title naming several movements, numbers or parts against the number of tempo/key/metre sections in the file (heuristic; report at low severity) |
| backward repeat after the second ending | `song.classical.i-got-rythm.pdmx` | **repeat structure**: forward and backward repeats paired, endings numbered in order, a backward repeat inside an ending that is not the first |

Each check: **proven red on its known item and green on a clean control item you name**,
in `tools/content/tests/test_score_checks.py`. A check that cannot be made to fire on its
known fault is not done; say so.

## Build

- `tools/content/score_checks.py`: runs every check over every item in
  `app/public/content/catalog.json` whose file exists under `content/scores/` (or wherever
  the build puts them; read `build.py` to find out), and writes `build/score-checks.json`
  (one row per flag: item id, check, severity, the numbers, one line why) and
  `build/score-checks.md` grouped by check, worst first.
- Thresholds come from the corpus distribution, stated in the file beside the number, not
  guessed. Where a threshold is a judgement, say so in the code comment.
- Read the MusicXML directly where the existing tools do (`truncation_scan.py`,
  `notation.py`); use music21 where analysis needs it. Do not re-serialise any JSON file
  (`CLAUDE.md` says why).
- Do **not** wire it into `validate.py` as a failure. Add it to `build.py` as a report
  step only if that is cheap; otherwise leave it standalone and say so.

## Then: the list, with a proposed fix per row

For every flagged row, one line in `build/score-checks.md`:

```
<item id> | <check> | <the numbers> | <proposed fix: retitle / replace from archive copy <cid> / split / drop from rung <rung> / false positive because …>
```

One item per tool call, per working-rules §2.4. Do not apply the fixes; a second reader
applies them from your list. **Do** say the false-positive rate per check, because a check
that flags a third of the corpus is a check nobody will read.

## Rules

- Touch only `tools/content/score_checks.py`, `tools/content/tests/test_score_checks.py`,
  `build/score-checks.*`, and one appended entry in `docs/pending-review.md` (Entry 23:
  what was built, what each check found, counts per check, false-positive rate, what is
  unverified). Nothing else. Other agents are working in `app/` and in `build/pdmx-*`.
- Do not run the content build, `vitest` or Playwright. Run `pytest tools/content/tests/test_score_checks.py` and the script itself.
- Your scratch folder: `C:\Users\yalir\AppData\Local\Temp\claude\C--Users-yalir-repos-Piano-Stuff\26d8772b-b51d-4e51-bd51-20002e98bae1\scratchpad\T9\`.
- Never name an AI model anywhere you write. Commit nothing.
- A title is not the music. A grep is not the repository: an absence needs two searches, both named. A plural is several claims. Nothing is heard.
- Every one of the seven checks is done or has an explicit not-done line with the reason. Never stop silently.

## Final message to the coordinator

The path of `build/score-checks.md`; a table of check → items flagged → false positives you
judged; the seven known faults and whether each was caught; what is unverified.
