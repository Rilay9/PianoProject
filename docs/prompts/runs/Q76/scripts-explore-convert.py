"""
Exploration: every fetched single-file Joplin .ly through python-ly and convert.py's normalisation
(no cache), then the app's detectors through the build's bridge, and the level model's estimate.

Prints per rag: python-ly's staves/bars/notes, the written file's bars and notes, the left-hand
pattern's every-bar verdict (and the printed bars where it fails), the ties located, the level
estimate. Numbers here are this machine's reading of these files, for the entry's relations only.
"""
import json
import sys
import traceback
from pathlib import Path

HERE = Path(__file__).resolve()
REPO = HERE.parents[4]
sys.path.insert(0, str(REPO / "tools" / "content"))

import convert  # noqa: E402
import demands as D  # noqa: E402
import difficulty  # noqa: E402
from music21 import converter  # noqa: E402

src_root = Path(sys.argv[1])
out_root = Path(sys.argv[2])
out_root.mkdir(parents=True, exist_ok=True)
table = json.loads((REPO / "content" / "sources" / "opportunity-density.json").read_text(encoding="utf-8"))

written = {}
for ly in sorted(src_root.rglob("*.ly")):
    if ly.parent.name.endswith("-lys"):
        continue  # the multi-file editions (Bethena, Solace) need their includes resolved
    dest = out_root / (ly.stem + ".mxl")
    try:
        result = convert.convert_file(ly, dest)
    except Exception as exc:  # noqa: BLE001
        print(f"{ly.name}: CONVERSION FAILED {type(exc).__name__}: {str(exc)[:300]}")
        continue
    written[str(dest)] = (ly, result)
    print(f"{ly.name}: written {result.measures} bars, {result.note_events} note events, {result.staves} staves, tempo {result.tempo_bpm} (added {result.added_tempo}); warnings {result.warnings[:3]}")

answered = D.measure_each([Path(p) for p in written])
for path, (ly, result) in written.items():
    row = answered[path]
    if "error" in row:
        print(f"{ly.name}: MEASURE ERROR {row['error']}")
        continue
    opp = row.get("opportunities") or {}
    every = (row.get("everyBar") or {}).get("leftHandPattern")
    printed = row.get("printedBars")
    failing = sorted(set(range(1, (printed or 0) + 1)) - set(every or [])) if every is not None else None
    score = converter.parse(path)
    est = difficulty.estimate(difficulty.features(score))
    ties = int(opp.get("rhythm.ties", 0))
    rule = table["demands"]["rhythm.ties"]
    print(json.dumps({
        "rag": ly.name,
        "bars": row["measures"], "printedBars": printed,
        "lhp": int(opp.get("texture.left-hand-pattern", 0)),
        "lhpFailingPrintedBars": failing[:40] if failing is not None else None,
        "lhpFailingCount": len(failing) if failing is not None else None,
        "ties": ties, "tiesEstablished": ties >= rule["min"] and ties / max(int(row["measures"]), 1) >= rule["perBar"],
        "level": est.level, "drivers": est.drivers,
    }))
