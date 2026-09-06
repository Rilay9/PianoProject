# P14 — The quarry run, the levelling model, and the ladder rewrite  ·  Intended model: **Opus 5**, **on the owner's machine with the archive on disk**  ·  Branch: `feat/p14-pdmx-quarry`

(Include `_COMMON-HEADER.md`. The default branch is `claude/piano-teaching-app-bo19td`; there is no `main`.)

Read: `docs/decisions/2026-09-06-p11-replan.md` §0, §1.5–§1.7, §2 (all), §8, §10;
`tools/content/pdmx/README.md`; `docs/02-curriculum.md` Parts D and F and the terminology
section; `docs/decisions/2026-09-05-p5-authored-content.md` §1 (the skip list this run
verifies); `content/sources/musetrainer.json` (the shape of hand-judged levels).

## Preconditions — check, do not assume

- This session runs on the owner's Windows machine. Python 3.11 (`py -3.11`), Node 24, Git,
  the pipeline requirements and Playwright Chromium are installed; verify each with a
  command and paste the versions. CI pins Node 22; that difference is known and fine.
- `PIANOPATH_PDMX_DIR` points at the folder holding `PDMX.csv` (254,077 rows, 209,574,867
  bytes) and `mxl.tar.gz` (1,894,335,797 bytes). `select.py` must report the fingerprint and
  refuse if it differs; if it differs, stop and ask.
- Ask the owner for the Zenodo record id (`14648209` or `15571083`) before `commit.py`;
  pass it as `--record`. If he does not know, record `unknown` and the fingerprint.

## Build / verify

1. **Run the quarry** band by band in the §2.2 order (Stages 1–2 first, then 3, 4, 5, 6,
   7–9, then the named wants), pasting each step's summary: rows passing each gate, the
   `compositionStatus` split, the genre-bucket fill per band, top unmatched composers,
   machine rejection rate per band. Grow `composers.json` from the unmatched list where a
   name is a real composer (with the death year, whichever side of 1930 it falls), and
   re-run that band. **`00` D23 applies:** a file marked public domain by the dataset is a
   candidate whatever its composition's status; the label is recorded, never used to reject.
   Build and validate with `--personal`; also run `validate.py --strict-license` on the same
   output and paste the personal-build count it refuses, because that is what the Pages
   deploy will do.
2. **Review** with the owner: open `build/pdmx/review/index.html`, fill `review.csv`.
   Apply the **40 % rule** (§2.3): if review drops more than 40 % of a band, adjust the
   selector and re-run that band before committing it. Record the final rates.
3. **Fit the levelling model** (§2.4) on the judged songs; paste Spearman and leave-one-out
   MAE; commit `level-model.json` only if it meets the bar, else keep the fallback table and
   say so. Copy the model into the built content for P15.
4. **Commit** the accepted files and `pdmx.json`; `build.py --offline --render` clean; every
   PDMX item renders; note-for-note round trips recorded.
5. **Verify the P5 skip list.** For each Part F tune P5 skipped, find its PDMX file (title
   search in `candidates.json`; single-line traditional rows are exactly this), and author the
   ABC against it: melody note-for-note, then the simple LH the unit asks for. Each authored
   file's `%%pianopath` header names the PDMX CID it was checked against. Aim for every
   Stage 1–3 tune in the table; report the ones PDMX does not have.
6. **The easy *Entertainer*** (§1.6): take the PDMX easy arrangement if it survives review,
   else author the A-strain arrangement as specified.
6a. **The named wants.** Search PDMX by title and artist for the seven rock-module songs
   (`02` Part D8: Seize the Day, Dear God, So Far Away, Fiction, Final Masquerade, Waiting
   for the End, Shadow of the Day) and the *Beautiful* suggestions (Nuvole Bianche,
   Experience, River Flows in You, Comptine d'un autre été, Interstellar, Merry Christmas
   Mr. Lawrence, One Summer's Day). Review each candidate for quality like any other; a
   kept one takes over the existing placeholder id in the personal build, and the rock
   lessons' `songOptions` need no change. Report per song: found / kept / dropped and why.
7. **Rebuild Stage 1–5 song options** from what is now bundled, honouring `levelBand` (add
   the band to every lesson; §1.7), fixing `classical.5` with real sonatinas and Burgmüller,
   and widening every Stage 1–4 core lesson to ≥ 5 songs where the quarry allows. Stage 6
   top-ups only where a style is thin. Named gaps at 7–9 (Inventions, WTC, Scarlatti K
   numbers, *Frog Legs*) checked and filled or moved to the finder examples.
8. **`tools/content/ladder_report.py`** (§2.6) and the `02` Part D rewrite: repertoire
   columns replaced by the generated report; a validate check that the committed report
   matches the catalog. Update `02`'s terminology paragraph on level vs rung.
9. **Docs:** `03` §2's `[PDMX]` row rewritten to describe the quarry; `01` §6–§7 payload
   re-measured; a decision note with the yields per band, the model's numbers, and the
   review's reasons for the largest drop category.

## Acceptance

- `validate.py --strict-license` green; every lesson inside its level band; the ladder
  report up to date.
- `build.py --offline --render --personal` clean on the owner's machine **and** the same
  commit builds clean in CI without the archive and with `--strict-license` (push the
  branch; paste the CI run URL and the strict build's personal-build placeholder count).
- Python tests green; the composer decoy test still refuses the decoys.
- Report: files committed per band; payload before/after; the model's Spearman/MAE; the P5
  skip list with a per-tune outcome; every "wanted, absent" piece moved to a finder example.

**Cannot be checked here:** nothing about the build. What no one has heard: as P10 said,
no ear has been near these files; list ten for the owner to play first, chosen from the
lowest bands, where a wrong transcription would do the most harm.
