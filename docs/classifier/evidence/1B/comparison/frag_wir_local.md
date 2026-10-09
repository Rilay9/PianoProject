**keyboard (Bach WTC I, Chopin, Mozart sonatas).**

| method | pieces with a result | bar agreement (unanswered = wrong) | coverage | truth modulations | predicted | matched +-1 bar | precision | recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: raw 4-bar partitura windows | 76/80 | 58.5% | 100.0% | 463 | 2475 | 373 | 15.1% | 80.6% | 25.4% |
| current: key areas (4+ bars, no cadence needed) | 75/80 | 67.5% | 100.0% | 456 | 790 | 200 | 25.3% | 43.9% | 32.1% |
| current: areas confirmed by a cadence (first version) | 75/80 | 71.9% | 100.0% | 456 | 279 | 103 | 36.9% | 22.6% | 28.0% |
| current: areas confirmed (corrected, home-dominant exclusion) | 75/80 | 68.5% | 100.0% | 456 | 157 | 57 | 36.3% | 12.5% | 18.6% |
| music21 floatingKey (smoothed) | 80/80 | 62.4% | 99.9% | 486 | 49 | 21 | 42.9% | 4.3% | 7.9% |
| music21 floatingKey raw (one bar) | 80/80 | 44.5% | 99.9% | 486 | 6003 | 481 | 8.0% | 99.0% | 14.8% |
| music21 4-bar windows, Bellman-Budge | 80/80 | 69.4% | 99.8% | 486 | 2348 | 439 | 18.7% | 90.3% | 31.0% |
| music21 4-bar windows, Aarden-Essen | 80/80 | 63.1% | 99.8% | 486 | 2876 | 437 | 15.2% | 89.9% | 26.0% |
| AugmentedNet local key | 80/80 | 89.7% | 100.0% | 486 | 629 | 325 | 51.7% | 66.9% | 58.3% |
| union of marks: AugmentedNet + current key areas (candidate list for an agent) | 75/80 | - | - | 456 | 1048 | 343 | 32.7% | 75.2% | 45.6% |
| union of marks: AugmentedNet + music21 Bellman-Budge windows | 80/80 | - | - | 486 | 1801 | 436 | 24.2% | 89.7% | 38.1% |

**textbook (Aldwell, Kostka, Rimsky-Korsakov, Tchaikovsky; 8+ bars).**

| method | pieces with a result | bar agreement (unanswered = wrong) | coverage | truth modulations | predicted | matched +-1 bar | precision | recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: raw 4-bar partitura windows | 5/14 | 59.6% | 98.2% | 12 | 17 | 10 | 58.8% | 83.3% | 69.0% |
| current: key areas (4+ bars, no cadence needed) | 5/14 | 43.9% | 98.2% | 12 | 3 | 2 | 66.7% | 16.7% | 26.7% |
| current: areas confirmed by a cadence (first version) | 5/14 | 36.8% | 98.2% | 12 | 2 | 1 | 50.0% | 8.3% | 14.3% |
| current: areas confirmed (corrected, home-dominant exclusion) | 5/14 | 36.8% | 98.2% | 12 | 2 | 1 | 50.0% | 8.3% | 14.3% |
| music21 floatingKey (smoothed) | 14/14 | 54.9% | 98.6% | 32 | 23 | 13 | 56.5% | 40.6% | 47.3% |
| music21 floatingKey raw (one bar) | 14/14 | 46.5% | 98.6% | 32 | 92 | 32 | 34.8% | 100.0% | 51.6% |
| music21 4-bar windows, Bellman-Budge | 14/14 | 57.0% | 86.6% | 32 | 34 | 20 | 58.8% | 62.5% | 60.6% |
| music21 4-bar windows, Aarden-Essen | 14/14 | 50.0% | 86.6% | 32 | 34 | 19 | 55.9% | 59.4% | 57.6% |
| AugmentedNet local key | 14/14 | 71.8% | 98.6% | 32 | 31 | 22 | 71.0% | 68.8% | 69.8% |
| union of marks: AugmentedNet + current key areas (candidate list for an agent) | 5/14 | - | - | 12 | 13 | 7 | 53.8% | 58.3% | 56.0% |
| union of marks: AugmentedNet + music21 Bellman-Budge windows | 14/14 | - | - | 32 | 36 | 21 | 58.3% | 65.6% | 61.8% |

