# Testing approaches for PianoProject: can existing tools replace or strengthen hand-written test matrices?

Research only. Nothing in the repo was changed. Sizes below were read from the files (`wc -l`, `grep -c`); no repo suite was run. One probe was run on copies in the scratchpad (section 4).

## 1. What the tests are today (surveyed from the files)

| Suite | Size (read from files) |
| --- | --- |
| Python content tests, `tools/content/tests/` | 80 `test_*.py` files, 28,612 lines in total. Run by **unittest** in CI (`.github/workflows/ci.yml:125`), not pytest. **No** `@pytest.mark.parametrize` in any of the named files; loops and `subTest` are used instead |
| TS unit tests, `app/tests/unit/` | 347 files, 96,080 lines, about 3,960 `it(`/`test(` calls; 24 files use `it.each`/`describe.each` |
| e2e tests, `app/tests/e2e/` | 121 entries, Playwright, with some screenshot baselines (`score.spec.ts-snapshots/*.png`) |
| Dependencies | Python: `music21==10.5.0`, `python-ly`, `jsonschema`, `requests`. App: `vitest 5.0.0`, `@playwright/test 1.63.0`, `jsdom`, `fake-indexeddb`. **No** Hypothesis, fast-check, mutmut or Stryker. Seven hits for "hypothesis" in the repo are prose only |

The named Python files, measured from the files:

| File | Lines | `def test_` |
| --- | --- | --- |
| test_generator.py | 795 | 78 |
| test_generator_fingering.py | 1366 | 57 |
| test_generator_invariants.py | 1646 | 70 |
| test_key_spelling.py | 384 | 9 |
| test_family_contracts.py | 751 | 35 |
| test_measured_demands.py | 203 | 8 |
| test_physical_gate.py | 199 | 14 |
| test_study.py | 526 | 29 |
| test_study_distribution.py | 240 | 3 |
| test_musical_evaluator.py | 306 | 16 |
| test_independent_check.py | 137 | 14 |
| test_harmony_facts.py | 63 | 7 |

The patterns in these tests:

1. **Census over the shipped catalog (it is already exhaustive).** `test_generator_invariants.py` has one row per family (`FAMILIES`), and its checks run on the item the plan builds. `test_physical_gate.TestEveryItemInThePlan` covers every generated item. `test_generator.py:155-170` and `test_generator_invariants.py:732,767` loop over `MAJOR_KEYS`, `MINOR_KEYS` and `HARMONY_KEYS`, which hold 12 keys each.
2. **Hand-picked key subsets.** Examples: `for tonic in ("A", "C")`, `("A","E","D","C","F","B-","E-")` (`test_generator_invariants.py:685,693,881,903,1100`), and `("C","G","F","B")` (`test_fingering.py:196`).
3. **Hand-written mutation censuses of data and contracts.**
   - `test_generator_invariants.TestTheChecksGoRedOnAMutation` holds named score mutations (`drop_the_last_bar`, `lift_the_left_hand_two_octaves`, and others). It ends in a census, `test_every_family_has_at_least_one_mutation_that_reddens_it`.
   - `test_family_contracts.TestTheMutationCensus.test_every_promise_can_fail` mutates every contract promise.
   - `test_generator_fingering.TestTheFingeringChecksGoRedOnAMutation` covers `every_root_takes_the_first_finger`, `by_semitones` and others.
   - `test_key_spelling.TestTheMutation` puts the old `_readable` back.

   **Code** mutation is also done by hand at every landing: `docs/prompts/runs/**` holds **414** `*mutant*` files (for example `runs/L120e/mutants.txt`), and `docs/08-test-map.md` cites them ("pinned by 14 mutants").
4. **Adversary tests.** `test_physical_gate.TestAdversaries`, `test_excerpts.TheAdversariesOfIdentity`, `test_study.py:269-312` (a random walk "with the right demands" must fail), and in TS `evidenceAdversarial.test.ts` (369 lines) and `readerAdversarial.test.ts` (271 lines).
5. **Fixture pins.**
   - `fixtures/identity_pins.json` holds 57 family digests tied to a contract version (G21).
   - `bridge_regression.json`, `review_cases.json` and `untaught_on_rung.json` hold about 96 KB of JSON fixtures in total.
