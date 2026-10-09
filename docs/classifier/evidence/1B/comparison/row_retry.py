"""Re-runs the row_drive.py tasks that died of machine memory pressure (MemoryError, 'paging file is too small', no output), three at a
time, and merges them into row_music21_results.json (the failed record is kept under 'first_attempt'). Usage: python -X utf8 row_retry.py"""
import json, subprocess, sys, time
from pathlib import Path
HERE = Path(__file__).resolve().parent
MAIN = Path(r"C:/Users/yalir/repos/Piano Stuff/PianoProject")
CONTENT = MAIN / "app/public/content"
CAT = {i["id"]: i for i in json.load(open(CONTENT / "catalog.json", encoding="utf-8"))}
cases = {c["id"]: c for c in json.load(open(HERE / "row_cases.json"))}
R = json.load(open(HERE / "row_music21_results.json"))
bad = [k for k, v in R.items() if "error" in v]
print("retrying", len(bad), flush=True)
tmp = HERE / "row_tasks_tmp"
for k in bad:
    kind, iid, mode = k.split("|")
    if kind == "cat":
        tk = {"key": k, "kind": "cat", "item_id": iid, "path": str(CONTENT / CAT[iid]["file"]), "oracle": None, "choices": ["current", "self", "first12"] if mode == "fast" else ["hist"]}
    else:
        c = cases[iid]
        tk = {"key": k, "kind": "built", "item_id": iid, "path": c["path"], "oracle": c["row"], "choices": ["current", "self", "first12", "hist"] + (["oracle"] if c["row"] else [])}
    tf, of = tmp / "retry_t.json", tmp / "retry_o.json"
    json.dump(tk, open(tf, "w"))
    t = time.time()
    p = subprocess.run([sys.executable, "-X", "utf8", str(HERE / "row_music21.py"), "--task", str(tf), str(of)], capture_output=True, text=True, timeout=1800)
    try:
        new = json.load(open(of))
    except Exception as ex:  # noqa
        new = {"key": k, "error": "no output: " + repr(ex)[:100]}
    new["wall_sec"] = time.time() - t
    new["first_attempt"] = R[k].get("error")
    R[k] = new
    print(k, "error" in new, round(new["wall_sec"]), flush=True)
    if of.exists():
        of.unlink()
json.dump(R, open(HERE / "row_music21_results.json", "w"))
print("still failing:", [k for k, v in R.items() if "error" in v])
