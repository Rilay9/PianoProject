### Entry 181 — E50b — the repaired Wabash cut keeps its learner's history, and an old defaulted-tempo run never meets a standard against the repaired tempo

**Base.** `827289d0`, origin's head at dispatch, checked first (`git log -1`). E50's required change under the fast path (`responses/68e0479b.md`, APPROVE WITH ONE REQUIRED CHANGE), with the coordinator's four entailed additions relayed mid-lane (eight items, not seven; the catalogue marks which former identities are repairs, and a run of one of these items with no material or no base tempo is refused, never guessed; the progress row's derivations stay history, their readers listed; the cut's relation records the creating system). Nothing committed, staged or stashed; the orchestrator commits the named files. Builds ran on 2026-09-30.

**Product layer, first.** I opened no screen and heard nothing. What changes for a learner is read through the app's own functions over the rows as the build now writes them (`repairedTempoLineage.test.ts`) and through the built catalogue (`compare.txt`). No sentence on any screen changes; what can change is which rungs read met for a learner holding runs of the old files (Plan, Today, the lesson page and Skills read `rungState`). Whether each printed tempo suits its piece stays **unverified as music** (E50's).

## Judgement

**Technical verdict.**

- **The Wabash cut's relation: re-proved, recorded, learner continuity only.** The approved cut of Wabash Blues bars 1–4 now carries its old cut: `provenance.formerIdentities` `[ab221f8913be…]` beside its identity `ed2aaa19188a…` (`compare.txt` §3). The relation is `tools/content/repaired_identities.json`'s new `cuts` entry, one, for the one cut the build produced. It is recorded only because the old and new cuts are proved the same bar/staff excerpt differing only by the parent's tempo repair (`repaired-cut.txt`): the old parent rebuilt from the repaired one through its proved repair is the committed file at E50's base, byte for byte; the cutter over it with the approved definition, zipped under the laptop's creating system (0), is `ab221f8913be0384427418c639fd326119fb2f047f96eae4fa5a9a78aa9f6be8`, the cut the laptop served (E-tail's full record of the main checkout's cut; E50a's after build and its in-place read of the laptop's catalogue, *"excerpt cut: the after row's identity: 5"*; E50's before build); the cutter over the repaired parent is `ed2aaa19188a…`, which the laptop serves now (`app/public/content` and `app/dist/content`, read in place); the new cut with the parent repair's own three restore hunks put back is the old cut byte for byte; the two cuts are the same bars, staves, notes and time (4 bars, 1 staff, 20 notes, 4/4), the tempo 96 against 120, and their text differs only in the tempo direction (the boxed *= 120* words and the metronome 96/120). The build re-proves it every build (`excerpts.former_cut_identities`). **The approval stays stale exactly as before**: `excerpts.json` untouched, `parentSha256` `60f8d018…` (the old parent), `provenance.excerpt.stale.approvedParentSha256` `60f8d018…` and `parentSha256` `b896827d…`, byte-identical before and after (`compare.txt` §4); the validator's two warnings on row 5 unchanged; D2's `same_identity` keeps the two cuts apart.
- **The tempo guard: an old run's tempo channel is refused where a standard reads it now.** Every relation now says `tempoChanged`, and the build lists those old identities again as `provenance.tempoRepairedFrom` on exactly the eight rows (the seven parents and the cut; `compare.txt` §3). `rungState.meetsStandard` asks `material.tempoNotComparable` before it reads a Keep tempo run's `tempoPct`: a run that names one of those old files (under any id), or a run of one of the eight ids that names no material, records no base tempo, or records a base that is not the written one, meets a standard that asks no tempo and **no standard that asks one, however high its stored percentage** — never rescaled, never rewritten. Everything else is read exactly as before: a run of the repaired file at its written base, every run of a row no repair touched (a defaulted run and a legacy run of an unrepaired row are tested as before), the accuracy, contact, familiarity, projects and stored evidence.
- **The built catalogue by class** (`compare.txt`): 2,013 built score files, **byte-identical 2,013, changed 0**; 2,092 rows, **identity moved 0**; fields moved on 8 rows only: `provenance.tempoRepairedFrom` on the eight, `provenance.formerIdentities` on the cut; no former identity is any row's current identity; `provenance.converter.version` unmoved (`convert.py` not touched, so the tool fingerprint and the conversion cache stand: each build converted one MuseTrainer file and took the rest from the copied cache, `build-before.txt`, `build-after.txt`).

