# D02: score statistics against published levels (descriptive; alarms only)

Script: tools/pieces/difficulty/d02_check.py. Inputs fixed at commit 644b31fb. n = 135 chosen files in 120 work groups (variants and all movements of one sonatina kept together); levels B,1-8 = 0-8. No pass mark. Per-file table: difficulty-check.csv.

## Spearman correlation with published level (10 features, fixed in advance)

pitch_entropy +0.79 (n=135); notes_per_quarter +0.68 (n=135); range_semitones +0.62 (n=135); accidentals_per_100 +0.60 (n=135); shortest_depth +0.56 (n=135); ledger_max +0.55 (n=135); largest_chord +0.42 (n=135); key_sig_size +0.34 (n=135); attacks_per_second +0.30 (n=83); has_tuplets +0.27 (n=135).

No usable tempo (none, exporter-default 120, or under half the piece with a known tempo): 52 of 135; such gaps are filled with the training-fold median.

## Leave-one-group-out, n = 135 (held-out predictions rounded, clipped to 0-8)

| predictor | mean abs level error (95% interval) | exact | within one |
|---|---|---|---|
| (a) always the training median level | 1.96 (1.71-2.22) | 15% | 43% |
| (b) best single feature (picked inside each fold) | 1.20 (1.04-1.37) | 23% | 70% |
| (c) ridge regression, all 10 features | 1.06 (0.91-1.22) | 27% | 78% |

Intervals resample whole groups. Ridge minus median error: -0.90 levels (interval -1.17 to -0.62). Single feature picked most often: pitch_entropy x135.

Stricter grouping (every piece of one composer held out together, 43 groups), error / exact / within one: median 2.13 / 16% / 36%; single 1.16 / 27% / 69%; ridge 1.17 / 26% / 70%.

Shuffled-levels control (10 shuffles, same procedure), mean error / within one: median baseline 1.96 / 43%, ridge 1.96 / 43%.

Ridge by published level, as level: n, mean signed error (held-out minus published), mean abs error: B: 11, +0.5, 0.5; 1: 17, +1.2, 1.3; 2: 14, +1.4, 1.4; 3: 16, +0.2, 0.8; 4: 20, +0.2, 0.7; 5: 22, -0.3, 1.1; 6: 13, -0.8, 1.0; 7: 11, -0.8, 1.0; 8: 11, -2.0, 2.0.

## Alarms: held-out ridge prediction 2 or more levels from published (30 of 135)

For review, not reassignment. Largest first; drivers = features pushing furthest toward the disagreement (z = standardised value). All alarms with up to 3 drivers are in the CSV.

- published 2, predicted 6: Writing's on the Wall (from Spectre) (Sam Sm | key_sig_size=4 (z+2.1); largest_chord=4 (z+1.1)
- published 3, predicted 6: Sonatina in C Major, op. 36, no. 1: I | pitch_entropy=5.07 (z+1.3); largest_chord=4 (z+1.1)
- published 5, predicted 2: Suite in D minor HWV 437 - mvt 3 Sarabande | notes_per_quarter=1.75 (z-1.3); shortest_depth=2 (z-2.2)
- published 5, predicted 8: Prelude in C minor Op 28 No 20 | accidentals_per_100=19.36 (z+3.2); largest_chord=6 (z+2.8)
- published 6, predicted 3: Gnossienne No. 3 | key_sig_size=0 (z-0.9); notes_per_quarter=3 (z-0.6)
- published 8, predicted 5: Prelude and Fugue in E Major, BWV 854 | notes_per_quarter=3.17 (z-0.5); ledger_max=2 (z-0.6)
- published 8, predicted 5: Prelude and Fugue in F Major, BWV 856 | largest_chord=2 (z-0.5); ledger_max=2 (z-0.6)
- published 8, predicted 5: Prelude and Fugue in A flat Major, BWV 862 | accidentals_per_100=3.55 (z-0.5); has_tuplets=0 (z-0.5)
- published 8, predicted 5: Sonata in B minor K 27 (L 449) | largest_chord=2 (z-0.5); has_tuplets=0 (z-0.5)
- published 1, predicted 4: Ecossaise | largest_chord=4 (z+1.1); accidentals_per_100=6.64 (z+0.2)
- ... 20 more in the CSV.

## Provisional suggestions

Ridge fitted on all 135 (strength 30) applied to the other 707 candidate files: `prediction`, `prediction_kind` = provisional. A suggestion only; no alarm, no published level.

## Limits

- Small sample: 135 files, 9 levels with 11-22 each; intervals are wide and the alarm list moves with the fold.
- Labels come from different syllabuses and lists; low levels are mostly arrangements, high levels mostly originals, so style may be learned as much as difficulty.
- Figures are per staff, not per hand; the whole file is measured even where only part (a movement, bars 1-N, the prelude) is the chosen piece.
- Editions and arrangements differ; same-work grouping uses title and number rules plus a check for equal bars, length and entropy.
- Ridge shrinks toward the middle, so alarms at levels 1 and 8 are partly shrinkage; same work, different labels (Fur Elise is 5 and 6). No listening, playing or fingering.
- The 10 features and the ridge-strength grid were fixed before running; single feature and strength are chosen inside each training fold.

