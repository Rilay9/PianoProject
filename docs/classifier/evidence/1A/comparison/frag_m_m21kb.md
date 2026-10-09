**music21 corpus, keyboard works (9): 9 pieces, 6,890 notes.**

| method | flags | flags per 1,000 notes | pieces with a flag |
| --- | --- | --- | --- |
| current: spelling filter (PS13 differs, PS13 diatonic, written not) = rule 26 kind 2 | 8 | 1.16 | 2 of 9 (22.2%) |
| current: test 2b (augmented/diminished melodic step that an enharmonic respelling makes plain) | 132 | 19.16 | 8 of 9 (88.9%) |
| current detector: kind 2 + test 2b | 140 | 20.32 | 8 of 9 (88.9%) |
| current detector with fix v1: kind 2 + test 2b cleared by fix v1 | 58 | 8.42 | 8 of 9 (88.9%) |
| ps13 (partitura): every difference from the written spelling | 70 | 10.16 | 6 of 9 (66.7%) |
| PKSpell: every difference from the written spelling | 159 | 23.08 | 8 of 9 (88.9%) |
| PKSpell with the kind-2 diatonic gate | 5 | 0.73 | 2 of 9 (22.2%) |
| ps13 and PKSpell agree on a spelling that differs from the written one | 41 | 5.95 | 6 of 9 (66.7%) |
| the same, with the diatonic gate | 5 | 0.73 | 2 of 9 (22.2%) |
| current detector with fix v2: kind 2 + test 2b cleared by fix v2 | 43 | 6.24 | 8 of 9 (88.9%) |
| PKSpell with the gate + test 2b with fix v1 | 55 | 7.98 | 8 of 9 (88.9%) |
| PKSpell with the gate + test 2b with fix v2 | 40 | 5.81 | 8 of 9 (88.9%) |
