"""rhythm.tuplets-other: does fix D (a closed <tuplet> bracket enclosing 2+ notes, ratio not 1) lose any 3:2 group, which is out of this characteristic's scope
but would share the source if it were adopted? Reads out/f3_groups.json."""
import json
from pathlib import Path
HERE = Path(__file__).resolve().parent
rows = json.load(open(HERE / "out/f3_groups.json", encoding="utf8"))
t = [r for r in rows if r["ratio"] == "3:2"]
print("3:2 groups:", len(t), "| with a closed bracket:", sum(1 for r in t if r["brackets"]), "| with a bracket of 2+ notes:", sum(1 for r in t if r["multi_brackets"]))
for r in t:
    if not r["multi_brackets"]:
        print("  3:2 group without a 2+ note bracket:", r["item"], "notes", r["notes"], "closed brackets", r["brackets"])
print("all groups:", len(rows), "| items:", len({r['item'] for r in rows}), "| notes:", sum(r["notes"] for r in rows))
