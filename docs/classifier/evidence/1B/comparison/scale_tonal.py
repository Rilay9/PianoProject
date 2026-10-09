"""Runs Tonal's Scale.detect (scale_tonal.cjs) on every pitch-class set that scale_run.py recorded (items and runs).
Reads scale_results.json, writes scale_tonal_in.json and scale_tonal_out.json. Usage: python -X utf8 scale_tonal.py"""
import json, subprocess, sys, time
from pathlib import Path
HERE = Path(__file__).resolve().parent
R = json.load(open(HERE / "scale_results.json"))
qs = []
for k, r in enumerate(R):
    if "S" not in r:
        continue
    T = r["home"][0] if r.get("home") else None
    qs.append({"id": f"{k}", "pcs": r["S"], "tonic": T})
    for j, run in enumerate(r.get("runs", [])):
        qs.append({"id": f"{k}#r{j}", "pcs": run["pcs"], "tonic": run["lk"][0]})
json.dump(qs, open(HERE / "scale_tonal_in.json", "w"))
t = time.time()
p = subprocess.run(["node", str(HERE / "scale_tonal.cjs"), str(HERE / "scale_tonal_in.json"), str(HERE / "scale_tonal_out.json")], capture_output=True, text=True)
print(p.stdout.strip(), p.stderr.strip()[:500], "wall sec incl. node start", round(time.time() - t, 2), "queries", len(qs))
