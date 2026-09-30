# E50a — The converter writes no encoding date, and no learner's history moves because it stopped: first, in the same landing, every file the converter writes carries the identities its dated forms had over the days a stored row can name (`provenance.formerIdentities`), and the app's material equality resolves a stored identity through them at read, so a run, an encounter, a pruned run's summary or a project stored against a dated file still names the same material and no stored row is rewritten; then `<encoding-date>` is removed at `write_mxl`'s text normalisation beside `deterministic_ids`, two conversions on two dates are byte-identical, a representative PDMX reconversion equals its committed file but for that one element, and every identity the change touches is counted by whether it still resolves (the E50 review's prerequisite, `responses/questions-bbd7f99a.md`:41–57, its items 1 and 2 of four; revised on the reviewer's ruling on the first draft, `responses/questions-ecccffb7.md`:34–60 — deterministic conversion approved, broad one-time identity churn rejected; Entry 166; content tooling and the app's material equality; sent to the reviewer before dispatch; its builder starts only on the reviewer's word (the owner's rule of 2026-09-30: every brief reviewed first))

**Read first:**
- **Procedure.** `docs/prompts/operating-procedure.md` §1–§5 and §11–§13.
- **What this revision changes,** so the review reads the difference. Item 2 is new: the history-preserving plan the second ruling asks for. Items 3–6 are the approved first draft's items 2–5, their text kept, with additions marked *(added)*. Item 7 replaces the first draft's item 6, whose question the second ruling answered. Item 8 is the first draft's item 7, revised.
- **The first ruling.** `docs/review/responses/questions-bbd7f99a.md`'s E50 section, :41–57:
  - :47, the reason: a fingerprint bump re-converts every score, *"merely because music21 emits a fresh `<encoding-date>`"*, moving file identities and making runs *appear unmet*;
  - :51–55, the four prerequisites, quoted in item 1;
  - :57, *"can be a tiny pre-seam"*.
- **The second ruling.** `docs/review/responses/questions-ecccffb7.md`'s E50a section, :34–60, quoted in item 1.
- **E50's own account,** `docs/prompts/tasks/E50-seven-rows-print-their-tempo.md`:
  - :70, the seven raw uploads streamed read-only from `C:\Users\yalir\repos\Piano Stuff\mxl.tar.gz`;
  - :88, six files differing from their committed file *only on `<encoding-date>`*, against `normalise_archive`'s promise;
  - :89, *Weary Blues*' hand repair;
  - :144–147, its raw-file, baseline and proof steps;
  - :175–186, the fingerprint and the churn. :186 is the sequencing fact: *a pin landed before E50 would make E50's churn the seven alone*.
- **The converter,** `tools/content/convert.py` (these lines read at c5988012; unchanged at 6cf1daff):
  - :1539–1543, `MUSIC21_MINTED_ID` and `ZIP_EPOCH`;
  - :1546–1572, `deterministic_ids`, music21's run-dependent ids rewritten as text, and why text rather than ElementTree (the XML declaration and the DOCTYPE);
  - :1603–1625, `normalise_archive`, whose docstring promises bytes that *"depend only on its music"* and pins two wall-clock things, the zip times and the minted ids;
  - :1628–1646, `write_mxl`: both branches, the `.mxl` through `normalise_archive` and the plain XML at :1642–1645, call `deterministic_ids`;
  - :1653–1654, `CACHE_VERSION`;
  - :1677–1696, `tool_fingerprint`: the digest of `convert.py`, `abc_tools.py` and music21's version (:1690–1695), and *"the cache's entire correctness argument"* (:1681–1687);
  - :1699–1713, `cache_key`; :1762–1827, `cached_convert`; :1830–1866, `convert_file`, which writes at :1866.
  - A grep of `convert.py` for `encoding` finds only text-encoding arguments: nothing touches `<encoding-date>` today.
- **Where the date comes from.** Installed music21 10.5.0 (`pip show music21`; `tools/content/requirements.txt` pins `music21==10.5.0`), under `site-packages/music21/`:
  - `musicxml/m21ToXml.py`:2405–2432, `ScoreExporter.setEncoding`, called from `setIdentification` (:2303). :2431–2432 is `mxEncodingDate.text = str(datetime.date.today())`, unconditionally. The module imports `datetime` at :19.
  - The only overridable defaults it consults are `defaults.author` (:2289–2292) and `defaults.software` (:2451). `music21/defaults.py`:30–31 holds those two and nothing for a date.
  - The block as music21 writes it (observed at drafting in a built authored file): `<encoding>`, then `<encoding-date>YYYY-MM-DD</encoding-date>` as its first child, then `<software>music21 v.10.5.0</software>`, then three `<supports>` lines, each child at one indentation.
- **Every writer.**
  - Callers of `write_mxl`: `convert_file` (convert.py:1866), `author.py`:246, `generate_exercises.py`:913, `excerpts.py`:451 and `bisect_render.py`:87. `excerpts.py`:422–444 (`normalise_header`) drops a cut's whole `<identification>` afterwards, the date among it.
  - music21 writers outside `write_mxl`: `import_mutopia.py`:471, a staged file re-converted through `cached_convert` at :528; `tools/midi-cleanup/midi_to_musicxml.py`:1072, an intermediate that `import_mutopia` parses back; and `bisect_render.py`:138, a diagnostic.
  - `import_musetrainer.py`:291–319: a MuseTrainer file is converted through `cached_convert` where it needs normalising (:294–316) and copied as it is otherwise (:318).
