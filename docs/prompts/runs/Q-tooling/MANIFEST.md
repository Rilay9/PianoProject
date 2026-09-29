# Evidence manifest: Q-tooling

Written by `tools/docs/evidence_manifest.py`; data only, regenerated, never edited.

| field | value |
| --- | --- |
| folder | `docs/prompts/runs/Q-tooling` |
| HEAD | `6a37126d7248c548763f71cd5f14b4e1ac4d1018` |
| commit | none: the working tree against HEAD |
| chain | not yet run: no `orchestrator-exit.txt` |
| CI | not yet run: the seam's changes are uncommitted |
| captures | 30 run capture(s), 8 with a non-zero exit; 0 sidecar(s); 9 artefact(s) |
| changed files | 12 (the capture folder left out) |

## Changed files

| path | status | blob |
| --- | --- | --- |
| `docs/prompts/checks.json` | A | `d47d4e74b2498c73739294afa6aba97dfe894e30` |
| `docs/prompts/runs/F2/MANIFEST.md` | A | `473a73b09f40821c457da717ab90b76f266b4942` |
| `tools/content/tests/test_checks_for_paths.py` | A | `541219b34b4e095e73f6575724664d885ed21bde` |
| `tools/content/tests/test_ci_order.py` | M | `73aae3f5301ffba9551c2fbb9e51ff78a10a65bf` |
| `tools/content/tests/test_evidence_manifest.py` | A | `701d0c84015a2fd0f26a451e1fa07943fd507552` |
| `tools/content/tests/test_matrix_edit.py` | A | `8b1590fc308f13850fae39efb717b4a27ebd67e6` |
| `tools/content/tests/test_prompt_views_refresh.py` | A | `8b78a7e7fdda9749c3e9b71cac84e2da03ea82e0` |
| `tools/content/validate.py` | M | `4144070a578cac44eb4562dad063708c4f4b2753` |
| `tools/docs/checks_for_paths.py` | A | `f0f83b1bc730b0014409f34d77af9b86b8529776` |
| `tools/docs/evidence_manifest.py` | A | `b02a4396d4dc124bda8b826d8ba2b86435612cb0` |
| `tools/docs/matrix_edit.py` | A | `7305c94574fec01746702cc36c44c282f53d4813` |
| `tools/docs/split_prompt_views.py` | M | `727b02b03dc77f3eaa719f3154262e04b3a63d8c` |

## Captures

Sizes and sha256 of the file as git stores it (CRLF read as LF for text).

