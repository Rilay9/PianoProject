# CL17 Phase 1 — classified trace

Base: `dfda4d71a45b59b982a81072bb76a0b9d3e31245`. Source reading only: no code, curriculum, persisted rows or generated output changed. Runtime behavior, rendered designs and music are unverified.

## Findings that change the build

- The scalar already orders eligible material in `selectors.ts:220`, `session.ts:1396–1425,1532–1547,2385`; the two band reads in session are distance anchors, not admission gates. Removing them requires a replacement ordering anchor, not a new coping gate.
- The app's admission is `eligibility.ts` → `candidates.ts` → `eligibilityCore.ts`; needs/opportunity and taught demands already own it. `candidates.ts:413` still projects a level fact with false authored confidence. The fact must be retired independently of preserving admission.
- Build admission still reads scalar: `validate.py:511–535` rejects options outside authored bands, `590` core reach uses stage+2, and `candidates.py` filters by band. Removing only `level_band_errors` leaves the reach gate. `validate.py:1990–2025` writes diagnostic `needs.inBand`, which is not the demand-needs contract.
- Library (`LibraryScreen.ts:160`) and folder (`FolderScreen.ts:109–110`) use scalar filters; the settled sorting-only rule means these are consumers to retire too, not merely relabel.
- Paper assignment (`ShelfScreen.ts:139–140`) seeds a level from a rung band. It is a writer, not a gate. Runtime import default 5 (`importStore.ts:1250`) is a compatibility placeholder, not a measured estimate.
- `projectSheet.ts:91–116,262–287` has no scalar display. Its existing state/history/contact must remain; demand context would be an addition, not replacement of an existing L label.

## Runnable coverage searches

Run at the named base. These are searches actually run (some broad results were sampled for orientation; the inventory below was generated from complete tracked-file reads, not truncated tool output).

```bash
git grep -n -E '\b(level|levelSource|levelBand|abrsmGradeApprox|levelConfidence|levelLabel)\b' -- app/src tools content ':!*.json' ':!*.xml' ':!*.musicxml'
git grep -n -E '(levelSource|levelBand|abrsmGradeApprox|levelConfidence|levelLabel|\.level\b)' -- app/src tools ':!*.json'
git grep -n -E 'minLevel|maxLevel|levelMin|levelMax|\.levels\b|levelOverrides|LevelOverride|BookPiece|FolderScore|applyLevelOverrides' -- app/src
git grep -n -E 'levelBand|abrsmGradeApprox|levelSource|levelConfidence|levelLabel|\.level\b' -- ':!docs' ':!app' ':!content' ':!tools' ':!prompts' ':!*.md'
rg -n 'level|Level' content/catalog.schema.json content/curriculum.schema.json
rg -n 'level|Level' app/src/data/backup.ts app/src/curriculum/load.ts app/src/ui/projectSheet.ts
rg -n 'level_band_errors|core_reach_errors|taught_at|untaught|coping' tools/content/validate.py
rg -n 'level|band' tools/content/finder.py
test -e app/public/content/catalog.json
test -e app/public/content/curriculum.json
```

For the literal-location tables rerun this complete search (includes snake-case producers; zero hits outside covered operational roots in the checked root-level search):

```bash
git grep -n -E '\b(level|levelSource|levelBand|abrsmGradeApprox|levelConfidence|levelLabel|level_source|level_band|level_confidence)\b' -- app/src app/tests tools content
git grep -n -E '\b(minLevel|maxLevel|levels|LevelOverrideRow|levelOverrides|applyLevelOverrides|serialiseImport|deserialiseImport)\b' -- app/src
```

Coverage classes:

| Class | Coverage and limit |
| --- | --- |
| Literal names | Tracked TS/JS/Python/JSON/ABC/CSV/YAML operational sources searched; source locations below. Comments are included only in the literal ledger, never consumer counts. |
| Destructuring / spread | `load.ts:280–295` passes whole imported/bundled objects; `levelOverrides.ts:77` overrides spread; `booksStore.ts:151–174` spreads additions/patches; `importStore.ts` spreads corrected rows; `folderLibrary.ts:1515,1946` whole row projection. `backup.ts:61–72` spreads imports; `83–105,132–180` whole-store JSON. These carry fields without literal reads. |
| JSON/content keys | Every matching tracked content file has its complete line list below; nested generator params remain distinct from item-level metadata. |
| Generated artifacts | Exact checks found `app/public/content/catalog.json` and `curriculum.json` absent. Producer pathways traced; emitted bytes, untracked output and external folder manifests excluded because unavailable. Do not claim generated-artifact completeness. |
| Database migrations | `db.ts:1213` adds override store; `1221–1234` migration labels legacy imports judged. Stored schemas and folder index below. Actual device rows unavailable. |
| Backup/import | `backup.ts` exports every `STORE_NAMES` store, serialises import bytes while spreading metadata, restores row-shaped objects. Level-bearing stores therefore survive even without literal scalar matches. Restore is a migration boundary. |
| Python dictionaries | Snake-case arguments plus `.get`, subscripts and dictionary writers searched. Generic `common.catalog_entry` and `item.update(optional)` preserve optional ABRSM. |
| UI helpers | `widgets.levelLabel`, `rungFor.ts`, screen forms, Library/folder filters, dev displays and project sheet inspected. Demand formatter implementation to be shared from existing measurement/vocabulary helpers, not invented scalar-to-demand conversion. |

## Stored-data ownership and migration boundary

`db.ts:538,558`: imports; `653–657`: overrides (`itemId,level,at`); `818–854`: folder scores and score rows; `903`: derived numeric folder index; `985–996`: book pieces nested in books. `db.ts:1037,1041,1213,1221–1234,1427` defines and migrates stores. `booksStore.ts:174` patches arbitrary piece fields; `importStore.ts:1215` allows scalar/source patch; `levelOverrides.ts:86` creates timed human override.

Name migration **legacy-level-to-sort-estimate**; do not build it. Preserve item IDs, material fingerprints, project states, sessions, evidence, encounters, lessonIds, book twin links and override timestamps. Existing human overrides become human-provenance estimates with their known time; do not invent a named human identity. Legacy judged generated rows must not become human judgement. Unknown legacy source must remain legacy/unknown provenance until recomputed, not fabricated model-version provenance. Folder manifest values need manifest provenance until remeasured. Rebuild folder numeric indices from the single canonical value after migration. Old backup restore must run the same reader once, rather than writing a second live scalar.

**Stop boundary reached:** changing these stored row shapes is a stored-schema change named by the brief. Phase 2 needs the migration/provenance decision; Phase 1 still inventories it. The shim is read-only at compatibility entry points and removed after legacy backups/manifests can be converted; no fixed calendar lifetime is claimed.

## Classified item-scalar consumers

A row is one semantic consumer boundary, with its exact source locations; several expressions in one function are grouped rather than counted as separate tasks. Counts below apply only to these rows. Comments, recipes, audio levels, historical test-run outputs and fixture occurrences are not included in consumer counts. Contract rows are stored-shape declarations, not executed writes. The full operational hit ledger below accounts for literal matches omitted from the semantic table.

