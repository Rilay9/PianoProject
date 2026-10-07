"""
The rerun rule (brief §2, FABLE §5): every one of the 374 items, before and after a change.

    py -3.11 rerun_diff.py <before run dir> <after run dir>    # writes rerun-diff.json here

Per item: whether the resolved options changed, whether the bytes changed, the outcome and
every property before and after. An item whose options did not change must be byte-identical;
an item whose options changed is the change's target, and its properties are listed.
"""
from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent


def main() -> None:
    a, b = Path(sys.argv[1]), Path(sys.argv[2])
    ra = {r["id"]: r for r in json.loads((a / "results.json").read_text(encoding="utf-8"))}
    rb = {r["id"]: r for r in json.loads((b / "results.json").read_text(encoding="utf-8"))}
    ca = {r["id"]: r for r in json.loads((a / "checks.json").read_text(encoding="utf-8"))}
    cb = {r["id"]: r for r in json.loads((b / "checks.json").read_text(encoding="utf-8"))}
    out = []
    summary = Counter()
    for iid in ra:
        opt_changed = ra[iid]["options"] != rb[iid]["options"]
        fa, fb = a / "items" / f"{iid}.musicxml", b / "items" / f"{iid}.musicxml"
        bytes_changed = (fa.exists() != fb.exists()) or (fa.exists() and fa.read_bytes() != fb.read_bytes())
        pa, pb = ca[iid]["props"], cb[iid]["props"]
        moved = {k: [pa.get(k), pb.get(k)] for k in set(pa) | set(pb) if pa.get(k) != pb.get(k)}
        kind = ("target" if opt_changed else "unchanged-options")
        summary[(kind, "bytes changed" if bytes_changed else "bytes same", "props moved" if moved else "props same")] += 1
        out.append({"id": iid, "stratum": ca[iid]["stratum"], "optionsChanged": opt_changed, "bytesChanged": bytes_changed,
                    "outcome": [ra[iid]["outcome"], rb[iid]["outcome"]], "propsMoved": moved,
                    "written": [ca[iid].get("written", {}).get("fifths"), cb[iid].get("written", {}).get("fifths"),
                                ca[iid].get("written", {}).get("metre"), cb[iid].get("written", {}).get("metre")]})
    (HERE / "rerun-diff.json").write_text(json.dumps({"summary": {" | ".join(k): v for k, v in summary.items()},
                                                      "items": out}, indent=1), encoding="utf-8")
    for k, v in sorted(summary.items()):
        print(v, k)
    for o in out:
        if o["propsMoved"]:
            print(o["id"], o["propsMoved"])
    bad = [o["id"] for o in out if not o["optionsChanged"] and (o["bytesChanged"] or o["propsMoved"])]
    print("unchanged options but moved:", bad)


if __name__ == "__main__":
    main()
