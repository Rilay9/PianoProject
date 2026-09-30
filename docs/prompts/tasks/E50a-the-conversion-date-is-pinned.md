# E50a — The converter writes no encoding date, so the same source converts to the same bytes on any day: `<encoding-date>` is removed at `write_mxl`'s text normalisation beside `deterministic_ids`, two conversions on two dates are byte-identical, a representative PDMX reconversion equals its committed file but for that one element, and the one-time move this causes is counted by class (the E50 review's prerequisite, `responses/questions-bbd7f99a.md`:41–57, its items 1 and 2 of four; Entry 166; content tooling only; the reviewer's prerequisite to E50, sent to the reviewer before dispatch; its builder starts only on the reviewer's word (the owner's rule of 2026-09-30: every brief reviewed first))

**Read first:**
- **Procedure.** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13.
- **The ruling.** `docs/review/responses/questions-bbd7f99a.md`'s E50 section, :41–57:
  - :47, the reason: a fingerprint bump re-converts every score, *"merely because music21 emits a fresh `<encoding-date>`"*, moving file identities and making runs *appear unmet*;
  - :51–55, the four prerequisites, quoted in item 1;
  - :57, *"can be a tiny pre-seam"*.
- **E50's own account,** `docs/prompts/tasks/E50-seven-rows-print-their-tempo.md`:
  - :70, the seven raw uploads streamed read-only from `C:\Users\yalir\repos\Piano Stuff\mxl.tar.gz`;
  - :88, six files differing from their committed file *only on `<encoding-date>`*, against `normalise_archive`'s promise;
  - :89, *Weary Blues*' hand repair;
  - :144–147, its raw-file, baseline and proof steps;
  - :175–186, the fingerprint and the churn. :186 is the sequencing fact: *a pin landed before E50 would make E50's churn the seven alone*.
- **The converter,** `tools/content/convert.py` at HEAD c5988012:
  - :1539–1543, `MUSIC21_MINTED_ID` and `ZIP_EPOCH`;
  - :1546–1572, `deterministic_ids`, music21's run-dependent ids rewritten as text, and why text rather than ElementTree (the XML declaration and the DOCTYPE);
  - :1603–1625, `normalise_archive`, whose docstring promises bytes that *"depend only on its music"* and pins two wall-clock things, the zip times and the minted ids;
  - :1628–1646, `write_mxl`: both branches, the `.mxl` through `normalise_archive` and the plain XML at :1642–1645, call `deterministic_ids`;
  - :1653–1654, `CACHE_VERSION`;
  - :1677–1696, `tool_fingerprint`: the digest of `convert.py`, `abc_tools.py` and music21's version (:1690–1695), and *"the cache's entire correctness argument"* (:1681–1687);
  - :1699–1713, `cache_key`; :1762–1827, `cached_convert`; :1830–1866, `convert_file`, which writes at :1866.
  - A grep of `convert.py` for `encoding` finds only text-encoding arguments: nothing touches `<encoding-date>` today.
- **Where the date comes from.** Installed music21 10.5.0 (`pip show music21`), under `site-packages/music21/`:
  - `musicxml/m21ToXml.py`:2405–2432, `ScoreExporter.setEncoding`, called from `setIdentification` (:2303). :2431–2432 is `mxEncodingDate.text = str(datetime.date.today())`, unconditionally. The module imports `datetime` at :19.
  - The only overridable defaults it consults are `defaults.author` (:2289–2292) and `defaults.software` (:2451). `music21/defaults.py`:30–31 holds those two and nothing for a date.
- **Every writer.**
  - Callers of `write_mxl`: `convert_file` (convert.py:1866), `author.py`:246, `generate_exercises.py`:913, `excerpts.py`:451 and `bisect_render.py`:87. `excerpts.py`:422–444 (`normalise_header`) drops a cut's whole `<identification>` afterwards, the date among it.
  - music21 writers outside `write_mxl`: `import_mutopia.py`:471, a staged file re-converted through `cached_convert` at :528; `tools/midi-cleanup/midi_to_musicxml.py`:1072, an intermediate that `import_mutopia` parses back; and `bisect_render.py`:138, a diagnostic.
- **Identity.**
  - `tools/content/review.py`:264–277, `current_identity`: a notated item's built file by its sha256; a generated item by its generator triple (:268–269). `review.py`:279–288, `same_identity`.
  - `tools/content/build.py`:1066–1069 attaches it to every row, and :841–854 sets `provenance.converter.version = tool_fingerprint()[:12]`. E50's build.py pointers predate a later edit of that file; these are the lines at HEAD.
  - `tools/content/import_pdmx.py`:209–216: a committed PDMX file is copied, refused where its sha256 is not the row's `convertedSha256`.
  - `tools/content/pdmx/quarry.py`:413 (`raw_sha256`), :448 (`convert_file`), :461 (`converted_sha256`); `pdmx/commit.py`:183–184, :262.