| Location | Access | Class | Meaning |
| --- | --- | --- | --- |
| `app/src/curriculum/candidates.ts:83,201,379,392,413,462` | read/write | compatibility | Recommendation estimate contract and candidate fact projection; notated item maps source to authored/inferred; reconstructed item placeholder 0. |
| `app/src/curriculum/selectors.ts:124–125,220` | read | sort or tie-break | Confidence function and alternative distance sorting. Missing source treated judged. |
| `app/src/curriculum/session.ts:1396,1418` | read | sort or tie-break | Transfer offer distance to rung band after admission. |
| `app/src/curriculum/session.ts:1532,1537` | read | sort or tie-break | Fallback demand distance to rung band after admission. |
| `app/src/curriculum/session.ts:1547` | read | sort or tie-break | Source-based ordering among equals. |
| `app/src/curriculum/session.ts:2385` | read | sort or tie-break | Lowest item scalar chooses a reading item; recipe field remains separate. |
| `app/src/curriculum/rungFor.ts:33–65` | read | display | Converts FolderScore scalar into inferred stage/unit label and estimate sentence; only callers are FolderScreen:1107,1114. This is the scalar-as-address conflation to retire, not a stored scalar writer. |
| `app/src/curriculum/types.ts:54,64,128,626,642` | contract | stored | Item scalar/source/ABRSM, lesson band and stage descriptive ABRSM. Item ABRSM goes; stage descriptive text may remain. |
| `app/src/data/booksStore.ts:145,151–174` | read/write | stored | Adds default estimated source, then whole-object piece patches; nested books preserve scalar. |
| `app/src/data/db.ts:538,558,655,824,904,995–996,1037,1041` | contract | stored | Imports, overrides, folder score/index and books; scalar columns are persisted data, not learner ability. |
| `app/src/data/db.ts:1213,1221–1234` | write | compatibility | Adds override store and labels old imports with present scalar/no source judged. Migration must not invent human judgement from that legacy label. |
| `app/src/data/folderLibrary.ts:365–396,427–432` | write | stored | Manifest scalar parse; bare score unknown/null. |
| `app/src/data/folderLibrary.ts:1515,1566–1588,1897,1946` | read/write | stored | Whole row projection and scalar-to-parallel-index array; unknown represented NaN. |
| `app/src/data/folderLibrary.ts:2171,2257–2260` | read/write | stored | Copies rounded manifest scalar into an imported row. |
| `app/src/data/importStore.ts:614` | write | stored | Adds runtime estimate provenance fact. |
| `app/src/data/importStore.ts:841–845` | read/write | stored | Hands correction re-estimates unless human-labelled source. |
| `app/src/data/importStore.ts:945–953` | read/write | stored | Remeasurement updates latest row unless now human-labelled. |
| `app/src/data/importStore.ts:1215` | write | stored | Generic patch type permits scalar/source edits. |
| `app/src/data/importStore.ts:1250,1255` | read/write | compatibility | Catalog overlay maps missing scalar to 5 and missing source to estimated. |
| `app/src/data/levelOverrides.ts:44,57,71–77,83–99,107–111` | read/write | stored | Load/read human override, spread it over catalog row, set timestamp, clear override. |
| `app/src/curriculum/load.ts:280–295,309–316` | read | compatibility | Whole catalog/import projection plus override application; invalidates cache on override changes. |
| `app/src/data/backup.ts:61–72,83–105,132–180,274–335` | read/write | stored | Generic row/spread serialization exports scalar-bearing stores even without literal level hits. importAll restores imports through deserialiseImport (:307) and other scalar-bearing stores through generic put (:335). |
| `app/src/main.ts:10,90` | read | compatibility | Primes override cache at startup. |
| `app/src/score/difficulty.ts:76,80,338,341,362` | read/write | compatibility | Estimate result contract, fallback bins and model output; derived scalar calculation survives. |
| `app/src/score/estimateImport.ts:26,56` | read | compatibility | Loads committed level model, returns estimate value for imported notation. |
| `app/src/ui/assignSheet.ts:24–25,208–222,270–289,304` | read/write | stored | Form shows default/estimate, writes numeric input and source; corrective estimate refreshes untouched input. |
| `app/src/ui/importSheet.ts:377,410` | read | display | Updates visible estimated value after saved import correction. |
| `app/src/ui/screens/DevExcerptView.ts:93–94,562` | read | display | Developer view shows cut-local estimate/source. |
| `app/src/ui/screens/DevMicroscopeScreen.ts:565` | read | display | Developer diagnostics scalar/source line. |
| `app/src/ui/screens/FolderScreen.ts:109–110,524–586` | read | eligibility or gate | Learner browse scalar range filters parallel index; not automatic curriculum admission. |
| `app/src/ui/screens/FolderScreen.ts:658,1107–1117` | read | display | Estimated scalar and scalar-derived rung explanation. |
| `app/src/ui/screens/LabScreen.ts:321–322` | write | stored | Writes generated import placeholder 3 with estimated source. |
| `app/src/ui/screens/LessonScreen.ts:286` | read | display | Item metadata through levelLabel. |
| `app/src/ui/screens/LibraryScreen.ts:160` | read | eligibility or gate | Scalar min/max browse filter. |
| `app/src/ui/screens/LibraryScreen.ts:187` | read | sort or tie-break | Scalar ordering of library items. |
| `app/src/ui/screens/LibraryScreen.ts:738,768,817,907,963,1114` | read | display | Details/scalar-source caveat, alternatives, override/edit input and row metadata. |
| `app/src/ui/screens/LibraryScreen.ts:982–984` | write | stored | Edit dialog persists changed imported scalar through updateImport. |
| `app/src/ui/screens/ProgressScreen.ts:754–755` | read/write | compatibility | Paper-piece catalog projection copies scalar/source for shared helpers. |
| `app/src/ui/screens/ShelfScreen.ts:130,139–140` | read/write | stored | Paper form displays level; rung band prefills estimate. |
| `app/src/ui/screens/ShelfScreen.ts:252` | write | stored | New paper piece assigned estimated source. |
| `app/src/ui/screens/ShelfScreen.ts:485` | read | display | Paper row uses levelLabel. |
| `app/src/ui/screens/SkillsScreen.ts:137` | read | sort or tie-break | Related items ordered by scalar/title. |
| `app/src/ui/screens/SkillsScreen.ts:343` | read | display | Related-item metadata. |
| `app/src/ui/screens/TodayScreen.ts:477,587,846,887,1052` | read | display | Choices, rows and session metadata use levelLabel. |
| `app/src/ui/widgets.ts:375` | read | display | L-number/approximation formatter. |
| `tools/content/author.py:41,99,124,145` | read/write | stored | ABC metadata required level, parse and catalog write; optional item ABRSM. |
| `tools/content/common.py:273–274,282` | write | stored | Shared catalog-entry scalar/source writer; optional spread carries ABRSM. |
| `tools/content/build.py:974–977,1060` | read/write | stored | Attaches estimate/authored provenance and excerpt-local estimate fact; schema/content output flows whole entries. |
| `tools/content/generate_exercises.py:965,969–970` and generator factory calls listed in ledger | write | stored | Every generated catalog scalar/source is written by metadata/catalog_entry; recipe-derived number falsely marked judged. |
| `tools/content/import_kern.py:510,515–516,664,710–711,730,756–757,776` | read/write | stored | Group/override metadata, estimate-versus-judged tagging, song and licence-placeholder catalog writes, ABRSM. |
| `tools/content/import_musetrainer.py:214–215,230,262–263,278,326,329,345` | read/write | stored | Song/placeholder catalog level/source and ABRSM from source table. |
| `tools/content/import_mutopia.py:484–485,533` | read/write | stored | Placeholder estimate or score-model estimate. |
| `tools/content/import_pdmx.py:134,148` | read/write | stored | Copies quarry number/source; default number 4 is not fresh measurement. |
| `tools/content/excerpts.py:488,546–547` | read/write | stored | Cut model estimate copied to new excerpt with estimated source. |
| `tools/content/excerpt_proposer.py:778,991–992` | read/write | display | Proposal context/report carries parent scalar/source for workbench; score_window explicitly does not rank windows by scalar. |
| `tools/content/export_levelling_fixture.py:67` | write | compatibility | Python estimate exported for parity fixture. |
| `tools/content/difficulty.py:101–108,446,493,594,633–640` | read/write | compatibility | Estimate serialization, fallback and model/calibration arithmetic; item scalar derivation retained. |
| `tools/content/fit_level_model.py:46,65,111–118` | read | compatibility | Calibration cohort filtered by judged song and read into samples; unlike eligibility, this needs human provenance. |
| `tools/content/add_technique_units.py:131–132` | read | eligibility or gate | Candidate exercise selection by scalar interval. Tool must not author placements via sort estimate. |
| `tools/content/candidates.py:169,193–199,232–234` | read | eligibility or gate | Rung band/default and low/high scalar filter, including relaxed searches. |
| `tools/content/candidates.py:238,247` | read | sort or tie-break | Candidate/report ordering. |
| `tools/content/candidates.py:122–123` | read | display | Candidate scalar/source indicator. |
| `tools/content/claims.py:815,822` | read | display | Scalar-bucket and estimated-source report totals. |
| `tools/content/dump_score.py:68` | read | display | Diagnostic catalog dump. |
| `tools/content/ladder_report.py:35–37,119,137–138,169` | read | display | Derived band and scalar song/report text; sorted diagnostic examples. No admission verdict. |
| `tools/content/rung_audit.py:129–135` | read | display | Flags wide band as an audit finding, not material eligibility. |
| `tools/content/pdmx/commit.py:199–201` | read/write | stored | Copies quarry scalar/source into content source record, or numeric override with estimated source. |
| `tools/content/pdmx/quarry.py:102–103,436–439,496–499` | read/write | stored | Quarry result row estimates current model from measured features, including reused previous rows. |
| `tools/content/pdmx/manifest.py:62,81` | read/write | stored | Manifest positional level column exported for folder parsing. |
| `tools/content/pdmx/index.py:193,235,315` | read/write | compatibility | Distinct pre-quarry CSV proxy estimate/model fit. Not the canonical score-based item estimate; preserve proxy provenance. |
| `tools/content/pdmx/index.py:363,406,430,439,450,511` | read/write | display | Proxy browse report/table and range controls. |
| `tools/content/pdmx/index_page.js:61–62` | read | eligibility or gate | Archive browse proxy-level filter. |
| `tools/content/pdmx/index_page.js:128` | read | display | Archive proxy-number display. |
| `tools/content/pdmx/review.py:77–78,122` | read | display | Fallback estimate warning and quarry workbench scalar/driver display. |
| `tools/content/validate.py:148,151,168,2166,2171` | read | display | Estimated-source and exercise scalar-bucket report. |
| `tools/content/validate.py:511–535` | read | eligibility or gate | Option scalar membership in authored rung band; build error. |
| `tools/content/validate.py:590–624` | read | eligibility or gate | Core reach stage+2 scalar ceiling with family/plan exemptions; separate build error. |
| `tools/content/validate.py:2001–2008` | read/write | display | Writes diagnostic needs.inBand count; distinct from demand-opportunity needs. |

## Full operational hit ledger

Literal matches by file: all listed line numbers, no copied log/JSON bodies. This includes comments and excluded homonyms so a rerun can distinguish a missed consumer from a harmless hit. `app/build`, historical runs/documents, dependency directories and other test-output artifacts are excluded; none is an operational producer.

### Source