6. **A twin implementation held equal on a fixture.** `fixtures/evaluator_twins.json` has **51 hand-constructed phrases**, and only **3 contain a tie**.
   - `app/tests/unit/studyEvaluatorTwin.test.ts` (134 lines) writes `expected` from `sightReadingScore.ts` when `STUDY_TWIN_WRITE=1`.
   - `test_musical_evaluator.py` holds the Python port `musical_evaluator.py` (931 lines) to it.
7. **A sharded perfect-performance sweep.** `perfectPerformance.{1..7}.test.ts` (10 lines each) call `helpers/perfectSweep.ts` (153 lines) and `perfectRun.ts` (335 lines). The sweep runs over the whole catalog, sharded only because vitest gives one worker per file.
8. **Seeded random walks written by hand.**
   - `e2e/score.fuzz.spec.ts` and `score.renderer.fuzz.spec.ts` have their own `mulberry32`, 5 fixed seeds × 45 actions, and invariants checked after every action. A failure prints the seed and the trace, but **the trace is not shrunk**.
   - `sightReading.test.ts` (381 lines) checks the 3,134-line `sightReading.ts` generator on hand-picked seeds: `[1,2,3,77,4096]`, `[5,50,500]`, 999, 12345 and 4242.
   - `composedContract.test.ts` uses 12 fixed seeds.
   - `test_study_distribution.py` uses `SEEDS = range(1, 41)` on purpose, as a distribution measurement.
9. **Round-trip and snapshot tests already exist.**
   - Round-trip wording appears in `test_convert_cache.py`, `test_note_loss.py`, `test_bar_splits.py`, `test_excerpts.py`, `test_validate.py` and `test_record_mirrors.py`.
   - Playwright `toHaveScreenshot` is used in `score.spec.ts` and `score.layout.spec.ts`.
   - No vitest `toMatchSnapshot` was found.

## 2. Candidates (versions and licences read from npm and PyPI on 2026-10-03)

| Tool | Version | Licence | Last release |
| --- | --- | --- | --- |
| Hypothesis | 6.168.3 | MPL-2.0 | 2026-09-28 |
| fast-check | 4.10.2 | MIT | 2026-09-19 (one dependency, `pure-rand`) |
| @fast-check/vitest | 0.5.0 | MIT | 2026-09-11; peer `vitest ^4.1 \|\| ^5.0`, so it fits vitest 5.0.0 |
| mutmut | 3.8.0 | BSD-3-Clause | 2026-09-12; needs **pytest** as runner (pytest runs these unittest files: in the probe it ran `test_musical_evaluator.py` unchanged) |
| cosmic-ray | 8.7.0 | MIT (classifier) | 2026-08-09 |
| @stryker-mutator/core and vitest-runner | 10.0.0 | Apache-2.0 | 2026-08-14; core has about 25 direct dependencies; the runner's peer is `vitest >=2` |
| syrupy (pytest snapshots) | 6.1.1 | MIT | 2026-09-13 |
| approvaltests | 19.1.1 | Apache-2.0 | 2026-08-02 |

## 3. The table

