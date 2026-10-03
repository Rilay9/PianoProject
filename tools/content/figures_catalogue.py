#!/usr/bin/env python3
"""
Runs every accompaniment-figure matcher (`figures.py`) over the whole built catalogue
(CT1 part one step 4), and sets what the notes hold against what is claimed.

Two kinds of claim are checked:
- **Rung claims:** a rung names a figure concept, and the figure must be in one of the
  rung's playable options.
- **Item tags (G12):** an item's own `concepts` list names a figure concept, and the
  figure must be in that item's notes.

Writes `docs/prompts/runs/CT1/figures-catalogue.json` (per item, the bars where each figure
was found) and prints the counts. Reads the built catalogue the app ships
(`app/public/content/catalog.json`) and the score files beside it.

    python3 tools/content/figures_catalogue.py [--catalog PATH] [--jobs N]
"""
from __future__ import annotations

import argparse
import glob
import json
import os
import sys
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
sys.path.insert(0, str(HERE))

import figures  # noqa: E402

OUT = REPO / "docs" / "prompts" / "runs" / "CT1" / "figures-catalogue.json"


def score_path(content_root: Path, rel: str) -> Path | None:
    for base in (content_root, REPO / "content"):
        p = base / rel
        if p.exists():
            return p
    return None


def measure(job: tuple[str, str]) -> tuple[str, dict | str]:
    item_id, path = job
    try:
        score = figures.read(Path(path))
        if score is None:
            return item_id, "unreadable"
        return item_id, figures.match(score)
    except Exception as exc:  # a file music21 cannot read is reported, never skipped silently
        return item_id, f"error: {type(exc).__name__}: {exc}"[:300]


def rung_options() -> dict[str, dict]:
    rungs: dict[str, dict] = {}
    for f in sorted(glob.glob(str(REPO / "content" / "curriculum" / "stage-*.json"))):
        for stage in json.loads(Path(f).read_text(encoding="utf-8"))["stages"]:
            for unit in stage["units"]:
                for lesson in unit["lessons"]:
                    rungs[lesson["id"]] = {
                        "concepts": lesson.get("concepts", []),
                        "options": lesson.get("exerciseOptions", []) + lesson.get("songOptions", []),
                    }
    return rungs


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--catalog", default=str(REPO / "app" / "public" / "content" / "catalog.json"))
    ap.add_argument("--jobs", type=int, default=max(1, (os.cpu_count() or 2) - 1))
    args = ap.parse_args(argv)
    catalog_path = Path(args.catalog)
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    items = catalog["items"] if isinstance(catalog, dict) else catalog
    content_root = catalog_path.parent

    jobs, no_file = [], []
    for item in items:
        rel = item.get("file")
        if not rel or not rel.endswith((".mxl", ".musicxml", ".xml")):
            no_file.append(item["id"])
            continue
        p = score_path(content_root, rel)
        if p is None:
            no_file.append(item["id"])
        else:
            jobs.append((item["id"], str(p)))

    with ProcessPoolExecutor(max_workers=args.jobs) as pool:
        results = dict(pool.map(measure, jobs, chunksize=8))

    by_id = {i["id"]: i for i in items}
    failed = {k: v for k, v in results.items() if isinstance(v, str)}
    counts = {name: sum(1 for v in results.values() if isinstance(v, dict) and v[name]["present"]) for name in figures.FIGURES}

    # Item tags (G12): every tag answered by a figure, checked in the item's own notes.
    tag_rows = []
    for item_id, result in sorted(results.items()):
        for tag in by_id[item_id].get("concepts") or []:
            if tag in figures.CONCEPT_FIGURES:
                held = None if isinstance(result, str) else figures.concept_present(result, tag)
                tag_rows.append({"item": item_id, "tag": tag, "held": held})

    # Rung claims: a figure concept a rung names must be in at least one of its options.
    rung_rows = []
    for rung, row in rung_options().items():
        for concept in row["concepts"]:
            if concept not in figures.CONCEPT_FIGURES:
                continue
            holding = [o for o in row["options"] if isinstance(results.get(o), dict) and figures.concept_present(results[o], concept)]
            measured = [o for o in row["options"] if isinstance(results.get(o), dict)]
            rung_rows.append({"rung": rung, "concept": concept, "options": len(row["options"]), "measured": len(measured),
                              "holding": {o: results[o][figures.CONCEPT_FIGURES[concept][0]]["bars"] for o in holding}})

    report = {
        "catalog": str(catalog_path.relative_to(REPO)) if catalog_path.is_relative_to(REPO) else str(catalog_path),
        "items": len(items),
        "measured": len(results) - len(failed),
        "noScoreFile": len(no_file),
        "failed": failed,
        "figureCounts": counts,
        "rungClaims": rung_rows,
        "itemTags": tag_rows,
        "perItem": {k: {n: v[n]["bars"] for n in v if v[n]["present"]} for k, v in sorted(results.items()) if isinstance(v, dict) and any(v[n]["present"] for n in v)},
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, indent=1) + "\n", encoding="utf-8")
    print(f"items {len(items)}; measured {report['measured']}; no score file {len(no_file)}; failed {len(failed)}")
    print("items holding each figure:", json.dumps(counts))
    gaps = [r for r in rung_rows if not r["holding"]]
    print(f"rung figure claims {len(rung_rows)}; with no option holding the figure {len(gaps)}")
    false_tags = [r for r in tag_rows if r["held"] is False]
    print(f"item figure tags {len(tag_rows)}; not held in the notes {len(false_tags)}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
