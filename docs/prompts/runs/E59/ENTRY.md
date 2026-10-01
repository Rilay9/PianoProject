### Entry 184 — E59 — A defaulted tempo is playback only: where a source states no tempo, `normalise` writes the converter's 96 as music21's `numberSounding` (a `<sound tempo="96">` beside empty `<words />`) and no longer as a printed `<metronome>` quarter = 96; every shipped row the no-tempo branch produces moved — 169 PDMX files from their own committed bytes by one text transform, 60 kern and 6 MuseTrainer files at the build, 3 approved cuts of moved PDMX parents — 238 identities, each related under the reviewed-repair relation with `tempoChanged: false`; Mutopia, the authored scores and the generator take the branch zero times; nothing a learner hears or sees changes (2026-10-01)

**Base.** `13e1b1a8`, checked first (`git log -1 --format=%h`). The brief `docs/prompts/tasks/E59-a-defaulted-tempo-is-playback-only.md`, approved with its required change folded in (`docs/review/responses/questions-fc9f1a8b.md` §E59, widened by `questions-fc9f1a8b-correction.md` §E59; the second read `second-reads/e71ef3ad.md` §3, which named the three cuts). Nothing committed, staged, stashed, reset or checked out; the orchestrator commits the named files. Builds ran on 2026-09-30 and 2026-10-01.

**Product layer, first.** What a learner meets was read three ways, before and after, on the same builds: through the app's own unzip and tempo reader (`tempoEvents`) on every built file; on the learner's Score screen, four moved rows opened at a phone's size with the old file and with the new; and through every catalogue field. Nothing was heard: no one in this process can hear. Nothing heard changes either: the one sounding statement, `<sound tempo="96" />`, is byte for byte the same in every moved file.

## Judgement

