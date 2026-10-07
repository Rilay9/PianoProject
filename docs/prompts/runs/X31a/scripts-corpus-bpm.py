"""
X31a's corpus probe (not a test; X31's `scripts-corpus-bpm.py` with X31a's columns): for every score the built
catalogue names, the content build's opening tempo through music21 on the built file, as X31 shipped it and as
this tree reads it.

  x31     X31's reading, replicated here: the readable mark at the earliest offset (`difficulty._quarter_bpm`,
          least `getOffsetInHierarchy`, ties to the first in `recurse()`), else 100.
  after   `difficulty.opening_quarter_bpm` (this tree): that mark only where no sounding note begins before
          it, else 100.

Also, per score: that mark's offset and fields; the earliest sounding note's offset in the hierarchy (a Note or
Chord, not a Rest, not a chord symbol, grace notes included, as `opening_quarter_bpm` counts) and the earliest
non-grace one (so the grace choice's reach on the corpus can be counted); the first time signature's numerator;
the catalogue's row. One JSON line per score to the file named by the first argument; the content directory is
the second. Nothing is asserted.

    python docs/prompts/runs/X31a/scripts-corpus-bpm.py <out.jsonl> <content dir> [workers]
"""
from __future__ import annotations

import json
import sys
from multiprocessing import Pool
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / "tools" / "content"))

SCORE_SUFFIXES = (".mxl", ".musicxml", ".xml")


def read_one(job: tuple[str, str]) -> dict:
    item_id, path = job
    import difficulty
    from music21 import converter

    row: dict = {"id": item_id}
    try:
        score = converter.parse(path)
    except Exception as cause:  # noqa: BLE001 - a file that will not parse is data
        row["error"] = f"{type(cause).__name__}: {str(cause)[:120]}"
        return row
    marks = list(score.recurse().getElementsByClass("MetronomeMark"))
    row["marks"] = len(marks)
    readable = []
    for order, mark in enumerate(marks):
        bpm = difficulty._quarter_bpm(mark)  # noqa: SLF001 - the probe reads the helper the feature reads
        if bpm is None:
            continue
        try:
            offset = float(mark.getOffsetInHierarchy(score))
        except Exception:  # noqa: BLE001
            offset = float("inf")
        readable.append({
            "order": order,
            "offset": offset,
            "number": mark.number,
            "numberSounding": mark.numberSounding,
            "referent": [mark.referent.type, mark.referent.dots],
            "quarterBpm": bpm,
        })
    row["readable"] = len(readable)
    opening = min(readable, key=lambda e: (e["offset"], e["order"])) if readable else None
    row["opening"] = opening
    row["x31"] = opening["quarterBpm"] if opening else 100.0
    row["after"] = difficulty.opening_quarter_bpm(score)
    first_sound = first_non_grace = None
    for element in difficulty.sounding(score.recurse().notes):
        try:
            at = float(element.getOffsetInHierarchy(score))
        except Exception:  # noqa: BLE001
            continue
        if first_sound is None or at < first_sound:
            first_sound = at
        if not element.duration.isGrace and (first_non_grace is None or at < first_non_grace):
            first_non_grace = at
    row["firstSound"] = first_sound
    row["firstNonGraceSound"] = first_non_grace
    if opening is not None and opening["offset"] != float("inf"):
        row["soundsBefore"] = first_sound is not None and first_sound < opening["offset"] - 1e-9
        row["nonGraceSoundsBefore"] = first_non_grace is not None and first_non_grace < opening["offset"] - 1e-9
    if opening is not None and opening["offset"] == float("inf"):
        opening["offset"] = None
    signatures = list(score.recurse().getElementsByClass("TimeSignature"))
    row["beats"] = float(signatures[0].numerator) if signatures else 4.0
    return row


def main() -> int:
    out = Path(sys.argv[1])
    content = Path(sys.argv[2])
    workers = int(sys.argv[3]) if len(sys.argv) > 3 else 6
    catalog = json.loads((content / "catalog.json").read_text(encoding="utf-8"))
    jobs: list[tuple[str, str]] = []
    rows_by_id = {}
    for item in catalog:
        file = item.get("file")
        if not file or not str(file).lower().endswith(SCORE_SUFFIXES):
            continue
        jobs.append((item["id"], str(content / file)))
        rows_by_id[item["id"]] = {
            "type": item.get("type"),
            "level": item.get("level"),
            "levelSource": item.get("levelSource"),
            "tempoBpm": item.get("tempoBpm"),
            "excerptOf": item.get("excerptOf"),
            "file": file,
        }
    with Pool(workers) as pool, out.open("w", encoding="utf-8") as sink:
        for done, row in enumerate(pool.imap_unordered(read_one, jobs, chunksize=4), 1):
            row["catalogue"] = rows_by_id[row["id"]]
            sink.write(json.dumps(row, ensure_ascii=False) + "\n")
            if done % 200 == 0:
                print(f"  {done}/{len(jobs)}", file=sys.stderr, flush=True)
    print(f"scores read: {len(jobs)} -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
