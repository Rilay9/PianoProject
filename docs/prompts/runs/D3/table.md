| recipe | generator | refused | rejected draws | score med / worst | below floor | arrives | strong beat | one contour | motif | cadence | notes/bar | rests/bar | repeats | leaps | near-dup | target/bar (min) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| interval-reading C major 4/4 8 bars, sustained @2.1 | grammar | 0% | 84% | 0.91 / 0.86 | 0% | 100% | 100% | 50% | 100% | 100% | 2.75 | 0.00 | 13% | 5% | 0% | 0.75 (0.75) |
| interval-reading C major 4/4 8 bars, sustained @2.1 | random walk | 0% | 89% | 0.76 / 0.67 | 90% | 100% | 100% | 0% | 92% | 100% | 2.88 | 0.00 | 15% | 23% | 0% |  |
| position-shift C major 4/4 12 bars, blocked @2.5 | grammar | 0% | 49% | 0.93 / 0.88 | 0% | 100% | 100% | 57% | 100% | 100% | 3.54 | 0.08 | 12% | 4% | 0% | 0.50 (0.33) |
| position-shift C major 4/4 12 bars, blocked @2.5 | random walk | 0% | 98% | 0.78 / 0.72 | 80% | 100% | 100% | 3% | 100% | 100% | 3.21 | 0.08 | 13% | 26% | 0% |  |
| subdivision C major 4/4 8 bars, sustained @2.2 | grammar | 0% | 24% | 0.93 / 0.86 | 0% | 100% | 100% | 56% | 100% | 100% | 4.25 | 0.12 | 13% | 3% | 0% | 1.50 (1.25) |
| subdivision C major 4/4 8 bars, sustained @2.2 | random walk | 0% | 83% | 0.74 / 0.67 | 92% | 100% | 100% | 1% | 82% | 100% | 4.25 | 0.00 | 15% | 26% | 0% |  |
| syncopation C major 4/4 8 bars, broken @4.5 | grammar | 0% | 37% | 0.96 / 0.90 | 0% | 100% | 100% | 79% | 98% | 100% | 4.12 | 0.00 | 6% | 8% | 0% | 0.75 (0.50) |
| syncopation C major 4/4 8 bars, broken @4.5 | random walk | 0% | 93% | 0.75 / 0.66 | 88% | 100% | 100% | 1% | 92% | 100% | 4.06 | 0.00 | 12% | 36% | 0% |  |
| metre.compound C major 6/8 8 bars, broken @4.5 | grammar | 0% | 20% | 0.98 / 0.93 | 0% | 100% | 82% | 99% | 100% | 100% | 3.31 | 0.00 | 4% | 6% | 0% | 8.94 (8.12) |
| metre.compound C major 6/8 8 bars, broken @4.5 | random walk | 0% | 88% | 0.78 / 0.65 | 68% | 100% | 42% | 32% | 88% | 100% | 3.12 | 0.00 | 11% | 33% | 0% |  |
| texture.hands-together C major 4/4 8 bars, sustained @2.1 | grammar | 0% | 23% | 0.95 / 0.88 | 0% | 100% | 100% | 82% | 100% | 100% | 2.69 | 0.12 | 15% | 5% | 0% | 3.25 (2.62) |
| texture.hands-together C major 4/4 8 bars, sustained @2.1 | random walk | 0% | 67% | 0.76 / 0.71 | 92% | 100% | 100% | 1% | 92% | 100% | 2.75 | 0.00 | 13% | 27% | 0% |  |

Bounds (the grammar must meet each; the random walk must fail a shape bound on every recipe):
- `refused` <= 0.1: a recipe the plan ships must write: more than one seed in ten refused means the recipe is at the edge of its rung
- `cadence` >= 1.0: every phrase closes on its cadence's tone: the hard layer, measured on the page
- `arrives` >= 0.95: a phrase that stops rather than arrives is the fault Part 15 §9 names first; the cadence cells hold a note a beat or more
- `scoreWorst` >= 0.8: every study kept clears the musical floor, read again on the page
- `oneContour` >= 0.45: at least a phrase in two with one shape; the grammar's lowest recipe (the five-note position at 2.1) sits near half, and the walk falls well below it
- `scoreMedian` >= 0.85: the typical study clears the floor with room: a median at the floor would mean the floor is doing the composing
- `repeats` <= 0.2: a tune that sits on a note (D1's reader's read at level 2) is a degeneracy: at most one move in five a repeat
- `leaps` <= 0.25: at most one move in four a fourth or wider: a study reads by steps and skips, with a leap recovered
- `nearDuplicates` <= 0.1: a seed names a study; two seeds writing one page more than one time in ten is a space too small
- `motif` >= 0.9: the opening cell comes back varied in nine studies of ten: the grammar's promise
