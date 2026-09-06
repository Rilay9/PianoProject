# P11 — what the pipeline remembers, and what it can now see

Date: 2026-09-06 · Phase: P11 · Branch: `feat/p11-robustness`

The replan (`2026-09-06-p11-replan.md` §1.3, §7) put this phase first because every later
phase pours content through two checks — the render check and `validate.py` — and both were
too slow to run often and blind in the places §7 lists. This note records what was built,
what the bisector found, and three things the work turned up that the replan did not predict.

---

## 1. The build now remembers its conversions

`convert.cached_convert()` keys a conversion on the source bytes, a digest of `convert.py` +
`abc_tools.py`, the music21 version — and, added here, **the conversion options**. The
replan's key omits them, but `keep_lyrics`, a forced tempo and an overridden title all change
the written file, so keying without them would hand two callers asking for different things
the same `.mxl`. That is the one way a cache can be wrong, so it is closed.

Everything else about the design follows from "a cache may change when an answer is computed,
never what it is": entries are written through a temporary name and renamed, a damaged entry
is a miss rather than a crash, and a cache that cannot be written at all is not an error.

Measured on this machine, `build.py --offline`, 790 catalog items:

| | cold (`rm -rf build/cache`) | warm |
|---|---|---|
| wall clock | **27 min 12 s** | **5 min 12 s** |
| `[KERN]` | 169 converted | **169 cached, 0 converted** |
| `[AUTH]` | 32 converted | **32 cached, 0 converted** |
| `[MT]` | 9 converted | 8 cached, 1 converted |

The one `[MT]` file that converts every run is the Chopin edition whose 2048th-note tuplet
music21 refuses to export. `cached_convert` does not cache failures, so it is attempted and
falls back to a verbatim copy each time, which is the existing behaviour and correct.

**The cache did not get the build to the "about a minute" §1.3 hoped for, and the reason is
worth writing down: conversion is no longer the expensive step.** `generate_exercises.py`
builds 426 exercises with music21 on every run and nothing caches that, because they are
generated rather than converted. It is now the bulk of a no-change build. Making the
generator incremental is a P12a-sized job and is listed as a follow-up rather than smuggled
in here.

## 2. Conversions had to become reproducible first

Two runs of the same build produced different files, and it was not the cache's fault.
music21 mints part and instrument ids from Python object identity
(`P64fa5e9c10000199a0c6ce0460494465`) and stamps every zip entry with the wall clock, so the
same music produced a different sha256 on every run and on every machine.

That is fatal to two things this phase is built on. The render manifest is keyed on the
**output file's sha256**, so an incremental run would have re-engraved scores nobody had
touched — incremental in name only. And the catalog records each file's checksum as
provenance, so a checksum that changes when only the clock did says a file moved when it did
not.

`write_mxl` now renames minted ids to `P1`/`I1`/`P2` in document order and rewrites the
archive with a fixed 1980 timestamp. The ids are internal cross-references and `P1`/`I1` is
what MuseScore and Finale emit anyway; ids someone actually chose are left alone. Verified by
converting all 35 authored items twice with the cache off and diffing: byte-identical, where
three of them changed every run before.

## 3. The render check is incremental, and no longer blind

`build/render-manifest.json` holds one entry per output-file sha256 — ok, steps, measures,
duration, tempo, time and key signature, hands, cursor steps, render time, console output,
error. A run engraves only unseen hashes and merges the remembered numbers into the report,
so `apply_durations` still writes a complete catalog. It is flushed every 20 fresh renders,
so a crash costs at most twenty (§7.8). `--full` ignores it, and
`.github/workflows/render-full.yml` runs that weekly and on demand, which is what stops a
renderer upgrade hiding behind the cache.

The division of labour is deliberate: **the spec reports facts, `render_check.py` judges
them.** The judgements need the catalog and are worth unit tests, and a check nobody can test
is how the pipeline stayed blind in the first place. So:

