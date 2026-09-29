"""
X31a, for information (not in any catalogue): the four late-tempo files' duration feature and model level, with
the tempo read as X31 shipped it and as X31a reads it, through the committed model on this tree's built file; the
catalogue's level and its source; and each lesson whose songOptions name the item with that lesson's levelBand
(X31's `scripts-level-diff.py`'s search). A quarried (PDMX) row's catalogue level is the quarry's stored one, so a
move here reaches it only when the quarry measures the row again (X31's Follow-up 1).

    python docs/prompts/runs/X31a/scripts-latent-four.py <content dir>
"""
from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
sys.path.insert(0, str(ROOT / "tools" / "content"))

import difficulty  # noqa: E402

FOUR = (
    "song.classical.bach-wtc1-prelude-2",
    "song.classical.leontovych-carol-of-the-bells-christmas-medley.pdmx",
    "song.pop.camille-le-festin-piano-arr-kno.pdmx",
    "song.pop.misc-computer-games-fallout-4-trailer-soundtrack.pdmx",
)


def x31_read(score) -> float:  # noqa: ANN001 - X31's reading, replicated (as scripts-fit-report.py)
    import math

    best = None
    opening = difficulty.DEFAULT_BPM
    for order, mark in enumerate(score.recurse().getElementsByClass("MetronomeMark")):
        bpm = difficulty._quarter_bpm(mark)  # noqa: SLF001
        if bpm is None:
            continue
        try:
            offset = float(mark.getOffsetInHierarchy(score))
        except Exception:  # noqa: BLE001
            offset = math.inf
        if best is None or (offset, order) < best:
            best = (offset, order)
            opening = bpm
    return opening


def main() -> int:
    from convert import parse_source

    spec = importlib.util.spec_from_file_location("level_diff", HERE / "scripts-level-diff.py")
    level_diff = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(level_diff)  # type: ignore[union-attr]
    naming = level_diff.lessons_naming()
    content = Path(sys.argv[1])
    catalog = {item["id"]: item for item in json.loads((content / "catalog.json").read_text(encoding="utf-8"))}
    model = difficulty.load_model()
    new_read = difficulty.opening_quarter_bpm
    print("id\tlevelSource\tcatalogue level\ttempo X31 → X31a\tnotesPerSecond X31 → X31a\tmodel level X31 → X31a\tlessons naming it (levelBand)")
    for item_id in FOUR:
        item = catalog[item_id]
        score = parse_source(content / item["file"])
        difficulty.opening_quarter_bpm = x31_read
        old = difficulty.features(score)
        old_bpm = x31_read(score)
        difficulty.opening_quarter_bpm = new_read
        new = difficulty.features(score)
        new_bpm = new_read(score)
        old_level = difficulty.estimate(old, model).level
        new_level = difficulty.estimate(new, model).level
        lessons = "; ".join(f"{lesson} {band}" for lesson, band in naming.get(item_id, [])) or "none"
        print(f"{item_id}\t{item.get('levelSource')}\t{item.get('level')}\t{old_bpm:g} → {new_bpm:g}"
              f"\t{old['notesPerSecond']:.4f} → {new['notesPerSecond']:.4f}\t{old_level:.2f} → {new_level:.2f}\t{lessons}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
