**Families the page reads as one five-finger position per hand (truth by reading: the recipe declares the position; `five_finger` 48, `interval_reading` 16, `riff` 4 items).** An item counts when every hand present has exactly one frame / segment and its class is five-finger.

| family | items | current detector | current with fixes | pianoplayer fingering (hand_def.py) | pianoplayer: items with a hand-segment of class extended |
| --- | --- | --- | --- | --- | --- |
| five_finger | 48 | 48 of 48 | 48 of 48 | 45 of 48 (45 with one segment per hand of any class; 0 no output) | 4 |
| interval_reading | 16 | 16 of 16 | 16 of 16 | 0 of 16 (4 with one segment per hand of any class; 0 no output) | 12 |
| riff | 4 | 4 of 4 | 4 of 4 | 0 of 4 (1 with one segment per hand of any class; 0 no output) | 1 |

**The 10 `position_shift` drills.** Truth by reading (the page's own positive; `gap-plan.md` lists the drill as a move of the hand with no thumb-under): exactly one change of position, a `shift`, at the leap. The leap is located by script as the event after the largest melodic step of the hand (reading checked on the first drill: C D E F / G F E D / G A B C / D C B G, leap D4 to G4).

| drill | leap at event | current: changes (event, kind) | current with fixes F1+F2 | pianoplayer: segment starts (event, kind) |
| --- | --- | --- | --- | --- |
| a.left | 8 | [[9, 'crossing']] | [[9, 'shift']] | [[8, 'shift'], [12, 'shift'], [15, 'shift']] |
| a.right | 8 | [[9, 'crossing']] | [[9, 'shift']] | [[8, 'shift'], [15, 'shift']] |
| c.left | 8 | [[9, 'crossing']] | [[9, 'shift']] | [[8, 'shift'], [11, 'crossing'], [15, 'shift']] |
| c.right | 8 | [[9, 'crossing']] | [[9, 'shift']] | [[8, 'shift'], [15, 'shift']] |
| d.left | 8 | [[9, 'crossing']] | [[9, 'shift']] | [[10, 'crossing'], [15, 'shift']] |
| d.right | 8 | [[9, 'crossing']] | [[9, 'shift']] | [[9, 'crossing'], [15, 'shift']] |
| f.left | 8 | [[9, 'crossing']] | [[9, 'shift']] | [[8, 'shift'], [11, 'crossing'], [15, 'shift']] |
| f.right | 8 | [[9, 'crossing']] | [[9, 'shift']] | [[8, 'shift'], [15, 'shift']] |
| g.left | 8 | [[9, 'crossing']] | [[9, 'shift']] | [[10, 'crossing'], [15, 'shift']] |
| g.right | 8 | [[9, 'crossing']] | [[9, 'shift']] | [[9, 'crossing'], [15, 'shift']] |

Totals over 10 drills: current detector exactly one change 10, within +-1 event of the leap 10, kind `shift` anywhere 0, `shift` at the leap 0. With fixes: exactly one change 10, near the leap 10, `shift` at the leap 10 (F1 alone 10, F2 alone 0). pianoplayer (output for 10 drills): exactly one segment change 0, near the leap 8, `shift` at the leap 6.

**Block-chord steps.** Truth by reading: a change of frame between two chord events (3 or more notes each) is the hand moving, a `shift`; a thumb cannot pass under a block chord. Items: the 12 `exercise.cadence.*.root` items (root-position I-IV-V-I) and built parallel triads (C-E-G, D-F-A, E-G-B, F-A-C in one hand, one chord per quarter; built with `frames.built`, current detector and fixes only, there is no score to finger).

Root-position cadence items found: 12.

| method | chord-to-chord changes typed shift | typed crossing | other changes (a single note on one side) shift / crossing |
| --- | --- | --- | --- |
| current detector | 24 | 12 | 0 / 0 |
| current with fixes F1+F2 | 36 | 0 | 0 / 0 |
| current with F1 only | 36 | 0 | 0 / 0 |
| current with F2 only | 36 | 0 | 0 / 0 |
| pianoplayer fingering (hand_def.py) | 24 | 0 | 0 / 0 |

Built parallel triads ['C3 E3 G3', 'D3 F3 A3', 'E3 G3 B3', 'F3 A3 C4', 'G3 B3 D4', 'A3 C4 E4']: current: 6 frames, changes [(1, 'crossing'), (2, 'crossing'), (3, 'crossing'), (4, 'crossing'), (5, 'crossing')].
Built parallel triads ['C3 E3 G3', 'D3 F3 A3', 'E3 G3 B3', 'F3 A3 C4', 'G3 B3 D4', 'A3 C4 E4']: fixed: 6 frames, changes [(1, 'shift'), (2, 'shift'), (3, 'shift'), (4, 'shift'), (5, 'shift')].
Built parallel triads ['C3 E3 G3', 'D3 F3 A3', 'E3 G3 B3', 'F3 A3 C4', 'G3 B3 D4', 'A3 C4 E4']: F1 only: 6 frames, changes [(1, 'crossing'), (2, 'crossing'), (3, 'crossing'), (4, 'crossing'), (5, 'crossing')].
Built parallel triads ['C3 E3 G3', 'D3 F3 A3', 'E3 G3 B3', 'F3 A3 C4', 'G3 B3 D4', 'A3 C4 E4']: F2 only: 6 frames, changes [(1, 'shift'), (2, 'shift'), (3, 'shift'), (4, 'shift'), (5, 'shift')].

**Hanon (page: extended positions, a sixth in each hand).** Class of the segments per method over the 60 `hanon` items (no fingering truth; descriptive).

| method | five-finger frames | extended | beyond |
| --- | --- | --- | --- |
| current detector | 734 | 1406 | 6 |
| current with fixes | 734 | 1406 | 6 |
| pianoplayer fingering (hand_def.py) | 142 | 1284 | 4 |

**Chopin Op. 25 No. 6, right hand (row 3 (b): chromatic double thirds, 0-based bar 4, E-flat5+F-sharp5 to G5+B-flat5).**

- current: 157 frames in the hand; frames holding events of bar 4: [(0, 66, 'five-finger', 3), (67, 71, 'five-finger', 4), (72, 76, 'five-finger', 4), (77, 80, 'extended', 3)] (first event, last event, class, rise of the lowest note)
- fixed: 230 frames in the hand; frames holding events of bar 4: [(0, 65, 'beyond', 2), (66, 67, 'five-finger', 1), (68, 69, 'five-finger', 1), (70, 71, 'five-finger', 1), (72, 73, 'five-finger', 1), (74, 75, 'five-finger', 1), (76, 77, 'five-finger', 1), (78, 80, 'five-finger', -2)] (first event, last event, class, rise of the lowest note)

