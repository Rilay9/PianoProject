"""Compare this worktree's offline-built content with the main checkout's full build:
the curriculum's sections (concept names, stages) and the catalogue's item ids."""
import json
from collections import Counter
from pathlib import Path

MAIN = Path(r"C:/Users/yalir/repos/Piano Stuff/PianoProject/app/public/content")
WT = Path(__file__).resolve().parents[4] / "app" / "public" / "content"


def load(p: Path, name: str):
    return json.loads((p / name).read_text(encoding="utf-8"))


a, b = load(WT, "curriculum.json"), load(MAIN, "curriculum.json")
print("worktree content:", WT)
print("top-level keys equal:", sorted(a.keys()) == sorted(b.keys()), sorted(a.keys()))
for key in a:
    same = json.dumps(a[key], sort_keys=True) == json.dumps(b.get(key), sort_keys=True)
    print(f"  curriculum.{key}: {'same' if same else 'differs'}")
ca, cb = load(WT, "catalog.json"), load(MAIN, "catalog.json")
ia = ca["items"] if isinstance(ca, dict) else ca
ib = cb["items"] if isinstance(cb, dict) else cb
ida = {i["id"] for i in ia}
idb = {i["id"] for i in ib}
print("catalog items: worktree", len(ia), "main", len(ib))
print("  only in main:", len(idb - ida), " only in worktree:", len(ida - idb))
extra = [i for i in ib if i["id"] not in ida]
print("  the types of the items only in main:", dict(Counter(i.get("type") for i in extra)))
print("  of them exercises or drills (the only items Skills lists):", sum(1 for i in extra if i.get("type") in ("exercise", "drill")))


def lessons(c):
    return {l["id"]: l for s in c["stages"] for u in s["units"] for l in u.get("lessons", [])}


la, lb = lessons(a), lessons(b)
fields = sorted(
    {
        f
        for k in la
        for f in set(la[k]) | set(lb.get(k, {}))
        if json.dumps(la[k].get(f), sort_keys=True) != json.dumps(lb.get(k, {}).get(f), sort_keys=True)
    }
)
print("lessons:", len(la), "worktree,", len(lb), "main; the lesson fields that differ:", fields)
