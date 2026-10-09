Seconds per piece (mean / median / max) over the pieces each step ran on; pieces have 8 to 318 analysed bars (median 73). Measured on this machine, 12 worker processes at once on 20 logical CPUs; the relation between methods is the point, not the figures.

| step | pieces | seconds per piece: mean / median / max |
| --- | --- | --- |
| music21 parse of the MusicXML | 94 | 1.00 / 0.77 / 3.81 |
| music21 K-S, whole piece | 94 | 0.09 / 0.06 / 0.47 |
| music21 Aarden-Essen, whole piece | 94 | 0.03 / 0.02 / 0.15 |
| music21 Bellman-Budge, whole piece | 94 | 0.03 / 0.02 / 0.15 |
| music21 Temperley-Kostka-Payne, whole piece | 94 | 0.03 / 0.02 / 0.13 |
| project score reader (partitura) | 81 | 0.55 / 0.38 / 2.42 |
| current detector: harmony analysis + first/corrected key + partitura K-S | 81 | 0.38 / 0.26 / 1.33 |
| current: raw 4-bar windows (partitura) | 81 | 0.14 / 0.09 / 0.58 |
| current: areas, cadences, exclusion (after the windows) | 81 | 0.00 / 0.00 / 0.01 |
| music21 floatingKey (smoothed + raw) | 94 | 3.21 / 2.18 / 14.93 |
| music21 4-bar windows, Bellman-Budge | 94 | 2.57 / 1.67 / 11.08 |
| music21 4-bar windows, Aarden-Essen | 94 | 2.75 / 1.82 / 12.42 |
| AugmentedNet inference (excluding model load) | 94 | 1.41 / 1.21 / 6.13 |