| File | Matching lines |
| --- | --- |
| `app/src/audio/backingLoop.ts` | 241, 245, 246, 247, 257, 268, 269, 270, 271, 278 |
| `app/src/audio/loopbackLatency.ts` | 79, 263 |
| `app/src/audio/loopbackMessages.ts` | 12 |
| `app/src/audio/pitch/MicSource.ts` | 13, 85, 126, 169, 276, 418 |
| `app/src/audio/pitch/calibration.ts` | 12, 66, 215 |
| `app/src/audio/pitch/detector.ts` | 345 |
| `app/src/audio/pitch/dsp.ts` | 344, 381 |
| `app/src/audio/pitch/messages.ts` | 50, 53 |
| `app/src/audio/pitch/pitchProcessor.ts` | 157, 176 |
| `app/src/curriculum/candidates.ts` | 70, 83, 201, 379, 392, 413, 462, 736 |
| `app/src/curriculum/eligibility.ts` | 149 |
| `app/src/curriculum/excerpt.ts` | 4 |
| `app/src/curriculum/load.ts` | 309 |
| `app/src/curriculum/material.ts` | 167 |
| `app/src/curriculum/rungFor.ts` | 2, 4, 6, 12, 20, 27, 29, 31, 33, 34, 37, 38, 41, 44, 49, 62, 63, 64, 65 |
| `app/src/curriculum/selectors.ts` | 117, 119, 124, 125, 149, 152, 154, 171, 173, 174, 220, 223 |
| `app/src/curriculum/session.ts` | 410, 468, 489, 1383, 1396, 1418, 1502, 1503, 1532, 1537, 1545, 1547, 1767, 1768, 1819, 2385, 2550, 2602 |
| `app/src/curriculum/types.ts` | 27, 50, 54, 56, 60, 64, 128, 371, 625, 626, 642 |
| `app/src/data/booksStore.ts` | 145, 154, 156 |
| `app/src/data/db.ts` | 327, 330, 538, 554, 558, 650, 655, 824, 903, 942, 995, 996, 1221, 1230, 1231, 1241 |
| `app/src/data/folderLibrary.ts` | 195, 396, 432, 582, 662, 955, 1079, 1102, 1586, 1587, 1588, 2168, 2257, 2260 |
| `app/src/data/folderWalk.worker.ts` | 29, 44, 67 |
| `app/src/data/importStore.ts` | 63, 64, 273, 462, 614, 799, 802, 841, 842, 843, 844, 845, 886, 945, 946, 951, 952, 953, 1028, 1215, 1241, 1250, 1252, 1255 |
| `app/src/data/levelOverrides.ts` | 7, 11, 57, 77, 83, 86, 92 |
| `app/src/demands/detect.ts` | 494 |
| `app/src/engine/Scoring.ts` | 695 |
| `app/src/engine/drills/fromCatalog.ts` | 526, 534 |
| `app/src/engine/drills/harmony.ts` | 304, 305, 322, 327 |
| `app/src/engine/drills/simon.ts` | 198, 206, 209 |
| `app/src/engine/musicXmlWriter.ts` | 58, 127 |
| `app/src/engine/readingControls.ts` | 30, 34, 35, 61, 63, 65, 90, 91, 153, 175, 180, 181, 193, 207, 302, 332, 335, 355, 416, 494, 505, 506 |
| `app/src/engine/sightReading.ts` | 9, 50, 52, 70, 75, 76, 77, 88, 91, 93, 97, 112, 120, 121, 122, 148, 153, 187, 221, 222, 271, 310, 331, 332, 333, 340, 406, 534, 561, 565, 601, 604, 735, 802, 803, 862, 870, 909, 942, 943, 997, 1002, 1007, 1008, 1023, 1053, 1055, 1057, 1058, 1063, 1074, 1084, 1085, 1119, 1133, 1134, 1137, 1152, 1155, 1162, 1170, 1174, 1179, 1183, 1189, 1191, 1220, 1229, 1233, 1248, 1249, 1261, 1262, 1263, 1271, 1277, 1278, 1283, 1319, 1348, 1403, 1556, 1581, 1582, 1584, 1616, 1620, 1629, 1632, 1633, 1668, 1669, 1677, 1701, 1702, 1708, 1719, 1733, 1741, 1770, 1786, 1810, 1881, 1888, 1954, 1972, 2059, 2064, 2082, 2101, 2134 |
| `app/src/engine/sightReadingScore.ts` | 57, 65, 75, 190, 200, 300, 325, 347, 408, 505, 574, 608, 654, 659, 689, 696, 752, 758, 793, 795, 796, 800 |
| `app/src/evidence/evidence.ts` | 13 |
| `app/src/evidence/ladder.ts` | 95, 96, 97 |
| `app/src/evidence/measurement.ts` | 7 |
| `app/src/midi/parseMidiMessage.ts` | 5 |
| `app/src/score/difficulty.ts` | 11, 52, 76, 80, 106, 338, 341, 344, 362 |
| `app/src/score/estimateImport.ts` | 26, 33, 56 |
| `app/src/style.css` | 1195, 2678, 2772, 4345, 5202, 5203, 5207, 5208, 5212, 5213, 5217, 5218, 6093 |
| `app/src/ui/assignSheet.ts` | 5, 7, 24, 25, 166, 168, 173, 206, 208, 216, 220, 222, 223, 270, 271, 278, 282, 288, 289, 304, 313 |
| `app/src/ui/help.ts` | 1140, 1525 |
| `app/src/ui/importSheet.ts` | 375, 376, 377, 389, 410, 433 |
| `app/src/ui/markdown.ts` | 25, 142, 143 |
| `app/src/ui/screens/DevExcerptView.ts` | 93, 94, 562 |
| `app/src/ui/screens/DevMicroscopeScreen.ts` | 565, 1131 |
| `app/src/ui/screens/DevScoreScreen.ts` | 147, 148, 792, 830, 831, 832 |
| `app/src/ui/screens/DiagnosticsScreen.ts` | 213, 220, 610, 615, 616, 617, 805, 806, 807 |
| `app/src/ui/screens/DrillScreen.ts` | 2579, 2581, 2582, 2583, 2584, 2588 |
| `app/src/ui/screens/FolderScreen.ts` | 105, 109, 110, 368, 529, 536, 601, 658, 670, 1107, 1110, 1114, 1117, 1262 |
| `app/src/ui/screens/GuideScreen.ts` | 237, 238, 251, 261 |
| `app/src/ui/screens/LabScreen.ts` | 321, 322 |
| `app/src/ui/screens/LessonScreen.ts` | 31, 286 |
| `app/src/ui/screens/LibraryScreen.ts` | 21, 62, 85, 117, 160, 187, 408, 446, 603, 738, 767, 768, 775, 776, 780, 781, 817, 895, 907, 914, 929, 938, 960, 962, 963, 972, 973, 984, 1114, 1156, 1236, 1313 |
| `app/src/ui/screens/MicScreen.ts` | 9, 50, 106, 117, 168, 172, 227, 233, 235, 237, 238, 239 |
| `app/src/ui/screens/PlanScreen.ts` | 62 |
| `app/src/ui/screens/ProgressScreen.ts` | 255, 257, 319, 754, 755 |
| `app/src/ui/screens/ScoreScreen.ts` | 258, 977, 2058, 2523, 2526, 2527 |
| `app/src/ui/screens/SetupScreen.ts` | 376, 502, 504, 505 |
| `app/src/ui/screens/ShelfScreen.ts` | 48, 124, 125, 130, 137, 139, 140, 215, 235, 246, 252, 460, 464, 465, 485 |
| `app/src/ui/screens/SkillsScreen.ts` | 27, 62, 63, 137, 268, 269, 343 |
| `app/src/ui/screens/TodayScreen.ts` | 103, 477, 587, 846, 887, 1052 |
| `app/src/ui/widgets.ts` | 22, 370, 375, 376 |
| `tools/content/add_technique_units.py` | 21, 47, 122, 131, 132, 221, 226, 239, 254 |
| `tools/content/author.py` | 41, 87, 99, 101, 124, 125, 127, 145 |
| `tools/content/build.py` | 393, 394, 403, 624, 810, 820, 974, 975, 977, 1060, 1259, 1424, 1426 |
| `tools/content/candidates.py` | 14, 31, 34, 122, 123, 125, 145, 146, 169, 193, 194, 196, 198, 225, 232, 233, 234, 238, 239, 247, 252 |
| `tools/content/claims.py` | 812, 815, 822, 875, 887, 889 |
| `tools/content/common.py` | 28, 251, 252, 262, 263, 267, 268, 273, 274, 400 |
| `tools/content/demands.py` | 11 |
| `tools/content/difficulty.py` | 8, 11, 12, 14, 23, 36, 65, 69, 101, 108, 141, 446, 450, 455, 475, 487, 493, 594, 633, 635, 640 |
| `tools/content/dump_score.py` | 68 |
| `tools/content/excerpt_proposer.py` | 20, 726, 727, 763, 778, 782, 991, 992 |
| `tools/content/excerpts.py` | 204, 488, 546, 547 |
| `tools/content/export_levelling_fixture.py` | 8, 67, 79 |
| `tools/content/finder.py` | 14, 81 |
| `tools/content/fit_level_model.py` | 2, 4, 5, 46, 65, 111, 117, 118 |
| `tools/content/generate_exercises.py` | 354, 379, 426, 443, 462, 472, 699, 945, 965, 966, 969, 970, 1043, 1126, 1138, 1175, 1182, 1221, 1240, 1263, 1283, 1328, 1411, 1433, 1523, 1550, 1563, 1622, 1666, 1697, 1746, 1769, 1818, 1847, 1865, 1867, 1879, 1907, 1960, 1983, 1998, 2054, 2062, 2091, 2152, 2160, 2177, 2201, 2244, 2255, 2336, 2339, 2357, 2369, 2401, 2461, 2488, 2513, 2587, 2598, 2607, 2616, 2636, 2687, 2712, 2744, 2772, 2807, 2838, 2859, 2883, 2901, 2921, 2934, 2966, 3012, 3066, 3069, 3071, 3102, 3121, 3251, 3276, 3298, 3443, 3770, 3800, 3826, 3855, 3875, 3909, 4028, 4096, 4202, 4255, 4276, 4311, 4347, 4368, 4379, 4418, 4445, 4480, 4501, 4519, 4552, 4589, 4619, 4627, 4640, 4690, 4694, 4733, 4781, 4818, 4975, 5029, 5123, 5138, 5170, 5186, 5219, 5237, 5281, 5284, 5316, 5361, 5364, 5409, 5444, 5446, 5482, 5521, 5530, 5557, 5569, 5649, 5675, 5733, 5764, 5791, 5813, 5844, 5877, 5924, 5959, 5988, 5992, 6008, 6084, 6104, 6354 |
| `tools/content/import_kern.py` | 462, 463, 464, 510, 515, 516, 531, 660, 662, 664, 710, 711, 730, 747, 756, 757, 776 |
| `tools/content/import_musetrainer.py` | 214, 215, 230, 262, 263, 278, 326, 327, 329, 345 |
| `tools/content/import_mutopia.py` | 483, 484, 485, 533 |
| `tools/content/import_pdmx.py` | 134, 135, 137, 142, 148 |
| `tools/content/ladder_report.py` | 35, 36, 37, 89, 90, 114, 119, 137, 138, 165, 169 |
| `tools/content/musical_evaluator.py` | 150, 151, 241, 254, 370, 378, 572, 913, 931 |
| `tools/content/pdmx/__init__.py` | 11 |
| `tools/content/pdmx/commit.py` | 9, 199, 200, 201, 288 |
| `tools/content/pdmx/index.py` | 5, 8, 11, 17, 68, 120, 181, 193, 235, 241, 315, 363, 406, 430, 439, 450, 475, 498, 511 |
| `tools/content/pdmx/index_page.js` | 61, 62, 128 |
| `tools/content/pdmx/manifest.py` | 11, 57, 62, 81, 123, 139, 177 |
| `tools/content/pdmx/quarry.py` | 2, 102, 103, 430, 433, 436, 437, 438, 439, 494, 496, 497, 498, 499 |
| `tools/content/pdmx/review.py` | 77, 78, 94, 122, 139 |
| `tools/content/pdmx/shortlist.py` | 60, 201, 203, 204 |
| `tools/content/rung_audit.py` | 5, 129 |
| `tools/content/study.py` | 1133 |
| `tools/content/validate.py` | 148, 151, 160, 168, 513, 515, 516, 521, 525, 528, 529, 531, 533, 541, 544, 570, 598, 616, 617, 624, 1224, 2001, 2007, 2008, 2166, 2171 |

### Content/schema/authored metadata

