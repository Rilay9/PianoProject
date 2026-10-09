| method | pieces | bars with a melody | answered (coverage) | correct / bars (UNKNOWN wrong) | correct / answered | left-hand bars found / present | right-hand bars named left | note P | note R | note F1 | note accuracy | F1 inside bars it answered | seconds per piece mean / median / max | s per 1000 notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| always the right hand (no look at the notes) | 34 | 4763 | 4763 (100.0%) | 4596 (96.5%) | 96.5% | 0 / 167 | 0 | n/a | n/a | n/a | n/a | n/a | - | - |
| current detector (r_melody rules 1, 2, 3) | 34 | 4763 | 1072 (22.5%) | 949 (19.9%) | 88.5% | 41 / 167 | 116 | 94.2% | 18.2% | 30.5% | 59.5% | 88.2% | 1.52 / 1.09 / 12.25 | 0.78 |
| skyline, plain (top note at each onset) | 34 | 4763 | 4763 (100.0%) | 4018 (84.4%) | 84.4% | 114 / 167 | 692 | 75.3% | 97.3% | 84.9% | 83.1% | 84.9% | 0.00 / 0.00 / 0.01 | 0.00 |
| skyline, MidiBERT repo (notes >= 60, 8th grid) | 0 | - | did not run on this set | | | | | | | | | | | |
| MidiBERT-Piano, class 1 = melody | 34 | 4763 | 818 (17.2%) | 798 (16.8%) | 97.6% | 2 / 167 | 12 | 96.9% | 10.2% | 18.5% | 56.0% | 61.0% | 2.01 / 1.83 / 4.15 | 1.04 |
| MidiBERT-Piano, class 1 or 2 = melody or bridge | 34 | 4763 | 3393 (71.2%) | 3140 (65.9%) | 92.5% | 37 / 167 | 201 | 83.9% | 46.0% | 59.4% | 69.3% | 68.4% | 2.01 / 1.83 / 4.15 | 1.04 |