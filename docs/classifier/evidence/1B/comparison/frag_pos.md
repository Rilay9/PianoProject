**Per-passage class agreement (truth segment vs the method's frame holding most of its events).** Counts are truth segments (one hand-passage of one item = several segments).

| method | stratum | hand-items run | no result | truth segments | class agrees | agreement |
| --- | --- | --- | --- | --- | --- | --- |
| current detector (frames.py, corrected rule) | authored | 26 | 0 | 103 | 64 | 62.1% |
| current detector (frames.py, corrected rule) | generated arpeggio | 48 | 0 | 558 | 156 | 28.0% |
| current detector (frames.py, corrected rule) | generated chromatic | 24 | 0 | 344 | 42 | 12.2% |
| current detector (frames.py, corrected rule) | generated scale | 216 | 0 | 2268 | 2182 | 96.2% |
| current detector (frames.py, corrected rule) | pdmx | 12 | 0 | 211 | 127 | 60.2% |
| current detector (frames.py, corrected rule) | all | 326 | 0 | 3484 | 2571 | 73.8% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | authored | 26 | 0 | 103 | 64 | 62.1% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated arpeggio | 48 | 0 | 558 | 156 | 28.0% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated chromatic | 24 | 0 | 344 | 42 | 12.2% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated scale | 216 | 0 | 2268 | 2182 | 96.2% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | pdmx | 12 | 0 | 211 | 127 | 60.2% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | all | 326 | 0 | 3484 | 2571 | 73.8% |
| pianoplayer fingering, read through hand_def.py | authored | 26 | 0 | 103 | 30 | 29.1% |
| pianoplayer fingering, read through hand_def.py | generated arpeggio | 48 | 0 | 558 | 384 | 68.8% |
| pianoplayer fingering, read through hand_def.py | generated chromatic | 24 | 0 | 344 | 287 | 83.4% |
| pianoplayer fingering, read through hand_def.py | generated scale | 216 | 0 | 2268 | 1699 | 74.9% |
| pianoplayer fingering, read through hand_def.py | pdmx | 12 | 0 | 211 | 136 | 64.5% |
| pianoplayer fingering, read through hand_def.py | all | 326 | 0 | 3484 | 2536 | 72.8% |
| baseline: always says five-finger | authored |  |  | 103 | 84 | 81.6% |
| baseline: always says five-finger | generated arpeggio |  |  | 558 | 224 | 40.1% |
| baseline: always says five-finger | generated chromatic |  |  | 344 | 42 | 12.2% |
| baseline: always says five-finger | generated scale |  |  | 2268 | 2205 | 97.2% |
| baseline: always says five-finger | pdmx |  |  | 211 | 114 | 54.0% |
| baseline: always says five-finger | all |  |  | 3484 | 2669 | 76.6% |

**Truth class by method class (all strata; rows = truth class, columns = the method's class).**

current detector (frames.py, corrected rule):

| truth \ method | five-finger | extended | beyond |
| --- | --- | --- | --- |
| five-finger | 2501 | 92 | 76 |
| extended | 621 | 64 | 112 |
| beyond | 3 | 9 | 6 |

current detector with fixes F1+F2+F3 (hand_fix.py):

| truth \ method | five-finger | extended | beyond |
| --- | --- | --- | --- |
| five-finger | 2501 | 92 | 76 |
| extended | 621 | 64 | 112 |
| beyond | 3 | 9 | 6 |

pianoplayer fingering, read through hand_def.py:

| truth \ method | five-finger | extended | beyond |
| --- | --- | --- | --- |
| five-finger | 1905 | 755 | 9 |
| extended | 152 | 629 | 16 |
| beyond | 0 | 16 | 2 |

**Position shifts at note resolution (+-1 event).** Truth boundary = start of a new fingering-derived segment; predicted boundary = start of a new frame / fingering segment of the method. Precision = matched / predicted; recall = matched / truth.

| method | stratum | truth shifts | predicted | matched | precision | recall | F1 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| current detector (frames.py, corrected rule) | authored | 77 | 63 | 41 | 65.1% | 53.2% | 58.6% |
| current detector (frames.py, corrected rule) | generated arpeggio | 510 | 288 | 288 | 100.0% | 56.5% | 72.2% |
| current detector (frames.py, corrected rule) | generated chromatic | 320 | 128 | 128 | 100.0% | 40.0% | 57.1% |
| current detector (frames.py, corrected rule) | generated scale | 2052 | 1344 | 1001 | 74.5% | 48.8% | 59.0% |
| current detector (frames.py, corrected rule) | pdmx | 199 | 192 | 163 | 84.9% | 81.9% | 83.4% |
| current detector (frames.py, corrected rule) | all | 3158 | 2015 | 1621 | 80.4% | 51.3% | 62.7% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | authored | 77 | 63 | 41 | 65.1% | 53.2% | 58.6% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated arpeggio | 510 | 288 | 288 | 100.0% | 56.5% | 72.2% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated chromatic | 320 | 128 | 128 | 100.0% | 40.0% | 57.1% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | generated scale | 2052 | 1344 | 1001 | 74.5% | 48.8% | 59.0% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | pdmx | 199 | 192 | 163 | 84.9% | 81.9% | 83.4% |
| current detector with fixes F1+F2+F3 (hand_fix.py) | all | 3158 | 2015 | 1621 | 80.4% | 51.3% | 62.7% |
| pianoplayer fingering, read through hand_def.py | authored | 77 | 85 | 55 | 64.7% | 71.4% | 67.9% |
| pianoplayer fingering, read through hand_def.py | generated arpeggio | 510 | 571 | 470 | 82.3% | 92.2% | 87.0% |
| pianoplayer fingering, read through hand_def.py | generated chromatic | 320 | 140 | 140 | 100.0% | 43.8% | 60.9% |
| pianoplayer fingering, read through hand_def.py | generated scale | 2052 | 1985 | 1797 | 90.5% | 87.6% | 89.0% |
| pianoplayer fingering, read through hand_def.py | pdmx | 199 | 243 | 186 | 76.5% | 93.5% | 84.2% |
| pianoplayer fingering, read through hand_def.py | all | 3158 | 3024 | 2648 | 87.6% | 83.9% | 85.7% |

Union of marks (every distinct boundary of the current detector or pianoplayer; the pilot's candidate-list form; a mark is true if a truth shift lies within one event, a truth shift is found if a mark lies within one event): 4154 marks, 3625 true: precision 87.3%; truth shifts found 2855 of 3158: recall 90.4%. Same any-within-one criterion for each alone: current detector precision 81.2%, recall 57.4%; pianoplayer precision 92.6%, recall 85.3%.

**Kind at matched boundaries (truth kind from the printed fingering > the method's kind).**

| method | crossing>crossing | crossing>shift | shift>crossing | shift>shift |
| --- | --- | --- | --- | --- |
| current detector (frames.py, corrected rule) | 1120 | 240 | 20 | 241 |
| current detector with fixes F1+F2+F3 (hand_fix.py) | 1059 | 301 | 3 | 258 |
| pianoplayer fingering, read through hand_def.py | 1927 | 332 | 16 | 373 |
| current detector with F1 only | 1059 | 301 | 4 | 257 |
| current detector with F2 only | 1120 | 240 | 11 | 250 |

Kind right at matched boundaries: current detector (frames.py, corrected rule) 1361 of 1621 (84.0%); current detector with fixes F1+F2+F3 (hand_fix.py) 1317 of 1621 (81.2%); pianoplayer fingering, read through hand_def.py 2300 of 2648 (86.9%); current detector with F1 only 1316 of 1621 (81.2%); current detector with F2 only 1370 of 1621 (84.5%).

**Agreement as confidence, not proof.** Predicted shifts by who predicts them (the current detector and pianoplayer within +-1 event of each other), and how many of each are truth shifts:

| predicted by | boundaries | of them truth shifts | share |
| --- | --- | --- | --- |
| both | 1721 | 1485 | 86.3% |
| only current | 294 | 151 | 51.4% |
| only pianoplayer | 1058 | 949 | 89.7% |

**pianoplayer's fingering against the printed one** (note-by-note digit equality, notes with a printed digit): 7325 of 12046 (60.8%). By stratum: authored 51.4%; generated arpeggio 51.6%; generated chromatic 58.0%; generated scale 63.3%; pdmx 61.7%.

**Runtime per item** (measured on this machine, several processes at once, so an upper bound; items = hand-passages of the truth set).

- current detector: reader + texture view 0.06 s mean, 0.05 s median, 0.30 s max over 178 items (the first item loaded paid a 6 s one-off import); frames + changes 1 ms mean per hand, 29 ms max over 326 hands.
- pianoplayer: 17.8 s mean, 17.0 s median, 42.5 s max over 118 truth items that this session timed (a Python process start is not included; several runs shared the CPU).
