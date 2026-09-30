# E50 — The seven bundled PDMX rows that print *"= N"* read as metronome marks: the converter reads an opening metronome mark printed only as text (E32's rule, the metre's beat where the note glyph is missing) before it inserts the default, the seven scores re-converted, their `pdmx.json` rows respliced and re-measured, and the one approval on them recorded stale (Margie, Limehouse Blues, Singin' the Blues, Weary Blues, Storyville Blues, Wabash Blues, Tishomingo Blues; Entry 163; content tooling and seven scores; a narrow fix-forward of a row the reviewer ruled, `responses/f972756.md`:13, under 788427c, sent to the reviewer before dispatch; its builder starts only on the reviewer's word (the owner's rule of 2026-09-30: every brief reviewed first))

**Read first:**
- **Procedure and policy.** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13. `docs/review/reviewer-context.md:144–150`: a narrow fix-forward proceeds from the accepted ruling without another pre-build round.
- **The rows.** `docs/prompts/views/backlog/E.md:112` (E50) and :94, E32's *Built* text: *"the seven bundled PDMX rows stay defaulted (E50)"*. `views/backlog/X.md:100` (X37, ruled).
- **The rulings.**
  - `docs/review/responses/f972756.md:13`, quoted in item 1, and :12 and :15 (E51, the renewal path).
  - `docs/review/responses/dd9aea36.md`, the X31a review. It is on origin at 6e9023b8 and not yet in the main checkout's tree: read it with `git show 6e9023b8:docs/review/responses/dd9aea36.md`.
- **The rule being ported.**
  - `app/src/data/importStore.ts:530–596`: `writesTempo` :530, `TextTempo` :535, `TEXT_MARK` :551, `textTempoOf` :570–596.
  - `app/src/score/textGlyphs.ts` whole: SMuFL's metronome glyphs :24–36, `noteLengthInQuarters` :48–66.
  - Its cases: `app/tests/unit/importMeasuredTruth.test.ts:185–263`.
- **The converter,** `tools/content/convert.py`:
  - :65–68, `DEFAULT_TEMPO_BPM`;
  - :77–100, `ConversionResult`;
  - :1329–1343, `insert_tempo`;
  - :1346, `normalise`, and its tempo branch at :1414–1435 (forced :1416–1421, a source mark :1422–1430, the default :1431–1435);
  - :1603–1626, `normalise_archive`, whose docstring promises bytes that depend *"only on its music"*;
  - :1628–1648, `write_mxl`;
  - :1678–1696, `tool_fingerprint`;
  - :1828–1866, `convert_file`.