**all selected.**

| method | pieces with a result | bar agreement (unanswered = wrong) | coverage | truth modulations | predicted | matched +-1 bar | precision | recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: raw 4-bar partitura windows | 81/94 | 58.5% | 100.0% | 475 | 2492 | 383 | 15.4% | 80.6% | 25.8% |
| current: key areas (4+ bars, no cadence needed) | 80/94 | 67.3% | 100.0% | 468 | 793 | 202 | 25.5% | 43.2% | 32.0% |
| current: areas confirmed by a cadence (first version) | 80/94 | 71.6% | 100.0% | 468 | 281 | 104 | 37.0% | 22.2% | 27.8% |
| current: areas confirmed (corrected, home-dominant exclusion) | 80/94 | 68.3% | 100.0% | 468 | 159 | 58 | 36.5% | 12.4% | 18.5% |
| music21 floatingKey (smoothed) | 94/94 | 62.3% | 99.9% | 518 | 72 | 34 | 47.2% | 6.6% | 11.5% |
| music21 floatingKey raw (one bar) | 94/94 | 44.6% | 99.8% | 518 | 6095 | 513 | 8.4% | 99.0% | 15.5% |
| music21 4-bar windows, Bellman-Budge | 94/94 | 69.2% | 99.6% | 518 | 2382 | 459 | 19.3% | 88.6% | 31.7% |
| music21 4-bar windows, Aarden-Essen | 94/94 | 62.9% | 99.6% | 518 | 2910 | 456 | 15.7% | 88.0% | 26.6% |
| AugmentedNet local key | 94/94 | 89.4% | 100.0% | 518 | 660 | 347 | 52.6% | 67.0% | 58.9% |
| union of marks: AugmentedNet + current key areas (candidate list for an agent) | 80/94 | - | - | 468 | 1061 | 350 | 33.0% | 74.8% | 45.8% |
| union of marks: AugmentedNet + music21 Bellman-Budge windows | 94/94 | - | - | 518 | 1837 | 457 | 24.9% | 88.2% | 38.8% |

**AugmentedNet held-out: keyboard pieces in its test split or in none of its lists (17).**

| method | pieces with a result | bar agreement (unanswered = wrong) | coverage | truth modulations | predicted | matched +-1 bar | precision | recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: raw 4-bar partitura windows | 15/17 | 49.4% | 100.0% | 108 | 495 | 89 | 18.0% | 82.4% | 29.5% |
| current: key areas (4+ bars, no cadence needed) | 15/17 | 63.1% | 100.0% | 108 | 125 | 39 | 31.2% | 36.1% | 33.5% |
| current: areas confirmed by a cadence (first version) | 15/17 | 67.8% | 100.0% | 108 | 41 | 19 | 46.3% | 17.6% | 25.5% |
| current: areas confirmed (corrected, home-dominant exclusion) | 15/17 | 67.6% | 100.0% | 108 | 31 | 14 | 45.2% | 13.0% | 20.1% |
| music21 floatingKey (smoothed) | 17/17 | 60.4% | 99.5% | 122 | 5 | 2 | 40.0% | 1.6% | 3.1% |
| music21 floatingKey raw (one bar) | 17/17 | 40.5% | 99.4% | 122 | 1084 | 120 | 11.1% | 98.4% | 19.9% |
| music21 4-bar windows, Bellman-Budge | 17/17 | 66.5% | 99.0% | 122 | 434 | 102 | 23.5% | 83.6% | 36.7% |
| music21 4-bar windows, Aarden-Essen | 17/17 | 61.1% | 99.0% | 122 | 548 | 106 | 19.3% | 86.9% | 31.6% |
| AugmentedNet local key | 17/17 | 84.2% | 100.0% | 122 | 141 | 74 | 52.5% | 60.7% | 56.3% |
| union of marks: AugmentedNet + current key areas (candidate list for an agent) | 15/17 | - | - | 108 | 188 | 74 | 39.4% | 68.5% | 50.0% |
| union of marks: AugmentedNet + music21 Bellman-Budge windows | 17/17 | - | - | 122 | 330 | 103 | 31.2% | 84.4% | 45.6% |

