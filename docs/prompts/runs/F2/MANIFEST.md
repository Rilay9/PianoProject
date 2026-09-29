# Evidence manifest: F2

Written by `tools/docs/evidence_manifest.py`; data only, regenerated, never edited.

| field | value |
| --- | --- |
| folder | `docs/prompts/runs/F2` |
| HEAD | `6a37126d7248c548763f71cd5f14b4e1ac4d1018` |
| commit | `b41e19ea0b7e02d6b98b0b7fd6faab0913dedae5` |
| merged into HEAD's line at | `0482243ece59fda3dedd542004575b0af0a292a7` |
| chain | `orchestrator-exit.txt`: 11 exit line(s), non-zero: vitest-targeted=1; 0 step(s) with no exit line; CHAIN DONE |
| CI | run 36525222177: in_progress on `05c9e01` (4 earlier carrying run(s) cancelled) |
| captures | 25 run capture(s), 7 with a non-zero exit; 0 sidecar(s); 23 artefact(s) |
| changed files | 29 (the capture folder left out) |

## Changed files

| path | status | blob |
| --- | --- | --- |
| `app/tests/e2e/today.spec.ts` | M | `bb06e844095dbb0cfb9f96b7578376c20c1598be` |
| `app/tests/unit/helpers/promises.ts` | M | `e93c780220c14f47d69baf343226988df5c63f20` |
| `app/tests/unit/lessonClaimsAboutApp.test.ts` | M | `65f55eeb44a1225af4a0c9605df72723958da4db` |
| `app/tests/unit/lessonShape.test.ts` | M | `3553ab20ce9e9e2054c9052a4282daafa9afbc76` |
| `app/tests/unit/sightReadingPromises.test.ts` | M | `76dd66143e33335e1399c3523bf1e24d78580cf5` |
| `app/tests/unit/taughtByAncestry.test.ts` | M | `480cb9ce313a7e280f38480165542e989d33b67a` |
| `content/catalog.static.json` | M | `54af18387703e777973bc2cd860341792b3d34ba` |
| `content/curriculum.schema.json` | M | `bbfe7b9bc69c48ac39897f75520bb6ebb0bb931e` |
| `content/curriculum/stage-1.json` | M | `f6f680cc70a15c8e77e5b83f20c0cb4e3ad5da01` |
| `content/curriculum/stage-2.json` | M | `1d3ce5f0b14ff12ddbb570a37bb0768daba87aad` |
| `content/curriculum/stage-3.json` | M | `1e64354794e876db6a1bdeaf967087695e5a9d63` |
| `content/curriculum/stage-5.json` | M | `9935d75834edb6064b1f12541fdb029df55e0a37` |
| `content/curriculum/stage-9.json` | M | `dc611c457140ca4c0aaa42af4eeb7b3ecaabfb81` |
| `content/curriculum/vocabulary/demands.json` | M | `c590cb3d4e028d565d20d8a695cdc6804f552074` |
| `content/lessons/blues.5.md` | M | `81604c2ea8fdf721802aedb6f30cc001100bce5c` |
| `content/lessons/latin.3.md` | M | `3f6099173e50763c539d35e653c71a0410816e87` |
| `content/lessons/latin.md` | M | `3cef0f25817a4d207739d240efeb08eb64693c5e` |
| `content/lessons/theory.9.md` | M | `b64fd2269a0a98e40b94138f3f15c6957fb27382` |
| `content/sources/pdmx-wants.json` | M | `92c8080e7be43a3819b5d919cde3508ab11f7b6e` |
| `docs/02-curriculum.md` | M | `4a348b7ea30aab537c6c01f30e6d8f6d78667ddc` |
| `docs/generated/ladder.md` | M | `fb047693cf15892fd9473d47a9d3a868f11785de` |
| `docs/prompts/inventory.md` | M | `8b9109633d1170c8dd06b3cc0ad613ee40733fdb` |
| `docs/prompts/rung-claims.md` | M | `c325403cd5bc95d0fef494ec60c52b6a35467952` |
| `tools/content/claims.py` | M | `61743581a3102dbdfb1e2da7561d45ba0215c8a3` |
| `tools/content/tests/fixtures/untaught_on_rung.json` | M | `0d182f8443b6699d23c9e40a964cf1bfb64f2d1a` |
| `tools/content/tests/test_measured_truth.py` | M | `52b643256fed78797ae8275420bf102ae8f1fb65` |
| `tools/content/tests/test_taught_at.py` | M | `4084b855293a8bd135dd6dfaeff344ede6f891a5` |
| `tools/content/tests/test_validate_claims.py` | A | `042b4e15d153ab923ea89e275d2ba0f4dc928c8b` |
| `tools/content/validate.py` | M | `8d56fdba43f42d3ee2650b5f5248ff07a5fdd7e3` |

