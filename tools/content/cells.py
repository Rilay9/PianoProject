#!/usr/bin/env python3
"""
The habanera and the tresillo, read bar by bar from a MusicXML file by partitura (CD1, D3): the build's
independent witness of what the app's `habaneraCell` and `tresilloCell` detectors find.

**What it reads.** `bar_cells(path, staff=2)` returns, for every printed bar in order, the bar's index
(1-based, a pickup counted as bar 1, as the bridge's `positions` count), its MusicXML `number`, the
onsets of the chosen staff as fractions of the bar, and the cell those onsets are: `habanera` when they
are exactly {0, 3/8, 1/2, 3/4}, `tresillo` when they are exactly {0, 3/8, 3/4}, otherwise None. The same
rules as the detector (`app/src/demands/detect.ts`, `cellBars`): bars in 2/4, 4/4 or 2/2 only (4/4 where
the file states no time signature, as the app's model reads it); a pickup bar (a first bar shorter than
its time signature's bar, OpenSheetMusicDisplay's implicit measure) never read; onsets measured from the
bar's start over the time signature's full bar; tie chains merged (`notes_tied`), so a bar entered by a
tie has no onset at its start; grace notes left out; chords and voices merged into their distinct onsets.
Exact equality, never "contains": a habanera bar is not a tresillo bar, and the reverse.

`staff` is the caller's choice, because the file says which staff a note is drawn on and not which hand
plays it: the left hand of a grand staff is `staff=2`; a one-staff left-hand cut is read with `staff=1`,
the catalogue's `hands` telling the caller which. A note drawn on the other staff (a cross-staff note) is
read where it is drawn; the app reads it by its voice's hand. A file with more than one part is refused
with its reason (`CellsError`), never read as "no cell".

**Why it is a witness, and not a second definition.** The app reads OpenSheetMusicDisplay's parse of the
file through `extractScoreModel`; this module reads partitura's parse of the same bytes, and the two
share only the file. The cell sets are stated here and in `detect.ts`, each from the cited definition,
on purpose: an oracle that imported the app's constants would not be independent. Hand-written fixtures
(`tests/fixtures/cells/`, never written by music21) and the differential against the app's per-bar
positions (`tests/test_cells.py`) are what hold the two statements equal. The build never reads this
module: what an item carries is the app's measurement (`demands.py`), and this module writes no demand,
claim or catalogue field.

**The definition** (`docs/prompts/runs/curriculum-review-2026-10-05/briefs/cells-as-measured-demands.md`
D1): the upgrade's habanera, "dotted eighth, sixteenth, eighth, eighth in 2/4 … compared with the
tresillo (3+3+2)" (`CURRICULUM-UPGRADE.md:21`); Wikipedia's Habanera and Tresillo pages as the secondary
source; CK-5 (`ABILITY-MAP.md`). The doubled form in 4/4 or 2/2 is the same fractions of its bar. The
onsets, never the style: a matching bar contains the cell's onsets and nothing more is claimed.

    python tools/content/cells.py <file> [--staff 2]
"""
from __future__ import annotations

import argparse
import json
import sys
import warnings
from fractions import Fraction
from pathlib import Path

HABANERA = frozenset({Fraction(0), Fraction(3, 8), Fraction(1, 2), Fraction(3, 4)})
TRESILLO = frozenset({Fraction(0), Fraction(3, 8), Fraction(3, 4)})

#: The metres the cells are read in: the published 2/4 and its doubled form in 4/4 or 2/2.
CELL_METRES = frozenset({(2, 4), (4, 4), (2, 2)})


class CellsError(ValueError):
    """A file the witness will not read, with the reason."""


def classify(onsets: frozenset) -> str | None:
    """The cell an exact onset set is, or None."""
    if onsets == HABANERA:
        return "habanera"
    if onsets == TRESILLO:
        return "tresillo"
    return None


def _quarters(segments: list[tuple[int, int]], t: int) -> Fraction:
    """Quarters from the start of the part to time `t`, exactly, over partitura's divisions per quarter."""
    total = Fraction(0)
    for index, (start, divs) in enumerate(segments):
        if start >= t:
            break
        end = segments[index + 1][0] if index + 1 < len(segments) else t
        total += Fraction(min(end, t) - start, divs)
    return total


