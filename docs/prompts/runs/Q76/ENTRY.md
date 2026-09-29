### Entry 136 — Q76 — the public build keeps 2.4's tie and ragtime.8's stride bass: an authored public-domain *Cielito Lindo* on 2.4, and Mutopia's *Pine Apple Rag* on ragtime.8 by the reviewer's MIDI route, because python-ly cannot convert Mutopia's rags; on a licence-strict build here both claims are established and Q75's two warnings are gone (2026-09-29)

**Judgement.** I looked at the Score screen at 342 × 740 on both new options (below). The music is unheard: every musical sentence here is an observation against the level model and the rung's words, unverified as music.

- **The pictures** (`docs/prompts/pictures/q76/`, built from the personal content; both files are bundled unchanged by the strict build):
  - `score-cielito-lindo-simple-opening-342x740.png`: *Cielito Lindo (simple)*, "bar 1 / 32", label "112 bpm" (the written tempo). Two bars on the screen, one per system. Bar 1 has C–C–A with the tie arc leaving the A toward bar 2. The chord symbols C and G7 sit above, the left hand's held C and G below. Fingering is marked (4, 2, 3, 1 in the right hand; 5 and 1 in the left). The tie's continuation at the head of system 2 shows no incoming half-arc; that is the engraver's, noted under follow-ups.
  - `score-pine-apple-rag-mutopia-opening-342x740.png`: the header reads "Pine Apple Rag (repeats …" (the title is cut at this width), "bar 1 / 148", label "100 bpm". That is the edition's "Slow March tempo, 4 = 100", as its MIDI carries it and X3d's tempo reading shows it (item 6).
    - Bar 1 is the unison opening, G–F–E♭ then D–C♯–D–C. The chromatic note is spelled C sharp, as the edition spells it; the converter alone wrote D flat.
    - Bar 2 has the tied F. Both hands are beamed and readable, one bar per system at this width. I did not look at the trio or at the bars where the edition's two voices are merged into chords.
- **The two rungs' rows in the strict build's claims report**, the same build before and after (`strict-report-before.txt`, `strict-report-after.txt`; established / checked, unmeasured here):

| Claim on the strict build | Before (HEAD) | After |
| --- | --- | --- |
| 2.4 skill tie | 0 / 7 (+1 unmeasured) — *not judged on this build* warning | 1 / 8 (+1), established by `song.folk.cielito-lindo.simple` |
| 2.4 tied notes (`rhythm.ties`) | 0 / 7 (+1) | 1 / 8 (+1), the same piece |
| ragtime.8 stride bass (`texture.left-hand-pattern`) | 0 / 6 (+5) — *not judged on this build* warning | 1 / 7 (+5), established by `song.ragtime.joplin-pine-apple-rag.mutopia` |
| ragtime.8 skill syncopation | 1 / 6 (+5) | 2 / 7 (+5): the new rag keeps it too |

- The strict validator prints no *not judged on this build* line after the change; before, it printed two (`validate-strict-before.txt`, `validate-strict-after.txt`, both exit 0).
- The report's claims no option keeps fall from 8 to 5: the three removed are these two rungs' rows.
- Every rung's claim rows were compared across all 109 rungs. Only 2.4's and ragtime.8's differ (`claims-diff-strict.txt`), so no other claim changed.
- **What a teacher would say, as observations** (unverified as music):
  - **2.4, *Cielito Lindo (simple)*.** The right hand is the melody in quarter notes, and every tie is a long note carried over the bar line, on the beat. In the verse that is every other bar. That is exactly "hold through, do not re-strike", which the 2.4 lesson teaches. The tie density is well above the claim rule's threshold (four ties and one per five bars).
    - The left hand holds one root a bar inside C position (C, D, F, G under fingers 5, 4, 2, 1).
    - The difficulty is in the right hand's moves: it changes position between the verse and the chorus, and there is one jump from the verse's final middle C to the chorus's high E.
    - Its only demand 2.4 has not taught is a hand beyond a five-finger position. Every other song on 2.4 carries that one too, plus two to four more.
    - Level: the level model's estimate sits inside 2.4's band, in its upper half. The authored level, 3.0, puts it after *Greensleeves (simple)* and before *Greensleeves (with chords)*. The model's largest upward driver is the left hand's range of a fifth, which inside one position costs a beginner little.
    - Against the rung's words: ties across bar lines, yes; 32 bars, the top of the finder's range; no sixteenths. It prints no dynamics or slurs (below).
  - **ragtime.8, *Pine Apple Rag (repeats written out)*.** The notes and their times are the Mutopia edition's, the left hand keeps its pattern in every bar, and the level model puts it inside ragtime.8's band near its top, level with the craigsapp edition's judged level for the same work.
    - The page is a transcription of a performance. The repeats are written out, so it is longer than the edition's printed page, and where the edition writes two voices in one hand they come out as chords with ties. A teacher would call it fine for practising the stride and busier to read than the edition.
    - Its one demand ragtime.8 has not taught (sixteenths) is the same as the craigsapp edition's.