**AugmentedNet seen: keyboard pieces in its training or validation split (63).**

| method | pieces with a result | bar agreement (unanswered = wrong) | coverage | truth modulations | predicted | matched +-1 bar | precision | recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: raw 4-bar partitura windows | 61/63 | 60.2% | 100.0% | 355 | 1980 | 284 | 14.3% | 80.0% | 24.3% |
| current: key areas (4+ bars, no cadence needed) | 60/63 | 68.4% | 100.0% | 348 | 665 | 161 | 24.2% | 46.3% | 31.8% |
| current: areas confirmed by a cadence (first version) | 60/63 | 72.6% | 100.0% | 348 | 238 | 84 | 35.3% | 24.1% | 28.7% |
| current: areas confirmed (corrected, home-dominant exclusion) | 60/63 | 68.7% | 100.0% | 348 | 126 | 43 | 34.1% | 12.4% | 18.1% |
| music21 floatingKey (smoothed) | 63/63 | 62.8% | 100.0% | 364 | 44 | 19 | 43.2% | 5.2% | 9.3% |
| music21 floatingKey raw (one bar) | 63/63 | 45.4% | 100.0% | 364 | 4919 | 361 | 7.3% | 99.2% | 13.7% |
| music21 4-bar windows, Bellman-Budge | 63/63 | 70.1% | 100.0% | 364 | 1914 | 337 | 17.6% | 92.6% | 29.6% |
| music21 4-bar windows, Aarden-Essen | 63/63 | 63.6% | 100.0% | 364 | 2328 | 331 | 14.2% | 90.9% | 24.6% |
| AugmentedNet local key | 63/63 | 90.8% | 100.0% | 364 | 488 | 251 | 51.4% | 69.0% | 58.9% |
| union of marks: AugmentedNet + current key areas (candidate list for an agent) | 60/63 | - | - | 348 | 860 | 269 | 31.3% | 77.3% | 44.5% |
| union of marks: AugmentedNet + music21 Bellman-Budge windows | 63/63 | - | - | 364 | 1471 | 333 | 22.6% | 91.5% | 36.3% |

**Common set: the 81 pieces on which the current detector ran.**