## Captures

Sizes and sha256 of the file as git stores it (CRLF read as LF for text).

| file | kind | command | exit | exit read from | exit lines | bytes | sha256 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `README.md` | artefact |  |  |  |  | 871 | `41f6f73ea0ce03b0b31ad788a3c76bb551e5dd3bffc42577bd1dd61ca973f110` |
| `after-inventory.md` | artefact |  |  |  |  | 33246 | `c045775747f7ccb7b73659ff2b474dca2176cbf8d8df9a54a403e0ae5fc0e2fe` |
| `after-rung-claims.md` | artefact |  |  |  |  | 99568 | `546c0827efe2f4a0ecacf3c64620996ccaf89c4e943bad5aad846df6fdf90f3d` |
| `app-named-1.txt` | capture | none (label: `app named tests (F2 build)`) | 1 | first line | 1 | 1331 | `1015ef77cf75e70de5597fe14ccbc0843be37d4adbc95c8461200698a2483ae2` |
| `app-named-2.txt` | capture | none (label: `lessonShape + lessonClaimsAboutApp`) | 1 | first line | 1 | 755 | `5fabf1b03d1cedf62d403d4b325bd03eb7e04c02245c0053616faad8e019f579` |
| `app-named-final.txt` | capture | none (label: `app named tests (final build)`) | 1 | first line | 1 | 754 | `ca4c65e14f417159b77ac8c1ec66c214fdbbec61e3231ea9ae81ea4edee911a4` |
| `before-inventory.md` | artefact |  |  |  |  | 33646 | `00afc44964e2c764ad741a830bdde6f82a5a4faebfc57b27f162be70b9c264c5` |
| `before-rung-claims.md` | artefact |  |  |  |  | 103562 | `b735c64da617d06364d642abfd4253c9e07717882a4ad4bc0b51683bfd276dd9` |
| `build-app-after.txt` | capture | none (label: `build:app (after)`) | 0 | first line | 1 | 122 | `9b1087cc84eede0ecb3e0dfb0fd8595173e2cf21770482ec63625f82fef0a12b` |
| `build-app-before.txt` | capture | none (label: `build:app (before)`) | 0 | first line | 1 | 123 | `a3c6cc1606435d6622bec2a74b1edb920ab7d83d552e465a43620efb0d6cebd2` |
| `content-build-after-1.txt` | capture | none (label: `content build (F2, first)`) | 1 | first line | 1 | 1619 | `6a4c930d5f46b2a8290cab589537620c1fcbd1c1e1c6b86de09ffed5159fea25` |
| `content-build-before.txt` | capture | none (label: `content build (before)`) | 0 | first line | 1 | 1564 | `353f7eec2b1f88ad670ceded75a3b3f857c5a61b1f79e142a61dd3e72eb76687` |
| `content-build-final.txt` | capture | none (label: `content build (F2, final)`) | 0 | first line | 1 | 1567 | `800370a4458b46caad9bcb736f468d07dc3d2596c15ee8a6f3545aa84c0da985` |
| `content-suites-2.txt` | capture | none (label: `test_measured_truth.py`) | 0 | first line | 5 | 284 | `b592431301dd7ec879979ecbf7b37b48969cea2b1eace7e529f7e0df58d5d628` |
| `content-suites-final.txt` | capture | none (label: `validate.py (final build)`) | 0 | last line | 6 | 317 | `5d13cbca4ba30624038bbfac77a8d318e64575f07bcf2b7e4bc3603b29438b4d` |
| `content-suites.txt` | capture | none (label: `test_measured_truth.py`) | 1 | first line | 5 | 622 | `fdeb3f05a17231e952610fe4fee0ac22f6b0b8ab7ba29af5e2c6c67af7577b09` |
| `copy.txt` | capture | none (label: `midi-real`) | 1 | last line | 4 | 2483 | `ea1b975b7e5d52ebb7c463646498c991af8bd119beed59517bc37c48409a0aed` |
| `diaries-after-ambiguity-a.txt` | artefact |  |  |  |  | 34471 | `68d85e1d2ecd8e8b62ee164de951c818866d58ac1ee5886c9aeabc04e687b505` |
| `diaries-after-ambiguity-b.txt` | artefact |  |  |  |  | 34390 | `4dfbf7468a955276cd6e0d48ebb848e7a5b7ba64a7a71599c2712fec923c2180` |
| `diaries-after-intermediate.txt` | artefact |  |  |  |  | 77406 | `a2a4853480a1f1de647e3ef71bb7bec2a32e29f0b123cea4c5d05ab702fc008d` |
| `diaries-after-musician.txt` | artefact |  |  |  |  | 70177 | `03b8922829dbbf4c1a32c7bf29b9772ce5aea0aa78204ca85ef539f3d8209ec0` |
| `diaries-after-skip.txt` | artefact |  |  |  |  | 85926 | `132c3f0f66ca73be29f8f0461ec7eefe55c89eedc9e8a900a4f5aa2e6ab1673d` |
| `diaries-after.txt` | capture | none (label: `diaries after`) | 0 | first line | 1 | 156 | `572463c88534c61dbfd4042742e8ddd2c79e0659b1159210fe19efaf3f472a18` |
| `diaries-before-ambiguity-a.txt` | artefact |  |  |  |  | 34471 | `68d85e1d2ecd8e8b62ee164de951c818866d58ac1ee5886c9aeabc04e687b505` |
| `diaries-before-ambiguity-b.txt` | artefact |  |  |  |  | 34390 | `4dfbf7468a955276cd6e0d48ebb848e7a5b7ba64a7a71599c2712fec923c2180` |
| `diaries-before-intermediate.txt` | artefact |  |  |  |  | 77406 | `a2a4853480a1f1de647e3ef71bb7bec2a32e29f0b123cea4c5d05ab702fc008d` |
| `diaries-before-musician.txt` | artefact |  |  |  |  | 70177 | `03b8922829dbbf4c1a32c7bf29b9772ce5aea0aa78204ca85ef539f3d8209ec0` |
| `diaries-before-skip.txt` | artefact |  |  |  |  | 85926 | `132c3f0f66ca73be29f8f0461ec7eefe55c89eedc9e8a900a4f5aa2e6ab1673d` |
| `diaries-before.txt` | capture | none (label: `diaries before`) | 0 | first line | 1 | 156 | `2b9e701a0507be4ddbfdb0de0c28e28597a3e6c41867776199aa44a96cb76435` |
| `diaries-compared.txt` | artefact |  |  |  |  | 367 | `a3b8f9309aa083f3ee60f51edeea709f77fb73e19685e2145d9441270ef655db` |
| `e2e-today-after.txt` | capture | none (label: `today spec (after, final build)`) | 0 | first line | 1 | 65 | `52395fd1688eaf9f05730f2d2d592664f14a2410bce0af20cf36acae07d0f504` |
| `e2e-today-before.txt` | capture | none (label: `today spec (before, baseline build)`) | 1 | first line | 1 | 545 | `985f361922241cc3085a59e204c73e6a08b985b8bc7562007a008cc16dad82a3` |
| `ladder-report.txt` | capture | none (label: `ladder_report`) | 0 | first line | 1 | 155 | `151f5ae51f1ab549e05b6684bf3b3246e741e9206d56c30862a7482bb529a22b` |
| `lint-touched.txt` | capture | none (label: `eslint (touched files)`) | 0 | last line | 1 | 33 | `116c3230d48a3024750fd6086dfcc2cf117431d83f0b328ecf6cf8e367ab8fd5` |
| `look-after.txt` | capture | none (label: `look (after)`) | 0 | first line | 1 | 44 | `d1e8817cc4868ddfb43e0a7fbf08ad3b91c4d012a6eccf4464d827cb499e305c` |
| `look-before.txt` | capture | none (label: `look (before)`) | 0 | first line | 1 | 46 | `501b6947debe28ad33c8069e08b8eb4a5629b3cd07317261a3ebe55ae3b118f7` |
| `npm-ci.txt` | capture | none (label: `npm ci`) | 0 | last line | 1 | 17 | `95da6b27cbdfca139bbe8abe7b94c36e7ae5834b67828a70a2f371c3bf4d73f0` |
| `orchestrator-exit.txt` | chain |  |  |  |  | 542 | `fda55f4486eb3c002a8f0c5822e8402e8aad57d565ea20ef79904410c6d818b3` |
| `parity.txt` | capture | none (label: `parity`) | 0 | last line | 1 | 17 | `7dc45364fa99215ddc04aeb42ddcbcfb36fd98e5c997c69f33fd4d800014f348` |
| `question-1-scenarios.txt` | artefact |  |  |  |  | 2576 | `169f8f8a53ed28257e1a1aa5df219575bc67bf16c15afa11ddb01baae568d8dd` |
| `record-moves.txt` | artefact |  |  |  |  | 1866 | `680f1d93738493a92a0ddfb75853a045d726e5fd3e3491b60f4955466797fd1a` |
| `red-app.txt` | artefact |  |  |  |  | 2095 | `735f7f8f708d6dca8552b0381d14ea0ae9cb7c5d6b516cae542a5338b390252c` |
| `red-content.txt` | artefact |  |  |  |  | 5205 | `b144d95822338adb83489927b09602ae634253fadf27380b03a43d980ed8ea46` |
| `red-e2e-today.txt` | artefact |  |  |  |  | 3050 | `7ee06ef8961e8ff3c7e6419744215de8d2955dd286228b4abe083ef748ca9cf2` |
| `restore-sources.txt` | artefact |  |  |  |  | 58 | `401671f6344ef26fb3c92731b3575bf75f6a4490bb02f0cf040cf89d58964f82` |
| `step-reports.txt` | capture | none (label: `step_reports (3)`) | 0 | last line | 3 | 247 | `3eb2541d7de728d9f782faf3eaa9cb7161f810947bc4b44e99d4c1507a768c36` |
| `tsc.txt` | capture | none (label: `npx tsc -b`) | 0 | last line | 1 | 21 | `0fb07817e3a0a3dcfd3a7b75c3dbbcf771c82896a0304e75ca40d36031c20b6e` |
| `validate-1.txt` | capture | none (label: `validate`) | 0 | first line | 1 | 2614 | `a9803328de1618b1803b116f554811ec404adaca1140ca5395aa2d0bb81dea9b` |
| `validate-final.txt` | artefact |  |  |  |  | 2598 | `747b4907fab89a18852eda4342fc2a51e3cb4b5dbec332015f4cf095235e8a90` |