| §7 | check | on failure |
|---|---|---|
| 7.1 | cursor-step parity, on content and not just the 41 fixtures | **fails the check** |
| 7.2 | `console.error`/`warn` captured per item | reported |
| 7.3 | seconds per bar outside 0.5–12 s | reported |
| 7.4 | catalog `hands` against the model's | reported |
| 7.5 | orphan exercises, in `validate.py` | reported (fails from P12b) |
| 7.8 | a crashed run resumes from the manifest | — |
| 7.9 | `--if-missing` deleted | — |

Parity fails because a mismatch means the engine would follow a different score from the one
drawn. The other three describe content that already ships, and turning them into failures is
a content decision rather than a pipeline one.

The P2 grace-16th truncation scan (`2026-09-05-p2-score-rendering.md` §8) is now permanent as
`truncation_scan.py`, run by `validate.py` over everything a build converts. It reads the
MusicXML directly, allows for `<backup>`/`<forward>`, and reports only the defect's signature
— a bar under half its time signature that *also* holds a short grace. Current result: **689
files, 29,425 bars, 78 short, 0 with a short grace**, which reproduces exactly what P2's
one-off run found and confirms the defect still does not touch the library.

## 4. Two lists were three, and one of them was load-bearing

§1.8 asked for one track list. Taking the `tracks` enum out of `catalog.schema.json` and
checking against `content/curriculum/00-tracks.json` surfaced what the enum had been hiding:
every *unit* track was defined, but two ids on 441 catalog items were not — `technique` (434
items) and `film-game` (7).

`technique` is not a typo to delete. `src/curriculum/session.ts` picks the warm-up slot with
`item.tracks.includes('technique')`, so the session builder depends on it; it is a category
that was simply never written down. The code has always used `tracks[]` for two jobs, so the
file now says both:

- **`tracks`** — followable modules. A unit may belong to one; the Plan screen draws them.
- **`itemLabels`** — categories an item may carry. No ladder, so a unit claiming one is an
  error, and `validate.py` says so in those words.

`common.TRACKS` — a third list, which nothing imported — is gone, replaced by `load_tracks()`
reading that file.

## 5. `levelSource`, and the owner's own numbers

`level-banded` stops being a tag and becomes `levelSource: judged | estimated`, required by
the schema. `catalog_item()` takes it with **no default**, so every writer has to say which
it is out loud; a default would be a guess made in the wrong place. `import_kern` maps
`_banded`/`levelBanded` to `estimated`, everything else is `judged`.

Current spread, printed by `validate.py` every run — **124 of 790 items are estimates**, and
they are exactly where the replan expected them, in the imported Romantic repertoire:

```
L0: 0/6   L1: 0/72   L2: 0/85   L3: 0/81   L4: 0/244
L5: 0/39  L6: 7/39   L7: 57/113  L8: 23/66  L9: 37/45
```

The app prints an estimate as `≈ L7.1`, and the Library detail sheet offers **Re-level** into
a new `levelOverrides` store (`DB_VERSION` 2, migration keyed on `oldVersion` so a phone that
has been on version 1 since P7 keeps its rows). `allItems()` applies overrides before anything
downstream sees an item, so the Library, the swap sheet and the session builder all read the
same number, and a re-levelled item counts as judged — the owner having played it is a better
source than the estimate was. Overrides ride the backup, because export/import iterates
`STORE_NAMES`.

Swaps and the session builder prefer a judged level over an estimated one **at equal
distance** only. Confidence is the tie-break, not the sort: a judged 8.0 is not a better swap
for a 7.0 than an estimated 7.1.

## 6. `validate.py` reports 172 orphan exercises

Reachable from no lesson and no concept — mostly the two-octave arpeggios and the wider
scale set the generator produces beyond what any rung names. They are not broken; they are
invisible to anyone following the plan. Reported now, a failure from P12b (§7.5), which is
the phase that gives the generated backbone somewhere to live.

## 7. What the first full render check found

The blind spots were not hypothetical. The first run of the new check over all
790 items reported this, and every line of it is something the previous check
could not have said:

**Cursor-step parity: 0 mismatches in 689 items.** The invariant that had only
ever run on the 41 fixtures holds across the whole library. That is the result
worth having — it is now checked rather than assumed, on every new file.

