# CL10a — check request

Implementation: `ce47aef2c7cddd3ac20681b481b0e04713a57904`.
Test-only commit: `d88201aff82a6267c73e95bdc4c2a435dcddf1e9`.
Previous branch head: `07158a437b03cd6fcbda9617a832193c3a91b5b0`.
Original base: `9dedcc0560503f46b18387a5eddf6d0274d54fe2`.
SHAs are copied from repository connector commit records. Local `git log` was unavailable; verify these with `git log -1 --format=%H <sha>` before recording the checks.

## Status and landing boundary

No runtime pass is claimed. Only Python syntax parsing was performed here. The published R37 checkpoint at `checks-79c56589.txt` records its merged-tie presence assertion red and both controls green. This submission adds the full test-only snapshot, then the implementation.

**Not landing-ready until measured pins and claims are reviewed.** The complete corpus is not available in this workspace. The bridge regression JSON and untaught JSON have deliberately not been repinned from guesses. A before/after rebuild must itemise every change and supply the missing measurements. Expected stale-pin failures are not green checks, and must not be waived. A newly lost claim taught by a lesson stops landing; never alter a share threshold or a lesson to silence it.

## Red then green, in isolated checkouts

From `app/` at the test-only commit, then at the implementation:

```sh
npx vitest run tests/unit/cl10aHeldTune.test.ts tests/unit/cl10aNotationReadings.test.ts --reporter=verbose
```

`cl10aNotationReadings.test.ts` has fourteen cases. Predicted at the test-only commit, not observed:

| Case | Expected |
| --- | --- |
| one-staff bass clef, without invented ledger | red |
| clef change in force | red |
| F sharp after C-to-G key change, opening key unchanged | red |
| three quarters in 6/8 are not a walk | red |
| three-of-four walking, qualifying locations only | red |
| three-of-four moving accompaniment | red |
| two-of-three walking stays refused | green control |
| silence and accompaniment-only introduction | red |
| explicit pickup excluded, full ending retained | red |
| lower line alone | green control |
| pickup serialization | red |
| evidence definitions greater than 6 | red |
| one-staff imported bass establishes without old mask | red |
| locations include the repeated performance | green control |

The held-tune file retains its one reproduced red and two controls. The expected aggregate is twelve red and five green cases before the fix; the implementation is requested green. Count the actual results; predictions are not evidence.

The same test-only commit changes `tools/content/tests/test_excerpt_proposer.py` and `test_measured_truth.py`. The new texture-window case should be red before the fix. The real corpus cases require a built corpus: Anh. 113's pattern; one-staff Hot Cross Buns without the clef mask; and the five formerly deferred rung textures. Run these before and after the fix, with matching built artifacts, and name the actual failing assertions.

## Required checks

From the repository root:

```sh
python tools/content/build.py --offline
python tools/content/validate.py --allow-nc --personal
python -m unittest discover -s tools/content/tests -t tools/content
```

From `app/`:

```sh
npx vitest run tests/unit/cl10aHeldTune.test.ts tests/unit/cl10aNotationReadings.test.ts tests/unit/demandDetectors.test.ts tests/unit/demandsOfFiles.test.ts tests/unit/scoreModel.test.ts tests/unit/scoreModelWrittenValues.test.ts tests/unit/importMeasuredTruth.test.ts tests/unit/evidenceVersion.test.ts tests/unit/evidenceByDemand.test.ts tests/unit/evidenceJobRecomputes.test.ts --reporter=verbose
npx tsc -b
```

Use the repository's normal lint command too. Do not read, poll or wait for CI.

## Corpus snapshots and missing itemisation

In the test-only checkout, build before saving its `app/public/content/catalog.json` as `build/cl10a-before-catalog.json`. Preserve that snapshot outside a build-cleaned directory when moving between checkouts. In the implementation checkout save the corresponding catalog as `build/cl10a-after-catalog.json`. The curriculum has not changed.

From the repository root, with both snapshots available:

```sh
python docs/prompts/runs/CL10a/scripts-diff.py build/cl10a-before-catalog.json build/cl10a-after-catalog.json app/public/content/curriculum.json docs/prompts/runs/CL10a/measurements-diff.json
```

The report names every item's presence/establishment change, every rung claim's before/after established-option count, every moved bridge pin, and every changed generated untaught combination. Its reasons identify the reading, and `STOP_lostClaims` refuses a formerly established claim becoming unestablished. It writes a report only; suggested rows are never accepted automatically.

Publish this output and inspect each changed pin against the actual score reading before repinning `tools/content/tests/fixtures/bridge_regression.json` and `untaught_on_rung.json`. Publish the exact accepted pin changes and the complete gained/lost claim list. Until those measurements return this entry's itemisation is explicitly incomplete, not a claim of zero extra changes.

Confirm the five deferral removals individually against real options. The recorded pre-change per-bar counts predict gains at blues.6, blues.8, jazz.6 and jam.6 for walking, and ragtime.5 for left-hand pattern/oom-pah. The 109-of-148 Joplin option is not forced to qualify; other options can establish the rung. If any removal is not established, report its actual eligible/qualifying bars and retain a truthful deferral rather than changing the rule to empty the table.

## One-line mutants, independently reverted

| Mechanism and exact change | Test that must turn red |
| --- | --- |
| extractor: `const clef = clefAt(...)` becomes `const clef = undefined;` | one-staff bass / clef-change cases |
| extractor: `const fifths = keyFifths[sourceMeasureIndex] ?? 0;` becomes `const fifths = keyFifths[0] ?? 0;` | F sharp after C-to-G change |
| walking: `if (isCompound(metre) || metre.beatType !== 4) continue;` becomes `if (false) continue;` | three quarters in 6/8 |
| eligibility upper-note predicate: add `p.note.measureIndex === bar &&` | merged held-tune presence case |
| texture return: `minimumShare: 3 / 4` becomes `minimumShare: 1` | three-of-four walking / pattern |
| overlap declaration becomes `const overlap = lower.length > 0;` | lower line alone |
| qualifier location predicate: `qualifying.has(p.note.sourceMeasureIndex)` becomes `bars.qualifying.includes(p.note.measureIndex)` | repeated performance locations |
| serializer pickup spread becomes `...(pickup === undefined ? {} : {}),` | pickup serialization |
| import established line becomes `established: usefulDensity(located, model.measureCount).filter(d => d !== 'clef.bass'),` | imported bass establishes |
| `EVIDENCE_DEFINITIONS = 7` becomes `EVIDENCE_DEFINITIONS = 6` | evidence definitions greater than 6 |
| proposer `minimum = rule["minimumShare"] if rule is not None else 1.0` becomes `minimum = 1.0` | new texture-window consumer case |

For the ellipsis-only clef mutant above replace the whole actual declaration with the exact one-line `const clef = undefined;`; the source declaration is at `extractScoreModel.ts:517`. Mutants are requested, not run here.