| Testing responsibility | Current tests (file, approx. size) | Candidate tool / approach | Replace or strengthen | What could be deleted | Failures newly exposed | Cost | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Code-level "is this check able to go red"** (the hand-made mutants written for every landing) | 414 `runs/**/mutants*` records; mutants cited in `08-test-map.md` | **mutmut 3** (Python), **Stryker + vitest-runner** (TS), each scoped to the changed file or function | Strengthen the evidence process and replace most hand-written *code* mutants | The hand-crafted code-mutant scripts and texts for each landing (`runs/*/mutants.py`). Keep the tests themselves | Operators no one thought to flip. Probe: 263 surviving mutants in `musical_evaluator.py` against its own test file (section 4) | mutmut: about 2 min on one 931-line module with 4 children here (a relationship, not a benchmark: whole-repo runs would be far longer). Runs on demand, never in CI. Equivalent mutants need triage (the probe found several). Stryker: about 25 dependencies plus vitest re-runs; jsdom tests are slow per mutant | **Investigate, then adopt for pure modules** (evaluator, scoring, spelling, demands). Run on the diff as evidence. Not a CI gate |
| **Domain mutation censuses** (data mutated: drop a bar, lift a hand, loosen a contract) | `test_generator_invariants.TestTheChecksGoRedOnAMutation` (~150 lines), `test_family_contracts.TestTheMutationCensus` (~100), `test_generator_fingering` (~110), `test_key_spelling.TestTheMutation` | none: no tool generates *musically meaningful* mutations | Keep | Nothing | n/a | n/a | **Keep.** These mutate the *music and the contract*, not code operators. mutmut or Stryker cannot express "lift the left hand two octaves" |
| **Port held equal to TS scorer** (the twin) | `evaluator_twins.json` (51 hand-built phrases, 3 with ties); `studyEvaluatorTwin.test.ts` 134 lines; `test_musical_evaluator.py` 306 lines | **Differential testing on generated inputs.** Extend the fixture with phrases from `generateSightReading` over N seeds (levels 1-7, both hands, all time signatures), with `expected` written by the TS side as now (`STUDY_TWIN_WRITE=1`) and asserted by Python. Optionally add a Hypothesis phrase strategy that emits the `barOf` text notation | Strengthen | None (keep the 51 named cases as readable examples) | Port drift on inputs nobody hand-built: ties (only 3 cases), tuplets, rests at bar ends, compound metres. The probe showed that the tie handling in `sounded()` survives mutants such as `open_ = event ... or True` and `continues or ...`. Some of these are equivalent on well-formed input, but not all are checked | Small. No new dependency for the generated-from-TS route; the fixture grows by about a few hundred KB; still deterministic (fixed seed list) | **Adopt.** Highest value for little cost |
| **Evaluator / scoring invariants** (range, transposition) | Asserted only on fixed examples | **Hypothesis** (Python) / **fast-check** (TS) metamorphic properties: parts and total in [0,1]; transposing tune and key together leaves every part unchanged | Strengthen (small) | Nothing | Probe: both properties **pass** on 300 examples, and adding them killed only **2 more** of 1,876 mutants. Generic properties are weak here; the real gaps are specific semantics (ties, cadences) | Hypothesis: one pure-Python dependency, MPL-2.0. Use `derandomize=True` in a CI profile and git-ignore `.hypothesis/` | **Keep the current tests**; add the transposition property only as a cheap guard if Hypothesis is adopted for another reason |
| **Generators valid for any seed** (TS sight reading; Python study realiser) | `sightReading.test.ts` 381 lines with seeds `[1,2,3,77,4096]` and others; `composedContract.test.ts` 12 seeds; `test_study.py:162,269` fixed seeds | **fast-check** `fc.integer()` seeds × level × bars × hands × timeSig → `generateSightReading` → invariants (bar durations sum, range, key, fails closed). **Hypothesis** `st.integers()` seed → `S.Realiser(recipe).compose()` → gates. The failing seed is shrunk and printed, and replayable with `seed`/`path` (fast-check) or `@reproduce_failure` (Hypothesis) | Replace the hand-picked seed lists in the *invariant* tests; strengthen | The literal seed arrays in the invariant loops (a few dozen lines). **Not** `test_study_distribution.SEEDS = range(1,41)`, which is a deliberate measurement with numbers reported per seed set | Seeds or parameter combinations that break a bar sum, a range or a refusal, outside the 5-12 seeds anyone picked. The realiser's refusal path at rarely-hit budgets | fast-check: one dependency, MIT. Each example in `sightReading` parses MusicXML through `toModel` (OSMD and jsdom), so keep `numRuns` around 50-100 with a fixed `seed` in `fc.configureGlobal` for CI determinism. Hypothesis over the realiser is music21-heavy, so use small `max_examples` and `deadline=None` | **Adopt fast-check for `sightReading.ts` invariants. Investigate Hypothesis on the study realiser** (measure the runtime first) |
| **Score-screen state machine** | `e2e/score.fuzz.spec.ts` and `score.renderer.fuzz.spec.ts`: own PRNG, 5 seeds × 45 actions, invariants after each action | **fast-check model-based testing** (`fc.commands` + `fc.asyncModelRun`) | Replace the hand-rolled PRNG/action picker | `mulberry32`, the action picker and the trace printer (tens of lines) | **Shrinking**: a 45-action failing trace reduced to the minimal reproduction. Today a failure prints the full seed trace | Each shrink step re-runs a browser walk, so shrinking costs minutes. Fixed seeds keep it deterministic. A learning cost for the commands API | **Investigate.** It pays only when a fuzz failure is actually being debugged; the current walk already finds faults |
| **Key / spelling across keys** | `test_key_spelling.py` 384 lines / 9 tests (F♯ and G♭ plus "every shipped item under six accidentals"); hand subsets in `test_generator_invariants` | **Exhaustive enumeration with music21 as the oracle**: every key signature (−7..+7, major and minor) × every scale degree → generator spelling == `key.Key(...).pitches` spelling | Strengthen; replace the hand key-subsets where a maker can be called in every key | The tuples `("A","C")` and `("A","E","D")` where the comment does not justify the subset | A key that is not in the shipped plan but is reachable (the reason D0a went wrong: only the shipped items were checked) | Zero new dependencies; music21 is already pinned. Runtime grows linearly with the number of keys (15 signatures) | **Adopt where the space is finite.** Exhaustive enumeration is better than property-based testing here: 12-15 keys is small and every case gets named in the failure |
| **Catalog-wide perfect performance** | `perfectPerformance.{1..7}` plus helpers (~500 lines) | none needed; it is already exhaustive | Keep | Nothing. Vitest's `--shard` splits *across machines*, not workers, so the thin shard files are the right shape | n/a | n/a | **Keep** |
| **Identity pins / version discipline** | `identity_pins.json` (57 digests), `test_family_contracts` `TestIdentity` | syrupy / approvaltests snapshots | Neither | Nothing | None: a digest bound to a contract version is *stricter* than a snapshot, which invites `--snapshot-update` | A dependency for no gain | **Keep** |
| **Twin "expected" written by one side** | `STUDY_TWIN_WRITE=1` | approval testing (approvaltests) | n/a | n/a | n/a | n/a | **Keep**: it is already an approval test in 10 lines with no dependency |
| **MusicXML write → parse → compare** | `test_convert_cache`, `test_note_loss`, `test_bar_splits`, `test_excerpts` (Python, music21); TS `musicXmlWriter.ts` (397 lines) read back via `toModel` in `sightReading.test.ts` | A **property-based round-trip**: fast-check-generated note lists → `musicXmlWriter` → parse → same onsets, durations and pitches; Hypothesis likewise for the Python cutter | Strengthen | Nothing | Duration or tie loss on unusual values (tuplets, dotted values across bars) that no fixture contains | Small once fast-check is in. A writer is a pure function, which suits it best | **Investigate** (pair it with the fast-check adoption above) |
| **Visual output** | Playwright `toHaveScreenshot` baselines | none new | Keep | n/a | n/a | n/a | **Keep** |

