"""
The shipping plan, built once and measured once, for the D0 contract tests.

Not a test module (discovery only picks `test_*.py`): the contract, measured-demand,
physical-gate, role and naming tests all read the same plan, so it is built here once per
process and cached. `measured()` writes every item to a scratch folder and sends the folder
through `demands.measure_opportunities` — the app's own detectors under Vitest, the one
definition of every demand — in one run. That is the costly part of the suite (a Vitest run
over every generated file, and the plan written out first), and it is paid once.

Needs Node and `app/node_modules`, which CI installs before these tests run, as
`test_demands_tool.py` does.
"""
from __future__ import annotations

import sys
import tempfile
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import generate_exercises as G  # noqa: E402

_PLAN: list | None = None
_MEASURED: dict | None = None


def plan() -> list:
    """`[(score, entry), ...]`: `default_plan(quick=False)`, what the build ships."""
    global _PLAN
    if _PLAN is None:
        _PLAN = G.default_plan(quick=False)
    return _PLAN


def by_family() -> dict[str, list]:
    """The plan grouped by the family each entry says made it (`drill.generator.family`)."""
    out: dict[str, list] = defaultdict(list)
    for sc, entry in plan():
        out[entry["drill"]["generator"]["family"]].append((sc, entry))
    return dict(out)


def write_all(folder: Path, items: list) -> dict[str, Path]:
    """Writes each score through the generator's own writer; `{item id: path}`."""
    return {entry["id"]: Path(G.write(sc, str(folder), entry["id"])) for sc, entry in items}


def measured() -> dict[str, dict]:
    """`{item id: demands.measure_opportunities row}` for every item in the plan."""
    global _MEASURED
    if _MEASURED is None:
        import demands  # noqa: PLC0415 - costly, and only these tests need it

        # Looked up before the plan is written out, so a bridge without counts fails at once
        # rather than after writing every file.
        measure = demands.measure_opportunities
        with tempfile.TemporaryDirectory() as scratch:
            paths = write_all(Path(scratch), plan())
            rows = measure(list(paths.values()))
            by_path = {str(path): item_id for item_id, path in paths.items()}
            _MEASURED = {by_path[path]: row for path, row in rows.items()}
    return _MEASURED