**The brief's premise did not hold for the rags, and the route changed on the reviewer's word.**

- **Hypothesis (the brief's):** python-ly's `ly musicxml` converts Mutopia's rags well enough for the left hand's pattern to survive.
- **Discriminating test:** every single-file edition in the Joplin folder, at a pinned revision, through `convert.parse_lilypond`, as it stands and after python-ly's own `rel2abs` and `rhythm_explicit` with every repeat unfolded (`muto-verdicts.txt`, `pyly-mechanisms.txt`).
- **Result: no rag comes out right.**
  - All 16 use `\alternative`, which the writer does not implement: it writes both endings one after the other and doubles the repeat marks.
  - 10 of the 16 are refused outright, by python-ly or by music21.
  - On *Pine Apple Rag* the writer closes the left hand's first bar after a quarter, pushes the notes of a chord that ends a bar into the next bar, and writes the bar after a two-voice block into the same measure.
  - The only file where the detector finds the pattern in every bar is *Maple Leaf Rag* as python-ly writes it unaltered, and that is the wrong score with both endings played every time. So a passing detector does not vouch for a conversion.
- **The reviewer's fallback order** (relayed mid-task; `docs/review/responses/questions-400e69c8.md` §2) replaced the brief's stop line: first Mutopia's own published MIDI through the repository's converter; LilyPond on the runner only if that fails (a workflow change: stop); a committed one-off last.
  - **The first route held for *Pine Apple Rag*.** Mutopia's piece page links a `.mid` beside the `.ly`, and the published `.ly` is byte-identical to the mirror's. `tools/midi-cleanup/midi_to_musicxml.py` reads it back whole: no note lost or added, every bar adds up. The detectors find the pattern in every bar, and the render check passes.
  - **The one fault it brought was the spelling.** The converter spells from one key, so it wrote D♭ for the edition's C♯ and G♭ for its F♯. On this rag that is 95 notes (`midi-route.txt`), and it would be a wrong note name on the page.
  - **The mechanism fixed.** The import aligns the converted notes, by pitch class, with the edition's own pitches read from the `.ly` (python-ly's tools, repeats unfolded, so their order is the MIDI's). It gives each note the edition's letter and accidental, and it refuses the row if any note is left unspelled or spelled in a way the edition never spells that pitch class. On *Pine Apple Rag* none is left, and none is foreign.
  - The trio's key change comes from the MIDI's key-signature events.
  - *Magnetic Rag*, the rung's other Mutopia rag, is refused by that same spelling gate (notes of its upper staff have no spelling the alignment can find). Its left hand also leaves the pattern in the closing bars, and its MIDI tempo is LilyPond's default. It is not taken.
  - The LilyPond route was not run: there is no `lilypond` here, and on the runner it would be a workflow change.

## Done

1. **The `[MUTO]` import step (item 1), by the MIDI route.**
   - `content/sources/mutopia.json` has the kern table's shape:
     - the source and its pinned revision;
     - one item: its edition, piece page, the `.ly` and `.mid` paths with their sha256, the staff variables, key, metre, tracks, concepts, `variantOf` and the edition note;
     - `notTaken` (*Magnetic Rag*, with the reason);
     - `checkedAndRefused`: every other Joplin edition, with python-ly's verdict.
   - `tools/content/import_mutopia.py`:
     - fetches only the named files. The `.ly` comes from the GitHub mirror at the pinned revision; the `.mid` comes from mutopiaproject.org, the only place it is published. Raw files rather than a sparse checkout: two small files a row, and a pinned checksum is the whole proof.
     - verifies both checksums;
     - reads the licence from the `.ly` header (`license`, else `copyright`) and puts it through the licence gate; checks the composition's year and the edition's footer;
     - converts with the MIDI converter, spells and keys from the edition, then normalises through `convert.cached_convert`;
     - caches under `build/cache/mutopia/`, keyed on both files' bytes, its own and the converter's bytes, and the music21 and python-ly versions;
     - estimates the level with the level model (`estimated`);
     - writes a placeholder with the reason where files are missing, mismatched or refused, so the id always resolves.
   - `build.py` has step 4a:
     - it runs offline whenever the build is offline or `--skip-fetch`;
     - `source_kind` returns `mutopia`;
     - provenance says what happened: `source: mutopia`; `edition: mutopia:Mutopia-2014/01/12-1899`; `converter` names the MIDI converter and its version, the published MIDI by URL and sha256, the `.ly` its spelling came from, and the normaliser; the tempo fact is `authored` (the edition's `\tempo`, as its MIDI carries it); the hands fact is `authored`.
   - The new provenance value reaches its consumers: the schema's enum (`content/catalog.schema.json`), the app's type (`app/src/curriculum/types.ts`, type only), `review.SOURCE_ORDER` and `test_measured_truth.SOURCES`.
   - The row never calls the result Mutopia's notation. Its edition note says the notes and times are the edition's and the page is not.
   - **The route each rag took:**
     - *Pine Apple Rag*: python-ly refused, then the published-MIDI route, taken.
     - *Magnetic Rag*: python-ly refused, then the MIDI route, refused by the spelling gate.
     - The other 14 single-file editions: python-ly only. Each was refused or wrote both endings; none is ragtime.8's, so the MIDI route was not tried.
     - *Bethena* and *Solace* (multi-file): not converted.
     - No rag took the LilyPond route or a committed one-off.
   - python-ly is already in `tools/content/requirements.txt` (`>=0.9.9`; 0.9.10, the newest on PyPI, is installed here). No new dependency: the MIDI converter is in-repo and music21-based.
   - Technically: every catalogue check passes on both builds, and the render check is clean. Pedagogically: see the judgement; the page is busier than the edition's.
2. **ragtime.8's option from the public edition (item 2).**
   - `song.ragtime.joplin-pine-apple-rag.mutopia` is second in `songOptions`, after the craigsapp edition.
   - Its title is *Pine Apple Rag (repeats written out)*, in the house's parenthetical style, because the app shows no `variantLabel` and the rung would otherwise list two identical titles.
   - `variantOf` is the craigsapp row, so the relationship sees one work in two editions (`provenance.composition` is `variant-of:song.ragtime.joplin-pine-apple-rag`).
   - **The craigsapp editions stay on the rung.** On the personal build the critical edition is the better page (repeat signs, voices). On the strict build it is a placeholder. The lesson's *Play it blind* button skips an option with no file (`LessonScreen.scorePiece` through `openItem.isPlayable`), so on the phone it should now open this public edition, where it used to open *Frog Legs Rag*. That is read from the code; I did not see it on a strict build's screen. The rung has seven song options.
   - The level model's estimate sits inside ragtime.8's band. Part D5's words ("the late rags") fit: *Pine Apple Rag* is 1908, already the rung's own work.
3. **2.4's tie from a public-domain piece (item 3).**
   - **Greensleeves first**, as the brief asked: the claim failed for want of ties, not for another reason. Its MuseTrainer edition's ties are below the density rule (`incidental`), and the two authored settings have none.
   - **Candidates measured** across up to six independent PDMX editions each, from the owner's archive (`pdmx-tie-tunes.txt`: the melody's ties per bar, and how many start on a beat):
     - *Cielito Lindo* (three 3/4 editions with ties, on the beat, at a rate well above the rule's), *Londonderry Air*, *The Water Is Wide* and *Red River Valley* carry ties by nature;
     - the brief's examples, *Auld Lang Syne* and *Silent Night*, carry almost none, so they were not written with ties.
   - **Chosen: *Cielito Lindo*** (Quirino Mendoza y Cortés, 1882): C major, on-beat ties, quarter-note rhythm, independent editions agreeing.
     - The right hand is the committed PDMX edition's melody, note for note and tie for tie (a test holds this). The left-hand roots follow the lead-sheet edition's chords, all 32 bars (`lh-roots-check.txt`).
     - The header is complete: id, level, hands, tracks, concepts, licence CC0, arranger, sourceName with the CID, `variantOf` the PDMX row, and editionNotes naming it a simplification.
     - It is placed last in 2.4's `songOptions`.
   - ABC dynamics marks do not survive music21's reader in this pipeline (tried: `!mf!` and `!f!` vanished), so none are printed.
4. **The strict build is the proof, run here (item 4).**
   - The licence-strict build (`PIANOPATH_STRICT_LICENSE=1 … --out build/q76-strict-after/content`) and the personal build are both green, and so is the validator on each.
   - The claims rows are above. The strict flavour a test computes from the personal catalogue was checked against the real strict build: every placeholder and both rungs' rows agree (`strict-flavour-check-*.txt`).
   - Reports regenerated: `docs/prompts/rung-claims.md`, `docs/prompts/inventory.md`, and `docs/generated/ladder.md` (the validator failed the build until it was: `build-after-personal.txt`).
   - The Pages run is the second proof, unverified until read.
5. **The record (item 5).**
   - `docs/03`:
     - §2's `[MUTO]` row;
     - the paragraph on `[MUTO]`, with python-ly's finding, the MIDI route, the spelling gate, the fetch and what stays the converter's;
     - the `[MIDI]` row's sentence (`build.py` now runs the converter for this one step);
     - §3 step 4a.
   - `docs/02`: Part C 2.4's songs (*Careless Love*, which was on the rung and not in the sentence, and *Cielito Lindo*), the D5 note on the public build, and a Part F row.
   - `docs/prompts/checks.json`: one row, spliced as text. A change to `tools/midi-cleanup/midi_to_musicxml.py` now also needs the content build, the validator and `test_import_mutopia.py`. The new module and the source list were already matched by `tools/content/*.py` and `content/sources/**` (`checks-for-paths.txt`: 25 of 25 paths matched).
   - `content/scores/imported/SOURCES.md` gains the Mutopia row, written by the step's own fetch, stable across builds.
   - **The workflows are untouched.** `ci.yml` (line 77) and `pages.yml` (line 64) install `tools/content/requirements.txt`, and both run the content build online. So the runner fetches the *Pine Apple Rag* `.ly` from raw.githubusercontent.com and its `.mid` from mutopiaproject.org on its first build. If either is unreachable, the row is a placeholder and the claim falls back to Q75's warning.
6. **Not Q76's, held:** the craigsapp licence, other rungs' claims, the E32/E48 doors, the tempo map. The tempo check is in the judgement: the rag's label reads the edition's 100.
7. **A lesson the placement made wrong, corrected.**
   - `content/lessons/ragtime.8.md` said "Six options", "five Joplin rags … from the same edition", "Euphonic Sounds, which is not in the edition", "first of the six". Three unit tests went red on it (red lines).
   - It now says seven options, *Pine Apple* twice (once with its repeats written out), *Euphonic Sounds* in neither edition, and first of the seven. It stays inside the three-minute limit: one redundant *Stoptime* sentence was cut.
   - `lessonClaimsAboutApp.test.ts`: two claims rewritten to the new truth, with the reason beside each.

## Not done

- **The Pages run on the record commit.** It is the orchestrator's to read. Until then, the runner's fetch from mutopiaproject.org and its strict validation are unverified.
- **`docs/08` and the backlog row.** They are not this seam's files; the text is under Doc rows.
- **A LilyPond-backed conversion.** It was not needed for *Pine Apple Rag*, and it is not runnable here. On the runner it is a workflow change.
- **The screen beyond the opening.** I did not look at the chorus of *Cielito Lindo* or at the trio, merged voices and written-out repeats of *Pine Apple Rag* at 342 × 740.
- **Heard music.** None.

## Follow-ups

- **More public rags (P2).** The same route may bring *Wall Street Rag* and *Eugenia* (their craigsapp editions keep the left-hand pattern in every bar), each through the spelling gate, as more ragtime options for the phone. *Magnetic Rag* needs its unspelled notes explained first.
- **The engraver (P3, observed once).** A tie across a system break shows no incoming half-arc on the next system (*Cielito Lindo*, bar 2). This is not specific to this piece.
- **Header truncation (P3).** At 342 px the header cuts "Pine Apple Rag (repeats written out)" to "(repeats …". The other long titles do the same.
- **2.4 has no piece with printed dynamics (P2).** music21's ABC reader drops `!p!`/`!f!` here, and no song on the rung prints them, though the rung is named for them.
- **The 2.4 lesson (P3).** It names *Greensleeves* for practice and no tie piece.
- **The level model on held one-position left hands (P3, recorded).** It scores the left hand's range of a fifth high; that is the gap between the model and the authored level on *Cielito Lindo*.
- **The ledger's header (P3 wording).** It says rows come from `fetch.py`; the `[MUTO]` step writes one too.

## Questions

1. **A second public ragtime.8 rag.** *Magnetic Rag* (the finder's own example) fails the spelling gate, and its tempo would be LilyPond's default. Should a follow-up work on it, or should the next public option be a rag whose left hand keeps the pattern, such as *Wall Street Rag*? A product choice; nothing waits on it.

## Files

- **New:**
  - `tools/content/import_mutopia.py`;
  - `content/sources/mutopia.json`;
  - `content/scores/authored/cielito-lindo-simple.abc`;
  - `tools/content/tests/test_import_mutopia.py`, `tools/content/tests/test_public_tie_option.py`;
  - `tools/content/tests/fixtures/mutopia/PineappleRag.ly` and `.mid`: the pinned files, public domain, byte for byte. A test compares the `.ly` with CRLF read as LF.
- **Changed:**
  - `tools/content/build.py` (step 4a, the fragment, `source_kind`, provenance);
  - `tools/content/review.py` (`SOURCE_ORDER`);
  - `tools/content/tests/test_measured_truth.py` (`SOURCES`);
  - `content/catalog.schema.json` (the enum, spliced);
  - `content/curriculum/stage-2.json` and `stage-8.json` (one id each, spliced as text, CRLF kept);
  - `content/lessons/ragtime.8.md`;
  - `app/src/curriculum/types.ts` (type only);
  - `app/tests/unit/lessonClaimsAboutApp.test.ts`;
  - `docs/02-curriculum.md`, `docs/03-content-pipeline.md`;
  - `docs/generated/ladder.md`, `docs/prompts/rung-claims.md`, `docs/prompts/inventory.md` (regenerated);
  - `docs/prompts/checks.json` (one row, spliced);
  - `content/scores/imported/SOURCES.md` (the Mutopia row only; the builds' rewrite of the other rows was put back from HEAD).
- **Pictures:** `docs/prompts/pictures/q76/`: two PNGs and `q76-pictures.json` (label and bpm field).
- **Captures:** `docs/prompts/runs/Q76/`, with this entry, every log named below and every script as `scripts-*`. That includes the picture spec and the port-4393 config, both moved out of `app/` after the runs.
- **Copied read-only from the main checkout** (`copy.txt`, robocopy 1 each): `build/cache/convert`, the three `build/*-cache.json`, `build/midi-real`, `content/scores/imported/kern` and `musetrainer` without `.git`. The main checkout's `build/cache` was not touched.
- **Fetched** (gitignored):
  - the Joplin folder's `.ly` files at `2144afd6`, into `content/scores/imported/mutopia/ftp/JoplinS/` (the measurement's copy);
  - *Pine Apple Rag*'s and *Magnetic Rag*'s published `.ly` and `.mid`, into `content/scores/imported/mutopia/published/`.
- `npm ci` ran in `app/` (`npm-ci.txt`); no junction was needed.

## The red lines

- **`red-test_public_tie_option.txt`** (exit 1, on HEAD's content with the tests written first):
  - `AssertionError: 0 not greater than or equal to 1 : 2.4's tie is kept by no option on the strict flavour`, and the same for `rhythm.ties`;
  - `'song.folk.cielito-lindo.simple' not found in [...]` (2.4's songOptions);
  - `song.folk.cielito-lindo.simple is not in the built catalogue`;
  - `FileNotFoundError` for the ABC.
- **`red-test_import_mutopia.txt`** (exit 1, before the module and the placement):
  - `ModuleNotFoundError: No module named 'import_mutopia'`, four times;
  - `AssertionError: 0 not greater than or equal to 1 : ragtime.8's stride bass is kept by no option on the strict flavour`;
  - `'song.ragtime.joplin-pine-apple-rag.mutopia' not found in [...]`.
  - The two source-list cases passed on their first run. They were written after the list, so they pin it and were never seen red.
- **`red-vitest-after-placement.txt`** (the lesson's red, from the placement):
  - `ragtime.8.md says 6, the rung offers 7`;
  - the T19 claim "first of the rung's six";
  - the batch-4 claim "five Joplin rags all come from the same non-public-domain edition".
  - Then `vitest-all-before-lesson-trim.txt` shows the three-minute rule catching the first rewrite at 639 words. The lesson now counts 598.

## Tests

| Step | Exit | Note |
| --- | --- | --- |
| `parity_reference.py` (`parity.txt`) · copies (`copy.txt`) · `npm ci` (`npm-ci.txt`) | 0 · 1 each (robocopy: copied) · 0 | the fresh-worktree steps |
| `build.py --offline`, HEAD's content (`build-baseline-personal.txt`) | 0 | reports identical to the committed ones apart from line endings |
| strict build, HEAD's content (`build-strict-before.txt`) · `validate.py --strict-license` (`validate-strict-before.txt`) | 0 · 0 | reproduces Q75's counts; the two *not judged* warnings |
| red `test_public_tie_option` · red `test_import_mutopia` | 1 · 1 | above |
| python-ly on the Joplin folder (`muto-verdicts.txt`, `pyly-mechanisms.txt`) · candidate tunes (`pdmx-tie-tunes.txt`) · the MIDI route (`midi-fetch.txt`, `midi-convert-*.txt`, `midi-route.txt`) | 0 each | the measured findings |
| `build.py --offline`, final (`build-final-personal.txt`) · strict build, final (`build-after-final-strict.txt`) | 0 · 0 | `import [MUTO] imported 1` on both |
| `validate.py` (`validate-personal-after.txt`) · `validate.py --strict-license` on the strict build (`validate-strict-after.txt`) | 0 · 0 | no *not judged* line |
| strict report and comparisons (`strict-report-after.txt`, `claims-diff-strict.txt`, `strict-flavour-check-after.txt`) | 0 | only 2.4 and ragtime.8 change |
| green `test_import_mutopia` + `test_public_tie_option` (`green-new-tests.txt`) | 0 | 21 |
| targeted content tests (`targeted-tests.txt`: measured truth, checks-for-paths, author, validate-claims, ci-order, validate) | 0 | 153 |
| `unittest discover -s tools/content/tests -t tools/content` (`content-tests-all.txt`) | 0 | 1,434, 4 skipped. The first run's one failure was the map test catching the temporary picture spec in `app/tests/e2e` (`content-tests-all-first.txt`); gone once it was moved. This run came before the last edit, the placeholder's level (`import_mutopia.py`, `mutopia.json`); the new and targeted tests, both builds and the validator re-ran after it |
| `review.py --check` (`review-check.txt`) | 0 | — |
| render check through the port-4393 override, the two items only, fresh (`render-check.txt`, `render-report.json`, `render-verdict.txt`) | 0 | both render; cursor steps equal the model's; no console, pace or hands flag |
| pictures, port 4393, one worker (`pictures.txt`) | 0 | 2 PNGs |
| the map's nine browser specs, port 4393, `--workers=2` (`e2e-map.txt`; `specs-exist-final.txt`: 9 present) | 0 | 86 passed |
| `npx tsc -b` (`tsc.txt`) · `npm run lint` (`lint.txt`) · `npm run build:app` (`build-app.txt`) | 0 · 0 · 0 | lint was 1 while the temporary config sat in `app/` |
| `npx vitest run` (`vitest-all.txt`) | 1 | 296 of 297 files. The 2 failures are the recorded `lessonClaimsAboutApp` line-ending pair (blues.3, 4.7; Entry 101, Q75's note); they read lessons this change does not touch; not re-run at HEAD here |
| `vitest-lessons.txt` (lesson shape, lesson claims, expected note) | 1 | the same recorded pair only; `expectedNote`'s one timeout in the full run passed alone (load) |
| `checks_for_paths.py` over the 25 changed paths (`checks-for-paths.txt`) | 0 | 25 matched, 0 unmatched |

Unverified:
- the Pages run: the runner's fetch from mutopiaproject.org, its strict validation and the deploy;
- the phone picking the build up;
- the music, heard;
- the screens past the first two bars of each piece.

## Doc rows

- **`docs/02`:** in this change:
  - Part C 2.4's song list;
  - the D5 note after the ragtime paragraph;
  - Part F's *Cielito Lindo* row.
- **`docs/03`:** in this change:
  - §2's `[MUTO]` row;
  - the paragraph on `[MUTO]`;
  - the `[MIDI]` row's sentence;
  - §3 step 4a.
  - The reviewer's "four fields and nothing else" note (Q75) is still open; not touched here.
- **`docs/08` — a new row, "The public build keeps 2.4's tie and ragtime.8's stride bass (Q76)":**
  - What it covers:
    - `import_mutopia` (the `[MUTO]` step): the fetch of the named files only, checked against their pins; the licence from the `.ly` header through the gate; the MIDI converter's read-back; every note spelled as the edition spells it or the row refused; the key changes from the MIDI; a placeholder with the reason otherwise; provenance `source: mutopia`, naming the edition, the published MIDI by sha256, the `.ly` and the converter.
    - The authored *Cielito Lindo (simple)*: the right hand is the reference edition's melody note for note and tie for tie; the left hand ties nothing.
    - On the strict flavour of the built catalogue (the personal build with every `personal-build`/`nc-personal-build` row unmeasured, checked against a real strict build), 2.4's tie and ragtime.8's stride bass are established by those two options.
  - What it guards against:
    - the phone's build practising neither claim;
    - a rag shipped with both volta endings played in turn;
    - a converter's key-based spelling (D♭ for C♯) on the page;
    - a tie written into a tune to satisfy the claim;
    - a MIDI-derived score called the edition's notation;
    - a fetched file that is not the pinned one shipping.
  - Tests: `tools/content/tests/test_import_mutopia.py` (source list, licence, conversion, entry, placement: 12); `tools/content/tests/test_public_tie_option.py` (ties are the tune's, header, placement, strict catalogue: 9).
  - Status: done (Q76, 2026-09-29). The runner's fetch and the Pages run are unverified until read.
- **`docs/08`, the file lines:**
  - `test_measured_truth.py`, append "and since Q76 `mutopia` among the sources a row may come from";
  - `lessonClaimsAboutApp.test.ts`, append "ragtime.8's two claims rewritten for Q76: five rags from one non-public-domain edition and Pine Apple Rag again from Mutopia; the blind button's first of seven";
  - `checks.json`'s map: "`tools/midi-cleanup/midi_to_musicxml.py` also names the content build, the validator and `test_import_mutopia.py` (Q76)".
- **Backlog, row Q76:** status "built (Q76, Entry 136): 2.4's tie established on the strict build by an authored public-domain *Cielito Lindo*; ragtime.8's stride bass by Mutopia's *Pine Apple Rag*, from its published MIDI (the reviewer's first fallback; python-ly refused per edition), spelled and keyed from its `.ly`. The two *not judged* warnings are gone on a strict build here. Verified when the Pages run on the record commit is read."