| method | pieces with a result | bar agreement (unanswered = wrong) | coverage | truth modulations | predicted | matched +-1 bar | precision | recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: raw 4-bar partitura windows | 81/81 | 58.5% | 100.0% | 475 | 2492 | 383 | 15.4% | 80.6% | 25.8% |
| current: key areas (4+ bars, no cadence needed) | 80/81 | 67.3% | 100.0% | 468 | 793 | 202 | 25.5% | 43.2% | 32.0% |
| current: areas confirmed by a cadence (first version) | 80/81 | 71.6% | 100.0% | 468 | 281 | 104 | 37.0% | 22.2% | 27.8% |
| current: areas confirmed (corrected, home-dominant exclusion) | 80/81 | 68.3% | 100.0% | 468 | 159 | 58 | 36.5% | 12.4% | 18.5% |
| music21 floatingKey (smoothed) | 81/81 | 62.2% | 99.9% | 475 | 57 | 26 | 45.6% | 5.5% | 9.8% |
| music21 floatingKey raw (one bar) | 81/81 | 44.6% | 99.8% | 475 | 5702 | 470 | 8.2% | 98.9% | 15.2% |
| music21 4-bar windows, Bellman-Budge | 81/81 | 69.2% | 99.6% | 475 | 2247 | 427 | 19.0% | 89.9% | 31.4% |
| music21 4-bar windows, Aarden-Essen | 81/81 | 62.9% | 99.6% | 475 | 2741 | 423 | 15.4% | 89.1% | 26.3% |
| AugmentedNet local key | 81/81 | 89.4% | 100.0% | 475 | 616 | 318 | 51.6% | 66.9% | 58.3% |
| union of marks: AugmentedNet + current key areas (candidate list for an agent) | 80/81 | - | - | 468 | 1061 | 350 | 33.0% | 74.8% | 45.8% |
| union of marks: AugmentedNet + music21 Bellman-Budge windows | 81/81 | - | - | 475 | 1730 | 425 | 24.6% | 89.5% | 38.5% |

**Modulation detection against key areas of 4+ bars only (truth runs under 4 bars absorbed; `durable()` in wir_metrics.py), keyboard (Bach WTC I, Chopin, Mozart sonatas).** Bar agreement is the same as above.

| method | pieces with a result | bar agreement (unanswered = wrong) | coverage | truth modulations | predicted | matched +-1 bar | precision | recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: raw 4-bar partitura windows | 76/80 | 58.5% | 100.0% | 278 | 2475 | 231 | 9.3% | 83.1% | 16.8% |
| current: key areas (4+ bars, no cadence needed) | 75/80 | 67.5% | 100.0% | 271 | 790 | 140 | 17.7% | 51.7% | 26.4% |
| current: areas confirmed by a cadence (first version) | 75/80 | 71.9% | 100.0% | 271 | 279 | 68 | 24.4% | 25.1% | 24.7% |
| current: areas confirmed (corrected, home-dominant exclusion) | 75/80 | 68.5% | 100.0% | 271 | 157 | 45 | 28.7% | 16.6% | 21.0% |
| music21 floatingKey (smoothed) | 80/80 | 62.4% | 99.9% | 296 | 49 | 6 | 12.2% | 2.0% | 3.5% |
| music21 floatingKey raw (one bar) | 80/80 | 44.5% | 99.9% | 296 | 6003 | 293 | 4.9% | 99.0% | 9.3% |
| music21 4-bar windows, Bellman-Budge | 80/80 | 69.4% | 99.8% | 296 | 2348 | 277 | 11.8% | 93.6% | 21.0% |
| music21 4-bar windows, Aarden-Essen | 80/80 | 63.1% | 99.8% | 296 | 2876 | 275 | 9.6% | 92.9% | 17.3% |
| AugmentedNet local key | 80/80 | 89.7% | 100.0% | 296 | 629 | 208 | 33.1% | 70.3% | 45.0% |
| union of marks: AugmentedNet + current key areas (candidate list for an agent) | 75/80 | - | - | 271 | 1048 | 220 | 21.0% | 81.2% | 33.4% |
| union of marks: AugmentedNet + music21 Bellman-Budge windows | 80/80 | - | - | 296 | 1801 | 281 | 15.6% | 94.9% | 26.8% |

**Modulation detection against key areas of 4+ bars only (truth runs under 4 bars absorbed; `durable()` in wir_metrics.py), all selected.** Bar agreement is the same as above.

