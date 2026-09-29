"""render_check.py's own judgements (parity, pace, hands, console, implausible durations) on render-report.json, and each item's row."""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
sys.path.insert(0, str(REPO / "tools" / "content"))
import render_check as R  # noqa: E402

report = json.loads((HERE / "render-report.json").read_text(encoding="utf-8"))
items = report.get("items", [])
catalog = json.loads((REPO / "app" / "public" / "content" / "catalog.json").read_text(encoding="utf-8"))
for item in items:
    print(json.dumps({k: item.get(k) for k in ("id", "ok", "cached", "error", "measures", "steps", "modelSteps", "cursorSteps",
                                              "durationSec", "tempoBpm", "hands", "consoleErrors")}, ensure_ascii=False))
print("parity mismatches:", R.parity_failures(items))
print("pace outside 0.5-12 s per bar:", R.pace_flags(items))
print("hands disagree:", R.hands_flags(items, catalog))
print("implausible durations:", R.implausible_durations(items))
print("console:", R.console_flags(items))