**Pedagogical verdict** (observations against the rules, not a teacher's gate).

- **What a learner's history shows.** A learner who played or heard the old Wabash cut has still met the cut: contact *met, played*, familiarity *heard*, a project kept against it still the cut's (the continuity cases now run over the eight). Their old runs stay as stored — `tempoPct` 100, `baseTempo {bpm: 96, source: 'defaulted'}`, the old material — and the history lists them as it did.
- **What a tempo standard now says of an old run.** It does not count toward a rung that asks a tempo: a run at 100 % of 96 was 80 % of Wabash's written 120 and under half of Weary Blues' 200, so it is not evidence of playing at the tempo the repaired score prints. The learner meets such a rung by playing the repaired piece at its standard; a rung that asks no tempo still counts the old run, and its pitch evidence still reaches a skill. Refusing rather than rescaling was the reviewer's second allowed path and the narrow one: a rescale needs the old base, which a legacy run does not record, and would claim a comparison the run never made. Whether a learner is better served by a rescaled partial credit is a product question no one here has asked; recorded, not decided.

## The mechanism and the discriminating tests

- **The cut had no relation because E50's proof cannot see a cut.** `convert.former_identities` (:2008) re-proves a file only where it finds an undated music21 `<encoding>`; the cutter strips the whole identification block (`excerpts.normalise_header`, :431), so the cut's old identity was *unresolved* (E50's count, 7 resolved, 1 unresolved). The alternative — the cut differs for a reason other than the parent (the cutter, the zip) — is what the re-cut refutes: the same cutter (version 2) over the two parents gives exactly the two recorded cuts, and the only zip difference between machines is the creating system `write_cut` leaves to the platform (:461–471, E55), recorded in the relation (`system: 0`) and restored in the proof, so CI re-proves the laptop's cut too.
- **The old percentage reached the rung by item id.** `rungState.read`, `case 'runs'` (:341–347), re-judges every run the rung judged by `row.itemId`, and `meetsStandard`'s Keep tempo branch read `row.tempoPct >= criteria.passTempoPct` with no base check (:207 at the base). **Red line** on the base code (`red-app-base.txt`): `E50b: a run of the old file at 100 % of the defaulted 96 meets no tempo standard of the piece whose written tempo is 120` — `AssertionError: expected true to be false`; and the rung reading `expected { … } to match object { holds: false, have: +0 }`. The discriminating case: with E50's continuity-only catalogue, or none, the same stored runs still count (`have` one per repaired row, 8 of 8), and over the rows as the build now writes them none does (`have` 0, the reading equal to a learner with no runs), so the tempo lineage, not the alias, is what refuses them (E50 had shown the alias itself never promotes).
- **The other readers of a stored tempo were ruled out at the line, not assumed.** Skill evidence reads no percentage: the only tempo condition is `keep-tempo`, the mode (`evidence.ts` :267), and a bundled song's stored evidence is never recomputed against the repaired score (`evidenceJob.candidatePhrases` refuses anything not generated, `not-generated`); `reads` and `skill` requirements read that evidence; `Scoring.evaluateOutcome` (:461–479) judges the live run against the file then loaded. `meetsStandard` has one caller (`rungState.read`, :347).

## Done

1. **The Wabash cut's relation** (the reviewer's §2): `excerpts.repaired_cuts` and `excerpts.former_cut_identities` (:675–746), read by `build.attach_provenance`'s identity pass (:1074–1099); the table's `cuts` written by `scripts-repaired-cut.py` (idempotent: a second run wrote the same bytes, `repaired-cut-rerun.txt`); the relation carries the creating system and the build restores it (the coordinator's item 4); `parentSha256` and the approval untouched.
2. **The tempo guard** (the reviewer's §3, the coordinator's items 1 and 2): `tempoChanged` on every relation; `provenance.tempoRepairedFrom` (schema, `types.ts` :292–299, build); `material.tempoNotComparable` (:123), fed by `learnFormerIdentities` (:78) from the loaded catalogue under the same current-identity rule; `rungState.meetsStandard` (:204–229). Only the repair class: the sets are empty for every row the table does not name.
3. **The progress row's derivations stay history** (the coordinator's item 3). `recordRun` (`progressStore.ts` :226–244) wrote `status`, `passedOn`, `masteredOn` and `bestTempoPct` when each run was recorded, against the file then loaded; this seam neither rewrites nor recomputes them. The readers that still show or use the old derivation, for the reviewer to rule on the residue:
   - `ProgressScreen` (:336–338, :447, :490): the passed and mastered counts and lists;
   - `LibraryScreen` (:124–126, :163): the status badge and the status filter;
   - `LessonScreen` (:273–274, :421–422): the option badges;
   - `projectStore.readOffer` → `passedOnRecord` (:110–128): G96's offers read *passed*;
   - `progressStore.learnedPieces` (:1194–1201) → `session.ts` (`ctx.learned`, :1220, :1442, :1482, and `known` at :1650): the repertoire and review ordering and the slot's reason;
   - `backup.ts` (:246): a restore's merge ranks rows by status;
   - `carryOver.ts` (:89): C5's one-time carry-over (already run on any device past C5);
   - **one is a standard evaluated now**: `recordRun` itself decides *mastered* when `masteredOn` reaches `MASTER_DAYS` (:239–242), and an old day at 100 % of 96 counts toward it beside a new day at the printed tempo; the Score screen's sheet reads it (`ScoreScreen.ts` :3848, *Mastery run N of 2*). A narrow guard there needs to know which stored day came from which base, which the row does not record: it would take a stored-shape change or a re-judging of old runs, the architecture the reviewer said to bring back rather than build. A question below.
   - `bestTempoPct` has no reader outside the store (searched: `app/src`).
4. **Red first**: Python (a) red on the base (`red-python-base.txt`: the cut relation absent, 1 failure and 3 errors in `TheRepairedCut`; `TestRepairedIdentities`' key set red on the seven); app (b) red on the base (`red-app-base.txt`: 5 of 15 red — the standard cases and the cut's relation; the continuity cases and the guards green, by design); (c) green before and after, by design.
5. **Verification**: the builds before and after, the validator, the record check, the whole content suite, typecheck, lint, the unit files, the whole unit suite, the map; below.
6. **Docs**: `

**Orchestrator's note at the landing (2026-09-30).** E50b's worktree committed by name (65ae9d5f) and merged (d5c6491f). The chain on the merged main checkout: the map's test and its minimum for the merged files (`runs/E50b/map-min.txt`), the content build offline (the reports compared), the validator, the record check, the whole content suite, then the app steps the map names — the whole unit suite on the rebuilt content, the app build, and the specs the map's minimum names where it names any (map-tests 0; map-min 0; content-build 0; content-validate 0; review-check 0; content-tests 1; vitest-all 1; build-app 0; specs-exist 0; e2e-targeted 0 — the content suite's two reds are the record's own mirror tests (`test_record_mirrors`), red until this landing's event exists and green after the record (`record-mirrors-tests`, appended) — the unit suite's two recorded line-ending assertions in `lessonClaimsAboutApp` (Entry 101's diagnosis) fail here and pass on the runner; `runs/E50b/orchestrator-exit.txt`). Your required change on E50 (`responses/68e0479b.md`, APPROVE WITH ONE REQUIRED CHANGE, Questions 2 and 3) under the fast path, with the coordinator's four entailed additions relayed mid-lane from the second read (`second-reads/827289d0.md` item E). The content chain on the merged tree: map, the content build offline, the validator, the review check, the content suite (its two reds the record's own mirror tests, green after this record), the unit suite whole (Entry 101's pair), the app build and the map's ten browser specs green. The reviewer ruled before the landing that the stored derivations stay history with a wording guard, the eight items, the repair mark and the creating system (responses/questions-26a913fe.md §4); the second read's items E and 5 were the builder's four additions. The landing clerk found no model name; the run logs' machine and worktree paths were replaced by placeholders (the branch tip 050c75cf). A docs/08 line both L120e and E50b extended was merged keeping both clauses. Pushed with the next batch.

## Doc rows`.

## Not done

- **No screen opened and nothing heard.** The product reading is the app's functions over constructed rows and the built catalogue.
- **The browser specs the map names** (ten, `checks-for-paths.txt`) were not run: no sentence on any screen changes, which is the brief's condition for a browser spec. What a screen would show differently (a rung *in progress* where an old run made it *met*) is covered at the unit layer; unverified in a browser.
- **The progress row's mastery days** (Done item 3's last reader): not guarded, by the coordinator's decision; brought back as a question.
- **CI's old cut is not related.** The table relates the laptop's old cut (system 0), the bound E50a's reviewed table uses for every historical identity; a phone that installed a CI-built catalogue before E50 held a cut zipped under system 3 (`2ac7ee4d…` if CI's music21 wrote the same text, computed here, never observed), which no relation names. Unobserved, so not recorded (no alias names a file never shown to exist); E55 is its cause.