| method | pieces with a result | bar agreement (unanswered = wrong) | coverage | truth modulations | predicted | matched +-1 bar | precision | recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: raw 4-bar partitura windows | 81/94 | 58.5% | 100.0% | 281 | 2492 | 233 | 9.3% | 82.9% | 16.8% |
| current: key areas (4+ bars, no cadence needed) | 80/94 | 67.3% | 100.0% | 274 | 793 | 140 | 17.7% | 51.1% | 26.2% |
| current: areas confirmed by a cadence (first version) | 80/94 | 71.6% | 100.0% | 274 | 281 | 68 | 24.2% | 24.8% | 24.5% |
| current: areas confirmed (corrected, home-dominant exclusion) | 80/94 | 68.3% | 100.0% | 274 | 159 | 45 | 28.3% | 16.4% | 20.8% |
| music21 floatingKey (smoothed) | 94/94 | 62.3% | 99.9% | 302 | 72 | 8 | 11.1% | 2.6% | 4.3% |
| music21 floatingKey raw (one bar) | 94/94 | 44.6% | 99.8% | 302 | 6095 | 299 | 4.9% | 99.0% | 9.3% |
| music21 4-bar windows, Bellman-Budge | 94/94 | 69.2% | 99.6% | 302 | 2382 | 282 | 11.8% | 93.4% | 21.0% |
| music21 4-bar windows, Aarden-Essen | 94/94 | 62.9% | 99.6% | 302 | 2910 | 279 | 9.6% | 92.4% | 17.4% |
| AugmentedNet local key | 94/94 | 89.4% | 100.0% | 302 | 660 | 214 | 32.4% | 70.9% | 44.5% |
| union of marks: AugmentedNet + current key areas (candidate list for an agent) | 80/94 | - | - | 274 | 1061 | 223 | 21.0% | 81.4% | 33.4% |
| union of marks: AugmentedNet + music21 Bellman-Budge windows | 94/94 | - | - | 302 | 1837 | 287 | 15.6% | 95.0% | 26.8% |

**Modulation detection against key areas of 4+ bars only (truth runs under 4 bars absorbed; `durable()` in wir_metrics.py), AugmentedNet held-out: keyboard pieces in its test split or in none of its lists (17).** Bar agreement is the same as above.

| method | pieces with a result | bar agreement (unanswered = wrong) | coverage | truth modulations | predicted | matched +-1 bar | precision | recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| current: raw 4-bar partitura windows | 15/17 | 49.4% | 100.0% | 55 | 495 | 45 | 9.1% | 81.8% | 16.4% |
| current: key areas (4+ bars, no cadence needed) | 15/17 | 63.1% | 100.0% | 55 | 125 | 27 | 21.6% | 49.1% | 30.0% |
| current: areas confirmed by a cadence (first version) | 15/17 | 67.8% | 100.0% | 55 | 41 | 13 | 31.7% | 23.6% | 27.1% |
| current: areas confirmed (corrected, home-dominant exclusion) | 15/17 | 67.6% | 100.0% | 55 | 31 | 10 | 32.3% | 18.2% | 23.3% |
| music21 floatingKey (smoothed) | 17/17 | 60.4% | 99.5% | 64 | 5 | 1 | 20.0% | 1.6% | 2.9% |
| music21 floatingKey raw (one bar) | 17/17 | 40.5% | 99.4% | 64 | 1084 | 63 | 5.8% | 98.4% | 11.0% |
| music21 4-bar windows, Bellman-Budge | 17/17 | 66.5% | 99.0% | 64 | 434 | 58 | 13.4% | 90.6% | 23.3% |
| music21 4-bar windows, Aarden-Essen | 17/17 | 61.1% | 99.0% | 64 | 548 | 59 | 10.8% | 92.2% | 19.3% |
| AugmentedNet local key | 17/17 | 84.2% | 100.0% | 64 | 141 | 44 | 31.2% | 68.8% | 42.9% |
| union of marks: AugmentedNet + current key areas (candidate list for an agent) | 15/17 | - | - | 55 | 188 | 45 | 23.9% | 81.8% | 37.0% |
| union of marks: AugmentedNet + music21 Bellman-Budge windows | 17/17 | - | - | 64 | 330 | 59 | 17.9% | 92.2% | 29.9% |