## Red lines

| file | exit |
| --- | --- |
| `red-app.txt` | none |
| `red-content.txt` | none |
| `red-e2e-today.txt` | none |

## Mutants

| file | exit |
| --- | --- |
| none | |

## Chain

| step | exit |
| --- | --- |
| content-build | 0 |
| content-validate | 0 |
| review-check | 0 |
| content-tests | 0 |
| tsc | 0 |
| lint | 0 |
| vitest-targeted | 1 |
| vitest-diaries | 0 |
| build-app | 0 |
| vitest-picks-rerun | 0 |
| e2e-today | 0 |

## Captures without a command line

- `app-named-1.txt`
- `app-named-2.txt`
- `app-named-final.txt`
- `build-app-after.txt`
- `build-app-before.txt`
- `content-build-after-1.txt`
- `content-build-before.txt`
- `content-build-final.txt`
- `content-suites-2.txt`
- `content-suites-final.txt`
- `content-suites.txt`
- `copy.txt`
- `diaries-after.txt`
- `diaries-before.txt`
- `e2e-today-after.txt`
- `e2e-today-before.txt`
- `ladder-report.txt`
- `lint-touched.txt`
- `look-after.txt`
- `look-before.txt`
- `npm-ci.txt`
- `parity.txt`
- `step-reports.txt`
- `tsc.txt`
- `validate-1.txt`