- **Nothing a learner sees or hears changed, for every family this lane touches** (observed, not inferred):
  - **Heard and counted: the app's tempo reader.** Every built row with a file (2,013), the build before the fix against the final build: **0 rows whose tempo events differ** in position, bpm or source; **238 rows lose the printed mark the reader saw** at their opening (quarter = 96 beside the sound), and they are exactly the 238 moved files (`build-diff-final.txt`; per row in `content-items.txt`). Every moved row plays `0:0 96 from sound` before and after. The count-in, the cursor's tempo, the timing windows and the bar's bpm readout follow the reader's bpm, which did not move.
  - **Seen: the Score screen.** A single-staff and a grand-staff PDMX row, a kern row (Chopin's Ballade no. 2) and a MuseTrainer row (*Für Elise*, easy), opened on `#/score/<id>` at 390 × 844, served once with the new files and once with the four old files put back: **every SVG element identical in kind and box** (2,008, 2,027, 6,999 and 1,847 elements) and the bar's tempo readout the same ("67 bpm", 70 % of 96) (`screen-compare.txt`; one pair of screenshots looked at, *Lavender's Blue*, before and after: the same picture, no tempo mark on either). Read in the code: every learner-facing engraver of catalogue material passes `drawMetronomeMarks: false` (`ScoreScreen.ts`, Drill's three hosts, the device preview), so the printed mark was never drawn and there is nothing to draw now; the empty `<words />` becomes, in OSMD 2.1.2's reader, a tempo expression with an empty label beside the sound — the comparison above is what shows it draws nothing and moves nothing.
  - **The catalogue's truth.** No row's `tempoBpm`, `tempo-defaulted` tag, `provenance.facts.tempo`, level, feature, demand or tag moved (`build-diff-final.txt`: outside what moves with the bytes, only `provenance.formerIdentities` on the 238, the three cuts' `stale` block, and Mutopia's `normaliser.version`, which moves with any converter edit). So the learner-visible summary line ("70 % of the suggested tempo" on a tagged row) and the run header's `baseTempo.source` read exactly as before.
  - **A learner's stored runs.** Every relation says `tempoChanged: false`, so the build lists no old identity as `tempoRepairedFrom`: a stored run of an old file stays comparable to the piece's tempo, as it is (it was measured against the same 96). Marked the other way, every such run would be refused a tempo standard (mutant (d) shows the lineage test go red).
  - *Unverified as music* in the usual sense does not apply — no sound changes — but nothing here has been heard.
- **The identity move, per family, done and re-proved** (`repaired-identities.txt`, `verify-moved.txt`, the final build):
  - **PDMX, 169**: the committed dated file at the base (E50a's recorded entry, re-proved) → the transformed file, one relation each; the row's `convertedSha256` moved with it, nothing else in the row.
  - **kern, 60, and MuseTrainer, 6** (files the build converts): two relations each, E57's shape — the dated file E50a recorded and the undated file every catalogue since E50a served.
  - **Cuts, 3** (`excerpt.classical.bach-menuet-bwv-anh-113.pdmx.b25-32`, `…i-got-rythm.pdmx.b15-18`, `…mendelssohn-hark-the-herald-angels-sing-piano-bass-jazz-lead-sheet.pdmx.b25-28`): E50b's cut relation, the old cut rebuilt from the moved parent through its E59 repair and cut again, which is the cut the laptop served (the main checkout's built cuts, read in place: the same three sha256s).
  - **238 identities; 301 repair relations and 3 cut relations**, spliced into `tools/content/repaired_identities.json` by `scripts-repaired-identities.py`, never by hand (now 407 repairs and 4 cuts). Each is re-proved three times: by the generator as it writes it, by `scripts-verify-moved.py` against the inventory, and by the final build, whose 238 moved rows carry their old identities in `provenance.formerIdentities` and none in `tempoRepairedFrom`. A rerun adds nothing (`repaired-identities-rerun.txt`).
- **The inventory, domain-complete for the branch** (every current caller of `cached_convert`/`convert_file`/`normalise`, re-checked at this HEAD):

  | caller | the brief's prediction | counted here | how |
  |---|---|---|---|
  | PDMX (`pdmx/quarry.py:448`) | 169 | **169** | all 542 raw uploads streamed from the archive in place (542 of 542 `rawSha256` equal), each converted by the committed converter and by E59's: the branch (`added_tempo`, no override) = the `tempoDefaulted` tag = the changed rows = 169, 0 failing; E59's output is the committed converter's through the transform, byte for byte, on all 169 (`pdmx-count.txt`) |
  | kern (`import_kern.py:683`) | 60 (X40) | **60** | rebuilt: 60 of 162 built files changed, exactly X40's 60 ids |
  | MuseTrainer (`import_musetrainer.py:299`) | 6 (X40) | **6** | rebuilt: 6 of 64 changed, exactly X40's 6 |
  | Mutopia (`import_mutopia.py:528`) | not yet counted | **0** | rebuilt: its one row (*Pine Apple Rag*) byte-identical, so its conversion does not reach the `else:` (it has a tempo mark of its own, as the second read's converter-cache count found: `added_tempo` false) |
  | authored (`author.py:199`, `:240`) | 0 of 39 | **0 of 39** | rebuilt: none changed |
  | excerpt cuts (`excerpts.py:411`) | the 3 of moved parents | **3 of 5** | rebuilt: the three cuts of moved PDMX parents changed, no other; a cut never takes the branch itself (it carries its parent's mark), and the sound-only mark survives the second pass (`TestADefaultedTempoIsPlaybackOnly`) |
  | generated (`generate_exercises.py`) | — | **0 of 1,200** | never reaches `normalise` |

  No caller outside these reaches the branch for a shipped row: `convert.py`'s own command line and `bisect_render.py` ship nothing. Mutopia's count, open in the brief, is closed here.

## Content

Every moved file is itemised under §12, one line each, generated from the two builds, the app's reader and the relations by `scripts-content-items.py`, never by hand: **`docs/prompts/runs/E59/content-section.md`** (238 lines: 169 PDMX, 60 kern, 6 MuseTrainer, 3 cuts) and, in full (each file's tempo direction before and after, the reader's events, the catalogue's tempo truth, the identities), **`content-items.txt`**. The same item for every one of the 238:

- **Where:** a PDMX row's `content/scores/pdmx/<cid>.mxl` and its `content/sources/pdmx.json` `convertedSha256`; a kern or MuseTrainer row's built file (its catalogue `provenance.edition` and `source.checksum` carry the checksum); a cut's built file.
- **Before:** the opening direction prints `<metronome parentheses="no">` quarter = 96 beside `<sound tempo="96" />` (with `<staff>1</staff>` on a grand staff: 95 PDMX rows, all 66 kern and MuseTrainer rows, two cuts).
- **After:** the same direction with `<words />` where the four metronome lines stood; the `<staff>` and the `<sound tempo="96" />` as they were; nothing else in the file (`build-diff.txt`: every changed file's text is the old one through the transform; a PDMX file also loses the date music21 wrote, as every file the converter writes has since E50a).
- **Unchanged, by name:** the app's tempo events, the catalogue's `tempoBpm`, the `tempo-defaulted` tag and `provenance.facts.tempo` (PDMX: inferred, "convert.py's default (the upload has no tempo of its own)"; kern: inferred, from `tempoBpm` none; MuseTrainer: "authored, the edition", X40's Follow-up 5, untouched).
- **Identity:** old → new under the reviewed-repair relation, `tempoChanged: false`.
- **Why:** the edition states no tempo; a converter default is playback truth, not a printed fact.

Also changed, not content a learner reads: `app/tests/e2e/fixtures/excerpt-candidates.json`, the excerpt view's spec input, records the Minuet's parent sha256 twice (`parent.sha256`, `parent.source.checksum`); a fresh proposer run on the final build differs from its first candidate in those two values only, which were spliced (`fixture.txt`).

## The mechanism, the discriminating test, the red line

**The fault** (`convert.py`, `normalise`'s last `else:`, the base's :1622–1626): with no override, no `MetronomeMark` and no tempo printed as text, it called `insert_tempo(staves[0], float(DEFAULT_TEMPO_BPM))`, and `insert_tempo` builds `tempo.MetronomeMark(number=bpm)`, which music21 10.5 exports as a printed `<metronome>` and a `<sound tempo>`.

**The fix** (the same branch, nothing else in `normalise`, `insert_tempo` or E57's `elif existing_tempo:`): `insert_tempo(staves[0], tempo.MetronomeMark(numberSounding=DEFAULT_TEMPO_BPM))`. music21 writes a mark with only `numberSounding` as `<direction><direction-type><words /></direction-type><sound tempo="96" /></direction>` (probed: `number=` gives the printed mark; `numberSounding` as keyword or attribute gives the sound alone). `effective`, `added_tempo` and the warning are unchanged, so `tempo_bpm`, PDMX's `tempoDefaulted` and every reader of them are too.

**The discriminating evidence.** The alternative the brief's hypothesis named — that the move needs the raw archive, or changes what a learner meets — is refuted by measurement: the 162 committed PDMX files that reproduce from their uploads come out, through the text transform, byte-identical to E59's converter output (`pdmx-count.txt`); the other 7 (older converters' output, committed once: *Minuet K. 2 (easy)*, *I Remember You*, *Mandinga*, *Resonance*, *I Got Rhythm*, *Royal Garden Blues*, *Riverside Blues*) carry the same inserted direction (`pdmx-shapes.txt`) and get the same transform; and the reader, the screen and the catalogue are unchanged (the judgement). The red lines, on the committed converter (`red-committed.txt`): the three new cases `1 != 0` (one `<metronome>` where none is wanted); `test_missing_tempo_gets_the_default` `1 != 0`; the four `assert_today` callers `('quarter', False, '96') is not None`.

## Tests

| test | class | old assumption | result |
|---|---|---|---|
| `test_convert.TestADefaultedTempoIsPlaybackOnly` (3: single staff, grand staff, converted again) | add | — | 3 red on the committed converter; green |
| `test_convert.TestLilyPond.test_missing_tempo_gets_the_default` | revise (strengthened) | a defaulted file may print a mark | red; green |
| `test_convert.TestTheTempoPrintedAsText.assert_today` (its four `test_d_…` callers) | revise | the default prints quarter = 96 | 4 red; green |
| `test_convert.TestTempoMarks`, `TestALaterTempoMarkSurvives`, `test_d_a_file_with_a_metronome_of_its_own…` | preserve | — | green before and after (E57's branch untouched) |
| `test_convert_cache.…test_the_committed_relations_re_prove_on_the_committed_scores` | revise | the table holds E50's and E57's relations, every one `tempoChanged` | the base's version red on E59's table (`red-old-tests.txt`); revised green: E59's set, `tempoChanged` false, its one restore hunk's shape, its PDMX rows exactly the tagged ones |
| `test_measured_truth.…test_a_repaired_file_carries_its_old_identity…` | revise | every relation's old identity is `tempoRepairedFrom`; Wabash's is the only cut | the base's version red on the final build; revised green |
| `test_excerpts.TheRepairedCut.test_a_one_relation_for_the_one_cut_the_build_produced` | revise | the table's `cuts` is Wabash's alone | red in the first whole content run and the base's version red (`red-old-tests.txt`); revised green |
| `test_excerpts.TheE59Cuts` (2) | add | — | green: each cut's old bytes rebuilt from the committed files alone |
| `test_excerpt_proposer.…test_a_fresh_run_gives_the_fixtures_candidate` | preserve (its fixture revised) | — | red in the first whole content run ("the parent's built file changed: rewrite the fixture"); green with the spliced fixture |
| `repairedTempoLineage.test.ts` "E57: every other relation…" and "E50b: … every relation says the tempo changed" | revise (scoped to E50's, E50b's, E57's) | no third class of relation | the base's version: these two red on E59's table; revised green |
| `repairedTempoLineage.test.ts` "E59: every other relation is E59's…", "E59: a run of a moved defaulted file is the same piece and keeps its tempo…" | add | — | green; red under mutant (d) |
| `tempoSoundAgainstMark.test.ts` (X40's pinned list) | preserve | — | green on the before build and on the final build: the pinned list is unchanged |

## Mutants

`mutants.txt` (`scripts-mutants.py`; each on a copy, the control green): **(a)** the default branch reverted to `float(DEFAULT_TEMPO_BPM)` — 8 unit cases red (the three new, the strengthened, the four `assert_today` callers) and the two raw uploads (one of each shape) come out as the committed converter's output again; **(b)** the transform with the `<staff>` shape dropped (95 rows left as committed) — the data layer reports "pdmx: moved 74, the inventory 169" and 98 faults, on the full count; **(c)** the relations of one kern row and one MuseTrainer row left out — exactly those two rows' old identities fail to re-prove; **(d)** E59's relations marked `tempoChanged: true` — the lineage test's two E59 cases and the committed-relations case go red, and the table's bytes come back. 4 of 4 caught.

## Counts and exit codes

| step | exit | note |
|---|---|---|
| content build, before (committed converter, `--out`) | 0 | `build-before.txt` |
| content build, after1 (E59's converter, PDMX untransformed, `--out`) | 0 | kern 60, MuseTrainer 6 moved (`build-diff-first.txt`) |
| content build, after (E59's converter, PDMX transformed, `--out`) | 0 | + PDMX 169, cuts 3 (`build-diff.txt`) |
| content build, final (relations in, into `app/public/content`) | 0 | `build-final.txt`, `build-diff-final.txt` |
| PDMX raw extraction / count | 0 / 0 | `pdmx-raw.txt`, `pdmx-count.txt` |
| PDMX transform / rerun | 0 / 0 | `pdmx-transform.txt`, `pdmx-transform-rerun.txt` |
| relations / rerun | 0 / 0 | `repaired-identities.txt`, `repaired-identities-rerun.txt` |
| data layer (`scripts-verify-moved.py`) | 0 | `verify-moved.txt` |
| validate | 0 | 17 warnings, the three cuts now also stale by provenance (already stale by cut version at the base) |
| review check | 0 | 4 current, 0 stale |
| record mirrors `--check` | 0 | fresh (run before this entry existed) |
| whole content suite, first run | 1 | 1,662 run, 2 failing: the proposer fixture and `TheRepairedCut` (both revised above; read from that run's log, which the second run's replaced) |
| whole content suite, after the revisions | 1 | 1,664 run, 0 failing, 2 errors, both `test_record_mirrors` (`content-suite.txt`): "E59's record ends at approved, and Entry 184 … shows it landed" — the record's own transient, red while this entry exists and the brief's `## Record` block has no landing event, which the orchestrator's record script appends (E57's landing saw the same pair) |
| `npx tsc -b --noEmit` | 0 | |
| `npm run lint` | 0 | |
| `npx vitest run` (whole, on the rebuilt content) | 1 | 3 of 7,567 failing, the recorded ones: `lessonClaimsAboutApp`'s CRLF pair (*blues.3 … Rhythm only*, *4.7: blind …*) and `midiParity`'s missing reference, which CI writes before the unit step |
| `npm run build:app` | 0 | |
| e2e: `excerpts.spec.ts`, `library.spec.ts` (port 4659, four workers) | 0 | 22 passed (4 + 18), both files present |
| the Score-screen comparison (ports 4659 and 4660) | 0 | `screen-compare.txt` |
| X40's check, before / final | 0 / 0 | `x40-before.txt`, `x40-final.txt` |
| mutants | 0 | 4 of 4 caught |
| the base's revised tests on the new tree | red, as intended | `red-old-tests.txt` |

## Deviations, with reasons

- **`tempoChanged: false` on every E59 relation**, where E50's and E57's say true and the brief says to follow E50's precedent "exactly". The field means the repair changed the tempo a run of the old file was measured against (`types.ts`, `material.tempoNotComparable`); E59 changes no tempo (0 rows whose reader events differ). True would refuse every stored run of these 238 rows a tempo standard. Entailed by the field's definition and the reader measurement; mutant (d) pins it. Question 2.
- **kern and MuseTrainer relations use E57's two-relation shape** (the dated file E50a recorded and the undated served file), where the brief's item 7 says "the same shape as PDMX's". A file the build converts has been served undated since E50a, which one dated relation cannot name; the reviewer kept E57's undated clause (`responses/ca8508ed.md` §2). Question 3.
- **Tests and a fixture revised beyond the brief's list** (`test_convert_cache.py`, `test_measured_truth.py`, `test_excerpts.py`, `repairedTempoLineage.test.ts`, `app/tests/e2e/fixtures/excerpt-candidates.json`): each encoded "only E50's and E57's relations", "Wabash's is the only cut" or the Minuet's old sha256. No `app/src` file changed.
- **`content/sources/pdmx.json` and `content/scores/pdmx/` changed although E57a owns them while it builds**: by the brief's own mechanism only — 169 files and their `convertedSha256`, by script, spliced as text (the round trip compared first), none of E57a's three rows among them (`pdmx-shapes.txt`: 0 overlap). `repaired_identities.json` gains E59's lines at the same places E57a's generator splices (the end of `repairs`, the comment): a textual conflict at the merge is expected; `scripts-repaired-identities.py --replay <this lane's copy of the file>` re-splices E59's relations into the merged file, idempotently, re-proving each PDMX one first.
- **The PDMX archive read** although the brief says the byte move needs none: it still does not — the files moved from their committed bytes — but item 1 asks for PDMX's count by re-running the quarry's conversion at this HEAD, and the raw conversions also prove the transform is the converter's own change. Read in place through `extract.extract_from_tar`, into `build/e59/` (deleted); never copied or unpacked.
- **A look at the Score screen** the brief did not ask for (it said no Playwright; the map named two specs, which ran): a run-artifact spec comparing four rows' drawn SVG with the old and new files, kept as `scripts-screen.e59.spec.ts`; not a suite spec.

## Not done

- **Nothing heard.** No one in this process can hear; nothing heard changes.
- **The Score-screen comparison covers four rows**, one per family and shape, not all 238; the other 234 rest on the reader, the code read of `drawMetronomeMarks: false` and their identical inserted direction.
- **The strict build flavour** (`--no-personal`) was not built; the personal flavour was, as E57's.
- **`docs/08-test-map.md` and `docs/03-content-pipeline.md` not edited**; their rows are proposed under *Doc rows*, as E57's were.
- **`midiParity`'s reference** not written (its own tool; CI writes it); the CRLF pair is Entry 101's diagnosis.

## Questions for the reviewer

1. **The summary line** (the brief's question): "70 % of the suggested tempo" reads the `tempo-defaulted` tag, which E59 keeps; the file itself no longer prints any number. Is "of the suggested tempo" settled product text, or open now?
2. **`tempoChanged: false`** for E59's relations (above): a run of an old file stays comparable, because the tempo it was measured against is the one the piece plays. Confirm.
3. **kern and MuseTrainer: two relations each** (E57's shape) rather than one as for PDMX (above). Confirm.
4. **The cuts' continuity is under the laptop's creating system (0) only**, E50b's precedent: the deployed catalogue is built on Linux, whose cutter stamps system 3 (E55), so a run stored on the phone against an old cut names an identity no relation relates. Record each cut under both systems here, or leave it to E55?

## Follow-ups (recorded, not built)

- **The 66 kern and MuseTrainer rows say "of written".** Their importers record no `added_tempo`, so they carry no `tempo-defaulted` tag; the Score screen's summary reads "70 % of written" and the run header stores `baseTempo.source: 'written'` for a tempo the converter supplied (kern's `facts.tempo` says inferred, MuseTrainer's says authored: X40's Follow-up 5). Unchanged by E59, a P2 tag-truth gap; attaches to X40's Follow-up 5.
- **E58 (the relation generators' order):** E59's generator splices and never rewrites; E50's still rewrites the file whole and would drop E57's and E59's relations. The file's comment now says the order (E50's, E50b's, E57's, E59's).
- **`repaired_identities.json` is 1,178,665 bytes** (886,445 at the base); E59's 301 relations are one short hunk each. An observation for the checkpoint, as E57's.
- **The three cuts' approvals are stale by provenance** as well as by cut version (validator warnings; a person re-decides each), as Wabash's has been since E50b.
- **An observation, not E59's:** *Lavender's Blue*'s first window at 390 × 844 shows two bars with about half the score area empty below them, with the old file and the new alike. For the window cluster (U113's Bars-count question) to classify at its checkpoint; nothing here measured why.

## Files

- **Code:** `tools/content/convert.py` (the `else:` branch of `normalise`).
- **Data:** 169 files under `content/scores/pdmx/` (the list in `pdmx-transform.txt`); `content/sources/pdmx.json` (169 rows' `convertedSha256`, spliced as text); `tools/content/repaired_identities.json` (301 repair relations, 3 cut relations and one comment sentence, spliced by the generator).
- **Tests:** `tools/content/tests/test_convert.py`, `test_convert_cache.py`, `test_measured_truth.py`, `test_excerpts.py`; `app/tests/unit/repairedTempoLineage.test.ts`; `app/tests/e2e/fixtures/excerpt-candidates.json`.
- **Run folder** `docs/prompts/runs/E59/`: this entry; the scripts (`scripts-setup.ps1`, `scripts-run-build.ps1`, `scripts-pdmx-raw.py`, `scripts-pdmx-count.py`, `scripts-pdmx-transform.py`, `scripts-build-diff.py`, `scripts-reader.table.ts` with `scripts-vitest.reader.config.mts`, `scripts-repaired-identities.py`, `scripts-verify-moved.py`, `scripts-content-items.py`, `scripts-fixture.py`, `scripts-tests-with.py`, `scripts-mutants.py`, `scripts-red-old-tests.py`, `scripts-probe-mark.py`, `scripts-chain.ps1`, `scripts-collect-logs.py`, `scripts-cleanup.ps1`, the kept Playwright copies `scripts-playwright.e59.config.ts`, `scripts-playwright.screen.config.ts`, `scripts-screen.e59.spec.ts`) and their outputs; no kept log over 300 KB (the content suite's trimmed to its summary and failing names); machine paths replaced. `SOURCES.md`, `inventory.md`, `rung-claims.md` and `ladder.md` restored from their snapshots after the builds.
- **Not touched:** `app/src/**`, every importer, `insert_tempo`, `tempo_printed_as_text`, E57's `elif existing_tempo:`, `excerpts.py`, `author.py`, `former_identities.json`, `excerpts.json`, the generators and `family_contracts.*`, every lesson, E57a's three rows.

## Doc rows

- `docs/08-test-map.md`, the `test_convert.py` line: append "Since E59 (`TestADefaultedTempoIsPlaybackOnly`), a source with no tempo gets the default as a sound alone — `<sound tempo="96">` beside empty `<words />`, no `<metronome>` — on one staff and on a grand staff, and keeps it sound-only when converted again; the default case and `assert_today` assert no printed mark."
- `docs/08-test-map.md`, the `test_convert_cache.py` line: append "Since E59, the committed relations are E50's, E57's and E59's; E59's say `tempoChanged` false, each one hunk putting the printed quarter = 96 back where the empty words stand, its PDMX rows exactly those tagged `tempoDefaulted`."
- `docs/08-test-map.md`, the `test_measured_truth.py` line: "only a relation marked `tempoChanged` lists its old identity in `tempoRepairedFrom` (E59's do not); the cuts are Wabash's and E59's three."
- `docs/08-test-map.md`, the `test_excerpts.py` line: "`TheE59Cuts`: each approved cut of a PDMX parent E59 moved, its old cut rebuilt from the committed files through the parent's E59 repair."
- `docs/08-test-map.md`, the `repairedTempoLineage.test.ts` line: "E59's relations a third class, none tempo-changed; a run of a moved defaulted file meets the full-tempo standard as before."
- `docs/03-content-pipeline.md` §4a, after *The build's tempo printed as text*: "**A defaulted tempo is playback only** (E59): where a score states no tempo (no mark, no override, none printed as text), `normalise` inserts `DEFAULT_TEMPO_BPM` as music21's `numberSounding` — a `<sound tempo="96">` beside empty `<words />`, no `<metronome>` — so no file prints a quarter = 96 its edition never states; `added_tempo`, PDMX's `tempoDefaulted` and the `tempo-defaulted` tag unchanged. 238 identities moved (169 PDMX, 60 kern, 6 MuseTrainer, 3 cuts), each a reviewed repair with `tempoChanged: false`." And in the paragraph naming the repair relation, for "Every relation says `tempoChanged`": "Every E50, E50b and E57 relation says `tempoChanged`; E59's say it did not change, and the build lists only the first as `provenance.tempoRepairedFrom`."
