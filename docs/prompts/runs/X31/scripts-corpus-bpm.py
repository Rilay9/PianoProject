"""
X31's corpus probe (not a test): for every score the built catalogue names, what the content build's duration
feature reads as the opening tempo, before and after X31, through music21 on the built file.

  before  the committed expression, replicated here: the first `MetronomeMark` `recurse()` meets, its raw
          `number` (beat unit ignored), else 100.
  after   `difficulty.opening_quarter_bpm` (this tree): the readable mark at the earliest offset, in quarter
          notes a minute through `getQuarterBPM()`, else 100.

Also, per score: the opening mark's fields, the first time signature's numerator (the feature's `beats`), and the
catalogue's row (type, level, levelSource, tempoBpm, excerptOf). One JSON line per score to the file named by the
first argument; the content directory is the second. Nothing is asserted.

    python docs/prompts/runs/X31/scripts-corpus-bpm.py <out.jsonl> <content dir> [workers]
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
    row["before"] = float(marks[0].number) if marks and marks[0].number else 100.0
    row["after"] = difficulty.opening_quarter_bpm(score)
    readable = []
    for order, mark in enumerate(marks):
        bpm = difficulty._quarter_bpm(mark)  # noqa: SLF001 - the probe reads the helper the feature reads
        try:
            offset = float(mark.getOffsetInHierarchy(score))
        except Exception:  # noqa: BLE001
            offset = None
        entry = {
            "order": order,
            "offset": offset,
            "number": mark.number,
            "numberSounding": mark.numberSounding,
            "numberImplicit": mark.numberImplicit,
            "referent": [mark.referent.type, mark.referent.dots],
            "quarterBpm": bpm,
        }
        if order == 0:
            row["first"] = entry
        if bpm is not None:
            readable.append(entry)
    row["readable"] = len(readable)
    if readable:
        opening = min(readable, key=lambda e: (e["offset"] if e["offset"] is not None else float("inf"), e["order"]))
        row["opening"] = opening
        row["openingIsFirstFound"] = opening["order"] == 0
    row["implicitMarks"] = sum(1 for m in marks if m.numberImplicit and m.numberSounding is None)
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
