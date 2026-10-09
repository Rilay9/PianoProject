**When in Rome, works that are in ASAP (PKSpell's training data): 21 pieces, 23,066 notes.**

| method | flags | flags per 1,000 notes | pieces with a flag |
| --- | --- | --- | --- |
| current: spelling filter (PS13 differs, PS13 diatonic, written not) = rule 26 kind 2 | 7 | 0.3 | 2 of 21 (9.5%) |
| current: test 2b (augmented/diminished melodic step that an enharmonic respelling makes plain) | 356 | 15.43 | 20 of 21 (95.2%) |
| current detector: kind 2 + test 2b | 363 | 15.74 | 20 of 21 (95.2%) |
| current detector with fix v1: kind 2 + test 2b cleared by fix v1 | 211 | 9.15 | 20 of 21 (95.2%) |
| ps13 (partitura): every difference from the written spelling | 1,130 | 48.99 | 14 of 21 (66.7%) |
| PKSpell: every difference from the written spelling | 1,425 | 61.78 | 13 of 21 (61.9%) |
| PKSpell with the kind-2 diatonic gate | 77 | 3.34 | 3 of 21 (14.3%) |
| ps13 and PKSpell agree on a spelling that differs from the written one | 72 | 3.12 | 9 of 21 (42.9%) |
| the same, with the diatonic gate | 7 | 0.3 | 2 of 21 (9.5%) |
| current detector with fix v2: kind 2 + test 2b cleared by fix v2 | 175 | 7.59 | 18 of 21 (85.7%) |
| PKSpell with the gate + test 2b with fix v1 | 281 | 12.18 | 20 of 21 (95.2%) |
| PKSpell with the gate + test 2b with fix v2 | 245 | 10.62 | 18 of 21 (85.7%) |
