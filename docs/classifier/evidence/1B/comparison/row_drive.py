"""pitch.tone-row: runs row_music21.py tasks in parallel subprocesses (3 at once, each killed after TIMEOUT seconds) over
(1) the 68 catalogue items with a 12-distinct-pitch-class run or a candidate-window trigger (row_scan.json), and (2) the built and
real cases (row_cases.json). Writes row_music21_results.json. Usage: python -X utf8 row_drive.py [hist_timeout_seconds]"""
import json, subprocess, sys, time
from pathlib import Path
HERE = Path(__file__).resolve().parent
TIMEOUT_FAST = 900
TIMEOUT_HIST = int(sys.argv[1]) if len(sys.argv) > 1 else 1500
MAIN = Path(r"C:/Users/yalir/repos/Piano Stuff/PianoProject")
CONTENT = MAIN / "app/public/content"
CAT = {i["id"]: i for i in json.load(open(CONTENT / "catalog.json", encoding="utf-8"))}
scan = json.load(open(HERE / "row_scan.json"))
X = [r for r in scan if "cur" in r and (r["run12"] or r["cur"]["to_agent"])]
cases = json.load(open(HERE / "row_cases.json"))
tasks = []
for r in X:
    it = CAT[r["id"]]
    tasks.append({"key": f"cat|{r['id']}|fast", "kind": "cat", "item_id": r["id"], "path": str(CONTENT / it["file"]), "oracle": None, "choices": ["current", "self", "first12"], "timeout": TIMEOUT_FAST})
for c in cases:
    tasks.append({"key": f"built|{c['id']}|all", "kind": "built", "item_id": c["id"], "path": c["path"], "oracle": c["row"],
                  "choices": ["current", "self", "first12", "hist"] + (["oracle"] if c["row"] else []), "timeout": TIMEOUT_HIST})
for r in X:
    it = CAT[r["id"]]
    tasks.append({"key": f"cat|{r['id']}|hist", "kind": "cat", "item_id": r["id"], "path": str(CONTENT / it["file"]), "oracle": None, "choices": ["hist"], "timeout": TIMEOUT_HIST})
tmp = HERE / "row_tasks_tmp"
tmp.mkdir(exist_ok=True)
running, results, queue = [], {}, list(tasks)
t0 = time.time()
n_done = 0
while queue or running:
    while queue and len(running) < 3:
        tk = queue.pop(0)
        i = len(results) + len(running)
        tf, of = tmp / f"t{abs(hash(tk['key'])) % 10**9}.json", tmp / f"o{abs(hash(tk['key'])) % 10**9}.json"
        json.dump(tk, open(tf, "w"))
        if of.exists():
            of.unlink()
        p = subprocess.Popen([sys.executable, "-X", "utf8", str(HERE / "row_music21.py"), "--task", str(tf), str(of)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        running.append((tk, p, of, time.time()))
    time.sleep(1)
    for entry in list(running):
        tk, p, of, ts = entry
        if p.poll() is not None:
            running.remove(entry)
            try:
                results[tk["key"]] = json.load(open(of))
            except Exception as ex:  # noqa
                results[tk["key"]] = {"key": tk["key"], "error": "no output: " + repr(ex)[:100]}
            results[tk["key"]]["wall_sec"] = time.time() - ts
            n_done += 1
        elif time.time() - ts > tk["timeout"]:
            p.kill()
            running.remove(entry)
            results[tk["key"]] = {"key": tk["key"], "timeout": tk["timeout"], "wall_sec": time.time() - ts}
            n_done += 1
    if n_done % 20 == 0 and n_done:
        print(n_done, "of", len(tasks), round(time.time() - t0), "s", flush=True)
json.dump(results, open(HERE / "row_music21_results.json", "w"))
print("done", len(results), "tasks", round(time.time() - t0), "s; errors", sum(1 for r in results.values() if "error" in r), "timeouts", sum(1 for r in results.values() if "timeout" in r))
