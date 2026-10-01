# U118b: two grid cells rerun, to tell the bound's effect from the session's

`scripts-rerun-cell.ps1` runs one cell of `scripts-grid.spec.ts` n times on whatever is in `dist/`, one Playwright run
at a time on port 5343; `scripts-read_reruns.py` reads each run. This machine's numbers (Chromium, its face).

## 342 × 740, Nocturne op. 48 no. 1, one bar, 115 % text, the ordinary path (as-is)

The one cell where the fourteen-digit grid read an ordinary start differently from the before-grid: 2/1/1 (one system
and a greyed next row) in the before-grid and in the sixteen-digit grid, 1/1/1 (one system) in the fourteen-digit grid,
the band 58.97 px (three lines) in all three. At 115 % text the away sentence takes three lines at 86 400 and at
fourteen digits alike (`explore-14-digits.md`), so the band this cell is priced and placed at does not depend on the
bound.

| build | runs | read (shape, drawn size, band, slot tops) |
| --- | --- | --- |
| fourteen digits (U118b) | 5 | 1/1/1 @ 1.333, band 58.97, one slot at 59 — all five |
| a day's 86 400 (the M-s1 mutant build: `['86400']`, the same two sentences as the code before U118b) | 5 | 1/1/1 @ 1.333, band 58.97, one slot at 59 — all five |

**Read:** in this session the cell draws one system on both builds, so the before-grid's greyed row is not the bound's
to give or take. It is a difference between sessions on the code before U118b too, recorded as a follow-up
(the long piece's greyed row at this size is not reproducible across sessions), not this lane's.

## 342 × 740, five-finger exercise, four bars, 100 % text, turned while folded

| build | runs | read (shape, drawn size, band, slot tops) |
| --- | --- | --- |
| a day's 86 400 (M-s1 build) | 3 | 3/3/3 @ 1.3173, band 36.69, slots at 37, 247, 458 — all three |
| fourteen digits (the full grid) | 1 | 3/3/3 @ 1.2803, band 52.03 |

**Read:** the size taken while folded follows the band in the same session: 1.3173 under the two-line band, 1.2803
under the three-line band the fourteen-digit count needs. The reserve, not the session, moves this cell.

## Raw

```
grid-noct115-14-1 1/1/1 1.333 band 58.96875 [(59, False)]
grid-noct115-14-2 1/1/1 1.333 band 58.96875 [(59, False)]
grid-noct115-14-3 1/1/1 1.333 band 58.96875 [(59, False)]
grid-noct115-14-4 1/1/1 1.333 band 58.96875 [(59, False)]
grid-noct115-14-5 1/1/1 1.333 band 58.96875 [(59, False)]
grid-noct115-day-1 1/1/1 1.333 band 58.96875 [(59, False)]
grid-noct115-day-2 1/1/1 1.333 band 58.96875 [(59, False)]
grid-noct115-day-3 1/1/1 1.333 band 58.96875 [(59, False)]
grid-noct115-day-4 1/1/1 1.333 band 58.96875 [(59, False)]
grid-noct115-day-5 1/1/1 1.333 band 58.96875 [(59, False)]
grid-ff4-day-1 3/3/3 1.3173 band 36.6875 [(37, False), (247, False), (458, False)]
grid-ff4-day-2 3/3/3 1.3173 band 36.6875 [(37, False), (247, False), (458, False)]
grid-ff4-day-3 3/3/3 1.3173 band 36.6875 [(37, False), (247, False), (458, False)]
```
