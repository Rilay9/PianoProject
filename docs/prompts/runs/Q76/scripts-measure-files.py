"""
Exploration: the app's detectors (through the build's bridge) and the level model on given .mxl files:
bars, the left-hand pattern's every-bar verdict and the printed bars where it fails, ties, level estimate.
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve()
REPO = HERE.parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))

import demands as D  # noqa: E402
import difficulty  # noqa: E402
from music21 import converter  # noqa: E402

table = json.loads((REPO / "content" / "sources" / "opportunity-density.json").read_text(encoding="utf-8"))
paths = [Path(p) for p in sys.argv[1:]]
answered = D.measure_each(paths)
for path in paths:
    row = answered[str(path)]
    if "error" in row:
        print(path.name, "ERROR", row["error"])
        continue
    opp = row.get("opportunities") or {}
    every = row.get("everyBar") or {}
    key = next((k for k in every if "left" in k.lower()), None)
    printed = row.get("printedBars") or 0
    failing = sorted(set(range(1, printed + 1)) - set(every.get(key) or [])) if key else None
    est = difficulty.estimate(difficulty.features(converter.parse(str(path))))
    ties = int(opp.get("rhythm.ties", 0))
    rule = table["demands"]["rhythm.ties"]
    print(json.dumps({
        "file": path.name, "bars": row["measures"], "printedBars": printed, "everyBarKeys": list(every),
        "lhp": int(opp.get("texture.left-hand-pattern", 0)),
        "lhpFailing": (failing[:30] if failing else failing), "lhpFailingCount": len(failing) if failing is not None else None,
        "ties": ties, "tiesEstablished": ties >= rule["min"] and ties / max(int(row["measures"]), 1) >= rule["perBar"],
        "level": est.level,
    }))