**One score does not render at all.** `song.classical.chopin-nocturne-20.alt`
throws inside OSMD's `SkyBottomLineCalculator` and draws nothing. It was being
copied verbatim by `import_musetrainer` on the stated assumption that "the
original still renders", because music21 cannot export its measure 59. Nothing
had tested the assumption. The bisector answered it in one run: the same
2048th-note tuplet that keeps Op. 25 no. 7 out of the library. Excluded, with
the reason in `musetrainer.json`; the primary edition of the same nocturne is
bundled, renders, and nothing referenced the variant.

**Six durations between 22 and 40 minutes**, all Chopin, all reporting exactly
96 bpm — `DEFAULT_TEMPO_BPM`. The NIFC first editions state no tempo, so the
converter inserts a neutral one and the model faithfully reports how long a
scherzo takes at 96. The measurement is of the placeholder, not the music.
`apply_durations` now refuses to write a duration the validator would reject
and reports it instead. **Giving those editions real tempos is content work and
is a follow-up** — it also affects the pieces short enough to stay inside the
bound, which are wrong by the same factor and say nothing about it.

**Seven items claim `hands: both` and the model sees one hand** — six left, one
right, all NIFC Chopin. Reported, not failed, because it is a content-accuracy
question rather than a pipeline one, but it is a real lead: an extractor that
sees no right hand in a Chopin mazurka is either mis-reading the staff
assignment or the conversion is putting both staves on one.

**One pace flag:** `song.classical.satie-gnossienne-1`, 17.2 s per bar. Correct
and useful — a Gnossienne is written without barlines, so its eleven "bars" are
enormous. The check is doing what §7.3 asked and the piece is fine.

**58,852 console lines, one distinct message:** `SkyBottomLineCalculator: width
not > 0 in measure N`, emitted once per measure by almost every item. Nothing
had ever seen it. It is the same subsystem as the crash above, which is the
first thing to pull on if that defect is ever chased upstream.

## 8. What the bisector found: the thirteen Chopin scores, explained

**It is a rounded tuplet duration, and it was never the beams.**

`tools/content/bisect_render.py` was pointed at the Op. 9 no. 2 nocturne's kern
source. Five halvings, each rendering both candidate ranges in one browser round
trip:

```
37 measures
checking the whole score renders as badly as reported…
  confirmed: BadArguments:Invalid note initialization object: {}
  probing bars 1-19 and bars 20-37…    1-19  FAILS
  probing bars 1-10 and bars 11-19…   11-19  FAILS
  probing bars 11-15 and bars 16-19…  16-19  FAILS
  probing bars 16-17 and bars 18-19…  16-17  FAILS
  probing bars 16-16 and bars 17-17…  16-16  FAILS
smallest failing range: measure 16
```

Bar 16 is a **13-in-8 tuplet of thirty-seconds** at `divisions=10080`. music21
writes each tuplet note as **1163** divisions. Thirteen of them come to 15119 —
one short of the 15120 they have to fill — so the bar totals 60479 where a full
6/8 is 60480, and OSMD builds a note out of the leftover nothing. 10080 is not
divisible by 13, so **no integer duration can express this tuplet**: it is a
writer defect at least as much as a renderer one.

The measure is committed as
`app/tests/fixtures/scores/edge/known-issues/osmd-empty-note.musicxml` and
`scoreModelKnownIssues.test.ts` asserts the throw, following the P2 pattern. It
reproduces in a one-second jsdom test, where P10 had a 20-second browser
timeout and no name for it.

**One hypothesis was tested and rejected, which is worth recording because it
looked so convincing.** The bisector's own output showed eighth notes carrying
`<beam number="1">` through `<beam number="17">`; across that one score 249
notes carry more beams than their printed type allows and the worst carries 46.
Extending `clean_beams()` to drop them was written, and the measure still
failed with the beams gone. The change was reverted rather than shipped: it
alters the engraving of 249 notes in one score alone, and the evidence for it
had evaporated. P10's "beams ruled out" was right.

