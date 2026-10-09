Seconds per item (mean / median / max). Measured on this machine, 12 worker processes at once; short items (median 4 bars).

| step | items | seconds per item: mean / median / max |
| --- | --- | --- |
| current detector: harmony analysis + first/corrected key + partitura K-S (after loading) | 1282 | 0.10 / 0.03 / 2.76 |
| music21 parse | 1282 | 0.08 / 0.04 / 1.30 |
| music21 K-S | 1282 | 0.05 / 0.03 / 0.57 |
| music21 Aarden-Essen | 1282 | 0.03 / 0.03 / 0.25 |
| music21 Bellman-Budge | 1282 | 0.03 / 0.02 / 0.29 |
| music21 Temperley-Kostka-Payne | 1282 | 0.03 / 0.02 / 0.19 |
| AugmentedNet inference (excluding model load) | 358 | 0.76 / 0.31 / 7.51 |
