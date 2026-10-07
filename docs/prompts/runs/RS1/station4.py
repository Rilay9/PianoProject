"""RS1 Station 4 (no placement): the untaught-options probe on a scratch copy of the built content where blues.8's
songOptions also name the edition. Nothing in content/ or app/public/content is changed.

    py -3.11 docs/prompts/runs/RS1/station4.py <scratch dir under build/>
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[4]
BUILT = REPO / "app" / "public" / "content"
ITEM = "song.blues.blues-riff-in-c.pdmx"
scratch = Path(sys.argv[1]).resolve()
RUNG = sys.argv[2] if len(sys.argv) > 2 else "blues.8"  # a second rung only to show the probe reads the injected option
scratch.mkdir(parents=True, exist_ok=True)
for name in ("catalog.json", "curriculum.json"):
    shutil.copyfile(BUILT / name, scratch / name)
for extra in ("demands.json",):
    if (BUILT / extra).exists():
        shutil.copyfile(BUILT / extra, scratch / extra)

curriculum = json.loads((scratch / "curriculum.json").read_text(encoding="utf-8"))


def rungs(node):
    if isinstance(node, dict):
        if node.get("id") == RUNG and "songOptions" in node:
            yield node
        for value in node.values():
            yield from rungs(value)
    elif isinstance(node, list):
        for value in node:
            yield from rungs(value)


found = list(rungs(curriculum))
assert len(found) == 1, f"{len(found)} {RUNG} rungs"
rung = found[0]
print(RUNG, "songOptions before:", rung["songOptions"])
rung["songOptions"] = list(rung["songOptions"]) + [ITEM]
(scratch / "curriculum.json").write_text(json.dumps(curriculum), encoding="utf-8")

item = next(x for x in json.loads((BUILT / "catalog.json").read_text(encoding="utf-8")) if x["id"] == ITEM)
print("the item's measured demands:", item.get("demands"))
print("untrusted (tempo the converter supplied):", item["provenance"]["facts"]["demands"].get("untrusted"))
done = subprocess.run([sys.executable, str(REPO / "tools/content/untaught_options.py"), "--content", str(scratch),
                       "--json", str(scratch / "untaught.json")], capture_output=True, text=True, encoding="utf-8")
print("untaught_options exit", done.returncode)
table = json.loads((scratch / "untaught.json").read_text(encoding="utf-8"))
text = json.dumps(table)
rows = []


def walk(node):
    if isinstance(node, dict):
        if node.get("item") == ITEM or node.get("id") == ITEM or node.get("option") == ITEM:
            rows.append(node)
        for value in node.values():
            walk(value)
    elif isinstance(node, list):
        for value in node:
            walk(value)


walk(table)
print("rows naming the item:", len(rows))
for row in rows:
    print(json.dumps(row, ensure_ascii=False))
