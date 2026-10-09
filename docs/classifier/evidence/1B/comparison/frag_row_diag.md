**Why the statement test misses some rows (`row_diag.py`).** Rule 1 rejects a 12-note window with 8 or more steps by a second (of 11), or 5 seconds in a row, or two interleaved stepwise lines. Applied to the 71 rows of music21's table (as one line): rejected by any clause 4 of 71; by clause: 8+ seconds: 3, 5+ seconds in a row: 3, two interleaved stepwise lines: 0. Rows rejected: BergDerWein (5+ seconds in a row; 7 seconds, longest run 5), SchoenbergMosesAron (8+ seconds; 8 seconds, longest run 3), SchoenbergOp24Mvmt5 (8+ seconds/5+ seconds in a row; 9 seconds, longest run 5), SchoenbergOp26 (8+ seconds/5+ seconds in a row; 8 seconds, longest run 5).

The catalogue's 12-note windows with 12 different pitch classes (no filter): 1244 windows in 51 items. Steps by a second in the window (of 11), rows of the table against catalogue windows:

| steps by a second | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| table rows (71) | 0 | 2 | 5 | 7 | 22 | 10 | 12 | 10 | 2 | 1 | 0 | 0 |
| catalogue windows | 21 | 0 | 0 | 0 | 2 | 2 | 0 | 0 | 1 | 1 | 7 | 1210 |

Catalogue windows that rule 1 accepts: 2 in 1 items (song.classical.chopin-nocturne-in-f-sharp-major-op-15-no-2.pdmx).