**Bach Inventions (expected: an area of 4+ bars on the dominant or the relative key; source: reading, the standard analysis).** Number of the 15 Inventions with such an area, by tool; `n/a` = the tool could not run on the item (the project's reader raises on No. 1).

| tool / step | found | not found | n/a |
| --- | --- | --- | --- |
| current: area found | 13 | 1 | 1 |
| current: area confirmed by a cadence (first version) | 6 | 8 | 1 |
| current: area confirmed (corrected exclusion) | 3 | 11 | 1 |
| music21 floatingKey: area found | 6 | 9 | 0 |
| music21 windows Bellman-Budge: area found | 12 | 3 | 0 |
| music21 windows Aarden-Essen: area found | 12 | 3 | 0 |
| AugmentedNet: area found | 11 | 4 | 0 |

Union of the current detector's areas and AugmentedNet's (an area in the expected relation from either): 13 of 15.

Per Invention (`yes` = an area of 4+ bars on the dominant or relative key; for the columns `cur first` and `cur corr` it must also be confirmed by a cadence; `-` none; `n/a` the tool could not run): current found / first / corrected, then music21 floatingKey, BB, AE, AugmentedNet.

| Invention | home | cur found | cur first | cur corr | m21 float | m21 BB | m21 AE | augnet |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| invention-no-1-in-c-major-bwv-772 | C major | n/a | n/a | n/a | yes | yes | yes | - |
| invention-no-2-in-c-minor-bwv-773 | C minor | yes | - | - | - | yes | yes | yes |
| invention-no-3-in-d-major-bwv-774 | D major | yes | - | - | - | yes | yes | yes |
| invention-no-4-in-d-minor-bwv-775 | D minor | yes | yes | yes | - | yes | yes | yes |
| invention-no-5-in-e-flat-major-bwv-776 | Eb major | - | - | - | yes | - | - | - |
| invention-no-6-in-e-major-bwv-777 | E major | yes | yes | - | yes | yes | yes | yes |
| invention-no-7-in-e-minor-bwv-778 | E minor | yes | - | - | - | yes | yes | yes |
| invention-no-8-in-f-major-bwv-779 | F major | yes | yes | - | - | yes | yes | yes |
| invention-no-9-in-f-minor-bwv-780 | F minor | yes | - | - | - | yes | yes | yes |
| invention-no-10-in-g-major-bwv-781 | G major | yes | - | - | - | yes | yes | yes |
| invention-no-11-in-g-minor-bwv-782 | G minor | yes | yes | yes | yes | yes | yes | yes |
| invention-no-12-in-a-major-bwv-783 | A major | yes | - | - | yes | - | - | - |
| invention-no-13-in-a-minor-bwv-784 | A minor | yes | - | - | - | yes | yes | yes |
| invention-no-14-in-b-flat-major-bwv-785 | Bb major | yes | yes | - | - | - | - | - |
| invention-no-15-in-b-minor-bwv-786 | B minor | yes | yes | yes | yes | yes | yes | yes |

**song.classical.mozart-k545-i** (expected areas from the When in Rome annotation; global key C major; catalogue score 73 bars, annotation 73 bars). 0-based bars.

| expected area | relation | current detector (areas; confirmed) | music21 floatingKey | music21 windows Bellman-Budge | music21 windows Aarden-Essen | AugmentedNet |
| --- | --- | --- | --- | --- | --- | --- |
| G major bars 12-27 | dominant | found; confirmed (first version: yes, corrected: yes) | not found | found | found | found |
| D minor bars 31-34 | other | found; confirmed (first version: yes, corrected: yes) | not found | found | found | not found |
| A minor bars 35-39 | relative | not found | not found | not found | not found | found |
| F major bars 40-49 | subdominant | found; confirmed (first version: yes, corrected: yes) | not found | found | found | found |

- current areas not in the annotation: [([19, 23], 'A minor', 'unconfirmed'), ([54, 57], 'G major', 'unconfirmed')]
- m21_float areas not in the annotation: none
- m21_win_BB areas not in the annotation: [([20, 23], 'A minor')]
- m21_win_AE areas not in the annotation: [([20, 23], 'A minor')]
- augnet areas not in the annotation: none

**song.classical.bach-wtc1-prelude-1** (expected areas from the When in Rome annotation; global key C major; catalogue score 34 bars, annotation 35 bars; **bar counts differ, bars compared by index**). 0-based bars.

| expected area | relation | current detector (areas; confirmed) | music21 floatingKey | music21 windows Bellman-Budge | music21 windows Aarden-Essen | AugmentedNet |
| --- | --- | --- | --- | --- | --- | --- |
| G major bars 5-10 | dominant | found; confirmed (first version: yes, corrected: no) | not found | found | not found | not found |

- current areas not in the annotation: [([23, 28], 'G major', 'unconfirmed')]
- m21_float areas not in the annotation: [([0, 20], 'A minor')]
- m21_win_BB areas not in the annotation: none
- m21_win_AE areas not in the annotation: [([1, 5], 'A minor')]
- augnet areas not in the annotation: none

**song.folk.happy-birthday-piano.pdmx** (expected: no modulation; source: reading. Home C major).

- current detector areas: G major bars 0-3 (first version: no cadence; corrected: not confirmed), G major bars 7-11 (first version: confirmed; corrected: not confirmed)
- m21_float: no area
- m21_win_BB: no area
- m21_win_AE: G major bars 7-11
- augnet: no area