- **The quarry and the table.**
  - `tools/content/pdmx/quarry.py:78` (the tempo bounds), :394 (the model), :448–500 (convert, round trip, structure with `tempo_defaulted` at :479, truncation scan, features and level).
  - `tools/content/pdmx/commit.py:180–205` (a row's fields).
  - `tools/content/pdmx/extract.py:80–121` (`extract_from_tar`).
  - `tools/content/import_pdmx.py:120–180` (`build_item`: the tag :126–127, `tempoBpm` :171) and :209–216 (the checksum refusal).
- **The build.**
  - `tools/content/build.py:811–814` (a notated item's identity is its built file's sha256), :834 (the converter's version is `tool_fingerprint()[:12]`), :925–942 (the tempo fact; tempo-sensitive demands listed untrusted where the tempo is inferred), :1022–1029 (an excerpt inherits its parent's fact).
  - `tools/content/review.py:267–286` (`current_identity`).
  - `tools/content/excerpts.py:94` (`INHERITED_TAGS`), :430–444 (the cutter drops the encoding date from a cut), :475–489 (a cut's level is measured on the cut).
- **The level,** `tools/content/difficulty.py`: :208 (`DEFAULT_BPM`), :229 (`opening_quarter_bpm`, X31a's opening rule), :408 (`notesPerSecond`, the one tempo-dependent feature), :454–478 (`estimate`, whose source is `"model"`).
- **The placements.** `tools/content/validate.py:510–535` (`level_band_errors`).
- **The app.**
  - `app/src/score/tempoFromXml.ts:1–58`, the one reader behind the label, the player and the count-in;
  - `app/src/ui/screens/ScoreScreen.ts:3148`, :3712 and :4732;
  - `app/src/score/OsmdView.ts:116–125`;
  - `app/src/ui/screens/ChordChartScreen.ts:530–537`;
  - `app/src/data/progressStore.ts:630–660` (`contactIn`).
- **The data.** `content/sources/pdmx.json`, the seven rows at the lines in item 2. `content/sources/excerpts.json:84–98`, Wabash's approval, with `parentSha256` at :94.
- **The record.** `docs/pending-review.md:4141–4143`, Entry 34 (T15): *"Files repaired — the MusicXML edited and `convertedSha256` respliced"*. *Weary Blues* is among them (commit ba9adb6f).
- **X31a's scripts to reuse,** under `docs/prompts/runs/X31a/`: `scripts-setup.ps1`, `scripts-run-build.ps1`, `scripts-level-diff.py`, `scripts-restore.py`, `scripts-corpus-app.test.ts`.
- **Tests.** `tools/content/tests/test_convert.py:25–37` (`ConvertCase`), :168–171 (a forced tempo), :182–192 (`TestTempoMarks`); `tools/content/tests/mxlutil.py`.
- **Docs.** `docs/03-content-pipeline.md:719–725`; `docs/08-test-map.md:713`.

## What is decided

1. **The ruling, verbatim** (`responses/f972756.md:13`): *"**CONSTRAINS NEXT BRIEF — E50 owns the seven bundled text-tempo rows.** The new text-mark reader is in the MusicXML import door; the seven bundled PDMX scores still go through the content converter and remain tempo-defaulted. E50 should change that converter and remeasure affected identities with the resulting stale approvals handled explicitly. It need not block X3's independent import sheet."*

   The X31a review (`responses/dd9aea36.md`): *"future quarry remeasurement should consume the corrected feature normally. X37 still governs any placement consequences: review the placement, never widen a band mechanically."*

   X37's ruling (`X.md:100`): *"never widen a lesson band merely to preserve a placement after remeasurement — at the next quarry each out-of-band piece is a placement review: move it if the estimate is credible, correct the difficulty truth if musical review shows it wrong, widen a band only if the lesson's own range was too narrow"*.

   The goal, in my words. A learner opening any of the seven hears the tempo the edition prints and is shown it, read the way the app's import door already reads a mark printed as text. The library measures each piece's level at that tempo. Nothing else in the catalogue changes except what the change provably causes, and each such change is named.

2. **Premises, checked at the line; two corrected.**
   - **The seven.** At drafting, every committed PDMX file was scanned for a `<words>` direction matching `TEXT_MARK` (`content/sources/pdmx.json`'s items, their files under `content/scores/pdmx/`). The seven are exactly the `tempoDefaulted` rows that print such a mark. Each prints it once, over bar 1, in 4/4. None is judged (`levelSource: estimated`), and all are `compositionStatus: pd`.

     | row id | file (`content/scores/pdmx/`) | `pdmx.json` | prints | tar member in `mxl.tar.gz` | rung (`levelBand`) |
     |---|---|---|---|---|---|
     | `song.pop.margie.pdmx` | `QmeZfusZHg4rm2bm4HKxUxF4oML58ivgwis6fR7t6xLG9N.mxl` | :20242 | = 160 | `mxl/4/57/…` | jazz.4 [2.67, 4.5], `stage-4.json:1021` |
     | `song.jazz.django-reinhardt-limehouse-blues.pdmx` | `QmWGjRhu5UsAL8TbmdX8RfLGR2yBicWMaLGm83DePAvvnn.mxl` | :20506 | = 184 | `mxl/14/22/…` | jazz.5 [2.97, 5.2], `stage-5.json:297`; jazz.6 [2.92, 6.4], `stage-6.json:317` |
     | `song.blues.singin-the-blues` | `QmWb1M68oQe5XE1eQpa1x5tGXM9cFvFPs9VxjDCoSsPQxS.mxl` | :33435 | = 120 | `mxl/14/11/…` | none |
     | `song.blues.weary-blues` | `QmcFYo1tzXKkVyVhWeRgNUmEuTz3brex5krHc5ipK8yu5W.mxl` | :33651 | = 200 | `mxl/2/20/…` | jam.7 [3.09, 6.4], `stage-7.json:922` |
     | `song.blues.storyville-blues` | `QmQjvJNRnH4txqUT4ta7FpCqZfeEkquYaoFqXpdM13DWPq.mxl` | :33796 | = 132 | `mxl/8/26/…` | jam.7, `stage-7.json:924` |
     | `song.blues.wabash-blues` | `QmWwJDFTEwoHzX3qXiVR8koWxt8Vc2oP9BHJSd68BfEVMt.mxl` | :34300 | = 120 | `mxl/14/50/…` | blues.3 [2.4, 4.5], `stage-3.json:738` |
     | `song.blues.tishomingo-blues` | `Qmb4ajXAjTv3vVkZmx1qtSEuUmRMVM8qbpEVPLsLM53WYA.mxl` | :34372 | = 132 | `mxl/1/3/…` | blues.3, `stage-3.json:739` |

     Each row stores `tempoBpm: 96.0` and `tempoDefaulted: true` today. *Margie*'s stored level equals jazz.4's lower edge, and *Weary Blues*'s equals jam.7's; the bands were set from their options (`validate.py:541–543`). A faster tempo could take a piece out through the upper edges (item 7).
   - **Corrected: where the glyph is lost.** The brief I was given places a *"tempo-words reading that drops the note glyph"* in `normalise`. There is none: `normalise` reads no words, and its tempo branch (convert.py:1414–1435) asks only for `tempo.MetronomeMark`. The glyph is absent from the source bytes.
     - The seven raw uploads were streamed read-only at drafting out of `C:\Users\yalir\repos\Piano Stuff\mxl.tar.gz`. Each matches its row's `rawSha256`, and all were written by MuseScore 3.6.2.
     - Each prints `<words … font-family="MuseJazz" …> = N</words>`. No file has a private-use character, a `<symbol>`, a `<metronome>` or a `<sound tempo>` anywhere.
     - music21 10.5.0 gives a `TextExpression` whose content is `= N`, in bar 1 at offset 0 of the top part, and no `TempoIndication`.
     - So `normalise` finds no mark and inserts `DEFAULT_TEMPO_BPM` (convert.py:68) into bar 1 (:1431–1435, through `insert_tempo`, :1329–1343).

     **Nothing can be kept; the note is reconstructed**, by E32's rule: the metre's beat where the glyph is missing, in x/4 or x/2 only (importStore.ts:572–574, :584–586). All seven are in 4/4 at the mark, so each reads as a quarter.
   - **Corrected: the paths.** The table is `content/sources/pdmx.json`, and the scores are `content/scores/pdmx/<cid>.mxl`. There is no `content/scores/imported/pdmx/`.
   - **The importer reads no tempo from the file.**
     - `build_item` tags `tempo-defaulted` from the row's `tempoDefaulted` (import_pdmx.py:126–127) and passes on the row's `tempoBpm` (:171).
     - The build refuses a file whose sha256 is not the row's `convertedSha256` (:209–216).
     - The quarry writes all three from the conversion (quarry.py:458, :479; commit.py:183–195).
   - **What a learner meets today.**
     - The built file carries the words `= N` beside the converter's `<metronome>`, a quarter = 96, with `<sound tempo="96">`.
     - The Score screen draws no metronome mark (`drawMetronomeMarks: false`, ScoreScreen.ts:4732; OsmdView.ts:116–125), but it prints the words. Entry 101's picture shows this: `docs/prompts/pictures/e1/score-blues.wabash-blues.b1-4-phone.png` has *= 120* boxed over bar 1.
     - The label, the player and the count-in play 96, which `tempoFromXml` reads.
     - The tag makes the run summary say *of the suggested tempo* (ScoreScreen.ts:3712) and makes the run's base tempo `defaulted` (:3148).
     - The chord chart plays at the row's `tempoBpm` (ChordChartScreen.ts:530–537).
   - **Re-converting is not byte-neutral, and one of the seven carries a hand repair.** Observed at drafting, by converting each raw file with the **committed** `convert.py` into a scratch folder outside the repository.
     - **Six files** come out differing from the committed file only on `<encoding-date>`. music21 stamps the day of conversion, and nothing in `convert.py` pins it, although `normalise_archive`'s docstring promises bytes that *"depend only on its music"* (:1603–1611).
     - ***Weary Blues*** also differs by a `<repeat direction="backward"/>` on bar 25's right barline. The raw file has it there, beside ending 2's `discontinue`. The committed file does not, because Entry 34 (T15, commit ba9adb6f) repaired it by hand. It is the only one of the seven with a commit after its quarry commit (`git log` per file).
     - `convert.py` itself has not changed since 2026-09-16 (392890bc).
   - **The level today.**
     - On six of the seven, the stored level equals what the committed code gives on the committed file.
     - On *Limehouse Blues* it does not. That row says `levelFrom: "model"`, where the other six say `"model-2026-09-22"`: this is X37's second definition.
     - On all seven, the features the committed code computes from the committed files equal the stored features.
     - `difficulty.estimate` returns the bare source `"model"` (difficulty.py:476). No tool under `tools/` writes `"model-2026-09-22"`; `git log -S` shows it came in with 23b1f3d7.

3. **The converter change.** It goes in `normalise`, in the branch that inserts the default today (:1431–1435), before the default is inserted. No other branch changes.
   - **What is read.** The opening metronome mark printed as text, from the parsed score: a `TextExpression` whose content matches `TEXT_MARK` (importStore.ts:551, ported to Python verbatim) once SMuFL's metronome glyphs are mapped by textGlyphs.ts's table (U+ECA2–U+ECAA, U+ECB7). The mark must stand where nothing sounds before it. That is X31a's opening rule, with its reading of *sounding* (difficulty.py `opening_quarter_bpm`): a note or chord in any part, grace notes counted, never a rest or a chord symbol.
   - **The note.** The glyph's, where the text carries one. Where the glyph is missing, the beat of the time signature in force at the mark, when its denominator is 4 (a quarter) or 2 (a half). In any other metre nothing is read, as at the door (:574, :586). The quarter-note tempo is the number × the note's length in quarters (× 1.5 if dotted), and it must lie in 20–400 (:587–588).
   - **What is written.**
     - The `TextExpression` is removed.
     - A `tempo.MetronomeMark` with that referent and that number goes where `insert_tempo` puts one: the top staff's first measure, at offset 0.
     - `effective` is its quarter-note tempo, and `added_tempo` is `False`.
     - One warning line names the mark as printed and, where the glyph was missing, says *read as a quarter (the metre's beat)*.
   - **Why a mark and not the words with a glyph.** Every other bundled score's printed tempo reaches the Score screen as a `<metronome>`. The screen hides that mark, and the bar says the bpm (ScoreScreen.ts:4732; OsmdView.ts:116–125: *"its own bar says the bpm, and the mark was the tallest thing above any stave"*). Written as a mark, the seven read like every other score. Written as words with a glyph, they would be the only scores printing their tempo over the first system, taking height the fit gives to the music.
   - **What the written file must carry.** A `<sound tempo>` equal to the quarter-note tempo. `tempoFromXml` lets a sound beside a mark win (tempoFromXml.ts:30–34), so a half-note mark written with the sound at its per-minute number would play at half speed. Assert this on the written file, and record what music21 writes for each referent.
   - **What is not read** (today's path, with the words kept as they are):
     - text that does not match;
     - a compound metre;
     - a mark after a note has sounded, which is a later tempo change printed as text; the warnings name it as not read;
     - any source with a `MetronomeMark` of its own, which stays with the `elif` branch, untouched.
   - **One definition, two languages.** The rule now exists in `importStore.ts` and in `convert.py`. The entry carries a parity table: each shape, the number the app's door gives in `importMeasuredTruth.test.ts`, and the number the converter gives. A single shared definition belongs to the later *"ingestion/shared-normalized-tempo seam"* the X31a review names; it is a follow-up line, not built here.

4. **Red first, unit.** A class of its own in `tools/content/tests/test_convert.py`, beside `TestTempoMarks`. The MusicXML is written in the test, or as fixtures under `tools/content/tests/fixtures/`. Assertions are on the written file, the test file's own rule (:1–7).
   - **(a) The Wabash shape.** In 4/4, bar 1 carries `<direction placement="above"><direction-type><words enclosure="rectangle" font-family="MuseJazz" font-style="italic"> = 120</words></direction-type></direction>` before the first note, and there is no tempo anywhere. Expected:
     - `tempo_bpm` 120 and `added_tempo` False;
     - one `<metronome>`, with `quarter` and `120`;
     - a `<sound tempo="120"`, and `written.tempos == [120.0]`;
     - no `<words>` reading `= 120`;
     - the warning.

     Red on the committed code: 96, True, and the words kept.
   - **(b) A glyph given.** The door's four numbers (importMeasuredTruth.test.ts:228–240):
     - U+ECA5 `= 132` → 132;
     - U+ECA7 `= 120` → an eighth, sound 60;
     - U+ECA5 U+ECB7 `= 80` → a dotted quarter, 120;
     - `= 60` in 2/2 → a half, sound 120.
   - **(c) After rests only.** A bar of rests, then the mark in bar 2: read, by X31a's rule, as in `TestTheOpeningTempo` (a) in `test_difficulty.py`.
   - **(d) Not read.** The default and the words stay, as today:
     - `= 120` in 6/8;
     - `Allegro`;
     - `bars 1 = 12`;
     - a mark in bar 2 after a note in bar 1;
     - a file with a `<metronome>` of its own beside a text mark.
   - **(e) A forced tempo** still replaces everything (:168–171).

   (a), (b) and (c) are red on the committed code. (d), (e) and `TestTempoMarks` are green before and after, by design; say so.

   Also record whether U+ECA5 survives from a `<words>` direction into `TextExpression.content`, as a `what-music21-gives` capture in X31a's pattern.

   Three mutants, each killed and recorded: the metre gate letting 6/8 through, the glyph map dropped, and the words left in place.

5. **The seven re-converted.** Use the quarry's own functions, never `commit.py`'s rewrite of the table. Temp state goes under `build/e50/`.
   - **(i) The raw files.** Stream the seven members out of `C:\Users\yalir\repos\Piano Stuff\mxl.tar.gz`, read-only. PDMX.csv's `mxl` column writes them as `./mxl/<a>/<b>/<cid>.mxl`. `extract_from_tar` takes a map from member to path; a script of your own kept under `runs/E50/` also serves. Check each file's sha256 against the row's `rawSha256`.
   - **(ii) The baseline.** Convert each raw file with the committed `convert.py` (`convert_file(raw, dest)`, as quarry.py:448) and diff its inner XML against the committed file. Expected: `<encoding-date>` alone on six, plus *Weary Blues*'s repeat. Anything else: stop and report it.
   - **(iii) The changed conversion.** Convert with the changed `convert.py`. For *Weary Blues*, re-apply Entry 34's repair exactly as ba9adb6f made it: read it off the inner XML in `git show ba9adb6f -- content/scores/pdmx/QmcFYo1tzXKkVyVhWeRgNUmEuTz3brex5krHc5ipK8yu5W.mxl`. Then re-zip through `normalise_archive`, as every converted file is zipped.
   - **(iv) The proof.** Each new file differs from the committed one only in the tempo direction(s) and `<encoding-date>`. `bars`, `notes`, `hands` and `singleLine` are unchanged.
   - **(v) The gates.** Run the quarry's gates on each new file, as quarry.py:463–490 does: `round_trip_ok` against the raw file, `structure_failure`, and the truncation scan. Each passes, as the committed file did. Then copy the new files over `content/scores/pdmx/<cid>.mxl`.
   - **The repair's witness.** Run `python tools/content/score_checks.py --item song.blues.weary-blues --only repeat-structure` before and after.

6. **The seven `pdmx.json` rows, respliced as text.** `operating-procedure.md` §11's JSON rule applies: compare a round trip against the raw bytes first, and if it is not byte-identical, splice text. Per row, only these fields change:
   - `convertedSha256`;
   - `tempoBpm`, the new quarter-note tempo;
   - `tempoDefaulted: false`;
   - `features.notesPerSecond`, the only tempo-dependent feature (difficulty.py:408). Every other feature stays byte-identical, and that is asserted;
   - `level` and `levelDrivers`, from `difficulty.features(parse_source(new file))` and `difficulty.estimate(features, difficulty.load_model())`, as quarry.py:394 and :494–500 do;
   - `levelFrom`, in the convention the rows measured under the committed model carry. Read 23b1f3d7's record for that convention, and say which label you write and why.

   The `review` object stays byte-identical. The quarry's *keep* judged the piece and its licence (commit.py:204), and each file's diff is its tempo direction and its date stamp; the entry says so per row. Nothing else in the table is touched.

7. **The levels re-measured, reported three ways per row:** the stored level, the committed code on the committed file, and the committed code on the new file. The three tell the tempo's share apart from *Limehouse*'s older model.
   - **The builds.** Build before and after, offline, each with an absolute `--out`, and run `level-diff` (X31a's script) on the pair.
   - **No refit.** `level-model.json` is untouched. The fit report is for information only, if it is cheap.
   - **Placements (X37).** If a re-measured level leaves a rung's stated band, `validate.py` fails on `level_band_errors` (validate.py:510–535). Do not widen the band, move the piece or keep the old level to pass. Finish everything else and leave the row at its re-measured level. Record each out-of-band piece as a placement review, quoting X37's words, and report the validator's red with the rows named under *Not done* and *Questions*. The orchestrator sequences the placement decision before the landing.
   - **The cut.** `excerpt.blues.wabash-blues.b1-4`'s level is measured on the cut at build (excerpts.py:485), so it moves with its parent. Report it.

8. **Identities and approvals, handled explicitly.** Count them; never assume them.
   - **The seven parents and the Wabash cut.** New bytes mean a new identity (build.py:811–814; review.py:267–286). Stored runs whose material is the old sha no longer match: `contactIn` reads *unmet* where it read *met* (progressStore.ts:630–660; confirm at the line). This is the move the row names.
   - **The one approval, Wabash bars 1–4** (`excerpts.json:84–98`).
     - Its `parentSha256` (:94) is today's `convertedSha256` (`pdmx.json:34307`). After E50 it is stale by provenance; it is already stale by cut version, since it carries no `cutVersion`.
     - The build still cuts it, and the validator names it. The cut loses the inherited `tempo-defaulted` tag (excerpts.py:94), and its tempo fact becomes the parent's (build.py:1022–1029).
     - Renewing it is a person's decision, through E51's path (`responses/f972756.md:12`). **Nothing is renewed, merged or edited in `excerpts.json`.**
     - The other six have no excerpt row, approved or rejected (`excerpts.json`, searched).
   - **D2's record.** It holds four decisions, all on generator identities (`content/review/decisions.jsonl`), so none is bound to these bytes. `review.py --check`'s record line goes in the entry.
   - **Beyond the seven: the converter's fingerprint.**
     - `tool_fingerprint` hashes `convert.py`'s bytes (:1678–1696). After this change, every conversion the build caches misses the cache and is re-converted with today's `<encoding-date>` (`cached_convert`: the authored scores, and the converted kern, MuseTrainer and Mutopia imports).
     - Every such built file's bytes, and so its identity, move for the date alone. Every converted item's `provenance.converter.version` moves too (build.py:834).
     - No approval is bound to those bytes, as checked at drafting. The four approved excerpts other than Wabash have as parents three committed PDMX files and one MuseTrainer file the build copies as it is. D2's four decisions are on generators.
     - Stored runs of those items would read *unmet*, as above.

     So:
     - diff every built score file between the two builds, and classify each changed file as *music changed* or *`<encoding-date>` only*. Expected: *music changed* for the seven parents and the Wabash cut alone; a scan of the main checkout's last build found no other built file printing a text mark without a tempo of its own (the two that print one beside their own tempo are in item 10);
     - count the items whose identity moves in each class;
     - record the date churn as a follow-up row: `normalise_archive` pins zip times and ids but not music21's date, against its own docstring.

     Pinning the date is **not E50's**. It would change the bytes of every converted file once more, and it touches the cache's correctness argument, which the reviewer should see on its own. It goes in Questions, with the sequencing fact: a pin landed *before* E50 would make E50's churn the seven alone.

9. **The consumers of the changed fields,** each checked after the change:
   - **the tag and the build's tempo fact:** the fact becomes *authored, via the upload* (build.py:928–930), and the tempo-sensitive demands are no longer listed untrusted (:938–942);
   - **the Score screen:** *of written* (:3712) and a `written` base tempo (:3148);
   - **the chord chart:** it plays at the new `tempoBpm`;
   - **the lesson claims** that read tags or tempos (`lessonClaimsAboutApp.test.ts`, `lessonClaimsAboutMusic.test.ts`): run them after the build, because they read built content;
   - **`test_measured_truth.py:176–180`:** some rows keep the tag.

   One fact the build's tempo fact does not carry: the beat unit was inferred from the metre. The app's door says so in its own fact (importStore.ts:638–645). Whether the PDMX fact should say it too is a Question, not built, because it touches `build.py`.

   A search of `content/lessons/*.md` at drafting found no sentence about these seven's tempo or pace. Repeat it and state its scope.

10. **Not E50's:**
    - **the app:** `tempoFromXml`, the import door, the Score screen;
    - **other rows.** Two more committed PDMX files print a text mark beside a tempo of their own, so the change never reaches them: Chopin's *Ballade No. 4* (`= 54` in 6/8, beside `<sound tempo="40">`) and the Mabinogi login theme (the words `♪=114`, beside `<sound tempo="114">`). If you confirm that a printed mark and its sound disagree, that is a follow-up line;
    - **the excerpt renewal:** E51's path, and a person's decision;
    - **the difficulty model** and any refit;
    - **the bands and placements** (X37);
    - **`build.py`'s tempo-fact wording**;
    - **these files:** `import_pdmx.py`, `validate.py`, `excerpts.py`, `content/sources/excerpts.json`;
    - **pinning the encoding date**;
    - **one adjacent line.** The `elif` branch keeps the first `MetronomeMark` and removes every other (convert.py:1428–1430, written for ABC's per-voice copies). If that drops genuine later tempo changes from every converted score, it is a follow-up row. Confirm it at the line and record it; do not fix it.

11. **The hypothesis, and when to deviate** (`operating-procedure.md` §13). I hold that the seven stay defaulted because `normalise` inserts the default wherever music21 gives no `MetronomeMark`, and music21 gives the printed `= N` as a `TextExpression` that nothing reads. The refuting tests: case 4(a) passing on the committed code, or your capture showing music21 giving a `TempoIndication` for the words. Either way, stop and report. Where a premise here is wrong at the line, say so at the item and take the better path, with the reason.

## Verification layers

- **Unit, red first** (item 4): `python -m unittest tools.content.tests.test_convert tools.content.tests.test_pdmx`. Then the re-conversion's captures (item 5) and the splice's round-trip check (item 6).
- **The map:** `python tools/docs/checks_for_paths.py <final changed paths>`, with what it prints. At drafting, for `convert.py`, `test_convert.py`, `pdmx.json` and a PDMX score, it named:
  - `python tools/content/build.py --offline`;
  - `python tools/content/validate.py`, run as `--allow-nc --personal`;
  - `python tools/content/review.py --check`;
  - the whole content suite, `python -m unittest discover -s tools/content/tests -t tools/content`;
  - `npx vitest run`;
  - `npm run build:app`;
  - `npx playwright test tests/e2e/library.spec.ts`.
- **The builds:** before and after, offline, each with an absolute `--out` (X31a's `scripts-run-build.ps1`), feeding `level-diff` and the classified byte diff of every built score (item 8).
- **Order.** After the after-build: the validator, the record check and the content suite, then `npx vitest run` (the lesson tests read built content), then `npm run build:app`.
- **The browser spec:** only the one the map names.
  - Check that the file exists first.
  - Run it at `--workers=2` on port 4631, through a copy of `app/playwright.config.ts` kept under `build/e50/`, not `app/`: the baseURL and webServer on 4631, `testDir` absolute, the storage state re-keyed to the port.
  - No port 4173.
- **The product layer.**
  - The opening tempo the app's one reader gives each built parent and the cut, before and after. Use a scratch vitest file in X31a's `scripts-corpus-app.test.ts` pattern: copied into `app/tests/unit/` for its run, removed afterwards, kept as `runs/E50/scripts-*.test.ts`.
  - The `<words>` each built file prints over bar 1, before and after.
  - Nothing is heard. Whether each printed tempo suits the piece for a learner is unverified as music.

## Rules and files

You own:
- `tools/content/convert.py`, at `normalise`'s default branch and one helper beside `insert_tempo`;
- `tools/content/tests/test_convert.py` (the new class), and any fixtures it adds;
- the seven files under `content/scores/pdmx/`;
- the seven rows of `content/sources/pdmx.json`, at the fields item 6 names;
- `docs/prompts/runs/E50/`;
- the `docs/03` lines (:719–725: a sentence for the build's door beside the import's) and the `docs/08` line (:713), in the entry's `## Doc rows`.

Not yours: the files item 10 names, `app/**`, `content/curriculum/**`, `content/score-checks.allow.json`.

**Base:** origin's head at dispatch, which the orchestrator states. At drafting it was 6e9023b8, which holds X31a, G1e, G87, G85a, E51, U96a, F3a and G86, plus the reviewer's responses. `tools/content/**`, `content/sources/**` and `content/scores/pdmx/**` are identical there and in the main checkout.

The rules:
- Never name an AI model. Never assert a number measured on this machine.
- No commits, pushes, stashes, resets or checkouts. Temp state goes under the worktree's own gitignored `build/`. Never write in the main checkout.
- **Set up the fresh worktree as X31a's was** (Q24):
  - `npm ci` in `app/`;
  - `python tools/midi-cleanup/tests/parity_reference.py`;
  - the caches and fetched sources copied read-only from `C:\Users\yalir\repos\Piano Stuff\PianoProject` (robocopy `/E`, never `/MIR`);
  - if the offline build cannot produce `app/public/content`, copy that folder too, and say so.
- **Snapshot and restore four files.** Snapshot `content/scores/imported/SOURCES.md`, `docs/prompts/inventory.md`, `docs/prompts/rung-claims.md` and `docs/generated/ladder.md` before the first build, and restore them after (X31a's `scripts-restore.py`). Say what content the after-build would have written into them.
- **The disk is nearly full.**
  - When the run is over, and after the captures are copied out, delete your own `app/test-results`, `app/dist`, `app/node_modules`, `build/e50/` and the copied caches (the copied `app/public/content` among them).
  - Keep no log over 300 KB in the run folder. Keep the summary and the failing names, and say the full log was not kept.
- Every item done, or an explicit not-done line.

## Report

**Judgement first:**
- per file, the words over bar 1 and the `tempoBpm`, before → after, and `tempoDefaulted`;
- per row, the level three ways, and its band, in or out;
- the Wabash approval's state;
- the built-file diff by class, with the identity counts.

Then:
- **Done / Not done / Follow-ups / Questions / Files.**
  - The follow-ups include the encoding-date pin, the tempo fact's inferred beat, the `elif` branch if confirmed, and the two other text-mark files if their marks and sounds disagree.
  - The questions include the pin's sequencing and any placement review.
- The mechanism, the discriminating test and its red line.
- The parity table.
- The tests table: each test with its class (add, revise or preserve) and the old assumption.
- Exit codes.

What is unverified sits beside what passes. `operating-procedure.md` §11 and §12 apply.

**Entry 163.** Every run file goes under `docs/prompts/runs/E50/`. The entry is `docs/prompts/runs/E50/ENTRY.md`, starting `### Entry 163 — E50`, and it ends with `## Doc rows`.

**Tempo repair approved 2026-09-30; do not dispatch until the conversion date is pinned** (`responses/questions-bbd7f99a.md`). Reconstructing a real metronome mark from the plain *"= N"* text belongs in conversion and normalisation, never in app tempo heuristics. But reconverting every converted score for a fresh `<encoding-date>` would move identities and make runs appear unmet where nothing changed; that is not acceptable collateral for seven tempo rows. Before E50's reconversion: make conversion output deterministic with respect to the encoding date at the converter boundary; prove a no-change reconversion of a representative corpus file byte-stable; then reconvert the seven and verify only their genuine changes move identity; reapply and test Weary Blues' Entry 34 repair. The Wabash excerpt's staleness by provenance goes through E51's renewal path, never auto-renewed. The prerequisite is E50a (`tasks/E50a-the-conversion-date-is-pinned.md`, Entry 166; its brief with the reviewer before dispatch).

## Reviewer's conditional approval (`responses/questions-bd7d303e.md`) and the amendments

Conditionally approved for dispatch 2026-09-30, after E50a lands and this brief receives the amendments below. The reviewer's words govern wherever the brief's earlier text differs. **Amendments (the orchestrator's read of this brief against E50a's landed mechanism, on the reviewer's word):** every date-churn sentence goes (the converter writes no `<encoding-date>`; nothing moves for the date alone; only `converter.version` moves; the *encoding-date pin* follow-up and *the pin's sequencing* question are E50a's and are dropped); the acceptance classes become *music changed* (the seven parents and the Wabash cut) and *byte-identical* (everything else, `identity` and `formerIdentities` unchanged), counted in E50a's three outcomes (expect 8 unresolved by design, 0 resolved, the rest unchanged); the baseline check reads: equals the committed XML with the date removed by E50a's own function, differing only in the tempo direction(s), and Weary Blues re-zipped through the path that applies E50a's text normalisers; the seven repaired files' rows report what `formerIdentities` carries and that no alias names a dated file that never existed; `formerIdentities` never renews or un-stales a `parentSha256` and never enters `pdmx.json`; the base is origin's head with E50a merged, its sha stated, every pointer re-read there (`convert.py` has changed since 2026-09-16); the map re-run at that base. **The old identities relate to the repaired files** for contact, familiarity, project continuity and encounter/history lookup through E50a's learner-material relation, the seven old identities added explicitly to the repaired files' compatibility relation; the old run stays a run at its recorded tempo and context — never rewritten, re-scored, claimed at the corrected tempo, never renewing an approval, un-staling a `parentSha256`, entering `pdmx.json` or altering D2's exact-byte identity; a test shows the alias does not let old evidence satisfy a tempo-dependent standard, and if it does, stop and narrow the relation before landing.

# 4. E50 — seven rows print their tempo

**CONDITIONALLY APPROVE FOR DISPATCH after E50a lands and the brief receives the stated amendments.**

The date-churn language must be removed as proposed. E50 then owns only genuine musical/file changes caused by reading the seven printed tempo marks plus the Wabash cut consequence and Weary Blues repair.

## Old identity -> repaired identity

**Yes: preserve learner-material continuity, with a strict semantic boundary.**

These are the same pieces/editions corrected so the app follows the tempo already printed in their notation. A learner who previously opened or played one has still encountered that piece. Therefore the old identity may be related to the repaired identity for:

- contact/familiarity;
- project continuity;
- encounter/history lookup;
- “have I seen/played this material before?” semantics.

But the old run remains a run at its **old recorded tempo/context**. The relation must not:

- rewrite the historical run;
- re-score it;
- claim it was performed at the corrected tempo;
- renew an excerpt approval;
- un-stale `parentSha256`;
- enter `pdmx.json` as provenance equivalence;
- alter exact-byte D2/review identity.

If E50a’s learner-material relation already has exactly that effect — same material lineage while historical evidence/context remain as stored — use it and explicitly add the seven old identities to the repaired files’ compatibility relation.

If a test shows the alias causes old performance evidence to be reinterpreted as satisfying a new tempo-dependent standard, stop and narrow the relation before E50 lands. Do not solve continuity by falsifying historical performance truth.

This is an explicitly reviewed semantic relation under the earlier condition; it does not require a separate architecture lane unless the existing relation cannot express it safely.

**Landed 2026-09-29** (Entry 163; 68e0479b, merged 16df185b); handoff `handoffs/68e0479b.md`.
## Record

lane: E50 · closes: E50 · entry: 163
index: The seven bundled PDMX rows that print *"= N"* read as metronome marks: the converter reads the text mark before it inserts the default, the seven scores re-converted and respliced, the approval on them recorded stale (the reviewer's E-tail ruling) | content | brief drafted 2026-09-30 (`E50-seven-rows-print-their-tempo.md`); sent to the reviewer before dispatch; Entry 163; **tempo repair approved 2026-09-30; do not dispatch until the conversion date is pinned** (`responses/questions-bbd7f99a.md`): E50a first (Entry 166); the Wabash excerpt through E51's renewal, never auto-renewed |
in-flight: brief drafted 2026-09-30 (`E50-seven-rows-print-their-tempo.md`): the reviewer's E-tail ruling (`responses/f972756.md`): the converter reads an opening metronome mark printed only as text before it inserts the default, the seven bundled PDMX rows re-converted and respliced, the approval on them recorded stale; sent to the reviewer before dispatch (Entry 163). **Tempo repair approved; do not dispatch until the conversion date is pinned** 2026-09-30 (`responses/questions-bbd7f99a.md`): reconverting every score for a fresh `<encoding-date>` is not acceptable collateral; first make conversion output deterministic with respect to the encoding date, prove a no-change reconversion byte-stable, then reconvert the seven and verify only their genuine changes move identity, reapply Weary Blues' Entry 34 repair; the Wabash excerpt goes through E51's renewal, never auto-renewed; **E50a** (`tasks/E50a-the-conversion-date-is-pinned.md`, Entry 166; brief with the reviewer first) is the prerequisite.
state: approved 2026-09-30: tempo repair approved; do not dispatch until the conversion date is pinned (`responses/questions-bbd7f99a.md`): E50a first