def bar_cells(path: Path | str, staff: int = 2) -> list[dict]:
    """
    Per printed bar: `index` (1-based, in order), `number` (the MusicXML number), `read` (False for a
    pickup or a bar outside 2/4, 4/4 and 2/2), `onsets` (the staff's distinct onsets as fractions of the
    bar, sorted), `cell` (`habanera`, `tresillo` or None). Raises `CellsError` for a multi-part file.
    """
    import partitura as pt

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        score = pt.load_score(str(path))
    if len(score.parts) != 1:
        raise CellsError(f"{Path(path).name}: {len(score.parts)} parts; the witness reads one part's staves, "
                         "and a file it cannot read is never 'no cell'")
    part = score.parts[0]
    segments = [(int(t), int(d)) for t, d in part.quarter_durations()]
    measures = list(part.iter_all(pt.score.Measure))
    signatures = sorted(((int(ts.start.t), int(ts.beats), int(ts.beat_type))
                         for ts in part.iter_all(pt.score.TimeSignature)), key=lambda s: s[0])
    notes = [n for n in part.notes_tied
             if not isinstance(n, pt.score.GraceNote) and getattr(n, "staff", 1) == staff]
    out = []
    for index, measure in enumerate(measures, start=1):
        start, end = int(measure.start.t), int(measure.end.t)
        metre = (4, 4)
        for at, beats, beat_type in signatures:
            if at <= start:
                metre = (beats, beat_type)
        full = Fraction(metre[0] * 4, metre[1])
        length = _quarters(segments, end) - _quarters(segments, start)
        pickup = index == 1 and length < full
        origin = _quarters(segments, start)
        onsets = sorted({(_quarters(segments, int(n.start.t)) - origin) / full
                         for n in notes if start <= int(n.start.t) < end})
        read = not pickup and metre in CELL_METRES
        out.append({
            "index": index,
            "number": measure.name if measure.name is not None else str(measure.number),
            "metre": f"{metre[0]}/{metre[1]}",
            "pickup": pickup,
            "read": read,
            "onsets": onsets,
            "cell": classify(frozenset(onsets)) if read else None,
        })
    return out


def cell_bars(path: Path | str, cell: str, staff: int = 2) -> list[int]:
    """The 1-based indexes of the bars that are `cell`."""
    return [bar["index"] for bar in bar_cells(path, staff) if bar["cell"] == cell]


#: The demand id each cell is, and the places the app's detector locates in one cell bar (one per onset).
DEMAND = {"habanera": "rhythm.habanera", "tresillo": "rhythm.tresillo"}
CELL_OF = {demand: cell for cell, demand in DEMAND.items()}
PLACES = {"habanera": 4, "tresillo": 3}


def disagreements(path: Path | str, positions: dict | None, demand: str, staff: int = 2,
                  bars: list[int] | None = None) -> list[int]:
    """
    The printed bars (1-based indexes, the bridge's numbering) where the app's located places for `demand` and the
    witness's reading of `staff` differ (CD1 T7's comparison, as a function the build's two proofs share): a bar the
    witness reads as the cell must hold the cell's places on that staff and none on the other; any other bar none.
    `positions` is the bridge's per-printed-bar `positions` for the file; `bars` limits the comparison to those
    indexes (a passage), else every bar of the file. An empty list is agreement; a file the witness refuses
    (`CellsError`) is never agreement.
    """
    cell = CELL_OF[demand]
    side = 0 if staff == 1 else 1
    app = {int(bar): counts for bar, counts in ((positions or {}).get(demand) or {}).items()}
    witness = {bar["index"]: bar["cell"] for bar in bar_cells(path, staff)}
    wanted = bars if bars is not None else sorted(set(witness) | set(app))
    out = []
    for index in wanted:
        counts = app.get(index, [0, 0])
        expected = PLACES[cell] if witness.get(index) == cell else 0
        if counts[side] != expected or counts[1 - side] != 0:
            out.append(index)
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("file", type=Path)
    parser.add_argument("--staff", type=int, default=2)
    args = parser.parse_args()
    try:
        bars = bar_cells(args.file, args.staff)
    except CellsError as error:
        print(error, file=sys.stderr)
        return 1
    for bar in bars:
        print(f"bar {bar['index']:>3} ({bar['number']}) {bar['metre']} "
              f"{'pickup' if bar['pickup'] else ''} {bar['cell'] or '-'} {[str(f) for f in bar['onsets']]}")
    summary = {cell: [b["index"] for b in bars if b["cell"] == cell] for cell in ("habanera", "tresillo")}
    print(json.dumps({"bars": len(bars), **{k: len(v) for k, v in summary.items()}}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
