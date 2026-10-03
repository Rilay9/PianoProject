### Entry 163 — E50 — the seven bundled PDMX scores that print "= N" play at that tempo: the content converter reads an opening metronome mark printed only as text (E32's rule, the metre's beat where the note glyph is missing) before it inserts its default, the seven are re-converted and respliced, the Wabash approval is stale by provenance, and each repaired file carries its old identity for learner continuity only

**Base.** `df275e8f` (origin's head with E50a merged at Entry 166). Nothing committed, staged or stashed; the orchestrator commits the named files. Builds ran on 2026-09-30. Every pointer below was re-read at this base (`convert.py`'s lines moved with E50a: `insert_tempo` :1333, the tempo branch :1545–1575, `former_identities` :2008).

**Product layer, first.** I did not open the Score screen or hear anything. What a learner meets was read through the app's own tempo reader on the built files (`opening-tempo-app.jsonl`) and from each built file's first bar (`classify.txt` §5). Whether each printed tempo suits the piece for a learner is **unverified as music**.

## Judgement

- **Per file: the words over bar 1 and the tempo, before → after** (`classify.txt` §5, `opening-tempo-app.jsonl`; the number is the edition's as printed, the note inferred as a quarter from 4/4, unverified as music):

  | row | words over bar 1 | `<metronome>` / `<sound tempo>` | `tempoBpm` | `tempoDefaulted` | app's opening tempo |
  |---|---|---|---|---|---|
  | Margie | `= 160` → none | quarter 96 / 96 → quarter 160 / 160 | 96.0 → 160.0 | true → false | 96 → 160 |
  | Limehouse Blues | `= 184` → none | 96 → 184 | 96.0 → 184.0 | true → false | 96 → 184 |
  | Singin' the Blues | `= 120` → none | 96 → 120 | 96.0 → 120.0 | true → false | 96 → 120 |
  | Weary Blues | `= 200` → none | 96 → 200 | 96.0 → 200.0 | true → false | 96 → 200 |
  | Storyville Blues | `= 132` → none | 96 → 132 | 96.0 → 132.0 | true → false | 96 → 132 |
  | Wabash Blues | `= 120` → none | 96 → 120 | 96.0 → 120.0 | true → false | 96 → 120 |
  | Tishomingo Blues | `= 132` → none | 96 → 132 | 96.0 → 132.0 | true → false | 96 → 132 |
  | Wabash cut b1–4 | `= 120` → none | 96 → 120 | 96.0 → 120.0 | tag gone | 96 → 120 |

- **Per row, the level three ways and the band** (`splice.txt`, `level-diff.txt`). Stored / committed code on the committed file / committed code on the new file: Margie 2.67 / 2.67 / 2.80, jazz.4 [2.67, 4.5] in; Limehouse 3.25 / 2.98 / 3.15, jazz.5 [2.97, 5.2] and jazz.6 [2.92, 6.4] in (the stored 3.25 was the older model's, X37's second definition: the committed model alone gives 2.98 at 96, and the printed tempo raises it to 3.15); Singin' 3.58 / 3.58 / 3.65, no rung; Weary 3.09 / 3.09 / 3.32, jam.7 [3.09, 6.4] in; Storyville 4.01 / 4.01 / 4.10, jam.7 in; Wabash 3.48 / 3.48 / 3.54, blues.3 [2.4, 4.5] in; Tishomingo 3.76 / 3.76 / 3.86, blues.3 in; the cut 1.62 → 1.69 (measured on the cut). No band is left; no placement review is owed; `level-model.json` untouched.
- **The Wabash approval:** stale by provenance, as it should be — `provenance.excerpt.stale.approvedParentSha256` is the old file `60f8d018…`, `parentSha256` the new `b896827d…`; it was already stale by cut version. The validator names both. Nothing in `excerpts.json` was renewed, merged or edited; renewal is a person's, through E51's path.
- **The built-file diff by class, E50a's three outcomes** (`classify.txt`): 2,013 built score files, **music changed 8** (the seven parents and the Wabash cut, exactly), **byte-identical 2,005**. Catalogue rows: by E50a's date proof alone **unchanged 2,084, resolved 0, unresolved 8** (as the amendment expects); with the reviewed repair relation **unchanged 2,084, resolved 7, unresolved 1** (the cut). Outside the eight nothing moved but `provenance.converter.version` (808 rows) and the Mutopia row's `converter.normaliser.version` (both the tool fingerprint, which moved with `convert.py`); no row outside the seven changed `formerIdentities`.
- **What the seven repaired rows' `formerIdentities` carry:** exactly one each, the old committed file's identity (Margie `d14cbac2…`, Limehouse `b1b5da84…`, Singin' `fc4e8b90…`, Weary `cee0d8d2…`, Storyville `d31d167e…`, Wabash `60f8d018…`, Tishomingo `afa63559…`). **No alias names a dated file that never existed:** each is E50a's recorded entry for that file, re-proved as E50a's generator proves one (`dated_form` of the committed file at `df275e8f` equals the entry, and the laptop's served `app/dist/content` file is the same bytes), and each old identity is no row's current identity (`repaired-identities.txt`, `classify.txt` §4). They never enter `pdmx.json`; D2's four decisions are on generator identities and bound to the after identities; `review.py --check`: 4 current, 0 stale.

## The mechanism, the discriminating test, the red line

music21 10.5.0 hands the converter the printed `= N` as a `TextExpression` (content `= 120`, bar 1, offset 0, the first note also at 0) and no `TempoIndication` (`what-music21-gives.txt`; no raw file has a `<metronome>`, `<sound tempo>`, `<symbol>` or private-use character), so `normalise`'s default branch inserted 96. Item 11's refutations did not happen: case (a) was red on the committed converter and the capture shows no `TempoIndication`. The red line, (a) on the committed converter: `AssertionError: Tuples differ: (96.0, True) != (120.0, False)` (`red-unit-base.txt`). The fix acts at that branch: `convert.tempo_printed_as_text` reads the mark before the default is inserted.

## The parity table (the door, `importMeasuredTruth.test.ts`, against the converter, `test_convert.TestTheTempoPrintedAsText`)

| shape | door | converter |
|---|---|---|
| `= 120` boxed MuseJazz, 4/4, no glyph | 120 (:217–225) | 120, quarter, words removed (a) |
| U+ECA5 `= 132` | 132 (:229–232) | 132 (b) |
| U+ECA7 `= 120` | sound 60 (:233–234) | eighth 120, sound 60 (b) |
| U+ECA5 U+ECB7 `= 80` | 120 (:235–236) | dotted quarter 80, sound 120 (b) |
| `= 60` in 2/2 | 120 (:237–238) | half 60, sound 120 (b) |
| a `<metronome>` of its own beside `= 120` | the file's (:243–247) | the file's, words kept (d) |
| `= 120` in 6/8; `Allegro`; `bars 1 = 12` | not read (:249–251) | not read, the default and words kept (d) |
| after a bar of rests | read | read (c) |
| after a note has sounded | **read** (the door reads every mark, a sound beside each) | **not read**, named in the warnings (d) |

Two further differences, named and not closed: the door takes the metre from the file's first `<time>`, the converter from the signature in force at the mark (the same signature for an opening mark unless the metre changes inside bars of rests); the door writes a `<sound>` beside every mark it reads, the converter writes one mark, the opening's. Whitespace is JavaScript's `\s` exactly (`JS_WHITESPACE`); rounding is the door's (half up, to a thousandth). One shared definition is the later ingestion seam.

## The old identities and the repaired files (the reviewer's condition)

- **The relation.** `tools/content/repaired_identities.json` (generated by `scripts-repaired-identities.py`, never by hand) holds seven relations `{id, file, change, from, date, system, to, restore}`: `from` is E50a's recorded entry, `to` the repaired file (`pdmx.json`'s `convertedSha256`), `restore` the three line hunks that turn the repaired score's text back into the old one (the tempo lines only, 447–600 bytes each). `convert.former_identities` re-proves each on every build — the repaired file with the restore lines put back, then the old date, zipped under the old creating system, must give `from`'s bytes, and `from` must be E50a's entry for that file — and the build records it in `provenance.formerIdentities` beside E50a's. The app reads it through E50a's relation unchanged (`material.learnerMaterial`): no app source changed.
- **Why a separate file.** E50a's generator rewrites `former_identities.json` whole (`write_table` keeps its five fields per entry), so a section added there would be lost on the next `--add`; and a repair is not a dated form of the repaired file, the table's one meaning.
- **The boundary, tested** (`repairedTempoLineage.test.ts`): a run, a hearing and a project against the old file are the repaired piece's (contact `met`, played; familiarity `heard`; the project found), and none of it without the relation; the standard a run meets (`meetsStandard`: Keep tempo at `passTempoPct` of the run's own base) gives the same answer for every old run with the relation loaded and without it; a rung counts no old run played under another id, though contact says `met`; every rung reading over the old runs is identical with and without; the old run is never rewritten, its `baseTempo` stays `{bpm: 96, source: 'defaulted'}`. **The alias does not let old evidence satisfy a tempo-dependent standard**, so the relation was not narrowed. The grep behind it: the relation's consumers (`sameMaterial`, `learnerMaterialKey(s)`) are contact, encounters/familiarity, projects, `progressStore`'s key lookup and `transfer.referenceFacts`'s key; no tempo-dependent standard reads any of them (`meetsStandard` and the rung pool read the run's stored numbers by item id; mastery is decided at record time from the live run).
- **What a learner who played the old file keeps:** their contact, familiarity and project with the piece; their old runs, as stored, at 100 % of the defaulted 96 where they played it so. One thing the relation does not cause but the learner meets: an old run stored under the same item id still counts toward that item's rung by id, at its recorded percentage of its own base (96), as it did before E50. Unchanged by E50, not the alias's; a question below.