| file | kind | command | exit | exit read from | exit lines | bytes | sha256 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ENTRY.md` | artefact |  |  |  |  | 18359 | `207c34db4e1c7a66a57b78280fa85889299d8ee117be32423ecdadc0709b33cd` |
| `checks-for-a-lesson.txt` | capture | `(cwd .) python tools/docs/checks_for_paths.py content/lessons/blues.5.md` | 0 | last line | 1 | 686 | `7feb03a0d636a5a2bd8f8bd2ad3402eacc1a9fe1b8bfad52b975546098f4b2aa` |
| `checks-for-an-unmatched-path.txt` | capture | `(cwd .) python tools/docs/checks_for_paths.py packaging/build-apk.sh docs/pending-review.md` | 0 | last line | 1 | 924 | `f2ca38bb41395317a69ccc22e3110762626c4f7117d9f04b94d16d53d1f59b95` |
| `checks-for-paths-green.txt` | capture | `(cwd .) python -m unittest discover -s tools/content/tests -t tools/content -p test_checks_for_paths.py -v` | 0 | last line | 1 | 2259 | `94235f9d94aee03a2dccade017134557aade5d10873de43abc6ce4ca53edad4a` |
| `ci-order-green.txt` | capture | `(cwd .) python -m unittest discover -s tools/content/tests -t tools/content -p test_ci_order.py -v` | 0 | last line | 1 | 1695 | `580b49e842d49ce61da2ca3ef49489f7427490469c7507a7f129c3c8cd3a3153` |
| `committed-form-check.txt` | capture | `(cwd .) python docs/prompts/runs/Q-tooling/scripts/check_committed_form.py . D4 E2 D5 D4a F2` | 0 | last line | 1 | 208 | `34f8dec46e0f023d4892ed6ba6a715912c0a2eca4289a2eb1044e6938d839c19` |
| `content-build-baseline.txt` | capture | `(cwd .) python tools/content/build.py --offline` | 0 | last line | 1 | 1603 | `493b711f0eaa80289017ed6f92ba11c91e0bce664192e7683c630d693313ac10` |
| `content-build-with-views.txt` | capture | `(cwd .) python tools/content/build.py --offline` | 0 | last line | 1 | 1603 | `0480c42cd47740aaff2714e381b9abd444fea09e7d5ce08f2368e1cc09262639` |
| `copy.txt` | capture | none (label: `midi-parity`) | 1 | last line | 5 | 3230 | `d06f0ece3e6f6b5a4ba3526daf838878bb49018d7aacc6d3c510fc8635a3188f` |
| `manifest-f2.txt` | capture | `(cwd .) python tools/docs/evidence_manifest.py F2 --commit b41e19e` | 0 | last line | 1 | 232 | `dd68c66bb3a69467abb658a8d1279b74902ee472ccb6a0b82dfbf57d2949bee8` |
| `manifest-five-folders-preview.txt` | capture | `(cwd .) python docs/prompts/runs/Q-tooling/scripts/preview_folders.py .` | 0 | last line | 1 | 2369 | `b8f2025fbe7991925469ed59eeb487ea7ed97689230d560cbc3e41ee2d91490b` |
| `map-unmatched-paths.txt` | capture | `(cwd .) python docs/prompts/runs/Q-tooling/scripts/map_unmatched.py .` | 0 | last line | 1 | 398 | `540fb784c6afeda687724a06c662da7206eb944e086faba10a04d8d041515dac` |
| `map-vs-five-chains.txt` | capture | `(cwd .) python docs/prompts/runs/Q-tooling/scripts/map_vs_chains.py .` | 0 | last line | 1 | 1581 | `bb7be1ce03df2c69e7408df052c8cc0c5d107caa9ee1a287fa9a2618aa75fbc7` |
| `matrix-edit-green.txt` | capture | `(cwd .) python -m unittest discover -s tools/content/tests -t tools/content -p test_matrix_edit.py -v` | 0 | last line | 1 | 2159 | `4c6fc367701921f3dd2e5f15ad76f2dcafcca217c537e96349aa008689629f9c` |
| `mutants-ci-superset.txt` | capture | `(cwd .) python docs/prompts/runs/Q-tooling/scripts/ci_superset_mutants.py .` | 0 | last line | 1 | 3375 | `099b348e3ebe961c057acd34d5e5f2fc45c37a6349db7e347e1abdb5327f9218` |
| `npm-ci.txt` | capture | `(cwd app) npm ci` | 0 | last line | 1 | 598 | `23189fa6c1b245e954015d509fd9ff38a7fa2b99f556e55c95d0e0be901568e5` |
| `prompt-views-after-build.txt` | capture | `(cwd .) python -m unittest discover -s tools/content/tests -t tools/content -p test_prompt_views.py -v` | 0 | last line | 1 | 567 | `789f8c914abd0388a0cc6ea12921f98b5766ac768fd99358f64d1a2f151c3839` |
| `prompt-views-after-local-validate.txt` | capture | `(cwd .) python -m unittest discover -s tools/content/tests -t tools/content -p test_prompt_views.py` | 0 | last line | 1 | 210 | `a890704f1a153bfd3920ce978f46fcc03cfa9e1ca214fd69fc9cf4bcb043a0f9` |
| `red-checks-for-paths.txt` | capture | `(cwd .) python -m unittest discover -s tools/content/tests -t tools/content -p test_checks_for_paths.py -v` | 1 | last line | 1 | 1324 | `51a5ba754ea413e7532fb7578541954d00dbca89aeffacdebca5555b42926c19` |
| `red-committed-form-nul-only.txt` | capture | `(cwd .) python docs/prompts/runs/Q-tooling/scripts/check_committed_form_nul_only.py . D4 E2 D5 D4a F2` | 1 | last line | 1 | 265 | `76c7aefcf63b96a65497c75df21f920d7ab659900e85ee4a2fa60179f324a912` |
| `red-evidence-manifest.txt` | capture | `(cwd .) python -m unittest discover -s tools/content/tests -t tools/content -p test_evidence_manifest.py -v` | 1 | last line | 1 | 1332 | `f17db1fdb416169eef9454896def4c222b8b3ab794ad25d3edb13bfa20092831` |
| `red-matrix-edit.txt` | capture | `(cwd .) python -m unittest discover -s tools/content/tests -t tools/content -p test_matrix_edit.py -v` | 1 | last line | 1 | 1272 | `21f858680ae1535f6bac02752bf951d9e88f542ffd422ec2495afbd9c78a1724` |
| `red-prompt-views-after-github-validate.txt` | capture | `(cwd .) python -m unittest discover -s tools/content/tests -t tools/content -p test_prompt_views.py` | 1 | last line | 1 | 1182 | `b4d14fdad7970c2fe1f8e0311b6d8ded63de9d5dcf41c2c6d39e8e1fb093edd7` |
| `red-prompt-views-stale-before-build.txt` | capture | `(cwd .) python -m unittest discover -s tools/content/tests -t tools/content -p test_prompt_views.py -v` | 1 | last line | 1 | 1541 | `bced91092b218377d364e0ec03e60538b9c40dd08a79eb2f69d98b24c83cd61d` |
| `red-views-refresh.txt` | capture | `(cwd .) python -m unittest discover -s tools/content/tests -t tools/content -p test_prompt_views_refresh.py -v` | 1 | last line | 1 | 3498 | `965190944a7d20289baefa72303ee4583864349ceceaade046508dfe2f7eb205` |
| `restore-reports.txt` | capture | `(cwd .) python docs/prompts/runs/Q-tooling/scripts/restore_reports.py .` | 0 | last line | 1 | 245 | `6d6df334e8854744883c7530b9baff74b45910deb7a34403960071261ac29fee` |
| `scripts/check_committed_form.py` | artefact |  |  |  |  | 1385 | `0d5ef2d0bffe14be0962c18361c0c44e9e0ad7c3fc56c98da8aa56a1d75ce0cb` |
| `scripts/check_committed_form_nul_only.py` | artefact |  |  |  |  | 419 | `b509f6d09d0eecabfb096767a7d5100492f4544b01e4fcf92249b52e1dd86d17` |
| `scripts/ci_superset_mutants.py` | artefact |  |  |  |  | 2181 | `fed670d1e49904585defbe0f235ea931d022ab01630f17e0520c58e0f88077e2` |
| `scripts/map_unmatched.py` | artefact |  |  |  |  | 754 | `c375d03c6e06f23bcf1c3a40897eb859ee61a273beed7aef2f7b0a6fed11908a` |
| `scripts/map_vs_chains.py` | artefact |  |  |  |  | 2175 | `411e65ea26dcb1cd5a7ce81f5e18808974907c3da3233df03a25ade7af3d5c1f` |
| `scripts/preview_folders.py` | artefact |  |  |  |  | 929 | `5106deb0fd277f1cb501ddc308a273dd2ae37d24e167c64cf89502a6573e992b` |
| `scripts/restore_reports.py` | artefact |  |  |  |  | 878 | `65c46166e0e2af92fb1bc4d4408031451bc9264694c488fe7da30359925bc81f` |
| `scripts/run-capture.cmd` | artefact |  |  |  |  | 593 | `f0edd101bfcb8fc7bc42a0ff481ab4729357625b0de86f8db68ea80915103437` |
| `sweep-tests-final.txt` | capture | `(cwd tools/content) python -m unittest tests.test_evidence_manifest tests.test_checks_for_paths tests.test_matrix_edit tests.test_prompt_views tests.test_prompt_views_refresh tests.test_ci_order -v` | 0 | last line | 1 | 8795 | `944ca728d831d47a9f4c3558a45fdad0afd9bc5e78b0b66d94413d62b0486a83` |
| `validate-github-runner-stale-view.txt` | capture | `(cwd . with GITHUB_ACTIONS=true) python tools/content/validate.py` | 0 | last line | 1 | 4677 | `4868af5edf50b36671c628af604a7323fcfa6793bb4c672a5b3e7bf0a30f3be3` |
| `validate-local-stale-view.txt` | capture | `(cwd .) python tools/content/validate.py` | 0 | last line | 1 | 4601 | `769fba51f2fb7f0ecc5aac322cdaef8ab07c15da17924aad63a3db850fb569a7` |
| `validator-suites.txt` | capture | `(cwd .) python -m unittest discover -s tools/content/tests -t tools/content -p test_validate*.py` | 0 | last line | 1 | 312 | `dc4455168073ee220747fc04638072c086156f3bcdd5e2d5baf921d10c273c4f` |
| `views-refresh-green.txt` | capture | `(cwd .) python -m unittest discover -s tools/content/tests -t tools/content -p test_prompt_views*.py -v` | 0 | last line | 1 | 1199 | `e7fea332d783d7cb8698bcdfe2daff5274455c3b0ec8b06dbf677431c41a0ce6` |

## Red lines

| file | exit |
| --- | --- |
| `red-checks-for-paths.txt` | 1 |
| `red-committed-form-nul-only.txt` | 1 |
| `red-evidence-manifest.txt` | 1 |
| `red-matrix-edit.txt` | 1 |
| `red-prompt-views-after-github-validate.txt` | 1 |
| `red-prompt-views-stale-before-build.txt` | 1 |
| `red-views-refresh.txt` | 1 |

## Mutants

| file | exit |
| --- | --- |
| `mutants-ci-superset.txt` | 0 |

## Chain

| step | exit |
| --- | --- |
| not yet run | |

## Captures without a command line

- `copy.txt`
