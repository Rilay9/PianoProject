"""How each concept row's count showed before U92, per face (probe-before-<face>.json): not on the line
(fitDetail dropped it), read whole, digits with "to practise" cut or gone, a count cut to another number,
or out of view. A character counts as read when most of it is in view (the probe's reading)."""
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.stdout.reconfigure(encoding="utf-8")

for face in ("stack", "wide"):
    rows = [r for r in json.loads((HERE / f"probe-before-{face}.json").read_text(encoding="utf-8"))["rows"] if r["kind"] == "concept"]
    missing = whole = noun_cut = wrong = hidden = 0
    for r in rows:
        m = re.search(r"(\d+) to practise", r["meta"])
        if not m:
            missing += 1
            continue
        count = m.group(1)
        shown = r["reads"].rstrip("…").rstrip()
        if re.search(r"\d+ to practise", shown):
            whole += 1
            continue
        d = re.search(r"· (\d+)(?: t\w*| to\w*| to \w*)?$", shown)
        if d and d.group(1) == count:
            noun_cut += 1
        elif d and count.startswith(d.group(1)):
            wrong += 1
        else:
            hidden += 1
    print(f"{face}: {len(rows)} concept rows; count not on the line {missing}; read whole {whole}; digits whole, "
          f"'to practise' cut or gone {noun_cut}; cut to another number {wrong}; out of view {hidden}")
