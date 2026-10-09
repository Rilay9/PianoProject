"""Item sets for the hand comparison. Writes hand_manifest.json.
 truth     = hand-items with printed/recipe fingering on >= 80% of struck notes (hand_census.py rule)
 named_*   = items named by validation rows 3 and 4 of area 1B, and the families the page reads
"""
import json, collections
from hand_xml import *

d = json.load(open(HERE / "hand_census.json"))
cat = {i["id"]: i for i in json.load(open(CONTENT / "catalog.json", encoding="utf-8"))}


def fam(i):
    return (cat[i].get("provenance", {}).get("generator") or {}).get("family")


out = {"truth": [], "named": []}
for k, v in d.items():
    if "error" in v:
        continue
    hs = [h for h in "RL" if v[h]["eligible"]]
    if hs:
        out["truth"].append({"id": k, "file": cat[k]["file"], "hands": cat[k].get("hands"), "eligible": hs,
                             "src": v["src"], "family": v["family"]})
NAMED_FAMILIES = {"five_finger", "interval_reading", "riff", "position_shift", "cadence", "tremolo", "hanon", "scale"}
named_ids = ["song.classical.chopin-etude-op25-6.nifc", "song.classical.chopin-etude-op25-1.nifc"]
for k, i in cat.items():
    if not i.get("file"):
        continue
    f = fam(k)
    if f in NAMED_FAMILIES - {"scale"} or k in named_ids:
        out["named"].append({"id": k, "file": i["file"], "hands": i.get("hands"), "family": f, "src": i.get("provenance", {}).get("source")})
json.dump(out, open(HERE / "hand_manifest.json", "w"), indent=1)
print("truth", len(out["truth"]), collections.Counter((x["src"], x["family"]) for x in out["truth"]))
print("named", len(out["named"]), collections.Counter(x["family"] for x in out["named"]))