| File | Matching lines |
| --- | --- |
| `content/catalog.schema.json` | 16, 17, 40, 75, 81, 86, 96, 290, 656 |
| `content/catalog.static.json` | 11, 12, 13, 30, 34, 58, 59, 60, 98, 99, 100, 139, 140, 141, 184, 185, 186, 230, 231, 232, 304, 305, 306, 347, 348, 349, 390, 391, 392, 435, 436, 437, 483, 484, 485, 526, 527, 528, 569, 570, 571, 612, 613, 614, 652, 659, 660, 661, 683, 711, 712, 713, 757, 758, 759, 811, 812, 813, 854, 855, 856, 900, 901, 902, 947, 948, 949, 992, 993, 994, 1037, 1038, 1039, 1079, 1080, 1081, 1122, 1123, 1124, 1164, 1165, 1166, 1214, 1215, 1216, 1255, 1256, 1257, 1301, 1302, 1303, 1344, 1345, 1346, 1386, 1387, 1388, 1422, 1429, 1430, 1431, 1452, 1480, 1481, 1482, 1529, 1530, 1531, 1586, 1587, 1588, 1634, 1635, 1636, 1681, 1682, 1683, 1723, 1724, 1725, 1759, 1766, 1767, 1768, 1792, 1817, 1824, 1825, 1826, 1848, 1868, 1875, 1876, 1877, 1900, 1922, 1929, 1930, 1931, 1955, 1983, 1984, 1985, 2031, 2032, 2033, 2075, 2076, 2077, 2128, 2129, 2130, 2178, 2179, 2180, 2221, 2222, 2223, 2271, 2272, 2273, 2319, 2320, 2321, 2368, 2369, 2370, 2420, 2421, 2422, 2472, 2473, 2474, 2524, 2525, 2526, 2576, 2577, 2578, 2628, 2629, 2630, 2680, 2681, 2682, 2732, 2733, 2734, 2782, 2783, 2784, 2842, 2843, 2844, 2908, 2909, 2910, 2961, 2962, 2963, 3014, 3015, 3016, 3068, 3069, 3070, 3135, 3136, 3137, 3198, 3199, 3200, 3245, 3246, 3247, 3303, 3304, 3305, 3360, 3361, 3362, 3380, 3410, 3411, 3412, 3430, 3460, 3461, 3462, 3508, 3509, 3510, 3555, 3556, 3557, 3608, 3609, 3610, 3654, 3655, 3656, 3702, 3709, 3710, 3711, 3735, 3764, 3771, 3772, 3773, 3797, 3828, 3836, 3837, 3838, 3862 |
| `content/curriculum.schema.json` | 69, 169, 176, 478, 500 |
| `content/curriculum/concepts.json` | 13 |
| `content/curriculum/stage-0.json` | 9, 50, 96, 135, 171 |
| `content/curriculum/stage-1.json` | 9, 60, 149, 235, 315, 408, 484, 543, 603, 662, 723 |
| `content/curriculum/stage-2.json` | 9, 66, 160, 267, 353, 449, 536, 618 |
| `content/curriculum/stage-3.json` | 9, 66, 156, 250, 332, 414, 504, 581, 678, 773, 843, 911, 1003, 1076, 1142, 1218, 1289 |
| `content/curriculum/stage-4.json` | 9, 75, 157, 258, 347, 450, 531, 600, 685, 805, 878, 973, 1054, 1135, 1208, 1280, 1358, 1443, 1529, 1608 |
| `content/curriculum/stage-5.json` | 9, 65, 159, 238, 325, 404, 481, 562, 649, 732, 821, 898, 967, 1043 |
| `content/curriculum/stage-6.json` | 9, 70, 158, 260, 349, 434, 512, 592, 662, 726, 816, 886, 962, 1034 |
| `content/curriculum/stage-7.json` | 9, 75, 172, 266, 345, 428, 508, 589, 661, 725, 803, 873, 955 |
| `content/curriculum/stage-8.json` | 9, 73, 168, 239, 312, 399, 482, 546, 624 |
| `content/curriculum/stage-9.json` | 9, 67, 146, 232, 318, 381, 456, 538 |
| `content/curriculum/vocabulary/demands.json` | 128 |
| `content/curriculum/vocabulary/skills.json` | 223 |
| `content/score-checks.allow.json` | 52 |
| `content/scores/authored/au-clair-de-la-lune.abc` | 4 |
| `content/scores/authored/blues-12-bar-a.py` | 21 |
| `content/scores/authored/blues-12-bar-c.py` | 21 |
| `content/scores/authored/blues-12-bar-d.py` | 23 |
| `content/scores/authored/blues-12-bar-e.py` | 21 |
| `content/scores/authored/blues-12-bar-f.py` | 21 |
| `content/scores/authored/blues-12-bar-g.py` | 21 |
| `content/scores/authored/cielito-lindo-simple.abc` | 4 |
| `content/scores/authored/frere-jacques.abc` | 4 |
| `content/scores/authored/greensleeves-68.abc` | 4 |
| `content/scores/authored/greensleeves-chords.abc` | 4 |
| `content/scores/authored/greensleeves-simple.abc` | 4 |
| `content/scores/authored/greensleeves-waltz.abc` | 4 |
| `content/scores/authored/happy-birthday-simple.abc` | 4 |
| `content/scores/authored/hot-cross-buns-lh.abc` | 4 |
| `content/scores/authored/hot-cross-buns.abc` | 4 |
| `content/scores/authored/jingle-bells-g.abc` | 4 |
| `content/scores/authored/jingle-bells-ht.abc` | 4, 9 |
| `content/scores/authored/jingle-bells-rh.abc` | 4 |
| `content/scores/authored/lightly-row.abc` | 4 |
| `content/scores/authored/london-bridge.abc` | 4 |
| `content/scores/authored/mary-had-a-little-lamb-ht.abc` | 4 |
| `content/scores/authored/mary-had-a-little-lamb-lh.abc` | 4 |
| `content/scores/authored/mary-had-a-little-lamb.abc` | 4 |
| `content/scores/authored/merrily-we-roll-along.abc` | 4 |
| `content/scores/authored/ode-to-joy-alternating.abc` | 4 |
| `content/scores/authored/ode-to-joy-full.abc` | 4 |
| `content/scores/authored/ode-to-joy-g.abc` | 4 |
| `content/scores/authored/ode-to-joy-ht.abc` | 4 |
| `content/scores/authored/ode-to-joy-lh.abc` | 4 |
| `content/scores/authored/ode-to-joy-rh.abc` | 4 |
| `content/scores/authored/oh-when-the-saints-alternating.abc` | 4 |
| `content/scores/authored/oh-when-the-saints-f.abc` | 4 |
| `content/scores/authored/old-macdonald.abc` | 4 |
| `content/scores/authored/row-row-row-your-boat.abc` | 4 |
| `content/scores/authored/steps-and-skips-c.abc` | 4 |
| `content/scores/authored/twinkle-f.abc` | 4 |
| `content/scores/authored/twinkle-ht.abc` | 4 |
| `content/scores/authored/twinkle-rh.abc` | 4 |
| `content/sources/kern.json` | 7, 15, 16, 189, 190, 215, 216, 240, 241, 264, 265, 291, 292, 316, 317, 340, 341, 364, 365, 388, 389, 413, 414, 437, 438, 461, 462, 486, 487, 510, 511, 535, 536, 560, 561, 584, 585, 609, 610, 633, 634, 658, 659, 682, 683, 707, 708, 731, 732, 755, 756, 779, 780, 804, 805, 828, 829, 853, 854, 878, 879, 902, 903, 926, 927, 950, 951, 975, 976, 999, 1000, 1023, 1024, 1048, 1049, 1073, 1074, 1097, 1098, 1121, 1122, 1146, 1147, 1171, 1172, 1196, 1197, 1221, 1222, 1246, 1247, 1270, 1271, 1294, 1295, 1318, 1319, 1354, 1355, 1358, 1359, 1363, 1364, 1367, 1368, 1371, 1372, 1384, 1385, 1388, 1389, 1398, 1399, 1408, 1409, 1412, 1413, 1417, 1418, 1422, 1423, 1426, 1427, 1431, 1432, 1436, 1437, 1440, 1441, 1445, 1446, 1449, 1450, 1453, 1454, 1457, 1458, 1461, 1462, 1471, 1472, 1475, 1476, 1479, 1480, 1501, 1502, 1524, 1525, 1553, 1554, 1557, 1558, 1562, 1563, 1567, 1568, 1587, 1588, 1591, 1592, 1596, 1597, 1616, 1617, 1620, 1621, 1625, 1626, 1646, 1647, 1650, 1651, 1654, 1655, 1675, 1676, 1679, 1680, 1702, 1703, 1706, 1707, 1710, 1711, 1730, 1731, 1734, 1735, 1757, 1758, 1761, 1762, 1765, 1766, 1769, 1773, 1774, 1778, 1779, 1798, 1799, 1802, 1803, 1806, 1807, 1810, 1813, 1814, 1817, 1818, 1836, 1837, 1840, 1841, 1862, 1863, 1866, 1867, 1870, 1871, 1889, 1890, 1893, 1894, 1912, 1913, 1916, 1917, 1921, 1922, 1943, 1944, 1947, 1948, 1970, 1971, 1995, 1996, 2020, 2021, 2045, 2046, 2049, 2050, 2071, 2072, 2075, 2076, 2080, 2081, 2099, 2100, 2103, 2104, 2107, 2108, 2111, 2112, 2130, 2131, 2148, 2149, 2152, 2153, 2156, 2157, 2163, 2164, 2182, 2183, 2204, 2205, 2208, 2209, 2212, 2213, 2216, 2217, 2236, 2237, 2243, 2244, 2262, 2263, 2266, 2267, 2270, 2271, 2274, 2275, 2294, 2295, 2312, 2313, 2316, 2317, 2330, 2331, 2334, 2335, 2344, 2345, 2348, 2349, 2370, 2371, 2374, 2375, 2383, 2384, 2387, 2388, 2398, 2399, 2426, 2427, 2448, 2449, 2466, 2467, 2484, 2485, 2502, 2503, 2524, 2525, 2542, 2543, 2564, 2565, 2586, 2587, 2617, 2618, 2624, 2625, 2650, 2651, 2678, 2679, 2696, 2697, 2714, 2715, 2731, 2732, 2748, 2749, 2769, 2770, 2787, 2788, 2809, 2810, 2831, 2832, 2853, 2854, 2870, 2871, 2888, 2889, 2910, 2911, 2932, 2933, 2950, 2951, 2972, 2973, 2990, 2991, 3012, 3013, 3030, 3031, 3048, 3049, 3066, 3067, 3084, 3085, 3101, 3102, 3123, 3124, 3145, 3146, 3149, 3150, 3154, 3155, 3173, 3174, 3180, 3181, 3192, 3193, 3203, 3204, 3214, 3215 |
| `content/sources/level-model.json` | 8, 14, 50, 55, 60, 65, 70, 75, 80, 85 |
| `content/sources/musetrainer.json` | 11, 20, 21, 36, 37, 53, 54, 70, 71, 88, 89, 104, 105, 120, 121, 141, 142, 160, 161, 178, 179, 195, 196, 213, 214, 230, 231, 247, 248, 263, 277, 278, 294, 295, 315, 316, 332, 333, 350, 351, 366, 367, 383, 384, 401, 402, 421, 434, 450, 451, 467, 468, 485, 486, 503, 504, 522, 523, 541, 542, 557, 571, 572, 587, 588, 604, 605, 620, 621, 637, 638, 653, 669, 670, 688, 689, 706, 707, 722, 723, 739, 740, 758, 759, 775, 776, 791, 792, 808, 809, 825, 826, 841, 842, 857, 858, 874, 875, 890, 891, 906, 907, 923, 924, 940, 941, 956, 972, 973, 988, 989, 1005, 1006, 1023, 1024, 1041, 1042, 1058, 1059, 1075, 1076, 1092, 1093 |
| `content/sources/mutopia.json` | 47 |
| `content/sources/pdmx-wants.json` | 27, 51, 77, 78, 79, 114 |
| `content/sources/pdmx.json` | 7, 125, 126, 195, 196, 261, 262, 327, 328, 393, 394, 459, 460, 525, 526, 591, 592, 657, 658, 727, 728, 793, 794, 863, 864, 929, 930, 995, 996, 1061, 1062, 1127, 1128, 1193, 1194, 1259, 1260, 1325, 1326, 1391, 1392, 1457, 1458, 1527, 1528, 1593, 1594, 1659, 1660, 1725, 1726, 1791, 1792, 1857, 1858, 1923, 1924, 1995, 1996, 2061, 2062, 2127, 2128, 2193, 2194, 2259, 2260, 2325, 2326, 2391, 2392, 2457, 2458, 2523, 2524, 2589, 2590, 2659, 2660, 2725, 2726, 2791, 2792, 2857, 2858, 2923, 2924, 2989, 2990, 3055, 3056, 3121, 3122, 3191, 3192, 3257, 3258, 3323, 3324, 3389, 3390, 3455, 3456, 3521, 3522, 3593, 3594, 3659, 3660, 3725, 3726, 3791, 3792, 3857, 3858, 3923, 3924, 3989, 3990, 4055, 4056, 4121, 4122, 4187, 4188, 4253, 4254, 4319, 4320, 4385, 4386, 4451, 4452, 4517, 4518, 4583, 4584, 4649, 4650, 4715, 4716, 4781, 4782, 4847, 4848, 4913, 4914, 4979, 4980, 5045, 5046, 5111, 5112, 5180, 5181, 5246, 5247, 5312, 5313, 5378, 5379, 5444, 5445, 5510, 5511, 5576, 5577, 5642, 5643, 5708, 5709, 5774, 5775, 5840, 5841, 5906, 5907, 5972, 5973, 6038, 6039, 6104, 6105, 6170, 6171, 6236, 6237, 6302, 6303, 6368, 6369, 6434, 6435, 6500, 6501, 6566, 6567, 6632, 6633, 6698, 6699, 6764, 6765, 6830, 6831, 6896, 6897, 6962, 6963, 7028, 7029, 7094, 7095, 7160, 7161, 7226, 7227, 7292, 7293, 7358, 7359, 7424, 7425, 7490, 7491, 7556, 7557, 7622, 7623, 7688, 7689, 7754, 7755, 7820, 7821, 7886, 7887, 7952, 7953, 8018, 8019, 8088, 8089, 8154, 8155, 8220, 8221, 8286, 8287, 8352, 8353, 8418, 8419, 8484, 8485, 8550, 8551, 8616, 8617, 8682, 8683, 8748, 8749, 8814, 8815, 8884, 8885, 8950, 8951, 9016, 9017, 9082, 9083, 9148, 9149, 9214, 9215, 9280, 9281, 9346, 9347, 9412, 9413, 9478, 9479, 9544, 9545, 9610, 9611, 9676, 9677, 9742, 9743, 9808, 9809, 9874, 9875, 9940, 9941, 10006, 10007, 10072, 10073, 10138, 10139, 10204, 10205, 10270, 10271, 10336, 10337, 10402, 10403, 10468, 10469, 10534, 10535, 10600, 10601, 10666, 10667, 10732, 10733, 10798, 10799, 10864, 10865, 10930, 10931, 10996, 10997, 11062, 11063, 11128, 11129, 11194, 11195, 11260, 11261, 11326, 11327, 11392, 11393, 11458, 11459, 11524, 11525, 11590, 11591, 11656, 11657, 11728, 11729, 11794, 11795, 11860, 11861, 11926, 11927, 11992, 11993, 12058, 12059, 12124, 12125, 12190, 12191, 12256, 12257, 12322, 12323, 12388, 12389, 12454, 12455, 12520, 12521, 12586, 12587, 12652, 12653, 12718, 12719, 12784, 12785, 12850, 12851, 12916, 12917, 12982, 12983, 13048, 13049, 13114, 13115, 13180, 13181, 13246, 13247, 13312, 13313, 13378, 13379, 13444, 13445, 13510, 13511, 13576, 13577, 13642, 13643, 13708, 13709, 13774, 13775, 13840, 13841, 13906, 13907, 13972, 13973, 14038, 14039, 14104, 14105, 14170, 14171, 14236, 14237, 14302, 14303, 14368, 14369, 14434, 14435, 14500, 14501, 14566, 14567, 14632, 14633, 14698, 14699, 14764, 14765, 14830, 14831, 14896, 14897, 14962, 14963, 15032, 15033, 15098, 15099, 15164, 15165, 15230, 15231, 15296, 15297, 15362, 15363, 15428, 15429, 15498, 15499, 15564, 15565, 15630, 15631, 15700, 15701, 15770, 15771, 15836, 15837, 15906, 15907, 15972, 15973, 16038, 16039, 16104, 16105, 16170, 16171, 16236, 16237, 16302, 16303, 16368, 16369, 16434, 16435, 16500, 16501, 16566, 16567, 16632, 16633, 16698, 16699, 16764, 16765, 16830, 16831, 16900, 16901, 16966, 16967, 17032, 17033, 17098, 17099, 17164, 17165, 17230, 17231, 17296, 17297, 17362, 17363, 17428, 17429, 17494, 17495, 17566, 17567, 17632, 17633, 17698, 17699, 17718, 17770, 17771, 17836, 17837, 17902, 17903, 17968, 17969, 18034, 18035, 18100, 18101, 18166, 18167, 18232, 18233, 18298, 18299, 18364, 18365, 18430, 18431, 18496, 18497, 18562, 18563, 18634, 18635, 18700, 18701, 18766, 18767, 18832, 18833, 18898, 18899, 18964, 18965, 19030, 19031, 19096, 19097, 19162, 19163, 19228, 19229, 19294, 19295, 19360, 19361, 19426, 19427, 19492, 19493, 19558, 19559, 19624, 19625, 19690, 19691, 19756, 19757, 19822, 19823, 19888, 19889, 19954, 19955, 20020, 20021, 20086, 20087, 20152, 20153, 20218, 20219, 20284, 20285, 20350, 20351, 20416, 20417, 20482, 20483, 20548, 20549, 20614, 20615, 20680, 20681, 20746, 20747, 20812, 20813, 20884, 20885, 20950, 20951, 21016, 21017, 21082, 21083, 21148, 21149, 21214, 21215, 21284, 21285, 21350, 21351, 21416, 21417, 21482, 21483, 21548, 21549, 21614, 21615, 21680, 21681, 21746, 21747, 21812, 21813, 21878, 21879, 21944, 21945, 22010, 22011, 22076, 22077, 22142, 22143, 22208, 22209, 22274, 22275, 22340, 22341, 22406, 22407, 22472, 22473, 22538, 22539, 22604, 22605, 22670, 22671, 22736, 22737, 22802, 22803, 22868, 22869, 22934, 22935, 23000, 23001, 23066, 23067, 23132, 23133, 23198, 23199, 23264, 23265, 23330, 23331, 23396, 23397, 23462, 23463, 23528, 23529, 23594, 23595, 23660, 23661, 23726, 23727, 23792, 23793, 23858, 23859, 23924, 23925, 23990, 23991, 24056, 24057, 24122, 24123, 24188, 24189, 24254, 24255, 24320, 24321, 24386, 24387, 24452, 24453, 24518, 24519, 24584, 24585, 24650, 24651, 24716, 24717, 24782, 24783, 24848, 24849, 24914, 24915, 24980, 24981, 25046, 25047, 25112, 25113, 25178, 25179, 25244, 25245, 25310, 25311, 25376, 25377, 25442, 25443, 25508, 25509, 25574, 25575, 25640, 25641, 25706, 25707, 25772, 25773, 25838, 25839, 25904, 25905, 25970, 25971, 26036, 26037, 26102, 26103, 26168, 26169, 26234, 26235, 26300, 26301, 26366, 26367, 26432, 26433, 26498, 26499, 26564, 26565, 26630, 26631, 26696, 26697, 26762, 26763, 26828, 26829, 26894, 26895, 26960, 26961, 27026, 27027, 27092, 27093, 27158, 27159, 27224, 27225, 27290, 27291, 27356, 27357, 27422, 27423, 27488, 27489, 27554, 27555, 27620, 27621, 27686, 27687, 27752, 27753, 27818, 27819, 27884, 27885, 27950, 27951, 28016, 28017, 28082, 28083, 28148, 28149, 28214, 28215, 28280, 28281, 28346, 28347, 28412, 28413, 28478, 28479, 28544, 28545, 28610, 28611, 28676, 28677, 28742, 28743, 28808, 28809, 28874, 28875, 28940, 28941, 29006, 29007, 29072, 29073, 29138, 29139, 29204, 29205, 29270, 29271, 29336, 29337, 29402, 29403, 29468, 29469, 29534, 29535, 29600, 29601, 29666, 29667, 29732, 29733, 29798, 29799, 29864, 29865, 29930, 29931, 29996, 29997, 30062, 30063, 30128, 30129, 30194, 30195, 30260, 30261, 30326, 30327, 30392, 30393, 30458, 30459, 30524, 30525, 30590, 30591, 30656, 30657, 30722, 30723, 30788, 30789, 30854, 30855, 30920, 30921, 30986, 30987, 31052, 31053, 31118, 31119, 31184, 31185, 31250, 31251, 31316, 31317, 31382, 31383, 31448, 31449, 31514, 31515, 31580, 31581, 31646, 31647, 31712, 31713, 31778, 31779, 31844, 31845, 31910, 31911, 31976, 31977, 32042, 32043, 32108, 32109, 32174, 32175, 32240, 32241, 32306, 32307, 32372, 32373, 32438, 32439, 32504, 32505, 32570, 32571, 32636, 32637, 32702, 32703, 32768, 32769, 32834, 32835, 32900, 32901, 32972, 32973, 33044, 33045, 33116, 33117, 33188, 33189, 33260, 33261, 33332, 33333, 33404, 33405, 33477, 33478, 33549, 33550, 33621, 33622, 33693, 33694, 33765, 33766, 33838, 33839, 33910, 33911, 33982, 33983, 34054, 34055, 34126, 34127, 34198, 34199, 34270, 34271, 34342, 34343, 34414, 34415, 34486, 34487, 34558, 34559, 34630, 34631, 34702, 34703, 34774, 34775, 34840, 34841, 34906, 34907, 34972, 34973, 35038, 35039, 35104, 35105, 35170, 35171, 35236, 35237, 35256, 35302, 35303, 35368, 35369, 35434, 35435, 35500, 35501, 35520, 35566, 35567, 35632, 35633, 35698, 35699, 35764, 35765, 35830, 35831, 35896, 35897, 35916, 35962, 35963, 36028, 36029, 36094, 36095 |
| `content/video-index.json` | 633 |