## Done

1. **The ruling** — built as quoted: the converter changed, identities re-measured, the stale approval handled explicitly.
2. **Premises** — re-checked at this base: the seven are the only committed PDMX files printing a readable text mark without a tempo of their own (`other-text-marks.txt`, 542 scanned, after the change only the two with their own tempo remain); raw uploads streamed read-only, all seven `rawSha256` equal (`raw.txt`); every pointer re-read.
3. **The converter change** — `tools/content/convert.py`: `TEXT_TEMPO_MARK`, `JS_WHITESPACE`, `METRONOME_GLYPHS`, `NOTE_QUARTERS`, `_signature_at`, `tempo_printed_as_text`, and one `elif` in `normalise`'s tempo branch before the default; `insert_tempo` takes a mark as well as a number (the default path byte-identical: 2,005 files unchanged). A direction music21 gave to each staff of its part is one mark (read or left together) — found by case (a) itself.
4. **Red first, unit** — `TestTheTempoPrintedAsText`, 13 cases: (a), (b)×4, (c) and the later-mark warning red on the committed converter; (d)×5 and (e) green before and after by design, with `TestTempoMarks`, the forced-tempo and default-tempo cases (`red-unit-base.txt`). U+ECA5 survives from `<words>` into `TextExpression.content` (`what-music21-gives.txt`). Mutants M1–M3 killed.
5. **The seven re-converted** (`reconvert.txt`): (ii) the committed converter's output equals the committed XML with the date removed by `convert.without_encoding_date` on six byte for byte, on Weary Blues but for Entry 34's one line; (iii) the changed converter, Weary's repair re-applied (`weary-repair.txt`: ba9adb6f removed the backward repeat on ending 2's closing barline, bar 25) and re-zipped through `normalise_archive`; (iv) each new file differs from the committed XML with its date removed in nine lines, all of the tempo direction(s); bars, notes, hands and singleLine unchanged; (v) round trip, structure and truncation gates pass; copied over `content/scores/pdmx/`. Weary's `repeat-structure` check reads the same before and after (`weary-check.txt`).
6. **The rows respliced as text** (`splice.txt`): seven fields per row, nothing else; the round trip compared first; parsed before/after comparison clean, `review` byte-identical. `levelFrom: model-2026-09-22` on all seven: the label Entry 53 (23b1f3d7) gave rows measured under the committed model; Limehouse's `model` was the older model's.
7. **Levels three ways** — above; builds before and after with absolute `--out`, `level-diff.txt`; no band left.
8. **Identities and approvals** — above; counted, not assumed.
9. **Consumers** — the tempo fact `authored, via the upload` (the cut's `the parent's: the upload`), the untrusted lists cleared (Limehouse had none); the Score screen reads the tag at `ScoreScreen.ts:3323` (base tempo `written`) and `:3887` (*of written*); the chord chart takes `tempoBpm` clamped to 40–240 (`ChordChartScreen.ts:530–537`; all seven inside); the lesson-claim tests ran on the after build (the known CRLF pair only); `test_measured_truth`'s inferred-tempo test holds (232 rows keep the tag). `content/lessons/*.md` searched for the seven titles: blues.3, jam.7, jazz.4, jazz.5, jazz.6 name them for form, length, key and changes; none states a tempo or pace.
10. **Not E50's** — respected, but for the deviations below.
11. **The hypothesis** — held (above).

## Not done

- **The Score screen was not opened and nothing was heard.** The product reading is the app's tempo reader and the XML. *Unverified as music.*
- **Red for the two revised consumer tests** (`test_excerpts`'s Wabash case, `test_measured_truth`'s stale assertion) was not run separately: they encode the committed file's words and the "no approval is ever stale" model, which the first whole content-suite run showed failing on the new tree (`content-suite-first.txt`).

## Deviations, with reasons

- **An app test file added** (`app/tests/unit/repairedTempoLineage.test.ts`) though `app/**` was not the brief's: the reviewer's condition requires a test of the boundary. No app source changed.
- **`tools/content/repaired_identities.json` and its reading in `convert.former_identities`** — the reviewer's "explicitly add the seven old identities", re-proved every build; the reason for a separate file is above.
- **`docs/generated/ladder.md` and `docs/prompts/inventory.md` committed, not restored**: the validator and `TestTheReports` hold them to the catalogue (`restore.txt`).
- **Two tests revised**: `test_excerpts.TheEditionTexts` (the Wabash cut now prints no words: old assumption, the parent prints `= 120`), `test_measured_truth.TestExcerptsOnTheBuild` (`stale` exactly where the approval was made on other bytes: old assumption, no approved row is ever stale). One extended: `TestTheMaterialIdentity`'s former-identity oracle adds the repairs. `content/catalog.schema.json`'s `formerIdentities` description extended.
- **E50a's three outcomes counted twice** (date proof alone: 8 unresolved as expected; with the relation: 7 resolved, the cut unresolved), since the relation the reviewer asked for resolves the seven.
- **Mutants: six, not three**: M4 and M5 on the relation's proof, M6 on the boundary.
- **The browser spec ran on port 5273 at two workers** (the orchestrator's port), not 4631.

## Follow-ups (recorded, not built)

- **The tempo fact's inferred beat.** The build's fact says `authored, via the upload`; the door's says the glyph was missing and the metre's beat read. Whether the PDMX fact should say it touches `build.py`.
- **The `elif` branch** (`convert.py`:1557–1565) keeps the first `MetronomeMark` and removes every other: confirmed at the line; every converted source with more than one tempo loses its later changes. How many build sources have one is not counted.
- **The two other text marks disagree with their sounds** by the notation (`other-text-marks.txt`): Chopin's Ballade No. 4 prints `= 54` in 6/8 beside `<sound tempo="40">` (no reading of the missing note gives 40); the Mabinogi theme prints `♪=114` (then 112, 95) beside one `<sound tempo="114">`, which is 57 quarters if the ♪ is an eighth. Unverified as music.
- **E50a's generator's `--reprove`** stops on the seven old entries after E50 (they re-prove only through the restore lines; `former-identities-generator-after.txt`); `--check` and `--add` are unaffected.
- **Same-id old runs and the rung** (the question below), if the reviewer rules it a fault.

## Questions for the reviewer

1. Is a separate `repaired_identities.json`, re-proved by rebuilding the old bytes from the restore lines, the explicit addition you meant, or should the seven sit in E50a's table (which needs E50a's generator changed to keep them)?
2. The Wabash cut's old identity is not related to the new cut (`unresolved`, as the amendment's count expects). Should a cut of a repaired parent carry its old cut identity too?
3. An old run under the same item id counts toward its rung by id at its recorded percentage of the defaulted 96 — unchanged by E50 and not the alias. Is that acceptable for the seven, or does a tempo repair owe the rung something?

## Tests

| test | class | old assumption | result |
|---|---|---|---|
| `test_convert.TestTheTempoPrintedAsText` (13) | add | the default wherever music21 gives no mark | 7 red on base, 13 green after |
| `test_convert_cache.TestRepairedIdentities` (3) | add | a musical change drops every old identity | red on base (`red-on-base.txt`), green |
| `test_measured_truth` repaired-file case | add | — | red on the before build, green on the after |
| `test_measured_truth` former-identity oracle | revise | only dated forms feed `formerIdentities` | green on both builds |
| `test_measured_truth` excerpt `stale` | revise | no approved row is ever stale | green after |
| `test_excerpts` Wabash edition texts | revise | the parent prints `= 120` | green after |
| `repairedTempoLineage.test.ts` (9) | add | — | red on base (the relation absent), green |
| `TestTempoMarks`, forced and default tempo | preserve | — | green before and after |

**Mutants** (`mutants.txt`), each against a green control, restored byte for byte: M1 metre gate lets 6/8 through — `test_d_a_missing_glyph_in_a_compound_metre_is_not_read`; M2 glyph map dropped — `test_b_an_eighth_glyph_sounds_at_half_its_number`, `test_b_a_dotted_quarter_glyph`; M3 words left in place — `test_a_the_wabash_shape_reads_as_a_quarter_the_metres_beat`; M4 repair named without rebuilding — `test_nothing_is_named_that_does_not_rebuild_or_that_the_table_did_not_record`; M5 repair named without E50a's entry — the same; M6 a rung's pool routed through the relation — `repairedTempoLineage.test.ts` › *a rung counts a run by the item id…* and *every rung reading … the same*. 6 of 6 killed.

**Exit codes.** raw 0; reconvert 0; splice 0; repaired-identities 0; build-before 0; build-after 1 (the validator on the stale `ladder.md`, then regenerated); classify 0; validate (`--allow-nc --personal`, after) 0; review-check 0; content suite first run 1 (4 failures, 2 errors: microscope data not beside the copied content, `inventory.md`, the two revised tests), final run 0 (1,589, 4 skipped); `npx tsc -b --noEmit` 0; lint 0 (after removing two needless assertions and one `async` from the new test); `npx vitest run` 1 (2 of 7,366: `lessonClaimsAboutApp`'s recorded CRLF pair, *blues.3 … Rhythm only* and *4.7: blind …*, Entry 84's diagnosis; everything else green); `npm run build:app` 0; `library.spec.ts` on 5273, 2 workers: 15 of 15; mutants 0.

**The map** (`checks-for-paths.txt`): content build, validate, review check, the whole content suite, tsc, lint, the unit suite, the app build, `library.spec.ts` — all run as above. *Not run as the map writes it:* the build ran with `--out` (twice) rather than into `app/public/content`, the after build copied there for the suites, and the spec at two workers on 5273. No `docs/prompts/checks.json` row touched: every path falls under a row the map already names.

## Doc rows

- `docs/03-content-pipeline.md` §4a: a new bullet after *An import's tempo* — the build's tempo printed as text (the converter's rule, where it stands, what it writes, the seven respliced, one rule in two languages); and in the paragraph naming `provenance.formerIdentities`, the repair relation and how the build re-proves it.
- `docs/02-curriculum.md`, *One material identity*: the list carries a reviewed repair's old identity; the old run stays at its recorded tempo, and no standard reads the list.
- `docs/08-test-map.md`: the `test_convert.py`, `test_convert_cache.py` and `test_measured_truth.py` lines extended; a new `repairedTempoLineage.test.ts` line.
- `content/catalog.schema.json`: `formerIdentities`' description names the repair relation.