- **The consumers of a moved identity.**
  - `app/src/data/progressStore.ts`:630–660, `contactIn`: a run whose material is the old sha makes the item read `unmet`, with `metById` (:658–660).
  - `docs/03-content-pipeline.md`:792–797: a changed file makes every earlier review event on the item stale.
  - `content/sources/excerpts.json`'s approvals (`parentSha256`). Per E50 item 8 these are three committed PDMX parents and one MuseTrainer file copied as it is; confirm.
- **The claims this makes true.**
  - `docs/03-content-pipeline.md` §3a, :364–379 (*"Neither cache can change an answer"*, :367–368).
  - `.github/workflows/pages.yml`:45–48 (*"a miss converts the same sources to the same files"*) and `ci.yml`:59–64. Today a miss on another day writes another date, so the claim is false; the comments stay as they are.
- **Tests.**
  - `tools/content/tests/test_convert_cache.py`: :26–40 (`CacheCase`); :110–154, `TestReproducible` (*"The same music must always produce the same bytes"*): :121–129 converts twice on one day, :131–138 checks the zip times, :140–153 checks the ids.
  - `tools/content/tests/test_convert.py`:25–37 (`ConvertCase`).
  - `tools/content/tests/test_excerpts.py`:225 (a cut prints no `<encoding-date>`).
  - `docs/08-test-map.md`:713–714.
- **The raw source.**
  - `C:\Users\yalir\repos\Piano Stuff\mxl.tar.gz` and `PDMX.csv` (its `mxl` column names each member as `./mxl/<a>/<b>/<cid>.mxl`).
  - `tools/content/pdmx/extract.py`:80–121, `extract_from_tar`.
- **Build scripts to reuse,** under `docs/prompts/runs/X31a/`: `scripts-setup.ps1`, `scripts-run-build.ps1` (an offline build with an absolute `--out`) and `scripts-restore.py`.

## What is decided

1. **The ruling, verbatim** (`responses/questions-bbd7f99a.md`:51–55):

   > Before E50's reconversion:
   > 1. make conversion output deterministic with respect to `encoding-date` (pin, remove, or normalise it to a stable value at the converter boundary);
   > 2. prove that a no-semantic-change reconversion of a representative corpus file is byte-stable after that fix;
   > 3. then reconvert the seven intended rows and verify only their genuine semantic/file changes move identity;
   > 4. reapply and test Weary Blues' Entry 34 hand repair as the brief already requires.

   E50a is items 1 and 2. Items 3 and 4 stay E50's.

   The goal in this brief's words: a score converted today and the same score converted next month are the same file. A cache miss then gives the bytes a hit gives, and no identity moves unless the music did.

2. **Remove the element, at the text boundary the converter already has.**
   - **What music21 offers: nothing.** `setEncoding` writes today's date unconditionally (m21ToXml.py:2431–2432). No parameter, no metadata field and no `defaults` entry controls it (defaults.py:30–31).
   - **The two ways to tell it anyway are rejected.** Patching `m21ToXml.datetime` mutates a library global for every writer in the process. Subclassing `ScoreExporter` means re-implementing `score.write`'s MusicXML and MXL path, which the whole pipeline relies on.
   - **The converter already fixes music21's run-dependent output after the write, as text,** for this reason: `deterministic_ids` (:1546–1572) and `ZIP_EPOCH` (:1543). So a third normaliser joins them, beside `deterministic_ids`, on both of `write_mxl`'s branches (:1628–1646). Every caller of `write_mxl` then gets it. The builder decides whether it is a sibling function or part of one text pass, and whether the docstring of `normalise_archive` (*"Two things in a zip are wall-clock… Both are pinned here"*) becomes three.
   - **Remove, rather than pin or normalise.**
     - A pinned constant writes a false encoding date into every file.
     - Normalising to the source edition's date would need a second reader of the source.
     - Nothing reads the element: a grep of `app/src`, `app/scripts` and `tools` finds only `test_excerpts.py`:225, asserting a cut has none.
     - The cutter already drops the whole identification block, for the same reason (`excerpts.py`:422–444).
     - `<software>` stays: it is stable per music21 version, which the fingerprint keys on.
     - The builder confirms against the MusicXML 4.0 schema's `encoding` element that none of its children is required, and says what it read.
   - **Deviate** if the installed music21's lines differ from these, or a supported option to fix the date exists. Then use the option, and say so.