### Tests and fixtures

| File | Matching lines |
| --- | --- |
| `app/tests/e2e/drills.spec.ts` | 332, 355 |
| `app/tests/e2e/empty-states.spec.ts` | 243, 286 |
| `app/tests/e2e/engine.spec.ts` | 269, 270, 275 |
| `app/tests/e2e/finder.spec.ts` | 124, 125, 126 |
| `app/tests/e2e/fixtures/devScore.ts` | 61, 150, 450, 457 |
| `app/tests/e2e/fixtures/excerpt-candidates.json` | 185, 186 |
| `app/tests/e2e/folder.add.spec.ts` | 54, 55, 57 |
| `app/tests/e2e/folder.manifest.spec.ts` | 58 |
| `app/tests/e2e/folder.rail-cost.spec.ts` | 29 |
| `app/tests/e2e/folder.readable.spec.ts` | 75 |
| `app/tests/e2e/folder.spec.ts` | 40, 56, 92, 103, 535, 621, 624, 626, 640, 642 |
| `app/tests/e2e/import-experience.spec.ts` | 167 |
| `app/tests/e2e/lab.spec.ts` | 82, 83 |
| `app/tests/e2e/library.spec.ts` | 71, 91, 101, 103, 113, 114 |
| `app/tests/e2e/mic.spec.ts` | 48, 117, 127, 128, 135, 182, 184 |
| `app/tests/e2e/midi-import.spec.ts` | 148 |
| `app/tests/e2e/offline.spec.ts` | 126, 141, 149, 152 |
| `app/tests/e2e/plan.spec.ts` | 166, 203 |
| `app/tests/e2e/progress.spec.ts` | 82 |
| `app/tests/e2e/score-fit-paths.spec.ts` | 124 |
| `app/tests/e2e/score.stepper-limits.spec.ts` | 75, 76, 77, 82, 91, 96 |
| `app/tests/e2e/sweeps.spec.ts` | 243, 248, 255, 256 |
| `app/tests/e2e/today.spec.ts` | 37, 102, 317 |
| `app/tests/e2e/transfer-offer.spec.ts` | 81 |
| `app/tests/fixtures/levelling.json` | 6, 34, 61, 88, 115, 142, 169, 196, 223, 250, 277, 304, 331, 358, 385, 412, 439, 466, 493, 520, 547, 574, 601, 628, 655, 682, 709, 736, 763, 790, 817, 844, 871, 898, 925, 952, 979, 1006, 1033, 1060, 1087, 1114, 1141, 1168 |
| `app/tests/fixtures/scores/golden/sight-reading-unchanged.json` | 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520, 521, 522, 523, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 534, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578, 579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592, 593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604, 605, 606, 607, 608, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619, 620, 621, 622, 623, 624, 625, 626, 627, 628, 629, 630, 631, 632, 633, 634, 635, 636, 637, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649, 650, 651, 652, 653, 654, 655, 656, 657, 658, 659, 660, 661, 662, 663, 664, 665, 666, 667, 668, 669, 670, 671, 672, 673, 674, 675, 676, 677, 678, 679, 680, 681, 682, 683, 684, 685, 686, 687, 688, 689, 690, 691, 692, 693, 694, 695, 696, 697, 698, 699, 700, 701, 702, 703, 704, 705, 706, 707, 708, 709, 710, 711, 712, 713, 714, 715, 716, 717, 718, 719, 720, 721, 722, 723, 724, 725, 726, 727, 728, 729, 730, 731, 732, 733, 734, 735, 736, 737, 738, 739, 740, 741, 742, 743, 744, 745, 746, 747, 748, 749, 750, 751, 752, 753, 754, 755, 756, 757, 758, 759, 760, 761, 762, 763, 764, 765, 766, 767, 768, 769, 770, 771, 772, 773, 774, 775, 776, 777, 778, 779, 780, 781, 782, 783, 784, 785, 786, 787, 788, 789, 790, 791, 792, 793, 794, 795, 796, 797, 798, 799, 800, 801, 802, 803, 804, 805, 806, 807, 808, 809, 810, 811, 812, 813, 814, 815, 816, 817, 818, 819, 820, 821, 822, 823, 824, 825, 826, 827, 828, 829, 830, 831, 832, 833, 834, 835, 836, 837, 838, 839, 840, 841, 842, 843, 844, 845, 846, 847, 848, 849, 850, 851, 852, 853, 854, 855, 856, 857, 858, 859, 860, 861, 862, 863, 864, 865, 866, 867, 868, 869, 870, 871, 872, 873, 874, 875, 876, 877, 878, 879, 880, 881, 882, 883, 884, 885, 886, 887, 888, 889, 890, 891, 892, 893, 894, 895, 896, 897, 898, 899, 900, 901, 902, 903, 904, 905, 906, 907, 908, 909, 910, 911, 912, 913, 914, 915, 916, 917, 918, 919, 920, 921, 922, 923, 924, 925, 926, 927, 928, 929, 930, 931, 932, 933, 934, 935, 936, 937, 938, 939, 940, 941, 942, 943, 944, 945, 946, 947, 948, 949, 950, 951, 952, 953, 954, 955, 956, 957, 958, 959, 960, 961, 962, 963, 964, 965, 966, 967, 968, 969, 970, 971, 972, 973, 974, 975, 976, 977, 978, 979, 980, 981, 982, 983, 984, 985, 986, 987, 988, 989, 990, 991, 992, 993, 994, 995, 996, 997, 998, 999, 1000, 1001, 1002, 1003, 1004, 1005 |
| `app/tests/fixtures/scores/golden/sight-reading-v2.json` | 362, 363, 364, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375, 376, 377, 378, 379, 380, 381, 382, 383, 384, 385, 386, 387, 388, 389, 390, 391, 392, 393, 394, 395, 396, 397, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413, 414, 415, 416, 417, 418, 419, 420, 421, 422, 423, 424, 425, 426, 427, 428, 429, 430, 431, 432, 433, 434, 435, 436, 437, 438, 439, 440, 441, 442, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 453, 454, 455, 456, 457, 458, 459, 460, 461, 462, 463, 464, 465, 466, 467, 468, 469, 470, 471, 472, 473, 474, 475, 476, 477, 478, 479, 480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493, 494, 495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520, 521, 522, 523, 524, 525, 526, 527, 528, 529, 530, 531, 532, 533, 534, 535, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 548, 549, 550, 551, 552, 553, 554, 555, 556, 557, 558, 559, 560, 561, 562, 563, 564, 565, 566, 567, 568, 569, 570, 571, 572, 573, 574, 575, 576, 577, 578, 579, 580, 581, 582, 583, 584, 585, 586, 587, 588, 589, 590, 591, 592, 593, 594, 595, 596, 597, 598, 599, 600, 601, 602, 603, 604, 605, 606, 607, 608, 609, 610, 611, 612, 613, 614, 615, 616, 617, 618, 619, 620, 621, 622, 623, 624, 625, 626, 627, 628, 629, 630, 631, 632, 633, 634, 635, 636, 637, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649, 650, 651, 652, 653, 654, 655, 656, 657, 658, 659, 660, 661, 662, 663, 664, 665, 666, 667, 668, 669, 670, 671, 672, 673, 674, 675, 676, 677, 678, 679, 680, 681, 682, 683, 684, 685, 686, 687, 688, 689, 690, 691, 692, 693, 694, 695, 696, 697, 698, 699, 700, 701, 702, 703, 704, 705, 706, 707, 708, 709, 710, 711, 712, 713, 714, 715, 716, 717, 718, 719, 720, 721, 722, 723, 724, 725, 726, 727, 728, 729, 730, 731, 732, 733, 734, 735, 736, 737, 738, 739, 740, 741, 742, 743, 744, 745, 746, 747, 748, 749, 750, 751, 752, 753, 754, 755, 756, 757, 758, 759, 760, 761, 762, 763, 764, 765, 766, 767, 768, 769, 770, 771, 772, 773, 774, 775, 776, 777, 778, 779, 780, 781, 782, 783, 784, 785, 786, 787, 788, 789, 790, 791, 792, 793, 794, 795, 796, 797, 798, 799, 800, 801, 802, 803, 804, 805, 806, 807, 808, 809, 810, 811, 812, 813, 814, 815, 816, 817, 818, 819, 820, 821, 822, 823, 824, 825, 826, 827, 828, 829, 830, 831, 832, 833, 834, 835, 836, 837, 838, 839, 840, 841, 842, 843, 844, 845, 846, 847, 848, 849, 850, 851, 852, 853, 854, 855, 856, 857, 858, 859, 860, 861, 862, 863, 864, 865, 866, 867, 868, 869, 870, 871, 872, 873, 874, 875, 876, 877, 878, 879, 880, 881, 882, 883, 884, 885, 886, 887, 888, 889, 890, 891, 892, 893, 894, 895, 896, 897, 898, 899, 900, 901, 902, 903, 904, 905, 906, 907, 908, 909, 910, 911, 912, 913, 914, 915, 916, 917, 918, 919, 920, 921, 922, 923, 924, 925, 926, 927, 928, 929, 930, 931, 932, 933, 934, 935, 936, 937, 938, 939, 940, 941, 942, 943, 944, 945, 946, 947, 948, 949, 950, 951, 952, 953, 954, 955, 956, 957, 958, 959, 960, 961, 962, 963, 964, 965, 966, 967, 968, 969, 970, 971, 972, 973, 974, 975, 976, 977, 978, 979, 980, 981, 982, 983, 984, 985, 986, 987, 988, 989, 990, 991, 992, 993, 994, 995, 996, 997, 998, 999, 1000, 1001, 1002, 1003, 1004, 1005 |
| `app/tests/tour/seed.ts` | 94 |
| `app/tests/tour/t30.ts` | 344 |
| `app/tests/tour/tour.spec.ts` | 627, 724 |
| `app/tests/unit/alternativesShareASkill.test.ts` | 5, 7, 12, 38, 80, 85, 87, 88, 89, 91, 92, 93, 94, 134, 175 |
| `app/tests/unit/articulationVoicingShaping.test.ts` | 175 |
| `app/tests/unit/assignmentIsNotEvidence.test.ts` | 60, 238 |
| `app/tests/unit/backingTrackSheet.test.ts` | 27 |
| `app/tests/unit/backup.test.ts` | 124, 125, 139, 140, 259, 260, 273, 286, 357 |
| `app/tests/unit/chartDoor.test.ts` | 51 |
| `app/tests/unit/competenceSurvivesPruning.test.ts` | 58 |
| `app/tests/unit/composedContract.test.ts` | 110 |
| `app/tests/unit/contactNovelty.test.ts` | 50 |
| `app/tests/unit/copingQuestion.test.ts` | 104, 332 |
| `app/tests/unit/curriculumIntegrity.test.ts` | 70 |
| `app/tests/unit/curriculumSelectors.test.ts` | 25, 80, 81, 117, 118, 119, 124 |
| `app/tests/unit/dbUpgrades.test.ts` | 95, 102, 138, 142 |
| `app/tests/unit/demandIsNotAbility.test.ts` | 118, 121 |
| `app/tests/unit/dictationCard.test.ts` | 31, 45 |
| `app/tests/unit/difficulty.test.ts` | 32, 42, 60, 69, 73, 78, 80, 111, 269 |
| `app/tests/unit/docsConsistency.test.ts` | 22 |
| `app/tests/unit/drillFromCatalog.test.ts` | 332 |
| `app/tests/unit/drillLifecycle.test.ts` | 408, 420, 432, 447, 460, 472, 485, 499, 511 |
| `app/tests/unit/drillNotation.test.ts` | 129, 134 |
| `app/tests/unit/drillSheetsSayWhatWasMeasured.test.ts` | 40, 54, 68, 82, 95 |
| `app/tests/unit/drillWalkthrough.test.ts` | 27, 40 |
| `app/tests/unit/drills.test.ts` | 407 |
| `app/tests/unit/dynamicsDrillCard.test.ts` | 37 |
| `app/tests/unit/el.test.ts` | 7 |
| `app/tests/unit/eligibility.test.ts` | 12, 13, 55, 149, 152, 153, 154, 156, 166, 167, 170, 171, 173, 301, 303 |
| `app/tests/unit/encounterModel.test.ts` | 68, 92, 239, 242 |
| `app/tests/unit/encounterRetention.test.ts` | 43 |
| `app/tests/unit/evidenceNumbersInTheVocabulary.test.ts` | 113 |
| `app/tests/unit/evidenceVersion.test.ts` | 168, 172 |
| `app/tests/unit/excerptItems.test.ts` | 55, 244, 265 |
| `app/tests/unit/fallbackOrder.test.ts` | 9, 10, 11, 12, 56, 109, 110, 111, 178, 182 |
| `app/tests/unit/feedbackFromMeasurements.test.ts` | 187, 191, 200 |
| `app/tests/unit/firstContactOnTheScore.test.ts` | 206, 210, 218, 235 |
| `app/tests/unit/firstOpenReadsTheCarriedPlan.test.ts` | 99 |
| `app/tests/unit/firstThirtyDays.test.ts` | 294 |
| `app/tests/unit/folderAssign.test.ts` | 74 |
| `app/tests/unit/folderLibrary.test.ts` | 81, 124, 130, 152, 159, 177, 246, 296, 476, 507, 576, 598 |
| `app/tests/unit/folderListing.test.ts` | 37, 215 |
| `app/tests/unit/folderManifestFirst.test.ts` | 62, 198, 225 |
| `app/tests/unit/folderScreenAtScale.test.ts` | 38 |
| `app/tests/unit/folderStorage.test.ts` | 47, 346, 350 |
| `app/tests/unit/formerIdentity.test.ts` | 55 |
| `app/tests/unit/gateAtTheConsumers.test.ts` | 10, 50, 79, 81, 82, 83, 85, 88, 283, 303, 425, 828, 842 |
| `app/tests/unit/generatedIdentityContinuity.test.ts` | 243 |
| `app/tests/unit/helpers/promises.ts` | 130, 131, 137, 269, 271, 278, 280, 281, 282 |
| `app/tests/unit/helpers/sightReadingPage.ts` | 61, 75, 144, 149, 156 |
| `app/tests/unit/importMeasuredTruth.test.ts` | 296, 302, 303, 374, 375, 427, 436 |
| `app/tests/unit/importOverlay.test.ts` | 141, 142, 149, 156, 158, 162, 163, 170, 171 |
| `app/tests/unit/importSheet.test.ts` | 53, 369, 370 |
| `app/tests/unit/importStore.test.ts` | 164, 166, 184, 230 |
| `app/tests/unit/importSummaries.test.ts` | 10 |
| `app/tests/unit/labRoute.test.ts` | 6 |
| `app/tests/unit/labToolFields.test.ts` | 115 |
| `app/tests/unit/ladderTool.test.ts` | 43, 57 |
| `app/tests/unit/legacyStorage.test.ts` | 271, 272, 282, 318, 329, 330, 389, 575, 577, 599, 609, 610, 746 |
| `app/tests/unit/lessonClaims.test.ts` | 16 |
| `app/tests/unit/lessonClaimsAboutApp.test.ts` | 1253, 1256, 1424, 1426, 1459, 1462, 1816, 1819, 1820, 1826, 2207, 2211, 2213, 2395, 2396, 2399, 2402, 2494, 2496, 2499, 2503, 3821 |
| `app/tests/unit/lessonClaimsAboutMusic.test.ts` | 866, 1362, 1365, 2778, 2779, 2781, 2784, 2890, 2895, 3047, 3050, 3054 |
| `app/tests/unit/lessonPagePicksPassTheAdmission.test.ts` | 118 |
| `app/tests/unit/lessonPageReadsTheEvidence.test.ts` | 77 |
| `app/tests/unit/lessonPaperBookPicker.test.ts` | 170 |
| `app/tests/unit/lessonShape.test.ts` | 114, 117, 118 |
| `app/tests/unit/lessonVideos.test.ts` | 90 |
| `app/tests/unit/levelOverrides.test.ts` | 5, 31, 36, 37, 50, 53, 55, 62, 63, 72, 73, 108, 174 |
| `app/tests/unit/levelSource.test.ts` | 2, 5, 12, 18, 29, 44, 45, 46, 50, 56, 60, 62, 63, 68, 78, 80, 81, 82, 94, 98, 99, 100 |
| `app/tests/unit/libraryImportWords.test.ts` | 15, 34, 49, 120, 251, 252, 255, 256, 257, 281, 284, 293, 297, 299 |
| `app/tests/unit/libraryProjects.test.ts` | 38, 57, 64, 72, 96, 104, 537 |
| `app/tests/unit/libraryRowRanking.test.ts` | 32, 43 |
| `app/tests/unit/masteryLadder.test.ts` | 61, 62, 188, 285, 290, 291, 292, 300 |
| `app/tests/unit/materialIdentity.test.ts` | 114 |
| `app/tests/unit/materialLayer.test.ts` | 88, 124, 139, 349, 783 |
| `app/tests/unit/materialOnTheRecord.test.ts` | 51 |
| `app/tests/unit/micCalibration.test.ts` | 108 |
| `app/tests/unit/micLatencyOnce.test.ts` | 124, 127 |
| `app/tests/unit/micScreenRefusal.test.ts` | 132 |
| `app/tests/unit/micSourceConnect.test.ts` | 186, 193 |
| `app/tests/unit/needs.test.ts` | 91 |
| `app/tests/unit/noCompletionBesideTheEvidence.test.ts` | 7, 14 |
| `app/tests/unit/observationsFromRun.test.ts` | 180, 193, 196 |
| `app/tests/unit/offerSnapshot.test.ts` | 41 |
| `app/tests/unit/oneGateBoundary.test.ts` | 86, 141, 142, 144, 248, 291 |
| `app/tests/unit/parallelStrands.test.ts` | 123, 138 |
| `app/tests/unit/planHierarchy.test.ts` | 333 |
| `app/tests/unit/planStageChevron.test.ts` | 19 |
| `app/tests/unit/planTracksSheet.test.ts` | 101 |
| `app/tests/unit/progressKeepsTheLearnersWord.test.ts` | 36 |
| `app/tests/unit/progressProjects.test.ts` | 32 |
| `app/tests/unit/progressRanking.test.ts` | 42 |
| `app/tests/unit/projectLifecycle.test.ts` | 84, 192, 195 |
| `app/tests/unit/projectOnTheFinishSheet.test.ts` | 182, 186, 194, 211 |
| `app/tests/unit/projectSheet.test.ts` | 29, 302 |
| `app/tests/unit/readerMovesTheDemand.test.ts` | 343 |
| `app/tests/unit/recommendRespondsToEvidence.test.ts` | 15 |
| `app/tests/unit/recordTruth.test.ts` | 112, 355 |
| `app/tests/unit/repairedTempoLineage.test.ts` | 49, 80 |
| `app/tests/unit/repertoireRetention.test.ts` | 59, 67 |
| `app/tests/unit/rungFor.test.ts` | 2, 39, 53, 86, 88, 93, 94, 97 |
| `app/tests/unit/rungStateFromEvidence.test.ts` | 242 |
| `app/tests/unit/scoreMidRunSettings.test.ts` | 171 |
| `app/tests/unit/scoreSheetRows.test.ts` | 132 |
| `app/tests/unit/scoreSheetsCloseAndPlayStartsSound.test.ts` | 334 |
| `app/tests/unit/scoreSidePanelDecision.test.ts` | 170 |
| `app/tests/unit/scoreSummaryTruth.test.ts` | 230, 243, 686, 689, 697, 715, 737, 746, 765, 774, 776, 807, 823, 826, 838, 861, 899, 900, 903, 904, 960 |
| `app/tests/unit/scoreTourRoute.test.ts` | 206, 209, 218 |
| `app/tests/unit/session.test.ts` | 59, 88, 302, 303 |
| `app/tests/unit/sessionItemStory.test.ts` | 209 |
| `app/tests/unit/sessionProtocol.test.ts` | 98 |
| `app/tests/unit/sessionRecheck.test.ts` | 129 |
| `app/tests/unit/settingsDownload.test.ts` | 30 |
| `app/tests/unit/shelf.test.ts` | 98, 99, 110, 115, 116, 174, 199, 202, 203, 204, 229, 230, 247, 248, 262 |
| `app/tests/unit/shelfRanking.test.ts` | 44, 49, 80, 81, 149 |
| `app/tests/unit/shelfScreenRedraw.test.ts` | 31 |
| `app/tests/unit/shelfTwinSearch.test.ts` | 22 |
| `app/tests/unit/sightReading.test.ts` | 38, 40, 41, 140, 141, 142, 155, 156, 157, 159, 163, 164, 165, 172, 174, 187, 189, 198, 203, 205, 214, 215, 216, 221, 222, 223, 224, 228, 236, 238, 249, 250, 251, 257, 258, 259, 264, 265, 275, 287, 298, 313, 314, 315, 321, 330, 331, 332, 334, 341, 343, 345, 351, 352, 353, 359 |
| `app/tests/unit/sightReadingDistribution.test.ts` | 2, 6, 11, 24, 36, 98, 100, 105, 117, 118, 119, 120, 122, 128, 160, 162, 225, 232, 240, 403, 409, 413, 418, 423, 424, 428, 434, 437, 438, 441, 442, 449, 450, 451, 452, 463, 464, 465, 466, 467, 468, 469, 531, 537 |
| `app/tests/unit/sightReadingFailsClosed.test.ts` | 8, 21, 54, 55, 87, 91, 96, 118, 120, 137, 144, 171, 173 |
| `app/tests/unit/sightReadingFromReadingState.test.ts` | 7, 166 |
| `app/tests/unit/sightReadingIsNotAPiece.test.ts` | 119, 122 |
| `app/tests/unit/sightReadingOptions.test.ts` | 8, 10, 11, 60, 63, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 80, 81, 82, 83, 84, 85, 87, 88, 89, 90, 92, 93, 101, 110, 122, 156, 165, 166, 170, 171, 172, 173, 174, 175, 176, 177, 178 |
| `app/tests/unit/sightReadingPromises.test.ts` | 6, 10, 141, 143, 185, 268, 272, 290, 299, 300, 318, 321, 322, 325, 327 |
| `app/tests/unit/sightReadingScore.test.ts` | 125, 126, 127, 196, 197, 198, 202, 204, 208, 212, 213, 217, 218, 219, 234, 235, 254, 269, 319, 341, 342, 343, 364, 365, 383, 410, 415, 416, 420, 428, 429, 430, 431, 432, 435, 437, 438, 446, 448, 452, 453, 461, 462 |
| `app/tests/unit/sightReadingSlot.test.ts` | 6, 83, 93, 138 |
| `app/tests/unit/sightReadingUnchanged.test.ts` | 11, 12, 44, 45, 47, 55, 57, 65, 67, 75, 83, 125, 129, 135 |
| `app/tests/unit/simonDrill.test.ts` | 95, 96, 98, 99, 102, 198, 199, 201, 213, 214, 215, 220, 221, 224, 225, 228, 229, 232, 237, 250, 251, 252, 257, 267, 268, 271, 276, 397, 398, 399, 402, 527 |
| `app/tests/unit/simonTurnCue.test.ts` | 38, 218 |
| `app/tests/unit/skillsReadTheLadder.test.ts` | 37 |
| `app/tests/unit/slotsFromEvidence.test.ts` | 365 |
| `app/tests/unit/stage9ProjectsPage.test.ts` | 77 |
| `app/tests/unit/studyEvaluatorTwin.test.ts` | 46, 70 |
| `app/tests/unit/taughtByAncestry.test.ts` | 229, 346, 385, 407, 408, 453, 529 |
| `app/tests/unit/techniqueMeasures.test.ts` | 164 |
| `app/tests/unit/todayCardRanking.test.ts` | 38 |
| `app/tests/unit/todayHeldPiece.test.ts` | 36 |
| `app/tests/unit/todayHeldSkip.test.ts` | 42 |
| `app/tests/unit/todayOfferSnapshot.test.ts` | 65, 84 |
| `app/tests/unit/todayOpensWithItsRung.test.ts` | 67, 81, 86, 89, 167 |
| `app/tests/unit/todaySessionRun.test.ts` | 45, 61 |
| `app/tests/unit/todaySwapWearsTheLifecycle.test.ts` | 38 |
| `app/tests/unit/transferFactsOnTheAttempt.test.ts` | 51 |
| `app/tests/unit/transferOffer.test.ts` | 65, 97, 209, 294 |
| `app/tests/unit/transferOfferOnTheRun.test.ts` | 204 |
| `app/tests/unit/transferPolicy.test.ts` | 31 |
| `app/tests/unit/transferRelationship.test.ts` | 51 |
| `app/tests/unit/unansweredSetOnTheRecord.test.ts` | 43, 57, 71 |
| `tools/content/tests/fixtures/evaluator_twins.json` | 19, 68, 122, 177, 227, 276, 325, 375, 425, 474, 523, 567, 572, 621, 626, 681, 732, 784, 835, 885, 936, 988, 1038, 1091, 1149, 1202, 1253, 1302, 1346, 1351, 1401, 1454, 1507, 1560, 1613, 1659, 1664, 1714, 1765, 1815, 1866, 1916, 1966, 2022, 2076, 2131, 2188, 2244, 2293, 2342, 2391, 2442, 2495, 2546, 2595 |
| `tools/content/tests/fixtures/review_cases.json` | 86 |
| `tools/content/tests/test_abc_tools.py` | 27, 64, 74 |
| `tools/content/tests/test_author.py` | 155, 159, 165 |
| `tools/content/tests/test_ci_order.py` | 19, 72 |
| `tools/content/tests/test_convert.py` | 754, 779 |
| `tools/content/tests/test_deploy_guard.py` | 69 |
| `tools/content/tests/test_difficulty.py` | 92 |
| `tools/content/tests/test_excerpt_proposer.py` | 3, 95, 98, 366, 367, 374, 375 |
| `tools/content/tests/test_finder.py` | 123, 244, 301, 302, 303 |
| `tools/content/tests/test_generator.py` | 204 |
| `tools/content/tests/test_generator_fingering.py` | 1286 |
| `tools/content/tests/test_harmony_families.py` | 176, 177, 250, 251, 917, 918, 1040, 1041, 1096, 1097, 1163, 1164, 1167, 1168, 1433 |
| `tools/content/tests/test_import_kern.py` | 89, 90, 209, 210, 212 |
| `tools/content/tests/test_import_musetrainer.py` | 65, 174, 179, 182, 264 |
| `tools/content/tests/test_import_mutopia.py` | 193, 256, 258, 259 |
| `tools/content/tests/test_levels.py` | 2, 5, 146, 149, 150, 153, 154, 163, 164, 169, 180, 194, 196, 218, 221, 230, 232, 241, 249, 250, 254 |
| `tools/content/tests/test_measured_truth.py` | 175, 176, 611 |
| `tools/content/tests/test_musical_evaluator.py` | 70, 81 |
| `tools/content/tests/test_pdmx.py` | 383, 398, 399, 410, 427, 522, 592, 657, 759, 783, 788, 791, 792, 795, 798, 803, 806, 827, 828, 1031, 1038, 1044, 1067, 1488, 1510, 1512, 1516, 1523, 1531, 1537, 1539, 1545, 1547, 1554 |
| `tools/content/tests/test_public_tie_option.py` | 16, 17, 121, 131, 132, 133, 163, 164, 165 |
| `tools/content/tests/test_study_distribution.py` | 169 |
| `tools/content/tests/test_taught_at.py` | 573 |
| `tools/content/tests/test_technique_units.py` | 10, 12, 51, 63, 68, 76, 79, 109 |
| `tools/content/tests/test_untaught_options.py` | 405, 423 |
| `tools/content/tests/test_validate.py` | 25 |
| `tools/content/tests/test_validate_excerpts.py` | 219, 221 |
| `tools/content/tests/test_validate_ladder.py` | 49, 51, 59, 60, 282, 321 |
| `tools/content/tests/test_validate_p11.py` | 36, 37, 194, 195, 196, 201, 202, 215, 230, 231, 245, 246, 252 |
| `tools/content/tests/test_validate_reach.py` | 39, 40, 41, 42, 43, 44 |

