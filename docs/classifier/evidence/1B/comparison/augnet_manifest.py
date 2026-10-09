"""Write the input lists for augnet_run.py (build/augnet_manifest_*.json):
  wir  : the selected When in Rome pieces (score.mxl paths)
  cat  : the named key.change items (cat_kc.py) + every real item with a reference key (t_keys.py) + every 8th generated
         item with a reference key (a fixed stride, not chosen by results), as `tonic-mode` test material.
Usage: python augnet_manifest.py
"""
from cmp_common import *
import cat_keys as K

wir = [{"key": p["dir"], "path": str(WIR / p["dir"] / "score.mxl")} for p in json.load(open(HERE / "wir_pieces.json"))["pieces"]]
json.dump(wir, open(WT / "build/augnet_manifest_wir.json", "w"))
named = [i for i, _ in __import__("cat_kc").ITEMS_NAMED]
ids = list(named)
gen_i = 0
for it in K.ITEMS:
    ref = K.reference(it)
    if ref is None or it["id"] in ids:
        continue
    if K.pipeline(it) == "generated":
        if gen_i % 8 == 0:
            ids.append(it["id"])
        gen_i += 1
    else:
        ids.append(it["id"])
byid = {i["id"]: i for i in K.ITEMS}
cat = [{"key": i, "path": str(CONTENT / byid[i]["file"])} for i in ids]
json.dump(cat, open(WT / "build/augnet_manifest_cat.json", "w"))
print("wir", len(wir), "cat", len(cat), "named", len(named), "generated sampled", sum(1 for i in ids if i.startswith(("exercise.", "etude.")) or K.pipeline(byid[i]) == "generated"))
