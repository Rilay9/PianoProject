## 6. What the numbers say (each point names the table it reads)

**key.tonic-mode.**
- *The current detector reproduces the validation pass.* Generated: first version 1,027 right of 1,056 (97.3%), 18 UNKNOWN, 11 wrong answers (7 relative, 4 fifth); corrected 1,013 right (95.9%), 32 UNKNOWN, 11 relative. That is 1,027 / 1,038 answered and 1,013 / 1,024 answered, the figures of `validation.md` row 5, and real 215 / 221 and 214 / 221 likewise (section 3.2). The corrected ending vote is the worse of the two on generated items and one item worse on real items, as row 5 says; this comparison measures both and recommends the first (below).
- *No existing profile beats it on our material.* Real items: Temperley-Kostka-Payne 206 / 228 (90.4%), Bellman-Budge 88.6%, Aarden-Essen 88.2%, Krumhansl-Schmuckler 78.5%, against the first version's 215 / 228 (94.3%; 95.1% of the 226 it ran on). Generated items: Temperley-Kostka-Payne 87.4%, Krumhansl-Schmuckler 86.1%, Bellman-Budge 80.5%, Aarden-Essen 59.4% (283 relative-minor answers, the scale case of lessons item 6). On When in Rome keyboard pieces the three profiles that do well are level at 78 / 80 (97.5%) and the current detector is right on 75 of the 76 it ran on (4 reader failures).
- *AugmentedNet's first key is not better on our material.* Our real items 207 / 226 (91.6%) against the first version's 94.3% on the same 228; generated sample (every 8th, 132 items) 108 / 132 (81.8%) against 97.7% (first version) and 88.6% (Temperley-Kostka-Payne) on the same 132. On When in Rome its first key is right on 94 / 94, on the 17 held-out pieces 17 / 17 (a result that profiles also reach on those 17, 17 / 17 for Aarden-Essen, Bellman-Budge and Temperley-Kostka-Payne: that corpus cannot separate them). The survey said generated drills are outside its training domain; the 81.8% agrees.
- *Where AugmentedNet helps is the silent error.* The current answer is wrong and Bellman-Budge gives the same wrong key on 4 real items (Chopin's G minor and G-sharp minor polonaises, Scherzo No. 2, Sonata No. 2 ii: each answered with its relative major or its enharmonic). AugmentedNet's first key is right on all 4. As a rule "accept the first-version answer only when it equals Bellman-Budge and AugmentedNet's first key": of 349 items both ran on and the current detector answered, 273 are accepted (178 real, 95 generated) and 0 are wrong; 76 go to the agent (35 right, 6 wrong real; 34 right, 1 wrong generated); the 7 UNKNOWN answers also go. Without AugmentedNet, the corrected answer checked against Bellman-Budge alone accepts 199 real items and 4 of them are wrong (the first version: the same 4 items). The four are a small sample.
- Generated items declare their key in the recipe (`keySig`), which is what this page uses as reference; no detector is needed for them.

**key.change.**
- *Per bar, AugmentedNet is far ahead on When in Rome.* Local-key agreement over 8,523 bars: AugmentedNet 89.4% (84.2% on the 17 held-out pieces), the best other tool 69.2% (music21 4-bar Bellman-Budge windows), the current detector's confirmed areas 71.6% (first version) and 68.3% (corrected) on the 80 pieces it ran on, the raw windows 58.5% (section 4.1).
- *Modulation detection is poor for every method.* Against every bar-to-bar key change of the annotation (518), within one bar: AugmentedNet precision 52.6%, recall 67.0%, F1 58.9% (held-out 17: 52.5%, 60.7%, 56.3%). The current areas confirmed by a cadence: precision 37.0%, recall 22.2% (first version), 36.5% and 12.4% (corrected: the home-dominant exclusion costs 104 - 58 = 46 matched modulations, the 145-area fault of row 7 seen again). music21 floatingKey names 72 modulations in all (precision 47.2%, recall 6.6%); the 4-bar windows find most modulations (recall 88.6%) among about 2,400 marks (precision 19.3%). Annotators mark tonicisations as key changes; against key areas of 4 or more bars only (truth runs under 4 bars absorbed), AugmentedNet is at precision 32.4%, recall 70.9% (section 4.1, last tables).
- *As a candidate list for an agent* the union of AugmentedNet's and the current key areas' marks has recall 74.8% at precision 33.0% (all selected pieces, within one bar).
- *Named items* (section 4.2): the current area rule finds the expected area on 13 of the 14 readable Inventions (No. 5 none) and confirms it on 6 (first version) and 3 (corrected); AugmentedNet finds 11 of 15, Bellman-Budge windows 12 of 15, floatingKey 6 of 15; the union of current and AugmentedNet 13 of 15 (the current rule cannot read No. 1; neither finds No. 5). K. 545 i (annotation: G, D minor, A minor, F): current 3 of 4 found and confirmed, AugmentedNet 3 of 4 (it finds A minor and misses D minor), Bellman-Budge windows 3 of 4, floatingKey 0. WTC I No. 1 (annotation: G major, bars 5-10): found by the current rule (confirmed by the first version, not by the corrected), by Bellman-Budge windows, not by AugmentedNet or floatingKey (floatingKey answers A minor for 21 bars of a C major prelude). Happy Birthday (expected: no modulation): the current first version confirms a G major area at 0-based bars 7-11 (the half-cadence case; the corrected version removes it), AugmentedNet, Bellman-Budge windows and floatingKey find no area, Aarden-Essen windows find the same G major area.

**Runtime** (section 5, measured on this machine, 12 worker processes): every profile call averages under 0.1 s per piece; the current detector 0.38 s per piece on average (plus 0.55 s to read the file); music21 windowed and floatingKey analysis 2.6 to 3.2 s per piece on average (maximum 15 s); AugmentedNet 1.4 s per When in Rome piece and 0.76 s per catalogue item after a one-off start-up of about 5 s (7.2 s for a single-piece run, 1.6 s of it inference).

## 7. Limits of this pilot

- The When in Rome truth is another person's analysis (CC BY-SA 4.0); its local keys include tonicisations, so precision of every method at bar resolution is bounded by that. The 94 pieces are 80 keyboard and 14 textbook; nothing here tests pop, jazz or lead sheets, which the catalogue is full of and which no annotated set in reach covers. The textbook pieces, where the current detector ran on 5 of 14, are too few to say anything about them.
- AugmentedNet's When in Rome results are partly in-sample (63 of 80 keyboard pieces are in its training or validation split); the held-out rows are 17 pieces. Its catalogue results are on scores outside its lists but few for `key.change` (15 Inventions, 3 other items).
- The Inventions' expected relation and Happy Birthday's "no modulation" are readings, not annotations. The check for "found" uses the same 4-bar rule as the current detector, so it favours that rule's own notion of an area.
- The "current detector" is the chunk-1 validators' re-implementation (`keyfix.py`, `t_kc.py`), executed unchanged; it is not production code, and the project's reader fails on 13 of 94 When in Rome pieces and on 2 catalogue reference items (Bach Invention No. 1, an IndexError; Chopin Ballade No. 1, the line-109 fault).
- AugmentedNet ran on TensorFlow 2.15.1 and music21 6.7.1 instead of the pinned TensorFlow 2.5.0, with no check of its published accuracy; adopting it means a TensorFlow environment (a separate venv, here reached through a junction because of path length) in the build.
- One run of each; the methods are deterministic, so no variance is reported. Nothing here has been heard.

## 8. Not run, and why

- **justkeydding**: not run: needs a C++ build (section 2).
- **AnalysisGNN** (survey section 10), **DCML corpora**, **Albrecht-Shanahan set**: outside this brief.
- **When in Rome textbook pieces under 8 bars** (187, among them Reger's 117 modulation examples) and **pieces with only a `remote.json`**: not usable here (section 1).
- **AugmentedNet on 2 catalogue items** (Chopin Etude Op. 10 No. 12 and Mazurka Op. 7 No. 4: ZeroDivisionError) and **the current detector on 13 When in Rome pieces and 2 catalogue reference items, Invention No. 1 and Chopin Ballade No. 1** (reader errors).

## 9. Scripts and data in this folder

| file | what it does | writes |
| --- | --- | --- |
| `cmp_common.py` | paths, key helpers, relation classes | - |
| `cur_detector.py` | wraps the current detectors (executes `validation/t_kc.py` helpers, imports `keyfix.py`) | - |
| `wir_select.py` | selects the When in Rome pieces, parses the truth | `wir_pieces.json` |
| `wir_run.py` | current detector and music21 / partitura tools on those pieces | `wir_results.json` |
| `augnet_manifest.py`, `augnet_run.py` | AugmentedNet inputs and inference (run in `build/venv-augnet`) | `augnet_wir_raw.json`, `augnet_cat_raw.json` |
| `augnet_split.py` | which pieces are in AugmentedNet's own splits | `augnet_split.json` |
| `wir_metrics.py` | When in Rome tables (tonic-mode, key.change, runtime) | `wir_metrics.json`, `frag_wir_*.md` |
| `cat_keys.py` | tonic-mode on the catalogue's reference items | `cat_keys_results.json` |
| `cat_kc.py` | key.change on the named catalogue items | `cat_kc_results.json` |
| `cat_metrics.py` | catalogue tables | `cat_metrics.json`, `frag_cat_*.md` |
| `build_key.py` | assembles this page from `key_template.md` and the `frag_*.md` files | `key.md` |

To reproduce: `build/when-in-rome` (sparse clone, commit above), `build/augnet`, `build/venv-augnet`; run the scripts in the order of the table with the main checkout's `.venv` (music21 10.5.0, partitura 1.9.0), `-X utf8`; `augnet_run.py` with `C:/vaug/Scripts/python.exe`.