3. **Red first, unit, in `test_convert_cache.py`'s `TestReproducible`** (:110–154). That class is the home of *"the same music must always produce the same bytes"*, rather than `test_convert.py`.
   - **(a) Two dates.** `cached_convert(SOURCE, …, use_cache=False)` twice, the same output name in two folders as :121–129 does, with `music21.musicxml.m21ToXml`'s `datetime` patched to a different day for each call. The bytes are identical. Red on the committed converter: the bytes differ, on the date line; that is the red line. Green after.
   - **(b)** The same through the plain-XML branch (a `.musicxml` destination).
   - **(c) The normaliser alone, on text.** The element goes with its line. `<software>`, the XML declaration, the DOCTYPE and every other line stay byte for byte. Text with no such element comes back unchanged.
   - **Mutants,** two, each killed and recorded: the normaliser dropped from the `.mxl` branch; dropped from the plain branch.

4. **The representative reconversion** (the ruling's item 2).
   - **The file.** One of E50's six, named with the reason: *Margie*, *Limehouse Blues*, *Singin' the Blues*, *Storyville Blues*, *Wabash Blues* or *Tishomingo Blues*. Not *Weary Blues*, whose committed file carries Entry 34's repair.
   - **The raw file.** Stream its member read-only out of `mxl.tar.gz`; never extract the archive whole. Check its sha256 against the row's `rawSha256`.
   - **Two conversions.** `convert_file(raw, dest)` as quarry.py:448 does, with the changed converter, twice, under two patched dates, into `build/e50a/`. The bytes are identical.
   - **Against the committed file** `content/scores/pdmx/<cid>.mxl`, compared on a copy under `build/e50a/`:
     - the new inner XML equals the committed inner XML with the element removed by the same function;
     - the new `.mxl` equals that normalised committed XML re-zipped through `normalise_archive`.

     Byte identity with the committed `.mxl` itself is impossible by construction: it carries its conversion day's date, and the new file carries none. This correction to the request's wording is said in the entry.
   - **If anything else differs,** stop there and report exactly what differs and why: a music21 change, the container, the deflate stream. Items 5 and 6 are then not run.

5. **The one-time move, measured.**
   - **The builds.** Two offline builds, each with an absolute `--out` (X31a's `scripts-run-build.ps1`):
     - *before*: the setup build on the base before any edit, with the main checkout's `build/cache` copied read-only;
     - *after*: with the change. Every cached conversion misses, because the fingerprint moved with `convert.py`'s bytes. Say that the second build re-converted everything, and give no timing.
   - **The comparison.** Compare every catalogue row's `provenance.identity`, every built score file's sha256 and every `provenance.converter.version`. Classify each changed file:
     - **Build-converted notated items** (authored, and the converted kern, MuseTrainer and Mutopia imports). Expected to move, each by the date element alone. The check: the before file's inner XML with the element removed equals the after file's inner XML.
     - **Committed PDMX copies, MuseTrainer files copied as they are, and excerpt cuts** (which carry no identification). Expected not to move.
     - **Generated exercises.** Their identity is the generator triple, so it is expected not to move. Their file bytes move once, which re-runs the render manifest and the demands cache once: a cost, not an identity.
     - **`converter.version`.** Moves on every converted item (build.py:854).
   - **The counts.** Count each class. A file that moves for anything but the date element: stop and report it.
   - **The approvals and decisions.** `review.py --check` before and after, the stale lines compared. Confirm that no approval's `parentSha256` and no D2 decision is bound to a moved identity.

6. **The fingerprint, stated honestly, and a question for the reviewer before dispatch.**
   - **The hypothesis.** The fingerprint decides only whether an old, dated payload can still be served from the cache. It does not decide whether identities move. Every build-converted file changes once, from dated to undated, whichever way the change is applied.
   - **Why the fingerprint must move with it.** Applying the removal without a fingerprint change (a normaliser outside the hashed files, say) would let a hit serve a dated file and a miss an undated one. The cache would then change the answer, against its own argument (:1681–1687) and `docs/03` §3a.
   - **So the honest price** is one move of every build-converted item's identity. It is the last: after E50a, a cold conversion on another day moves nothing. Today, by the code's reading, every cold conversion of a build-converted item on a new day moves its identity: the built authored and imported files in the main checkout carry an encoding date (so do the generated files, whose identity is their generator triple), and the excerpt cuts carry none (observed at drafting). That cold conversions have moved deployed identities before is inferred, not observed.
   - **The refuting measurement** is item 5: a build-converted identity that does not move, or one that moves for more than the date.
   - **The question for the reviewer:** is this one-time move of the build-converted identities acceptable before E50, as the price of ending the date churn? The alternative is to keep the date and leave every cold conversion moving them. The builder runs either way, and reports the measured counts beside the ruling.

7. **Not E50a's.**
   - **Data:** no committed file is re-converted or rewritten (`content/scores/pdmx/*.mxl`); `content/sources/pdmx.json` and `excerpts.json` are untouched.
   - **The cache and its callers:** `CACHE_VERSION` (the fingerprint moves with the file; a bump adds nothing); `tool_fingerprint`; `build.py`; `excerpts.py`; `generate_exercises.py`; the importers. `import_mutopia.py`:471's staged write and `midi_to_musicxml.py`:1072 are recorded as a follow-up. Their dates stop reaching the built file, but on a Mutopia-cache miss they still move `cached_convert`'s key, which is a cost.
   - **Workflows:** `.github/**`. Workflow changes go to the reviewer, and the comments become true.
   - **E50's work:** the seven rows, any tempo change, the levels, the app.

## Verification layers

**Unit.** Red first (item 3): `python -m unittest discover -s tools/content/tests -t tools/content -p test_convert_cache.py` on the committed converter, then green. Then `-p test_convert.py` and `-p test_excerpts.py`.

**The map.** `python tools/docs/checks_for_paths.py tools/content/convert.py tools/content/tests/test_convert_cache.py docs/03-content-pipeline.md docs/08-test-map.md` prints the chain. At drafting it named:
- `python tools/content/build.py --offline`;
- `python tools/content/validate.py`, run here against each absolute `--out` as `--dir <out> --allow-nc --personal`, as X31a's personal builds were;
- `python tools/content/review.py --check`;
- the whole content suite, `python -m unittest discover -s tools/content/tests -t tools/content`;
- `npx vitest run`, after the after-build: lesson tests read built content;
- `npm run build:app`.

It named no browser spec, so none is run.

**Items 4 and 5,** with their scripts and tables in the run folder.

**The product layer.** Nothing a learner sees changes. What a learner meets is identity, through stored runs' novelty (`contactIn`), and item 5 counts it. Nothing heard; *unverified as music* does not apply.

## Rules and files

**You own:**
- `tools/content/convert.py` at `write_mxl`, `normalise_archive` and the one new normaliser beside `deterministic_ids`, with their docstrings;
- `tools/content/tests/test_convert_cache.py`'s `TestReproducible`;
- `docs/03-content-pipeline.md` §3a: a sentence saying the written file carries no encoding date, and why;
- `docs/08-test-map.md`:714 (the file's line).

The two doc edits are direct, listed in `## Doc rows`.

**Not yours:** the files item 7 names.

**Base.** Origin's head at dispatch (HEAD at drafting: c5988012), stated in the entry.

**Fresh-worktree setup:**
- `npm ci` in `app/`;
- `python tools/midi-cleanup/tests/parity_reference.py`;
- the before build, on the base before any edit, with `content/scores/imported/{kern,musetrainer,mutopia}` and `build/cache` copied read-only from the main checkout. If the build cannot produce `app/public/content`, copy that folder from the main checkout and say so.
- Snapshot `docs/prompts/inventory.md`, `docs/prompts/rung-claims.md` and `content/scores/imported/SOURCES.md` before the first build, and restore them after the last; `git status` shows none of them.

**The rules.**
- Never name an AI model. Never assert a number measured on this machine.
- No commits, pushes, stashes, resets or checkouts. Never write in the main checkout.
- Temp state goes under the worktree's own gitignored `build/` (`build/e50a/`).
- The disk is nearly full. When the run is over, delete the worktree's `app/dist`, `app/test-results` and `app/node_modules`, the copied caches (a copied `app/public/content` among them) and the two build outputs, once their comparison tables are written. Keep no log over 300 KB in the run folder: keep the summary and the failing names, and say the full log was not kept.
- Every item done, or an explicit not-done line.
- When a premise here is found wrong, say so and take the better path, recording why.

## Report

**Judgement first:**
- the choice (remove), with what music21 offers at the installed lines;
- the two-date case's red line;
- the representative file's result: equal but for the element, or exactly what else differs;
- the one-time move by class, with the counts;
- whether item 6's hypothesis held.

**Then** Done / Not done / Follow-ups / Questions / Files.
- **Follow-ups:** the Mutopia staged write; E50's items 5(ii), 5(iv) and 8, which name the date and its churn and need the orchestrator's revision once E50a lands.
- **Questions:** item 6's, with the measured counts, unless the reviewer has already ruled.

After those:
- the tests table, with each test's class (add, preserve) and the old assumption: *"converting twice"* meant twice on one day;
- exit codes;
- what is unverified, beside what passes;
- `## Doc rows`.

State the technical and pedagogical verdicts separately. The pedagogical one is not applicable: no music, level or lesson changes. `operating-procedure.md` §11 and §12 apply.

**Entry 166.** Every run file goes under `docs/prompts/runs/E50a/`. The entry is `docs/prompts/runs/E50a/ENTRY.md`, starting `### Entry 166 — E50a`.
