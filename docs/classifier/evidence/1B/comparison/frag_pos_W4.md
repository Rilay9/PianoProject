**Per-passage class agreement (truth segment vs the method's frame holding most of its events).** Counts are truth segments (one hand-passage of one item = several segments).

| method | stratum | hand-items run | no result | truth segments | class agrees | agreement |
| --- | --- | --- | --- | --- | --- | --- |
| current detector (frames.py, corrected rule) | authored | 26 | 0 | 95 | 58 | 61.1% |
| current detector (frames.py, corrected rule) | generated arpeggio | 48 | 0 | 432 | 54 | 12.5% |
| current detector (frames.py, corrected rule) | generated chromatic | 24 | 0 | 344 | 42 | 12.2% |
| current detector (frames.py, corrected rule) | generated scale | 216 | 0 | 2260 | 2168 | 95.9% |
| current detector (frames.py, corrected rule) | pdmx | 12 | 0 | 191 | 124 | 64.9% |
| current detector (frames.py, corrected rule) | all | 326 | 0 | 3322 | 2446 | 73.6% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | authored | 26 | 0 | 95 | 58 | 61.1% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated arpeggio | 48 | 0 | 432 | 54 | 12.5% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated chromatic | 24 | 0 | 344 | 42 | 12.2% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated scale | 216 | 0 | 2260 | 2168 | 95.9% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | pdmx | 12 | 0 | 191 | 124 | 64.9% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | all | 326 | 0 | 3322 | 2446 | 73.6% |
| pianoplayer fingering, read through hand_def.py | authored | 26 | 0 | 95 | 29 | 30.5% |
| pianoplayer fingering, read through hand_def.py | generated arpeggio | 48 | 0 | 432 | 346 | 80.1% |
| pianoplayer fingering, read through hand_def.py | generated chromatic | 24 | 0 | 344 | 287 | 83.4% |
| pianoplayer fingering, read through hand_def.py | generated scale | 216 | 0 | 2260 | 1498 | 66.3% |
| pianoplayer fingering, read through hand_def.py | pdmx | 12 | 0 | 191 | 140 | 73.3% |
| pianoplayer fingering, read through hand_def.py | all | 326 | 0 | 3322 | 2300 | 69.2% |
| baseline: always says five-finger | authored |  |  | 95 | 78 | 82.1% |
| baseline: always says five-finger | generated arpeggio |  |  | 432 | 72 | 16.7% |
| baseline: always says five-finger | generated chromatic |  |  | 344 | 42 | 12.2% |
| baseline: always says five-finger | generated scale |  |  | 2260 | 2189 | 96.9% |
| baseline: always says five-finger | pdmx |  |  | 191 | 99 | 51.8% |
| baseline: always says five-finger | all |  |  | 3322 | 2480 | 74.7% |

**Truth class by method class (all strata; rows = truth class, columns = the method's class).**

current detector (frames.py, corrected rule):

| truth \ method | five-finger | extended | beyond |
| --- | --- | --- | --- |
| five-finger | 2382 | 76 | 22 |
| extended | 672 | 64 | 103 |
| beyond | 1 | 2 | 0 |

current detector with fixes F1+F2+F3 (hand_fix.py):

| truth \ method | five-finger | extended | beyond |
| --- | --- | --- | --- |
| five-finger | 2382 | 76 | 22 |
| extended | 672 | 64 | 103 |
| beyond | 1 | 2 | 0 |

pianoplayer fingering, read through hand_def.py:

| truth \ method | five-finger | extended | beyond |
| --- | --- | --- | --- |
| five-finger | 1596 | 880 | 4 |
| extended | 122 | 704 | 13 |
| beyond | 0 | 3 | 0 |

**Position shifts at note resolution (+-1 event).** Truth boundary = start of a new fingering-derived segment; predicted boundary = start of a new frame / fingering segment of the method. Precision = matched / predicted; recall = matched / truth.

| method | stratum | truth shifts | predicted | matched | precision | recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| current detector (frames.py, corrected rule) | authored | 69 | 63 | 41 | 65.1% | 59.4% | 62.1% |
| current detector (frames.py, corrected rule) | generated arpeggio | 384 | 288 | 288 | 100.0% | 75.0% | 85.7% |
| current detector (frames.py, corrected rule) | generated chromatic | 320 | 128 | 128 | 100.0% | 40.0% | 57.1% |
| current detector (frames.py, corrected rule) | generated scale | 2044 | 1344 | 1000 | 74.4% | 48.9% | 59.0% |
| current detector (frames.py, corrected rule) | pdmx | 179 | 192 | 165 | 85.9% | 92.2% | 88.9% |
| current detector (frames.py, corrected rule) | all | 2996 | 2015 | 1622 | 80.5% | 54.1% | 64.7% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | authored | 69 | 63 | 41 | 65.1% | 59.4% | 62.1% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated arpeggio | 384 | 288 | 288 | 100.0% | 75.0% | 85.7% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated chromatic | 320 | 128 | 128 | 100.0% | 40.0% | 57.1% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated scale | 2044 | 1344 | 1000 | 74.4% | 48.9% | 59.0% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | pdmx | 179 | 192 | 165 | 85.9% | 92.2% | 88.9% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | all | 2996 | 2015 | 1622 | 80.5% | 54.1% | 64.7% |
| pianoplayer fingering, read through hand_def.py | authored | 69 | 59 | 50 | 84.7% | 72.5% | 78.1% |
| pianoplayer fingering, read through hand_def.py | generated arpeggio | 384 | 485 | 369 | 76.1% | 96.1% | 84.9% |
| pianoplayer fingering, read through hand_def.py | generated chromatic | 320 | 137 | 137 | 100.0% | 42.8% | 60.0% |
| pianoplayer fingering, read through hand_def.py | generated scale | 2044 | 1857 | 1708 | 92.0% | 83.6% | 87.6% |
| pianoplayer fingering, read through hand_def.py | pdmx | 179 | 220 | 173 | 78.6% | 96.6% | 86.7% |
| pianoplayer fingering, read through hand_def.py | all | 2996 | 2758 | 2437 | 88.4% | 81.3% | 84.7% |

Union of marks (every distinct boundary of the current detector or pianoplayer; the pilot's candidate-list form; a mark is true if a truth shift lies within one event, a truth shift is found if a mark lies within one event): 3937 marks, 3433 true: precision 87.2%; truth shifts found 2625 of 2996: recall 87.6%. Same any-within-one criterion for each alone: current detector precision 81.3%, recall 56.9%; pianoplayer precision 93.3%, recall 81.5%.

**Kind at matched boundaries (truth kind from the printed fingering > the method's kind).**

| method | crossing>crossing | crossing>shift | shift>crossing | shift>shift |
| --- | --- | --- | --- | --- |
| current detector (frames.py, corrected rule) | 1120 | 287 | 17 | 198 |
| current detector with fixes F1+F2+F3 (hand_fix.py) | 1059 | 348 | 2 | 213 |
| pianoplayer fingering, read through hand_def.py | 1936 | 224 | 9 | 268 |

Kind right at matched boundaries: current detector (frames.py, corrected rule) 1318 of 1622 (81.3%); current detector with fixes F1+F2+F3 (hand_fix.py) 1272 of 1622 (78.4%); pianoplayer fingering, read through hand_def.py 2204 of 2437 (90.4%).

**Agreement as confidence, not proof.** Predicted shifts by who predicts them (the current detector and pianoplayer within +-1 event of each other), and how many of each are truth shifts:

| predicted by | boundaries | of them truth shifts | share |
| --- | --- | --- | --- |
| both | 1671 | 1467 | 87.8% |
| only current | 344 | 172 | 50.0% |
| only pianoplayer | 929 | 830 | 89.3% |

**pianoplayer's fingering against the printed one** (note-by-note digit equality, notes with a printed digit): 7325 of 12046 (60.8%). By stratum: authored 51.4%; generated arpeggio 51.6%; generated chromatic 58.0%; generated scale 63.3%; pdmx 61.7%.

**Runtime per item** (measured on this machine, several processes at once, so an upper bound; items = hand-passages of the truth set).

- current detector: reader + texture view 0.05 s mean, 0.04 s median, 0.27 s max over 178 items (the first item loaded paid a 8 s one-off import); frames + changes 1 ms mean per hand, 24 ms max over 326 hands.
- pianoplayer: 17.8 s mean, 17.0 s median, 42.5 s max over 118 truth items that this session timed (a Python process start is not included; several runs shared the CPU).