**The thirteen stay excluded**, and now with a cause. The fix belongs in
`convert.py` — choose a `divisions` value divisible by every tuplet's
`actual-notes`, or hand the remainder to the last note of the tuplet — and is a
follow-up rather than this phase's work, because it changes the timing of every
converted file by up to one division and needs a full render check to confirm
it is safe. That check now exists and costs one weekly job.

**Upstream issue text**, for opensheetmusicdisplay:

> **Title:** `Invalid note initialization object: {}` on a tuplet whose
> durations do not sum to its span
>
> **Version:** 2.1.2. **Repro:** the attached single measure — a 13-in-8 tuplet
> of 32nds with `divisions=10080`, each tuplet note `<duration>1163</duration>`.
> 13 × 1163 = 15119, one division short of the 15120 the tuplet spans; the
> measure totals 60479 against a 6/8 bar of 60480.
>
> **Expected:** the measure renders, with the rounding absorbed or reported.
> **Actual:** `load()` throws `Invalid note initialization object: {}` from
> VexFlow before anything is drawn, so the whole score is lost rather than one
> bar. MusicXML has no way to express a 13-tuplet at a `divisions` value not
> divisible by 13, so writers will keep producing this; treating a short
> remainder as a rest, or clamping it, would degrade gracefully.

## 9. Other things fixed on the way

**An unreachable source crashed the fetch.** `reachable()` let `subprocess.TimeoutExpired` out
of `git ls-remote`, so a source the probe could not reach aborted the whole fetch instead of
being skipped with a warning — the opposite of what `fetch.py`'s docstring promises. It only
fires where git has a credential helper installed, because there a 404 over HTTPS is answered
with a password prompt rather than an error: the probe blocks for its full 30 seconds and then
raises. `craigsapp/bach-wtc` is named in `docs/03` §2 *precisely* so the probe can report it
missing, and it is probed before `nifc-chopin` — so on such a machine the crash silently cost
the build all 21 Chopin first editions and failed validation with 21 dangling curriculum
references that looked like a content bug. `GIT_TERMINAL_PROMPT=0` stops the asking; catching
the timeout keeps the promise either way.

**The e2e web server was rebuilding the content it was supposed to be testing.** Playwright's
`webServer` ran `npm run build`, which fires `prebuild`, which builds content. `--if-missing`
made that a no-op; without it, every e2e run reconverted the library, and the render check
rebuilt the very catalog it had been handed to measure — so the numbers it wrote back could
have described a different build from the one under test. The web server now runs `build:app`
(icons, `tsc`, `vite build`, no content).

## 10. Follow-ups

- **The generator is now the slow step** (§1). Caching or incrementalising
  `generate_exercises.py` would take a no-change build from five minutes to well under one.
- **`fetchedAt` is stamped at build time**, not fetch time, so it changes on every run and two
  builds of unchanged sources still differ in the catalog. The honest value is in
  `content/scores/imported/SOURCES.md`, which records the actual fetch per source. Changing it
  is a provenance decision, not a pipeline one, so it is left here rather than taken.
- **The thirteen Chopin scores now have a cause** (§8): fix the tuplet rounding in
  `convert.py`, re-admit them in `kern.json`, and let the full render check confirm it.
  Op. 25 no. 7 and the MuseTrainer nocturne are the same family — music21 cannot express
  their durations at all — so a `divisions` fix may re-admit those too.
- **Six Chopin editions state no tempo**, so their durations are computed at the neutral
  96 bpm and come out between 22 and 40 minutes. The render check no longer writes them,
  but the pieces short enough to stay inside the bound are wrong by the same factor and
  say nothing about it. They need real tempos in `kern.json`.
- **Seven items claim `hands: both` where the model sees one hand**, all NIFC Chopin.
  Either the staff assignment or the extractor is wrong; the flag now says which items.
- **Failed conversions are not cached**, so the one `[MT]` file that cannot be exported is
  retried every build. Cheap, but it is the reason `[MT]` never reads "0 converted".
- **Windows consoles need `PYTHONUTF8=1`.** `build.py` prints `→` in its summary and the
  default cp1252 console raises `UnicodeEncodeError` on it. CI is Linux and unaffected.
