"""The app's detectors on CL15's families, committed and edited: demand ids and counts per item.

usage: python build/cl15/measure_changed.py <out.json>
Writes every item of the families CL15 touched twice, from the committed generator
(build/cl15/base/generate_exercises.py) and the edited one, and measures both through
`demands.measure_opportunities` (the app's own detectors under Vitest), in one bridge run.
"""
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "tools" / "content"))

import demands  # noqa: E402
import generate_exercises as G  # noqa: E402

FAMILIES = {"tremolo_octaves", "pentatonic", "syncopation", "interval_reading", "walking_bass", "power_chord"}


def committed():
    spec = importlib.util.spec_from_file_location("committed_generate_exercises", HERE / "base" / "generate_exercises.py")
    module = importlib.util.module_from_spec(spec)
    module.__file__ = str(ROOT / "tools" / "content" / "generate_exercises.py")
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def main() -> None:
    out = Path(sys.argv[1])
    plans = {"before": committed().default_plan(quick=False), "after": G.default_plan(quick=False)}
    with tempfile.TemporaryDirectory(dir=str(ROOT / "build" / "tmp")) as scratch:
        paths: dict[str, tuple[str, str]] = {}
        for side, plan in plans.items():
            folder = Path(scratch) / side
            for sc, entry in plan:
                if entry["drill"]["generator"]["family"] not in FAMILIES:
                    continue
                path = G.write(sc, str(folder), entry["id"])
                paths[str(Path(path))] = (side, entry["id"])
        rows = demands.measure_opportunities(list(paths))
    result: dict[str, dict] = {}
    for path, row in rows.items():
        side, item_id = paths[str(Path(path))]
        result.setdefault(item_id, {})[side] = {
            "demands": row["demands"],
            "opportunities": {k: v for k, v in row["opportunities"].items() if v},
            "measures": row["measures"], "notes": row["notes"], "steps": row["steps"],
        }
    out.write_text(json.dumps(result, indent=1, sort_keys=True), encoding="utf-8")
    moved = {i: r for i, r in result.items() if r["before"]["demands"] != r["after"]["demands"]}
    print(f"{len(result)} items measured; demand ids moved on {len(moved)}")
    for item_id, r in sorted(moved.items()):
        b, a = set(r["before"]["demands"]), set(r["after"]["demands"])
        print(f"  {item_id}: -{sorted(b - a)} +{sorted(a - b)}")


if __name__ == "__main__":
    main()
