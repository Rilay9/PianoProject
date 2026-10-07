# Evidence manifest: G1

Written by `tools/docs/evidence_manifest.py`; data only, regenerated, never edited.

| field | value |
| --- | --- |
| folder | `docs/prompts/runs/G1` |
| HEAD | `b2b5dd5c8ec2f4dbfd19f09a3bc506c40e5e0bfc` |
| commit | none: the working tree against HEAD |
| chain | `orchestrator-exit.txt`: 6 exit line(s), non-zero: vitest-targeted=1; 0 step(s) with no exit line; CHAIN DONE |
| CI | not yet run: the seam's changes are uncommitted |
| captures | 17 run capture(s), 6 with a non-zero exit; 0 sidecar(s); 3 artefact(s) |
| changed files | 0 (the capture folder left out) |

## Changed files

| path | status | blob |
| --- | --- | --- |
| none | | |

## Captures

Sizes and sha256 of the file as git stores it (CRLF read as LF for text).

| file | kind | command | exit | exit read from | exit lines | bytes | sha256 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `README.md` | artefact |  |  |  |  | 157 | `a135ed809de884176063561fec3c0fd79468b7be7d143ea8a9b22e3975698339` |
| `build-app-head.txt` | capture | none | 0 | last line | 2 | 7059 | `108e820afbae8ae193404e27524f57ff67e6f63031a7815a0a95f33e42e00def` |
| `build-app.txt` | capture | none | 0 | last line | 1 | 6435 | `3b90dd2a340b6f2ecb76e957d375e21c8156840e1fecc83436f30e796120175b` |
| `content-build.log` | capture | none | 0 | last line | 1 | 1325 | `b4cd6e0089f9b993ac100f8ee86da3fb8ecab4506ae5e03517a3bfa5a0dd7b37` |
| `copy.txt` | capture | none (label: `caches`) | 1 | last line | 4 | 1123 | `d146d35f497928213038d7ed2a7a35ec14963aaae7959a11a52c6ecdfed8e863` |
| `e2e-sightread-import-transfer.txt` | capture | none | 0 | last line | 1 | 2617 | `dcf1531f4c1ede3f9a3ef417e1fe17287cf78a90b855fca4deb706274c5aabd3` |
| `lessonClaims-at-head.txt` | capture | none | 1 | last line | 2 | 1829 | `1a7756452de1821b07e3f2f7c4fb2497075e33587c4353ce51f6cd8c12292995` |
| `lint-final.txt` | capture | none | 0 | last line | 1 | 63 | `20e4154e3226d97f16a212c48d9c2d784abd8fcc5a37fe938256d0046c8e7216` |
| `mutants-survivor-rerun.txt` | capture | none | 0 | last line | 1 | 337 | `e2c87c92fc142aa3fbfba4d444e4c245f66221d49c6bcc834537133554842346` |
| `mutants.txt` | capture | none | 0 | last line | 1 | 7846 | `4dd0e8a422618cda215423e940a8731c9f7d89d81e246837becd43a81b22a55e` |
| `named-files.txt` | artefact |  |  |  |  | 1917 | `c373bd4ee92e156e8f3ff575ff2717765d05f17e7770953da3e31f028cacb2fe` |
| `npm-ci.log` | capture | none | 0 | last line | 1 | 579 | `72590aba9715faf6b2ed1497ba3c68d93d7807292c22e9ae48f4b15a93f696b2` |
| `orchestrator-exit.txt` | chain |  |  |  |  | 252 | `36b755aa7e06bfe8fd22fe2973b1439bb4ef1709486cd743c0a7c1d78474d9ad` |
| `parity.log` | capture | none | 0 | last line | 1 | 371 | `9058784ed19ffa2aa7fdef4f976daf8f484fe7579761c2d3e40d848dd6c0a01d` |
| `pictures-probe.txt` | capture | none | 0 | last line | 1 | 1074 | `b1a9bff9465790e532b4e800c4bbfe5011c5647ade09d7a9bf4215f35c664f59` |
| `red-e2e-heard-at-noon-head-app.txt` | capture | none | 1 | last line | 1 | 3034 | `792bb429f573157f6c0f05768722c623dac02fb57c65a64a6a78081b376e3354` |
| `red-vitest-committed-code.txt` | capture | none | 1 | last line | 1 | 9260 | `b47da3465482f3325607de1b756b3202933ddfcfa386a010a1d71909c71fb11a` |
| `red-vitest-final-tests-committed-consumers.txt` | capture | none | 1 | last line | 2 | 11449 | `997a31add9dc0bb7bbd65197c3736be5532ed9cd80d901778a2b7b27cdd0440b` |
| `status-after-build.txt` | artefact |  |  |  |  | 126 | `2e24955ea5f98ee18bb490260cdd4265f0592e0a1db8000b284476267dd2a361` |
| `tsc-final.txt` | capture | none | 0 | last line | 1 | 10 | `75e02ba692dc5094504969a2423036d7767ecab82a1062904659ff9f59993617` |
| `vitest-named-final.txt` | capture | none | 1 | last line | 1 | 40460 | `7834bbba30f102219c3a9e1a1001b79c8ac4f4d03134db02014ab9dc26006d21` |

## Red lines

| file | exit |
| --- | --- |
| `red-e2e-heard-at-noon-head-app.txt` | 1 |
| `red-vitest-committed-code.txt` | 1 |
| `red-vitest-final-tests-committed-consumers.txt` | 1 |

## Mutants

| file | exit |
| --- | --- |
| `mutants-survivor-rerun.txt` | 0 |
| `mutants.txt` | 0 |

## Chain

| step | exit |
| --- | --- |
| tsc | 0 |
| lint | 0 |
| vitest-targeted | 1 |
| build-app | 0 |
| e2e-consumers | 0 |
| vitest-materialLayer-rerun | 0 |

## Captures without a command line

- `build-app-head.txt`
- `build-app.txt`
- `content-build.log`
- `copy.txt`
- `e2e-sightread-import-transfer.txt`
- `lessonClaims-at-head.txt`
- `lint-final.txt`
- `mutants-survivor-rerun.txt`
- `mutants.txt`
- `npm-ci.log`
- `parity.log`
- `pictures-probe.txt`
- `red-e2e-heard-at-noon-head-app.txt`
- `red-vitest-committed-code.txt`
- `red-vitest-final-tests-committed-consumers.txt`
- `tsc-final.txt`
- `vitest-named-final.txt`