## Separate meanings and excluded homonyms

- Audio/mic `level` in `audio/`, diagnostics/setup/score microphone callbacks, gain nodes and meters is signal amplitude. CSS `data-level` is heatmap intensity. MIDI/Markdown “level”, module/top-level wording and evidence/Plan comments are not item fields. These matches remain in the ledger but have no item-scalar class/count.
- `sightReading.ts`, `readingControls.ts`, `sightReadingScore.ts`, `drills/{fromCatalog,harmony}.ts`, `musical_evaluator.py` and `study.py` use **generator recipe level**. Runtime recipe dispatch (`params.level`) controls the musical shape; it is not a second item sort estimate. `generate_exercises.py` uses both meanings: recipe/spec/calibration constants feed the catalog writer, whose item metadata is counted above; converting the catalog output must not rewrite the recipe API.
- Simon help “levels” in `simon.ts`/DrillScreen are assistance settings. No item-scalar migration.
- `rungFor.ts` takes an actual folder estimate and converts it to a **curriculum address for display**. It is an active display reader to retire, as the FolderScreen callsites show. `unitIdFor` does not persist anything; existing unit/stage identities must not be renamed with the estimate.
- `pdmx/index.py` uses a **CSV proxy**, computed before score conversion; `shortlist.py` band heuristics are another authoring discovery aid. Neither may be relabelled canonical score-model analysis. Its index page filter is explicitly a proxy consumer in the table.
- `curriculum/types.ts:642` is **stage descriptive ABRSM**, permitted to remain; :128 is item approximate ABRSM, removed. Content nested `drill.params.level` is recipe; content row `level`/source is item metadata.

## Counts and falsifier

Semantic consumer-boundary rows by class: **compatibility: 12**, **display: 22**, **eligibility or gate: 7**, **sort or tie-break: 8**, **stored: 29**. These count grouped source boundaries, not comments, fixture/log hits, recipe values or implementation tasks.

A missed active reader/writer in the covered tracked operational paths falsifies this trace. Rerun the literal and alias searches and compare locations with the ledger and semantic table. A new whole-object projection is a falsifier even without a literal match; follow the actual row through store/load/backup boundaries. Generated artifacts, device records and external manifest contents remain excluded for the stated availability reasons; they must be inventoried when available before migrating them. No scope-wide claim about unavailable bytes is made.
