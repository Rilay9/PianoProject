"""rhythm.cadenza: how many candidate cue runs each item carries (the agent's load), from out/f4_items.json."""
import json
from pathlib import Path
HERE = Path(__file__).resolve().parent
it = json.load(open(HERE / "out/f4_items.json", encoding="utf8"))
c = [(v["cue_runs_ge_beat"], i, v["pipe"], v["cue_before"]) for i, v in it.items() if v["cue_runs_ge_beat"]]
print("items with cue runs >= a beat:", len(c), "| runs in all:", sum(x[0] for x in c))
for n, i, p, b in sorted(c, reverse=True):
    print(f"  {n:3} runs  {p:5} page-before: {b:10} {i}")
print("items with a grace run of 6+:", sum(1 for v in it.values() if v["grace6"]), "| items with a cadenza word:", sum(1 for v in it.values() if v["words"]))
for i, v in it.items():
    if v["words"]:
        print("   words:", i, v["words"])
