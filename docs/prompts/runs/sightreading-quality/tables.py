"""
The check tables for REPORT.md, from a run's checks.json (check_corpus.py) and results.json.

    py -3.11 tables.py <run dir> <label>      # writes checks-<label>.csv here, prints markdown

One CSV row per manifest item: id, stratum, level, expected, outcome, P1..P11, the detected
demands, written key, metre and bars. The markdown is the per-stratum and per-level n/N, the
recurring failures, the first rung where a base row writes each dimension, and the diagnostics.
"""
from __future__ import annotations

import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROPS = list(range(1, 12))


def main() -> None:
    run, label = Path(sys.argv[1]), sys.argv[2]
    rows = json.loads((run / "checks.json").read_text(encoding="utf-8"))
    taught = json.loads((run.parent / "taught.json").read_text(encoding="utf-8"))
    order = taught["order"]
    with (HERE / f"checks-{label}.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "stratum", "level", "expected", "outcome", *[f"P{p}" for p in PROPS], "fifths", "metre",
                    "bars", "detected"])
        for r in rows:
            wr = r.get("written", {})
            w.writerow([r["id"], r["stratum"], r["level"], r["expected"], r["outcome"],
                        *[r["props"].get(str(p), r["props"].get(p, "")) for p in PROPS],
                        wr.get("fifths", ""), "/".join(map(str, wr.get("metre", []))), wr.get("bars", ""),
                        " ".join(sorted(r.get("detected", {})))])
    # per stratum
    print("### Per stratum (n PASS / N applicable; FAIL, NOT-ESTABLISHED, NA counted apart)\n")
    print("| Stratum | N | outcome W/R | " + " | ".join(f"P{p}" for p in PROPS) + " |")
    print("| --- | --- | --- | " + " | ".join("---" for _ in PROPS) + " |")
    for s in ("O", "BC", "BL", "A", "C"):
        rs = [r for r in rows if r["stratum"] == s]
        cells = []
        for p in PROPS:
            vals = [r["props"].get(str(p), r["props"].get(p)) for r in rs]
            app = [v for v in vals if v in ("PASS", "FAIL", "NOT-ESTABLISHED")]
            fail = sum(1 for v in vals if v == "FAIL")
            ne = sum(1 for v in vals if v == "NOT-ESTABLISHED")
            cells.append(f"{sum(1 for v in vals if v == 'PASS')}/{len(app)}" + (f" ({fail} F)" if fail else "")
                         + (f" ({ne} NE)" if ne else ""))
        wr = sum(1 for r in rs if r["outcome"] == "WRITE")
        print(f"| {s} | {len(rs)} | {wr}/{len(rs) - wr} | " + " | ".join(cells) + " |")
    print("\n### Per level, strata O+BC (the shipped generator as the learner meets it)\n")
    print("| Level | N | " + " | ".join(f"P{p}" for p in PROPS) + " |")
    print("| --- | --- | " + " | ".join("---" for _ in PROPS) + " |")
    for lv in range(1, 8):
        rs = [r for r in rows if r["stratum"] in ("O", "BC") and r["level"] == lv]
        if not rs:
            continue
        cells = []
        for p in PROPS:
            vals = [r["props"].get(str(p), r["props"].get(p)) for r in rs]
            app = [v for v in vals if v in ("PASS", "FAIL", "NOT-ESTABLISHED")]
            cells.append(f"{sum(1 for v in vals if v == 'PASS')}/{len(app)}" if app else "NA")
        print(f"| L{lv} | {len(rs)} | " + " | ".join(cells) + " |")
    # recurring failures
    print("\n### Failures by level and property (all strata)\n")
    fails = defaultdict(list)
    for r in rows:
        for p in PROPS:
            if r["props"].get(str(p), r["props"].get(p)) == "FAIL":
                fails[(r["level"], p)].append(r)
    for (lv, p), rs in sorted(fails.items()):
        kind = "RECURRING" if len(rs) > 1 else "isolated"
        strata = sorted({r["stratum"] for r in rs})
        print(f"- L{lv} P{p}: {len(rs)} items ({kind}; strata {', '.join(strata)})")
        for r in rs[:3]:
            note = r["notes"].get(str(p), r["notes"].get(p))
            print(f"  - `{r['id']}`: {json.dumps(note, ensure_ascii=False)[:260]}")
    # first rung where a base row writes each dimension (stratum O, the rows at their listing rungs)
    print("\n### First rung where a base row writes each dimension (stratum O)\n")
    first = {}
    for r in rows:
        if r["stratum"] != "O":
            continue
        rung = r["id"].split("_at_")[1].rsplit("_d", 1)[0]
        for d in r.get("detected", {}):
            if d not in first or order.index(rung) < order.index(first[d]):
                first[d] = rung
    for d, rung in sorted(first.items(), key=lambda kv: order.index(kv[1])):
        print(f"- {d}: {rung}")
    # diagnostics
    feats = run / "features.json"
    if feats.exists():
        diag = json.loads(feats.read_text(encoding="utf-8"))["diagnostics"]
        print("\n### Diagnostics per level (all written items; no bound)\n")
        print("| Level | items | beams crossing a beat (items with any) | accidental churn (items with any) | "
              "ledger lines per bar (median) | max ledger lines in a bar | parallel 5ths/8ves (items with any) |")
        print("| --- | --- | --- | --- | --- | --- | --- |")
        for lv in range(1, 8):
            ds = [d for d in diag.values() if d["level"] == lv]
            if not ds:
                continue
            led = sorted(d["ledgerLinesPerBar"] for d in ds)
            par = [d["parallels"] for d in ds if d["parallels"] is not None]
            print(f"| L{lv} | {len(ds)} | {sum(1 for d in ds if d['beamsCrossingBeat'])} | "
                  f"{sum(1 for d in ds if d['accidentalChurn'])} | {led[len(led) // 2]} | "
                  f"{max(d['ledgerLinesMaxBar'] for d in ds)} | {sum(1 for x in par if x)}/{len(par)} |")


if __name__ == "__main__":
    main()
