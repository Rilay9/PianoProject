| method | pieces | bars with a melody | answered (coverage) | correct / bars (UNKNOWN wrong) | correct / answered | left-hand bars found / present | right-hand bars named left | note P | note R | note F1 | note accuracy | F1 inside bars it answered | seconds per piece mean / median / max | s per 1000 notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| always the right hand (no look at the notes) | 18 | 2513 | 2513 (100.0%) | 2444 (97.3%) | 97.3% | 0 / 69 | 0 | n/a | n/a | n/a | n/a | n/a | - | - |
| current detector (r_melody rules 1, 2, 3) | 18 | 2513 | 596 (23.7%) | 542 (21.6%) | 90.9% | 26 / 69 | 53 | 94.7% | 19.0% | 31.7% | 59.1% | 89.5% | 1.93 / 1.30 / 12.25 | 0.89 |
| skyline, plain (top note at each onset) | 18 | 2513 | 2513 (100.0%) | 2142 (85.2%) | 85.2% | 47 / 69 | 349 | 74.9% | 97.4% | 84.7% | 82.4% | 84.7% | 0.00 / 0.00 / 0.01 | 0.00 |
| skyline, MidiBERT repo (notes >= 60, 8th grid) | 0 | - | did not run on this set | | | | | | | | | | | |
| MidiBERT-Piano, class 1 = melody | 18 | 2513 | 485 (19.3%) | 470 (18.7%) | 96.9% | 0 / 69 | 8 | 95.8% | 9.4% | 17.2% | 54.6% | 57.3% | 2.22 / 2.32 / 4.15 | 1.03 |
| MidiBERT-Piano, class 1 or 2 = melody or bridge | 18 | 2513 | 2005 (79.8%) | 1900 (75.6%) | 94.8% | 9 / 69 | 79 | 86.6% | 51.8% | 64.9% | 72.0% | 70.6% | 2.22 / 2.32 / 4.15 | 1.03 |