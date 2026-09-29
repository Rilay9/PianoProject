### Entry 113 — Q47: CI fetches the three MAESTRO performances through a verified, cached step, so the converter's real-recording class runs as a gate rather than a skip; a committed one-track fixture puts the hand split under parity on every run; the technique-units test finds the build from its own file (with Q46, 2026-09-29)

**Judgement.** What newly runs in CI once this is pushed, and what it said here:

1. **The converter harness's real-recording class, nine tests** (`TestRealRecordings`, among them *no note is lost or invented between the file and the score*). It skipped on every CI run. Here, on the three performances as the new step extracts them, all nine pass under `CI=1` (`final-harness-ci.txt`). For each of the three recordings the harness observed: notes in the second track; nothing lost, every bar adding up, two parts; the file's own Note-On count equal to the score's struck notes; the independent byte counter agreeing with the reader; not called swung; one braced grand staff; left hand below the right. With the recordings absent the class now **fails under `CI` set** (nine failures, each naming `fetch_maestro.py` and the step "Fetch the MAESTRO test recordings"). On a developer's checkout without them it still **skips** (`red-harness-ci-no-recordings.txt`, `run-harness-no-ci-no-recordings.txt`).
2. **The port's parity on four more references.** `parity_reference.py` now writes eight references: the three recordings, the four committed ones, and the new fixture. `midiParity.test.ts` goes from 38 passed and 4 skipped to 78 passed and 4 skipped. That is 40 newly running cases, ten per new reference. The case *splits the hands the same way* runs and passes on the three recordings and on `one-track-two-hands`. It still skips, by design, on the four references that hold no split (`run-midiParity-eight-references.txt`). Without the recordings the split case still runs, on the fixture alone: `✓ … > one-track-two-hands > splits the hands the same way`. In the before state it ran on nothing (`run-midiParity-fixture-without-recordings.txt` against `before-midiParity-no-recordings-no-fixture.txt`).
3. **The gates around them.** A cache hit is validated, never trusted. Under `CI`, a missing recording now fails the reference writer after it has written the rest; before, the writer exited 0 under `CI=1` with three "skipped, missing" lines (`before-parity-reference-ci.txt`). The writer also refuses the fixture's reference if it holds no split, and removes any earlier reference for it. 27 new tests in the harness step hold these rules, and 17 mutants each turned one red (`red-mutants.txt`).