## 4. Probe (scratchpad copies only; venv deleted afterwards)

These are observed results, not inferences.

- **Setup.** I copied `tools/content/musical_evaluator.py`, `tests/test_musical_evaluator.py` and `fixtures/evaluator_twins.json` to the scratchpad. pytest 9.1.1 ran the unittest file unchanged: 18 passed, 51 subtests.
- **Hypothesis 6.168.3** (`probe_test_props.py`, saved beside this file). It generates random 4-bar 4/4 phrases (w/h/q/e, rests, MIDI 55-84), a key in fifths −6..6, and an optional declared harmony.
  - (a) Every part and the total lie in [0,1].
  - (b) Transposing tune and tonic by t semitones (`fifths + 7t`) leaves every part and the total identical.
  - **Both passed on 300 examples.** The port is key-agnostic as designed.
- **mutmut 3.8.0** on `musical_evaluator.py`, with `test_musical_evaluator.py` only. There were 1,876 mutants:
  - 1,366 were killed, **265 survived**, 243 had no covering test, and 2 timed out.
  - The "no covering test" mutants are the study-only functions. Those are exercised by `test_study.py` and `test_study_distribution.py`, which were *not* included, so that number overstates the gap.
  - With the Hypothesis file added, **263 survived**: the generic properties killed 2.
  - Survivors cluster in `phrase_slice` (28), `study_motif` (23), `sounded` (20), `phrase_arrival` (19), `rest_facts` (15), `leaps` (13), `turns_of` (12) and `bar_rhythm` (12).
  - Sampled survivors include likely-equivalent ones (`open_ = None` → `""`; `tied_over = True` → `False`, and that field is never read in this file). They also include real gaps: `if continues and open_...` → `or`, and `return 0, 0` → `return 1, 0`; `extreme = start` → `None`; `step > extreme` → `>=`.
  - Conclusion: the twin fixture constrains the port less than its comment implies, and a generated-input differential is the cheaper fix than property tests.
  - Not checked: whether these survivors are also killed by the TS side or by the study tests.