## Deviations, with reasons

- **`tools/content/build.py` and `tools/content/excerpts.py` changed** though E50's brief kept `excerpts.py` out: the reviewer's §2 needs the cut's proof where the cut is owned. The writer (`write_cut`) is untouched (E55 stays its own row).
- **`convert.py` deliberately not touched**: the cut's proof reuses `convert._entries`, `_restored`, `archive_system`, `pinned_archive` and `former_identities` from `excerpts.py`, so the tool fingerprint, `converter.version` on 808 rows and the conversion cache all stand.
- **A catalogue field, `provenance.tempoRepairedFrom`**, rather than marking entries inside `formerIdentities`: the identity shape stays D2's `{kind, sha256}` everywhere it is read. The coordinator's item 2 asked for the mark; this is its form.
- **The guard refuses a run of one of the eight ids whose base is recorded but not `written`** (beside no material and no base, the coordinator's words): the repaired rows' base is written, so a recorded `defaulted` base is the old channel's own signature; reading the run's own record, never guessing.
- **E50's test file revised, not replaced**: `repairedTempoLineage.test.ts` keeps E50's continuity and boundary cases over the eight; its two cases that read *every rung reading and every standard the same with and without the relation* encoded a catalogue without the tempo lineage the build now writes, so they became the lineage-discriminating case (the old model kept as the comparison: E50's catalogue and none still count the old runs).
- **Two content tests revised**: `test_measured_truth`'s former-identity oracle (a cut row now carries the one proved relation; old assumption: no excerpt row carries any) and `test_convert_cache.TestRepairedIdentities`' key set (old assumption: a relation carries no `tempoChanged`).
- **The after build wrote into `app/public/content`** (the build's default), the before build into `build/e50b/before`; compared in place.

## Follow-ups (recorded, not built)

- **The relation generators rewrite each other.** E50's generator writes `repaired_identities.json` whole and would drop E50b's `cuts` and `tempoChanged`; the table's comment says to rerun E50b's after it. Attach to E58 (the relation generators' tooling), whose rule already holds: the normal build path re-proves both relation classes.
- **The Progress history line prints an old run as *97 % at 100 %*** (`ProgressScreen.ts` :200), without saying of what; after the repair a learner may read that as 100 % of the printed tempo. An observation (display wording, not a standard); for the next convergence checkpoint.
- **CI's old cut** (Not done): an observation tied to E55.

## Questions for the reviewer

1. **The mastery days.** `recordRun` grants *mastered* on two days at the master standard (`masteredOn`, `MASTER_DAYS`), and an old day at 100 % of the defaulted 96 counts beside one new day at the printed tempo. Guarding it needs the stored days' base, which the progress row does not record. Leave it as history (the coordinator's decision for this seam), or open a lane to record the base with each day?
2. **Refuse or rescale.** The guard refuses the old tempo channel. Should a later seam give partial credit by rescaling where the run records its base (100 % of 96 = 80 % of 120), or is refusal the rule for every repair class?

## Files

- **Code:** `tools/content/excerpts.py` (`repaired_cuts`, `former_cut_identities`), `tools/content/build.py` (the identity pass), `app/src/curriculum/material.ts` (`tempoNotComparable`, the lineage fed in `learnFormerIdentities`), `app/src/evidence/rungState.ts` (`meetsStandard`), `app/src/curriculum/types.ts` (`tempoRepairedFrom`).
- **Data:** `tools/content/repaired_identities.json`, `content/catalog.schema.json` (itemised below).
- **Tests:** `tools/content/tests/test_excerpts.py`, `test_convert_cache.py`, `test_measured_truth.py`; `app/tests/unit/repairedTempoLineage.test.ts`.
- **Docs:** `docs/02-curriculum.md`, `docs/03-content-pipeline.md`, `docs/05-score-follow-engine.md`, `docs/08-test-map.md`.
- **Run folder:** `docs/prompts/runs/E50b/` — this entry; the scripts (`scripts-setup.ps1`, `scripts-run-build.ps1`, `scripts-repaired-cut.py`, `scripts-compare.py`, `scripts-tempo-history.py`, `scripts-mutants.py`, `scripts-content-items.py`, `scripts-collect-logs.py`, `scripts-cleanup.ps1`) and their outputs; no log over 300 KB (the whole unit suite's trimmed to its summary). Cleanup done (`cleanup.txt`): `app/node_modules`, `app/dist`, the built content (its two tracked audio files kept), the copied libraries and the whole `build/`.
- **Not touched:** `convert.py`, `former_identities.json`, `excerpts.json`, `pdmx.json`, every score, `review.py` and D2's record, `progressStore.ts`, `db.ts`.

## Tests

| test | class | old assumption | result |
|---|---|---|---|
| `test_excerpts.TheRepairedCut` (4 tests; the refusal test holds 12 cases) | add | a cut of a repaired parent is other material | red on base (the relation absent), green |
| `test_convert_cache.TestRepairedIdentities` (committed relations) | revise | a relation carries no `tempoChanged` | red on base (the key set), green |
| `test_measured_truth` former-identity oracle | revise | no excerpt row carries a former identity | green on the after build |
| `test_measured_truth` repaired rows | extend | the seven carry the old identity only for continuity | green on the after build |
| `repairedTempoLineage.test.ts` (16) | revise and add | an old run at 100 % counts toward the rung by item id; the relation and the rung never meet | 5 of 15 red on base, 16 green |

## Mutants

`mutants.txt` (`scripts-mutants.py`), each against a green control, each file restored byte for byte (checked by sha256). **6 of 6 killed.**

- **M1, the guard removed** (`meetsStandard` reads the old percentage as if its denominator were the repaired tempo; the base code's behaviour) — killed by five `repairedTempoLineage` cases: the Wabash 100 %-of-96 case, every repaired row's old run, the legacy run, the run with no recorded base, and the lineage-discriminating case. This is also the red line of the no-base-tempo case, added after the base run.
- **M2, the relation dropped from the table** (`cuts` removed) — killed by all four `TheRepairedCut` tests.
- **M2b, the relation dropped at the build** (`former_cut_identities` names nothing) — killed by the re-proof and refusal tests.
- **M3, the guard keyed on the row alone** (a run of the repaired file itself refused too) — killed by *a run recorded after the repair … is read as before*.
- **M4, the cut's relation without the parent repair's re-proof** — killed by the refusal *a parent repair that no longer re-proves*.
- **M5, a repaired row's run with no material or no written base read as comparable** — killed by the legacy-run and no-base cases.

## Exit codes

- setup (copies, `npm ci`) — `npm ci` 0; robocopy 1 on each folder (1 means files copied). The PowerShell task reported robocopy's 1 as its own exit code (`setup.txt`).
- red, Python, on the base — 1 (`red-python-base.txt`: 8 failures, 3 errors, all the missing relation). Red, app, on the base — 1 (5 of 15, `red-app-base.txt`).
- build-before (`--out build/e50b/before`, the base code) — 0; build-after (default out, `app/public/content`) — 0; both validated inside the build (`build-exits.txt`).
- `scripts-repaired-cut.py` — 0, and 0 again on the rerun (the same bytes, `repaired-cut-rerun.txt`); `scripts-compare.py` — 0 (0 faults); `scripts-tempo-history.py` — 0; `scripts-content-items.py` — 0.
- `validate.py --allow-nc --personal` — 0 (`validate.txt`); `review.py --check` — 0 (4 current, 0 stale, the same as before); `record_mirrors.py --check` — 0 before this entry existed, **2 with it**: `entry-without-brief`, *Entry 181 names 'E50b', which no record block declares*. The lane's record block is the orchestrator's to write (a record script appends it; no brief is this builder's), so it is left for the landing.
- the whole content suite — 0: 1,639 tests, 4 skipped (`content-suite.txt`).
- `npx tsc -b` — 0; `npm run lint` — 0.
- `npx vitest run`, the whole suite — 1: 5 of 7,413 (`vitest-all.txt`). Three are not this seam's: *expectedNote*'s timeout under the full parallel load (it passes alone), *midiParity*'s missing reference (the worktree lacked the parity reference; it passes once `parity_reference.py` wrote it, `parity.txt`), and `lessonClaimsAboutApp`'s recorded line-ending pair (Entry 101's diagnosis, green on the runner). One was mine: *docsConsistency* read `cut.py` out of my `docs/03` sentence naming the generator's file, so the sentence names the folder instead, as E50's does. The four files rerun alone — 1: only the line-ending pair red (`vitest-rerun.txt`). The touched and adjacent unit files (`repairedTempoLineage`, `formerIdentity`, `rungStateFromEvidence`, `rungMastery`, `materialIdentity`) — 0: 72 tests (`green-app-lineage.txt`).
- `npm run build:app` — 0 (`build-app.txt`).
- `scripts-mutants.py` — 0 (6 of 6 killed).
- `checks_for_paths.py` — 0 (`checks-for-paths.txt`). **Run as the map writes it:** the content build (as `--offline`), validate, the record check, record mirrors, the whole content suite, tsc, lint, the whole unit suite, the app build. **Not run:** the ten browser specs (Not done). No `docs/prompts/checks.json` row touched: every path falls under a row the map already names.
- The build rewrote `content/scores/imported/SOURCES.md` (the offline fetch stamps the copied libraries' date and no revision) and `docs/prompts/inventory.md` and `docs/prompts/rung-claims.md` (line endings only, the same text): outside this change, all three restored from `git show HEAD:` with the checkout's line endings; `docs/generated/ladder.md` was not rewritten.

## Itemised content and relation-table changes (operating-procedure §12)

No score byte, no `pdmx.json` or `excerpts.json` row, no lesson, curriculum or vocabulary entry changes. The built catalogue changes only as `compare.txt` §2 lists (generated, not committed). The committed changes, each one item (`content-items.txt`, generated from the diff against the base):

`tools/content/repaired_identities.json` (the relation table; not under `content/`, itemised because it decides which old material a learner's history names):

1. `_comment` — before: E50's text; after: E50's text, byte for byte, with one sentence appended (verbatim in `content-items.txt`): every relation says `tempoChanged`; `cuts` holds the one derived repair relationship the build produced, re-proved every build; learner continuity only, the approval stale and its `parentSha256` unchanged; the order of the two generators. Reason: the table says what it now holds.
2. `repairs[song.pop.margie.pdmx]` — `tempoChanged` absent → `true`; nothing else. Reason: the old file played at the converter's 96, the repaired one at 160.
3. `repairs[song.jazz.django-reinhardt-limehouse-blues.pdmx]` — `tempoChanged` absent → `true` (96 → 184).
4. `repairs[song.blues.singin-the-blues]` — `tempoChanged` absent → `true` (96 → 120).
5. `repairs[song.blues.weary-blues]` — `tempoChanged` absent → `true` (96 → 200).
6. `repairs[song.blues.storyville-blues]` — `tempoChanged` absent → `true` (96 → 132).
7. `repairs[song.blues.wabash-blues]` — `tempoChanged` absent → `true` (96 → 120).
8. `repairs[song.blues.tishomingo-blues]` — `tempoChanged` absent → `true` (96 → 132).
9. `cuts` — absent → one relation, `excerpt.blues.wabash-blues.b1-4`: `file` `scores/excerpts/excerpt.blues.wabash-blues.b1-4.mxl`; `change` (the approved cut of Wabash Blues bars 1-4, both hands, re-cut from the repaired parent, differing from the old cut only by the parent's tempo repair); `of` `song.blues.wabash-blues`, `fromBar` 1, `toBar` 4, `selection` `both`, `cutVersion` 2 (the approved row's definition and the cutter in force); `parentFrom` `60f8d018899c70b1dd3c09e0d48e7e24d61efedb68e6ac67d5451c8572338208`, `parentTo` `b896827d97beb8a30aad9a9fcc4ab49244959bdd663857a8a506833c2e115c13` (the Wabash repair's two files); `from` `ab221f8913be0384427418c639fd326119fb2f047f96eae4fa5a9a78aa9f6be8` (the old cut the laptop served), `system` 0 (the laptop's `zipfile`), `to` `ed2aaa19188ac3c90ba0a1dc34c1e6e64d73ddaab3f67cdd3a5c62a82d4d8f89` (the new cut, zipped the same way); `tempoChanged` `true` (96 → 120). Reason: the reviewer's §2, proved as `repaired-cut.txt` records.

`content/catalog.schema.json`:

10. `$defs.item.properties.provenance.properties.formerIdentities.description` — before: E50's text, ending *"…re-proved by the same function (the file with the repair's restore lines and the old date put back is the old file's bytes). Only on a row whose file the converter wrote without a date; never the row's own identity. Learner continuity only: D2's review record and every exact-byte check read `identity` alone."*; after: the same up to *"…is the old file's bytes)."*, then *"E50b: on the approved Wabash cut, re-cut from that repaired parent, its old cut (the table's `cuts`: the one derived repair relationship the build produced, never a rule for other descendants), re-proved by `excerpts.former_cut_identities` (…). Only on a row whose file the converter wrote without a date, or that cut; never the row's own identity. Learner continuity only: D2's review record, an excerpt approval's `parentSha256` and staleness, and every exact-byte check read `identity` alone."* (verbatim in `content-items.txt`). Reason: the cut now carries one.
11. `$defs.item.properties.provenance.properties.tempoRepairedFrom` — absent → an array of file identities (`kind` `file`, `sha256` 64 hex, `minItems` 1, no other key), with its description (verbatim in `content-items.txt`). Reason: the provenance object refuses unknown keys, and the build now writes the field.

Nothing else in the schema changed (`content-items.txt`: *anything else in the schema changed: False*); `git diff --stat 827289d0 -- content/ scores/` names only the schema.

## What is unverified

- Nothing heard; no screen opened; the browser specs not run (no sentence changes).
- CI has not built this tree: the cut's relation re-proving under CI's zip system is argued (the proof pins the system) and unit-tested with the platform's own cut, not observed on a Linux runner.
- The phone's stored rows were not read: how many old runs of the eight a learner holds, and so whether any rung's state changes for the owner, is unknown.

## Doc rows

- `docs/02-curriculum.md`, *One material identity*: the Wabash cut's relation and `provenance.tempoRepairedFrom`; *A rung is met by the evidence its requirements name*, `runs`: a Keep tempo run whose percentage is of a tempo a reviewed repair corrected meets only a rung that asks no tempo.
- `docs/03-content-pipeline.md` §4a: the table's `cuts`, how the build re-proves the cut (the creating system restored), `tempoChanged` and `provenance.tempoRepairedFrom`.
- `docs/05-score-follow-engine.md`, the rung's numbers: a run's percentage is of its base; the rung state's refusal where a repair corrected the base; the progress row's derivations history.
- `docs/08-test-map.md`: the `repairedTempoLineage.test.ts`, `test_convert_cache.py`, `test_excerpts.py` and `test_measured_truth.py` lines extended.
- `content/catalog.schema.json`: `formerIdentities`' description, and `tempoRepairedFrom`.