**The reviewer's worry was real.** The archive's own metadata lists **two** 2011 performances of BWV 885, both titled "Prelude and Fugue in G Minor, WTC II, BWV 885" apart from a double space. A match on composer, title and year alone therefore finds two. Each alias is mapped by member path instead, checked against its metadata row and pinned to the member's SHA256. Those pinned bytes are the main checkout's `build/midi-real/` files: each of the three is byte-identical to its member (`run-compare-with-main-checkout.txt`). So CI will run the harness on exactly the bytes it was built against. Which part of BWV 885 the 45-second performance holds (the metadata's duration; the alias says "prelude") is unverified as music: nothing was heard.

Nothing here reaches a learner's screen. This is tooling, so there is no pedagogical verdict to give. **The CI run itself is unverified until the orchestrator pushes.** That covers the cache miss, then the hit on a second run, and the runner's download.

#### The mapping, as written (`fetch_maestro.PERFORMANCES`; the step's comment lists the same)

| Alias (`build/midi-real/`) | Archive member | Metadata row (composer, title, year) |
| --- | --- | --- |
| `bach-bwv885-prelude-2011.mid` | `maestro-v3.0.0/2011/MIDI-Unprocessed_22_R1_2011_MID--AUDIO_R1-D8_12_Track12_wav.midi` | Johann Sebastian Bach, "Prelude and Fugue in G Minor, WTC II, BWV 885", 2011 (one of two such rows: the count is in `run-fetch-maestro-real-archive.txt`; the other row's member, `…_20_R1_2011_…_Track02_wav.midi`, was read off the metadata in this session and not captured) |
| `grieg-op38-7-waltz-2014.mid` | `maestro-v3.0.0/2014/MIDI-UNPROCESSED_21-22_R1_2014_MID--AUDIO_21_R1_2014_wav--2.midi` | Edvard Grieg, "Lyric Piece in E Minor, “Waltz,” Op. 38 No. 7", 2014 (unique) |
| `scarlatti-k525-2008.mid` | `maestro-v3.0.0/2008/MIDI-Unprocessed_09_R3_2008_01-07_ORIG_MID--AUDIO_09_R3_2008_wav--2.midi` | Domenico Scarlatti, "Sonata K. 525", 2008 (unique) |

The archive: `maestro-v3.0.0-midi.zip`, SHA256 `70470ee2…dde12c`. That is the publisher's figure, re-read on the dataset's page today. Both fetch runs here verified the downloaded zip against it (exit 0). The archive carries its metadata CSV and the CC BY-NC-SA 4.0 `LICENSE`.

#### Done

- **The fetch** (`tools/midi-cleanup/tests/fetch_maestro.py`, new; standard library only). It verifies the archive's SHA256 before opening it. Each alias must match exactly one metadata row by member path, and that row must name the expected composer, work and year. A member listed zero or several times, absent from the archive, empty, or with other bytes than the pinned SHA256 fails, and nothing is written. Only then are exactly three files and `SOURCE.md` written. `SOURCE.md` carries the members and aliases, the version, the archive's checksum, the licence sentence verbatim with the page's URL and the licence's, the citation the dataset asks for with the version, and the date. `--cache-hit true` validates and never downloads: the three files present, non-empty and with the pinned bytes, and `SOURCE.md` naming each alias, member and the checksum. The script's own download path was run once here too (`run-fetch-maestro-download.txt`). It and the `--archive` run both passed the pinned member checksums, so they wrote the same bytes. The zip was then deleted, and only the three files and `SOURCE.md` are kept in the worktree's `build/midi-real/`.
- **The workflow** (`ci.yml`), before "MIDI converter harness", has three steps:
  - "Restore the MAESTRO test recordings": `actions/cache/restore@v4`, keyed by the archive's SHA256 plus a hash of `fetch_maestro.py`.
  - "Fetch the MAESTRO test recordings": runs the script with the restore's `cache-hit`.
  - "Save the MAESTRO test recordings": `actions/cache/save@v4`, only after a fetch that passed.

  The comment carries the licence quoted, the citation and version, and the three member paths. The harness step's comment and the parity step's comment now say what they do. **Deviation 1:** restore, fetch and save as three steps rather than one `actions/cache` step. Two reasons: the combined action saves at the job's end, so a later red step would send the next run back to the download; and the only `actions/cache@` step stays unique, which `test_ci_order` asserts. **Deviation 2:** the key carries the script's hash as well as the checksum, so a changed mapping or check fetches afresh instead of failing validation on an older cache.
- **The skip site** (`test_converter.py`). The class decorator became a `setUp` that skips when `CI` is unset and fails when it is set. The developer behaviour is the same; the rule is read at run time so `TestTheRealRecordingsGate` can hold it with the files made absent. The reason drops "not redistributable" and "no CI step fetches them", and now names the script, the step and the licence. The module docstring's paragraph on real input is brought level.
- **The reference writer** (`parity_reference.py`). `APP_FIXTURES` became (path from the root, must split). The new fixture lives outside `app/tests/fixtures/imports`, so `fixtureFrom` is derived from each path, and `midiParity.test.ts` needed no code change. What now fails:
  - A missing committed fixture, anywhere. **Deviation 3:** the brief spoke of real inputs only, but a missing fixture would silently skip the split assertion; this is Q24's committed-input rule.
  - A missing recording under `CI`, after the rest is written.
  - A must-split fixture whose reference holds none. Any earlier reference for it is removed, so the parity test cannot read a stale one.

  Developers still see "skipped, missing" for a recording, now naming the script.
- **The fixture** (`tools/midi-cleanup/tests/fixtures/make-one-track-two-hands-midi.py` and its `one-track-two-hands.mid`). A conductor track and one note track. Four bars in C, I–IV–V–I, at 90 bpm. The right hand plays half notes above a left-hand line that climbs through middle C to D4. Two runs wrote identical bytes (`fixture-sha-first.txt`, `fixture-sha-second.txt`, `cmp` exit 0). The Python split puts all 8 right-hand and all 14 left-hand notes where the script's table puts them. Its boundary moves from 56 to 68, so a fixed middle-C boundary would have given the left hand's C4 and D4 to the right (`probe-fixture-split.txt`). The port agrees on all ten cases for it. That the texture is idiomatic is unverified as music: nothing was heard.
- **The path** (`test_technique_units.py`). The test reads `common.BUILD_DIR`. From `tools/content/tests/` it was red on the committed code (4 failed, naming `…\tools\content\tests\build\catalog.generated.json`) and is green now. Without the catalogue it fails naming the repository's `build\` path.
- **`test_ci_order.py`** (outside the brief's file list; no other builder owns it). It is the file that holds the step names the gated messages cite, so `CITED` gains the fetch step. A new test holds restore → fetch → save, and fetch before the harness and before the parity reference.
- **`midiParity.test.ts`, two comments only.** They said no committed fixture is split and that the tests skip without the reference; this change made the first false, and Q24 had already made the second false.
- **`docs/00-overview.md`**: D27, beside D23. It records the licence quoted, the citation with the version, the test-only use and where it lives, and that any use beyond testing is a new decision. The licence's own sentence names its publisher and is quoted verbatim, as the brief requires. No AI model or assistant vendor is named anywhere.

#### Not done

- **The CI run and its results in this entry.** The results of the first CI run (the nine tests, the parity on the real references) come after the push, and the orchestrator amends this entry with them, as the brief says. Also unverified until then: the runner's download of the zip, the miss and then the hit, and `actions/cache/restore@v4` and `save@v4` behaving as documented.
- **`docs/08`** is not edited directly; the rows are below for splicing.
- **Not run:** the full `npx vitest run` and the full content suite. This change touches no product code, and neither suite has the build in this worktree. The touched files were run alone.

#### Follow-ups

- **P3, a silent drop in `midiParity.test.ts`.** A reference whose source MIDI is absent is dropped without a word (`if (!existsSync(source)) continue;`). In CI the writer now fails first, so it cannot hide a recording there. Locally it drops stale references quietly. This is the Q24 pattern; not this brief's file.
- **P3, still open from Entry 89.** `test_converter.py`'s docstring run command (`-t .`) fails. `docs/03` line 68 still says the parity tests skip; E2a owns `docs/03` this week.
- **P3, the runner's time.** A cache miss adds one download, and the job gains 27 harness tests plus 40 parity cases. What that costs on GitHub is unmeasured.

#### Questions

None.

#### Files

- New: `tools/midi-cleanup/tests/fetch_maestro.py`, `test_fetch_maestro.py`, `test_parity_reference.py`, `fixtures/make-one-track-two-hands-midi.py`, `fixtures/one-track-two-hands.mid`.
- Changed: `.github/workflows/ci.yml` (three new steps, two comments); `tools/midi-cleanup/tests/test_converter.py` (the skip site, its docstring paragraph, the gate test, two imports); `parity_reference.py` (`APP_FIXTURES`, the missing-file rule, the docstring); `tools/content/tests/test_ci_order.py`; `tools/content/tests/test_technique_units.py` (the path); `app/tests/unit/midiParity.test.ts` (two comments); `docs/00-overview.md` (D27).
- Beside this entry: the captures named below, and `mutate_q47.py`, `probe_fixture_split.py`, `compare_with_main_checkout.py`.

#### Red lines (each once)

| Capture | What went red, and why it had to |
| --- | --- |
| `before-harness-ci.txt` | the committed harness under `CI=1` with no recordings: exit 0, `OK (skipped=9)`, the open gate |
| `before-parity-reference-ci.txt` | the committed writer under `CI=1`: exit 0, "wrote 4", three "skipped, missing" |
| `red-gate-test-on-committed-skip.txt` | the new gate test on the committed skip site: `Tuples differ: (0, 1) != (1, 0)` (it skipped under CI); `'tools/midi-cleanup/tests/fetch_maestro.py' not found in '…no CI step fetches them'` |
| `red-fetch-maestro-no-module.txt` | `ModuleNotFoundError: No module named 'fetch_maestro'` |
| `red-parity-reference-tests-on-committed.txt` | `failures=3, errors=2`: `…one-track-two-hands.mid is not in APP_FIXTURES once`; `TypeError` on the (path, flag) form |
| `red-ci-order-on-committed-ci.txt` | 2 of 9: `expected one step in ci.yml running 'actions/cache/restore@', found 0`; `['Fetch the MAESTRO test recordings'] != []` |
| `red-technique-units-from-tests-dir.txt` | 4 failed: `…\tools\content\tests\build\catalog.generated.json is missing` |
| `red-harness-ci-no-recordings.txt` | the final code, recordings aside, `CI=1`: `FAILED (failures=9)`, each `` …run `python tools/midi-cleanup/tests/fetch_maestro.py` (CI: the step 'Fetch the MAESTRO test recordings', before 'MIDI converter harness')… `` |
| `red-parity-reference-ci-no-recordings.txt` | exit 1 after writing 5 references: three `FAILED, missing under CI: … the step 'Fetch the MAESTRO test recordings' …` |
| `red-fetch-cache-hit-empty.txt` | `--cache-hit true` on an empty restore: exit 1, four "is missing" lines, no download |
| `red-technique-units-no-catalog-from-tests-dir.txt` | the fixed test from its folder, the catalogue aside: fails naming `…\agent-…\build\catalog.generated.json` |
| `red-mutants.txt` | 5 controls green; 17 mutants each red. F1–F9 in the fetch: the archive checksum, a member listed twice, the row's composer and year, an empty member, the member's bytes, the cache-hit path, `SOURCE.md`'s names, a restored file's bytes, a member absent. P1–P4 in the writer: the split refusal, a missing recording under CI, a missing committed fixture, a refused fixture's earlier reference left in place. C1: the class skipping in CI. Y1–Y2 in the workflow: the fetch step renamed, the save step gone. V1: the fixture's reference split moved by one note, which fails the Vitest case. Every file was restored byte-identical. P3 would have survived an earlier form of its test, which wrote nothing else; I tightened the test before this run. P4 is the red for the stale-reference removal, which was written before its test. |

#### Tests

| Test | Class | Why |
| --- | --- | --- |
| `test_converter` › `TestTheRealRecordingsGate` (2) | add | the skip-or-fail rule, run on the class with the files made absent |
| `test_converter` › `TestRealRecordings` (9) | revise (the skip site only) | the decorator became a `setUp` that skips when `CI` is unset and fails when it is set; the reason reworded; no assertion touched |
| `test_fetch_maestro` (20) | add | the fetch's rules on a fixture archive; the real constants against their consumer `REAL_FILES` and `REAL_DIR`; the pinned published checksum |
| `test_parity_reference` (5) | add | the split fixture written with a split; a must-split fixture refused without one, its earlier reference removed; a missing recording failing under CI after the rest is written, reported otherwise; a missing committed fixture failing |
| `test_ci_order` › `test_the_recordings_are_fetched_before_anything_reads_them` | add | restore → fetch → save; fetch before the harness and the reference |
| `test_ci_order` › `test_the_steps_the_failure_messages_name_exist` | revise | `CITED` gains "Fetch the MAESTRO test recordings", which the new messages cite |
| `test_technique_units` › `TestAgainstTheCurriculumAsItStands` (4) | revise (the path only) | `Path("build")` became `BUILD_DIR`, so the tests run from any directory |
| `midiParity.test.ts` | revise (two comments; no assertion) | its cases now also run on the fixture's reference, the split case among them |
| deleted | none | — |

#### Exit codes (captures beside this entry; unpiped)

| Run | Exit |
| --- | --- |
| `npm ci` (`run-npm-ci.txt`) | 0 |
| harness, committed, no recordings: no `CI` / `CI=1` (`before-harness-no-ci`, `before-harness-ci`) | 0 / 0 (9 skipped) |
| writer, committed, `CI=1` (`before-parity-reference-ci`) | 0 |
| `test_ci_order` committed / edited (`before-ci-order`, `red-ci-order-on-committed-ci`, `green-ci-order`) | 0 / 1 / 0 |
| `test_technique_units` committed from root / from its folder; fixed from its folder / from root (`before-…-from-root`, `red-…-from-tests-dir`, `green-…-from-tests-dir`, `green-…-from-root`) | 0 / 1 / 0 / 0 |
| `fetch_maestro.py --archive` (the downloaded zip, SHA256 matched) / its own download / `--cache-hit true` valid / empty | 0 / 0 / 0 / 1 |
| fixture script twice; `cmp` | 0, 0; 0 |
| `probe_fixture_split.py` (the split gives every note its intended hand) / `compare_with_main_checkout.py` (the three files identical and at the pinned SHA256) | 0 / 0 |
| `test_fetch_maestro` before / after the script | 1 / 0 |
| `test_parity_reference` before / after | 1 / 0 |
| harness with the recordings, final: no `CI` / `CI=1` (`final-harness-no-ci`, `final-harness-ci`: 54 tests, OK) | 0 / 0 |
| harness without them: `CI=1` / no `CI` (9 failed / 9 skipped) | 1 / 0 |
| writer `CI=1` with the recordings (8 references) / without (5 written, then failed) | 0 / 1 |
| `npx vitest run tests/unit/midiParity.test.ts`: 8 references / fixture without recordings / before (no fixture, no recordings) | 0 / 0 / 0 |
| `mutate_q47.py` | 0 |
| `npx tsc -b` / `npm run lint` | 0 / 0 |

Prettier flags `midiParity.test.ts` both before and after this change, on the pre-existing lines Entry 89 recorded. It is not a CI step, and this change touches only comments in that file.

##

**Orchestrator's note at the landing (2026-09-29).** Q47's worktree committed by name (8668afb) and merged clean (f52679a); its workflow hunks sat beside the orchestrator's Q63 `paths-ignore` in the trigger block. The chain on the merged main checkout: the harness with and without `CI=1` (the recordings exist under `build/midi-real/` here, so both pass), the reference writer under `CI=1` (eight references), typecheck, lint, the parity unit file — every step exit 0; the CI-order and technique-units tests exit 1 once (harness 0; harness-ci 0; parity-reference-ci 0; content-tests 1; tsc 0; lint 0; vitest-parity 0; content-tests-rerun 0; `runs/Q47/orchestrator-exit.txt`): Q47's path fix made `test_technique_units` run from the repository root for the first time, and its "a second run changes nothing" case caught a fault F2 left — `add_technique_units.py`'s table still listed syncopation among `technique.5`'s concepts after F2 removed it from the stage file (one fact in two places). The orchestrator aligned the table (the one line) as a source-backed correction under F2's accepted claim 5, reran the two tests green (`content-tests-rerun exit=0`), and records it in F2's entry as an addendum. The doc rows spliced into `docs/08` in this record commit (E2a holds the file, so as a splice by the orchestrator; `docs/00` the builder edited directly). **The CI run on the push is the seam's real proof** — the runner's download, the checksum, a cache miss then a hit on a second run, the nine tests and the split parity running there — and this entry is amended with its result when it completes. Nothing heard; nothing musical claimed. Meters at this landing, read once and never subtracted: see the plan's log.


## Doc rows (for the orchestrator to splice into `docs/08`)

Pieces table, a new row:

| **The MIDI converter on real recordings, and the port's hand split, in CI** (Q47 with Q46; the brief approved with one required change, `responses/f52ebde.md`): `fetch_maestro.py` fetches three MAESTRO v3.0.0 performances in the step "Fetch the MAESTRO test recordings", verified against the published SHA256, mapped by member path against the archive's metadata and pinned member bytes, a restored cache validated; `TestRealRecordings` fails under CI without them and skips on a developer's checkout; `parity_reference.py` fails under CI on a missing recording and on a missing committed fixture, and writes the committed one-track fixture with a hand split | nine converter invariants (among them no note lost or invented between the file and the score) and the port's hand split never checked in CI because their inputs were absent and the tests skipped; a composer–title–year match taking the other 2011 BWV 885 performance; a cache restore trusted as proof; a partial fetch hidden by references written for the committed fixtures | `tools/midi-cleanup/tests/test_converter.py` (`TestTheRealRecordingsGate`, added; `TestRealRecordings`, the skip site revised), `test_fetch_maestro.py` (added), `test_parity_reference.py` (added), `app/tests/unit/midiParity.test.ts` (*splits the hands the same way* on `one-track-two-hands` and on the three recordings), `tools/content/tests/test_ci_order.py` (the MAESTRO steps' order) — red on the committed code, 17 mutants red (`docs/prompts/runs/Q47/`) | done locally (Entry 113); the first CI run unverified until the push; nothing heard |

Spec-file lines, replacing or adding:

- Under `app/tests/unit/`, replacing the `midiParity.test.ts` line: `midiParity.test.ts` — the port against the converter it is a port of, stage by stage, on the three Disklavier recordings, two renderings of a committed exercise, the app's two committed MIDI fixtures and `tools/midi-cleanup/tests/fixtures/one-track-two-hands.mid`, the last three converted with `hands=auto`. It compares the same tracks, grid, swing counts, quantised onsets, key, self-check, **the same answer about the hands in the same words**, and the same notes in the same hands for the same durations. The hand split and its boundary are compared on the one-track fixture on every run, and on the three recordings wherever they are present (in CI always, Q47). Fails naming `tools/midi-cleanup/tests/parity_reference.py` and the CI step when `build/midi-parity/` is not there (Q24).
- Under `tools/content/tests/`, adding: `test_ci_order.py` — the CI workflow's order where it is the point (Q24): the build before the content tests, the harness and the parity reference before the unit tests, and (Q47) the MAESTRO restore, fetch and save before the harness and the reference; and that the steps the gated failure messages cite exist.
- Under `tools/content/tests/`, replacing the `test_technique_units.py` line: `test_technique_units.py` — `add_technique_units.py` is idempotent; reads the generated catalogue from the repository's `build/`, from any working directory (Q46).
- Under `tools/midi-cleanup/tests/`, replacing the `parity_reference.py` line: `parity_reference.py` — not a test: it writes what each stage of the converter decided, per fixture, into `build/midi-parity/`, which `app/tests/unit/midiParity.test.ts` compares the TypeScript port against. Three groups: the three recordings (`hands=split`), two renderings of a committed exercise (`hands=keep`), and committed MIDI fixtures (`hands=auto`): the app's `crossed-hands.mid` and `two-hands.mid`, and `fixtures/one-track-two-hands.mid`, whose reference must hold a hand split. It fails on a missing committed fixture, and under CI on a missing recording after writing the rest (Q47). Run it after any change to the converter's rules.
- Under `tools/midi-cleanup/tests/`, replacing the sentence on the real recordings in the `test_converter.py` line: the cases that need the three real Disklavier recordings skip on a developer's checkout and fail under CI, naming `fetch_maestro.py` and the step "Fetch the MAESTRO test recordings" (Q47); `TestTheRealRecordingsGate` holds that rule with the files made absent.
- Under `tools/midi-cleanup/tests/`, adding:
  - `fetch_maestro.py` — not a test: the CI step "Fetch the MAESTRO test recordings", and a developer's way to the three performances. It verifies the archive's published SHA256, maps each alias to one archive member by path against the archive's metadata, pins each member's bytes, and writes `build/midi-real/` with `SOURCE.md` (members, version, checksum, licence quoted, citation). With `--cache-hit true` it validates a restore and never downloads.
  - `test_fetch_maestro.py` — the fetch's rules on a fixture archive: the checksum before extraction, a member listed zero or several times, a row naming another performance, an empty, absent or altered member refused with nothing written, exactly three files and `SOURCE.md`, a restored cache validated; the real aliases equal the harness's.
  - `test_parity_reference.py` — the reference writer's gates: the one-track fixture written with a split, a must-split fixture refused without one and its earlier reference removed, a missing recording failing under CI after the rest is written and reported otherwise, a missing committed fixture failing.
  - `fixtures/` — `make-one-track-two-hands-midi.py` and the `one-track-two-hands.mid` it writes: both hands in one note track, deterministic, its notes stated in the script.
