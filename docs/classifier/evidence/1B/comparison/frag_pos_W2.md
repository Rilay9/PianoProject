**Per-passage class agreement (truth segment vs the method's frame holding most of its events).** Counts are truth segments (one hand-passage of one item = several segments).

| method | stratum | hand-items run | no result | truth segments | class agrees | agreement |
| --- | --- | --- | --- | --- | --- | --- |
| current detector (frames.py, corrected rule) | authored | 26 | 0 | 113 | 71 | 62.8% |
| current detector (frames.py, corrected rule) | generated arpeggio | 48 | 0 | 740 | 405 | 54.7% |
| current detector (frames.py, corrected rule) | generated chromatic | 24 | 0 | 539 | 426 | 79.0% |
| current detector (frames.py, corrected rule) | generated scale | 216 | 0 | 2268 | 2182 | 96.2% |
| current detector (frames.py, corrected rule) | pdmx | 12 | 0 | 248 | 144 | 58.1% |
| current detector (frames.py, corrected rule) | all | 326 | 0 | 3908 | 3228 | 82.6% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | authored | 26 | 0 | 113 | 71 | 62.8% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated arpeggio | 48 | 0 | 740 | 405 | 54.7% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated chromatic | 24 | 0 | 539 | 426 | 79.0% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated scale | 216 | 0 | 2268 | 2182 | 96.2% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | pdmx | 12 | 0 | 248 | 144 | 58.1% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | all | 326 | 0 | 3908 | 3228 | 82.6% |
| pianoplayer fingering, read through hand_def.py | authored | 26 | 0 | 113 | 44 | 38.9% |
| pianoplayer fingering, read through hand_def.py | generated arpeggio | 48 | 0 | 740 | 536 | 72.4% |
| pianoplayer fingering, read through hand_def.py | generated chromatic | 24 | 0 | 539 | 422 | 78.3% |
| pianoplayer fingering, read through hand_def.py | generated scale | 216 | 0 | 2268 | 1912 | 84.3% |
| pianoplayer fingering, read through hand_def.py | pdmx | 12 | 0 | 248 | 183 | 73.8% |
| pianoplayer fingering, read through hand_def.py | all | 326 | 0 | 3908 | 3097 | 79.2% |
| baseline: always says five-finger | authored |  |  | 113 | 91 | 80.5% |
| baseline: always says five-finger | generated arpeggio |  |  | 740 | 541 | 73.1% |
| baseline: always says five-finger | generated chromatic |  |  | 539 | 426 | 79.0% |
| baseline: always says five-finger | generated scale |  |  | 2268 | 2205 | 97.2% |
| baseline: always says five-finger | pdmx |  |  | 248 | 148 | 59.7% |
| baseline: always says five-finger | all |  |  | 3908 | 3411 | 87.3% |

**Truth class by method class (all strata; rows = truth class, columns = the method's class).**

current detector (frames.py, corrected rule):

| truth \ method | five-finger | extended | beyond |
| --- | --- | --- | --- |
| five-finger | 3154 | 99 | 158 |
| extended | 329 | 56 | 68 |
| beyond | 4 | 22 | 18 |

current detector with fixes F1+F2+F3 (hand_fix.py):

| truth \ method | five-finger | extended | beyond |
| --- | --- | --- | --- |
| five-finger | 3154 | 99 | 158 |
| extended | 329 | 56 | 68 |
| beyond | 4 | 22 | 18 |

pianoplayer fingering, read through hand_def.py:

| truth \ method | five-finger | extended | beyond |
| --- | --- | --- | --- |
| five-finger | 2783 | 611 | 17 |
| extended | 157 | 286 | 10 |
| beyond | 10 | 6 | 28 |

**Position shifts at note resolution (+-1 event).** Truth boundary = start of a new fingering-derived segment; predicted boundary = start of a new frame / fingering segment of the method. Precision = matched / predicted; recall = matched / truth.

| method | stratum | truth shifts | predicted | matched | precision | recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| current detector (frames.py, corrected rule) | authored | 87 | 63 | 49 | 77.8% | 56.3% | 65.3% |
| current detector (frames.py, corrected rule) | generated arpeggio | 692 | 288 | 288 | 100.0% | 41.6% | 58.8% |
| current detector (frames.py, corrected rule) | generated chromatic | 515 | 128 | 128 | 100.0% | 24.9% | 39.8% |
| current detector (frames.py, corrected rule) | generated scale | 2052 | 1344 | 1001 | 74.5% | 48.8% | 59.0% |
| current detector (frames.py, corrected rule) | pdmx | 236 | 192 | 174 | 90.6% | 73.7% | 81.3% |
| current detector (frames.py, corrected rule) | all | 3582 | 2015 | 1640 | 81.4% | 45.8% | 58.6% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | authored | 87 | 63 | 49 | 77.8% | 56.3% | 65.3% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated arpeggio | 692 | 288 | 288 | 100.0% | 41.6% | 58.8% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated chromatic | 515 | 128 | 128 | 100.0% | 24.9% | 39.8% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated scale | 2052 | 1344 | 1001 | 74.5% | 48.8% | 59.0% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | pdmx | 236 | 192 | 174 | 90.6% | 73.7% | 81.3% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | all | 3582 | 2015 | 1640 | 81.4% | 45.8% | 58.6% |
| pianoplayer fingering, read through hand_def.py | authored | 87 | 101 | 73 | 72.3% | 83.9% | 77.7% |
| pianoplayer fingering, read through hand_def.py | generated arpeggio | 692 | 665 | 609 | 91.6% | 88.0% | 89.8% |
| pianoplayer fingering, read through hand_def.py | generated chromatic | 515 | 272 | 272 | 100.0% | 52.8% | 69.1% |
| pianoplayer fingering, read through hand_def.py | generated scale | 2052 | 2142 | 1891 | 88.3% | 92.2% | 90.2% |
| pianoplayer fingering, read through hand_def.py | pdmx | 236 | 277 | 228 | 82.3% | 96.6% | 88.9% |
| pianoplayer fingering, read through hand_def.py | all | 3582 | 3457 | 3073 | 88.9% | 85.8% | 87.3% |

Union of marks (every distinct boundary of the current detector or pianoplayer; the pilot's candidate-list form; a mark is true if a truth shift lies within one event, a truth shift is found if a mark lies within one event): 4452 marks, 3922 true: precision 88.1%; truth shifts found 3404 of 3582: recall 95.0%. Same any-within-one criterion for each alone: current detector precision 82.0%, recall 58.1%; pianoplayer precision 93.2%, recall 93.6%.

**Kind at matched boundaries (truth kind from the printed fingering > the method's kind).**

| method | crossing>crossing | crossing>shift | shift>crossing | shift>shift |
| --- | --- | --- | --- | --- |
| current detector (frames.py, corrected rule) | 1080 | 162 | 62 | 336 |
| current detector with fixes F1+F2+F3 (hand_fix.py) | 1019 | 223 | 44 | 354 |
| pianoplayer fingering, read through hand_def.py | 1896 | 567 | 49 | 561 |

Kind right at matched boundaries: current detector (frames.py, corrected rule) 1416 of 1640 (86.3%); current detector with fixes F1+F2+F3 (hand_fix.py) 1373 of 1640 (83.7%); pianoplayer fingering, read through hand_def.py 2457 of 3073 (80.0%).

**Agreement as confidence, not proof.** Predicted shifts by who predicts them (the current detector and pianoplayer within +-1 event of each other), and how many of each are truth shifts:

| predicted by | boundaries | of them truth shifts | share |
| --- | --- | --- | --- |
| both | 1801 | 1572 | 87.3% |
| only current | 214 | 80 | 37.4% |
| only pianoplayer | 1263 | 1134 | 89.8% |

**pianoplayer's fingering against the printed one** (note-by-note digit equality, notes with a printed digit): 7325 of 12046 (60.8%). By stratum: authored 51.4%; generated arpeggio 51.6%; generated chromatic 58.0%; generated scale 63.3%; pdmx 61.7%.

**Runtime per item** (measured on this machine, several processes at once, so an upper bound; items = hand-passages of the truth set).

- current detector: reader + texture view 0.05 s mean, 0.04 s median, 0.34 s max over 178 items (the first item loaded paid a 6 s one-off import); frames + changes 1 ms mean per hand, 17 ms max over 326 hands.
- pianoplayer: 17.8 s mean, 17.0 s median, 42.5 s max over 118 truth items that this session timed (a Python process start is not included; several runs shared the CPU).