- **Not probed:** Stryker and fast-check (no node probe was run). Their claims above come from the documentation and the package pages.

## 5. Highest-value findings

1. **Generated-input differential for the evaluator twin.** Feed `generateSightReading` phrases over a fixed seed list into `evaluator_twins.json`. The TS side writes `expected`, as it already does, and Python asserts. This needs no new dependency, and it targets the port's demonstrated weak spot: ties (only 3 of 51 cases), rests and leaps.
2. **mutmut / Stryker as the generator of the code-mutant evidence**, scoped to the changed module, in place of the 414 hand-made mutant records. Run it on demand with survivors triaged. It does not replace the *domain* mutation censuses, which should stay.
3. **fast-check for `sightReading.ts` invariants and the `musicXmlWriter` round trip.** This replaces hand-picked seed arrays with shrinking, reproducible search: a fixed global seed in CI and `numRuns` kept small because each example parses through OSMD and jsdom.
4. **Exhaustive key enumeration with music21 as the oracle** wherever a maker can be called in any key, in place of the hand-picked tonic subsets. In a space of 12-15 keys this beats property-based testing.
5. **Honest "keep":** the identity pins, the twin's write-mode (already an approval test), the catalog sweep shards, Playwright screenshots, `test_study_distribution`'s fixed seeds (a measurement), and the domain mutation censuses. No tool improves them. Generic Hypothesis properties on the evaluator added almost nothing (2 of 1,876 mutants).

Adoption notes:
- CI runs `unittest`. Hypothesis works under unittest, but mutmut needs pytest locally. That is only a local tool, so CI is unchanged.
- Seeds need handling: use a Hypothesis profile with `derandomize=True` and git-ignore `.hypothesis/`; use `fc.configureGlobal({ seed })` and paste the reported `seed`/`path` when replaying.

## Sources

- Hypothesis: https://pypi.org/project/hypothesis/ , https://hypothesis.readthedocs.io/en/latest/stateful.html , https://hypothesis.readthedocs.io/en/latest/settings.html (derandomize)
- fast-check: https://www.npmjs.com/package/fast-check , https://fast-check.dev/docs/advanced/model-based-testing/ , https://www.npmjs.com/package/@fast-check/vitest
- mutmut: https://pypi.org/project/mutmut/ , https://github.com/boxed/mutmut
- cosmic-ray: https://pypi.org/project/cosmic-ray/
- Stryker: https://www.npmjs.com/package/@stryker-mutator/core , https://stryker-mutator.io/docs/stryker-js/vitest-runner/
- syrupy: https://pypi.org/project/syrupy/ ; approvaltests: https://pypi.org/project/approvaltests/
- music21 (the oracle for spelling): https://web.mit.edu/music21/doc/moduleReference/moduleKey.html
