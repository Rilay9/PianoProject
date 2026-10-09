**music21 corpus, Bach chorales: 380 pieces, 94,959 notes.**

| method | flags | flags per 1,000 notes | pieces with a flag |
| --- | --- | --- | --- |
| current: spelling filter (PS13 differs, PS13 diatonic, written not) = rule 26 kind 2 | 0 | 0.0 | 0 of 380 (0.0%) |
| current: test 2b (augmented/diminished melodic step that an enharmonic respelling makes plain) | 685 | 7.21 | 273 of 380 (71.8%) |
| current detector: kind 2 + test 2b | 685 | 7.21 | 273 of 380 (71.8%) |
| current detector with fix v1: kind 2 + test 2b cleared by fix v1 | 161 | 1.7 | 115 of 380 (30.3%) |
| ps13 (partitura): every difference from the written spelling | 776 | 8.17 | 102 of 380 (26.8%) |
| PKSpell: every difference from the written spelling | 30 | 0.32 | 25 of 380 (6.6%) |
| PKSpell with the kind-2 diatonic gate | 0 | 0.0 | 0 of 380 (0.0%) |
| ps13 and PKSpell agree on a spelling that differs from the written one | 12 | 0.13 | 10 of 380 (2.6%) |
| the same, with the diatonic gate | 0 | 0.0 | 0 of 380 (0.0%) |
| current detector with fix v2: kind 2 + test 2b cleared by fix v2 | 76 | 0.8 | 58 of 380 (15.3%) |
| PKSpell with the gate + test 2b with fix v1 | 161 | 1.7 | 115 of 380 (30.3%) |
| PKSpell with the gate + test 2b with fix v2 | 76 | 0.8 | 58 of 380 (15.3%) |