- **Identity, as the build computes it.**
  - `tools/content/review.py`:240–246, `_sha256`, the raw bytes; :264–277, `current_identity`: a notated item's built file by its sha256; a generated item by its generator triple (:268–269). :279–288, `same_identity`.
  - `tools/content/build.py`:1066–1068 attaches it to every row, and :841–854 sets `provenance.converter.version = tool_fingerprint()[:12]`. E50's build.py pointers predate a later edit of that file; these are the lines at HEAD.
  - `content/catalog.schema.json`: `provenance` at :244 (`additionalProperties: false`), `identity` at :381–455. `app/src/curriculum/types.ts`:271–278, the app's `identity`.
  - `tools/content/import_pdmx.py`:209–216: a committed PDMX file is copied, refused where its sha256 is not the row's `convertedSha256`.
  - `tools/content/pdmx/quarry.py`:413 (`raw_sha256`), :448 (`convert_file`), :461 (`converted_sha256`); `pdmx/commit.py`:183–184, :262.
- **Identity, where a learner's history holds it** (the app; the build writes it, the app never recomputes it, `material.ts`:4–9):
  - `app/src/curriculum/material.ts`:38–41, `sameMaterial` (D2's `sameIdentity`, never for `none`); :97–103, `materialKey` (`file:<sha256>`).
  - **Four stored row kinds resolve material by sha256** (`app/src/data/db.ts`): a run's `material`, :200–210, with each evidence record's `context.material` inside it (`evidence.ts`:106–111, :248); an encounter's `key` and `material`, :622–627; a pruned run's summary, keyed the same way, :669–672; a project, whose `id` is the key, :737–740. `DB_VERSION` is 9 (:70).
  - Readers by equality: `progressStore.ts`:630–660, `contactIn` (:645–647 match by `sameMaterial`; a run whose material is the old sha makes the item read `unmet`, with `metById`, :659); :289, `playedCandidate`; `encounterStore.ts`:346, `familiarityIn`, and :414–420, `historyFor`'s run filter; `projectStore.ts`:121–127, `projectIn`; `curriculum/transfer.ts`:173.
  - `materialKey` as an equality proxy, not only a storage key: `encounterStore.ts`:269 (`itemKey`), :289–298 (`scopeOfFact`'s root), :324–331 (`familiarityIn`'s own key and root).
  - Lookups by key: `encounterStore.ts`:379–397 (`neighbourhood`) feeding `encountersFor` (:123–134) and `contactSummaries(near.keys)` (:412); `progressStore.ts`:668–681 (`contact` and `encountersOf`, the `byKey` index) and :759–768 (`contactSummaries`).
  - Writers of a key: `encounterStore.ts`:99, `progressStore.ts`:716 (`foldRun`) with the prune's merge by key at :1009 and :1016, `projectStore.ts`:250 (`applyNow`: an existing project found by `projectIn` keeps its own `id`, :248).
  - `app/src/data/backup.ts`:304–316: a restore joins a summary by its stored `key` and a project by its stored `id`.
  - D2's own: `app/src/review/record.ts`:246–250 (`sameIdentity`), :288–293 (`identityOf`); `DevMicroscopeScreen.ts`:726–731 hashes the fetched file for `identityOf` and compares it with the build's at :807; `content/review/decisions.jsonl` holds four events, all generator identities (observed at drafting).
- **Every hasher of a built score file's raw bytes** (a grep of `tools/content` and `app/src` for `sha256`): two produce or check the material identity — `review.py`:271 and `DevMicroscopeScreen.ts`:729. The rest key other things: the approvals' `parentSha256` and the chain key (`excerpts.py`:120–125, :614, :986); the demands cache (`build.py`:485–491, :692); the positions cache (`excerpt_proposer.py`:827); the render manifest (`render_check.py`:16–17); the catalogue's `checksum` (`common.py`:106 through `author.py`:139, `import_kern.py`:695, `import_musetrainer.py`:339, `import_mutopia.py`:537); and committed-file integrity (`import_pdmx.py`:209, `pdmx/commit.py`:262, `pdmx/quarry.py`:461).
- **Where the learner's rows live.** `docs/00-overview.md`:106 (D25): the app is served from the owner's laptop over the house Wi-Fi only while installing or updating, and runs from the service worker on the phone; :89 (D9): the Pages deploy is the testing deploy. So a stored row names the identities of whichever catalogue the device last installed.
- **The days that matter,** from `git log`: `convert.py`, `abc_tools.py` and `requirements.txt` last changed on 2026-09-16 (392890bc), the last day the converter's fingerprint moved; `normalise_archive` landed on 2026-09-06 (0886e66b); D4, which first stored a material on a run, on 2026-09-28 (9193261b). Observed at drafting in the main checkout's built content (its own build, not committed): the build-converted files music21 wrote carry four dates, 2026-09-16, -22, -27 and -29 (211 files: 172 imports and 39 authored); the committed PDMX copies carry eight, 2026-09-06 to 2026-09-22; the MuseTrainer files copied as they are carry MuseScore's own; the excerpt cuts carry none.
- **The consumers of a moved identity.**
  - The learner's history, above.
  - `docs/03-content-pipeline.md`:792–797: a changed file makes every earlier review event on the item stale.
  - `content/sources/excerpts.json`'s approvals (`parentSha256`): five at drafting — four committed PDMX parents (*Wabash Blues*, an E50 row, among them) and one MuseTrainer file copied as it is (`song.classical.beethoven-ode-to-joy.easy`, written by MuseScore 2.3.2). None is build-converted. E50 item 8's "three PDMX parents" is corrected here.
- **The claims this makes true.**
  - `docs/03-content-pipeline.md` §3a, :364–379 (*"Neither cache can change an answer"*, :367–368).
  - `.github/workflows/pages.yml`:45–48 (*"a miss converts the same sources to the same files"*) and `ci.yml`:59–64. Today a miss on another day writes another date, so the claim is false; the comments stay as they are.
- **Tests.**
  - `tools/content/tests/test_convert_cache.py`: :26–40 (`CacheCase`); :110–154, `TestReproducible` (*"The same music must always produce the same bytes"*): :121–129 converts twice on one day, :131–138 checks the zip times, :140–153 checks the ids.
  - `tools/content/tests/test_convert.py`:25–37 (`ConvertCase`).
  - `tools/content/tests/test_excerpts.py`:225 (a cut prints no `<encoding-date>`).
  - `tools/content/tests/test_measured_truth.py`:310–330, D4's *every row carries the identity the build computes*.
  - `app/tests/unit/materialIdentity.test.ts`, `contactNovelty.test.ts`, `encounterModel.test.ts`, `projectLifecycle.test.ts`.
  - `docs/08-test-map.md`:713–714, and the app files' lines at :424, :435, :562, :575.
- **The raw source.**
  - `C:\Users\yalir\repos\Piano Stuff\mxl.tar.gz` and `PDMX.csv` (its `mxl` column names each member as `./mxl/<a>/<b>/<cid>.mxl`).
  - `tools/content/pdmx/extract.py`:80–121, `extract_from_tar`.
- **Build scripts to reuse,** under `docs/prompts/runs/X31a/`: `scripts-setup.ps1`, `scripts-run-build.ps1` (an offline build with an absolute `--out`) and `scripts-restore.py`.

## What is decided

1. **The rulings, verbatim.**

   The first (`responses/questions-bbd7f99a.md`:51–55):

   > Before E50's reconversion:
   > 1. make conversion output deterministic with respect to `encoding-date` (pin, remove, or normalise it to a stable value at the converter boundary);
   > 2. prove that a no-semantic-change reconversion of a representative corpus file is byte-stable after that fix;
   > 3. then reconvert the seven intended rows and verify only their genuine semantic/file changes move identity;
   > 4. reapply and test Weary Blues' Entry 34 hand repair as the brief already requires.

   E50a is items 1 and 2. Items 3 and 4 stay E50's.

   The second (`responses/questions-ecccffb7.md`:36–60):

   > **REVISE BEFORE DISPATCH. Do not accept a one-time learner-history break caused only by metadata cleanup.**
   >
   > Removing or canonicalising music21's volatile `<encoding-date>` is the right deterministic-conversion fix. The proposed red-first reproducibility proof is also right.
   >
   > But the current brief's proposed consequence — allowing every build-converted file to change identity once, causing prior runs/projects/contact to appear unmet — is not an acceptable product cost for removing non-musical metadata.
   >
   > The invariant should be:
   >
   > > Changing only volatile conversion metadata must not change learner-facing material identity.
   >
   > Before E50 proceeds, choose a compatibility path that preserves existing learner truth. Acceptable shapes include:
   >
   > 1. **Canonical material identity:** compute identity from canonical score bytes with volatile metadata such as `encoding-date` removed, while keeping raw file bytes available separately where needed; or
   > 2. **Explicit old->new identity compatibility:** preserve the previous converted-file identity as an alias to the new deterministic bytes so existing encounters/projects/runs still resolve to the same material.
   >
   > Do not silently rewrite/delete old learner rows, and do not declare the history loss a one-time migration cost.
   >
   > If changing the global material-identity function would be too broad for E50a, make the compatibility layer a tiny prerequisite seam and then let E50a remove the date from converter output.
   >
   > The seven intended tempo repairs may legitimately change identity if their **musical bytes** change. The unrelated converted corpus must not move merely because a date disappeared.
   >
   > So:
   > - deterministic conversion: approved;
   > - broad one-time identity churn: rejected;
   > - E50a waits for a history-preserving identity plan before dispatch.

   The goal in this brief's words: a score converted today and the same score converted next month are the same file. A cache miss then gives the bytes a hit gives. And a learner who met a piece before this change has still met it after, on every device, with no stored row touched. The invariant is the reviewer's words above.

2. **(new) The history-preserving plan, first, in the same landing: an explicit old→new alias, carried by the catalogue and resolved at read.**
   - **What a stored row holds.** A file identity is the sha256 of the built file's raw bytes (`review.py`:240–246, :271; `build.py`:1066–1068). The four stored row kinds keep it (Read first). For every build-converted item that sha is the sha of a dated file.
   - **Why not canonical identity (the ruling's shape 1).** A canonical hash of the new bytes equals the canonical hash of the old. But no stored row holds a canonical hash. Each holds the sha256 of the dated bytes, and nothing reproduces that without the date. So shape 1 would still need an alias for every stored row, and it would add three things:
     - a new identity function in both identity hashers (`review.py`:271 and the microscope's `DevMicroscopeScreen.ts`:726–731), agreeing across Python and the browser;
     - every file identity moved once relative to what is stored, the committed PDMX copies, the MuseScore-written copies and the excerpt cuts included, which this plan leaves exactly as they are;
     - a staled review for any file-bound D2 decision (none exist today).
   - **So the alias (shape 2)**, the brief's choice, overturnable. The identity function, D2's record and every other raw-byte hasher stay as they are. It is E50a's first item rather than a prerequisite seam: the global identity function does not change, and the removal must never land without the alias. The builder builds and proves it before item 3, and both land together. **Deviate** if the app side proves larger than the surface named below: stop after this item's red-first cases, report, and the orchestrator splits it into a prerequisite seam.
   - **How the old identity is known: by reconstruction, not by record.** After the change, the only difference between a build-converted file and the file an earlier day wrote is the date line (item 3 removes it; items 5 and 6 prove nothing else differs). So the file a conversion on day D wrote is reproducible from the undated file. Insert music21's line for D where music21 writes it: the first child of `<encoding>`, at the indentation of the `<software>` line after it. Then re-zip through `normalise_archive`. The inverse lives beside the normaliser, so one function owns the element's text both ways. Item 6 proves it on every build-converted file: each before file equals its after file re-dated with the before file's own date, byte for byte.
   - **Which days: a window, a constant.**
     - **First day: 2026-09-06.** `normalise_archive` landed that day, so no file written before it is reproducible from the undated bytes at all. It is also the earliest date any music21 file in the main checkout's built content carries (Read first).
     - **Last day: the day E50a merges into the main checkout.** After that no build writes a date. The builder sets the constant to its run day plus 14 and says so in the handoff; a landing later than that extends it in the landing.
     - **Why a window, not the one previous catalogue.** The phone keeps the catalogue it last installed (D25). The laptop's own identities have already moved since D4: eight files are dated 2026-09-29 (observed at drafting). So the one catalogue in the main checkout names only the latest. A stored row can name a file written on any day since the converter's last move, on the laptop or in CI. CI's build computes its own variants from its own bytes, so each origin's former identities are its own.
     - **The fallback, if the reviewer judges the bytes too many:** a committed table of the before build's identities, each proved by the same reconstruction. It is the smaller data. It resolves only rows written against that one build.
     - **A benefit, not an extra.** The same window also resolves stored rows whose identity moved before E50a for the date alone (the eight files above), since the variants follow the current bytes.
   - **What the build writes: `provenance.formerIdentities`.**
     - **Where.** A row gets the field when its identity is a file the converter wrote after the change: its `<encoding>` names music21's `<software>` and carries no `<encoding-date>`.
     - **What.** The file identities (`{kind: 'file', sha256}`) of its dated variants, one per day of the window. The row's own identity is never among them.
     - **Where not.** A committed PDMX copy while it keeps its date, a MuseScore-written copy, an excerpt cut, a generated item and a `none` row carry none.
     - **Computed** beside `identity` in `attach_provenance` (`build.py`:1066–1068), from the built file, never from a record. A cache is allowed only if its key covers everything the answer depends on (the file's bytes, the window, the converter's fingerprint). The builder says whether it cached and what a warm build recomputes, without a timing.
     - **Schema and type.** `catalog.schema.json`'s `provenance` gains the field (it refuses unknown keys), and `types.ts`:271–278 does too.
     - **A later musical change** moves the bytes, and the variants follow the new bytes. A stored identity of the old music then resolves to nothing, as new material should. That is the ruling's seven: they move where their musical bytes change, and only there.
   - **What the app does with it: resolves at read and rewrites nothing.**
     - **One resolution, in `material.ts`.** A file identity whose sha256 is among a catalogue row's `formerIdentities` resolves to that row's `identity`. A sha that is some row's current identity never resolves through another row's list. Generator identities and `none` are untouched. It is fed once from the loaded catalogue (`curriculum/load.ts`), and a test can set it.
     - **`sameMaterial` resolves both sides.** So `contactIn`, `playedCandidate`, `familiarityIn`'s match, `historyFor`'s run filter, `projectIn` and `transfer.ts`:173 read a former identity as the same material with no edit of their own.
     - **Storage keys and equality keys come apart.** `materialKey` is both today. Storage keeps the row's own key: the three writers (Read first) are unchanged, and a new row carries the current identity, as now. Equality uses the resolved key: `itemKey`, `scopeOfFact`'s root, `familiarityIn`'s own key and root.
     - **Lookups ask the current key and every former key of the material:** `neighbourhood`, and through it `encountersFor` and `contactSummaries`; `contact`'s `encountersOf`.
     - **Nothing stored is rewritten or deleted.** No `DB_VERSION` move and no upgrade step: no stored row changes shape or value. No backup change: a restore keeps rows as they were stored, so a former-key summary or project may sit beside a current-key one of the same material, and every reader resolves both.
     - **D2's equality stays exact** (`record.ts`:246–250, `review.py`:279–288), the brief's choice, overturnable. A judgement binds to the bytes judged. No file-bound decision exists in the record, so none is staled.
   - **The hypothesis.** These are the whole surface where a stored file identity is compared. **The refuting test:** a grep of `app/src` for any other comparison of a stored identity or key (`.sha256 ===`, a `materialKey(...)` compared, `sameIdentity(` applied to a run's or an encounter's material). Each hit is listed, and either routed through the resolution or said why not.

3. **(approved, unchanged) Remove the element, at the text boundary the converter already has.**
   - **What music21 offers: nothing.** `setEncoding` writes today's date unconditionally (m21ToXml.py:2431–2432). No parameter, no metadata field and no `defaults` entry controls it (defaults.py:30–31).
   - **The two ways to tell it anyway are rejected.** Patching `m21ToXml.datetime` mutates a library global for every writer in the process. Subclassing `ScoreExporter` means re-implementing `score.write`'s MusicXML and MXL path, which the whole pipeline relies on.
   - **The converter already fixes music21's run-dependent output after the write, as text,** for this reason: `deterministic_ids` (:1546–1572) and `ZIP_EPOCH` (:1543). So a third normaliser joins them, beside `deterministic_ids`, on both of `write_mxl`'s branches (:1628–1646). Every caller of `write_mxl` then gets it. The builder decides whether it is a sibling function or part of one text pass, and whether the docstring of `normalise_archive` (*"Two things in a zip are wall-clock… Both are pinned here"*) becomes three.
   - **Remove, rather than pin or normalise.**
     - A pinned constant writes a false encoding date into every file.
     - Normalising to the source edition's date would need a second reader of the source.
     - Nothing reads the element: a grep of `app/src`, `app/scripts` and `tools` finds only `test_excerpts.py`:225, asserting a cut has none. *(Added:)* item 2's inverse writes it back only to compute a sha, never into a file.
     - The cutter already drops the whole identification block, for the same reason (`excerpts.py`:422–444).
     - `<software>` stays: it is stable per music21 version, which the fingerprint keys on.
     - The builder confirms against the MusicXML 4.0 schema's `encoding` element that none of its children is required, and says what it read.
   - **Deviate** if the installed music21's lines differ from these, or a supported option to fix the date exists. Then use the option, and say so.

4. **(approved; cases added) Red first.**
   - **Unit, in `test_convert_cache.py`'s `TestReproducible`** (:110–154). That class is the home of *"the same music must always produce the same bytes"*, rather than `test_convert.py`.
     - **(a) Two dates.** `cached_convert(SOURCE, …, use_cache=False)` twice, the same output name in two folders as :121–129 does, with `music21.musicxml.m21ToXml`'s `datetime` patched to a different day for each call. The bytes are identical. Red on the committed converter: the bytes differ, on the date line; that is the red line. Green after.
     - **(b)** The same through the plain-XML branch (a `.musicxml` destination).
     - **(c) The normaliser alone, on text.** The element goes with its line. `<software>`, the XML declaration, the DOCTYPE and every other line stay byte for byte. Text with no such element comes back unchanged.
   - *(Added)* **Unit, the inverse and the variants,** in a class beside `TestReproducible` (the builder names it):
     - **(d) Round trip.** For a dated music21 text, removing the line and re-inserting the same date gives the text back byte for byte. For an undated one, inserting a date and removing it gives it back.
     - **(e) The variants.** An undated music21 `.mxl` gives one identity per day of the window. Each is the sha256 of the zip that `write_mxl` wrote on that day. The test proves this against a conversion run under a patched date with the removal bypassed, which is the committed converter's output. A dated file, a MuseScore-written file and a file with no `<encoding>` give none.
     - **(f) A musical change is new material.** Change one note of the source and convert again. The first conversion's dated identity is not among the second's variants.
     - Red: the functions do not exist on the committed code.
   - *(Added)* **The build's field,** in `test_measured_truth.py` beside D4's identity test (:310–330). Every row carrying `formerIdentities` has a file identity. No former identity equals any row's current identity. A cut, a committed PDMX copy and a generated row carry none.
   - *(Added)* **The app, unit, red on the committed code.** One new file (for example `app/tests/unit/formerIdentity.test.ts`) leaves the existing files' assertions as they are. The builder may place the cases beside their stores instead, and says why. The shape of every case: a catalogue row has current identity `new` and `old` among its `formerIdentities`; a stored row names `old`.
     - **(A1)** A run of the item with material `old` → `contactIn` gives `met`, `how` `played`. Red today: `unmet`, with `metById`.
     - **(A2)** The same run under another item id → `met`, with `metAs` naming that id.
     - **(A3)** A `heard` encounter keyed `file:old` under another item id → `contact` finds it through the former key and counts `heard`. `familiarityIn` over `historyFor` gives `heard`.
     - **(A4)** A pruned run's summary keyed `file:old` → `met`, `played`.
     - **(A5)** A project keyed `file:old` → `projectIn` finds it for the item's current material. An action appends to that row, whose `id` stays `file:old`.
     - **(A6)** The equality-proxy path: an excerpt whose parent's current identity is `new`, and an encounter of the parent under `old` → it counts toward the excerpt's passage, as one under `new` does.
   - *(Added)* **Guards,** green before and after:
     - **(G1)** a stored identity that is no row's former identity stays `unmet`, as now;
     - **(G2)** a row's current identity never resolves through another row's former list, even when the same sha is listed there;
     - **(G3)** generator identities and `none` read as now;
     - **(G4)** every stored row is deep-equal before and after each read;
     - **(G5)** D2's `sameIdentity` on `old` and `new` stays false;
     - **(G6)** storage keeps a row's own key: a run naming `old`, folded by `foldRun`, gives a summary keyed `file:old` with material `old`, and a new encounter of the item is keyed `file:new`.
   - **Mutants,** each killed and recorded:
     - the normaliser dropped from the `.mxl` branch; dropped from the plain branch (the first draft's two);
     - *(added)* the resolution dropped from `sameMaterial` (A1);
     - the former keys dropped from the lookups (A3, A4);
     - storage keys resolved as well (G6);
     - the current-identity rule dropped (G2);
     - variants emitted for a dated file (the build's case);
     - the date inserted after `<software>` (e);
     - the window cut to one day (e).

5. **(approved; one check added) The representative reconversion** (the first ruling's item 2).
   - **The file.** One of E50's six, named with the reason: *Margie*, *Limehouse Blues*, *Singin' the Blues*, *Storyville Blues*, *Wabash Blues* or *Tishomingo Blues*. Not *Weary Blues*, whose committed file carries Entry 34's repair.
   - **The raw file.** Stream its member read-only out of `mxl.tar.gz`; never extract the archive whole. Check its sha256 against the row's `rawSha256`.
   - **Two conversions.** `convert_file(raw, dest)` as quarry.py:448 does, with the changed converter, twice, under two patched dates, into `build/e50a/`. The bytes are identical.
   - **Against the committed file** `content/scores/pdmx/<cid>.mxl`, compared on a copy under `build/e50a/`:
     - the new inner XML equals the committed inner XML with the element removed by the same function;
     - the new `.mxl` equals that normalised committed XML re-zipped through `normalise_archive`;
     - *(added)* the new file's variant for the committed file's own date is the committed file's sha256, and that date lies inside the window. This proves the ruling's seven before E50 runs. When E50 replaces a committed file whose music did not change, its old identity is among its former identities and nothing a learner holds moves. Where E50's tempo repair changes the music, it is not among them, and the identity moves as the ruling allows.

     Byte identity with the committed `.mxl` itself is impossible by construction: it carries its conversion day's date, and the new file carries none. This correction to the request's wording is said in the entry.
   - **If anything else differs,** stop there and report exactly what differs and why: a music21 change, the container, the deflate stream. Items 6 and 7 are then not run, and item 2's reconstruction is unproven.

6. **(approved; the comparison revised) Every identity the change touches, counted by whether it still resolves.**
   - **The builds.** Two offline builds, each with an absolute `--out` (X31a's `scripts-run-build.ps1`):
     - *before*: the setup build on the base before any edit, with the main checkout's `build/cache` copied read-only;
     - *after*: with the change. Every cached conversion misses, because the fingerprint moved with `convert.py`'s bytes. Say that the second build re-converted everything, and give no timing.
   - **The comparison, per catalogue row:** its before identity B, its after identity A, and its after `formerIdentities` F. Each row is one of:
     - **unchanged:** B equals A;
     - **resolved:** B differs from A and is in F;
     - **unresolved:** B differs from A and is not in F.
   - **The classes,** with each one's expected outcome:
     - **Build-converted notated items** (authored, and the converted kern, MuseTrainer and Mutopia imports): expected *resolved*, every one. The file-by-file check: the before file equals the after file re-dated with the before file's own date, byte for byte. That also proves the date is the only difference.
     - **Committed PDMX copies, MuseTrainer files copied as they are, and excerpt cuts** (which carry no identification): expected *unchanged*.
     - **Generated exercises:** expected *unchanged*, since their identity is the generator triple. Their file bytes move once, which re-runs the render manifest and the demands cache once: a cost, not an identity.
     - **`converter.version`** moves on every converted item (build.py:854).
   - **The counts.** Each class, by outcome. Any *unresolved* row: stop and report it with what differs. The headline for the entry is two numbers side by side:
     - the rows whose identity no longer resolves, a learner-facing move (expected 0);
     - the rows whose `provenance.identity` bytes changed and resolve through a former identity (expected: the build-converted rows music21 wrote).
   - *(Added)* **The laptop's identities.** Read the main checkout's own `app/public/content/catalog.json` in place, never writing there: the identities the laptop last served. Every one it names for a build-converted row is the after row's identity or in its F. Count them.
   - *(Added)* **Collisions and cost.** No F holds any row's current identity. Give the number of rows carrying F, and `catalog.json`'s bytes before and after, which is the window's cost.
   - **The approvals and decisions.** `review.py --check` before and after, the stale lines compared. Confirm that no approval's `parentSha256` and no D2 decision is bound to a moved identity.

7. **(replaces the first draft's item 6) The fingerprint, what the ruling settled, and the questions left.**
   - **The fingerprint moves with it**, as the first draft said. Applying the removal without a fingerprint change (a normaliser outside the hashed files, say) would let a hit serve a dated file and a miss an undated one. The cache would then change the answer, against its own argument (:1681–1687) and `docs/03` §3a. So every build-converted file's bytes change once, dated to undated.
   - **What the ruling settled.** That one move may not reach the learner. Item 2 is the answer: the bytes move once, and the material a learner holds does not.
   - **The hypothesis,** in three parts:
     - every before file is its after file re-dated, byte for byte;
     - the window holds every day a stored row's file was written;
     - item 2's surface is the whole surface.
   - **The refuting measurements:** an *unresolved* row in item 6; a reconstruction mismatch in items 5 or 6; a grep hit outside item 2's surface.
   - **The questions for the reviewer before dispatch:**
     - **(a)** Is the alias over a window, rather than canonical identity or a committed table of the before build's identities, the plan the ruling wants? Its cost is item 6's bytes.
     - **(b)** Is D2's record equality staying exact bytes right, while the learner's material equality resolves former identities?

     The builder runs on the reviewer's word either way, and reports the measured counts beside the ruling.

8. **(revised) Not E50a's.**
   - **Data:** no committed file is re-converted or rewritten (`content/scores/pdmx/*.mxl`); `content/sources/pdmx.json` and `excerpts.json` are untouched.
   - **The identity function and D2:** `review.py` (`current_identity`, `same_identity`), `record.ts`, `DevMicroscopeScreen.ts`, `content/review/decisions.jsonl`.
   - **The learner's stores' shapes:** `db.ts` (no version, no upgrade), `backup.ts`, and `projectStore.ts`, which `sameMaterial` already serves. If the builder's grep shows one of these needs an edit, it says why before making it.
   - **The cache and its callers:** `CACHE_VERSION` (the fingerprint moves with the file; a bump adds nothing); `tool_fingerprint`; `excerpts.py`; `generate_exercises.py`; the importers. `import_mutopia.py`:471's staged write and `midi_to_musicxml.py`:1072 are recorded as a follow-up. Their dates stop reaching the built file, but on a Mutopia-cache miss they still move `cached_convert`'s key, which is a cost.
   - **`<software>`:** it stays. A music21 upgrade whose only change were that line would move identities under the raw-byte function; recorded as a follow-up, not built.
   - **Workflows:** `.github/**`. Workflow changes go to the reviewer, and the comments become true.
   - **E50's work:** the seven rows, any tempo change, the levels.

## Verification layers

**Unit, red first.**
- **Python** (item 4): `python -m unittest discover -s tools/content/tests -t tools/content -p test_convert_cache.py` on the committed converter, then green. Then `-p test_convert.py`, `-p test_excerpts.py` and `-p test_measured_truth.py`.
- **App** (item 4): `npx vitest run <the new file and the four identity files>`, red, then green.
- **Mutants** (item 4), recorded in `mutants.txt`, none surviving, against unmutated controls that turn nothing red.

**The map.** `python tools/docs/checks_for_paths.py <every path touched>` prints the chain. For the first draft's paths it named:
- `python tools/content/build.py --offline`;
- `python tools/content/validate.py`, run here against each absolute `--out` as `--dir <out> --allow-nc --personal`, as X31a's personal builds were;
- `python tools/content/review.py --check`;
- the whole content suite, `python -m unittest discover -s tools/content/tests -t tools/content`;
- `npx vitest run`, after the after-build: lesson tests read built content;
- `npm run build:app`, never `tsc --noEmit -p`.

The app paths now touched will name more. Run every check it names. Run the browser specs it names at two workers, on port 4476, through a config copy not for the commit, with a storage state copied for that origin (L120b's deviation 5: the committed one names localhost:4173). No port 4173.

**Items 5 and 6,** with their scripts and tables in the run folder.

**The product layer.** Nothing a learner sees changes. What a learner meets through identity is contact novelty (`contactIn`), familiarity (`familiarityIn`) and their projects (`projectIn`). The adversaries A1–A6 read each against stored rows naming a former identity, and item 6 counts the rows that no longer resolve. Nothing heard; *unverified as music* does not apply.

## Rules and files

**You own:**
- `tools/content/convert.py` at `write_mxl`, `normalise_archive`, the one new normaliser beside `deterministic_ids`, its inverse and the window, with their docstrings;
- `tools/content/build.py` at `attach_provenance`'s identity block (:1066–1068) only;
- `content/catalog.schema.json` at `provenance.formerIdentities`, and `app/src/curriculum/types.ts` at the provenance type;
- `app/src/curriculum/material.ts` (the resolution, `sameMaterial`, the keys), and `app/src/curriculum/load.ts` only where the catalogue feeds it;
- `app/src/data/encounterStore.ts` at `itemKey`, `scopeOfFact`, `familiarityIn`'s keys and `neighbourhood`; `app/src/data/progressStore.ts` at `contact` and `encountersOf`;
- `tools/content/tests/test_convert_cache.py` (`TestReproducible` and the new class), `test_measured_truth.py` at D4's identity test, and the app test file(s) of item 4;
- `docs/03-content-pipeline.md` §3a: a sentence saying the written file carries no encoding date, and why;
- `docs/03-content-pipeline.md` at the paragraph naming `provenance.identity` (:777): what a former identity is;
- `docs/02-curriculum.md`:1079–1085 (*One material identity, the build's*): a stored identity resolves through a row's former identities;
- `docs/08-test-map.md`:714 and the lines of the test files touched.

The doc edits are direct, listed in `## Doc rows`.

**Not yours:** the files item 8 names.

**Base.** Origin's head at dispatch, stated in the entry. At drafting, HEAD was 6cf1daff; E51a's merge after it, 7d7d1e9c, touched none of these lines but `excerpts.json`'s `_comment`.

**Fresh-worktree setup:**
- `npm ci` in `app/`;
- `python tools/midi-cleanup/tests/parity_reference.py`;
- the before build, on the base before any edit, with `content/scores/imported/{kern,musetrainer,mutopia}` and `build/cache` copied read-only from the main checkout. If the build cannot produce `app/public/content`, copy that folder from the main checkout and say so.
- Snapshot `docs/prompts/inventory.md`, `docs/prompts/rung-claims.md` and `content/scores/imported/SOURCES.md` before the first build, and restore them after the last; `git status` shows none of them.

**The rules.**
- Never name an AI model. Never assert a number measured on this machine.
- No commits, pushes, stashes, resets or checkouts. Never write in the main checkout; item 6 reads its `catalog.json` in place.
- Temp state goes under the worktree's own gitignored `build/` (`build/e50a/`).
- The disk is nearly full. When the run is over, delete the worktree's `app/dist`, `app/test-results` and `app/node_modules`, the copied caches (a copied `app/public/content` among them) and the two build outputs, once their comparison tables are written. Keep no log over 300 KB in the run folder: keep the summary and the failing names, and say the full log was not kept.
- Every item done, or an explicit not-done line.
- When a premise here is found wrong, say so and take the better path, recording why.

## Report

**Judgement first:**
- the plan (item 2): the alias, the window's two days, the surface the grep found, and the bytes it costs;
- the choice (remove), with what music21 offers at the installed lines;
- the two-date case's red line, and A1's;
- the representative file's result: equal but for the element, its committed identity among its variants, or exactly what else differs;
- item 6's counts by class and outcome, with the headline pair: rows no longer resolving (expected 0) beside rows whose bytes moved and resolve;
- whether item 7's hypothesis held, part by part.

**Then** Done / Not done / Follow-ups / Questions / Files.
- **Follow-ups:** the Mutopia staged write; `<software>` on a music21 upgrade; E50's items 5(ii), 5(iv) and 8, which name the date and its churn and need the orchestrator's revision once E50a lands (E50 now inherits item 2: its date-only replacements keep their identity by construction, and only a musical change moves one).
- **Questions:** item 7's, with the measured counts, unless the reviewer has already ruled.

After those:
- the tests table, with each test's class (add, preserve) and the old assumptions: *"converting twice"* meant twice on one day, and *the same material* meant the same bytes;
- exit codes;
- what is unverified, beside what passes;
- `## Doc rows`.

State the technical and pedagogical verdicts separately. The pedagogical one is not applicable: no music, level or lesson changes. `operating-procedure.md` §11 and §12 apply.

**Entry 166.** Every run file goes under `docs/prompts/runs/E50a/`. The entry is `docs/prompts/runs/E50a/ENTRY.md`, starting `### Entry 166 — E50a`.

**Revise before dispatch 2026-09-30** (`responses/questions-ecccffb7.md`). Removing music21's volatile `<encoding-date>` is the right deterministic-conversion fix, and the red-first reproducibility proof is right. The brief's consequence — every build-converted file changing identity once, so prior runs, projects and contact appear unmet — is rejected: broad one-time identity churn is not an acceptable product cost for removing non-musical metadata. The invariant: changing only volatile conversion metadata must not change learner-facing material identity. Before the date is removed, a compatibility path that preserves existing learner truth: a canonical material identity computed from the score bytes with volatile metadata removed (the raw bytes kept separately where needed), or an explicit old→new identity alias so existing encounters, projects and runs resolve to the same material; if changing the global identity function is too broad here, that layer is a tiny prerequisite seam and E50a then removes the date. Old learner rows are never silently rewritten or deleted, and the history loss is never declared a one-time migration cost. The seven intended tempo repairs may move identity where their musical bytes change; the unrelated corpus must not move because a date disappeared. E50a waits for a history-preserving identity plan.

## Reviewer's approval and conditions (`responses/questions-f7acb2c0.md`)

**Approved for dispatch 2026-09-30, with a strict alias boundary** (`responses/questions-f7acb2c0.md`:5–53, the E50a section; on this revision, committed at 125b0328). The reviewer's words below, verbatim, are part of this brief's contract: where the text above differs, they govern, and the entry says where. Dispatch waits on the owner's usage reset (the orchestrator's hold; the reviewer: an orchestration choice that changes no review gate).

> **APPROVE FOR DISPATCH, with a strict alias boundary.**
>
> The revised direction solves the problem the previous brief did not: deterministic conversion without throwing away learner continuity.
>
> The alias approach is preferable here to changing canonical identity globally because the historical learner rows already contain the raw dated-file hashes. Preserving those old hashes as former identities lets the app continue to recognize the same musical material without rewriting user data or changing `DB_VERSION`.
>
> Keep these requirements:
>
> 1. `<encoding-date>` is removed/canonicalized at the converter's deterministic text-normalisation boundary, beside the existing minted-id and archive timestamp normalization.
> 2. The build records the known former dated-file identities for each self-converted current file.
> 3. `sameMaterial` and material-key lookup paths may resolve a stored old file identity through those former identities.
> 4. Existing stored runs, encounters, pruned summaries, projects, and their keys remain byte-for-byte untouched.
> 5. A genuine musical-byte change, such as E50's later tempo repair, is still a new current identity unless explicitly related by another reviewed mechanism.
>
> ### Alias boundary: learner continuity only
>
> Do **not** let `formerIdentities` turn historical bytes into current provenance truth everywhere.
>
> The alias is for learner-state continuity and catalogue/material lookup. It must not make systems whose question is “is this the exact current file?” treat an old dated hash as the current one.
>
> In particular:
> - D2/review records stay exact-byte identity. **Yes, keep D2 exact bytes.** A review on old bytes does not become a review on new bytes merely because the musical content is equivalent after removal of volatile metadata.
> - excerpt `parentSha256` staleness remains exact bytes;
> - committed-file integrity checks remain exact bytes;
> - render/cache/checksum identities remain whatever their owning systems currently define unless this seam explicitly proves they are learner-material identity.
>
> This distinction should be explicit in naming/API shape. Prefer something like “same learner material/current row resolves former identity” over silently widening the semantics of every generic identity comparator.
>
> ### Former-identity table
>
> The date-range reconstruction is acceptable **only as a bounded compatibility source, not as an eternal dynamic date sweep.**
>
> At build time, derive the former identities for the finite historical window in which learner rows could actually have been written against dated converted files. The brief already has the relevant repository history to bound that window. Record the resulting aliases in the built catalogue/current row so a phone does not depend on its own wall clock to rediscover them.
>
> If the builder finds local installed catalogues whose dated hashes fall outside the proven range, stop and report rather than guessing more dates forever.
>
> A committed generated table of known old identities is acceptable if that is the only robust way to preserve already-installed historical hashes; if used, it must be generated/reviewable rather than hand-maintained.
>
> ### Verification that matters
>
> The acceptance evidence should include:
> - same source converted on two different dates -> identical current bytes;
> - a stored old dated identity resolves to the current catalogue item through the alias;
> - a genuinely different musical file does not resolve merely because it shares an alias-bearing item id;
> - project/contact/run lookup by former key still finds the same material;
> - D2/review exact-byte comparison still reports the old identity as old, not current;
> - no stored learner row is rewritten.
>
> With that boundary, E50a may dispatch. E50 proper can follow after it lands.

**What they settle and ask of the builder:**
- **Item 7's questions are answered.** (a) The alias, as a bounded compatibility source: the reconstruction over a finite, proven window, recorded in the built row, never a date sweep on the device; a committed table of known old identities only if it is the only robust way, and then generated and reviewable, never hand-maintained. (b) D2 stays exact bytes.
- **The window.** The report states its two ends and what bounds each. A dated hash outside that range in a local installed catalogue (item 6's read of the laptop's `catalog.json` among them) stops the run and is reported; no date is added by guess.
- **The window's last day, ruled by the orchestrator (the reviewer's read-back asked with the plan at the next paste):** a committed constant, the lane's final build day plus 14 days, the bounded landing lag and no more, never a sweep; the report states both ends and what bounds each (the first commit that produced dated conversions, and this constant); nothing past it is derived, on the device or in the build, and a dated hash outside it stops the run and is reported.
- **Naming.** The resolution's name and API say learner material (the reviewer's *same learner material/current row resolves former identity*); no generic identity comparator is widened. The report names each exact-byte system the reviewer lists (D2/review records, excerpt `parentSha256` staleness, committed-file integrity checks, render/cache/checksum identities) and shows it untouched.
- **The acceptance evidence.** The report names, for each of the six items, the case that shows it; where no case in item 4 does, one is added.

## The window bound, changed by the reviewer (`responses/questions-71bd6cee.md`)

This replaces the orchestrator's ruling above (the lane's build day plus 14): the bounds are historical, proven from the repository's catalogues and converter epochs, never a future date; the builder was told on 2026-09-30 while building.

## E50a window-bound read-back

**Change the bound. Do not use build-day + 14 as the compatibility definition.**

The former-identity set should be bounded by **actual historical catalogues / converter epochs in which learner rows could have been written**, not by fourteen hypothetical future dates after the lane builds.

A fixed `build day + 14` creates aliases for dated files that never existed and reintroduces the synthetic-date problem I wanted bounded.

Use this rule instead:

- lower bound: the earliest deployment/catalogue version capable of writing stored material identity;
- upper bound: the latest **actual dated converted catalogue/file identity known to have been deployable before the undated conversion change lands**;
- include only identities reproduced from those proven historical dates/catalogues;
- if an installed/local catalogue exposes a dated identity outside that proven set, stop and report it, then add that concrete historical identity deliberately.

Once E50a lands, no future date aliases are ever generated. The set is historical compatibility data, not a rolling window.

D2/review and other exact-byte provenance systems remain outside this alias mechanism, as already ruled.
