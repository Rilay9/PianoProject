"""Re-run the items whose first run died of MemoryError (a shared machine ran short of memory; not a property of the
item). Re-runs lines_extract.extract and cur_run.one on them and patches build/lines_items.json and cur_items.json in
place. Prints the ids. Run with the main .venv, after lines_extract.py and cur_run.py. Then re-run cat_synpy.py and
cat_amads.py with these ids as arguments (they merge into their json).
"""
import json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import syn_common as C
import lines_extract as LE
import cur_run as CR

LP = C.BUILD / "lines_items.json"
CP = C.HERE / "cur_items.json"
lines = json.loads(LP.read_text(encoding="utf-8"))
cur = json.loads(CP.read_text(encoding="utf-8"))
ids = sorted({k for k, v in lines.items() if "MemoryError" in str(v.get("error"))} |
             {r["id"] for r in cur if "MemoryError" in str(r.get("error"))})
LE.init(); CR.init()
for i in ids:
    r = LE.safe(i)
    print(i, "lines:", r.get("error", "ok"))
    lines[i] = r
    c = CR.one(i)
    print(i, "cur:", c.get("error", "ok"))
    cur = [c if x["id"] == i else x for x in cur]
LP.write_text(json.dumps(lines), encoding="utf-8")
CP.write_text(json.dumps(cur), encoding="utf-8")
(C.HERE / "rerun_failed_ids.json").write_text(json.dumps(ids), encoding="utf-8")
print(" ".join(ids))
